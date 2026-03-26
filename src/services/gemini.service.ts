/**
 * Gemini AI 服务封装
 * 
 * 使用 @google/genai SDK 提供与 Gemini API 的底层交互能力
 */

import { GoogleGenAI } from '@google/genai'
import type { AIConfig } from '@/types/ai.types'
import { AI_CONFIG } from '@/config/ai.config'

// 图片 Part 类型定义
interface ImagePart {
    inlineData: {
        data: string
        mimeType: string
    }
}

interface TextPart {
    text: string
}

type Part = ImagePart | TextPart

class GeminiService {
    private client: GoogleGenAI
    private config: AIConfig

    constructor(config: AIConfig = AI_CONFIG) {
        this.config = config
        this.client = new GoogleGenAI({
            apiKey: config.apiKey,
            httpOptions: {
                baseUrl: config.baseUrl,
                timeout: 600000, // 10分钟超时，降低大图生成超时概率
            },
        })
    }

    /**
     * 更新配置
     */
    updateConfig(config: Partial<AIConfig>) {
        this.config = { ...this.config, ...config }
        this.client = new GoogleGenAI({
            apiKey: this.config.apiKey,
            httpOptions: {
                baseUrl: this.config.baseUrl,
                timeout: 600000, // 10分钟超时，配置更新后保持一致
            },
        })
    }

    /**
     * 将图片 URL 转换为 base64
     */
    private async urlToBase64(url: string): Promise<string> {
        // 如果已经是 base64，直接返回
        if (url.startsWith('data:image')) {
            return url.split(',')[1] || ''
        }

        // Blob URL 或普通 URL，通过 fetch 获取
        const response = await fetch(url)
        const blob = await response.blob()
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => {
                const dataUrl = reader.result as string
                resolve(dataUrl.split(',')[1] || '')
            }
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    }

