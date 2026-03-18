/**
 * Agent 3: AnalysisAgent — 8 维度深度分析（核心 Agent）
 *
 * 基于所有竞品的结构化数据，进行关键词、标题、五点、描述、主图、
 * 副图、A+、差异化共 8 个维度的深度分析，输出中文分析报告。
 */

import { geminiService } from '@/services/gemini.service'
import type {
  AnalysisInput,
  AnalysisReport,
  ProgressCallback,
} from '../types'
import { safeParseJson } from '../utils'

const AGENT_NAME = 'AnalysisAgent'

function buildNoCompetitorPrompt(input: AnalysisInput): string {
  const userContext = input.mode === 'optimize' && input.userListing
    ? `
【待优化的用户 Listing (${input.userListing.asin})】
标题: ${input.userListing.title}
品牌: ${input.userListing.brand}
价格: ${input.userListing.price}
五点描述:
${input.userListing.bulletPoints.map((bp, j) => `  ${j + 1}. ${bp}`).join('\n')}
产品描述: ${input.userListing.description?.substring(0, 300) || '(无)'}
隐含关键词: ${input.userListing.implicitKeywords?.join(', ') || '(无)'}
`
    : input.mode === 'create' && input.userProduct
    ? `
【用户的新商品信息】
商品名称: ${input.userProduct.name}
品牌: ${input.userProduct.brand ?? ''}
类目: ${input.userProduct.category}
规格: ${input.userProduct.specs ?? ''}
价格区间: ${input.userProduct.priceRange ?? ''}
目标受众: ${input.userProduct.targetAudience ?? ''}
使用场景: ${input.userProduct.useCases ?? ''}
差异化卖点: ${input.userProduct.differentiators ?? ''}
补充说明: ${input.userProduct.features ?? ''}
目标市场: ${input.userProduct.market}
`
    : ''

  const extraConstraints =
    input.mode === 'optimize' && (input.targetKeywords?.length || input.targetAudience)
      ? `
【用户补充（请优先采纳）】
${input.targetKeywords?.length ? `目标关键词: ${input.targetKeywords.join(', ')}` : ''}
${input.targetAudience ? `目标受众: ${input.targetAudience}` : ''}
`
      : ''

  return `
你是一位资深的 Amazon Listing 策略分析师，精通 SEO、消费者心理学和电商视觉设计。

当前为「无竞品模式」：用户未提供竞品数据。请基于 Amazon 类目最佳实践、官方 SEO 规范、高转化文案规则，以及你对同类商品的行业认知，为以下商品输出达到商业化标准的 8 维度分析报告。分析必须具体、可执行、有洞察力，不得泛泛而谈。

【分析模式】${input.mode === 'create' ? '初创 Listing（用户要从零创建新 Listing）' : '优化 Listing（用户要优化已有 Listing）'}
${userContext}
${extraConstraints}

请按以下 JSON 格式输出完整的 8 维度分析报告（不要包含 markdown 代码块标记）：
{
  "keywords": {
    "coreKeywords": ["基于商品类目和特点推导的核心关键词，8-12个，按搜索量/转化价值排序"],
    "longTailKeywords": ["长尾关键词，5-8个"],
    "sceneKeywords": ["场景词/使用场景关键词，5-8个"],
    "priorityRanking": [
      {"keyword": "关键词", "priority": "必放标题/建议五点/可选后台", "reason": "排优先级的理由"}
    ]
  },
  "titleAnalysis": {
    "competitorPatterns": [],
    "avgLength": 180,
    "recommendedFormula": "推荐的标题公式，如：[Brand] + [Core Keyword] + [Key Feature] + [Material] + [Scene/Use]，需符合 Amazon 200 字符限制",
    "mustIncludeWords": ["标题中必须包含的核心词"]
  },
  "bulletPointsAnalysis": {
    "competitorStrategies": [],
    "writingStyleBreakdown": "该类目高转化五点常用风格：功能型/情感型/场景型的建议比例",
    "recommendedOrder": ["第1条建议写什么", "第2条建议写什么", "第3条建议写什么", "第4条建议写什么", "第5条建议写什么"],
    "recommendedStyle": "推荐的写作风格和技巧（突出卖点、避免违禁词、符合 A9 算法）"
  },
  "descriptionAnalysis": {
    "competitorNarrativeStyles": [],
    "recommendedStrategy": "推荐的描述写作策略（故事化/功能罗列/场景代入等）",
    "recommendedLength": "推荐的描述长度和段落结构"
  },
  "mainImageAnalysis": {
    "competitorCompositions": [],
    "hasTextOverlay": false,
    "hasComparisonElements": false,
    "clickThroughStrategy": "提升主图点击率的策略建议（符合 Amazon 主图规范）",
    "recommendedDirection": "推荐的主图拍摄/设计方向（角度、布局、光线、纯白背景等）"
  },
  "secondaryImagesAnalysis": {
    "competitorSequences": [],
    "commonPatterns": [],
    "recommendedSequence": [
      {"position": 1, "content": "第1张副图建议放什么", "purpose": "目的是什么"},
      {"position": 2, "content": "第2张副图建议放什么", "purpose": "目的是什么"}
    ]
  },
  "aPlusAnalysis": {
    "competitorModules": [],
    "layoutStyles": [],
    "recommendedModules": [
      {"order": 1, "type": "品牌故事/对比图/功能展示/场景图等", "purpose": "这个模块的作用"}
    ],
    "narrativeStrategy": "推荐的A+页面叙事策略"
  },
  "differentiationAnalysis": {
    "competitorStrengths": [],
    "competitorWeaknesses": [],
    "priceRange": {"min": "", "max": "", "avg": ""},
    "pricingRecommendation": "基于类目和商品定位的定价建议",
    "differentiationSuggestions": ["具体的差异化/突围建议，基于类目常见痛点"]
  }${input.mode === 'optimize' ? `,
  "originalListingDiagnosis": "对用户原 Listing 的全面诊断：哪些地方做得好、哪些地方有问题、对照 Amazon 最佳实践和 SEO 规范可改进之处"` : ''}
}

分析要求：
1. 必须达到商业化标准，建议具体可执行
2. 关键词需符合该类目搜索习惯和 A9 算法
3. 主图/副图建议需符合 Amazon 官方规范
4. 所有建议要落地，避免空泛
5. 若用户提供了目标关键词或目标受众，务必在分析中体现
`.trim()
}

