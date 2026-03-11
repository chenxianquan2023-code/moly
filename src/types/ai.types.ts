/**
 * AI 相关类型定义
 * 
 * 集中管理所有 AI 相关的类型定义
 */

// ============================================
// 基础类型
// ============================================

/** AI 提供商 */
export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'custom'

/** 图片格式 */
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif'

/** 宽高比 */
export type AspectRatio = '1:1' | '3:4' | '4:3' | '16:9' | '9:16'

/** 图片尺寸 */
export type ImageSize = '1K' | '2K' | '4K'

/** 生成模式 */
export type GenerationMode = 
  | 'tryon'      // 虚拟试穿
  | 'scene'      // 场景生成
  | 'upscale'    // 图片放大
  | 'enhance'    // 细节增强
  | 'background' // 背景替换
  | 'custom'     // 自定义

/** 分析类型 */
export type AnalysisType = 
  | 'model'     // 模特分析
  | 'garment'   // 服装分析
  | 'product'   // 产品分析
  | 'scene'     // 场景分析
  | 'generic'   // 通用分析

// ============================================
// 配置类型
// ============================================

/** AI 配置 */
export interface AIConfig {
  apiKey: string
  analysisModel: string
  imageModel: string
  baseUrl: string
  timeout?: number
  maxRetries?: number
}

/** 生成选项 */
export interface GenerationOptions {
  aspectRatio?: AspectRatio
  imageSize?: ImageSize
  temperature?: number
  keepBackground?: boolean
  enhanceLighting?: boolean
  seed?: number
}

/** 分析选项 */
export interface AnalysisOptions {
  type: AnalysisType
  maxLength?: number
  language?: 'zh' | 'en'
}

// ============================================
// 请求/响应类型
// ============================================

/** 虚拟试穿请求 */
export interface TryOnRequest {
  modelImage: string
  garmentImage: string
  action: string
  keepBackground: boolean
  enhanceLighting: boolean
  aspectRatio?: AspectRatio
  imageSize?: ImageSize
}

/** 虚拟试穿响应 */
export interface TryOnResponse {
  success: boolean
  imageUrl?: string
  error?: string
  metadata?: {
    processingTime: number
    modelUsed: string
    promptLength: number
  }
}

/** 场景生成请求 */
export interface SceneGenerationRequest {
  productImage: string
  sceneType: string
  style?: string
  productDescription?: string
  aspectRatio?: AspectRatio
  imageSize?: ImageSize
}

/** 图片放大请求 */
export interface UpscaleRequest {
  image: string
  scale: 2 | 4
  preserveDetails?: boolean
}

/** 图片分析结果 */
export interface ImageAnalysisResult {
  description: string
  tags: string[]
  features: string[]
  colors?: string[]
  confidence: number
}

/** 生成结果 */
export interface GenerationResult {
  success: boolean
  imageUrl?: string
  error?: string
  metadata?: {
    prompt: string
    mode: GenerationMode
    processingTime: number
    tokensUsed?: number
  }
}

// ============================================
// 回调类型
// ============================================

/** 进度回调 */
export type ProgressCallback = (
  progress: number,
  message: string,
  stage?: 'analysis' | 'generation' | 'post-processing'
) => void

/** 日志回调 */
export type LogCallback = (level: 'info' | 'warn' | 'error', message: string, data?: any) => void

// ============================================
// 工作流类型
// ============================================

/** 工作流节点类型 */
export type WorkflowNodeType = 
  | 'input'
  | 'analysis'
  | 'generation'
  | 'upscale'
  | 'enhance'
  | 'filter'
  | 'output'

/** 工作流节点状态 */
export type WorkflowNodeStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'error'
  | 'skipped'

/** 工作流节点 */
export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  label?: string
  inputs: Record<string, any>
  params: Record<string, any>
  outputs?: Record<string, any>
  status?: WorkflowNodeStatus
  error?: string
  executionTime?: number
  position?: { x: number; y: number }
}

/** 工作流边 */
export interface WorkflowEdge {
  id: string
  from: string
  to: string
  inputKey: string
  condition?: string
}

/** 工作流定义 */
export interface WorkflowDefinition {
  id: string
  name: string
  description?: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  version: string
  createdAt: string
  updatedAt: string
}

/** 工作流执行结果 */
export interface WorkflowExecutionResult {
  success: boolean
  workflowId: string
  results: Map<string, any>
  errors: Map<string, string>
  executionTime: number
  nodeResults: Map<string, {
    status: WorkflowNodeStatus
    output?: any
    error?: string
    executionTime: number
  }>
}

// ============================================
// 图片处理类型
// ============================================

/** 图片信息 */
export interface ImageInfo {
  url: string
  width?: number
  height?: number
  format?: ImageFormat
  size?: number
}

/** 图片处理选项 */
export interface ImageProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: ImageFormat
  preserveAspectRatio?: boolean
}

// ============================================
// 工具类型
// ============================================

/** 工具定义 */
export interface ToolDefinition {
  id: string
  name: string
  description: string
  icon?: string
  category: 'tryon' | 'scene' | 'enhance' | 'utility'
  inputTypes: string[]
  outputTypes: string[]
  defaultWorkflow?: WorkflowDefinition
  exampleImages?: {
    before: string
    after: string
  }
}

/** 工具执行上下文 */
export interface ToolExecutionContext {
  toolId: string
  inputs: Record<string, any>
  options: Record<string, any>
  userId?: string
  sessionId?: string
}

// ============================================
// 用户相关类型
// ============================================

/** 用户积分 */
export interface UserPoints {
  balance: number
  totalUsed: number
  history: PointTransaction[]
}

/** 积分交易 */
export interface PointTransaction {
  id: string
  type: 'earn' | 'spend' | 'refund'
  amount: number
  description: string
  timestamp: string
  relatedTaskId?: string
}

// ============================================
// 通用工具类型
// ============================================

/** 分页结果 */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/** API 响应包装 */
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}
