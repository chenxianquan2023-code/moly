/**
 * 图片生成服务 - 原子能力
 * 
 * 提供通用的图片生成能力，支持多种生成模式
 */

import { geminiService } from '../gemini.service'
import { GENERATION_PROMPTS } from '@/config/ai.config'

export type GenerationMode = 
  | 'tryon'           // 虚拟试穿
  | 'scene'           // 场景生成
  | 'upscale'         // 图片放大
  | 'enhance'         // 细节增强
  | 'background'      // 背景替换
  | 'custom'          // 自定义

export interface GenerationOptions {
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9'
  imageSize?: '1K' | '2K' | '4K'
  temperature?: number
  keepBackground?: boolean
  enhanceLighting?: boolean
}

export interface GenerationResult {
  success: boolean
  imageUrl?: string
  error?: string
  metadata?: {
    prompt: string
    mode: GenerationMode
    processingTime: number
  }
}

export class ImageGenerationService {
  /**
   * 生成图片
   * @param mode 生成模式
   * @param prompt 提示词
   * @param referenceImages 参考图片
   * @param options 生成选项
   * @returns 生成结果
   */
  async generate(
    mode: GenerationMode,
    prompt: string,
    referenceImages: string[] = [],
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now()
    
    try {
      console.log(`[ImageGenerationService] Generating image in mode: ${mode}`)
      
      const resultImage = await geminiService.generateImage(
        prompt,
        referenceImages,
        {
          aspectRatio: options.aspectRatio,
          imageSize: options.imageSize,
          temperature: options.temperature ?? 0.7
        }
      )

      // 检查结果是否是图片
      if (resultImage.startsWith('data:image')) {
        return {
          success: true,
          imageUrl: resultImage,
          metadata: {
            prompt,
            mode,
            processingTime: Date.now() - startTime
          }
        }
      } else {
        return {
          success: false,
          error: '模型返回文本而非图片: ' + resultImage.substring(0, 100)
        }
      }
    } catch (error) {
      console.error('[ImageGenerationService] Generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成失败'
      }
    }
  }

  /**
   * 虚拟试穿专用生成
   */
  async generateTryOn(
    modelDescription: string,
    garmentDescription: string,
    action: string,
    modelImage: string,
    garmentImage: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const prompt = GENERATION_PROMPTS.tryon(
      modelDescription,
      garmentDescription,
      action,
      options.keepBackground ?? true,
      options.enhanceLighting ?? false
    )

    return this.generate('tryon', prompt, [modelImage, garmentImage], options)
  }

  /**
   * 场景生成专用
   */
  async generateScene(
    productDescription: string,
    sceneType: string,
    productImage: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const prompt = GENERATION_PROMPTS.scene(productDescription, sceneType)

    return this.generate('scene', prompt, [productImage], options)
  }

  /**
   * 图片放大专用
   */
  async upscale(
    imageUrl: string,
    scale: 2 | 4 = 2,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const prompt = GENERATION_PROMPTS.upscale(scale)

    return this.generate('upscale', prompt, [imageUrl], {
      ...options,
      imageSize: scale === 4 ? '4K' : '2K'
    })
  }
}

// 导出单例
export const imageGenerationService = new ImageGenerationService()
export default ImageGenerationService
