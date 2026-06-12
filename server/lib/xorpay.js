/**
 * XorPay 聚合支付客户端——个人开发者可用，微信(native)/支付宝(当面付)双通道。
 * 文档: https://xorpay.com/doc/
 * - 一对 aid/secret 通吃双通道(支付宝需在 XorPay 后台开通)，从 env 读，绝不入码。
 * - 下单: POST https://xorpay.com/api/pay/{aid} 表单；
 *   sign = md5(name + pay_type + price + order_id + notify_url + secret) 小写、无分隔符。
 * - 返回 info.qr 是"二维码内容串"(微信 weixin:// / 支付宝 https://qr.alipay.com/...)——
 *   服务端用 qrcode 包渲染成 dataURL 图，前端直接 <img>；支付宝串本身可作手机端跳转链接。
 * - 回调: POST 表单 {aoid, order_id, pay_price, pay_time, more, detail, sign}；
 *   验签 = md5(aoid + order_id + pay_price + pay_time + secret)；回 HTTP 200(如 'success') 停止重试。
 */
import crypto from 'node:crypto';
import QRCode from 'qrcode';

const API_BASE = process.env.XORPAY_API_URL || 'https://xorpay.com/api/pay';
const AID = process.env.XORPAY_AID || '';
const SECRET = process.env.XORPAY_SECRET || '';

const md5 = (s) => crypto.createHash('md5').update(s, 'utf8').digest('hex').toLowerCase();

export const isConfigured = () => !!(AID && SECRET);
export const isPayConfigured = () => isConfigured(); // 双通道同一对密钥(支付宝是否开通由 XorPay 后台决定)

/** 创建支付单 → { payUrl(手机可点跳转,微信native无), qrUrl(dataURL二维码图) } */
export async function createPayment({ tradeOrderId, amountYuan, title, channel, notifyUrl }) {
  if (!isConfigured()) throw new Error('PAY_NOT_CONFIGURED');
  const payType = channel === 'alipay' ? 'alipay' : 'native';
  const name = String(title || '积分充值').slice(0, 60);
  const price = Number(amountYuan).toFixed(2);
  const sign = md5(name + payType + price + tradeOrderId + notifyUrl + SECRET);
  const res = await fetch(`${API_BASE}/${AID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      name, pay_type: payType, price, order_id: tradeOrderId, notify_url: notifyUrl, sign,
    }).toString(),
    signal: AbortSignal.timeout(20000),
  });
  const j = await res.json().catch(() => ({}));
  if (j.status !== 'ok' || !j.info?.qr) {
    throw new Error('支付下单失败: ' + String(j.info || j.status || JSON.stringify(j)).slice(0, 120));
  }
  const qrContent = String(j.info.qr);
  const qrUrl = await QRCode.toDataURL(qrContent, { width: 360, margin: 1 });
  return {
    payUrl: /^https?:\/\//i.test(qrContent) ? qrContent : '', // 支付宝串可点击唤起APP；微信 weixin:// 仅供扫码/长按
    qrUrl,
    aoid: j.aoid || '',
  };
}

/** 回调验签：params 为 XorPay POST 的表单字段(原样字符串拼接,不做格式化) */
export function verifyNotify(params) {
  if (!SECRET || !params || !params.sign) return false;
  const expect = md5(
    String(params.aoid ?? '') + String(params.order_id ?? '') + String(params.pay_price ?? '') + String(params.pay_time ?? '') + SECRET,
  );
  return expect === String(params.sign).toLowerCase();
}
