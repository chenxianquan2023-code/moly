/**
 * Agent 4: StrategyAgent — 策略提示词生成
 *
 * 基于分析报告，生成精炼的英文策略提示词片段，
 * 作为"隐藏上下文"注入到后续 Listing 生成的 prompt 中。
 */

import { geminiService } from '@/services/gemini.service'
import type {
  StrategyInput,
  StrategyPrompts,
  ProgressCallback,
} from '../types'
import { safeParseJson } from '../utils'

const AGENT_NAME = 'StrategyAgent'

function buildStrategyPrompt(input: StrategyInput): string {
  const report = input.analysisReport
  const kw = report.keywords
  const title = report.titleAnalysis
  const bullets = report.bulletPointsAnalysis
  const desc = report.descriptionAnalysis
  const mainImg = report.mainImageAnalysis
  const diff = report.differentiationAnalysis

  const hasCompetitorData =
    (diff.competitorWeaknesses?.length ?? 0) > 0 ||
    (title.competitorPatterns?.length ?? 0) > 0

  const userContext = input.mode === 'optimize' && input.userListing
    ? `
User's current listing (ASIN: ${input.userListing.asin}):
- Title: ${input.userListing.title}
- Bullet Points: ${input.userListing.bulletPoints.join(' | ')}
- Original Diagnosis: ${report.originalListingDiagnosis || 'N/A'}
`
    : input.mode === 'create' && input.userProduct
    ? `
User's new product:
- Name: ${input.userProduct.name}
- Brand: ${input.userProduct.brand ?? ''}
- Category: ${input.userProduct.category}
- Specs: ${input.userProduct.specs ?? ''}
- Price Range: ${input.userProduct.priceRange ?? ''}
- Target Audience: ${input.userProduct.targetAudience ?? ''}
- Use Cases: ${input.userProduct.useCases ?? ''}
- Differentiators: ${input.userProduct.differentiators ?? ''}
- Additional Notes: ${input.userProduct.features ?? ''}
- Target Market: ${input.userProduct.market}
`
    : ''

  const coreKw = (kw.coreKeywords || []).join(', ') || '(from analysis)'
  const longTail = (kw.longTailKeywords || []).join(', ') || '(from analysis)'
  const sceneKw = (kw.sceneKeywords || []).join(', ') || '(from analysis)'
  const mustInclude = (title.mustIncludeWords || []).join(', ') || '(see formula)'
  const bulletOrder = (bullets.recommendedOrder || []).join(' → ') || '(see recommendedStyle)'
  const competitorWeak = (diff.competitorWeaknesses || []).join('; ') || 'N/A (best-practices mode)'
  const diffSuggestions = (diff.differentiationSuggestions || []).join('; ') || 'Emphasize product strengths'

  return `
You are an Amazon Listing optimization strategist. Based on the ${hasCompetitorData ? 'competitive' : 'market/category best-practices'} analysis below, generate precise STRATEGY PROMPTS that will be injected into a listing-generation AI model to produce a high-quality, commercial-grade listing.

These prompts are NOT shown to the user — they serve as hidden context to guide the AI.

【Mode】${input.mode === 'create' ? 'Creating a new listing from scratch' : 'Optimizing an existing listing'}

${userContext}

【Analysis Summary】
Core Keywords: ${coreKw}
Long-tail Keywords: ${longTail}
Scene Keywords: ${sceneKw}
Recommended Title Formula: ${title.recommendedFormula || '[Brand] + [Core Keyword] + [Key Feature] + [Scene]'}
Must-include Words: ${mustInclude}
Avg Title Length: ${title.avgLength || 180} chars
Recommended Bullet Order: ${bulletOrder}
Recommended Writing Style: ${bullets.recommendedStyle || 'Functional, benefit-focused'}
Description Strategy: ${desc.recommendedStrategy || 'Clear value proposition and use cases'}
Main Image Direction: ${mainImg.recommendedDirection || 'Professional product shot, white background, 85%+ fill'}
Competitor Weaknesses / Gaps: ${competitorWeak}
Differentiation Suggestions: ${diffSuggestions}
Pricing Recommendation: ${diff.pricingRecommendation || 'Competitive positioning'}

Output the following JSON (no markdown fences):
{
  "titlePrompt": "A detailed instruction for the AI on exactly how to write the title: structure, keyword placement, length constraint, what words MUST be included. Be very specific.",
  "bulletPointsPrompt": "A detailed instruction for the AI on how to write each of the 5 bullet points: what topic each bullet should cover, writing style (emotional/functional/scene-based), formatting tips, keywords to embed.",
  "descriptionPrompt": "A detailed instruction for the AI on the product description: narrative style, paragraph structure, key selling points to emphasize, call-to-action.",
  "searchTermsPrompt": "A detailed instruction on which search terms to include: list specific long-tail keywords, related terms that must be covered.",
  "imageGuidancePrompt": "Guidance for main image and secondary image creation: composition, angle, what to show in each position, A+ module recommendations. Must be specific and actionable.",
  "aPlusGuidancePrompt": "Guidance for A+ page creation: recommended module sequence, content strategy for each module, visual style."
}

Requirements:
1. Each prompt must be specific and actionable, not generic advice
2. Include actual keywords from the analysis
3. ${hasCompetitorData ? 'Reference competitive insights as constraints (e.g., title length from competitor patterns)' : 'Apply Amazon category best practices and SEO guidelines'}
4. For optimize mode, explicitly mention what to FIX from the original listing
5. Write in English since these prompts will be used to generate English listings
6. imageGuidancePrompt and aPlusGuidancePrompt must never be empty — provide concrete visual guidance
`.trim()
}

