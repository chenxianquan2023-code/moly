/**
 * 将 Pipeline 的 8 维 AnalysisReport 适配为 AnalysisReport 组件的展示格式
 */

import type { AnalysisReport } from '@/services/pipeline/types'

export interface DisplayAnalysisFormat {
  score?: number
  strengths: { aspect: string; detail: string }[]
  weaknesses: { aspect: string; detail: string }[]
  suggestions: string[]
  keywords: string[]
  missingKeywords: string[]
}

export function adaptPipelineReportToDisplay(report: AnalysisReport): DisplayAnalysisFormat {
  const diff = report.differentiationAnalysis
  const kw = report.keywords

  const strengths = diff.competitorStrengths.map((s) => ({
    aspect: '竞品优势',
    detail: s,
  }))

  const weaknesses = diff.competitorWeaknesses.map((w) => ({
    aspect: '竞品不足',
    detail: w,
  }))

  const suggestions = [...diff.differentiationSuggestions]
  if (diff.pricingRecommendation) {
    suggestions.push(`定价建议: ${diff.pricingRecommendation}`)
  }

  const keywords = [
    ...kw.coreKeywords,
    ...kw.longTailKeywords.slice(0, 5),
  ]

  const missingKeywords: string[] = []
  const usedSet = new Set(keywords.map((k) => k.toLowerCase()))
  for (const w of report.titleAnalysis.mustIncludeWords) {
    if (!usedSet.has(w.toLowerCase())) {
      missingKeywords.push(w)
    }
  }

  const score = computeDisplayScore(report)

  return {
    score,
    strengths,
    weaknesses,
    suggestions,
    keywords,
    missingKeywords,
  }
}

function computeDisplayScore(report: AnalysisReport): number {
  let score = 60
  const diff = report.differentiationAnalysis
  if (diff.differentiationSuggestions.length > 0) {
    score = Math.min(90, 55 + diff.differentiationSuggestions.length * 5)
  }
  if (report.keywords.coreKeywords.length >= 3) score += 5
  if (report.titleAnalysis.recommendedFormula) score += 3
  return Math.min(99, score)
}