function buildAnalysisPrompt(input: AnalysisInput): string {
  if (input.competitors.length === 0) {
    return buildNoCompetitorPrompt(input)
  }

  const competitorSummaries = input.competitors.map((c, i) => `
--- 竞品 ${i + 1} (${c.asin}) ---
标题: ${c.title}
品牌: ${c.brand}
价格: ${c.price}
评分: ${c.rating}
销量: ${c.salesVolume}
类目: ${c.categoryPath}
五点描述:
${c.bulletPoints.map((bp, j) => `  ${j + 1}. ${bp}`).join('\n')}
产品描述: ${c.description?.substring(0, 300) || '(无)'}
主图: ${c.mainImageUrl ? '有' : '无'}
副图数量: ${c.secondaryImageUrls?.length || 0}
A+模块数量: ${c.aPlusContent?.modules?.length || 0}
A+叙事风格: ${c.aPlusContent?.narrativeStyle || '(无)'}
A+模块详情:
${(c.aPlusContent?.modules || []).map((m, j) => `  模块${j + 1}: [${m.type}] ${m.headline} - ${m.body?.substring(0, 100)}`).join('\n') || '  (无A+内容)'}
隐含关键词: ${c.implicitKeywords?.join(', ') || '(无)'}
`).join('\n')

  const userContext = input.mode === 'optimize' && input.userListing
    ? `
【待优化的用户 Listing (${input.userListing.asin})】
标题: ${input.userListing.title}
品牌: ${input.userListing.brand}
价格: ${input.userListing.price}
评分: ${input.userListing.rating}
五点描述:
${input.userListing.bulletPoints.map((bp, j) => `  ${j + 1}. ${bp}`).join('\n')}
产品描述: ${input.userListing.description?.substring(0, 300) || '(无)'}
A+模块数量: ${input.userListing.aPlusContent?.modules?.length || 0}
隐含关键词: ${input.userListing.implicitKeywords?.join(', ') || '(无)'}
`
    : input.mode === 'create' && input.userProduct
    ? `
【用户的新商品信息】
商品名称: ${input.userProduct.name}
品牌: ${input.userProduct.brand ?? ''}
类目: ${input.userProduct.category}
规格: ${input.userProduct.specs ?? ''}
价格区间: ${input.userProduct.priceRange ?? ''}
目标受众: ${input.userProduct.targetAudience ?? ''}
使用场景: ${input.userProduct.useCases ?? ''}
差异化卖点: ${input.userProduct.differentiators ?? ''}
补充说明: ${input.userProduct.features ?? ''}
目标市场: ${input.userProduct.market}
`
    : ''

  return `
你是一位资深的 Amazon Listing 策略分析师，精通 SEO、消费者心理学和电商视觉设计。

请基于以下竞品真实数据，进行 8 个维度的深度分析。分析报告必须使用中文输出，内容要具体、可执行、有洞察力。

【分析模式】${input.mode === 'create' ? '初创 Listing（用户要从零创建新 Listing）' : '优化 Listing（用户要优化已有 Listing）'}

${userContext}

【竞品数据（共 ${input.competitors.length} 个）】
${competitorSummaries}

请按以下 JSON 格式输出完整的 8 维度分析报告（不要包含 markdown 代码块标记）：
{
  "keywords": {
    "coreKeywords": ["从所有竞品中提炼的核心关键词，按重要性排序，8-12个"],
    "longTailKeywords": ["长尾关键词，5-8个"],
    "sceneKeywords": ["场景词/使用场景关键词，5-8个"],
    "priorityRanking": [
      {"keyword": "关键词", "priority": "必放标题/建议五点/可选后台", "reason": "排优先级的理由"}
    ]
  },
  "titleAnalysis": {
    "competitorPatterns": [
      {"asin": "ASIN", "structure": "品牌+核心词+材质+场景 的结构拆解", "length": 标题字符数}
    ],
    "avgLength": 平均标题长度数字,
    "recommendedFormula": "推荐的标题公式，如：[Brand] + [Core Keyword] + [Key Feature] + [Material] + [Scene/Use]",
    "mustIncludeWords": ["标题中必须包含的词"]
  },
  "bulletPointsAnalysis": {
    "competitorStrategies": [
      {"asin": "ASIN", "strategy": "该竞品五点描述的策略总结"}
    ],
    "writingStyleBreakdown": "竞品整体五点写作风格分析（功能型/情感型/场景型的比例和特点）",
    "recommendedOrder": ["第1条建议写什么", "第2条建议写什么", "第3条建议写什么", "第4条建议写什么", "第5条建议写什么"],
    "recommendedStyle": "推荐的写作风格和技巧"
  },
  "descriptionAnalysis": {
    "competitorNarrativeStyles": [
      {"asin": "ASIN", "style": "该竞品描述的叙事风格分析"}
    ],
    "recommendedStrategy": "推荐的描述写作策略",
    "recommendedLength": "推荐的描述长度和段落结构"
  },
  "mainImageAnalysis": {
    "competitorCompositions": [
      {"asin": "ASIN", "composition": "该竞品主图的构图方式、角度、元素分析"}
    ],
    "hasTextOverlay": false,
    "hasComparisonElements": false,
    "clickThroughStrategy": "提升主图点击率的策略建议",
    "recommendedDirection": "推荐的主图拍摄/设计方向（角度、布局、光线等）"
  },
  "secondaryImagesAnalysis": {
    "competitorSequences": [
      {"asin": "ASIN", "sequence": ["第1张副图内容", "第2张副图内容", "..."]}
    ],
    "commonPatterns": ["竞品副图中的共同模式"],
    "recommendedSequence": [
      {"position": 1, "content": "第1张副图建议放什么", "purpose": "目的是什么"},
      {"position": 2, "content": "第2张副图建议放什么", "purpose": "目的是什么"}
    ]
  },
  "aPlusAnalysis": {
    "competitorModules": [
      {"asin": "ASIN", "modules": ["模块1类型及内容", "模块2类型及内容"]}
    ],
    "layoutStyles": ["竞品A+页面的布局风格总结"],
    "recommendedModules": [
      {"order": 1, "type": "品牌故事/对比图/功能展示/场景图等", "purpose": "这个模块的作用"}
    ],
    "narrativeStrategy": "推荐的A+页面叙事策略"
  },
  "differentiationAnalysis": {
    "competitorStrengths": ["竞品共同的优势"],
    "competitorWeaknesses": ["竞品共同的劣势/不足（用户可以利用的差异化机会）"],
    "priceRange": {"min": "最低价", "max": "最高价", "avg": "平均价"},
    "pricingRecommendation": "基于竞品价格的定价建议",
    "differentiationSuggestions": ["具体的差异化建议"]
  }${input.mode === 'optimize' ? `,
  "originalListingDiagnosis": "对用户原 Listing 的全面诊断：哪些地方做得好、哪些地方有问题、与竞品对比差距在哪里"` : ''}
}

分析要求：
1. 每个维度都必须基于竞品真实数据给出具体分析，不要泛泛而谈
2. 关键词分析要从竞品标题、五点中提取真实使用的高频词
3. 主图和副图分析要根据竞品的实际图片数量和描述给出实用建议
4. A+分析要基于竞品A+的实际模块给出制作指导
5. 差异化分析要从竞品弱点中挖掘机会
6. 所有建议必须可执行，不要给无法落地的建议
`.trim()
}