export async function strategyAgent(
  input: StrategyInput,
  onProgress?: ProgressCallback
): Promise<StrategyPrompts> {
  console.log(`\n========== [${AGENT_NAME}] 开始执行 ==========`)
  console.log(`[${AGENT_NAME}] 模式: ${input.mode}`)

  onProgress?.({
    agent: AGENT_NAME,
    step: 4,
    totalSteps: 6,
    progress: 10,
    message: '正在生成 Listing 创作策略...',
  })

  const prompt = buildStrategyPrompt(input)
  console.log(`[${AGENT_NAME}] Prompt 长度: ${prompt.length} 字符`)

  onProgress?.({
    agent: AGENT_NAME,
    step: 4,
    totalSteps: 6,
    progress: 40,
    message: 'AI 正在生成策略提示词...',
  })

  const raw = await geminiService.generateText(prompt)

  const fallback: StrategyPrompts = {
    titlePrompt: '',
    bulletPointsPrompt: '',
    descriptionPrompt: '',
    searchTermsPrompt: '',
    imageGuidancePrompt: '',
    aPlusGuidancePrompt: '',
  }

  const result = safeParseJson<StrategyPrompts>(raw, fallback)

  console.log(`[${AGENT_NAME}] ✓ 策略提示词生成完成:`)
  console.log(`  标题策略: ${result.titlePrompt?.substring(0, 80)}...`)
  console.log(`  五点策略: ${result.bulletPointsPrompt?.substring(0, 80)}...`)
  console.log(`  描述策略: ${result.descriptionPrompt?.substring(0, 80)}...`)
  console.log(`  搜索词策略: ${result.searchTermsPrompt?.substring(0, 80)}...`)
  console.log(`  图片策略: ${result.imageGuidancePrompt?.substring(0, 80)}...`)
  console.log(`  A+策略: ${result.aPlusGuidancePrompt?.substring(0, 80)}...`)

  onProgress?.({
    agent: AGENT_NAME,
    step: 4,
    totalSteps: 6,
    progress: 100,
    message: '策略生成完成',
  })

  console.log(`========== [${AGENT_NAME}] 执行完毕 ==========\n`)

  return result
}
