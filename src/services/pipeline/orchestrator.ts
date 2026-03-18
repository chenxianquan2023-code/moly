/**
 * Pipeline Orchestrator — 多 Agent 协作调度器
 *
 * 负责串联所有 Agent 的执行顺序和数据流：
 *
 * 初创模式:
 *   WebFetch → DataExtract → Analysis → Strategy → ListingGen
 *
 * 优化模式:
 *   WebFetch → DataExtract → Analysis → Strategy → ListingGen → Compare
 */

import { webFetchAgent } from './agents/webFetchAgent'
import { dataExtractAgent } from './agents/dataExtractAgent'
import { analysisAgent } from './agents/analysisAgent'
import { strategyAgent } from './agents/strategyAgent'
import { listingGenAgent } from './agents/listingGenAgent'
import { compareAgent } from './agents/compareAgent'
import type {
  PipelineMode,
  PipelineResult,
  PipelineProgress,
  ProgressCallback,
  UserProductInfo,
  WebFetchInput,
  ExtractedProductData,
  AnalysisReport,
  StrategyPrompts,
} from './types'

/** 分析 Pipeline 返回值（仅执行到 Strategy，不含 ListingGen/Compare） */
export interface AnalysisPipelineResult {
  mode: PipelineMode
  extractedData: ExtractedProductData[]
  analysisReport: AnalysisReport
  strategyPrompts: StrategyPrompts
  userListingData?: ExtractedProductData
}

interface CreateModeParams {
  mode: 'create'
  userProduct: UserProductInfo
  competitorAsins?: string[]
  market: string
  language: string
}

interface OptimizeModeParams {
  mode: 'optimize'
  userAsin: string
  competitorAsins?: string[]
  market: string
  language: string
  targetKeywords?: string[]
  targetAudience?: string
}

export type PipelineParams = CreateModeParams | OptimizeModeParams

export class PipelineOrchestrator {
  private onProgress?: ProgressCallback
  private aborted = false

  constructor(onProgress?: ProgressCallback) {
    this.onProgress = onProgress
  }

  abort() {
    this.aborted = true
    console.log('[Pipeline] 收到中止信号')
  }

  private checkAbort() {
    if (this.aborted) {
      throw new Error('Pipeline 已被用户中止')
    }
  }

  private emitProgress(info: PipelineProgress) {
    this.onProgress?.(info)
  }

