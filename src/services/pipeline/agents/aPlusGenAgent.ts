/**
 * Agent: APlusGenAgent — A+ 页面生成（增值服务）
 *
 * 基于用户可编辑提示词、策略、分析报告、已生成 Listing，
 * 生成 Amazon A+ 模块化文案及对应配图。
 * 参考 PicSet AI 的模块化布局、视觉一致性、一图生全套理念。
 */

import { geminiService } from '@/services/gemini.service'
import { imageGenerationService } from '@/services/atomic/imageGeneration.service'
import type {
  APlusGenInput,
  GeneratedAPlusResult,
  GeneratedAPlusModule,
  ProgressCallback,
  APlusModuleRewriteInput,
  APlusModuleImageInput,
} from '../types'
import { safeParseJson } from '../utils'

const AGENT_NAME = 'APlusGenAgent'

const APLUS_IMAGE_PROMPT_PREFIX = `Generate a professional e-commerce product image for an Amazon A+ content module.
The image must:
- Match the brand's visual style consistently with other module images
- Be high quality, well-lit, suitable for Amazon A+ display
- Show the product or a relevant visual that supports the module's message
- No text, logos, or watermarks
- Professional product photography style

Module image concept: `

function buildAPlusContentPrompt(input: APlusGenInput): string {
  const { userEditablePrompt, strategyPrompts, analysisReport, generatedListing, productContext } =
    input
  const aPlus = analysisReport.aPlusAnalysis
  const recModules = aPlus.recommendedModules || []
  const modOrder =
    recModules.length > 0
      ? recModules.map((m, i) => `  ${i + 1}. ${m.type}: ${m.purpose}`).join('\n')
      : '  (Use best practices: brand story, feature highlights, comparison, use case)'
  const desiredCount = Math.min(Math.max(input.settings?.moduleCount ?? 5, 3), 7)
  const language = input.settings?.language || 'en'
  const templateHint = input.settings?.templateId && input.settings?.templateId !== 'default'
    ? `Template: ${input.settings?.templateId}`
    : 'Template: default best practices'
  return `
You are an expert Amazon A+ Content creator. Generate a complete A+ page structure with modules.

=== USER-EDITABLE INSTRUCTIONS (highest priority) ===
${userEditablePrompt}

=== STRATEGY CONTEXT (from competitive analysis) ===
${strategyPrompts.aPlusGuidancePrompt}

=== A+ ANALYSIS RECOMMENDATIONS ===
Narrative Strategy: ${aPlus.narrativeStrategy || 'Professional, benefit-focused'}
Layout Styles: ${(aPlus.layoutStyles || []).join('; ') || 'Clean, modular'}
Recommended Module Order:
${modOrder}
${templateHint}

=== PRODUCT & LISTING CONTEXT ===
Product: ${productContext.productName}
Brand: ${productContext.brand}
Category: ${productContext.category}
Features: ${productContext.features}
Listing Title: ${generatedListing.title}
Bullet Points (for reference):
${productContext.bulletPoints.map((bp, i) => `  ${i + 1}. ${bp}`).join('\n')}

Output the following JSON (no markdown fences):
{
  "modules": [
    {
      "type": "品牌故事|对比图|功能展示|场景图|规格说明|等",
      "headline": "Module headline (concise, compelling)",
      "body": "Module body text (2-4 sentences, benefit-focused)",
      "imagePrompt": "Detailed English description for AI image generation: what visual to create for this module (product in scene, comparison chart placeholder, feature close-up, etc.). Be specific about composition, lighting, style."
    }
  ]
}

Requirements:
1. Generate exactly ${desiredCount} modules (min 3, max 7)
2. Each module MUST have imagePrompt — describe what image to generate for this module
3. Follow the recommended module order when provided
4. Content language must be: ${language}. If language is English, write in natural US ecommerce English.
5. Every imagePrompt should ensure visual consistency across all modules (same lighting, style, brand feel)
6. Use only facts from product context — no invented features
`.trim()
}

function buildSelfCheckPrompt(input: APlusGenInput, modules: GeneratedAPlusModule[]): string {
  const language = input.settings?.language || 'en'
  const facts = [
    `Product: ${input.productContext.productName}`,
    `Brand: ${input.productContext.brand}`,
    `Category: ${input.productContext.category}`,
    `Features: ${input.productContext.features}`,
    `Listing Title: ${input.generatedListing.title}`,
    `Bullet Points: ${(input.productContext.bulletPoints || []).join(' | ')}`,
  ].join('\n')
  return `
You are a strict Amazon A+ editor. Your job:
1) Identify any statements in modules that are NOT supported by the facts below.
2) Rewrite the modules to remove unsupported claims while keeping them persuasive.

Facts (only source of truth):
${facts}

Modules JSON:
${JSON.stringify({ modules }, null, 2)}

Output JSON only (no markdown):
{
  "issues": [
    { "moduleIndex": 1, "unsupported": ["..."], "riskLevel": "low|medium|high" }
  ],
  "modules": [
    { "type": "...", "headline": "...", "body": "...", "imagePrompt": "..." }
  ]
}

Constraints:
- Keep language strictly: ${language}
- Do NOT add new facts.
- Keep module count unchanged.
`.trim()
}

