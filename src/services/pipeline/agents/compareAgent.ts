/**
 * Agent 6: CompareAgent — 对比分析（仅优化模式）
 *
 * 将用户原 Listing 与优化后的 Listing 逐项对比，
 * 生成可视化对比报告，标注每处改动的原因。
 */

import { geminiService } from '@/services/gemini.service'
import type {
  CompareInput,
  CompareResult,
  ProgressCallback,
} from '../types'
import { safeParseJson } from '../utils'

const AGENT_NAME = 'CompareAgent'

function buildComparePrompt(input: CompareInput): string {
  const { originalListing, optimizedListing, analysisReport } = input

  return `
你是一位 Amazon Listing 优化顾问。请对比用户的原始 Listing 和优化后的 Listing，逐项分析改动内容和改动原因。

报告使用中文输出。

【原始 Listing (${originalListing.asin})】
标题: ${originalListing.title}
五点描述:
${originalListing.bulletPoints.map((bp, i) => `  ${i + 1}. ${bp}`).join('\n')}
产品描述: ${originalListing.description?.substring(0, 500) || '(无)'}
隐含关键词: ${originalListing.implicitKeywords?.join(', ') || '(无)'}

【优化后 Listing】
标题: ${optimizedListing.title}
五点描述:
${optimizedListing.bulletPoints.map((bp, i) => `  ${i + 1}. ${bp}`).join('\n')}
产品描述: ${optimizedListing.description?.substring(0, 500) || '(无)'}
搜索关键词: ${optimizedListing.searchTerms?.join(', ') || '(无)'}

【竞品分析洞察参考】
核心关键词: ${analysisReport.keywords.coreKeywords.join(', ')}
竞品标题公式: ${analysisReport.titleAnalysis.recommendedFormula}
竞品共同弱点: ${analysisReport.differentiationAnalysis.competitorWeaknesses.join('; ')}
差异化建议: ${analysisReport.differentiationAnalysis.differentiationSuggestions.join('; ')}
${analysisReport.originalListingDiagnosis ? `原Listing诊断: ${analysisReport.originalListingDiagnosis}` : ''}

请按以下 JSON 格式输出对比报告（不要包含 markdown 代码块标记）：
{
  "items": [
    {
      "dimension": "标题",
      "original": "原始标题全文",
      "optimized": "优化后标题全文",
      "changeReason": "详细说明改了什么、为什么这么改（引用竞品分析的依据）"
    },
    {
      "dimension": "五点描述-第1条",
      "original": "原始第1条",
      "optimized": "优化后第1条",
      "changeReason": "改动原因"
    },
    {
      "dimension": "五点描述-第2条",
      "original": "原始第2条",
      "optimized": "优化后第2条",
      "changeReason": "改动原因"
    },
    {
      "dimension": "五点描述-第3条",
      "original": "原始第3条",
      "optimized": "优化后第3条",
      "changeReason": "改动原因"
    },
    {
      "dimension": "五点描述-第4条",
      "original": "原始第4条",
      "optimized": "优化后第4条",
      "changeReason": "改动原因"
    },
    {
      "dimension": "五点描述-第5条",
      "original": "原始第5条",
      "optimized": "优化后第5条",
      "changeReason": "改动原因"
    },
    {
      "dimension": "产品描述",
      "original": "原始描述（可截断）",
      "optimized": "优化后描述（可截断）",
      "changeReason": "改动原因"
    },
    {
      "dimension": "搜索关键词",
      "original": "原始隐含关键词",
      "optimized": "优化后搜索关键词",
      "changeReason": "改动原因"
    }
  ],
  "overallSummary": "整体优化总结：这次优化主要在哪些方面做了提升，预期效果如何",
  "expectedImprovements": [
    "预期提升1：如搜索排名可能因关键词覆盖提升而提高",
    "预期提升2：如转化率可能因卖点突出而提升",
    "预期提升3：如点击率可能因标题优化而提升"
  ]
}

要求：
1. 每一条改动都必须说明具体改了什么
2. changeReason 必须引用竞品分析中的具体发现作为依据
3. 如果原始某条为空/缺失，在 original 中标注"(原始缺失)"
4. overallSummary 要给出整体评价，让用户一眼看懂优化价值
`.trim()
}

export async function compareAgent(
  input: CompareInput,
  onProgress?: ProgressCallback
): Promise<CompareResult> {
  console.log(`\n========== [${AGENT_NAME}] 开始执行 ==========`)
  console.log(`[${AGENT_NAME}] 原始 ASIN: ${input.originalListing.asin}`)

  onProgress?.({
    agent: AGENT_NAME,
    step: 6,
    totalSteps: 6,
    progress: 10,
    message: '正在生成原始 vs 优化对比报告...',
  })

  const prompt = buildComparePrompt(input)
  console.log(`[${AGENT_NAME}] Prompt 长度: ${prompt.length} 字符`)

  onProgress?.({
    agent: AGENT_NAME,
    step: 6,
    totalSteps: 6,
    progress: 40,
    message: 'AI 正在逐项对比分析...',
  })

  const raw = await geminiService.generateText(prompt)

  const fallback: CompareResult = {
    items: [],
    overallSummary: '',
    expectedImprovements: [],
  }

  const result = safeParseJson<CompareResult>(raw, fallback)

  console.log(`[${AGENT_NAME}] ✓ 对比报告生成完成:`)
  console.log(`  对比项数: ${result.items?.length}`)
  console.log(`  总结: ${result.overallSummary?.substring(0, 80)}...`)
  console.log(`  预期提升: ${result.expectedImprovements?.length} 条`)

  onProgress?.({
    agent: AGENT_NAME,
    step: 6,
    totalSteps: 6,
    progress: 100,
    message: '对比分析完成',
  })

  console.log(`========== [${AGENT_NAME}] 执行完毕 ==========\n`)

  return result
}
