import JSZip from 'jszip'
import type { APlusDraft } from '@/stores/aplus'

function normalizeTextForPrompt(s: string) {
  return String(s ?? '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
}

const defaultRenderLayout = {
  headlineBox: { x: 0.06, y: 0.06, w: 0.88, h: 0.14, align: 'center', fontScale: 1 },
  bodyBox: { x: 0.06, y: 0.22, w: 0.88, h: 0.72, align: 'left', fontScale: 0.95 },
} as const

function buildExportImagePrompt(m: (APlusDraft['modules'][number] & { renderLayout?: any })) {
  const layout = m.renderLayout ?? defaultRenderLayout
  const hb = layout.headlineBox ?? defaultRenderLayout.headlineBox
  const bb = layout.bodyBox ?? defaultRenderLayout.bodyBox

  const headlineText = normalizeTextForPrompt(m.headline)
  const bodyText = normalizeTextForPrompt(m.body)

  const textPrompt = `
Text overlays (strict):
- HeadlineText: ${headlineText}
- BodyText: ${bodyText}

Text placement (normalized coordinates):
- HeadlineBox: x=${hb.x}, y=${hb.y}, w=${hb.w}, h=${hb.h}, align=${hb.align ?? 'center'}
- BodyBox: x=${bb.x}, y=${bb.y}, w=${bb.w}, h=${bb.h}, align=${bb.align ?? 'left'}
`.trim()

  return `${m.imagePrompt ?? ''}\n\n${textPrompt}`.trim()
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toAmazonCopyText(draft: APlusDraft): string {
  return draft.modules
    .map((m, i) => `【${i + 1}｜${m.type}】\n${m.headline}\n\n${m.body}`.trim())
    .join('\n\n---\n\n')
}

function csvEscape(v: string) {
  const s = String(v ?? '')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function toModulesCsv(draft: APlusDraft): string {
  const header = ['index', 'type', 'headline', 'body', 'imagePrompt', 'imageUrl']
  const lines = [header.join(',')]
  draft.modules.forEach((m, idx) => {
    lines.push(
      [
        String(idx + 1),
        csvEscape(m.type),
        csvEscape(m.headline),
        csvEscape(m.body),
        csvEscape(buildExportImagePrompt(m)),
        csvEscape(m.imageUrl ?? ''),
      ].join(',')
    )
  })
  return lines.join('\n')
}

export async function downloadAPlusDeliveryZip(draft: APlusDraft) {
  const zip = new JSZip()
  zip.file('aplus_draft.json', JSON.stringify(draft, null, 2))
  zip.file('amazon_copy.txt', toAmazonCopyText(draft))
  zip.file('modules.csv', toModulesCsv(draft))

  const imageList = draft.modules.map((m, idx) => ({
    index: idx + 1,
    type: m.type,
    imageUrl: m.imageUrl ?? null,
    imagePrompt: buildExportImagePrompt(m),
  }))
  zip.file('images.json', JSON.stringify({ images: imageList }, null, 2))

  zip.file(
    'README.txt',
    [
      'A+ 交付包',
      '',
      '- aplus_draft.json：完整草稿（含设置/锁定/元信息）',
      '- amazon_copy.txt：按模块顺序拼接的文案（运营可直接用）',
      '- modules.csv：表格格式（方便团队协作/二次加工）',
      '- images.json：图片 URL 与提示词清单（可交给设计或用于批量下载）',
      '',
      '提示：如需把图片打包进 ZIP，需要后端/代理下载以解决跨域与鉴权。',
      '',
    ].join('\n')
  )

  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(`aplus_delivery_${draft.draftId}.zip`, blob)
}

