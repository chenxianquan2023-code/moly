/**
 * 积分（moly_users.points）共享操作库
 * 复用现有积分体系；服务端各处（生成扣费/失败退款/充值）统一走这里。
 * 注：同一 Node 进程内按用户串行化，避免并发生成/退款互相覆盖；
 *     若部署多实例，仍应升级为 Postgres RPC/积分流水表来做跨实例原子化。
 */
import { selectOne, updateRows } from './supabase.js';
import { withKeyLock } from './keyed-lock.js';

const norm = (e) => String(e || '').trim().toLowerCase();
const enc = (e) => encodeURIComponent(norm(e));

/** 查余额；用户不存在返回 null */
export async function getPoints(email) {
  const u = await selectOne('moly_users', `email=eq.${enc(email)}&select=points`);
  return u ? (u.points ?? 0) : null;
}

/** 加积分（充值/退款），返回新余额 */
export async function addPoints(email, amount, reason = '') {
  return withKeyLock(norm(email), async () => {
    const amt = Math.round(Number(amount) || 0);
    if (amt <= 0) throw new Error('金额无效');
    const u = await selectOne('moly_users', `email=eq.${enc(email)}&select=points`);
    if (!u) throw new Error('用户不存在');
    const next = (u.points ?? 0) + amt;
    await updateRows('moly_users', `email=eq.${enc(email)}`, { points: next });
    console.log(`[points/add] ${norm(email)} +${amt} (${reason}), total: ${next}`);
    return next;
  });
}

/** 扣积分；余额不足抛 code='INSUFFICIENT' 的错误，返回新余额 */
export async function deductPoints(email, amount, reason = '') {
  return withKeyLock(norm(email), async () => {
    const amt = Math.round(Number(amount) || 0);
    if (amt <= 0) throw new Error('金额无效');
    const u = await selectOne('moly_users', `email=eq.${enc(email)}&select=points`);
    if (!u) { const e = new Error('用户不存在'); e.code = 'NO_USER'; throw e; }
    const cur = u.points ?? 0;
    if (cur < amt) { const e = new Error('积分不足'); e.code = 'INSUFFICIENT'; e.points = cur; throw e; }
    const next = cur - amt;
    await updateRows('moly_users', `email=eq.${enc(email)}`, { points: next });
    console.log(`[points/deduct] ${norm(email)} -${amt} (${reason}), remaining: ${next}`);
    return next;
  });
}
