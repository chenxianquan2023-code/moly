/**
 * 真实支付路由（聚合支付·虎皮椒：微信 / 支付宝）
 * 流程：POST /pay/create 下单(建 recharge_orders 行 + 虎皮椒下单) → 用户扫码/跳转支付
 *      → 虎皮椒 POST /pay/notify/:channel 回调(验签+幂等加积分) → 前端轮询 GET /pay/order 刷新。
 * 安全：回调必须验签；加分以订单行状态做幂等(已 paid 不重复加)；金额以我们订单行为准(不信回调金额)。
 * 未配置通道密钥时返回 PAY_NOT_CONFIGURED，不影响其他功能。
 */
import { Router } from 'express';
import express from 'express';
import { insertRow, getById, updateById, selectRows } from '../lib/supabase.js';
import { addPoints, getPoints } from '../lib/points.js';
import { RECHARGE_PACKAGES } from './pricing.js';
import { createPayment, verifyNotify, isPayConfigured } from '../lib/hupi.js';

export const payRouter = Router();

const BASE_URL = (process.env.APP_BASE_URL || 'https://moly-production-2f51.up.railway.app').replace(/\/$/, '');
const CHANNELS = new Set(['wechat', 'alipay']);

// POST /api/pay/create  body: { userEmail, packageId, channel }
payRouter.post('/pay/create', async (req, res) => {
  try {
    const email = String(req.body?.userEmail || '').trim().toLowerCase();
    if (!email) return res.status(401).json({ success: false, message: '请先登录' });
    const channel = String(req.body?.channel || 'wechat');
    if (!CHANNELS.has(channel)) return res.status(400).json({ success: false, message: '支付方式无效' });
    const pkg = RECHARGE_PACKAGES.find((p) => p.id === String(req.body?.packageId || ''));
    if (!pkg) return res.status(400).json({ success: false, message: '充值套餐无效' });
    if ((await getPoints(email)) === null) return res.status(404).json({ success: false, message: '用户不存在，请先登录' });
    if (!isPayConfigured(channel)) {
      return res.status(503).json({ success: false, code: 'PAY_NOT_CONFIGURED', message: `${channel === 'alipay' ? '支付宝' : '微信'}支付通道配置中，暂时无法充值，请稍后再试或联系管理员。` });
    }

    let order;
    try {
      order = await insertRow('recharge_orders', {
        user_email: email,
        package_id: pkg.id,
        credits: pkg.credits + (pkg.bonus || 0),
        amount_yuan: pkg.priceYuan,
        channel,
        status: 'pending',
      });
    } catch (e) {
      return res.status(503).json({ success: false, message: '订单系统未初始化(recharge_orders 表缺失)，请联系管理员。' });
    }

    const { payUrl, qrUrl } = await createPayment({
      tradeOrderId: order.id,
      amountYuan: pkg.priceYuan,
      title: `Moly积分·${pkg.label}`,
      channel,
      notifyUrl: `${BASE_URL}/api/pay/notify/${channel}`,
      returnUrl: `${BASE_URL}/studio`,
    });
    res.json({ success: true, orderId: order.id, payUrl, qrUrl, amountYuan: pkg.priceYuan, credits: order.credits, package: pkg });
  } catch (e) {
    res.status(500).json({ success: false, message: String(e.message || e).slice(0, 160) });
  }
});

// POST /api/pay/notify/:channel —— 虎皮椒异步回调(表单编码)。验签 → 幂等加分 → 回 'success' 停止重试。
payRouter.post('/pay/notify/:channel', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const channel = String(req.params.channel || '');
    if (!CHANNELS.has(channel)) return res.status(400).send('fail');
    const body = req.body || {};
    if (!verifyNotify(body, channel)) {
      console.error('[pay/notify] 验签失败', channel, JSON.stringify(body).slice(0, 200));
      return res.status(400).send('fail');
    }
    // 虎皮椒：status 'OD' = 已支付
    if (String(body.status) !== 'OD') return res.send('success');
    const orderId = String(body.trade_order_id || '');
    const order = orderId ? await getById('recharge_orders', orderId) : null;
    if (!order) return res.send('success'); // 验签已过但查无单(异常少见)：回 success 停止重试，留日志
    if (order.status === 'paid') return res.send('success'); // 幂等：重复回调不重复加分
    await addPoints(order.user_email, order.credits, `充值:${order.package_id}#${orderId.slice(0, 8)}`);
    await updateById('recharge_orders', orderId, {
      status: 'paid',
      transaction_id: String(body.transaction_id || body.open_order_id || ''),
      paid_at: new Date().toISOString(),
    });
    console.log(`[pay] 到账 ${order.user_email} +${order.credits} (${channel} ¥${order.amount_yuan})`);
    res.send('success');
  } catch (e) {
    console.error('[pay/notify]', e.message);
    res.status(500).send('fail'); // 让通道重试
  }
});

// GET /api/pay/order?orderId=&userEmail= —— 前端轮询订单状态(支付成功后刷新积分)
payRouter.get('/pay/order', async (req, res) => {
  try {
    const orderId = String(req.query?.orderId || '');
    if (!orderId) return res.status(400).json({ success: false, message: '缺少 orderId' });
    const order = await getById('recharge_orders', orderId);
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
    const out = { success: true, status: order.status, credits: order.credits };
    if (order.status === 'paid') out.points = await getPoints(order.user_email);
    res.json(out);
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/pay/channels —— 前端按配置状态渲染可用支付方式
payRouter.get('/pay/channels', (req, res) => {
  res.json({ success: true, wechat: isPayConfigured('wechat'), alipay: isPayConfigured('alipay') });
});