  /**
   * 执行完整 Pipeline
   */
  async run(params: PipelineParams): Promise<PipelineResult> {
    const startTime = Date.now()
    const competitorAsins = (params.competitorAsins ?? [])
      .map(a => (typeof a === 'string' ? a.trim() : ''))
      .filter(a => a.length >= 10)
    const hasCompetitors = competitorAsins.length > 0

    console.log('\n╔══════════════════════════════════════════════════╗')
    console.log('║        Moly 多 Agent Pipeline 开始执行           ║')
    console.log('╚══════════════════════════════════════════════════╝')
    console.log(`模式: ${params.mode}`)
    console.log(`市场: ${params.market}`)
    console.log(`语言: ${params.language}`)
    console.log(`竞品: ${hasCompetitors ? competitorAsins.join(', ') : '无（类目最佳实践模式）'}`)
    if (params.mode === 'optimize') {
      console.log(`用户 ASIN: ${params.userAsin}`)
    }

    let extractedData: ExtractedProductData[] = []
    let userListingData: ExtractedProductData | undefined
    let competitorData: ExtractedProductData[] = []

    try {
      if (hasCompetitors) {
        // ============================================================
        // 有竞品：WebFetch → DataExtract
        // ============================================================
        this.checkAbort()
        this.emitProgress({
          agent: 'Pipeline',
          step: 1,
          totalSteps: params.mode === 'optimize' ? 6 : 5,
          progress: 0,
          message: '步骤 1/6: 正在抓取 Amazon 商品页面...',
        })

        const fetchInputs: WebFetchInput[] = competitorAsins.map(asin => ({
          asin: asin.length === 10 ? asin.toUpperCase() : asin,
          market: params.market,
        }))
        if (params.mode === 'optimize') {
          fetchInputs.unshift({ asin: params.userAsin, market: params.market })
        }

        const fetchResults = await webFetchAgent(fetchInputs, this.onProgress)
        const successFetches = fetchResults.filter(r => r.success)

        if (successFetches.length === 0) {
          const apiBase = (import.meta as any)?.env?.VITE_API_BASE || ''
          const sampleErrors = fetchResults
            .slice(0, 3)
            .map(r => `${r.asin}: ${r.error || 'unknown error'}`)
            .join(' | ')
          throw new Error(
            '所有 ASIN 均抓取失败。\n' +
              `- VITE_API_BASE: ${apiBase || '(empty, use relative path)'}\n` +
              `- 示例错误: ${sampleErrors || '(none)'}\n` +
              '请检查：后端是否已启动（默认 3001）、VITE_API_BASE 是否指向后端、以及 ASIN/站点是否有效。'
          )
        }

        this.checkAbort()
        this.emitProgress({
          agent: 'Pipeline',
          step: 2,
          totalSteps: params.mode === 'optimize' ? 6 : 5,
          progress: 0,
          message: '步骤 2/6: 正在提取结构化商品数据...',
        })

        const extractInputs = successFetches.map(f => ({ asin: f.asin, markdown: f.markdown }))
        extractedData = await dataExtractAgent(extractInputs, this.onProgress)

        if (params.mode === 'optimize') {
          userListingData = extractedData.find(d => d.asin === params.userAsin)
          competitorData = extractedData.filter(d => d.asin !== params.userAsin)
        } else {
          competitorData = extractedData
        }

        if (competitorData.length === 0) {
          throw new Error('竞品数据提取失败，无法继续分析')
        }
      } else {
        // ============================================================
        // 无竞品分支
        // ============================================================
        if (params.mode === 'create') {
          // 初创：跳过 WebFetch/DataExtract
          userListingData = undefined
          competitorData = []
        } else {
          // 优化：仅抓取用户 ASIN
          this.checkAbort()
          this.emitProgress({
            agent: 'Pipeline',
            step: 1,
            totalSteps: 6,
            progress: 0,
            message: '步骤 1/6: 正在抓取您的商品页面...',
          })

          const fetchResults = await webFetchAgent(
            [{ asin: params.userAsin, market: params.market }],
            this.onProgress
          )
          const successFetch = fetchResults.find(r => r.success)
          if (!successFetch) {
            throw new Error(
              '您的商品页面抓取失败，请检查 ASIN 是否有效、后端是否已启动（默认 3001）。'
            )
          }

          this.checkAbort()
          this.emitProgress({
            agent: 'Pipeline',
            step: 2,
            totalSteps: 6,
            progress: 0,
            message: '步骤 2/6: 正在提取商品数据...',
          })

          extractedData = await dataExtractAgent(
            [{ asin: successFetch.asin, markdown: successFetch.markdown }],
            this.onProgress
          )
          userListingData = extractedData[0]
          competitorData = []
        }
      }

      // ============================================================
      // Step 3: AnalysisAgent — 8 维度深度分析（含无竞品最佳实践模式）
      // ============================================================
      this.checkAbort()
      this.emitProgress({
        agent: 'Pipeline',
        step: 3,
        totalSteps: params.mode === 'optimize' ? 6 : 5,
        progress: 0,
        message: hasCompetitors
          ? '步骤 3/6: 正在进行 8 维度深度分析...'
          : '正在进行类目最佳实践分析...',
      })

      const analysisInput: {
        competitors: ExtractedProductData[]
        userProduct?: UserProductInfo
        userListing?: ExtractedProductData
        mode: PipelineMode
        targetKeywords?: string[]
        targetAudience?: string
      } = {
        competitors: competitorData,
        userProduct: params.mode === 'create' ? params.userProduct : undefined,
        userListing: userListingData,
        mode: params.mode,
      }
      if (params.mode === 'optimize') {
        if (params.targetKeywords?.length) analysisInput.targetKeywords = params.targetKeywords
        if (params.targetAudience) analysisInput.targetAudience = params.targetAudience
      }

      const analysisReport = await analysisAgent(analysisInput, this.onProgress)

      console.log('\n📊 [Pipeline] 分析报告摘要:')
      console.log(`  关键词: ${analysisReport.keywords.coreKeywords.slice(0, 5).join(', ')}...`)
      console.log(`  标题公式: ${analysisReport.titleAnalysis.recommendedFormula}`)
      console.log(`  差异化机会: ${analysisReport.differentiationAnalysis.differentiationSuggestions.length} 条`)

      // ============================================================
      // Step 4: StrategyAgent — 生成策略提示词
      // ============================================================
      this.checkAbort()
      this.emitProgress({
        agent: 'Pipeline',
        step: 4,
        totalSteps: params.mode === 'optimize' ? 6 : 5,
        progress: 0,
        message: '步骤 4/6: 正在生成创作策略...',
      })

      const strategyPrompts = await strategyAgent(
        {
          analysisReport,
          userProduct: params.mode === 'create' ? params.userProduct : undefined,
          userListing: userListingData,
          mode: params.mode,
        },
        this.onProgress
      )

      // ============================================================
      // Step 5: ListingGenAgent — 生成 Listing
      // ============================================================
      this.checkAbort()
      this.emitProgress({
        agent: 'Pipeline',
        step: 5,
        totalSteps: params.mode === 'optimize' ? 6 : 5,
        progress: 0,
        message: '步骤 5/6: 正在生成 Listing 文案...',
      })

      const generatedListing = await listingGenAgent(
        {
          userProduct: params.mode === 'create' ? params.userProduct : undefined,
          userListing: userListingData,
          strategyPrompts,
          mode: params.mode,
          language: params.language,
          market: params.market,
        },
        this.onProgress
      )

      // ============================================================
      // Step 6 (优化模式): CompareAgent — 对比分析
      // ============================================================
      let comparison

      if (params.mode === 'optimize' && userListingData) {
        this.checkAbort()
        this.emitProgress({
          agent: 'Pipeline',
          step: 6,
          totalSteps: 6,
          progress: 0,
          message: '步骤 6/6: 正在生成优化对比报告...',
        })

        comparison = await compareAgent(
          {
            originalListing: userListingData,
            optimizedListing: generatedListing,
            analysisReport,
          },
          this.onProgress
        )
      }

      // ============================================================
      // 完成
      // ============================================================
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

      const result: PipelineResult = {
        mode: params.mode,
        extractedData,
        analysisReport,
        strategyPrompts,
        generatedListing,
        comparison,
      }

      console.log('\n╔══════════════════════════════════════════════════╗')
      console.log('║        Moly 多 Agent Pipeline 执行完毕           ║')
      console.log('╚══════════════════════════════════════════════════╝')
      console.log(`总耗时: ${elapsed} 秒`)
      console.log(`提取数据: ${extractedData.length} 条`)
      console.log(`生成标题: ${generatedListing.title?.substring(0, 60)}...`)
      if (comparison) {
        console.log(`对比项数: ${comparison.items?.length}`)
      }

      this.emitProgress({
        agent: 'Pipeline',
        step: params.mode === 'optimize' ? 6 : 5,
        totalSteps: params.mode === 'optimize' ? 6 : 5,
        progress: 100,
        message: `Pipeline 执行完成，耗时 ${elapsed} 秒`,
      })

      return result
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.error(`\n[Pipeline] 执行失败 (${elapsed}s):`, error)
      throw error
    }
  }

