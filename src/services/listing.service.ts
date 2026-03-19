/**
 * Listing 业务服务
 *
 * 封装 ASIN 分析、竞品分析、Listing 文案生成、图片生成、优化等能力，
 * 底层复用 geminiService 和 imageGenerationService。
 * 整合 Pipeline 后：分析由 runAnalysisPipeline 完成，此处提供基于策略的文案/生图。
 */

import { geminiService } from './gemini.service'
import { imageGenerationService, type GenerationResult } from './atomic/imageGeneration.service'
import { LISTING_PROMPTS } from '@/config/listing.config'
import { listingGenAgent } from './pipeline/agents/listingGenAgent'
import { compareAgent } from './pipeline/agents/compareAgent'
import type { StrategyPrompts, ExtractedProductData, AnalysisReport } from './pipeline/types'

export interface AsinAnalysisResult {
  productName: string
  category: string
  overallScore: number
  strengths: { aspect: string; detail: string }[]
  weaknesses: { aspect: string; detail: string }[]
  suggestions: string[]
  keywordsFound: string[]
  keywordsMissing: string[]
}

export interface CompetitorAnalysisResult {
  competitorHighlights: string[]
  competitorWeaknesses: string[]
  topKeywords: string[]
  pricingInsight: string
  differentiationOpportunities: string[]
}

export interface ImageAnalysisResult {
  visualFeatures: string[]
  productType: string
  colorScheme: string
  materialTexture: string
  sellingPoints: string[]
}

export interface GeneratedListing {
  title: string
  bulletPoints: string[]
  description: string
  searchTerms: string[]
  targetAudience?: string
  improvements?: string[]
}

export interface ProductInfo {
  name: string
  category: string
  features: string
  market: string
  language: string
  images: string[]
  brand: string
  specs: string
  priceRange: string
  targetAudience: string
  useCases: string
  differentiators: string
  categoryExtras?: Record<string, string>
}

export interface FetchedListing {
  asin: string
  url: string
  title: string
  bulletPoints: string[]
  description: string
  price: string
  rating: string
  reviewCount: string
  imageUrls: string[]
  brand: string
  category: string
}

export interface ComplianceItem {
  rule: string
  passed: boolean
  detail: string
}

export interface ComplianceResult {
  passed: boolean
  score: number
  items: ComplianceItem[]
}

type ProgressCallback = (progress: number, message: string) => void

class ListingService {
  /**
   * 从用户输入中提取 ASIN（支持 ASIN 码或 Amazon 链接）
   */
  extractAsin(input: string): string | null {
    const trimmed = input.trim()
    const asinPattern = /^[A-Z0-9]{10}$/
    if (asinPattern.test(trimmed)) return trimmed

    // 支持多种 Amazon 链接格式：/dp/、/gp/product/、/gp/aw/d/、?asin=、/exec/obidos/ASIN/ 等
    const urlPatterns = [
      /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i,
      /[?&]asin=([A-Z0-9]{10})/i,
      /\/exec\/obidos\/ASIN\/([A-Z0-9]{10})/i,
      /\/product\/([A-Z0-9]{10})/i,
    ]
    for (const re of urlPatterns) {
      const match = trimmed.match(re)
      if (match) return match[1].toUpperCase()
    }
    return null
  }

