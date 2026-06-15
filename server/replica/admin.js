/**
 * 超级管理员 · 给任意用户充值积分。
 * 安全模型：本应用的 getEmail 只信请求里的邮箱(无 token)，所以"是不是管理员邮箱"不能当安全门——
 * 真正的硬门是 ADMIN_SECRET(密钥)，timingSafe 比对；未配置 ADMIN_SECRET 则本功能整体关闭。
 *   ADMIN_EMAILS  逗号分隔，决定前端是否显示「管理」入口(仅 UI 便利，非安全门)
 *   ADMIN_SECRET  充值/查余额的硬密钥；不设=功能关闭
 */
import { Router } from 'express';
import crypto from 'node:crypto';
import { addPoints, getPoints } from '../lib/points.js';
import { selectRows } from '../lib/supabase.js';
import { RECHARGE_PACKAGES } from './pricing.js';

export const adminRouter = Router();

// 默认只认专用管理员号 admin@moly.video(刻意不挂用户日常账号,日常账号看不到「管理」入口)。
// 可用 ADMIN_EMAILS 环境变量覆盖(逗号分隔)。
const ADMIN_EMAILS = new Set(
  String(process.env.ADMIN_EMAILS || 'admin@moly.video')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean),
);
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

const isAdminEmail = (email) => ADMIN_EMAILS.has(String(email || '').trim().toLowerCase());
function secretOk(input) {
  if (!ADMIN_SECRET) return false; // 未配置密钥 → 功能关闭，任何充值请求都拒
  const a = Buffer.from(String(input || ''));
  const b = Buffer.from(ADMIN_SECRET);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// GET /api/admin/check?email= —— 前端判断是否显示管理入口 + 拿"选项积分"档位(非安全门)
adminRouter.get('/admin/check', (req, res) => {
  res.json({
    success: true,
    isAdmin: isAdminEmail(req.query?.email),
    enabled: !!ADMIN_SECRET, // 后台是否已配密钥(没配则充值不可用)
    presets: RECHARGE_PACKAGES.map((p) => ({ label: p.label, credits: p.credits + (p.bonus || 0), priceYuan: p.priceYuan })),
  });
});

// GET /api/admin/user?email=&adminSecret= —— 查某用户当前余额(需密钥)
adminRouter.get('/admin/user', async (req, res) => {
  if (!secretOk(req.query?.adminSecret)) return res.status(403).json({ success: false, message: '管理员密钥无效或后台未配置 ADMIN_SECRET' });
  const target = String(req.query?.email || '').trim().toLowerCase();
  if (!target) return res.status(400).json({ success: false, message: '缺少 email' });
  const points = await getPoints(target);
  if (points === null) return res.status(404).json({ success: false, message: '用户不存在(对方需先注册过)' });
  res.json({ success: true, email: target, points });
});

// POST /api/admin/grant —— 给指定用户充值积分(需密钥)。body: { adminEmail, adminSecret, targetEmail, amount, reason }
adminRouter.post('/admin/grant', async (req, res) => {
  try {
    const { adminEmail, adminSecret, targetEmail, amount, reason } = req.body || {};
    if (!secretOk(adminSecret)) return res.status(403).json({ success: false, message: '管理员密钥无效或后台未配置 ADMIN_SECRET' });
    const target = String(targetEmail || '').trim().toLowerCase();
    const amt = Math.round(Number(amount) || 0);
    if (!target) return res.status(400).json({ success: false, message: '缺少目标用户邮箱' });
    if (!(amt > 0) || amt > 1000000) return res.status(400).json({ success: false, message: '积分数无效(1~1000000)' });
    if ((await getPoints(target)) === null) return res.status(404).json({ success: false, message: '用户不存在(对方需先注册过)' });
    const who = String(adminEmail || '').trim().toLowerCase() || 'admin';
    const points = await addPoints(target, amt, `管理员充值(by ${who}${reason ? ': ' + String(reason).slice(0, 40) : ''})`);
    console.log(`[admin] ${who} → ${target} +${amt} = ${points}`);
    res.json({ success: true, email: target, added: amt, points });
  } catch (e) {
    res.status(500).json({ success: false, message: String(e.message || e).slice(0, 160) });
  }
});

// GET /api/admin/consumption?adminSecret=&days=30 —— 每个用户的消费情况(需密钥)
adminRouter.get('/admin/consumption', async (req, res) => {
  if (!secretOk(req.query?.adminSecret)) return res.status(403).json({ success: false, message: '管理员密钥无效或后台未配置 ADMIN_SECRET' });
  try {
    const days = Math.min(365, Math.max(1, Number(req.query?.days) || 30));
    const since = new Date(Date.now() - days * 86400000).toISOString();
    // 窗口内生成任务 → 按用户聚合消费(credits_charged=实际扣的积分)
    const tasks = await selectRows('generation_tasks', `created_at=gte.${encodeURIComponent(since)}&select=user_email,credits_charged,status,created_at&order=created_at.desc&limit=5000`);
    const byUser = {};
    for (const t of (tasks || [])) {
      const e = String(t.user_email || '').toLowerCase(); if (!e) continue;
      if (!byUser[e]) byUser[e] = { email: e, tasks: 0, succeeded: 0, spent: 0, lastActive: t.created_at };
      byUser[e].tasks += 1;
      byUser[e].spent += (t.credits_charged || 0);
      if (t.status === 'succeeded') byUser[e].succeeded += 1;
      if (t.created_at > byUser[e].lastActive) byUser[e].lastActive = t.created_at;
    }
    const users = await selectRows('moly_users', 'select=email,points');
    const balMap = Object.fromEntries((users || []).map((u) => [String(u.email).toLowerCase(), u.points]));
    const rows = Object.values(byUser)
      .map((r) => ({ ...r, balance: balMap[r.email] ?? null }))
      .sort((a, b) => b.spent - a.spent);
    res.json({ success: true, days, totalSpent: rows.reduce((s, r) => s + r.spent, 0), totalUsers: rows.length, users: rows.slice(0, 200) });
  } catch (e) {
    res.status(500).json({ success: false, message: String(e.message || e).slice(0, 160) });
  }
});
