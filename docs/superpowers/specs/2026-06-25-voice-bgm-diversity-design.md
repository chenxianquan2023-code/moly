# 配音不干 + 视频更多样性（第一期：音频多样性全家桶）设计

- 日期：2026-06-25
- 范围：**第一期 = 音频多样性全家桶**（裂变多版本、分镜编辑面板列入第二期，本文不展开）
- 主要改动文件：`server/replica/pipeline.js`、`server/replica/ai/tts.js`、`server/replica/ai/ffmpeg.js`、`server/replica/voices.js`、`server/replica/routes.js`、`server/db/schema.sql`、`src/views/StudioView.vue`

## 1. 背景与目标

用户反馈：复刻成片"配音很干燥、很 AI、视频很 low"，核心诉求是**让视频生成更多样性**。

实测证据（用户 2026-06-24 09:39 成片，43s）：**32.5s 是 <-30dB 死寂**，整片只有 ~10s 在出声。根因不是 TTS 音质，而是**音频信息密度极低 + 每条片子一个模子**。

目标：把"配音干燥"和"更多样性"当成同一个病的两面来治——提升**音频信息密度**（有 BGM、有情感）+ 引入**音频层多样性**（情感/音色/BGM/风格按片变化），让每条成片是 `音色 × 情感 × BGM × 风格` 的不同组合。

## 2. 统一设计思路

一条双轴：
- **地基**：先修"配音时 BGM 死寂"的回归 bug（立竿见影，且是后面所有音频多样性的前提）。
- **多样性轴（音频层）**：逐镜情感 + BGM 库/上传 + 音色轮换 + 风格档，叠加成多样性乘数。
- **质量轴**：混音响度归一 + ducking + 配音砍尾修复，保证"有 BGM"之后听感专业、不爆音、不丢镜。

## 3. 范围

### 第一期（in scope）
- WS1：BGM 死寂 bug 修复 + 动态音量策略
- WS2：配音砍尾 / 时长对齐修复（与 WS1 打包验收）
- WS3：逐镜情感（火山 / Azure / MiniMax 统一情感映射）
- WS4：内置免版税 BGM 库 + 用户上传 BGM + mood 选曲器
- WS5：混音质量（loudnorm 响度归一 + sidechaincompress ducking）
- WS6：音色轮换 + prompt 风格档
- WS7：音频提示词导演（AI 建议 + 用户可写 → 驱动配音/BGM）

### 第二期（out of scope，本文不设计）
- C1：一源裂变多版本（导演 LLM「1 原版 + N 裂变卡」）
- C2：分镜音频/字幕拆分编辑面板 + 单镜重配音

## 4. 已验证的关键事实（动手前已实测，非假设）

1. **BGM bug 确认**：`pipeline.js:589`（`composeVideo` helper）和 `pipeline.js:1710`（主路径内联）两处条件均为 `if (opts.generate_music !== false && !ttsOk && existsSync(src.mp4))`。`!ttsOk` 导致**只要有 AI 配音，BGM 分支永不进入**；其后的 `amix` 混音（`612-618` / `1733-1740`）成了死代码。
2. **火山 BigTTS 情感原生支持（已实测生效）**：对 `zh_female_yuanqinvyou_moon_bigtts` 在 `audio` 对象加 `emotion: happy/angry/excited/sad`，每个都产出与基线不同的音频（字节数 + md5 全不同），证明真生效。**moon 系 8 个音色**支持情感，**mars 系 7 个**未验证（按"只对 moon 发 emotion"处理）。
3. **情感映射键 = `shot.role`**：导演 LLM 已输出每镜 `role`（hook/demo/proof/cta，见 `pipeline.js:764` schema 与 `:422` 兜底派生）。
4. **FFmpeg 8.0.1**（远超 4.0）：`sidechaincompress` 可用，ducking 直接用它。
5. **生产实际走火山**：本地 `.env TTS_PROVIDER=minimax`，但线上成片用的是 `volc-*` 音色（由用户选 `ttsVoice` → `resolveVoice` 路由到 volcano）。情感方案必须覆盖 volcano。

## 5. 工作流详细设计

### WS1 — BGM 死寂 bug 修复 + 动态音量

**改法**：两处条件去掉 `!ttsOk`，改为按统一的"BGM 来源解析"决定是否有 BGM，再按 `ttsOk` 决定混音音量。引入 `opts.bgmMode`（`'auto'` 默认 / `'never'`）保留向后兼容与 regen 缓存路径，不裸删条件。