export async function analysisAgent(
  input: AnalysisInput,
  onProgress?: ProgressCallback
): Promise<AnalysisReport> {
  console.log(`\n========== [${AGENT_NAME}] 开始执行 ==========`)
  console.log(`[${AGENT_NAME}] 分析模式: ${input.mode}`)
  console.log(`[${AGENT_NAME}] 竞品数量: ${input.competitors.length}`)
  if (input.userListing) {
    console.log(`[${AGENT_NAME}] 用户 Listing ASIN: ${input.userListing.asin}`)
  }
  if (input.userProduct) {
    console.log(`[${AGENT_NAME}] 用户商品: ${input.userProduct.name}`)
  }

  onProgress?.({
    agent: AGENT_NAME,
    step: 3,
    totalSteps: 6,
    progress: 10,
    message: '正在进行 8 维度深度分析...',
  })

  const prompt = buildAnalysisPrompt(input)
  console.log(`[${AGENT_NAME}] Prompt 长度: ${prompt.length} 字符`)

  onProgress?.({
    agent: AGENT_NAME,
    step: 3,
    totalSteps: 6,
    progress: 30,
    message: input.competitors.length > 0 ? 'AI 正在分析竞品数据...' : 'AI 正在分析类目最佳实践...',
  })

  const raw = await geminiService.generateText(prompt)

  onProgress?.({
    agent: AGENT_NAME,
    step: 3,
    totalSteps: 6,
    progress: 80,
    message: '正在整理分析报告...',
  })

  const fallback: AnalysisReport = {
    keywords: { coreKeywords: [], longTailKeywords: [], sceneKeywords: [], priorityRanking: [] },
    titleAnalysis: { competitorPatterns: [], avgLength: 0, recommendedFormula: '', mustIncludeWords: [] },
    bulletPointsAnalysis: { competitorStrategies: [], writingStyleBreakdown: '', recommendedOrder: [], recommendedStyle: '' },
    descriptionAnalysis: { competitorNarrativeStyles: [], recommendedStrategy: '', recommendedLength: '' },
    mainImageAnalysis: { competitorCompositions: [], hasTextOverlay: false, hasComparisonElements: false, clickThroughStrategy: '', recommendedDirection: '' },
    secondaryImagesAnalysis: { competitorSequences: [], commonPatterns: [], recommendedSequence: [] },
    aPlusAnalysis: { competitorModules: [], layoutStyles: [], recommendedModules: [], narrativeStrategy: '' },
    differentiationAnalysis: { competitorStrengths: [], competitorWeaknesses: [], priceRange: { min: '', max: '', avg: '' }, pricingRecommendation: '', differentiationSuggestions: [] },
  }

  const result = safeParseJson<AnalysisReport>(raw, fallback)

  console.log(`[${AGENT_NAME}] ✓ 分析完成:`)
  console.log(`  核心关键词: ${result.keywords?.coreKeywords?.length} 个`)
  console.log(`  长尾关键词: ${result.keywords?.longTailKeywords?.length} 个`)
  console.log(`  标题公式: ${result.titleAnalysis?.recommendedFormula?.substring(0, 60)}`)
  console.log(`  五点建议: ${result.bulletPointsAnalysis?.recommendedOrder?.length} 条`)
  console.log(`  差异化建议: ${result.differentiationAnalysis?.differentiationSuggestions?.length} 条`)
  if (result.originalListingDiagnosis) {
    console.log(`  原Listing诊断: ${result.originalListingDiagnosis.substring(0, 80)}...`)
  }

  onProgress?.({
    agent: AGENT_NAME,
    step: 3,
    totalSteps: 6,
    progress: 100,
    message: '8 维度分析完成',
  })

  console.log(`========== [${AGENT_NAME}] 执行完毕 ==========\n`)

  return result
}
