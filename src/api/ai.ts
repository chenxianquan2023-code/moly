/**
 * AI 生成相关 API
 * 
 * 虚拟试穿、场景生成、图片放大等
 */

import { post, uploadFile } from './client'
import type { GenerationResult, TryOnRequest, TryOnResponse } from '@/types/ai.types'

export interface GenerateTryOnParams {
  modelImage: string
  garmentImage: string
  action: string
  keepBackground: boolean
  enhanceLighting: boolean
}

export interface GenerateSceneParams {
  productImage: string
  sceneType: string
  style?: string
}

export interface UpscaleParams {
  image: string
  scale: 2 | 4
}

export interface EnhanceParams {
  image: string
  aspect: 'face' | 'texture' | 'lighting'
}

/**
 * 虚拟试穿
 */
export async function generateTryOn(
  params: GenerateTryOnParams,
  onProgress?: (progress: number, message: string) => void
): Promise<TryOnResponse> {
  // 模拟进度回调
  const progressSteps = [
    { progress: 10, message: '正在分析模特图...', delay: 500 },
    { progress: 30, message: '正在分析服装图...', delay: 500 },
    { progress: 50, message: '正在构建提示词...', delay: 300 },
    { progress: 70, message: '正在生成虚拟试穿图...', delay: 2000 },
    { progress: 100, message: '生成完成！', delay: 0 }
  ]
  
  // 发送请求
  const result = await post<TryOnResponse>('/api/ai/try-on', params)
  
  // 模拟进度（实际应该使用 WebSocket 或 SSE）
  if (onProgress) {
    for (const step of progressSteps) {
      onProgress(step.progress, step.message)
      if (step.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, step.delay))
      }
    }
  }
  
  return result
}

/**
 * 场景生成
 */
export async function generateScene(
  params: GenerateSceneParams,
  onProgress?: (progress: number, message: string) => void
): Promise<GenerationResult> {
  const result = await post<GenerationResult>('/api/ai/scene', params)
  
  if (onProgress) {
    onProgress(50, '正在生成场景...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    onProgress(100, '生成完成！')
  }
  
  return result
}

/**
 * 图片放大
 */
export async function upscaleImage(
  params: UpscaleParams,
  onProgress?: (progress: number) => void
): Promise<GenerationResult> {
  return post<GenerationResult>('/api/ai/upscale', params)
}

/**
 * 细节增强
 */
export async function enhanceImage(params: EnhanceParams): Promise<GenerationResult> {
  return post<GenerationResult>('/api/ai/enhance', params)
}

/**
 * 背景替换
 */
export async function replaceBackground(
  image: string,
  background: string
): Promise<GenerationResult> {
  return post<GenerationResult>('/api/ai/background', { image, background })
}

/**
 * 上传图片并获取 URL
 */
export async function uploadImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const result = await uploadFile<{ url: string }>('/api/upload/image', file, onProgress)
  return result.url
}

/**
 * 批量上传图片
 */
export async function uploadImages(
  files: File[],
  onProgress?: (index: number, progress: number) => void
): Promise<string[]> {
  const urls: string[] = []
  
  for (let i = 0; i < files.length; i++) {
    const url = await uploadImage(files[i], (progress) => {
      onProgress?.(i, progress)
    })
    urls.push(url)
  }
  
  return urls
}

/**
 * 分析图片
 */
export async function analyzeImage(
  image: string,
  type: 'model' | 'garment' | 'product' = 'generic'
): Promise<{ description: string; tags: string[] }> {
  return post('/api/ai/analyze', { image, type })
}
