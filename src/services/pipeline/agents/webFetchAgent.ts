/**
 * Agent 1: WebFetchAgent — 网页抓取
 *
 * 通过后端 Jina Reader 将 Amazon 商品页转为 Markdown 文本。
 * 支持并行抓取多个 ASIN。
 */

import type { WebFetchInput, WebFetchOutput, ProgressCallback } from '../types'

const AGENT_NAME = 'WebFetchAgent'

export async function webFetchAgent(
  inputs: WebFetchInput[],
  onProgress?: ProgressCallback
): Promise<WebFetchOutput[]> {
  console.log(`\n========== [${AGENT_NAME}] 开始执行 ==========`)
  console.log(`[${AGENT_NAME}] 待抓取 ASIN 数量: ${inputs.length}`)
  console.log(`[${AGENT_NAME}] ASIN 列表:`, inputs.map(i => i.asin))

  const API_BASE = import.meta.env.VITE_API_BASE || ''
  if (!API_BASE) {
    console.warn(
      `[${AGENT_NAME}] VITE_API_BASE 为空，将使用相对路径请求。` +
        `如后端不在同域端口(例如 3001)，将导致 /api/amazon/* 404。`
    )
  }
  const results: WebFetchOutput[] = []

  const fetchOne = async (input: WebFetchInput, index: number): Promise<WebFetchOutput> => {
    console.log(`[${AGENT_NAME}] (${index + 1}/${inputs.length}) 正在抓取 ${input.asin}...`)

    onProgress?.({
      agent: AGENT_NAME,
      step: 1,
      totalSteps: 6,
      progress: Math.round(((index + 1) / inputs.length) * 100),
      message: `正在抓取 ${input.asin} (${index + 1}/${inputs.length})...`,
    })

    try {
      const endpoint = `${API_BASE}/api/amazon/fetch-markdown`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asin: input.asin, market: input.market }),
      })
      const contentType = res.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      const data = isJson ? await res.json() : null

      if (!res.ok) {
        const fallbackMsg = isJson
          ? (data?.message || `HTTP ${res.status}`)
          : `HTTP ${res.status}（非 JSON 响应，可能是接口不存在/后端未启动）`
        console.warn(
          `[${AGENT_NAME}] ✗ ${input.asin} 抓取失败: ${fallbackMsg} | endpoint=${endpoint}`
        )
        return {
          asin: input.asin,
          url: '',
          markdown: '',
          success: false,
          error: fallbackMsg,
        }
      }

      if (data?.success && data?.markdown) {
        console.log(`[${AGENT_NAME}] ✓ ${input.asin} 抓取成功 (${data.markdown.length} 字符)`)
        return {
          asin: input.asin,
          url: data.url,
          markdown: data.markdown,
          success: true,
        }
      }

      const msg = data?.message || (isJson ? '未知错误' : '后端返回非 JSON，无法解析')
      console.warn(`[${AGENT_NAME}] ✗ ${input.asin} 抓取失败: ${msg}`)
      return {
        asin: input.asin,
        url: '',
        markdown: '',
        success: false,
        error: msg,
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[${AGENT_NAME}] ✗ ${input.asin} 抓取异常:`, errorMsg)
      return {
        asin: input.asin,
        url: '',
        markdown: '',
        success: false,
        error: errorMsg,
      }
    }
  }

  // 并行抓取所有 ASIN
  const promises = inputs.map((input, index) => fetchOne(input, index))
  const allResults = await Promise.allSettled(promises)

  for (const r of allResults) {
    if (r.status === 'fulfilled') {
      results.push(r.value)
    }
  }

  const successCount = results.filter(r => r.success).length
  console.log(`[${AGENT_NAME}] 抓取完成: ${successCount}/${inputs.length} 成功`)
  console.log(`========== [${AGENT_NAME}] 执行完毕 ==========\n`)

  return results
}