```
有 BGM 源 && bgmMode!=='never' && generate_music!==false →
    ttsOk=true  : BGM 作轻底垫（配合 WS5 的 ducking，停顿处自动抬回）
    ttsOk=false : BGM 作主音轨（volume≈0.9）
```

**BGM 来源优先级**（WS4 落地）：`custom_bgm（用户上传）> bgm_library（选曲）> 源视频音轨 > 无`。

**覆盖路径**：motion / showcase / oneshot / main 四条 × (有配音/无配音/降级)，外加 regen 单镜缓存重合成。`composeVideo` helper 与主内联两处同步改。

### WS2 — 配音砍尾 / 时长对齐修复

**问题**：`amix duration=first` + 视频 trim 用的 `sceneDurations`（可能被 `snapToBeats` 改过）与配音总长不一致时，配音/后段镜被 `-shortest` 砍掉（模特镜消失根因）。

**改法**：`addAudio` 前对 `concatPath` 重新 `ffprobe` 取实际时长，与 `voice.mp3` 对齐；若视频短于配音，用 `apad` 补齐视频侧/末镜定格而非砍音频。生成后加 `ffprobe` 断言：成片音视频时长差 < 0.3s，否则记 note。与 WS1 同一次验收。

### WS3 — 逐镜情感（统一映射）

**新增** `mapSceneRoleToEmotion(role, provider, voice)`（放 `tts.js` 或 `voices.js`），返回该 provider 可用的情感配置：

| role | volcano(moon) `emotion` | azure `style` | minimax `emotion` |
|---|---|---|---|
| hook | excited | cheerful | happy |
| demo | happy | chat | happy |
| proof | （不传，保持中性基线）| newscast/professional | neutral |
| cta | excited | advertisement_upbeat | happy |

- **volcano**：`volcanoTTS` 签名加 `emotion`，仅当音色 `emotionCapable`（moon 系）时写入 `audio.emotion`（+ `enable_emotion:true`）；mars 系不发、保持现状。`voices.js` 给每个音色加 `emotionCapable` 标记。已实测生效的情感词：`happy/excited/angry/sad`；`proof` 用"不传 emotion = 中性基线"而非断言未验证的词。实现时对每个 moon 音色快速跑一遍确认其支持的情感集（火山不同音色情感集略有差异），不支持的词降级为不传。
- **azure / minimax**：已有 `style`/`emotion` 字段，但当前全片硬编码（azure 走 voices.js 的 style、minimax 写死 `happy`）→ 改为接同一映射、按 role 变化。
- **注入点**：`pipeline.js` 三处 `synthesize` 调用（约 `:950` showcase / `:1063` oneshot / `:1387` main，实现时以代码为准），用 `scenes[i].role` 取情感。
- **降级**：拿不到 role 或 provider 不支持 → 不传情感（等于现状），绝不因情感报错中断配音。

### WS4 — 免版税 BGM 库 + 用户上传 + 选曲器

**数据模型**：新增 `bgm_library` 表
```
id uuid pk, title text, artist text,
mood text[],            -- 活力/温暖/激励/治愈/科技
genre text, tempo_bpm int, duration numeric,
measured_lufs numeric,  -- WS5 导入时离线测
license_type text,      -- 'pixabay_cc0' | 'mixkit'
source_url text, attribution text,
file_url text,          -- Supabase storage /bgm-library/
created_at timestamptz default now()
```
- **选曲来源**：第一期手工精选 **Pixabay(CC0) + Mixkit** 20-30 首，按 mood 分类，下载入库时跑一遍 loudnorm 存 `measured_lufs`，`license_type/source_url/attribution` 必填可追溯。
- **用户上传 BGM**：复用 `uploadAsset` + `assets` 表，`routes.js ASSET_TYPES` 加 `'bgm_audio'`（mp3/wav，≤10MB）。无需改 assets schema。BGM 视为素材、不单独计费。
- **后端**：新增 `GET /api/replica/bgm-library`（列表，带试听 url + license）；`generate` 入参加 `custom_bgm_asset_id` / `bgm_library_id`；`pipeline` 按 WS1 的优先级加载本地文件参与混音。
- **前端**：镜像现有"音色选择器 Modal（`vp-modal`）"做"BGM 选曲器"——mood 筛选 + 列表 + 试听 + license 标注 + 上传入口；`buildGenBody` 加上述字段。
- **"抓热门 BGM" = 不做**（合规结论，见 §6）。代之以 `bgm_hottrend_mapping`（热门曲风 → 库内 track_id，手工维护可选，第一期可不上），对外文案主打"合规可商用、各平台安全可发"。

