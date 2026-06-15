/**
 * 内测期访问/额度控制（先写死，正式推出再丰富充值与套餐）
 * - 每位用户固定 320 积分体验额度，普通用户不可充值
 * - 仅「测试账号」可无限充值（用于内部测试）
 * - 内测白名单：仅受邀账号 + 测试账号可注册/登录，其余一律拒绝（防"无限注册薅体验额度"）
 * 可用环境变量覆盖：FREE_CREDITS / TEST_EMAIL / BETA_ALLOWLIST
 */
// 公测开放注册(2026-06 用户拍板)：人人可注册，新用户送小额体验积分。
// 回滚开关：Railway 设 OPEN_REGISTRATION=false 即恢复邀请制白名单。
export const OPEN_REGISTRATION = String(process.env.OPEN_REGISTRATION ?? 'true') !== 'false';
// 新用户赠送：200=够免费做出第一条(8秒标准片≈180分)，转化命门。邮箱验证已挡批量撸羊毛。
// 注意：若 Railway 已设 FREE_CREDITS 环境变量,改这里无效,需在 Railway 面板把它改成 200。
export const FREE_CREDITS = Number(process.env.FREE_CREDITS || 200);
export const TEST_EMAIL = String(process.env.TEST_EMAIL || 'tester@moly.app').trim().toLowerCase();

/** 是否为可无限充值的测试账号 */
export function isTester(email) {
  return String(email || '').trim().toLowerCase() === TEST_EMAIL;
}

// ── 内测白名单 ───────────────────────────────────────────────
// 账号归一：邮箱→小写；手机号→纯数字并去掉国家码 86（统一成 11 位），兼容填 "15…" 或 "8615…"。
function normAccount(s) {
  const v = String(s || '').trim().toLowerCase();
  if (!v) return '';
  if (v.includes('@')) return v;
  const d = v.replace(/\D/g, '');
  return d.length === 13 && d.startsWith('86') ? d.slice(2) : d;
}

// 代码内默认白名单（受邀内测账号）。也可用 env BETA_ALLOWLIST（逗号分隔邮箱/手机号）追加。
// 留空时：仅测试账号可用。填写后：仅这些账号 + 测试账号可注册/登录。
const DEFAULT_ALLOW = [
  // 内测受邀账号（手机号存"国家码+号码"，归一时会自动去掉 86；邮箱小写）
  '8615735640010',
  '8615353019448',
  '8618091730950',
  'demo@moly.test',
  'pipe@test.com',
  // 内测分发账号 beta01~beta10@moly.app（各 800 积分，密码不入码、仅存 DB）
  'beta01@moly.app', 'beta02@moly.app', 'beta03@moly.app', 'beta04@moly.app', 'beta05@moly.app',
  'beta06@moly.app', 'beta07@moly.app', 'beta08@moly.app', 'beta09@moly.app', 'beta10@moly.app',
];
const ALLOWSET = new Set(
  [...DEFAULT_ALLOW, ...String(process.env.BETA_ALLOWLIST || '').split(',')]
    .map(normAccount).filter(Boolean),
);

/** 该账号（邮箱或手机号）是否允许注册/登录。公测开放后恒为 true(空账号除外)；关掉开关即回到白名单。 */
export function isAllowed(account) {
  const a = normAccount(account);
  if (!a) return false;
  if (OPEN_REGISTRATION) return true;
  if (a === normAccount(TEST_EMAIL)) return true;
  return ALLOWSET.has(a);
}

/** 当前白名单账号数（不含测试账号）——供健康检查/日志 */
export const allowlistSize = () => ALLOWSET.size;
