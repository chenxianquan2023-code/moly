/**
 * 统一错误处理
 * 
 * 提供标准化的错误类型和处理机制
 */

export type AIErrorCode = 
  | 'TIMEOUT'           // 请求超时
  | 'RATE_LIMIT'        // 速率限制
  | 'INVALID_INPUT'     // 输入无效
  | 'GENERATION_FAILED' // 生成失败
  | 'NETWORK_ERROR'     // 网络错误
  | 'AUTH_ERROR'        // 认证失败
  | 'QUOTA_EXHAUSTED'   // 额度耗尽
  | 'UNKNOWN'           // 未知错误

export interface AIErrorDetails {
  code: AIErrorCode
  message: string
  retryable: boolean
  originalError?: Error
  context?: Record<string, any>
}

export class AIError extends Error {
  public readonly code: AIErrorCode
  public readonly retryable: boolean
  public readonly context?: Record<string, any>
  public readonly originalError?: Error

  constructor(details: AIErrorDetails) {
    super(details.message)
    this.name = 'AIError'
    this.code = details.code
    this.retryable = details.retryable
    this.context = details.context
    this.originalError = details.originalError
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(): string {
    const userMessages: Record<AIErrorCode, string> = {
      TIMEOUT: '请求超时，请稍后重试',
      RATE_LIMIT: '请求过于频繁，请稍后再试',
      INVALID_INPUT: '输入内容有误，请检查后再试',
      GENERATION_FAILED: '图片生成失败，请重试或调整参数',
      NETWORK_ERROR: '网络连接异常，请检查网络',
      AUTH_ERROR: '认证失败，请重新登录',
      QUOTA_EXHAUSTED: '额度已用完，请充值',
      UNKNOWN: '发生未知错误，请稍后重试'
    }
    return userMessages[this.code] || this.message
  }

  /**
   * 是否应该重试
   */
  shouldRetry(): boolean {
    return this.retryable
  }
}

/**
 * 错误工厂函数
 */
export function createError(
  code: AIErrorCode,
  message: string,
  options?: {
    retryable?: boolean
    originalError?: Error
    context?: Record<string, any>
  }
): AIError {
  const retryableMap: Record<AIErrorCode, boolean> = {
    TIMEOUT: true,
    RATE_LIMIT: true,
    NETWORK_ERROR: true,
    INVALID_INPUT: false,
    GENERATION_FAILED: true,
    AUTH_ERROR: false,
    QUOTA_EXHAUSTED: false,
    UNKNOWN: false
  }

  return new AIError({
    code,
    message,
    retryable: options?.retryable ?? retryableMap[code] ?? false,
    originalError: options?.originalError,
    context: options?.context
  })
}

/**
 * 从原始错误创建 AIError
 */
export function fromError(error: unknown, context?: Record<string, any>): AIError {
  if (error instanceof AIError) {
    return error
  }

  const message = error instanceof Error ? error.message : String(error)
  
  // 根据错误消息判断类型
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return createError('TIMEOUT', '请求超时', { originalError: error as Error, context })
  }
  
  if (message.includes('rate limit') || message.includes('429')) {
    return createError('RATE_LIMIT', '请求过于频繁', { originalError: error as Error, context })
  }
  
  if (message.includes('network') || message.includes('ECONNREFUSED')) {
    return createError('NETWORK_ERROR', '网络连接异常', { originalError: error as Error, context })
  }
  
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('401')) {
    return createError('AUTH_ERROR', '认证失败', { originalError: error as Error, context })
  }
  
  if (message.includes('quota') || message.includes('exhausted')) {
    return createError('QUOTA_EXHAUSTED', '额度已用完', { originalError: error as Error, context })
  }

  return createError('UNKNOWN', message, { originalError: error as Error, context })
}

/**
 * 带重试的异步函数包装器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    backoff?: number
    onRetry?: (attempt: number, error: AIError) => void
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2, onRetry } = options
  
  let lastError: AIError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = fromError(error)
      
      if (!lastError.shouldRetry() || attempt === maxRetries) {
        throw lastError
      }
      
      onRetry?.(attempt + 1, lastError)
      
      // 指数退避
      const waitTime = delay * Math.pow(backoff, attempt)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  throw lastError!
}
