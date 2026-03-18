/**
 * A+ 页面生成业务服务
 *
 * 封装 A+ 增值服务的业务逻辑，从 listing store 上下文构建输入并调用 aPlusGenAgent
 */

import { aPlusGenAgent, aPlusModuleRewriteAgent, aPlusModuleImageAgent } from './pipeline/agents/aPlusGenAgent'
import type {
  StrategyPrompts,
  AnalysisReport,
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

export interface APlusGenParams {
  userEditablePrompt: string
  strategyPrompts: StrategyPrompts
  analysisReport: AnalysisReport
  generatedListing: GeneratedListingResult
  productInfo?: UserProductInfo | null
  userListingData?: ExtractedProductData | null
  mainImageUrl?: string | null
  generatedImages?: string[]
  settings?: APlusGenSettings
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
      generatedListing
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
      generatedListing: params.generatedListing,
      productContext,
      referenceImages,
      settings: params.settings,
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
    const productContext = this.buildProductContext(productInfo, userListingData, generatedListing)
    const input: APlusModuleRewriteInput = {
      userEditablePrompt: params.userEditablePrompt,
      strategyPrompts: params.strategyPrompts,
      analysisReport: params.analysisReport,
      generatedListing: params.generatedListing,
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
    const productContext = this.buildProductContext(productInfo, userListingData, generatedListing)
    const referenceImages = this.buildReferenceImages(mainImageUrl, generatedImages, productInfo, userListingData)
    const input: APlusModuleImageInput = {
      userEditablePrompt: params.userEditablePrompt,
      strategyPrompts: params.strategyPrompts,
      analysisReport: params.analysisReport,
      generatedListing: params.generatedListing,
      productContext,
      referenceImages,
      module: params.module,
    }
    const progressAdapter = (info: { progress: number; message: string }) =>
      onProgress?.(info.progress, info.message)
    return aPlusModuleImageAgent(input, progressAdapter)
  }

  private buildProductContext(
    productInfo?: UserProductInfo | null,
    userListingData?: ExtractedProductData | null,
    generatedListing?: GeneratedListingResult
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
        bulletPoints: bullets.length ? bullets : [],
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
      bulletPoints: generatedListing?.bulletPoints ?? [],
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
   * 构建默认可编辑提示词（策略 + 分析摘要）
   */
  buildDefaultPrompt(
    strategyPrompts: StrategyPrompts,
    analysisReport: AnalysisReport
  ): string {
    const base = strategyPrompts.aPlusGuidancePrompt || ''
    const narrative = analysisReport.aPlusAnalysis?.narrativeStrategy
    if (narrative) {
      return base + (base ? '\n\n' : '') + `【叙事策略】${narrative}`
    }
    return base
  }
}

export const aplusService = new APlusService()
