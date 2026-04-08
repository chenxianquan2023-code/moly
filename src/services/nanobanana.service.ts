import { AI_CONFIG } from '@/config/ai.config'

export interface NanobananaGenerateOptions {
  prompt: string
  referenceImages: string[]
  count?: number
  size?: string
  model?: string
}

export interface NanobananaImage {
  url: string
  sourceUrl?: string
}

function guessMimeType(url: string) {
  if (url.startsWith('data:image/png')) return 'image/png'
  if (url.startsWith('data:image/webp')) return 'image/webp'
  if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) return 'image/jpeg'
  if (url.includes('.png')) return 'image/png'
  if (url.includes('.webp')) return 'image/webp'
  return 'image/jpeg'
}

async function toFile(imageUrl: string, filename: string): Promise<File> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`参考图读取失败: ${response.status}`)
  }

  const blob = await response.blob()
  const mimeType = blob.type || guessMimeType(imageUrl)
  return new File([blob], filename, { type: mimeType })
}

function dataUrlToBase64Image(data: string) {
  const mime = data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)?.[1] || 'image/png'
  return `data:${mime};base64,${data.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')}`
}

class NanobananaService {
  private readonly apiKey = AI_CONFIG.apiKey
  private readonly baseUrl = AI_CONFIG.baseUrl
  private readonly defaultModel = import.meta.env.VITE_NANOBANANA_MODEL || 'gemini-3.1-flash-image-preview'

  async generateImages(options: NanobananaGenerateOptions): Promise<NanobananaImage[]> {
    const {
      prompt,
      referenceImages,
      count = 1,
      size = '1024x1792',
      model = this.defaultModel,
    } = options

    const formData = new FormData()
    formData.append('model', model)
    formData.append('prompt', prompt)
    formData.append('n', String(count))
    formData.append('size', size)
    formData.append('response_format', 'url')

    const referenceFiles = await Promise.all(
      referenceImages.map((imageUrl, index) => toFile(imageUrl, `reference-${index + 1}.png`))
    )

    referenceFiles.forEach((file) => {
      formData.append('image', file, file.name)
    })

    const response = await fetch(`${this.baseUrl}/v1/images/edits`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NanoBanana 请求失败: ${response.status} ${errorText}`)
    }

    const payload = await response.json()
    const data = Array.isArray(payload?.data) ? payload.data : []

    if (!data.length) {
      throw new Error('NanoBanana 未返回图片结果')
    }

    return data
      .map((item: any) => {
        if (typeof item?.url === 'string' && item.url) {
          return {
            url: item.url,
            sourceUrl: item.url,
          }
        }

        if (typeof item?.b64_json === 'string' && item.b64_json) {
          const dataUrl = dataUrlToBase64Image(item.b64_json)
          return {
            url: dataUrl,
          }
        }

        return null
      })
      .filter(Boolean) as NanobananaImage[]
  }
}

export const nanobananaService = new NanobananaService()
export default NanobananaService
