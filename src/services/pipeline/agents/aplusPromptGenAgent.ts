/**
 * A+ PromptGen Agent — 基于用户输入的 A+ 视觉营销规划生成
 *
 * 仅基于用户输入生成：全局视觉规范 + 模块化子图提示词（含英文生图 prompt）。
 * 不依赖市场/竞品数据。
 */

import { geminiService } from '@/services/gemini.service'
import type {
  UserProductInfo,
  StrategyPrompts,
  AnalysisReport,
  APlusPromptBlocks,
  APlusVisualPlanResult,
  ProgressCallback,
} from '../types'
import { safeParseJson } from '../utils'

const AGENT_NAME = 'APlusPromptGenAgent'

export interface APlusPromptGenInput {
  userProduct: UserProductInfo
  market?: string
  language?: string
  /** 用户选定的模块数（3~7），分析将生成 exactly N 个模块规划 */
  moduleCount?: number
  /** 模板 ID，影响模块顺序与写作重心 */
  templateId?: string
}

export interface APlusPromptGenResult {
  strategyPrompts: StrategyPrompts
  analysisReport: AnalysisReport
  /** 兼容旧字段（仍可用于 buildDefaultPrompt） */
  promptBlocks: APlusPromptBlocks
  /** 新：全局规范 + 模块规划 */
  visualPlan: APlusVisualPlanResult
}

function buildMinimalAnalysisReport(
  aPlusGuidancePrompt: string,
  narrativeStrategy: string
): AnalysisReport {
  return {
    keywords: {
      coreKeywords: [],
      longTailKeywords: [],
      sceneKeywords: [],
      priorityRanking: [],
    },
    titleAnalysis: {
      competitorPatterns: [],
      avgLength: 180,
      recommendedFormula: '',
      mustIncludeWords: [],
    },
    bulletPointsAnalysis: {
      competitorStrategies: [],
      writingStyleBreakdown: '',
      recommendedOrder: [],
      recommendedStyle: '',
    },
    descriptionAnalysis: {
      competitorNarrativeStyles: [],
      recommendedStrategy: '',
      recommendedLength: '',
    },
    mainImageAnalysis: {
      competitorCompositions: [],
      hasTextOverlay: false,
      hasComparisonElements: false,
      clickThroughStrategy: '',
      recommendedDirection: '',
    },
    secondaryImagesAnalysis: {
      competitorSequences: [],
      commonPatterns: [],
      recommendedSequence: [],
    },
    aPlusAnalysis: {
      competitorModules: [],
      layoutStyles: [],
      recommendedModules: [],
      narrativeStrategy,
    },
    differentiationAnalysis: {
      competitorStrengths: [],
      competitorWeaknesses: [],
      priceRange: { min: '', max: '', avg: '' },
      pricingRecommendation: '',
      differentiationSuggestions: [],
    },
  }
}

