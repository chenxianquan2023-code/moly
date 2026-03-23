/**
 * Agent 5: ListingGenAgent — Listing 生成
 *
 * 结合用户商品信息 + Agent 4 生成的策略提示词，
 * 生成高质量的 Amazon Listing（标题、五点、描述、搜索词）。
 */

import { geminiService } from '@/services/gemini.service'
import type {
  ListingGenInput,
  GeneratedListingResult,
  ProgressCallback,
} from '../types'
import { safeParseJson } from '../utils'

const AGENT_NAME = 'ListingGenAgent'

function buildListingPrompt(input: ListingGenInput): string {
  const strategy = input.strategyPrompts

  const productContext = input.mode === 'create' && input.userProduct
    ? `
【Product Information - USER-PROVIDED FACTS ONLY. Use these exactly. Do NOT invent.】
- Product Name: ${input.userProduct.name}
- Brand: ${input.userProduct.brand ?? ''}
- Category: ${input.userProduct.category}
- Specs: ${input.userProduct.specs ?? ''}
- Price Range: ${input.userProduct.priceRange ?? ''}
- Target Audience: ${input.userProduct.targetAudience ?? ''}
- Use Cases: ${input.userProduct.useCases ?? ''}
- Differentiators: ${input.userProduct.differentiators ?? ''}
- Additional Notes: ${input.userProduct.features ?? ''}
${input.userProduct.categoryExtras && Object.keys(input.userProduct.categoryExtras).length > 0
  ? `- Category Extras: ${JSON.stringify(input.userProduct.categoryExtras)}`
  : ''}
- Target Market: ${input.market}
`
    : input.mode === 'optimize' && input.userListing
    ? `
【Current Listing to Optimize】
- ASIN: ${input.userListing.asin}
- Current Title: ${input.userListing.title}
- Current Bullet Points:
${input.userListing.bulletPoints.map((bp, i) => `  ${i + 1}. ${bp}`).join('\n')}
- Current Description: ${input.userListing.description?.substring(0, 500) || '(none)'}
- Brand: ${input.userListing.brand}
- Target Market: ${input.market}
`
    : ''

  return `
You are an elite Amazon Listing copywriter with deep expertise in SEO, conversion optimization, and consumer psychology.

${input.mode === 'create'
    ? 'Create a brand-new Amazon Listing from scratch based on the product information and strategy below.'
    : 'Optimize the existing Amazon Listing based on the current listing data and strategy below. Significantly improve upon the original while maintaining brand identity.'}

${productContext}

=== STRATEGY CONTEXT (from competitive analysis) ===

【Title Strategy】
${strategy.titlePrompt}

【Bullet Points Strategy】
${strategy.bulletPointsPrompt}

【Description Strategy】
${strategy.descriptionPrompt}

【Search Terms Strategy】
${strategy.searchTermsPrompt}

=== END STRATEGY CONTEXT ===

Output language: ${input.language === 'en' ? 'English' : input.language === 'de' ? 'German' : input.language === 'ja' ? 'Japanese' : 'English'}

Output the following JSON (no markdown fences):
{
  "title": "The optimized product title (follow the title strategy above precisely)",
  "bulletPoints": [
    "Bullet point 1 (follow the bullet strategy for position 1)",
    "Bullet point 2 (follow the bullet strategy for position 2)",
    "Bullet point 3 (follow the bullet strategy for position 3)",
    "Bullet point 4 (follow the bullet strategy for position 4)",
    "Bullet point 5 (follow the bullet strategy for position 5)"
  ],
  "description": "The product description (follow the description strategy above)",
  "searchTerms": ["term1", "term2", "term3", "term4", "term5", "term6", "term7", "term8"],
  "targetAudience": "A brief description of the target audience for this product"
}

Critical requirements:
1. CRITICAL - You MUST only use facts explicitly provided in 【Product Information】. Do NOT invent, assume, or hallucinate any product attributes (brand, specs, price, features, use cases, differentiators, etc.). If a piece of information is not provided by the user, do NOT add it to the listing. Your role is to structure and optimize the presentation of USER-PROVIDED facts according to the strategy.
2. The title MUST follow the exact structure specified in the Title Strategy
3. Each bullet point MUST address the specific topic assigned to it in the Bullet Points Strategy
4. The description MUST follow the narrative style specified in the Description Strategy
5. Search terms MUST include the specific keywords mentioned in the Search Terms Strategy
6. Every piece of text must be compelling, professional, and conversion-oriented
7. Do NOT use generic filler words — every word should serve SEO or conversion purpose
`.trim()
}

export async function listingGenAgent(
  input: ListingGenInput,
  onProgress?: ProgressCallback
): Promise<GeneratedListingResult> {
  console.log(`\n========== [${AGENT_NAME}] 开始执行 ==========`)
  console.log(`[${AGENT_NAME}] 模式: ${input.mode}`)
  console.log(`[${AGENT_NAME}] 语言: ${input.language}`)
  console.log(`[${AGENT_NAME}] 市场: ${input.market}`)

  onProgress?.({
    agent: AGENT_NAME,
    step: 5,
    totalSteps: 6,
    progress: 10,
    message: '正在生成 Listing 文案...',
  })

  const prompt = buildListingPrompt(input)
  console.log(`[${AGENT_NAME}] Prompt 长度: ${prompt.length} 字符`)

  onProgress?.({
    agent: AGENT_NAME,
    step: 5,
    totalSteps: 6,
    progress: 40,
    message: 'AI 正在撰写 Listing...',
  })

  const raw = await geminiService.generateText(prompt)

  const fallback: GeneratedListingResult = {
    title: '',
    bulletPoints: [],
    description: '',
    searchTerms: [],
    targetAudience: '',
  }

  const result = safeParseJson<GeneratedListingResult>(raw, fallback)

  console.log(`[${AGENT_NAME}] ✓ Listing 生成完成:`)
  console.log(`  标题 (${result.title?.length} 字符): ${result.title?.substring(0, 80)}...`)
  console.log(`  五点数量: ${result.bulletPoints?.length}`)
  console.log(`  描述长度: ${result.description?.length} 字符`)
  console.log(`  搜索词数量: ${result.searchTerms?.length}`)
  console.log(`  目标受众: ${result.targetAudience?.substring(0, 60)}`)

  onProgress?.({
    agent: AGENT_NAME,
    step: 5,
    totalSteps: 6,
    progress: 100,
    message: 'Listing 文案生成完成',
  })

  console.log(`========== [${AGENT_NAME}] 执行完毕 ==========\n`)

  return result
}
