/**
 * API 客户端封装
 * 
 * 提供统一的请求处理、错误处理、拦截器等功能
 */

import { createError, type AIError } from '@/utils/errorHandler'

const API_BASE = import.meta.env.VITE_API_BASE || ''

// 请求配置
interface RequestConfig extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

// 响应包装
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// 默认配置
const DEFAULT_CONFIG: RequestConfig = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json'
  }
}

/**
 * 统一请求函数
 */
async function request<T>(
  url: string,
  config: RequestConfig = {}
): Promise<T> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`

  // 注入 Authorization header
  const token = localStorage.getItem('omni_gen_token')
  if (token) {
    mergedConfig.headers = {
      ...mergedConfig.headers as Record<string, string>,
      Authorization: `Bearer ${token}`
    }
  }

  let lastError: AIError
  
  for (let attempt = 0; attempt <= (mergedConfig.retries || 0); attempt++) {
    try {
      // 创建 AbortController 用于超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), mergedConfig.timeout)
      
      const response = await fetch(fullUrl, {
        ...mergedConfig,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      // 处理 HTTP 错误
      if (!response.ok) {
        throw createError(
          response.status === 429 ? 'RATE_LIMIT' :
          response.status === 401 ? 'AUTH_ERROR' :
          response.status >= 500 ? 'NETWORK_ERROR' :
          'UNKNOWN',
          `HTTP ${response.status}: ${response.statusText}`,
          { retryable: response.status >= 500 || response.status === 429 }
        )
      }
      
      // 解析响应
      const result: ApiResponse<T> = await response.json()

      if (!result.success) {
        throw createError('UNKNOWN', result.error?.message || '请求失败', {
          context: { code: result.error?.code }
        })
      }

      // 如果有 data 字段则返回 data，否则返回整个 result
      return (result.data || result) as T
      
    } catch (error) {
      lastError = error instanceof Error && 'code' in error
        ? error as AIError
        : createError(
            error instanceof Error && error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
            error instanceof Error ? error.message : '网络请求失败'
          )
      
      // 不重试的情况
      if (!lastError.shouldRetry() || attempt === mergedConfig.retries) {
        throw lastError
      }
      
      // 指数退避重试
      const delay = (mergedConfig.retryDelay || 1000) * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

/**
 * GET 请求
 */
export function get<T>(url: string, config?: RequestConfig): Promise<T> {
  return request<T>(url, { ...config, method: 'GET' })
}

/**
 * POST 请求
 */
export function post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
  return request<T>(url, {
    ...config,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  })
}

/**
 * PUT 请求
 */
export function put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
  return request<T>(url, {
    ...config,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
  })
}

/**
 * DELETE 请求
 */
export function del<T>(url: string, config?: RequestConfig): Promise<T> {
  return request<T>(url, { ...config, method: 'DELETE' })
}

/**
 * 上传文件
 */
export async function uploadFile<T>(
  url: string,
  file: File,
  onProgress?: (progress: number) => void,
  config?: RequestConfig
): Promise<T> {
  const formData = new FormData()
  formData.append('file', file)
  
  // 使用 XMLHttpRequest 获取上传进度
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      })
    }
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          resolve(result.data)
        } catch {
          reject(createError('UNKNOWN', '解析响应失败'))
        }
      } else {
        reject(createError('NETWORK_ERROR', `HTTP ${xhr.status}`))
      }
    })
    
    xhr.addEventListener('error', () => {
      reject(createError('NETWORK_ERROR', '上传失败'))
    })
    
    xhr.addEventListener('abort', () => {
      reject(createError('TIMEOUT', '上传被取消'))
    })
    
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`
    xhr.open('POST', fullUrl)
    xhr.send(formData)
  })
}

// 导出默认对象
export default {
  get,
  post,
  put,
  delete: del,
  uploadFile,
  request
}
