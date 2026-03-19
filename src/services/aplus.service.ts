/**
 * A+ 页面生成业务服务
 *
 * 封装 A+ 增值服务的业务逻辑，从 listing store 上下文构建输入并调用 aPlusGenAgent
 */

import { aPlusGenAgent, aPlusModuleRewriteAgent, aPlusModuleImageAgent } from './pipeline/agents/aPlusGenAgent'
import { aplusPromptGenAgent } from './pipeline/agents/aplusPromptGenAgent'
import type {
  StrategyPrompts,
  AnalysisReport,
  APlusPromptBlocks,
  APlusVisualPlanResult,
  GeneratedListingResult,
  GeneratedAPlusResult,
  APlusGenInput,
  APlusGenSettings,
  APlusModuleRewriteInput,
  APlusModuleImageInput,
  GeneratedAPlusModule,
  UserProductInfo,
  ExtractedProductData,
} from './pipeline/types'

export type APlusProgressCallback = (progress: number, message: string) => void

export type APlusAnalysisProgressCallback = (info: { step?: number; totalSteps?: number; progress?: number; message: string }) => void

export interface APlusAnalysisResult {
  strategyPrompts: StrategyPrompts
  analysisReport: AnalysisReport
  /** 四块式可编辑提示词（中文） */
  promptBlocks: APlusPromptBlocks
  /** 新：全局规范 + 模块规划 */
  visualPlan: APlusVisualPlanResult
}

export interface APlusGenParams {
  userEditablePrompt: string
  strategyPrompts: StrategyPrompts
  analysisReport: AnalysisReport
  generatedListing?: GeneratedListingResult | null
  productInfo?: UserProductInfo | null
  userListingData?: ExtractedProductData | null
  mainImageUrl?: string | null
  generatedImages?: string[]
  settings?: APlusGenSettings
  onContentReady?: (modules: GeneratedAPlusModule[]) => void
  onModuleImageReady?: (index: number, module: GeneratedAPlusModule) => void
}

export class APlusService {
  /**
   * 从 listing 上下文生成 A+ 页面
   */
  async generateAPlus(
    params: APlusGenParams,
    onProgress?: APlusProgressCallback
  ): Promise<GeneratedAPlusResult> {
    const { productInfo, userListingData, generatedListing, mainImageUrl, generatedImages } = params

    const productContext = this.buildProductContext(
      productInfo,
      userListingData,
      generatedListing,
      params.analysisReport
    )
    const referenceImages = this.buildReferenceImages(
      mainImageUrl,
      generatedImages,
      productInfo,
      userListingData
    )

    const input: APlusGenInput = {
      userEditablePrompt: params.userEditablePrompt,
      strategyPrompts: params.strategyPrompts,
      analysisReport: params.analysisReport,
      generatedListing: params.generatedListing ?? undefined,
      productContext,
      referenceImages,
      settings: params.settings,
      onContentReady: params.onContentReady,
      onModuleImageReady: params.onModuleImageReady,
    }

    const progressAdapter = (info: { progress: number; message: string }) =>
      onProgress?.(info.progress, info.message)

    return aPlusGenAgent(input, progressAdapter)
  }

  async rewriteModule(
    params: APlusGenParams & { module: GeneratedAPlusModule; locked?: { headline?: boolean; body?: boolean; image?: boolean } },
    onProgress?: APlusProgressCallback
  ): Promise<GeneratedAPlusModule> {
    const { productInfo, userListingData, generatedListing } = params
    const productContext = this.buildProductContext(productInfo, userListingData, generatedListing, params.analysisReport)
    const input: APlusModuleRewriteInput = {
      userEditablePrompt: params.userEditablePrompt,
      strategyPrompts: params.strategyPrompts,
      analysisReport: params.analysisReport,
      generatedListing: params.generatedListing ?? undefined,
      productContext,
      settings: params.settings,
      module: params.module,
      locked: params.locked,
    }
    const progressAdapter = (info: { progress: number; message: string }) =>
      onProgress?.(info.progress, info.message)
    return aPlusModuleRewriteAgent(input, progressAdapter)
  }

  async generateModuleImage(
    params: APlusGenParams & { module: GeneratedAPlusModule },
    onProgress?: APlusProgressCallback
  ): Promise<GeneratedAPlusModule> {
    const { productInfo, userListingData, generatedListing, mainImageUrl, generatedImages } = params
    const productContext = this.buildProductContext(productInfo, userListingData, generatedListing, params.analysisReport)
    const referenceImages = this.buildReferenceImages(mainImageUrl, generatedImages, productInfo, userListingData)
    const input: APlusModuleImageInput = {
      userEditablePrompt: params.userEditablePrompt,
      strategyPrompts: params.strategyPrompts,
      analysisReport: params.analysisReport,
      generatedListing: params.generatedListing ?? undefined,
      productContext,
      referenceImages,
      settings: params.settings,
      module: params.module,
    }
    const progressAdapter = (info: { progress: number; message: string }) =>
      onProgress?.(info.progress, info.message)
    return aPlusModuleImageAgent(input, progressAdapter)
  }

