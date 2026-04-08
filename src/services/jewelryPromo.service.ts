import { geminiService } from './gemini.service'
import { imaVideoService } from './imaVideo.service'
import { buildJewelryFinalVideoRequest, buildJewelryVideoPrompt } from './jewelryPromoVideo.core'
import type {
  JewelryAnalysis,
  JewelryPromoInput,
  JewelryShotCandidate,
  JewelryShotSelection,
  JewelryShotTemplate,
  JewelryStyleTemplate,
  JewelryType,
  VideoGenerationTask,
} from '@/types/jewelryPromo.types'

const JEWELRY_IMAGE_MODEL = import.meta.env.VITE_NANOBANANA_MODEL || 'gemini-2.0-flash-preview-image-generation'

const STYLE_LABELS: Record<JewelryStyleTemplate, string> = {
  magazine: '高级杂志',
  'ins-natural': 'ins自然光',
  'luxury-ecommerce': '轻奢电商',
}

const SHOT_TEMPLATES: Record<JewelryType, Omit<JewelryShotTemplate, 'id' | 'index'>[]> = {
  earring: [
    {
      title: 'Side Profile Establishing',
      subtitle: 'Use a clean side angle to establish face identity and earring position.',
      durationSeconds: 3,
      framing: '9:16 vertical, medium close-up, 35 to 45 degree side profile',
      focusPoint: 'earring position, face identity, hair outline',
      motionHint: 'breathing, tiny head turn, subtle hair movement only',
      promptHint: 'keep the earring fully visible and avoid hair blocking the ear',
    },
    {
      title: 'Front Portrait',
      subtitle: 'Reinforce facial consistency and balanced earring visibility.',
      durationSeconds: 3,
      framing: '9:16 vertical, front-facing medium close-up',
      focusPoint: 'earring count, material highlights, face consistency',
      motionHint: 'blink, breathing, tiny head sway only',
      promptHint: 'keep both earrings consistent and visible in a clean fashion portrait',
    },
    {
      title: 'Earring Detail',
      subtitle: 'Push material, finish, and craftsmanship details forward.',
      durationSeconds: 3,
      framing: '9:16 vertical, ear-area close-up detail',
      focusPoint: 'material, silhouette, count, and exact wearing position',
      motionHint: 'very light push-in feel and micro sway only',
      promptHint: 'match the product image exactly in material, count, and placement',
    },
    {
      title: 'Closing Mood Shot',
      subtitle: 'End on a polished branded beauty shot.',
      durationSeconds: 3,
      framing: '9:16 vertical, beauty close-up or half-body mood frame',
      focusPoint: 'earring visibility within a premium fashion mood',
      motionHint: 'breathing, soft glance shift, minimal shoulder movement only',
      promptHint: 'keep the earring clearly sellable and visually premium',
    },
  ],
  necklace: [
    {
      title: 'Half Body Establishing',
      subtitle: 'Set the subject and neckline area clearly for necklace visibility.',
      durationSeconds: 3,
      framing: '9:16 vertical, half-body portrait',
      focusPoint: 'collarbone, necklace placement, face identity',
      motionHint: 'breathing and subtle shoulder-neck movement only',
      promptHint: 'keep the neck area open and avoid collar obstruction',
    },
    {
      title: 'Collarbone Detail',
      subtitle: 'Highlight chain, pendant, and placement details.',
      durationSeconds: 3,
      framing: '9:16 vertical, collarbone and necklace close-up',
      focusPoint: 'chain structure, pendant material, exact placement',
      motionHint: 'tiny camera drift and breathing only',
      promptHint: 'match the product image exactly in material, length, and count',
    },
    {
      title: 'Touch Interaction',
      subtitle: 'Create soft interaction without hiding the necklace.',
      durationSeconds: 3,
      framing: '9:16 vertical, medium close-up with hand entering collarbone area',
      focusPoint: 'necklace body, hand gesture, face consistency',
      motionHint: 'gentle finger touch and tiny head motion only',
      promptHint: 'keep the gesture restrained and do not block key necklace details',
    },
    {
      title: 'Closing Mood Shot',
      subtitle: 'Finish with a refined premium jewelry portrait.',
      durationSeconds: 3,
      framing: '9:16 vertical, close-up mood portrait',
      focusPoint: 'necklace visibility and styling coherence',
      motionHint: 'breathing, tiny glance shift, minimal shoulder movement only',
      promptHint: 'keep the necklace centered, visible, and polished',
    },
  ],
}

function extractJson(raw: string) {
  const codeBlockMatch = raw.match(/```json\s*([\s\S]*?)```/i) || raw.match(/```\s*([\s\S]*?)```/i)
  const candidate = codeBlockMatch?.[1] || raw
  const jsonMatch = candidate.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    throw new Error('Analysis response did not contain valid JSON')
  }

  return JSON.parse(jsonMatch[0])
}

function normalizeText(value: unknown, fallback: string) {
  const text = String(value ?? '').trim()
  return text || fallback
}