  /**
   * 仅执行分析 Pipeline：WebFetch → DataExtract → Analysis → Strategy
   * 用于整合到 listing 业务流，文案生成和生图由 listing.service 完成
   */
  async runAnalysisOnly(params: PipelineParams): Promise<AnalysisPipelineResult> {
    const startTime = Date.now()
    const totalSteps = 4
    const competitorAsins = (params.competitorAsins ?? [])
      .map(a => (typeof a === 'string' ? a.trim() : ''))
      .filter(a => a.length >= 10)
    const hasCompetitors = competitorAsins.length > 0

    console.log('\n╔══════════════════════════════════════════════════╗')
    console.log('║        Moly 分析 Pipeline 开始执行               ║')
    console.log('╚══════════════════════════════════════════════════╝')
    console.log(`模式: ${params.mode}`)
    console.log(`市场: ${params.market}`)
    console.log(`竞品: ${hasCompetitors ? competitorAsins.join(', ') : '无（类目最佳实践模式）'}`)
    if (params.mode === 'optimize') {
      console.log(`用户 ASIN: ${params.userAsin}`)
    }

    let extractedData: ExtractedProductData[] = []
    let userListingData: ExtractedProductData | undefined
    let competitorData: ExtractedProductData[] = []

    try {
      if (hasCompetitors) {
        // 有竞品：WebFetch → DataExtract
        this.checkAbort()
        this.emitProgress({
          agent: 'Pipeline',
          step: 1,
          totalSteps,
          progress: 0,
          message: '步骤 1/4: 正在抓取 Amazon 商品页面...',
        })

        const fetchInputs: WebFetchInput[] = competitorAsins.map(asin => ({
          asin: asin.length === 10 ? asin.toUpperCase() : asin,
          market: params.market,
        }))
        if (params.mode === 'optimize') {
          fetchInputs.unshift({ asin: params.userAsin, market: params.market })
        }

        const fetchResults = await webFetchAgent(fetchInputs, this.onProgress)
        const successFetches = fetchResults.filter(r => r.success)

        if (successFetches.length === 0) {
          const apiBase = (import.meta as any)?.env?.VITE_API_BASE || ''
          const sampleErrors = fetchResults
            .slice(0, 3)
            .map(r => `${r.asin}: ${r.error || 'unknown error'}`)
            .join(' | ')
          throw new Error(
            '所有 ASIN 均抓取失败。\n' +
              `- VITE_API_BASE: ${apiBase || '(empty, use relative path)'}\n` +
              `- 示例错误: ${sampleErrors || '(none)'}\n` +
              '请检查：后端是否已启动（默认 3001）、VITE_API_BASE 是否指向后端、以及 ASIN/站点是否有效。'
          )
        }

        this.checkAbort()
        this.emitProgress({
          agent: 'Pipeline',
          step: 2,
          totalSteps,
          progress: 0,
          message: '步骤 2/4: 正在提取结构化商品数据...',
        })

        extractedData = await dataExtractAgent(
          successFetches.map(f => ({ asin: f.asin, markdown: f.markdown })),
          this.onProgress
        )

        if (params.mode === 'optimize') {
          userListingData = extractedData.find(d => d.asin === params.userAsin)
          competitorData = extractedData.filter(d => d.asin !== params.userAsin)
        } else {
          competitorData = extractedData
        }

        if (competitorData.length === 0) {
          throw new Error('竞品数据提取失败，无法继续分析')
        }
      } else {
        // 无竞品分支
        if (params.mode === 'create') {
          competitorData = []
          userListingData = undefined
        } else {
          this.checkAbort()
          this.emitProgress({
            agent: 'Pipeline',
            step: 1,
            totalSteps,
            progress: 0,
            message: '步骤 1/4: 正在抓取您的商品页面...',
          })

          const fetchResults = await webFetchAgent(
            [{ asin: params.userAsin, market: params.market }],
            this.onProgress
          )
          const successFetch = fetchResults.find(r => r.success)
          if (!successFetch) {
            throw new Error('您的商品页面抓取失败，请检查 ASIN 是否有效、后端是否已启动。')
          }

          this.checkAbort()
          this.emitProgress({
            agent: 'Pipeline',
            step: 2,
            totalSteps,
            progress: 0,
            message: '步骤 2/4: 正在提取商品数据...',
          })

          extractedData = await dataExtractAgent(
            [{ asin: successFetch.asin, markdown: successFetch.markdown }],
            this.onProgress
          )
          userListingData = extractedData[0]
          competitorData = []
        }
      }

      // Step 3: AnalysisAgent
      this.checkAbort()
      this.emitProgress({
        agent: 'Pipeline',
        step: 3,
        totalSteps,
        progress: 0,
        message: hasCompetitors
          ? '步骤 3/4: 正在进行 8 维度深度分析...'
          : '正在进行类目最佳实践分析...',
      })

      const analysisInput: {
        competitors: ExtractedProductData[]
        userProduct?: UserProductInfo
        userListing?: ExtractedProductData
        mode: PipelineMode
        targetKeywords?: string[]
        targetAudience?: string
      } = {
        competitors: competitorData,
        userProduct: params.mode === 'create' ? params.userProduct : undefined,
        userListing: userListingData,
        mode: params.mode,
      }
      if (params.mode === 'optimize') {
        if (params.targetKeywords?.length) analysisInput.targetKeywords = params.targetKeywords
        if (params.targetAudience) analysisInput.targetAudience = params.targetAudience
      }

      const analysisReport = await analysisAgent(analysisInput, this.onProgress)

      // Step 4: StrategyAgent
      this.checkAbort()
      this.emitProgress({
        agent: 'Pipeline',
        step: 4,
        totalSteps,
        progress: 0,
        message: '步骤 4/4: 正在生成创作策略...',
      })

      const strategyPrompts = await strategyAgent(
        {
          analysisReport,
          userProduct: params.mode === 'create' ? params.userProduct : undefined,
          userListing: userListingData,
          mode: params.mode,
        },
        this.onProgress
      )

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

      this.emitProgress({
        agent: 'Pipeline',
        step: 4,
        totalSteps,
        progress: 100,
        message: `分析完成，耗时 ${elapsed} 秒`,
      })

      console.log('\n╔══════════════════════════════════════════════════╗')
      console.log('║        Moly 分析 Pipeline 执行完毕               ║')
      console.log('╚══════════════════════════════════════════════════╝')
      console.log(`总耗时: ${elapsed} 秒`)

      return {
        mode: params.mode,
        extractedData,
        analysisReport,
        strategyPrompts,
        userListingData,
      }
    } catch (error) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.error(`\n[Pipeline] 分析执行失败 (${elapsed}s):`, error)
      throw error
    }
  }
}

/**
 * 快捷函数：创建并执行 Pipeline
 */
export async function runPipeline(
  params: PipelineParams,
  onProgress?: ProgressCallback
): Promise<PipelineResult> {
  const orchestrator = new PipelineOrchestrator(onProgress)
  return orchestrator.run(params)
}

/**
 * 仅执行分析 Pipeline（WebFetch → DataExtract → Analysis → Strategy）
 * 用于 listing 业务的「竞品分析」和「AI 分析」步骤
 */
export async function runAnalysisPipeline(
  params: PipelineParams,
  onProgress?: ProgressCallback
): Promise<AnalysisPipelineResult> {
  const orchestrator = new PipelineOrchestrator(onProgress)
  return orchestrator.runAnalysisOnly(params)
}
