/**
 * 内测期访问/额度控制（先写死，正式推出再丰富充值与套餐）
 * - 每位用户固定 320 积分体验额度，普通用户不可充值
 * - 仅「测试账号」可无限充值（用于内部测试）
 * 可用环境变量覆盖：FREE_CREDITS / TEST_EMAIL
 */
export const FREE_CREDITS = Number(process.env.FREE_CREDITS || 320);
export const TEST_EMAIL = String(process.env.TEST_EMAIL || 'tester@moly.app').trim().toLowerCase();

/** 是否为可无限充值的测试账号 */
export function isTester(email) {
  return String(email || '').trim().toLowerCase() === TEST_EMAIL;
}