function buildPrompt(input: APlusPromptGenInput): string {
  const p = input.userProduct
  const market = input.market || 'us'
  const lang = input.language || 'en'

  const productName = `${p.name}${p.category ? ` / ${p.category}` : ''}`
  const sellingPoints = [p.specs, p.features].filter(Boolean).join('\n\n').trim()
  const audienceScenario = (p.targetAudience || '').trim() || '(未提供)'
  const userVisualContext = [
    p.differentiators ? `差异化/竞品痛点：${p.differentiators}` : '',
    p.brand ? `品牌：${p.brand}` : '',
  ]
    .filter(Boolean)
    .join('\n')
    .trim() || '(未提供)'

  return `
# Role
你是一位拥有10年经验的亚马逊北美/欧洲站顶级视觉营销总监兼高级产品经理。你深谙消费者心理学、欧美本土化审美（Native Western Aesthetic）以及亚马逊 A+ 页面（Enhanced Brand Content）的排版逻辑与转化率优化（CRO）。

# Objective
你的任务是接收用户提供的【产品信息】和【参考视觉/图片信息】，深入分析该产品在欧美市场的视觉转化痛点，并为其定制一套动态的、可商用的AI生图方案（分为全局规范和具体生图Prompt）。

# Input Variables
- 产品名称/类目：${productName}
- 核心卖点/参数：${sellingPoints || '(未提供)'}
- 目标人群与使用场景：${audienceScenario}
- 用户补充的图片信息或特定视觉需求：${userVisualContext}
- 目标市场：${market}
- 目标语言：${lang}
${input.templateId && input.templateId !== 'default' ? `\n- 模板偏好：${input.templateId}（请据此调整模块顺序与写作重心）` : ''}

# 严格约束（不可违背）
以下内容必须原样遵守，不得修改或虚构：
- 产品名称、核心卖点/参数：必须与 Input Variables 一致
- 目标市场、目标语言：固定为 ${market}、${lang}
- 模块数量：必须 exactly ${Math.min(7, Math.max(3, input.moduleCount ?? 5))} 个
你只能在「目标人群与使用场景」「品牌调性/视觉偏好」「差异化/竞品痛点」等创意类信息上进行优化与发挥。

# Workflow & Output Structure
请你根据上述输入变量，进行深刻的市场与视觉分析，并严格按照以下两部分输出你的方案：

## 第一部分：全局框架与视觉规范 (Global Framework)
请基于欧美消费者的购买心理，定义该A+页面的整体视觉基调。包含以下内容：
1. **整体商业调性与艺术语言**：分析该产品应该采用何种视觉风格，并解释为什么这种风格能打动欧美消费者。
2. **全局光影与摄影风格**：定义统一的光影逻辑和画质标准（如 8k, hyper-realistic）。
3. **排版与负空间逻辑 (Negative Space)**：明确指出为了后期添加A+页面的营销文案，整体构图应该如何预留干净的留白区域。
4. **全局负向提示词 (Negative Prompt)**：提供适用于该品类生图时，必须排除的通用瑕疵元素（需包含英文）。

## 第二部分：精确到子图的模块化提示词 (Granular Sub-Image Prompts)
根据亚马逊A+页面的“漏斗式视觉营销模型”（吸睛 -> 建立信任 -> 场景代入 -> 理性说服），为该产品量身定制 **exactly ${Math.min(7, Math.max(3, input.moduleCount ?? 5))}** 个核心子图模块。对于每一个子图，必须输出以下详细信息：

* **模块 [编号]：[模块名称]**
    * **表达目的 (CRO Logic)**：中文
    * **画面内容与表达方式**：中文
    * **英文生图提示词 (AI Prompt)**：必须是纯英文，可直接复制给 Midjourney/Stable Diffusion 使用。必须包含负空间留白指令与长宽比参数（如 --ar 16:9）。\n+
# Output Rules
1. 第一部分和第二部分的分析内容使用中文输出。\n2. 所有的【英文生图提示词 (AI Prompt)】和【全局负向提示词】必须使用极其专业的英文商业摄影术语。\n\nOutput the following JSON (no markdown fences):\n{\n  \"global\": {\n    \"commercialTone\": \"整体商业调性与艺术语言（中文）\",\n    \"lightingStyle\": \"全局光影与摄影风格（中文）\",\n    \"negativeSpace\": \"排版与负空间逻辑（中文）\",\n    \"negativePrompt\": \"Global negative prompt (English, comma-separated)\"\n  },\n  \"modules\": [\n    {\n      \"moduleName\": \"The Hero Banner\",\n      \"croLogic\": \"表达目的（中文）\",\n      \"sceneDesc\": \"画面内容与表达方式（中文）\",\n      \"imagePromptEn\": \"English prompt for MJ/SD with negative space instruction and --ar parameter\"\n    }\n  ]\n}\n+`.trim()
}