function normalizeModules(modules: GeneratedAPlusModule[], targetCount: number): GeneratedAPlusModule[] {
  const cleaned = modules
    .filter((m) => m && typeof m === 'object')
    .map((m) => ({
      type: String((m as any).type ?? '功能展示').trim() || '功能展示',
      headline: String((m as any).headline ?? '').trim(),
      body: String((m as any).body ?? '').trim(),
      imagePrompt: String((m as any).imagePrompt ?? '').trim() || 'Professional product photography on clean background',
      imageUrl: (m as any).imageUrl,
    }))
  if (cleaned.length === targetCount) return cleaned
  if (cleaned.length > targetCount) return cleaned.slice(0, targetCount)
  const pad: GeneratedAPlusModule[] = []
  while (cleaned.length + pad.length < targetCount) {
    pad.push({
      type: '功能展示',
      headline: '',
      body: '',
      imagePrompt: 'Professional product photography on clean background',
    })
  }
  return [...cleaned, ...pad]
}

export async function aPlusGenAgent(
  input: APlusGenInput,
  onProgress?: ProgressCallback
): Promise<GeneratedAPlusResult> {
  console.log(`\n========== [${AGENT_NAME}] 开始执行 ==========`)

  onProgress?.({
    agent: AGENT_NAME,
    step: 1,
    totalSteps: 2,
    progress: 10,
    message: '正在生成 A+ 模块文案...',
  })

  const contentPrompt = buildAPlusContentPrompt(input)
  const rawContent = await geminiService.generateText(contentPrompt)

  const fallbackModules: GeneratedAPlusModule[] = [
    {
      type: '品牌故事',
      headline: 'Our Story',
      body: 'Quality and innovation at the heart of everything we do.',
      imagePrompt: 'Professional product photography on clean background',
    },
  ]
  const parsed = safeParseJson<{ modules: GeneratedAPlusModule[] }>(
    rawContent,
    { modules: fallbackModules }
  )
  const desiredCount = Math.min(Math.max(input.settings?.moduleCount ?? 5, 3), 7)
  let modules = normalizeModules(Array.isArray(parsed.modules) ? parsed.modules : fallbackModules, desiredCount)

  if (input.settings?.enableSelfCheck) {
    onProgress?.({
      agent: AGENT_NAME,
      step: 1,
      totalSteps: 3,
      progress: 55,
      message: '正在自检与修正（避免虚构）...',
    })
    try {
      const selfCheckRaw = await geminiService.generateText(buildSelfCheckPrompt(input, modules))
      const selfChecked = safeParseJson<{ modules: GeneratedAPlusModule[] }>(
        selfCheckRaw,
        { modules }
      )
      if (Array.isArray(selfChecked.modules) && selfChecked.modules.length) {
        modules = normalizeModules(selfChecked.modules, desiredCount)
      }
    } catch (err) {
      console.warn(`[${AGENT_NAME}] 自检失败，继续使用原始模块`, err)
    }
  }

  onProgress?.({
    agent: AGENT_NAME,
    step: 2,
    totalSteps: input.settings?.generateImages === false ? 2 : 3,
    progress: 65,
    message: input.settings?.generateImages === false ? '文案生成完成' : '文案生成完成，正在生成配图...',
  })

  if (input.settings?.generateImages !== false) {
    const referenceImages = input.referenceImages.filter(Boolean)
    if (referenceImages.length === 0) {
      console.warn(`[${AGENT_NAME}] 无参考图片，跳过配图生成`)
    } else {
      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i]
        const imgPrompt = mod.imagePrompt?.trim()
        if (!imgPrompt) continue

        const progressBase = 65 + (i / modules.length) * 30
        onProgress?.({
          agent: AGENT_NAME,
          step: 3,
          totalSteps: 3,
          progress: Math.round(progressBase),
          message: `正在生成模块 ${i + 1}/${modules.length} 配图...`,
        })

        try {
          const fullPrompt = APLUS_IMAGE_PROMPT_PREFIX + imgPrompt
          const result = await imageGenerationService.generate(
            'scene',
            fullPrompt,
            referenceImages,
            { aspectRatio: '4:3', imageSize: '2K', temperature: 0.6 }
          )
          if (result.success && result.imageUrl) {
            modules[i] = { ...mod, imageUrl: result.imageUrl }
            console.log(`[${AGENT_NAME}] 模块 ${i + 1} 配图生成成功`)
          } else {
            console.warn(`[${AGENT_NAME}] 模块 ${i + 1} 配图失败: ${result.error}`)
          }
        } catch (err) {
          console.warn(`[${AGENT_NAME}] 模块 ${i + 1} 配图异常:`, err)
        }
      }
    }
  }

  onProgress?.({
    agent: AGENT_NAME,
    step: input.settings?.generateImages === false ? 2 : 3,
    totalSteps: input.settings?.generateImages === false ? 2 : 3,
    progress: 100,
    message: 'A+ 页面生成完成',
  })

  console.log(`[${AGENT_NAME}] ✓ 完成，共 ${modules.length} 个模块`)
  return { modules }
}

