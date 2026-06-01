# 「找爆款」设计文档 —— Apify 抓取爆款视频/产品 + 付费下载

- 日期：2026-06-01
- 状态：待用户评审
- 关联项目：Moly 爆款视频复刻（Vue3 + Express + Supabase，已上线 Railway / advideo 分支）

## 1. 背景与目标

现有 MVP：用户上传商品图（+ 可选上传一个参考爆款视频）→ AI 拆解复刻成带货短视频。
本期在此基础上新增「找爆款」：用户用关键词去 TikTok / Amazon 搜罗爆款，浏览数据、付费下载原视频、或一键带入复刻流程。降低用户"自己找素材/参考"的门槛。

## 2. 范围

**本期做（feature A）：**
- 左侧导航布局改造（侧边栏 shell）
- 「找爆款」页：关键词 + 平台搜索 → 结果墙（TikTok 视频卡 / Amazon 产品卡）
- 付费下载 TikTok 原视频（积分）
- 「用它复刻」一键带入现有复刻工作台

**不在本期（单独处理）：**
- feature B：复刻生成的进度友好提示（独立小改，另起 spec/计划）
- 侧边栏的「历史」「我的」详情页（本期只占位 + 「我的」放左下角）
- Amazon「选品」的深加工（本期 Amazon 只到"产品图带入复刻"）

## 3. 总体架构

把当前"单页工作台"升级为「侧边栏 + 主区」：

```
┌────────┬──────────────────────────────┐
│ 🎬 复刻 │                              │
│ 🔍 找爆款│         主内容区              │
│ 🗂 历史 │   (/studio 工作台 / /discover) │
│        │                              │
│ ──────  │                              │
│ 👤 我的  │  ← 头像+积分钉在最左下角        │
└────────┴──────────────────────────────┘
```

- 新增带侧边栏的 layout 组件；导航项：复刻工作台、找爆款、历史(占位)。
- 「我的」(头像 + 积分 + 退出)钉在侧边栏**最左下角**，不进导航列表。
- 路由：新增 `/discover`（找爆款），复用 `/studio`（工作台）。

## 4. 用户流程（找爆款）

1. 左侧点「找爆款」进入 `/discover`。
2. 搜索区：**商品关键词**输入框 + **平台勾选**（☑TikTok ☑Amazon，可全选）+「搜索」。
3. 抓取中：友好 loading —「正在全网搜罗爆款，约 10–30 秒…」。
4. 结果墙（按平台分区）：
   - **TikTok 卡**：封面 + ▶ + ❤️点赞 + ▶️播放数 + 描述/作者。操作：`预览`、`下载原视频(5积分)`、`用它复刻 →`
   - **Amazon 卡**：产品图 + 标题 + 价格 + ⭐评分。操作：`用此商品图复刻 →`
5. `用它复刻 →`：把素材转存为复刻用 asset → 跳 `/studio` 并预填（TikTok→参考视频位；Amazon→商品图位）→ 用户接着选语言/音色生成。
6. `下载原视频`：扣 5 积分 → 取原视频转存 → 前端 blob 下载（停在当前页，复用现有下载逻辑）。

## 5. 数据模型（Supabase 新增 2 表）

```sql
-- 抓取结果缓存：同关键词+平台 N 天内复用，不重复抓
create table if not exists discover_cache (
  id uuid primary key default gen_random_uuid(),
  keyword     text not null,
  platform    text not null,           -- 'tiktok' | 'amazon'
  results     jsonb not null,          -- 归一化后的结果数组
  created_at  timestamptz default now()
);
create index if not exists idx_discover_cache_key on discover_cache(keyword, platform);

-- 付费下载记录：已下过的可免费重下，避免重复付 Apify
create table if not exists discover_downloads (
  id uuid primary key default gen_random_uuid(),
  user_email  text not null,
  source_url  text not null,           -- 原视频在平台的唯一 URL
  video_url   text not null,           -- 转存到 Supabase 后的可下载 URL
  credits     int  not null default 5,
  created_at  timestamptz default now()
);
create index if not exists idx_discover_dl_user on discover_downloads(user_email, source_url);
```

归一化结果项（存进 `discover_cache.results`，前端直接渲染）：
```ts
// TikTok
{ platform:'tiktok', sourceUrl, cover, desc, author, likes, views, shares, videoUrl? }
// Amazon
{ platform:'amazon', sourceUrl, image, title, price, rating, asin }
```