  private buildProductContext(
    productInfo?: UserProductInfo | null,
    userListingData?: ExtractedProductData | null,
    generatedListing?: GeneratedListingResult | null,
    analysisReport?: AnalysisReport
  ): APlusGenInput['productContext'] {
    if (productInfo) {
      const bullets = generatedListing?.bulletPoints ?? []
      return {
        productName: productInfo.name,
        brand: productInfo.brand ?? '',
        features: [productInfo.features, productInfo.specs, productInfo.differentiators]
          .filter(Boolean)
          .join('; '),
        category: productInfo.category,
        // 若未生成 Listing，则用分析报告提供的五点主题作为占位参考（保证不虚构）
        bulletPoints: bullets.length ? bullets : (analysisReport?.bulletPointsAnalysis?.recommendedOrder ?? []),
      }
    }
    if (userListingData) {
      const bullets =
        (generatedListing?.bulletPoints?.length ?? 0) > 0
          ? (generatedListing?.bulletPoints ?? [])
          : userListingData.bulletPoints ?? []
      return {
        productName: userListingData.title ?? '',
        brand: userListingData.brand ?? '',
        features: [userListingData.description, userListingData.bulletPoints?.join(' ')]
          .filter(Boolean)
          .join(' ').substring(0, 500),
        category: userListingData.categoryPath ?? 'other',
        bulletPoints: bullets,
      }
    }
    return {
      productName: generatedListing?.title ?? 'Product',
      brand: '',
      features: generatedListing?.description?.substring(0, 300) ?? '',
      category: 'other',
      bulletPoints: generatedListing?.bulletPoints ?? (analysisReport?.bulletPointsAnalysis?.recommendedOrder ?? []),
    }
  }

  private buildReferenceImages(
    mainImageUrl?: string | null,
    generatedImages?: string[],
    productInfo?: UserProductInfo | null,
    userListingData?: ExtractedProductData | null
  ): string[] {
    const list: string[] = []
    if (mainImageUrl) list.push(mainImageUrl)
    if (generatedImages?.length) list.push(...generatedImages)
    if (productInfo?.images?.length) list.push(...productInfo.images)
    if (userListingData?.mainImageUrl) list.push(userListingData.mainImageUrl)
    return [...new Set(list)]
  }

  /**
   * A+ 向导专用：基于用户输入生成策略（无市场/竞品分析）
   */
  async runAPlusAnalysis(
    userProduct: UserProductInfo,
    options: { market?: string; language?: string; moduleCount?: number; templateId?: string },
    onProgress?: APlusAnalysisProgressCallback
  ): Promise<APlusAnalysisResult> {
    const progressAdapter = (info: { agent?: string; step?: number; totalSteps?: number; progress?: number; message?: string }) =>
      onProgress?.({ step: info.step, totalSteps: info.totalSteps, progress: info.progress, message: info.message || '分析中…' })
    return aplusPromptGenAgent(
      {
        userProduct,
        market: options.market,
        language: options.language,
        moduleCount: options.moduleCount,
        templateId: options.templateId,
      },
      progressAdapter
    )
  }

  /**
   * 从四块构建合并后的提示词（供下游策略使用）
   */
  buildMergedPromptFromBlocks(blocks: APlusPromptBlocks): string {
    const parts = [
      (blocks.colorPlanning?.trim()) ? `【智能色彩规划】\n${blocks.colorPlanning.trim()}` : '',
      (blocks.lightShadow?.trim()) ? `【物理级光影重建】\n${blocks.lightShadow.trim()}` : '',
      (blocks.featureStructure?.trim()) ? `【结构化卖点编排】\n${blocks.featureStructure.trim()}` : '',
      (blocks.marketingNarrative?.trim()) ? `【AI 营销叙事】\n${blocks.marketingNarrative.trim()}` : '',
      (blocks.narrativeStrategy?.trim()) ? `【叙事策略】${blocks.narrativeStrategy.trim()}` : '',
    ].filter(Boolean)
    return parts.join('\n\n')
  }

  /**
   * 构建默认可编辑提示词（策略 + 分析摘要）；若传入 blocks 则优先用 blocks 合并
   */
  buildDefaultPrompt(
    strategyPrompts: StrategyPrompts,
    analysisReport: AnalysisReport,
    blocks?: APlusPromptBlocks | null
  ): string {
    if (blocks) {
      return this.buildMergedPromptFromBlocks(blocks)
    }
    const base = strategyPrompts.aPlusGuidancePrompt || ''
    const narrative = analysisReport.aPlusAnalysis?.narrativeStrategy
    if (narrative) {
      return base + (base ? '\n\n' : '') + `【叙事策略】${narrative}`
    }
    return base
  }
}

export const aplusService = new APlusService()
