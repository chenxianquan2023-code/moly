/**
 * 类型守卫函数
 */

import type { 
  WorkflowNode, 
  WorkflowNodeType, 
  WorkflowNodeStatus,
  GenerationMode,
  AnalysisType,
  AIErrorCode
} from '@/types/ai.types'

/**
 * 检查是否为有效的节点类型
 */
export function isValidNodeType(type: string): type is WorkflowNodeType {
  return ['input', 'analysis', 'generation', 'upscale', 'enhance', 'filter', 'output'].includes(type)
}

/**
 * 检查是否为有效的节点状态
 */
export function isValidNodeStatus(status: string): status is WorkflowNodeStatus {
  return ['pending', 'running', 'completed', 'error', 'skipped'].includes(status)
}

/**
 * 检查是否为有效的生成模式
 */
export function isValidGenerationMode(mode: string): mode is GenerationMode {
  return ['tryon', 'scene', 'upscale', 'enhance', 'background', 'custom'].includes(mode)
}

/**
 * 检查是否为有效的分析类型
 */
export function isValidAnalysisType(type: string): type is AnalysisType {
  return ['model', 'garment', 'product', 'scene', 'generic'].includes(type)
}

/**
 * 检查是否为有效的错误代码
 */
export function isValidErrorCode(code: string): code is AIErrorCode {
  return [
    'TIMEOUT',
    'RATE_LIMIT',
    'INVALID_INPUT',
    'GENERATION_FAILED',
    'NETWORK_ERROR',
    'AUTH_ERROR',
    'QUOTA_EXHAUSTED',
    'UNKNOWN'
  ].includes(code)
}

/**
 * 检查是否为 base64 图片
 */
export function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/')
}

/**
 * 检查是否为 URL
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

/**
 * 检查是否为 Blob URL
 */
export function isBlobUrl(str: string): boolean {
  return str.startsWith('blob:')
}

/**
 * 检查文件是否为图片
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * 检查节点是否为输入节点
 */
export function isInputNode(node: WorkflowNode): boolean {
  return node.type === 'input'
}

/**
 * 检查节点是否为输出节点
 */
export function isOutputNode(node: WorkflowNode): boolean {
  return node.type === 'output'
}

/**
 * 检查节点是否已完成
 */
export function isNodeCompleted(node: WorkflowNode): boolean {
  return node.status === 'completed'
}

/**
 * 检查节点是否出错
 */
export function isNodeError(node: WorkflowNode): boolean {
  return node.status === 'error'
}

/**
 * 检查值是否为空
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 检查是否为数字
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * 检查是否为正整数
 */
export function isPositiveInteger(value: any): value is number {
  return isNumber(value) && value > 0 && Number.isInteger(value)
}