## 6. 后端 API + Apify 调用

新模块 `server/lib/apify.js`：封装 Apify API 调用（读 `APIFY_TOKEN`，用 `run-sync-get-dataset-items` 同步拿结果）。

| 端点 | 入参 | 行为 |
|---|---|---|
| `POST /api/discover/search` | `{keyword, platforms:[]}` | 每个平台：查 `discover_cache`→未命中调对应 Apify actor→归一化→写缓存→合并返回。**抓取免费** |
| `POST /api/discover/download` | `{userEmail, sourceUrl}` | 查 `discover_downloads`：有→返回已存 `video_url`（免费重下）；无→`deductPoints(5)`→取原视频`uploadBuffer`转存→写记录→返回 URL。积分不足→`code:'INSUFFICIENT'` |
| `POST /api/discover/to-asset` | `{userEmail, item}` | `uploadFromUrl` 转存→`insertRow('assets')` 建 asset→返回 `assetId`（视频建 source_video 资产，图建 product_image 资产） |

Apify actors：
- TikTok：`clockworks/tiktok-scraper`（关键词搜索，返回 cover/diggCount/playCount/text/authorMeta/webVideoUrl；含"视频下载"附加项）。约 $0.005/条(含下载)。
- Amazon：`junglee/Amazon-crawler`（返回 title/price/rating/images/asin）。约 $0.005/条。

成本对齐：抓取阶段**不**开下载附加项（便宜，只拿元数据/封面）；用户付费下载时才真正取原视频，成本只在付费动作发生。

## 7. 计费模型（积分）

| 动作 | 收费 | 理由 |
|---|---|---|
| 抓取 / 搜索 | 免费 | 平台扛 Apify 搜索成本，内测量小，鼓励使用 |
| **下载 TikTok 原视频** | **5 积分** | 纯下载、无后续生成，需覆盖 Apify 下载成本 |
| **用它复刻**（带入工作台） | 免费 | 后续"生成"本就扣 ~50 积分，成本在那回收 |

`pricing.js` 新增 `DOWNLOAD_COST = 5`（可配）；下载扣费复用 `server/lib/points.js` 的 `deductPoints`。

## 8. 带入复刻（StudioView 预填）

- `用它复刻 →` 调 `/api/discover/to-asset` 拿到 assetId → 前端 `router.push('/studio?sourceVideoId=<id>')`（TikTok）或 `?productAssetId=<id>`（Amazon）。
- StudioView `onMounted` 读 `route.query`：有 `sourceVideoId`→拉该 asset 设为 `sourceVideoAsset` + 走现有 `/api/source-videos`；有 `productAssetId`→设为 `productAsset`。其余流程不变。

## 9. 错误处理

- Apify 失败/超时/无结果 → 友好提示（「没搜到爆款，换个关键词试试」/「抓取超时，重试」），不暴露原始报错。
- 下载积分不足 → 复用现有充值弹窗。
- 缓存命中 → 秒出（不调 Apify）。
- 单平台失败不阻塞另一平台（部分成功也展示）。

## 10. 新增配置

- `APIFY_TOKEN`：Apify API token（本地 `.env` + Railway 都要加）。用户去 Apify 后台获取。

## 11. 待实现期确认的点

- **Amazon actor 关键词搜索入参**：`junglee/Amazon-crawler` 偏向传 URL/分类；实现时先拉它的 input schema，确认能否直接关键词搜索，必要时换支持关键词搜索的 Amazon actor（或后端用关键词拼 Amazon 搜索 URL 再传入）。
- TikTok 原视频下载的取流方式：优先用 actor 的下载附加项拿无水印 mp4；确认返回字段。

## 12. 测试

- Apify 集成：用真实 `APIFY_TOKEN` 小量(maxItems≤5)跑通 TikTok / Amazon 搜索，校验归一化字段。
- 下载流程：积分充足→扣费+转存+返回可下载 URL；不足→提示充值；重复下载→免费。
- 带入复刻：TikTok→参考视频位、Amazon→商品图位 正确预填，生成流程跑通。
- 缓存：同关键词二次搜索走缓存、不调 Apify。

## 13. 不在本期范围

- feature B（复刻进度友好提示）—— 独立处理。
- 侧边栏「历史」「我的」详情页 —— 本期占位。
- Amazon 选品深加工、TikTok 评论/转写等附加数据。
