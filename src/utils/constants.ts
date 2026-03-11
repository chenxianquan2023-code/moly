/**
 * 设计规范常量（Deepseek / PicCopilot 参考）
 */
export const AUTH = {
  cardMaxWidth: 420,
  inputHeight: 48,
  inputRadius: 8,
  buttonHeight: 48,
  buttonRadius: 8,
  logoMarginBottom: 40,
  titleToInputGap: 32,
  inputGap: 20,
  cardPadding: 40,
} as const;

export const COLORS = {
  primary: '#2563EB',
  primaryHover: '#1d4ed8',
  bgPage: '#FFFFFF',
  bgSubtle: '#F8FAFC',
  borderDefault: '#E5E7EB',
  borderFocus: '#2563EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  link: '#2563EB',
  error: '#EF4444',
} as const;
