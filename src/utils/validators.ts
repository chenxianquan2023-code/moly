/**
 * 表单验证（需求：手机 11 位、邮箱标准格式、验证码 6 位、密码 8-20 位含字母和数字）
 */

const PHONE_REG = /^1\d{10}$/;
const EMAIL_REG = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_REG = /^\d{6}$/;
const PASSWORD_REG = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,20}$/;

export function validatePhone(value: string): { valid: boolean; message?: string } {
  const cleaned = value.trim().replace(/\D/g, '');
  if (!cleaned) return { valid: false, message: '请输入手机号' };
  // 始终只取最后 11 位做校验，兼容误输 86 或其他前缀的情况
  const digits = cleaned.slice(-11);
  // #region agent log
  fetch('http://127.0.0.1:7540/ingest/d97822f3-40b2-4c53-b46c-84dbb07e685e', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'efb394',
    },
    body: JSON.stringify({
      sessionId: 'efb394',
      runId: 'pre-fix-1',
      hypothesisId: 'H1',
      location: 'src/utils/validators.ts:validatePhone',
      message: 'validatePhone input and normalized digits',
      data: { raw: value, cleaned, digits },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log
  if (!PHONE_REG.test(digits)) return { valid: false, message: '请输入正确的 11 位手机号' };
  return { valid: true };
}

export function validateEmail(value: string): { valid: boolean; message?: string } {
  const v = value.trim();
  if (!v) return { valid: false, message: '请输入邮箱' };
  if (!EMAIL_REG.test(v)) return { valid: false, message: '请输入正确的邮箱格式' };
  return { valid: true };
}

export function validateCode(value: string): { valid: boolean; message?: string } {
  const v = value.trim();
  if (!v) return { valid: false, message: '请输入验证码' };
  if (!CODE_REG.test(v)) return { valid: false, message: '验证码为 6 位数字' };
  return { valid: true };
}

export function validatePassword(value: string): { valid: boolean; message?: string } {
  if (!value) return { valid: false, message: '请输入密码' };
  if (value.length < 8 || value.length > 20) {
    return { valid: false, message: '密码长度为 8-20 位' };
  }
  if (!PASSWORD_REG.test(value)) {
    return { valid: false, message: '密码需包含字母和数字' };
  }
  return { valid: true };
}

export function validatePasswordConfirm(password: string, confirm: string): { valid: boolean; message?: string } {
  if (!confirm) return { valid: false, message: '请再次输入密码' };
  if (password !== confirm) return { valid: false, message: '两次输入的密码不一致' };
  return { valid: true };
}

export const validators = {
  phone: validatePhone,
  email: validateEmail,
  code: validateCode,
  password: validatePassword,
  passwordConfirm: validatePasswordConfirm,
};