function buildModuleRewritePrompt(input: APlusModuleRewriteInput): string {
  const language = input.settings?.language || 'en'
  const locked = input.locked ?? {}
  return `
You are an expert Amazon A+ copywriter. Rewrite ONE module using only the facts below.

Facts:
Product: ${input.productContext.productName}
Brand: ${input.productContext.brand}
Category: ${input.productContext.category}
Features: ${input.productContext.features}
Listing Title: ${input.generatedListing.title}
Bullet Points:
${(input.productContext.bulletPoints || []).map((bp, i) => `  ${i + 1}. ${bp}`).join('\n')}

Global Instructions (highest priority):
${input.userEditablePrompt}

Current Module JSON:
${JSON.stringify(input.module, null, 2)}

Locked fields:
headlineLocked=${!!locked.headline}, bodyLocked=${!!locked.body}, imageLocked=${!!locked.image}

Output JSON only:
{
  "type": "...",
  "headline": "...",
  "body": "...",
  "imagePrompt": "..."
}

Rules:
- Keep language strictly: ${language}
- If a field is locked, keep it unchanged.
- Do NOT add new facts.
`.trim()
}

export async function aPlusModuleRewriteAgent(
  input: APlusModuleRewriteInput,
  onProgress?: ProgressCallback
): Promise<GeneratedAPlusModule> {
  onProgress?.({
    agent: AGENT_NAME,
    step: 1,
    totalSteps: 1,
    progress: 30,
    message: '正在重写模块文案...',
  })
  const raw = await geminiService.generateText(buildModuleRewritePrompt(input))
  const fallback: GeneratedAPlusModule = {
    type: input.module.type,
    headline: input.module.headline,
    body: input.module.body,
    imagePrompt: input.module.imagePrompt ?? 'Professional product photography on clean background',
    imageUrl: input.module.imageUrl,
  }
  const parsed = safeParseJson<GeneratedAPlusModule>(raw, fallback)
  const locked = input.locked ?? {}
  const next: GeneratedAPlusModule = {
    type: String(parsed.type ?? fallback.type).trim() || fallback.type,
    headline: locked.headline ? fallback.headline : String(parsed.headline ?? fallback.headline),
    body: locked.body ? fallback.body : String(parsed.body ?? fallback.body),
    imagePrompt: locked.image ? fallback.imagePrompt : String(parsed.imagePrompt ?? fallback.imagePrompt),
    imageUrl: fallback.imageUrl,
  }
  onProgress?.({
    agent: AGENT_NAME,
    step: 1,
    totalSteps: 1,
    progress: 100,
    message: '模块重写完成',
  })
  return next
}

export async function aPlusModuleImageAgent(
  input: APlusModuleImageInput,
  onProgress?: ProgressCallback
): Promise<GeneratedAPlusModule> {
  const referenceImages = input.referenceImages.filter(Boolean)
  if (referenceImages.length === 0) {
    throw new Error('缺少参考图片，无法生成配图')
  }
  const imgPrompt = input.module.imagePrompt?.trim()
  if (!imgPrompt) {
    throw new Error('缺少 imagePrompt，无法生成配图')
  }
  onProgress?.({
    agent: AGENT_NAME,
    step: 1,
    totalSteps: 1,
    progress: 30,
    message: '正在生成配图...',
  })
  const fullPrompt = APLUS_IMAGE_PROMPT_PREFIX + imgPrompt
  const result = await imageGenerationService.generate(
    'scene',
    fullPrompt,
    referenceImages,
    { aspectRatio: '4:3', imageSize: '2K', temperature: 0.6 }
  )
  if (!result.success || !result.imageUrl) {
    throw new Error(result.error || '配图生成失败')
  }
  onProgress?.({
    agent: AGENT_NAME,
    step: 1,
    totalSteps: 1,
    progress: 100,
    message: '配图生成完成',
  })
  return { ...input.module, imageUrl: result.imageUrl }
}
