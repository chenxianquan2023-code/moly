/**
 * 虎皮椒(XunHuPay) 聚合支付客户端——个人开发者可用，微信/支付宝双通道。
 * 文档: https://www.xunhupay.com/doc/api/pay.html
 * - 微信与支付宝各一对 appid/secret(虎皮椒后台分开申请)，从 env 读，绝不入码。
 * - 签名: 参数按 ASCII 升序拼 key=value&...，结尾直接拼 appsecret，MD5 小写。
 *   (回调验签同一规则；hash 字段本身不参与签名。)
 * - 未配置时 isConfigured=false，上层返回"支付通道配置中"，不影响其他功能。
 */
import crypto from 'node:crypto';

const API_URL = process.env.HUPI_API_URL || 'https://api.xunhupay.com/payment/do.html';

function channelKeys(channel) {
  if (channel === 'alipay') {
    return { appid: process.env.HUPI_ALIPAY_APPID || '', secret: process.env.HUPI_ALIPAY_SECRET || '' };
  }
  return { appid: process.env.HUPI_WECHAT_APPID || '', secret: process.env.HUPI_WECHAT_SECRET || '' };
}

export function isPayConfigured(channel) {
  const { appid, secret } = channelKeys(channel);
  return !!(appid && secret);
}

/** 按虎皮椒规则计算签名：ASCII 升序 key=value& 拼接(剔除 hash/空值) + appsecret → md5 */
export function hupiSign(params, secret) {
  const str = Object.keys(params)
    .filter((k) => k !== 'hash' && params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('md5').update(str + secret, 'utf8').digest('hex');
}

/** 创建支付单 → { payUrl(H5跳转), qrUrl(二维码图) } */
export async function createPayment({ tradeOrderId, amountYuan, title, channel, notifyUrl, returnUrl }) {
  const { appid, secret } = channelKeys(channel);
  if (!appid || !secret) throw new Error('PAY_NOT_CONFIGURED');
  const params = {
    version: '1.1',
    appid,
    trade_order_id: tradeOrderId,
    total_fee: Number(amountYuan).toFixed(2),
    title: String(title || '积分充值').slice(0, 60),
    time: Math.floor(Date.now() / 1000),
    notify_url: notifyUrl,
    nonce_str: crypto.randomBytes(8).toString('hex'),
    ...(returnUrl ? { return_url: returnUrl } : {}),
  };
  params.hash = hupiSign(params, secret);
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString(),
    signal: AbortSignal.timeout(20000),
  });
  const j = await res.json().catch(() => ({}));
  if (Number(j.errcode) !== 0 || !(j.url || j.url_qrcode)) {
    throw new Error('支付下单失败: ' + String(j.errmsg || JSON.stringify(j)).slice(0, 120));
  }
  return { payUrl: j.url || '', qrUrl: j.url_qrcode || '' };
}

/** 回调验签：params 为虎皮椒 POST 的表单字段 */
export function verifyNotify(params, channel) {
  const { secret } = channelKeys(channel);
  if (!secret || !params || !params.hash) return false;
  return hupiSign(params, secret) === String(params.hash);
}
