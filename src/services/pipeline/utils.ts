/**
 * Pipeline 通用工具函数
 */

export function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    let cleaned = raw.trim()
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) cleaned = fenceMatch[1].trim()
    return JSON.parse(cleaned) as T
  } catch {
    console.warn('[Pipeline] JSON 解析失败，使用 fallback。原始内容前200字符:', raw.substring(0, 200))
    return fallback
  }
}

export function truncateForLog(text: string, maxLen = 80): string {
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen) + '...'
}