export async function aplusPromptGenAgent(
  input: APlusPromptGenInput,
  onProgress?: ProgressCallback
): Promise<APlusPromptGenResult> {
  console.log(`\n========== [${AGENT_NAME}] 开始执行 ==========`)
  console.log(`[${AGENT_NAME}] 产品: ${input.userProduct.name}`)

  onProgress?.({
    agent: AGENT_NAME,
    step: 1,
    totalSteps: 1,
    progress: 10,
    message: '正在基于用户输入生成 A+ 策略提示词...',
  })

  const prompt = buildPrompt(input)

  onProgress?.({
    agent: AGENT_NAME,
    step: 1,
    totalSteps: 1,
    progress: 50,
    message: 'AI 正在生成四块式 A+ 策略...',
  })

  const raw = await geminiService.generateText(prompt)

  const parsed = safeParseJson<{
    global?: {
      commercialTone?: string
      lightingStyle?: string
      negativeSpace?: string
      negativePrompt?: string
    }
    modules?: Array<{
      moduleName?: string
      croLogic?: string
      sceneDesc?: string
      imagePromptEn?: string
    }>
  }>(raw, {
    global: {
      commercialTone: '',
      lightingStyle: '',
      negativeSpace: '',
      negativePrompt: '',
    },
    modules: [],
  })

  const targetCount = Math.min(7, Math.max(3, input.moduleCount ?? 5))
  const rawModules = (parsed.modules ?? [])
    .map((m) => ({
      moduleName: (m.moduleName ?? '').trim(),
      croLogic: (m.croLogic ?? '').trim(),
      sceneDesc: (m.sceneDesc ?? '').trim(),
      imagePromptEn: (m.imagePromptEn ?? '').trim(),
    }))
    .filter((m) => m.moduleName || m.imagePromptEn)

  const emptyModule = (): { moduleName: string; croLogic: string; sceneDesc: string; imagePromptEn: string } => ({
    moduleName: '',
    croLogic: '',
    sceneDesc: '',
    imagePromptEn: 'Professional product photography, negative space for text overlay, --ar 4:5',
  })

  let modules = rawModules
  if (modules.length > targetCount) {
    modules = modules.slice(0, targetCount)
  } else if (modules.length < targetCount) {
    while (modules.length < targetCount) {
      modules = [...modules, emptyModule()]
    }
  }

  const visualPlan: APlusVisualPlanResult = {
    global: {
      commercialTone: (parsed.global?.commercialTone ?? '').trim(),
      lightingStyle: (parsed.global?.lightingStyle ?? '').trim(),
      negativeSpace: (parsed.global?.negativeSpace ?? '').trim(),
      negativePrompt: (parsed.global?.negativePrompt ?? '').trim(),
    },
    modules,
  }

  const mergedPrompt = [
    `【整体商业调性与艺术语言】\n${visualPlan.global.commercialTone}`,
    `【全局光影与摄影风格】\n${visualPlan.global.lightingStyle}`,
    `【排版与负空间逻辑】\n${visualPlan.global.negativeSpace}`,
    visualPlan.global.negativePrompt ? `【全局负向提示词｜EN】\n${visualPlan.global.negativePrompt}` : '',
    visualPlan.modules.length
      ? `【模块规划】\n${visualPlan.modules
        .map((m, i) => `${i + 1}. ${m.moduleName}\n- CRO: ${m.croLogic}\n- Scene: ${m.sceneDesc}\n- Prompt(EN): ${m.imagePromptEn}`)
        .join('\n\n')}`
      : '',
  ].filter(Boolean).join('\n\n')

  const strategyPrompts: StrategyPrompts = {
    titlePrompt: '',
    bulletPointsPrompt: '',
    descriptionPrompt: '',
    searchTermsPrompt: '',
    imageGuidancePrompt: mergedPrompt,
    aPlusGuidancePrompt: mergedPrompt,
  }

  const analysisReport = buildMinimalAnalysisReport(
    mergedPrompt,
    '漏斗式视觉叙事：吸睛→信任→场景代入→理性说服'
  )

  const promptBlocks: APlusPromptBlocks = {
    colorPlanning: visualPlan.global.commercialTone,
    lightShadow: visualPlan.global.lightingStyle,
    featureStructure: visualPlan.global.negativeSpace,
    marketingNarrative: visualPlan.modules.map((m) => `${m.moduleName}｜${m.croLogic}`).join('\n'),
    narrativeStrategy: '漏斗式视觉营销模型（吸睛→信任→场景→理性）',
  }

  onProgress?.({
    agent: AGENT_NAME,
    step: 1,
    totalSteps: 1,
    progress: 100,
    message: 'A+ 策略生成完成',
  })

  console.log(`[${AGENT_NAME}] ✓ 策略生成完成`)
  console.log(`========== [${AGENT_NAME}] 执行完毕 ==========\n`)

  return { strategyPrompts, analysisReport, promptBlocks, visualPlan }
}
