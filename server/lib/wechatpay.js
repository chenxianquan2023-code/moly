/**
 * 微信支付 · 官方 V3 Native（网页扫码付）客户端。
 * 资金由腾讯官方直接结算到商户绑定银行卡，无中间商（区别于 XorPay/虎皮椒聚合）。
 * 文档: https://pay.weixin.qq.com/docs/merchant/apis/native-payment/direct-jsapi/native-prepay.html
 *
 * 仅微信通道（wechat）。env 全部从环境变量读，证件/密钥绝不入码：
 *   WXPAY_APPID        绑定商户号的 appid（公众号/服务号/小程序，Native 必需）
 *   WXPAY_MCHID        商户号
 *   WXPAY_API_V3_KEY   APIv3 密钥（自己在商户平台设的 32 位，用于回调解密）
 *   WXPAY_CERT_SERIAL  商户 API 证书序列号
 *   WXPAY_PRIVATE_KEY  商户 API 证书私钥 apiclient_key.pem 的内容（PEM，含 BEGIN/END，换行用 \n）
 *
 * 鉴权: 请求头 Authorization: WECHATPAY2-SHA256-RSA2048，签名 = RSA-SHA256(method\nurl\nts\nnonce\nbody\n)。
 * 回调: body.resource 是 AES-256-GCM 密文，用 APIv3 密钥解密得明文订单结果（只有微信持有该密钥→解密成功即可信）。
 */
import crypto from 'node:crypto';
import QRCode from 'qrcode';

const API_HOST = 'https://api.mch.weixin.qq.com';
const APPID = process.env.WXPAY_APPID || '';
const MCHID = process.env.WXPAY_MCHID || '';
const API_V3_KEY = process.env.WXPAY_API_V3_KEY || '';
const CERT_SERIAL = process.env.WXPAY_CERT_SERIAL || '';
// 私钥支持 \n 转义（Railway 单行环境变量常见）
const PRIVATE_KEY = (process.env.WXPAY_PRIVATE_KEY || '').replace(/\\n/g, '\n');

export const isConfigured = () => !!(APPID && MCHID && API_V3_KEY && CERT_SERIAL && PRIVATE_KEY);
/** 官方微信支付只做 wechat 通道；alipay 仍走其它供应商 */
export const isPayConfigured = (channel) => channel === 'wechat' && isConfigured();

const rand = (n = 32) => crypto.randomBytes(n).toString('hex').slice(0, n);

/** V3 请求签名 → Authorization 头 */
function authHeader(method, urlPath, body) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = rand(32);
  const message = `${method}\n${urlPath}\n${ts}\n${nonce}\n${body}\n`;
  const signature = crypto.createSign('RSA-SHA256').update(message).sign(PRIVATE_KEY, 'base64');
  return `WECHATPAY2-SHA256-RSA2048 mchid="${MCHID}",nonce_str="${nonce}",signature="${signature}",timestamp="${ts}",serial_no="${CERT_SERIAL}"`;
}

/**
 * 创建 Native 支付单 → { payUrl:'', qrUrl(dataURL二维码图) }
 * @param {{tradeOrderId:string, amountYuan:number, title:string, channel:string, notifyUrl:string}}
 */
export async function createPayment({ tradeOrderId, amountYuan, title, channel, notifyUrl }) {
  if (channel !== 'wechat') throw new Error('WXPAY_WECHAT_ONLY');
  if (!isConfigured()) throw new Error('PAY_NOT_CONFIGURED');
  const urlPath = '/v3/pay/transactions/native';
  const payload = {
    appid: APPID,
    mchid: MCHID,
    description: String(title || '积分充值').slice(0, 120),
    out_trade_no: tradeOrderId,
    notify_url: notifyUrl,
    amount: { total: Math.round(Number(amountYuan) * 100), currency: 'CNY' }, // 单位：分
  };
  const body = JSON.stringify(payload);
  const res = await fetch(`${API_HOST}${urlPath}`, {
    method: 'POST',
    headers: {
      Authorization: authHeader('POST', urlPath, body),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'moly-pay',
    },
    body,
    signal: AbortSignal.timeout(20000),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.code_url) {
    throw new Error('微信支付下单失败: ' + String(j.message || j.code || JSON.stringify(j)).slice(0, 160));
  }
  const qrUrl = await QRCode.toDataURL(String(j.code_url), { width: 360, margin: 1 });
  return { payUrl: '', qrUrl }; // code_url 是 weixin:// 串，仅供扫码（PC 端无 H5 跳转）
}

/**
 * 解密回调密文（AES-256-GCM）。只有微信持有 APIv3 密钥，解密成功即证明回调真实。
 * @returns {object|null} 解密后的订单结果对象（含 out_trade_no/transaction_id/trade_state/amount）
 */
export function decryptNotify(body) {
  try {
    const r = body?.resource;
    if (!r?.ciphertext || !r?.nonce) return null;
    if (API_V3_KEY.length !== 32) return null;
    const buf = Buffer.from(r.ciphertext, 'base64');
    const authTag = buf.subarray(buf.length - 16);
    const data = buf.subarray(0, buf.length - 16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', API_V3_KEY, r.nonce);
    decipher.setAuthTag(authTag);
    if (r.associated_data) decipher.setAAD(Buffer.from(r.associated_data));
    const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    return JSON.parse(plain);
  } catch (e) {
    return null;
  }
}
