import JSZip from 'jszip'
import type { APlusDraft } from '@/stores/aplus'

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
        csvEscape(m.imagePrompt ?? ''),
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
    imagePrompt: m.imagePrompt ?? null,
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