### WS5 — 混音质量（响度归一 + ducking）

**新增** `ffmpeg.js: normalizeAudio(input, targetLufs=-16)`：`loudnorm` 双遍（EBU R128）。
- **粒度（采纳混合方案）**：BGM 入库时离线双遍归一并存 `measured_lufs`；运行时成片整体做一次 -16 LUFS 归一。逐镜归一暂不做。
- **ducking**：混音用 `sidechaincompress`（人声为 sidechain 驱动 BGM 下潜，停顿处 BGM 自然回升）——这正是填"死寂"的关键。FFmpeg 8.0.1 已支持。**compand 作为兜底**（若某环境报错）。
- **防爆音/防浑**：BGM 加 `highpass=f=300` 切低频避开人声中频；混音后 peak ≤ -1dB。
- BGM 轻底垫音量从 `0.22` 调到 `0.15–0.2` 区间，**灰度按反馈微调**。

### WS6 — 音色轮换 + prompt 风格档

- **音色轮换**：`voices.js` 给音色加 `styles`/`sceneTypeAffinity`；`pipeline` 不再一次性 `resolveVoice`，而是按 `scene.role` 或 index 在"用户选定音色的同风格集合"内轮换。用户明确选了音色 → 从其同风格替代起；选"自动" → 按场景智能选。**默认仍单音色**，轮换是可选增强。
- **prompt 风格档**：把导演 LLM 的口播/分镜 prompt 抽成可切换"风格档"（高能带货 / 治愈种草 / 测评理性 / 剧情反转），每档对应不同语气 + 节奏 + 默认 emotion + 默认 BGM mood。前端一个下拉即整体换风格。这是"多样性"最易感知的总开关。

### WS7 — 音频提示词导演（AI 建议 + 用户可写 → 驱动配音/BGM）

依赖 WS3/WS4/WS6。**完全叠加，默认不填 = 现状行为不变**（不影响现有功能）。镜像现有"AI 填写建议"（`routes.js:197` 的 `prompt-guide`：商品图 + 源视频抽帧 → Gemini → 可编辑提示词）的范式，把它扩展到音频层。

**① AI 建议（扩展现有 prompt-guide）**：`POST /api/replica/prompt-guide` 的 LLM 输出 schema 增加 `audioDirection`：
```
"audioDirection": {
  "voicePrompt": "理想配音的人话描述(人设/语气/语速/情绪弧)",
  "bgmPrompt":   "理想BGM的人话描述(曲风/节奏/情绪/氛围)",
  "suggestedVoiceId": "从音色库挑的最贴音色 id",
  "voiceEmotionArc": {"hook":"excited","demo":"happy","proof":"","cta":"excited"},
  "suggestedBgmMood":  "活力|温暖|激励|治愈|科技",
  "suggestedBgmGenre": "流行电子/轻原声/…"
}
```
LLM 已能看到商品图 + 源视频帧，据此给贴合的音频方向。前端在"AI 填写建议"弹窗里多一个"音频"步骤展示，预填到下面的可写框。

**② 用户可写**：音频设置区加两个文本框 `voicePrompt` / `bgmPrompt`，被 AI 建议预填、可改、可清空。

**③ 据提示词生成对应音频**：
- **配音**：新增 `resolveVoiceFromPrompt(voicePrompt, language)`（LLM/启发式）→ `{ voiceId, emotionArc, speed }`；并把 `voicePrompt` 注入导演 LLM 的口播生成（影响**文案语气**，不只是音色）。落到 WS3/WS6。
- **BGM（已拍板：库匹配先上 + AI 原创进阶）**：
  - **第一期 = 库语义匹配**：新增 `matchBgmFromPrompt(bgmPrompt)` → LLM/标签把提示词映射到 `bgm_library` 里最贴的曲（mood/genre/tempo）。复用 WS4 的库，免费即时。
  - **进阶（opt-in，默认不开）= AI 原创配乐**：`bgmMode='ai'` 时走 **fal 文生音乐**（如 `stable-audio` / `minimax-music` / `lyria2`，实现时确认可用与计价），复用现有 `FAL_KEY` + 队列模式（参考 `seedream.js`），每条独一份、最贴提示词。加生成成本 + 时延，需确认 AI 配乐授权与内容审核；放在库匹配之后做。