function normalizeWarnings(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || '').trim()).filter(Boolean)
}

function stylePrompt(styleTemplate: JewelryStyleTemplate) {
  switch (styleTemplate) {
    case 'magazine':
      return 'luxury editorial magazine style, controlled light, premium composition'
    case 'ins-natural':
      return 'soft natural light, relaxed social aesthetic, airy skin tone'
    case 'luxury-ecommerce':
      return 'clean premium ecommerce look, highly legible product detail, polished commercial finish'
    default:
      return STYLE_LABELS[styleTemplate]
  }
}

function buildConsistencyLock(analysis: JewelryAnalysis) {
  return [
    `Keep the exact same face identity: ${analysis.identitySummary}.`,
    `Keep the jewelry category fixed: ${analysis.resolvedJewelryType}.`,
    `Keep the wearing position fixed: ${analysis.jewelryPosition}.`,
    `Keep the jewelry material fixed: ${analysis.materialSummary}.`,
    `Keep the jewelry count fixed: ${analysis.quantitySummary}.`,
    `Maintain jewelry visibility at least at ${analysis.jewelryVisibility} level.`,
  ].join(' ')
}

class JewelryPromoService {
  private async generatePromoImage(prompt: string, referenceImages: string[]) {
    return await geminiService.generateImage(prompt, referenceImages, {
      model: JEWELRY_IMAGE_MODEL,
      aspectRatio: '9:16',
    })
  }

  getGenerationCost() {
    return 12
  }

