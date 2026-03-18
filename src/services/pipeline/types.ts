/**
 * 多 Agent Pipeline 类型定义
 *
 * 定义了整个 Pipeline 中各 Agent 的输入、输出和数据流结构
 */

// ============================================================
// 通用类型
// ============================================================

export type PipelineMode = 'create' | 'optimize'

export interface PipelineProgress {
  agent: string
  step: number
  totalSteps: number
  progress: number
  message: string
}

export type ProgressCallback = (info: PipelineProgress) => void

// ============================================================
// Agent 1: WebFetchAgent — 网页抓取
// ============================================================

export interface WebFetchInput {
  asin: string
  market: string
}

export interface WebFetchOutput {
  asin: string
  url: string
  markdown: string
  success: boolean
  error?: string
}

// ============================================================
// Agent 2: DataExtractAgent — 数据提取
// ============================================================

export interface DataExtractInput {
  asin: string
  markdown: string
}

export interface APlusModule {
  type: string
  headline: string
  body: string
  imageDescriptions: string[]
}

export interface ExtractedProductData {
  asin: string
  title: string
  brand: string
  price: string
  rating: string
  salesVolume: string
  bulletPoints: string[]
  description: string
  mainImageUrl: string
  secondaryImageUrls: string[]
  aPlusContent: {
    modules: APlusModule[]
    narrativeStyle: string
  }
  implicitKeywords: string[]
  categoryPath: string
}

// ============================================================
// Agent 3: AnalysisAgent — 8 维度深度分析
// ============================================================

/** 优化模式可选补充（无竞品时用户可填） */
export interface OptimizeModeExtraInputs {
  targetKeywords?: string[]
  targetAudience?: string
}

export interface AnalysisInput {
  competitors: ExtractedProductData[]
  userProduct?: UserProductInfo       // 初创模式
  userListing?: ExtractedProductData  // 优化模式
  mode: PipelineMode
  /** 优化模式无竞品时的可选补充 */
  targetKeywords?: string[]
  targetAudience?: string
}

export interface KeywordAnalysis {
  coreKeywords: string[]
  longTailKeywords: string[]
  sceneKeywords: string[]
  priorityRanking: { keyword: string; priority: string; reason: string }[]
}

export interface TitleAnalysis {
  competitorPatterns: { asin: string; structure: string; length: number }[]
  avgLength: number
  recommendedFormula: string
  mustIncludeWords: string[]
}

export interface BulletPointsAnalysis {
  competitorStrategies: { asin: string; strategy: string }[]
  writingStyleBreakdown: string
  recommendedOrder: string[]
  recommendedStyle: string
}

export interface DescriptionAnalysis {
  competitorNarrativeStyles: { asin: string; style: string }[]
  recommendedStrategy: string
  recommendedLength: string
}

export interface MainImageAnalysis {
  competitorCompositions: { asin: string; composition: string }[]
  hasTextOverlay: boolean
  hasComparisonElements: boolean
  clickThroughStrategy: string
  recommendedDirection: string
}

export interface SecondaryImagesAnalysis {
  competitorSequences: { asin: string; sequence: string[] }[]
  commonPatterns: string[]
  recommendedSequence: { position: number; content: string; purpose: string }[]
}

export interface APlusAnalysis {
  competitorModules: { asin: string; modules: string[] }[]
  layoutStyles: string[]
  recommendedModules: { order: number; type: string; purpose: string }[]
  narrativeStrategy: string
}

export interface DifferentiationAnalysis {
  competitorStrengths: string[]
  competitorWeaknesses: string[]
  priceRange: { min: string; max: string; avg: string }
  pricingRecommendation: string
  differentiationSuggestions: string[]
}

export interface AnalysisReport {
  keywords: KeywordAnalysis
  titleAnalysis: TitleAnalysis
  bulletPointsAnalysis: BulletPointsAnalysis
  descriptionAnalysis: DescriptionAnalysis
  mainImageAnalysis: MainImageAnalysis
  secondaryImagesAnalysis: SecondaryImagesAnalysis
  aPlusAnalysis: APlusAnalysis
  differentiationAnalysis: DifferentiationAnalysis
  originalListingDiagnosis?: string  // 优化模式：原 Listing 诊断
}