**降级**：voice/bgm 提示词解析失败 → 回退用户手选音色 + WS4 默认 BGM 来源，绝不中断生成。

**计费**：AI 建议、库语义匹配不额外计费；AI 原创配乐（进阶）按 fal 计价单独计费（实现时定档）。

## 6. 合规结论（已调研）

**直接抓取抖音/TikTok 热门 BGM = 不做**。热门 BGM 多为版权音乐，授权仅限平台内 UGC；第三方商单复刻使用 = 侵权 + DRM 自动下架 + 封号 + 民事风险（风险等级：极高）。

合规替代：内置免版税库（Pixabay CC0 / Mixkit 免署名可商用）+ "热门曲风 → 库内同感觉替代曲"映射。对外强调"合规可商用、各平台安全可发"。

## 7. 错误处理与降级

- 情感参数任何异常 → 退回无情感合成，不中断（配音永远优先出声）。
- BGM 源缺失（无上传/未选库/无源视频）→ 跳过 BGM，等同现状，不报错。
- `sidechaincompress` 报错 → 回退 `compand` → 再回退简单 `amix` 固定压低。
- BGM 库下载失败 → 回退源视频音轨 → 回退无 BGM。
- loudnorm 失败 → 跳过归一直接混音（记 note）。

## 8. 测试与验收

- **离线回归**：扩展 `npm run test:offline`，新增纯函数测试：`mapSceneRoleToEmotion`、BGM 来源优先级解析、时长对齐断言逻辑。
- **音频断言**：合成后 `ffprobe` 校验①音视频时长差 < 0.3s ②静音段（<-30dB,>0.3s）总占比 **< 15%**（对比修复前 76%）③整体 LUFS 在 -16±2。
- **四路径回归**：motion / showcase / oneshot / main × (有配音/无配音/降级) 各跑一条，确认 BGM 正确出现、不砍尾、不爆音。
- **情感抽测**：同一句话 hook vs proof 两版音频字节不同（情感确实变化）。

## 9. 灰度上线

- WS1+WS2（BGM 修复 + 砍尾）质量纯增益 → 验收后可直接全量。
- WS3/WS5/WS6 的主观参数（情感强度、BGM 音量、ducking 系数）→ 用 env 开关 + 默认值灰度，按用户听感反馈微调，不一次全量。
- 遵守部署规矩：push advideo 前独立查 `generation_tasks` 无 running/queued；DB 改动（`bgm_library` 建表）走 `schema.sql` 在 Supabase 手动执行后再上依赖它的代码。

## 10. 数据模型与接口变更汇总

- `schema.sql`：新增 `bgm_library` 表（+ 可选 `bgm_hottrend_mapping`）。
- `routes.js`：`ASSET_TYPES` 加 `bgm_audio`；新增 `GET /api/replica/bgm-library`；`prompt-guide` 输出 schema 加 `audioDirection`（WS7）；`generate` 入参加 `custom_bgm_asset_id` / `bgm_library_id` / `voicePrompt` / `bgmPrompt` / `styleProfile` / `voiceRotation`。
- `options_json` 新字段：`bgmMode`（`auto` / `ai` / `never`）、`custom_bgm_asset_id`、`bgm_library_id`、`voicePrompt`、`bgmPrompt`、`styleProfile`、`voiceRotation`（均有默认、向后兼容）。
- 前端 `buildGenBody` 同步加上述字段；新增 BGM 选曲器 Modal + 上传入口 + 风格档下拉 + 音频提示词框（AI 建议预填）。

## 11. 需你后续提供 / 未决

- **BGM 曲目入库**：第一期 20-30 首由我从 Pixabay/Mixkit 精选下载入库，还是你指定风格清单？（默认：我按 5 个 mood 各选 4-6 首）
- **风格档档位**：先上「高能带货 / 治愈种草 / 测评理性」三档？还是你要别的命名/数量？
- **AI 原创配乐（WS7 进阶）**：上线时确认 fal 文生音乐模型选型（stable-audio / minimax-music / lyria2 等）、单条计价与 AI 配乐授权条款；默认不开，库匹配跑顺后再灰度。
- 情感强度、BGM 默认音量等主观参数，上线后按你听感微调。