    /**
     * 将图片 URL 数组预解析为 data URL，避免并行请求时 blob URL 并发 fetch 失败
     * 解析顺序执行，确保同一 blob 不会并发 fetch
     */
    async resolveImageUrlsToDataUrls(urls: string[]): Promise<string[]> {
        const seen = new Map<string, string>()
        const result: string[] = []
        for (const url of urls) {
            if (url.startsWith('data:image')) {
                result.push(url)
                continue
            }
            const cached = seen.get(url)
            if (cached) {
                result.push(cached)
                continue
            }
            const response = await fetch(url)
            const blob = await response.blob()
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
            })
            seen.set(url, dataUrl)
            result.push(dataUrl)
        }
        return result
    }

    /**
     * 获取图片 MIME 类型
     */
    private getMimeType(url: string): string {
        if (url.includes('.png')) return 'image/png'
        if (url.includes('.gif')) return 'image/gif'
        if (url.includes('.webp')) return 'image/webp'
        return 'image/jpeg' // 默认 JPEG
    }

    /**
     * 创建图片 Part 对象
     */
    private async createImagePart(imageUrl: string): Promise<ImagePart> {
        const base64Data = await this.urlToBase64(imageUrl)
        const mimeType = this.getMimeType(imageUrl)

        return {
            inlineData: {
                data: base64Data,
                mimeType
            }
        }
    }

    /**
     * 通用生成内容方法（复用核心逻辑）
     */
    private async generateContent(
        modelName: string,
        parts: Part[],
        options?: {
            temperature?: number
            maxOutputTokens?: number
            responseModalities?: string[]
            aspectRatio?: string
            imageSize?: string
        }
    ): Promise<{ text: string; imageData?: string }> {
        const config: Record<string, unknown> = {
            temperature: options?.temperature ?? 0.7,
            maxOutputTokens: options?.maxOutputTokens ?? 8192,
        }

        // 添加图片生成相关配置
        if (options?.responseModalities) {
            config.responseModalities = options.responseModalities
        }

        // 图片参数需要嵌套在 imageConfig 中
        if (options?.aspectRatio || options?.imageSize) {
            // imageConfig 直接挂载在 config (即 GenerationConfig) 下
            config.imageConfig = {
                aspectRatio: options?.aspectRatio || '3:4',
                imageSize: options?.imageSize || '2K',
            }
        }

        const response = await this.client.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts }],
            config,
        })

        // 解析响应
        const candidates = response.candidates
        if (candidates && candidates.length > 0) {
            const content = candidates[0]?.content
            if (content?.parts) {
                for (const part of content.parts) {
                    // 检查是否有图片数据
                    if ('inlineData' in part && part.inlineData) {
                        const { data, mimeType } = part.inlineData as { data: string; mimeType: string }
                        return {
                            text: '',
                            imageData: `data:${mimeType};base64,${data}`
                        }
                    }
                    // 返回文本
                    if ('text' in part && part.text) {
                        return { text: part.text }
                    }
                }
            }
        }

        return { text: '' }
    }

    /**
     * 为请求增加超时控制（用于前端可控等待时长）
     */
    private withTimeout<T>(promise: Promise<T>, timeoutMs?: number, message?: string): Promise<T> {
        if (!timeoutMs || timeoutMs <= 0) return promise
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(message || `Request timeout after ${timeoutMs}ms`))
            }, timeoutMs)

            promise
                .then((value) => {
                    clearTimeout(timer)
                    resolve(value)
                })
                .catch((error) => {
                    clearTimeout(timer)
                    reject(error)
                })
        })
    }

    /**
     * 发送文本请求 (使用分析模型)
     */
    async generateText(prompt: string): Promise<string> {
        try {
            const result = await this.generateContent(
                this.config.analysisModel,
                [{ text: prompt }]
            )
            return result.text
        } catch (error) {
            console.error('[GeminiService] generateText error:', error)
            throw error
        }
    }

    /**
     * 发送带图片的请求 (使用分析模型)
     */
    async generateWithImages(prompt: string, imageUrls: string[]): Promise<string> {
        try {
            const imageParts = await Promise.all(
                imageUrls.map(url => this.createImagePart(url))
            )

            const parts: Part[] = [{ text: prompt }, ...imageParts]
            const result = await this.generateContent(this.config.analysisModel, parts)
            return result.text
        } catch (error) {
            console.error('[GeminiService] generateWithImages error:', error)
            throw error
        }
    }

    /**
     * 使用分析模型进行图片分析 (Flash 模型，速度快)
     */
    async generateWithImagesUsingFlash(prompt: string, imageUrls: string[]): Promise<string> {
        try {
            const imageParts = await Promise.all(
                imageUrls.map(url => this.createImagePart(url))
            )

            const parts: Part[] = [{ text: prompt }, ...imageParts]
            // 使用分析模型 (gemini-3-flash-preview)
            const result = await this.generateContent(this.config.analysisModel, parts)
            return result.text
        } catch (error) {
            console.error('[GeminiService] generateWithImagesUsingFlash error:', error)
            throw error
        }
    }

    /**
     * 生成图片 (使用图片生成模型 Pro)
     * @param prompt 提示词
     * @param referenceImages 参考图片数组
     * @param options 图片生成配置选项
     */
    async generateImage(
        prompt: string,
        referenceImages: string[] = [],
        options?: {
            aspectRatio?: string
            imageSize?: string
            temperature?: number
            model?: string
            requestTimeoutMs?: number
        }
    ): Promise<string> {
        try {
            const parts: Part[] = [{ text: prompt }]

            // 添加参考图片
            for (const imageUrl of referenceImages) {
                const imagePart = await this.createImagePart(imageUrl)
                parts.push(imagePart)
            }

            const modelName = options?.model || this.config.imageModel

            // 使用图片生成模型（默认走全局配置，支持单次覆盖）
            const result = await this.withTimeout(
                this.generateContent(
                    modelName,
                    parts,
                    {
                        temperature: options?.temperature ?? 0.7,
                        maxOutputTokens: 8192,
                        responseModalities: ['TEXT', 'IMAGE'],
                        aspectRatio: options?.aspectRatio,
                        imageSize: options?.imageSize,
                    }
                ),
                options?.requestTimeoutMs,
                '生图请求超时，请稍后重试'
            )

            if (result.imageData) {
                return result.imageData
            }

            if (result.text) {
                return result.text
            }

            throw new Error('No image generated in response')
        } catch (error) {
            console.error('[GeminiService] generateImage error:', error)
            throw error
        }
    }
}

// 导出单例实例
export const geminiService = new GeminiService()
export default GeminiService