  /**
   * 从后端抓取 Amazon 商品真实数据
   */
  async fetchListing(asin: string, market: string = 'us'): Promise<FetchedListing | null> {
    const API_BASE = import.meta.env.VITE_API_BASE || ''
    try {
      const res = await fetch(`${API_BASE}/api/amazon/fetch-listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asin, market }),
      })
      const data = await res.json()
      if (data.success && data.listing) {
        return data.listing as FetchedListing
      }
      console.warn('[ListingService] Fetch listing failed:', data.message)
      return null
    } catch (err) {
      console.error('[ListingService] Fetch listing error:', err)
      return null
    }
  }

  /**
   * 获取上次抓取的 Listing 原始数据
   */
  getLastFetchedListing(): FetchedListing | null {
    return this._lastFetchedListing
  }

  private _lastFetchedListing: FetchedListing | null = null

  /**
   * 分析商品图片
   */
  async analyzeProductImages(
    imageUrls: string[],
    productName: string,
    features: string,
    onProgress?: ProgressCallback
  ): Promise<ImageAnalysisResult> {
    onProgress?.(10, '正在上传图片到 AI...')
    const prompt = LISTING_PROMPTS.analyzeProductImages(productName, features)

    onProgress?.(40, '正在识别商品特征...')
    const raw = await geminiService.generateWithImages(prompt, imageUrls)

    onProgress?.(90, '图片分析完成')
    const result = this.parseJson<ImageAnalysisResult>(raw, {
      visualFeatures: [],
      productType: '',
      colorScheme: '',
      materialTexture: '',
      sellingPoints: [],
    })

    onProgress?.(100, '完成')
    return result
  }

  /**
   * 生成完整 Listing 文案
   */
  async generateListingText(
    productInfo: ProductInfo,
    imageAnalysis?: string,
    competitorAnalysis?: string,
    onProgress?: ProgressCallback
  ): Promise<GeneratedListing> {
    onProgress?.(10, '正在构建生成策略...')

    const marketLabel = productInfo.market === 'us' ? 'Amazon.com (美国)'
      : productInfo.market === 'uk' ? 'Amazon.co.uk (英国)'
      : productInfo.market === 'jp' ? 'Amazon.co.jp (日本)'
      : 'Amazon.com (美国)'

    const prompt = LISTING_PROMPTS.generateListing({
      productName: productInfo.name,
      category: productInfo.category,
      features: productInfo.features,
      market: marketLabel,
      language: productInfo.language,
      imageAnalysis,
      competitorAnalysis,
    })

    onProgress?.(30, '正在生成标题...')
    const raw = await geminiService.generateText(prompt)

    onProgress?.(80, '正在优化文案...')
    const result = this.parseJson<GeneratedListing>(raw, {
      title: '',
      bulletPoints: [],
      description: '',
      searchTerms: [],
    })

    onProgress?.(100, '文案生成完成')
    return result
  }

  /**
   * 生成商品图片
   */
  async generateListingImage(
    productName: string,
    features: string,
    referenceImages: string[],
    style: string = 'professional',
    onProgress?: ProgressCallback
  ): Promise<GenerationResult> {
    onProgress?.(10, '正在准备图片生成...')
    const prompt = LISTING_PROMPTS.generateProductImage(productName, features, style)

    onProgress?.(30, '正在调用 AI 生图...')
    const result = await imageGenerationService.generate(
      'custom',
      prompt,
      referenceImages,
      { aspectRatio: '1:1', imageSize: '2K' }
    )

    onProgress?.(100, result.success ? '图片生成成功' : '图片生成失败')
    return result
  }

  /**
   * 生成 Amazon 合规主图（纯白背景，基于实拍图）
   */
  async generateMainImage(
    referenceImages: string[],
    productName: string,
    features: string,
    onProgress?: ProgressCallback
  ): Promise<GenerationResult> {
    onProgress?.(10, '正在准备主图生成...')
    const prompt = LISTING_PROMPTS.generateMainImage(productName, features)

    onProgress?.(30, '正在基于实拍图生成 Amazon 合规主图...')
    const result = await imageGenerationService.generate(
      'custom',
      prompt,
      referenceImages,
      { aspectRatio: '1:1', imageSize: '2K', temperature: 0.5 }
    )

    onProgress?.(100, result.success ? '主图生成成功' : '主图生成失败')
    return result
  }

  /**
   * 基于 Pipeline 策略生成 Listing 文案（整合后主入口）
   */
  async generateListingTextFromStrategy(
    params: {
      mode: 'create' | 'optimize'
      userProduct?: ProductInfo
      userListing?: ExtractedProductData
      strategyPrompts: StrategyPrompts
      language: string
      market: string
    },
    onProgress?: ProgressCallback
  ): Promise<GeneratedListing> {
    onProgress?.(10, '正在构建生成策略...')

    const pipelineProgress = (info: { progress?: number; message?: string }) => {
      const p = info.progress ?? 50
      const msg = info.message ?? '正在生成...'
      onProgress?.(p, msg)
    }

    const userProductForPipeline =
      params.userProduct && params.mode === 'create'
        ? {
            name: params.userProduct.name,
            category: params.userProduct.category,
            features: params.userProduct.features,
            market: params.userProduct.market,
            language: params.userProduct.language,
            images: params.userProduct.images,
            brand: params.userProduct.brand ?? '',
            specs: params.userProduct.specs ?? '',
            priceRange: params.userProduct.priceRange ?? '',
            targetAudience: params.userProduct.targetAudience ?? '',
            useCases: params.userProduct.useCases ?? '',
            differentiators: params.userProduct.differentiators ?? '',
            categoryExtras: params.userProduct.categoryExtras,
          }
        : undefined

    const result = await listingGenAgent(
      {
        userProduct: userProductForPipeline,
        userListing: params.userListing,
        strategyPrompts: params.strategyPrompts,
        mode: params.mode,
        language: params.language,
        market: params.market,
      },
      pipelineProgress
    )

    onProgress?.(100, '文案生成完成')
    return {
      ...result,
      targetAudience: result.targetAudience,
    }
  }

  /**
   * 基于 Pipeline 策略生成主图（完整策略作为 prompt 的一部分）
   * @param complianceFailures 可选，主图不合规时的检测失败原因，重试时会喂给生图模型以便修正
   */
  async generateMainImageFromStrategy(
    referenceImages: string[],
    productName: string,
    features: string,
    strategyPrompts: StrategyPrompts,
    onProgress?: ProgressCallback,
    complianceFailures?: string
  ): Promise<GenerationResult> {
    onProgress?.(10, '正在准备主图生成...')

    const strategyText = [
      strategyPrompts.imageGuidancePrompt,
      strategyPrompts.titlePrompt,
      strategyPrompts.bulletPointsPrompt,
      strategyPrompts.descriptionPrompt,
      strategyPrompts.aPlusGuidancePrompt,
    ]
      .filter(Boolean)
      .join('\n\n')

    const promptFn = (LISTING_PROMPTS as typeof LISTING_PROMPTS & {
      generateMainImageFromStrategy: (a: string, b: string, c: string, d?: string) => string
    }).generateMainImageFromStrategy
    const prompt = promptFn
      ? promptFn(productName, features, strategyText, complianceFailures)
      : LISTING_PROMPTS.generateMainImage(productName, features)

    onProgress?.(30, '正在基于策略生成 Amazon 合规主图...')
    const result = await imageGenerationService.generate(
      'custom',
      prompt,
      referenceImages,
      { aspectRatio: '1:1', imageSize: '2K', temperature: 0.5 }
    )

    onProgress?.(100, result.success ? '主图生成成功' : '主图生成失败')
    return result
  }

  /**
   * 对比原 Listing 与优化后 Listing（优化模式使用）
   */
  async compareListing(
    originalListing: ExtractedProductData,
    optimizedListing: { title: string; bulletPoints: string[]; description: string; searchTerms: string[] },
    analysisReport: AnalysisReport,
    onProgress?: ProgressCallback
  ): Promise<{ items: { dimension: string; original: string; optimized: string; changeReason: string }[]; overallSummary: string; expectedImprovements: string[] }> {
    onProgress?.(20, '正在生成优化对比报告...')

    const result = await compareAgent(
      {
        originalListing,
        optimizedListing: {
          ...optimizedListing,
          targetAudience: '',
        },
        analysisReport,
      },
      (info) => onProgress?.(info.progress ?? 80, info.message ?? '对比中...')
    )

    onProgress?.(100, '对比报告生成完成')
    return result
  }

  /**
   * Amazon 主图合规检测（9 条规则逐项检查）
   */
  async checkMainImageCompliance(
    imageUrl: string,
    onProgress?: ProgressCallback
  ): Promise<ComplianceResult> {
    onProgress?.(10, '正在启动合规检测...')
    const prompt = LISTING_PROMPTS.checkMainImageCompliance()

    onProgress?.(40, '正在逐项检查 Amazon 主图规范...')
    const raw = await geminiService.generateWithImagesUsingFlash(prompt, [imageUrl])

    onProgress?.(90, '正在整理检测报告...')
    const result = this.parseJson<ComplianceResult>(raw, {
      passed: false,
      score: 0,
      items: [],
    })

    onProgress?.(100, result.passed ? '合规检测通过' : '存在不合规项')
    return result
  }

  /**
   * 安全解析 JSON，带 fallback
   */
  private parseJson<T>(raw: string, fallback: T): T {
    try {
      let cleaned = raw.trim()
      const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (fenceMatch) cleaned = fenceMatch[1].trim()
      return JSON.parse(cleaned) as T
    } catch {
      console.warn('[ListingService] JSON parse failed, using fallback. Raw:', raw.substring(0, 200))
      return fallback
    }
  }
}

export const listingService = new ListingService()
export default ListingService
