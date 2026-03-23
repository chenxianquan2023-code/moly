/**
 * 图片分析服务 - 原子能力
 * 
 * 提供通用的图片分析能力，不依赖具体业务场景
 */

import { geminiService } from '../gemini.service'
import { ANALYSIS_PROMPTS } from '@/config/ai.config'

export type AnalysisType = 'model' | 'garment' | 'generic' | 'scene' | 'product'

export interface AnalysisResult {
  description: string
  tags: string[]
  confidence: number
}

export class ImageAnalysisService {
  /**
   * 分析单张图片
   * @param imageUrl 图片URL
   * @param type 分析类型
   * @returns 分析结果描述
   */
  async analyze(imageUrl: string, type: AnalysisType = 'generic'): Promise<string> {
    console.log(`[ImageAnalysisService] Analyzing image as type: ${type}`)
    
    const prompt = ANALYSIS_PROMPTS[type] || ANALYSIS_PROMPTS.generic
    
    return await geminiService.generateWithImagesUsingFlash(prompt, [imageUrl])
  }

  /**
   * 批量分析多张图片
   * @param imageUrls 图片URL数组
   * @param type 分析类型
   * @returns 分析结果数组
   */
  async analyzeBatch(imageUrls: string[], type: AnalysisType = 'generic'): Promise<string[]> {
    console.log(`[ImageAnalysisService] Batch analyzing ${imageUrls.length} images`)
    
    // 并行分析，提高效率
    const results = await Promise.all(
      imageUrls.map(url => this.analyze(url, type))
    )
    
    return results
  }

  /**
   * 对比分析两张图片（如模特+服装）
   * @param imageUrl1 第一张图片
   * @param imageUrl2 第二张图片
   * @param context 分析上下文
   * @returns 对比分析结果
   */
  async analyzePair(
    imageUrl1: string, 
    imageUrl2: string, 
    context: 'tryon' | 'scene' | 'comparison' = 'comparison'
  ): Promise<string> {
    console.log(`[ImageAnalysisService] Analyzing image pair for: ${context}`)
    
    const prompt = ANALYSIS_PROMPTS[`${context}Pair`] || ANALYSIS_PROMPTS.comparisonPair
    
    return await geminiService.generateWithImagesUsingFlash(prompt, [imageUrl1, imageUrl2])
  }
}

// 导出单例
export const imageAnalysisService = new ImageAnalysisService()
export default ImageAnalysisService
