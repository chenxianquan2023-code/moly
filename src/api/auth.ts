/**
 * 认证相关 API
 * 
 * 验证码、注册、登录、密码重置
 */

import { post } from './client'

export interface SendCodeParams {
  email?: string
  phone?: string
  countryCode?: string
}

export interface SendCodeRes {
  success: boolean
  message?: string
  devCode?: string
}

export interface RegisterParams {
  email?: string
  phone?: string
  countryCode?: string
  password: string
  code: string
}

export interface RegisterRes {
  success: boolean
  message?: string
}

export interface LoginParams {
  account: string
  password?: string
  code?: string
}

export interface LoginRes {
  success: boolean
  message?: string
  user?: {
    id?: string
    email?: string
    phone?: string
    displayName?: string
    points?: number
  }
  token?: string
}

export interface ResetPasswordParams {
  token: string
  newPassword: string
}

/**
 * 发送验证码
 */
export async function sendCode(params: SendCodeParams): Promise<SendCodeRes> {
  // 手机号流程只传 phone + countryCode
  const hasPhone = params.phone != null && String(params.phone).trim() !== ''
  
  const body = hasPhone
    ? {
        phone: String(params.phone).replace(/\D/g, ''),
        countryCode: params.countryCode || '+86'
      }
    : params.email
      ? { email: params.email.trim().toLowerCase() }
      : null
  
  if (!body) {
    return { success: false, message: '请提供邮箱或手机号' }
  }
  
  return post<SendCodeRes>('/api/auth/send-code', body)
}

/**
 * 用户注册
 */
export async function register(params: RegisterParams): Promise<RegisterRes> {
  const body = params.email
    ? {
        email: params.email.trim().toLowerCase(),
        password: params.password,
        code: params.code.trim()
      }
    : {
        phone: params.phone!.trim().replace(/\D/g, ''),
        countryCode: params.countryCode || '+86',
        password: params.password,
        code: params.code.trim()
      }
  
  return post<RegisterRes>('/api/auth/register', body)
}

/**
 * 密码登录
 */
export async function login(params: LoginParams): Promise<LoginRes> {
  return post<LoginRes>('/api/auth/login', {
    account: params.account.trim(),
    password: params.password
  })
}

/**
 * 验证码登录
 */
export async function loginByCode(params: LoginParams): Promise<LoginRes> {
  return post<LoginRes>('/api/auth/login-by-code', {
    account: params.account.trim(),
    code: params.code?.trim()
  })
}

/**
 * 发送密码重置链接
 */
export async function sendResetLink(email: string): Promise<{ success: boolean; message?: string }> {
  return post('/api/auth/forgot-password', {
    email: email.trim().toLowerCase()
  })
}

/**
 * 重置密码
 */
export async function resetPassword(params: ResetPasswordParams): Promise<{ success: boolean; message?: string }> {
  return post('/api/auth/reset-password', {
    token: params.token,
    newPassword: params.newPassword
  })
}

/**
 * 刷新 Token
 */
export async function refreshToken(): Promise<{ success: boolean; token?: string }> {
  return post('/api/auth/refresh')
}

/**
 * 退出登录
 */
export async function logout(): Promise<{ success: boolean }> {
  return post('/api/auth/logout')
}