  createTaskId() {
    return `jewelry-promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  getStyleLabel(styleTemplate: JewelryStyleTemplate) {
    return STYLE_LABELS[styleTemplate]
  }

  buildShotTemplates(type: JewelryType): JewelryShotTemplate[] {
    return SHOT_TEMPLATES[type].map((shot, index) => ({
      id: `${type}-shot-${index + 1}`,
      index: index + 1,
      ...shot,
    }))
  }

  async analyzeInput(input: JewelryPromoInput): Promise<JewelryAnalysis> {
    const requestedType = input.jewelryType || 'auto'
    const prompt = `
You are an image analysis module for a jewelry promo video MVP.
You will receive two images:
1. model image
2. product image

Return JSON only. No markdown. No explanation.

Schema:
{
  "faceUsable": boolean,
  "detectedJewelryType": "earring" | "necklace" | "unknown",
  "jewelryPosition": "string",
  "jewelryVisibility": "high" | "medium" | "low",
  "materialSummary": "string",
  "quantitySummary": "string",
  "styleSummary": "string",
  "identitySummary": "string",
  "warnings": ["string"]
}

Rules:
- Return all descriptive string fields and warnings in simplified Chinese.
- Keep enum values for detectedJewelryType and jewelryVisibility in English exactly matching the schema.
- identitySummary should describe only the identity features that must stay consistent later.
- styleSummary should summarize the compatible style direction shared by model and product.
- warnings must be weak validation reminders only, never blocking errors.
- Requested jewelry type from user: ${requestedType}.
- If the model image and product image conflict, still report the visually detected category in detectedJewelryType.
- For earrings, pay attention to ear visibility, side-face coverage, hair blocking, count, and position.
- For necklaces, pay attention to neck/collarbone visibility, collar blocking, hand blocking, count, and position.
`.trim()

    const raw = await geminiService.generateWithImagesUsingFlash(prompt, [input.modelImage, input.productImage])

    try {
      const parsed = extractJson(raw)
      return this.normalizeAnalysis(parsed, raw, input.jewelryType)
    } catch {
      const retryRaw = await geminiService.generateWithImagesUsingFlash(
        `${prompt}\nReturn one JSON object only.`,
        [input.modelImage, input.productImage]
      )
      const parsed = extractJson(retryRaw)
      return this.normalizeAnalysis(parsed, retryRaw, input.jewelryType)
    }
  }

  private normalizeAnalysis(parsed: any, raw: string, requestedType?: JewelryType | null): JewelryAnalysis {
    const detectedJewelryType =
      parsed?.detectedJewelryType === 'earring' || parsed?.detectedJewelryType === 'necklace'
        ? parsed.detectedJewelryType
        : 'unknown'

    const resolvedJewelryType = requestedType || (detectedJewelryType === 'unknown' ? 'earring' : detectedJewelryType)

    return {
      faceUsable: Boolean(parsed?.faceUsable),
      detectedJewelryType,
      resolvedJewelryType,
      jewelryPosition: normalizeText(
        parsed?.jewelryPosition,
        resolvedJewelryType === 'earring' ? '耳部区域' : '前侧锁骨区域'
      ),
      jewelryVisibility:
        parsed?.jewelryVisibility === 'high' || parsed?.jewelryVisibility === 'medium' || parsed?.jewelryVisibility === 'low'
          ? parsed.jewelryVisibility
          : 'medium',
      materialSummary: normalizeText(parsed?.materialSummary, '金属或宝石首饰质感'),
      quantitySummary: normalizeText(parsed?.quantitySummary, resolvedJewelryType === 'earring' ? '一对耳饰' : '一条项链'),
      styleSummary: normalizeText(parsed?.styleSummary, '干净高级的人像珠宝宣发风格'),
      identitySummary: normalizeText(parsed?.identitySummary, '保持同一张脸、发型与整体气质'),
      warnings: normalizeWarnings(parsed?.warnings),
      raw,
    }
  }

  private buildShotPrompt(
    input: JewelryPromoInput,
    analysis: JewelryAnalysis,
    shot: JewelryShotTemplate,
    candidateIndex: number
  ) {
    return `
Create one vertical 9:16 jewelry promo keyframe image.
Style template: ${STYLE_LABELS[input.styleTemplate]}.
Style direction: ${stylePrompt(input.styleTemplate)}.
Shot ${shot.index}: ${shot.title}.
Shot brief: ${shot.subtitle}.
Framing: ${shot.framing}.
Focus point: ${shot.focusPoint}.
Motion implication: ${shot.motionHint}.
Shot-specific requirement: ${shot.promptHint}.
Candidate version: ${candidateIndex + 1}. Keep the same person and same jewelry, but make the composition or expression slightly different from the other candidate.

Hard constraints:
- Do not change the face identity.
- Do not change the jewelry category, material, count, or wearing position.
- Do not add extra accessories or extra jewelry.
- Keep the jewelry clearly visible and sellable.
- Maintain premium portrait quality with no distortion.

Consistency lock:
${buildConsistencyLock(analysis)}
`.trim()
  }

  async generateShotCandidates(
    input: JewelryPromoInput,
    analysis: JewelryAnalysis,
    shot: JewelryShotTemplate
  ): Promise<JewelryShotCandidate[]> {
    const referenceImages = [input.modelImage, input.productImage]

    return await Promise.all(
      [0, 1].map(async (candidateIndex) => {
        const prompt = this.buildShotPrompt(input, analysis, shot, candidateIndex)
        const imageUrl = await this.generatePromoImage(prompt, referenceImages)

        return {
          id: `${shot.id}-candidate-${candidateIndex + 1}-${Date.now()}`,
          shotId: shot.id,
          shotIndex: shot.index,
          imageUrl,
          sourceUrl: imageUrl,
          prompt,
          model: JEWELRY_IMAGE_MODEL,
          createdAt: new Date().toISOString(),
        } satisfies JewelryShotCandidate
      })
    )
  }

  async generateCoverImage(
    input: JewelryPromoInput,
    analysis: JewelryAnalysis,
    selections: JewelryShotSelection[]
  ): Promise<JewelryShotCandidate> {
    const referenceImages = [
      input.modelImage,
      input.productImage,
      ...selections.map((selection) => selection.sourceUrl || selection.imageUrl).slice(0, 4),
    ]

    const prompt = `
Create one standalone cover image for a jewelry promo short video.
Output: vertical 9:16 cover image with strong click appeal and premium product presentation.
Style template: ${STYLE_LABELS[input.styleTemplate]}.
Style summary: ${analysis.styleSummary}.

Requirements:
- Keep face identity, jewelry category, material, count, and wearing position exactly consistent with the selected keyframes.
- Leave a safe area for title text.
- Keep the jewelry clearly visible and not blocked by hair, hands, or clothing.
- Make the frame feel more like a cover image than an in-sequence shot.

Consistency lock:
${buildConsistencyLock(analysis)}
`.trim()

    const imageUrl = await this.generatePromoImage(prompt, referenceImages)

    return {
      id: `cover-${Date.now()}`,
      shotId: 'cover',
      shotIndex: 0,
      imageUrl,
      sourceUrl: imageUrl,
      prompt,
      model: JEWELRY_IMAGE_MODEL,
      createdAt: new Date().toISOString(),
    }
  }

  private buildFinalVideoPrompt(
    input: JewelryPromoInput,
    analysis: JewelryAnalysis,
    shots: JewelryShotTemplate[]
  ) {
    return buildJewelryVideoPrompt({
      styleLabel: STYLE_LABELS[input.styleTemplate],
      styleDirection: stylePrompt(input.styleTemplate),
      styleSummary: analysis.styleSummary,
      jewelryCategory: analysis.resolvedJewelryType,
      materialSummary: analysis.materialSummary,
      quantitySummary: analysis.quantitySummary,
      jewelryPosition: analysis.jewelryPosition,
      shots,
    })
  }

  async generateFinalVideo(
    input: JewelryPromoInput,
    analysis: JewelryAnalysis,
    shots: JewelryShotTemplate[],
    selections: JewelryShotSelection[]
  ): Promise<VideoGenerationTask> {
    const prompt = this.buildFinalVideoPrompt(input, analysis, shots)
    const request = buildJewelryFinalVideoRequest(prompt, selections, input.productImage)

    const task = await imaVideoService.createVideoTask(request)

    return await imaVideoService.waitForVideo(task.id)
  }
}

export const jewelryPromoService = new JewelryPromoService()
export default JewelryPromoService
