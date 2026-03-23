/**
 * 虚拟试穿服务（重构版）
 * 
 * 基于原子能力服务构建，支持工作流引擎
 */

import { imageAnalysisService } from './atomic/imageAnalysis.service'
import { imageGenerationService } from './atomic/imageGeneration.service'
import { promptBuilderService } from './atomic/promptBuilder.service'
import { workflowRunner, type WorkflowNode, type WorkflowEdge } from './orchestration/workflowRunner.service'
import { ACTION_OPTIONS } from '@/config/ai.config'
import type { TryOnRequest, TryOnResponse, ProgressCallback } from '@/types/ai.types'

export class TryOnService {
  /**
   * 分析模特图片
   * @deprecated 使用 imageAnalysisService.analyze(imageUrl, 'model')
   */
  async analyzeModelImage(imageUrl: string): Promise<string> {
    return imageAnalysisService.analyze(imageUrl, 'model')
  }

  /**
   * 分析服装图片
   * @deprecated 使用 imageAnalysisService.analyze(imageUrl, 'garment')
   */
  async analyzeGarmentImage(imageUrl: string): Promise<string> {
    return imageAnalysisService.analyze(imageUrl, 'garment')
  }

  /**
   * 同时分析模特图和服装图（并行优化）
   */
  async analyzeBothImages(modelImageUrl: string, garmentImageUrl: string): Promise<{
    modelDescription: string
    garmentDescription: string
  }> {
    console.log('[TryOnService] Parallel analyzing both images...')
    
    // 并行分析，提高效率
    const [modelDescription, garmentDescription] = await Promise.all([
      imageAnalysisService.analyze(modelImageUrl, 'model'),
      imageAnalysisService.analyze(garmentImageUrl, 'garment')
    ])

    return { modelDescription, garmentDescription }
  }

  /**
   * 获取动作描述文本
   */
  getActionDescription(actionKey: string): string {
    return ACTION_OPTIONS[actionKey as keyof typeof ACTION_OPTIONS] || actionKey
  }

  /**
   * 生成虚拟试穿图片（工作流版本）
   * 
   * 使用工作流引擎执行，更灵活可扩展
   */
  async generateTryOn(
    request: TryOnRequest,
    onProgress?: ProgressCallback
  ): Promise<TryOnResponse> {
    try {
      // 构建工作流
      const nodes: WorkflowNode[] = [
        {
          id: 'input-model',
          type: 'input',
          inputs: { image: request.modelImage },
          params: {}
        },
        {
          id: 'input-garment',
          type: 'input',
          inputs: { image: request.garmentImage },
          params: {}
        },
        {
          id: 'analysis-model',
          type: 'analysis',
          inputs: { sourceNode: 'input-model' },
          params: { analysisType: 'model' }
        },
        {
          id: 'analysis-garment',
          type: 'analysis',
          inputs: { sourceNode: 'input-garment' },
          params: { analysisType: 'garment' }
        },
        {
          id: 'generation',
          type: 'generation',
          inputs: {},
          params: {
            mode: 'tryon',
            prompt: promptBuilderService.buildTryOnPrompt(
              '{{analysis-model}}',
              '{{analysis-garment}}',
              this.getActionDescription(request.action),
              request.keepBackground,
              request.enhanceLighting
            ),
            referenceImages: ['input-model', 'input-garment'],
            aspectRatio: request.aspectRatio || '3:4',
            imageSize: request.imageSize || '2K'
          }
        },
        {
          id: 'output',
          type: 'output',
          inputs: { sourceNode: 'generation' },
          params: {}
        }
      ]

      const edges: WorkflowEdge[] = [
        { from: 'input-model', to: 'analysis-model', inputKey: 'image' },
        { from: 'input-garment', to: 'analysis-garment', inputKey: 'image' },
        { from: 'analysis-model', to: 'generation', inputKey: 'modelDesc' },
        { from: 'analysis-garment', to: 'generation', inputKey: 'garmentDesc' },
        { from: 'generation', to: 'output', inputKey: 'result' }
      ]

      // 执行工作流
      const result = await workflowRunner.execute(nodes, edges, (progress, message, nodeId) => {
        // 映射进度到业务语义
        const progressMap: Record<string, number> = {
          'analysis-model': 20,
          'analysis-garment': 40,
          'generation': 70,
          'output': 100
        }
        const mappedProgress = progressMap[nodeId] || progress
        const mappedMessage = this.mapNodeMessage(nodeId, message)
        onProgress?.(mappedProgress, mappedMessage)
      })

      if (result.success) {
        const imageUrl = result.results.get('output')
        return {
          success: true,
          imageUrl
        }
      } else {
        const error = Array.from(result.errors.values())[0]
        return {
          success: false,
          error
        }
      }

    } catch (error) {
      console.error('[TryOnService] generateTryOn error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成失败，请稍后重试'
      }
    }
  }

  /**
   * 快速生成（简化流程，跳过详细分析）
   */
  async quickGenerate(
    modelImageUrl: string,
    garmentImageUrl: string,
    action: string,
    onProgress?: ProgressCallback
  ): Promise<TryOnResponse> {
    try {
      onProgress?.(20, '正在处理图片...')

      const actionDesc = this.getActionDescription(action)
      const prompt = promptBuilderService.buildTryOnPrompt(
        '保持原模特特征',
        '穿着图2中的服装',
        actionDesc,
        true,
        false
      )

      onProgress?.(50, '正在生成虚拟试穿图...')

      const result = await imageGenerationService.generateTryOn(
        '保持原模特特征',
        '穿着图2中的服装',
        actionDesc,
        modelImageUrl,
        garmentImageUrl
      )

      onProgress?.(100, '生成完成！')

      if (result.success) {
        return { success: true, imageUrl: result.imageUrl }
      } else {
        return { success: false, error: result.error }
      }

    } catch (error) {
      console.error('[TryOnService] quickGenerate error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成失败'
      }
    }
  }

  /**
   * 使用自定义提示词生成
   */
  async generateByCustomPrompt(
    prompt: string,
    modelImageUrl: string,
    garmentImageUrl: string,
    options?: {
      aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9'
      imageSize?: '1K' | '2K' | '4K'
      temperature?: number
    }
  ): Promise<string> {
    console.log('[TryOnService] Generating with custom prompt:', prompt)
    
    const result = await imageGenerationService.generate(
      'custom',
      prompt,
      [modelImageUrl, garmentImageUrl],
      options
    )

    if (!result.success) {
      throw new Error(result.error)
    }

    return result.imageUrl!
  }

  /**
   * 映射节点消息到用户友好的提示
   */
  private mapNodeMessage(nodeId: string, message: string): string {
    const messageMap: Record<string, string> = {
      'analysis-model': '正在分析模特图...',
      'analysis-garment': '正在分析服装图...',
      'generation': '正在生成虚拟试穿图...',
      'output': '处理完成！'
    }
    return messageMap[nodeId] || message
  }
}

// 导出单例（保持向后兼容）
export const tryOnService = new TryOnService()
export default TryOnService
