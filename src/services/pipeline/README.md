# Moly 多 Agent Pipeline — 运行说明

## 一、前置条件

1. **后端服务**（提供 Jina Reader 抓取接口）  
   ```bash
   npm run dev:server
   ```
   默认端口 `3001`，需保证 `POST /api/amazon/fetch-markdown` 可用。

2. **前端开发服务**  
   ```bash
   npm run dev
   ```
   浏览器打开 http://localhost:5173。

3. **环境变量**（`.env` 或项目配置）  
   - `VITE_API_BASE=http://localhost:3001`（前端请求后端）
   - `VITE_GEMINI_API_KEY`、`VITE_GEMINI_BASE_URL` 等（AI 调用）

---

## 二、运行方式

### 方式 1：在浏览器控制台运行（快速测试）

登录后进入任意页面，打开开发者工具 (F12) → Console，粘贴并执行：

**初创模式示例：**

```javascript
const { runPipeline } = await import('/src/services/pipeline/index.ts')

const result = await runPipeline({
  mode: 'create',
  userProduct: {
    name: 'Wireless Bluetooth Earbuds',
    brand: 'Anker',
    category: 'electronics',
    specs: '40h battery, IPX5 water resistant, 5g per earbud',
    priceRange: '$25-35',
    targetAudience: 'Commuters, fitness enthusiasts',
    useCases: 'Commuting, gym, travel',
    differentiators: 'Longest battery in class, premium sound',
    features: 'Noise cancelling, TWS',
    market: 'us',
    language: 'en',
    images: []
  },
  competitorAsins: ['B0DKXXXXXX', 'B0DLXXXXXX'],  // 替换为真实 ASIN
  market: 'us',
  language: 'en'
}, (p) => console.log(`[${p.agent}] ${p.message}`))

console.log('分析报告', result.analysisReport)
console.log('生成 Listing', result.generatedListing)
```

**优化模式示例：**

```javascript
const { runPipeline } = await import('/src/services/pipeline/index.ts')

const result = await runPipeline({
  mode: 'optimize',
  userAsin: 'B0DJXXXXXX',           // 替换为你要优化的商品 ASIN
  competitorAsins: ['B0DKXXXXXX', 'B0DLXXXXXX'],
  market: 'us',
  language: 'en'
}, (p) => console.log(`[${p.agent}] ${p.message}`))

console.log('分析报告', result.analysisReport)
console.log('优化后 Listing', result.generatedListing)
console.log('原 vs 优化 对比', result.comparison)
```

注意：控制台里用 `import('/src/...')` 时，Vite 会按源码解析；若路径报错可改为项目实际别名，例如：

```javascript
const { runPipeline } = await import('@/services/pipeline')
```

---

### 方式 2：在业务代码里调用

在任意 Vue 或 TS 文件中：

```typescript
import { runPipeline } from '@/services/pipeline'

// 初创
const result = await runPipeline({
  mode: 'create',
  userProduct: store.productInfo,  // 来自 listing store
  competitorAsins: store.competitorAsins.filter(Boolean).map(a => extractAsin(a)),
  market: store.productInfo.market,
  language: store.productInfo.language
}, (progress) => {
  store.updateProgress(progress.progress, progress.message)
})

// 把结果写回 store 或展示
// result.analysisReport   → 中文分析报告（给用户看）
// result.generatedListing → 标题、五点、描述、搜索词
// result.strategyPrompts  → 内部使用，已注入生成过程
```

优化模式同理，传入 `mode: 'optimize'`、`userAsin` 和 `competitorAsins`。

---

### 方式 3：从 Listing 入口页「测试 Pipeline」按钮运行（已接入）

在 **一键生成 Listing** 入口页（`/tools/listing`）底部有 **「测试新 Pipeline」** 区域：

1. 选择模式：初创 / 优化  
2. 初创：填写商品名称、类目、特点，并填写至少 1 个竞品 ASIN  
3. 优化：填写自己的 ASIN + 至少 1 个竞品 ASIN  
4. 点击「运行 Pipeline」  
5. 控制台会打印进度；完成后在页面下方查看分析报告与生成结果摘要  

便于不写代码、直接在前端页面上跑通整条 Pipeline。

---

## 三、执行流程简述

| 步骤 | Agent | 说明 |
|------|--------|------|
| 1 | WebFetchAgent | 后端调 Jina，把每个 ASIN 对应 Amazon 页转成 Markdown |
| 2 | DataExtractAgent | 用 AI 从 Markdown 里提取结构化商品数据 |
| 3 | AnalysisAgent | 8 维度分析，输出中文分析报告 |
| 4 | StrategyAgent | 生成「隐藏」策略提示词 |
| 5 | ListingGenAgent | 用策略 + 商品信息生成 Listing |
| 6 | CompareAgent | 仅优化模式：原 Listing vs 优化结果对比 |

每步都会在控制台打印日志，便于调试。

---

## 四、常见问题

- **Jina 抓取失败**：检查后端是否启动、`VITE_API_BASE` 是否指到该后端；ASIN 是否有效、站点是否支持。  
- **AI 报错 / 超时**：检查 `VITE_GEMINI_*` 配置与网络。  
- **CORS**：抓取走后端，前端只调本域 API，一般无 CORS 问题。
