import type { JewelryShotSelection, JewelryShotTemplate } from '../types/jewelryPromo.types'

const FINAL_VIDEO_DURATION_SECONDS = 12
const FINAL_VIDEO_ASPECT_RATIO = '9:16'

export interface JewelryPromoVideoPromptOptions {
  styleLabel: string
  styleDirection: string
  styleSummary: string
  jewelryCategory: string
  materialSummary: string
  quantitySummary: string
  jewelryPosition: string
  shots: JewelryShotTemplate[]
}

function pickSelectionImage(selection?: JewelryShotSelection) {
  const sourceUrl = String(selection?.sourceUrl || '').trim()
  if (sourceUrl) return sourceUrl

  const imageUrl = String(selection?.imageUrl || '').trim()
  return imageUrl || undefined
}

export function buildJewelryVideoReferenceImages(selections: JewelryShotSelection[], fallbackImage?: string) {
  const selectionImages = selections
    .map((selection) => pickSelectionImage(selection))
    .filter((image): image is string => Boolean(image))
    .slice(0, 4)

  if (selectionImages.length) {
    return selectionImages
  }

  const fallback = String(fallbackImage || '').trim()
  return fallback ? [fallback] : []
}

export function buildJewelryFinalVideoRequest(
  prompt: string,
  selections: JewelryShotSelection[],
  fallbackImage?: string
) {
  return {
    prompt: String(prompt || '').trim(),
    images: buildJewelryVideoReferenceImages(selections, fallbackImage),
    duration: FINAL_VIDEO_DURATION_SECONDS,
    aspectRatio: FINAL_VIDEO_ASPECT_RATIO,
    audio: false,
  }
}

export function buildJewelryVideoPrompt(options: JewelryPromoVideoPromptOptions) {
  const shotPlan = options.shots
    .map(
      (shot) => `
Shot ${shot.index}: ${shot.title}.
Shot brief: ${shot.subtitle}.
Framing: ${shot.framing}.
Focus point: ${shot.focusPoint}.
Motion limit: ${shot.motionHint}.
Shot-specific requirement: ${shot.promptHint}.
`.trim()
    )
    .join('\n\n')

  return `
Create one 12-second vertical jewelry promo video.
Use the four selected keyframe images to keep the same jewelry design, styling direction, and subject presentation consistent across the full video.
Style template: ${options.styleLabel}.
Style direction: ${options.styleDirection}.
Style summary: ${options.styleSummary}.

Sequence plan:
${shotPlan}

Requirements:
- Keep the same jewelry design, category, material, count, and wearing position fixed: ${options.jewelryCategory}, ${options.materialSummary}, ${options.quantitySummary}, ${options.jewelryPosition}.
- Keep the jewelry clearly visible and sellable in every shot.
- Keep the subject styling and overall presentation aligned with the selected keyframe images.
- Only allow subtle motion such as breathing, blinking, tiny head turns, soft hair movement, and minimal jewelry sway.
- Do not introduce large body motion, camera shake, perspective jumps, extra accessories, or jewelry deformation.
- Vertical 9:16, no subtitles, premium commercial finish, clean transition-ready motion.
`.trim()
}