// ============================================================
// Agent 4: StrategyAgent — 策略提示词
// ============================================================

export interface StrategyInput {
  analysisReport: AnalysisReport
  userProduct?: UserProductInfo
  userListing?: ExtractedProductData
  mode: PipelineMode
}

export interface StrategyPrompts {
  titlePrompt: string
  bulletPointsPrompt: string
  descriptionPrompt: string
  searchTermsPrompt: string
  imageGuidancePrompt: string
  aPlusGuidancePrompt: string
}

// ============================================================
// Agent 5: ListingGenAgent — Listing 生成
// ============================================================

export interface ListingGenInput {
  userProduct?: UserProductInfo
  userListing?: ExtractedProductData
  strategyPrompts: StrategyPrompts
  mode: PipelineMode
  language: string
  market: string
}

export interface GeneratedListingResult {
  title: string
  bulletPoints: string[]
  description: string
  searchTerms: string[]
  targetAudience: string
}

// ============================================================
// Agent 6: CompareAgent — 对比分析（仅优化模式）
// ============================================================

export interface CompareInput {
  originalListing: ExtractedProductData
  optimizedListing: GeneratedListingResult
  analysisReport: AnalysisReport
}

export interface ComparisonItem {
  dimension: string
  original: string
  optimized: string
  changeReason: string
}

export interface CompareResult {
  items: ComparisonItem[]
  overallSummary: string
  expectedImprovements: string[]
}

// ============================================================
// 用户输入
// ============================================================

export interface UserProductInfo {
  name: string
  category: string
  features: string
  market: string
  language: string
  images: string[]
  /** 品牌名（初创模式必填） */
  brand: string
  /** 核心规格，自由文本，如「尺寸 10x5cm，重量 200g，材质不锈钢」 */
  specs: string
  /** 价格区间，如「$25–35」或「£20-30」 */
  priceRange: string
  /** 目标受众 */
  targetAudience: string
  /** 使用场景/典型用途 */
  useCases: string
  /** 差异化卖点（与竞品的核心区别） */
  differentiators: string
  /** 类目可选扩展字段，如 electronics 的 connectivity/battery/waterproof */
  categoryExtras?: Record<string, string>
}

// ============================================================
// A+ 页面生成（增值服务）
// ============================================================

export interface GeneratedAPlusModule {
  type: string
  headline: string
  body: string
  imagePrompt?: string
  imageUrl?: string
}

export interface GeneratedAPlusResult {
  modules: GeneratedAPlusModule[]
}

export interface APlusGenSettings {
  language?: string
  market?: string
  templateId?: string
  moduleCount?: number
  generateImages?: boolean
  enableSelfCheck?: boolean
}

export interface APlusGenInput {
  userEditablePrompt: string
  strategyPrompts: StrategyPrompts
  analysisReport: AnalysisReport
  generatedListing: GeneratedListingResult
  productContext: {
    productName: string
    brand: string
    features: string
    category: string
    bulletPoints: string[]
  }
  referenceImages: string[]
  settings?: APlusGenSettings
}

export interface APlusModuleRewriteInput extends Omit<APlusGenInput, 'referenceImages'> {
  module: GeneratedAPlusModule
  locked?: { headline?: boolean; body?: boolean; image?: boolean }
}

export interface APlusModuleImageInput extends Pick<APlusGenInput, 'productContext' | 'referenceImages' | 'generatedListing' | 'analysisReport' | 'strategyPrompts' | 'userEditablePrompt'> {
  module: GeneratedAPlusModule
}

// ============================================================
// Pipeline 最终输出
// ============================================================

export interface PipelineResult {
  mode: PipelineMode
  extractedData: ExtractedProductData[]
  analysisReport: AnalysisReport
  strategyPrompts: StrategyPrompts
  generatedListing: GeneratedListingResult
  comparison?: CompareResult  // 仅优化模式
}
