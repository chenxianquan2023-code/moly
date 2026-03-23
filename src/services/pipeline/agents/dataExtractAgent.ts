/**
 * Agent 2: DataExtractAgent — 数据提取
 *
 * 使用 AI 从 Amazon 页面 Markdown 中提取结构化商品数据。
 * 支持并行提取多个商品。
 */

import { geminiService } from '@/services/gemini.service'
import type {
  DataExtractInput,
  ExtractedProductData,
  ProgressCallback,
} from '../types'
import { safeParseJson } from '../utils'

const AGENT_NAME = 'DataExtractAgent'

function buildExtractionPrompt(asin: string, markdown: string): string {
  // 截断过长内容，保留最核心的前部分
  const truncated = markdown.length > 15000 ? markdown.slice(0, 15000) + '\n...(内容已截断)' : markdown

  return `
你是 Amazon 商品数据提取专家。请从以下 Amazon 商品页面的 Markdown 内容中，精确提取结构化的商品数据。

【ASIN】${asin}

【页面 Markdown 内容】
${truncated}

请严格按以下 JSON 格式输出（不要包含 markdown 代码块标记）：
{
  "asin": "${asin}",
  "title": "完整的商品标题",
  "brand": "品牌名称",
  "price": "价格（含货币符号）",
  "rating": "评分（如 4.5）",
  "salesVolume": "销量信息（如 '10K+ bought in past month'，找不到则填 '未知'）",
  "bulletPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "description": "完整的产品描述文本",
  "mainImageUrl": "主图 URL（如能从 markdown 中找到）",
  "secondaryImageUrls": ["副图URL1", "副图URL2"],
  "aPlusContent": {
    "modules": [
      {
        "type": "模块类型（如 banner/comparison/feature/brand_story）",
        "headline": "模块标题",
        "body": "模块正文内容",
        "imageDescriptions": ["图片描述1"]
      }
    ],
    "narrativeStyle": "A+页面整体叙事风格描述"
  },
  "implicitKeywords": ["从标题、五点、描述中提取的隐含搜索关键词"],
  "categoryPath": "商品类目路径（如 Home & Kitchen > Kitchen & Dining > ...）"
}

提取要求：
1. 所有字段都尽量从 Markdown 中找到原文填充，找不到的用空字符串
2. bulletPoints 应提取完整的五点描述（About this item 下的要点）
3. implicitKeywords 应从标题和五点中提炼出 10-15 个核心搜索关键词
4. A+ 内容通常在页面下半部分，以品牌故事、对比图表、功能展示等形式出现
5. 价格请包含货币符号
`.trim()
}

async function extractOne(
  input: DataExtractInput,
  index: number,
  total: number,
  onProgress?: ProgressCallback
): Promise<ExtractedProductData> {
  console.log(`[${AGENT_NAME}] (${index + 1}/${total}) 正在提取 ${input.asin} 的结构化数据...`)

  onProgress?.({
    agent: AGENT_NAME,
    step: 2,
    totalSteps: 6,
    progress: Math.round(((index + 1) / total) * 100),
    message: `正在提取 ${input.asin} 的结构化数据 (${index + 1}/${total})...`,
  })

  const prompt = buildExtractionPrompt(input.asin, input.markdown)
  const raw = await geminiService.generateText(prompt)

  const fallback: ExtractedProductData = {
    asin: input.asin,
    title: '',
    brand: '',
    price: '',
    rating: '',
    salesVolume: '',
    bulletPoints: [],
    description: '',
    mainImageUrl: '',
    secondaryImageUrls: [],
    aPlusContent: { modules: [], narrativeStyle: '' },
    implicitKeywords: [],
    categoryPath: '',
  }

  const result = safeParseJson<ExtractedProductData>(raw, fallback)

  console.log(`[${AGENT_NAME}] ✓ ${input.asin} 提取完成:`)
  console.log(`  标题: ${result.title?.substring(0, 60)}...`)
  console.log(`  品牌: ${result.brand}`)
  console.log(`  价格: ${result.price}`)
  console.log(`  评分: ${result.rating}`)
  console.log(`  五点数量: ${result.bulletPoints?.length}`)
  console.log(`  关键词数量: ${result.implicitKeywords?.length}`)
  console.log(`  A+模块数量: ${result.aPlusContent?.modules?.length}`)

  return result
}

export async function dataExtractAgent(
  inputs: DataExtractInput[],
  onProgress?: ProgressCallback
): Promise<ExtractedProductData[]> {
  console.log(`\n========== [${AGENT_NAME}] 开始执行 ==========`)
  console.log(`[${AGENT_NAME}] 待提取商品数量: ${inputs.length}`)

  // 并行提取（限制并发数避免 API 限流）
  const CONCURRENCY = 3
  const results: ExtractedProductData[] = []

  for (let i = 0; i < inputs.length; i += CONCURRENCY) {
    const batch = inputs.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map((input, batchIdx) =>
        extractOne(input, i + batchIdx, inputs.length, onProgress)
      )
    )
    results.push(...batchResults)
  }

  console.log(`[${AGENT_NAME}] 全部提取完成: ${results.length} 个商品`)
  console.log(`========== [${AGENT_NAME}] 执行完毕 ==========\n`)

  return results
}
