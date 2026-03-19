/**
 * Moly 多 Agent Pipeline — 统一导出
 *
 * Pipeline 架构:
 *   Agent 1: WebFetchAgent   — Jina Reader 抓取 Amazon 页面 → Markdown
 *   Agent 2: DataExtractAgent — AI 提取结构化商品数据
 *   Agent 3: AnalysisAgent    — 8 维度深度分析（关键词/标题/五点/描述/主图/副图/A+/差异化）
 *   Agent 4: StrategyAgent    — 生成隐藏策略提示词
 *   Agent 5: ListingGenAgent  — 基于策略生成高质量 Listing
 *   Agent 6: CompareAgent     — 原始 vs 优化对比（仅优化模式）
 *
 * 使用示例:
 *
 *   import { runPipeline } from '@/services/pipeline'
 *
 *   // 初创模式（userProduct 需包含必填项：name, brand, specs, priceRange, targetAudience, useCases, differentiators）
 *   const result = await runPipeline({
 *     mode: 'create',
 *     userProduct: { name: '...', brand: '...', category: '...', specs: '...', priceRange: '$25-35', targetAudience: '...', useCases: '...', differentiators: '...', features: '...', market: 'us', language: 'en', images: [] },
 *     competitorAsins: ['B0XXXXXXX1', 'B0XXXXXXX2', 'B0XXXXXXX3'],
 *     market: 'us',
 *     language: 'en',
 *   }, (progress) => {
 *     console.log(`[${progress.agent}] ${progress.message}`)
 *   })
 *
 *   // 优化模式
 *   const result = await runPipeline({
 *     mode: 'optimize',
 *     userAsin: 'B0XXXXXXX0',
 *     competitorAsins: ['B0XXXXXXX1', 'B0XXXXXXX2'],
 *     market: 'us',
 *     language: 'en',
 *   }, ...)
 *
 *   // 无竞品模式：competitorAsins 可省略或传空数组，将基于类目最佳实践分析
 *   const result = await runAnalysisPipeline({
 *     mode: 'create',
 *     userProduct: { ... },
 *     competitorAsins: [],  // 或省略
 *     market: 'us',
 *     language: 'en',
 *   }, ...)
 */

export { PipelineOrchestrator, runPipeline, runAnalysisPipeline } from './orchestrator'
export type { PipelineParams, AnalysisPipelineResult } from './orchestrator'

export { webFetchAgent } from './agents/webFetchAgent'
export { dataExtractAgent } from './agents/dataExtractAgent'
export { analysisAgent } from './agents/analysisAgent'
export { strategyAgent } from './agents/strategyAgent'
export { listingGenAgent } from './agents/listingGenAgent'
export { compareAgent } from './agents/compareAgent'
export { aPlusGenAgent } from './agents/aPlusGenAgent'

export type {
  PipelineMode,
  PipelineResult,
  PipelineProgress,
  ProgressCallback,
  UserProductInfo,
  WebFetchInput,
  WebFetchOutput,
  DataExtractInput,
  ExtractedProductData,
  APlusModule,
  AnalysisInput,
  AnalysisReport,
  KeywordAnalysis,
  TitleAnalysis,
  BulletPointsAnalysis,
  DescriptionAnalysis,
  MainImageAnalysis,
  SecondaryImagesAnalysis,
  APlusAnalysis,
  DifferentiationAnalysis,
  StrategyInput,
  StrategyPrompts,
  APlusPromptBlocks,
  ListingGenInput,
  GeneratedListingResult,
  CompareInput,
  CompareResult,
  ComparisonItem,
  APlusGenInput,
  GeneratedAPlusResult,
  GeneratedAPlusModule,
} from './types'
