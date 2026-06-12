<template>
  <div class="studio">
    <div class="studio-aurora" aria-hidden="true"></div>

    <!-- 顶栏已移至全局侧边栏（AppSidebar），此处不再重复 -->


    <main class="canvas">
      <section class="hero">
        <span class="hero-badge"><span class="badge-dot" /> 爆款视频复刻引擎</span>
        <h1>爆款视频，<span class="grad">一键复刻</span>成你的带货视频</h1>
        <p>上传商品素材，AI 自动写文案、配音、生成画面，产出 9:16 带货短视频。</p>
        <div class="hero-limits">
          <span>参考视频：建议 5–60 秒，只拆解前 60 秒</span>
          <span>输出成片：9:16 竖屏，时长可选（跟源 / 8 / 12 / 18 秒）</span>
        </div>
      </section>

      <section v-if="!auth.isLoggedIn" class="login-panel">
        <input v-model="loginEmail" class="login-field" placeholder="邮箱" />
        <input v-model="loginPassword" type="password" class="login-field" placeholder="密码" @keyup.enter="doLogin" />
        <button class="login-btn" :disabled="loggingIn" @click="doLogin">{{ loggingIn ? '登录中…' : '登录' }}</button>
        <span v-if="loginError" class="login-err">{{ loginError }}</span>
        <span v-else class="login-hint">演示账号已预填，直接点登录</span>
      </section>

      <div class="workspace" :class="{ 'has-output': hasGeneratedResult }">
        <!-- 左：配置 -->
        <div class="config">
          <!-- 1 素材 -->
          <div class="card">
            <div class="card-title"><span class="num">1</span>上传素材</div>
            <div class="uploads">
              <label class="upload" :class="{ filled: productAssets.length, busy: uploading==='product' }">
                <input type="file" accept="image/*" multiple hidden @change="e => onFile(e, 'product_image', 'product')" />
                <template v-if="productAssets.length">
                  <img :src="productAssets[0].file_url" />
                  <span v-if="productAssets.length > 1" class="upload-count">{{ productAssets.length }} 张</span>
                </template>
                <template v-else>
                  <span class="upload-plus">＋</span>
                  <span class="upload-label">商品图<em>必填 · 可传 1-5 张</em></span>
                </template>
                <button v-if="productAssets.length" type="button" class="upload-del" title="全部删除" @click.stop.prevent="clearAsset('product')">×</button>
                <span v-if="uploading==='product'" class="upload-spin" />
              </label>

              <label class="upload" :class="{ filled: modelAsset, busy: uploading==='model' }">
                <input type="file" accept="image/*" hidden @change="e => onFile(e, 'model_image', 'model')" />
                <img v-if="modelAsset" :src="modelAsset.file_url" />
                <template v-else>
                  <span class="upload-plus">＋</span>
                  <span class="upload-label">模特图<em>选填</em></span>
                </template>
                <button v-if="modelAsset" type="button" class="upload-del" title="删除" @click.stop.prevent="clearAsset('model')">×</button>
                <span v-if="uploading==='model'" class="upload-spin" />
              </label>

              <label class="upload" :class="{ filled: sourceVideoAsset || refInspiration, busy: uploading==='source' }">
                <input type="file" accept="video/*" hidden @change="e => onFile(e, 'source_video', 'source')" />
                <template v-if="refInspiration">
                  <img v-if="refInspiration.cover" :src="refInspiration.cover" class="upload-img" />
                  <span v-else class="upload-plus">＋</span>
                  <span class="upload-vtag">爆款参考</span>
                  <button type="button" class="upload-del" title="删除" @click.stop.prevent="clearAsset('inspiration')">×</button>
                </template>
                <template v-else-if="sourceVideoAsset">
                  <video :src="`${sourceVideoAsset.file_url}#t=0.5`" preload="metadata" muted playsinline class="upload-video"></video>
                  <span class="upload-vtag">参考视频</span>
                  <button type="button" class="upload-play" title="播放" @click.stop.prevent="previewVideo = sourceVideoAsset.file_url"><span class="tri" /></button>
                  <button type="button" class="upload-del" title="删除" @click.stop.prevent="clearAsset('source')">×</button>
                </template>
                <template v-else>
                  <span class="upload-plus">＋</span>
                  <span class="upload-label">爆款参考视频<em>选填 · ≤60秒</em></span>
                </template>
                <span v-if="uploading==='source'" class="upload-spin" />
              </label>
            </div>
            <div v-if="productAssets.length" class="product-thumbs">
              <div v-for="(p, pi) in productAssets" :key="p.id || pi" class="pt-item">
                <img :src="p.file_url" />
                <button type="button" class="pt-del" title="删除这张" @click="removeProductImage(pi)">×</button>
                <em v-if="pi === 0">主图</em>
              </div>
              <label v-if="productAssets.length < 5" class="pt-add" title="再加一张(最多5张)">
                ＋
                <input type="file" accept="image/*" multiple hidden @change="e => onFile(e, 'product_image', 'product')" />
              </label>
              <span class="pt-tip">多张图 = 同一商品的不同角度/场景，会按顺序串成一条视频(第1张为主图)</span>
            </div>
            <p class="upload-note">爆款参考视频用于拆解拍法、分镜和节奏；本地上传最多 60 秒。从「找爆款」带入的视频也只参考前 60 秒。</p>
            <div class="samples">
              <span class="samples-label">没有素材？点一个示例商品直接用</span>
              <div class="samples-row">
                <button v-for="s in SAMPLES" :key="s.id" type="button" class="sample" @click="useSample(s)">
                  <img :src="s.url" alt="" /><span>{{ s.name }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 2 商品信息 -->
          <div class="card">
            <div class="card-title"><span class="num">2</span>商品信息</div>
            <div class="product-fields">
              <input class="field" v-model="productName" placeholder="商品名称，如：多功能切菜神器" />
              <input class="field" v-model="sellingPoints" placeholder="卖点：省时，锋利，安全" />
            </div>

            <div class="prompt-composer" :class="{ ready: promptReady }">
              <div class="prompt-composer-head">
                <div>
                  <span class="prompt-kicker">生成提示词</span>
                  <b>描述你想生成的视频</b>
                </div>
                <button type="button" class="prompt-guide-btn" :disabled="guidingPrompt || !auth.isLoggedIn || (!productAsset && !sourceVideoAsset)" @click="generatePromptGuide">
                  <span v-if="guidingPrompt" class="mini-spin" />
                  {{ guidingPrompt ? 'AI 分析中…' : 'AI 填写建议' }}
                </button>
              </div>
              <div v-if="guidingPrompt && !creativePrompt.trim()" class="prompt-autofill-note">
                <span class="mini-spin" />
                <span><b>AI 正在分析素材、为你撰写提示词</b>（约 20–40 秒，写好自动填入；不想等可直接手写，不会被覆盖）</span>
              </div>
              <textarea
                class="prompt-main"
                :class="{ autofilling: guidingPrompt && !creativePrompt.trim() }"
                v-model="creativePrompt"
                maxlength="800"
                rows="5"
                placeholder="例如：模特在浴室敷面膜试用，保留参考视频的自拍感，展示包装和上脸效果"
              />
              <div class="prompt-composer-foot">
                <span class="prompt-required" :class="{ ok: promptReady }">{{ promptReady ? (promptAutoFilled ? 'AI 已自动写好提示词，可直接生成，或在上面改成你想要的。' : '已填写，AI 会优先按这里执行。') : (guidingPrompt ? 'AI 正在根据你的素材自动写提示词…' : promptRequiredMessage) }}</span>
                <button type="button" class="advanced-toggle" @click="showAdvancedPrompt = !showAdvancedPrompt">
                  {{ showAdvancedPrompt ? '收起高级避免项' : '高级避免项' }}
                  <span>{{ showAdvancedPrompt ? '-' : '+' }}</span>
                </button>
              </div>
              <div v-if="showAdvancedPrompt" class="advanced-negative">
                <label>避免出现</label>
                <textarea
                  class="negative-field"
                  v-model="negativePrompt"
                  maxlength="500"
                  rows="2"
                  placeholder="例如：不要裸露、不要换商品、不要多手、不要白底海报"
                />
              </div>
              <button v-else type="button" class="negative-summary" @click="showAdvancedPrompt = true">
                避免项：{{ negativePrompt || '未填写' }}
              </button>
            </div>
          </div>

          <!-- 3 复刻方式 -->
          <div class="card">
            <div class="card-title"><span class="num">3</span>复刻设置</div>
            <div class="quick-settings">
              <div class="model-row">
                <span class="model-label">时长<em class="ml-note">成片总时长</em></span>
                <div class="seg">
                  <button v-for="d in DURATIONS" :key="d.v" type="button" :class="{ active: targetDuration === d.v }" @click="targetDuration = d.v">{{ d.label }}</button>
                </div>
              </div>
              <div class="model-row">
                <span class="model-label">语言<em class="ml-note">口播 + 字幕</em></span>
                <div class="seg">
                  <button v-for="l in LANGS" :key="l.code" type="button" :class="{ active: language === l.code }" @click="language = l.code">{{ l.label }}</button>
                </div>
              </div>
            </div>
            <p v-if="targetDuration === 0 && sourceDuration > 0" class="voice-hint">跟源时长：源视频约 {{ Math.round(sourceDuration) }} 秒，成片按 {{ outputSeconds }} 秒计费（约 {{ estimatedCredits }} 积分）。</p>

            <button type="button" class="settings-toggle" @click="showAdvancedSettings = !showAdvancedSettings">
              <span>高级生成设置</span>
              <em>{{ settingsSummary }}</em>
              <b>{{ showAdvancedSettings ? '-' : '+' }}</b>
            </button>

            <div v-if="showAdvancedSettings" class="advanced-settings">
              <div class="model-opts" v-if="pricing">
                <div class="model-row" v-if="sourceVideoAsset || refInspiration">
                  <span class="model-label">复刻方式</span>
                  <div class="seg">
                    <button type="button" :class="{ active: replicaMode === 'smart' }" @click="replicaMode = 'smart'" title="智能复刻：参考源视频的风格/节奏，生成全新场景。任意商品都适用、更灵活。">智能</button>
                    <button type="button" :class="{ active: replicaMode === 'faithful' }" @click="replicaMode = 'faithful'" title="贴帧复刻：尽量贴源视频的构图/姿势/道具，只把商品和模特换成你的。服装等同类商品效果最佳，最像源视频。">贴帧·像源</button>
                    <button type="button" :class="{ active: replicaMode === 'motion' }" @click="replicaMode = 'motion'" title="动作复刻：把参考视频的整段动作、运镜、节奏原样迁移给 AI 模特并换上你的商品。走位/演示类动作视频效果最佳。">动作复刻</button>
                  </div>
                </div>
                <p v-if="replicaMode === 'motion'" class="voice-hint motion-hint">
                  ⏱ <b>生成时间较长：约 5–25 分钟</b>（整段动作迁移走平台排队，明显慢于智能/贴帧的约 7 分钟；期间可离开页面，稍后在「历史」查看成片）。<br />
                  动作复刻：整段迁移参考视频的<b>动作、运镜和节奏</b>，模特换成 AI 虚构模特、商品换成你的。
                  需上传参考视频（超过 15 秒只取前 15 秒），成片 4–15 秒，不含口播和字幕，可保留源视频背景乐。<br />
                  ⚠️ 平台对参考视频和生成结果做<b>双重内容审核</b>：性感舞蹈、着装暴露会被直接拒绝；<b>短裙坐姿、腿部/身体局部特写</b>类画面即使着装正常也可能被误判。
                  推荐用<b>全身走位、产品演示</b>类参考视频。被拒会提前提示或中止，积分自动全额退还。
                </p>
                <div class="model-row" v-if="pricing.video && pricing.video.length > 1">
                  <span class="model-label">视频引擎</span>
                  <div class="seg">
                    <button v-for="vm in pricing.video" :key="vm.id" type="button"
                      :class="{ active: videoModel === vm.id }" @click="videoModel = vm.id" :title="vm.desc">
                      {{ vm.label }}<em>{{ vm.perSec ? vm.perSec + '/秒' : (vm.price ? '+' + vm.price : '含') }}</em>
                    </button>
                  </div>
                </div>
                <div class="model-row">
                  <span class="model-label">画面质量</span>
                  <div class="seg">
                    <button v-for="im in pricing.image" :key="im.id" type="button"
                      :class="{ active: imageModel === im.id }" @click="imageModel = im.id" :title="im.desc">
                      {{ im.label }}<em>{{ im.price ? '+' + im.price : '含' }}</em>
                    </button>
                  </div>
                </div>
              </div>
              <div class="switches">
                <label class="switch"><input type="checkbox" v-model="generateVoice" /><span />AI 配音</label>
                <label class="switch"><input type="checkbox" v-model="generateSubtitle" /><span />字幕</label>
                <label class="switch" :class="{ disabled: generateVoice }"><input type="checkbox" v-model="generateMusic" :disabled="generateVoice" /><span />复刻源视频背景乐</label>
              </div>
              <p v-if="generateVoice" class="voice-hint">已开启 AI 配音：成片采用 AI 人声，不叠加参考视频原声，避免声音重叠。</p>
              <p v-else-if="generateMusic" class="voice-hint">成片采用参考视频的背景音乐（需上传参考视频），不含 AI 配音。</p>
              <p v-else class="voice-hint">成片不含音频，仅保留画面与字幕脚本，可自行后期配音、配乐。</p>
              <div v-if="generateVoice && voices.length" class="voice-pick">
                <span class="model-label">配音音色</span>
                <button type="button" class="voice-trigger" @click="openVoicePicker">
                  <span class="vt-dot" :class="currentVoice?.gender === '男' ? 'm' : 'f'"></span>
                  <span class="vt-name">{{ currentVoice?.label || '选择音色' }}</span>
                  <span v-if="currentVoice?.desc" class="vt-desc">{{ currentVoice.desc }}</span>
                  <span class="vt-play" title="试听当前音色" @click.stop="currentVoice && auditionVoice(currentVoice)">▶</span>
                  <span class="vt-more">换音色 ▾</span>
                </button>
              </div>
            </div>
          </div>

          <button class="generate" :disabled="!canGenerate" @click="generate">
            <span v-if="generating" class="gen-spin" />
            {{ generating ? '生成中…' : `一键生成 · 约 ${estimatedCredits} 积分` }}
          </button>
          <button class="generate-2up" :disabled="!canGenerate" @click="generateVariants" title="用同样素材并行生成 2 条不同版本，工作台并排挑选（约 2 倍积分）">
            ✌️ 出 2 版供挑 · 约 {{ estimatedCredits * 2 }} 积分
          </button>
          <p class="duration-note">成片按 9:16 竖屏输出，时长由上方「时长」选择（跟源 / 短8秒 / 标准12秒 / 长18秒）。出 2 版 = 同素材各摇一次、并排挑更满意的。</p>
          <button v-if="hasGeneratedResult" type="button" class="result-jump" @click="scrollResultIntoView">查看生成结果</button>
          <p v-if="auth.isLoggedIn && productAsset && !promptReady" class="hint warn">{{ promptRequiredMessage }}</p>
          <p v-if="!auth.isLoggedIn" class="hint">请先<router-link to="/login">登录</router-link>后生成</p>
        </div>

        <!-- 右：进度 / 结果 -->
        <div ref="previewPanel" class="preview" :class="{ 'has-output': hasGeneratedResult, running: generating }">
          <div class="preview-headline">
            <div>
              <span>生成结果</span>
              <b>{{ previewTitle }}</b>
            </div>
            <em>{{ previewSubtitle }}</em>
          </div>

          <div v-if="variants.length" class="preview-variants">
            <div class="pv-head">
              <b>出 2 版 · 挑你更满意的</b>
              <span v-if="generating" class="pv-eta">并行生成中 · 已用时 {{ elapsedText }}</span>
            </div>
            <div class="pv-grid">
              <div v-for="(v, vi) in variants" :key="vi" class="pv-cell">
                <span class="pv-label">版本 {{ vi + 1 }}</span>
                <template v-if="v.result">
                  <video :src="v.result.videoUrl" controls playsinline class="pv-video" />
                  <button type="button" class="btn-download pv-dl" :disabled="downloading" @click="downloadVariant(v)">下载这版</button>
                </template>
                <div v-else-if="v.startFailed" class="pv-msg fail">{{ v.startFailed }}</div>
                <div v-else-if="v.task?.status === 'failed'" class="pv-msg fail">这版生成失败<br /><small>已自动退款</small></div>
                <div v-else class="pv-msg">
                  <div class="progress-ring sm" :class="{ running: v.task?.status !== 'failed' }" :style="{ '--p': (v.task?.progress || 0) + '%' }"><span>{{ v.task?.progress || 0 }}%</span></div>
                  <p class="pv-step">{{ runningStepLabel(v.task?.steps) }}</p>
                </div>
              </div>
            </div>
            <div class="pv-actions">
              <button class="btn-again" :disabled="generating" @click="reset">再做一条</button>
            </div>
            <p class="pv-tip">💡 两版用同样素材各摇一次。想微调某版的某一镜，去「历史记录」打开它、点该镜 🔄 换单镜。</p>
          </div>

          <div v-else-if="!generating && !task && !result" class="preview-empty">
            <div class="phone">
              <span>9:16</span>
            </div>
            <p>成片将在这里预览</p>
          </div>

          <div v-else-if="result" class="preview-done">
            <video :src="result.videoUrl" controls playsinline class="result-video" />
            <div class="result-actions">
              <button type="button" class="btn-download" :disabled="downloading" @click="downloadVideo">{{ downloading ? '下载中…' : '下载视频' }}</button>
              <button type="button" class="btn-variant" :disabled="generating" @click="regenerate" title="用同样的商品/模特/爆款，再生成一条不同的版本">🔄 换一版</button>
              <button class="btn-again" @click="reset">再做一条</button>
            </div>
            <div v-if="result.shots?.length" class="script">
              <div class="script-head">📝 分镜脚本<span v-if="!result.ttsOk"> · 无 AI 配音，照此自己配</span></div>
              <p v-if="canRegenScene" class="regen-hint">哪一镜不满意（穿模/变形/多手/串品类），点该镜的 🔄 单独重出，其余镜不变 · 每镜约 {{ REGEN_COST }} 积分</p>
              <ol class="scene-list">
                <li v-for="(s, i) in result.shots" :key="i" class="scene-item">
                  <img v-if="result.sceneImages && result.sceneImages[i]" :src="result.sceneImages[i]" class="scene-thumb" alt="" loading="lazy" />
                  <div class="scene-meta"><em>{{ s.type }}</em>{{ s.text }}</div>
                  <button v-if="canRegenScene" type="button" class="scene-regen" :disabled="generating" @click="regenerateScene(sceneIndex(i))" :title="`只重新生成第 ${sceneIndex(i) + 1} 镜（约 ${REGEN_COST} 积分）`">🔄</button>
                </li>
              </ol>
            </div>
            <p v-if="genNote" class="result-notes">{{ genNote }}</p>
          </div>

          <div v-else class="preview-progress">
            <div class="gen-head">
              <b>AI 正在为你复刻成片</b>
              <span class="gen-eta">预计 2–5 分钟 · 已用时 {{ elapsedText }}</span>
            </div>
            <div class="progress-ring" :class="{ running: task?.status !== 'failed' }" :style="{ '--p': (task?.progress || 0) + '%' }">
              <span>{{ task?.progress || 0 }}%</span>
            </div>
            <p v-if="task?.status !== 'failed'" class="gen-tip"><span class="gen-tip-ic">💡</span>{{ currentTip }}</p>
            <ul class="steps">
              <li v-for="s in (task?.steps || [])" :key="s.capability" :class="s.status">
                <span class="dot" />{{ s.label }}
                <em v-if="s.note">{{ s.note }}</em>
              </li>
            </ul>
            <p v-if="task?.status !== 'failed'" class="gen-hint">⏳ 生成期间可以放心去忙别的，完成后这里会自动出现成片，请不要关闭页面。</p>
            <p v-if="task?.status === 'failed'" class="fail">生成失败：{{ task.error_message }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- 音色选择器（搜索 + 分类 + 试听，可扩展到上百个） -->
    <div v-if="showVoicePicker" class="vp-mask" @click.self="showVoicePicker = false">
      <div class="vp-modal">
        <div class="vp-head"><b>选择配音音色</b><button type="button" class="vp-x" @click="showVoicePicker = false">×</button></div>
        <input class="vp-search" v-model="voiceSearch" placeholder="搜索音色名称，如 元气 / 北京 / 猴哥…" />
        <div class="vp-tabs">
          <button v-for="t in voiceFilters" :key="t.key" type="button" :class="{ active: voiceFilter === t.key }" @click="voiceFilter = t.key">{{ t.label }}</button>
        </div>
        <div class="vp-grid">
          <button v-for="v in filteredVoices" :key="v.id" type="button" class="vp-card" :class="{ active: voice === v.id }" @click="selectVoice(v)" :title="v.desc">
            <span class="vp-card-top">
              <span class="vp-gender" :class="v.gender === '男' ? 'm' : 'f'">{{ v.gender || '·' }}</span>
              <span class="vp-play" title="试听" @click.stop="auditionVoice(v)">▶</span>
            </span>
            <span class="vp-card-name">{{ v.label }}</span>
            <span class="vp-card-desc">{{ v.desc }}</span>
          </button>
          <p v-if="!filteredVoices.length" class="vp-empty">没找到匹配的音色，换个关键词试试</p>
        </div>
        <div class="vp-foot">
          <span>{{ langLabel }} · 共 {{ filteredVoices.length }} 个 · 点卡片选用，点 ▶ 试听</span>
          <button type="button" class="vp-done" @click="showVoicePicker = false">完成</button>
        </div>
      </div>
    </div>

    <!-- 提示词向导 -->
    <div v-if="showPromptGuide" class="prompt-guide-mask" @click.self="closePromptGuide">
      <div class="prompt-guide-modal">
        <div class="pg-head">
          <div>
            <span class="pg-icon">✦</span>
            <b>提示词向导</b>
          </div>
          <button type="button" class="pg-x" @click="closePromptGuide">×</button>
        </div>

        <div class="pg-steps">
          <button v-for="(s, i) in PROMPT_GUIDE_STEPS" :key="s" type="button" :class="{ active: promptGuideStep === i, done: promptGuideStep > i }" @click="promptGuideStep = i" :disabled="guidingPrompt || !promptGuide">
            <span>{{ i + 1 }}</span>{{ s }}
          </button>
        </div>

        <div v-if="guidingPrompt" class="pg-loading">
          <div class="pg-loading-stages">
            <div class="stage"><span class="dot" />识别商品与卖点</div>
            <div class="stage"><span class="dot" />拆解参考视频的拍法与节奏</div>
            <div class="stage"><span class="dot" />生成 3 套可选拍摄方案</div>
          </div>
          <p>大约 20–40 秒，完成后可逐套查看、修改后再用</p>
        </div>
        <div v-else-if="promptGuideError" class="pg-error">
          <p>{{ promptGuideError }}</p>
          <button type="button" @click="generatePromptGuide">重新分析</button>
        </div>
        <template v-else-if="promptGuide">
          <div v-if="promptGuideStep === 0" class="pg-pane">
            <h3>核心信息</h3>
            <div class="pg-core-grid">
              <div><span>产品名称</span><b>{{ promptGuide.productName || productName || '本商品' }}</b></div>
              <div><span>产品类目</span><b>{{ promptGuide.category || '未识别' }}</b></div>
              <div><span>目标受众</span><b>{{ promptGuide.audience || '短视频种草用户' }}</b></div>
              <div><span>视频类型</span><b>{{ promptGuide.videoType || 'UGC 种草' }}</b></div>
            </div>
            <div class="pg-selling">
              <span>核心卖点</span>
              <em v-for="p in (promptGuide.sellingPoints || [])" :key="p">{{ p }}</em>
            </div>
            <div class="pg-actions">
              <button type="button" class="pg-primary" @click="promptGuideStep = 1">下一步：看推荐方案</button>
            </div>
          </div>

          <div v-else-if="promptGuideStep === 1" class="pg-pane">
            <div class="pg-pane-title">
              <h3>推荐方案</h3>
              <button type="button" class="pg-secondary" @click="generatePromptGuide">换一批</button>
            </div>
            <div class="pg-scenario-grid">
              <article v-for="(s, i) in guideScenarios" :key="i" class="pg-scenario-card" :class="{ active: selectedGuideScenario === i }">
                <h4>{{ s.title }}</h4>
                <p class="pg-row"><span>主体</span>{{ s.subject }}</p>
                <p class="pg-row"><span>光线</span>{{ s.lighting }}</p>
                <p class="pg-row"><span>镜头</span>{{ s.camera }}</p>
                <div class="pg-row actions"><span>动作</span><ol><li v-for="a in s.actions" :key="a">{{ a }}</li></ol></div>
                <button type="button" class="pg-card-pick" @click="selectGuideScenario(i)">用这套方案</button>
              </article>
            </div>
          </div>

          <div v-else class="pg-pane">
            <h3>提示词</h3>
            <textarea class="pg-final-prompt" v-model="guideFinalPrompt" rows="8" />
            <label class="pg-negative-label">避免出现</label>
            <textarea class="pg-final-negative" v-model="guideNegativePrompt" rows="3" />
            <div class="pg-actions">
              <button type="button" class="pg-secondary" @click="promptGuideStep = 1">重选方案</button>
              <button type="button" class="pg-primary" @click="applyPromptGuide">使用这个提示词</button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 充值弹窗（聚合支付：微信/支付宝；测试账号保留直充调试） -->
    <div v-if="showRecharge" class="modal-mask" @click.self="closeRecharge">
      <div class="modal">
        <div class="modal-head"><b>积分充值</b><button type="button" class="modal-x" @click="closeRecharge">×</button></div>
        <p v-if="rechargeMsg" class="modal-msg">{{ rechargeMsg }}</p>

        <template v-if="payStep === 'pkg'">
          <div class="pkgs">
            <button v-for="p in packages" :key="p.id" type="button" class="pkg" :disabled="!!recharging" @click="choosePkg(p)">
              <span class="pkg-credits">{{ p.credits + p.bonus }}<em>积分</em></span>
              <span v-if="p.bonus" class="pkg-bonus">含赠 {{ p.bonus }}</span>
              <span class="pkg-price">¥{{ p.priceYuan }}</span>
              <span v-if="recharging === p.id" class="pkg-spin" />
            </button>
          </div>
          <p class="modal-foot">当前余额 {{ auth.points }} 积分{{ auth.isTester ? ' · 测试账号点套餐直充' : '' }}</p>
        </template>

        <template v-else-if="payStep === 'channel'">
          <p class="pay-sub">「{{ selectedPkg?.label }}」 {{ (selectedPkg?.credits || 0) + (selectedPkg?.bonus || 0) }} 积分 · ¥{{ selectedPkg?.priceYuan }}，选择支付方式：</p>
          <div class="pay-channels">
            <button type="button" class="pay-ch wechat" :disabled="!payChannels.wechat || paying" @click="startPay('wechat')">微信支付{{ payChannels.wechat ? '' : '(配置中)' }}</button>
            <button type="button" class="pay-ch alipay" :disabled="!payChannels.alipay || paying" @click="startPay('alipay')">支付宝{{ payChannels.alipay ? '' : '(配置中)' }}</button>
          </div>
          <button type="button" class="pay-back" @click="payStep = 'pkg'">← 换个套餐</button>
        </template>

        <template v-else-if="payStep === 'qr'">
          <p class="pay-sub">请用{{ payOrder?.channel === 'alipay' ? '支付宝' : '微信' }}扫码支付 <b>¥{{ payOrder?.amountYuan }}</b>（到账 {{ payOrder?.credits }} 积分）</p>
          <div class="pay-qr">
            <img v-if="payOrder?.qrUrl" :src="payOrder.qrUrl" alt="支付二维码" />
            <a v-else-if="payOrder?.payUrl" :href="payOrder.payUrl" target="_blank" rel="noopener" class="pay-link">点此跳转支付</a>
          </div>
          <p class="pay-wait"><span class="mini-spin" /> 等待支付中…支付完成后自动到账</p>
          <a v-if="payOrder?.payUrl" :href="payOrder.payUrl" target="_blank" rel="noopener" class="pay-h5">手机端？点此直接跳转支付 →</a>
        </template>

        <template v-else-if="payStep === 'done'">
          <p class="pay-done">✅ 支付成功，已到账 <b>{{ payOrder?.credits }}</b> 积分！当前余额 <b>{{ auth.points }}</b>。</p>
          <button type="button" class="pay-back" @click="closeRecharge">完成</button>
        </template>
      </div>
    </div>

    <!-- 参考视频播放弹层 -->
    <div v-if="previewVideo" class="pv-mask" @click.self="previewVideo = ''">
      <div class="pv-box">
        <button type="button" class="pv-x" @click="previewVideo = ''">×</button>
        <video :src="previewVideo" controls autoplay playsinline class="pv-video"></video>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { safeJson } from '@/api/safeJson';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const MAX_SOURCE_VIDEO_SECONDS = 60;
const MIN_CREATIVE_PROMPT_LENGTH = 6;

// 默认定价兜底：拉不到 /pricing 时也能渲染选项（服务端生成时仍权威校验价格）
const DEFAULT_PRICING = {
  base: 20,
  outputMaxSec: 45,
  video: [
    { id: 'seedance', label: '高级 · Seedance 2.0', perSec: 20, desc: '真人/全身最自然真实（推荐）· 约¥2/秒' },
    { id: 'kling', label: '标准 · 可灵', perSec: 12, desc: '真人脸自然、性价比高 · 约¥1.2/秒' },
  ],
  image: [
    { id: 'gemini', label: '标准 · Gemini', price: 0, desc: '出图快，质感好' },
    { id: 'seedream', label: '高级 · Seedream 4.5', price: 15, desc: '字节顶级出图，与 Seedance 同门，细节/一致性最佳' },
    { id: 'openai', label: '高清 · GPT Image', price: 10, desc: '更精细的细节与质感(略慢)' },
  ],
};
const DEFAULT_PACKAGES = [
  { id: 'starter', label: '体验包', credits: 100, bonus: 0, priceYuan: 9.9 },
  { id: 'basic', label: '基础包', credits: 500, bonus: 50, priceYuan: 49 },
  { id: 'pro', label: '专业包', credits: 1500, bonus: 300, priceYuan: 99 },
];
const pricing = ref<any>(DEFAULT_PRICING);
const packages = ref<any[]>(DEFAULT_PACKAGES);
const videoModel = ref('seedance'); // 默认 Seedance 2.0（fal 国际版，真人脸不封、全身最自然）
const imageModel = ref('gemini');
const replicaMode = ref('smart'); // smart=智能复刻(默认,生成新场景)；faithful=贴帧复刻(贴源构图/姿势/道具)
const showRecharge = ref(false);
const rechargeMsg = ref('');
const recharging = ref('');

const productAssets = ref<any[]>([]); // 多图串视频：1-5 张商品图(不同角度/场景)，第 1 张为主图
const productAsset = computed(() => productAssets.value[0] || null); // 兼容层：既有"单图"读取点全部走这里
function removeProductImage(idx: number) { productAssets.value.splice(idx, 1); }
const modelAsset = ref<any>(null);
const sourceVideoAsset = ref<any>(null);
const sourceDuration = ref(0); // 上传源视频的时长(秒)，用于"跟源"按时长计费
const refInspiration = ref<any>(null); // 找爆款「用它复刻」带入的封面+文案参考（不下载原视频）
const previewVideo = ref<string>(''); // 点击参考视频缩略图 → 弹层播放
const uploading = ref('');

// 删除/清空某个素材槽
function clearAsset(slot: string) {
  if (slot === 'product') productAssets.value = [];
  else if (slot === 'model') modelAsset.value = null;
  else if (slot === 'source') { sourceVideoAsset.value = null; sourceDuration.value = 0; }
  else if (slot === 'inspiration') refInspiration.value = null;
}

const productName = ref('');
const sellingPoints = ref('');
const creativePrompt = ref('');
const DEFAULT_NEGATIVE_PROMPT = '不要裸露、不要换商品、不要多手、不要畸形手指、不要白底海报、不要无关人物或商品';
const negativePrompt = ref(DEFAULT_NEGATIVE_PROMPT);
const promptAutoFilled = ref(false); // AI 是否已自动写好提示词（用户可改）；用于"上传即自动填、不挡路、不空跑"
const guidingPrompt = ref(false);
const showAdvancedPrompt = ref(false);
const showAdvancedSettings = ref(false);
const showPromptGuide = ref(false);
const promptGuideStep = ref(0);
const promptGuideError = ref('');
const promptGuide = ref<any>(null);
const selectedGuideScenario = ref(0);
const guideFinalPrompt = ref('');
const guideNegativePrompt = ref(DEFAULT_NEGATIVE_PROMPT);
const PROMPT_GUIDE_STEPS = ['AI 识别', '拍摄方案', '确认提示词'];
type PromptGuideScenario = { title: string; subject: string; lighting: string; camera: string; actions: string[]; tags: string[]; prompt: string };
const creativePromptText = computed(() => creativePrompt.value.replace(/\s+/g, ' ').trim());
const promptReady = computed(() => creativePromptText.value.length >= MIN_CREATIVE_PROMPT_LENGTH);
const promptRequiredMessage = `生成前必须填写提示词（至少 ${MIN_CREATIVE_PROMPT_LENGTH} 个字），可手写或点「AI 填写建议」。`;
const guideScenarios = computed<PromptGuideScenario[]>(() => Array.isArray(promptGuide.value?.scenarios) ? promptGuide.value.scenarios : []);

const generateVoice = ref(true);
const generateSubtitle = ref(true);
const generateMusic = ref(true); // 没配音时用源爆款视频的音乐当背景乐
const language = ref('zh-CN');
const LANGS = [{ code: 'zh-CN', label: '中文' }, { code: 'en-US', label: '英文' }, { code: 'ja-JP', label: '日语' }, { code: 'es-ES', label: '西语' }];
const targetDuration = ref(0); // 0=跟源视频；否则目标总秒数
const DURATIONS = [{ v: 0, label: '跟源' }, { v: 8, label: '短·8秒' }, { v: 12, label: '标准·12秒' }, { v: 18, label: '长·18秒' }];
const VS = 'https://ycivzfqijxngognpoeil.supabase.co/storage/v1/object/public/moly-media/voices/samples/';
const DEFAULT_VOICES = [
  { id: 'volc-yuanqinvyou', label: '元气女友', desc: '元气活泼、甜美亲和', gender: '女', category: '通用', langs: ['zh-CN'], sample: VS + 'volc-yuanqinvyou.mp3' },
];
const voices = ref<any[]>(DEFAULT_VOICES);
const voice = ref('volc-yuanqinvyou');
let voiceAudio: HTMLAudioElement | null = null;

// 音色选择器（弹层 + 搜索 + 分类 + 试听）—— 扛得住上百个音色
const showVoicePicker = ref(false);
const voiceSearch = ref('');
const voiceFilter = ref('all');
// 按当前语言筛选：只保留 langs 包含所选语言的音色（无 langs 视为通用，兼容兜底列表）
const langVoices = computed(() => voices.value.filter((v: any) => !v.langs || v.langs.includes(language.value)));
const langLabel = computed(() => { const m: Record<string, string> = { 'en-US': '英语', 'zh-CN': '中文', 'ja-JP': '日语', 'es-ES': '西语' }; return m[language.value] || language.value; });
const currentVoice = computed(() => langVoices.value.find((v: any) => v.id === voice.value) || langVoices.value[0] || null);
const voiceFilters = computed(() => {
  const f: { key: string; label: string }[] = [{ key: 'all', label: '全部' }];
  if (langVoices.value.some((v: any) => v.gender === '女')) f.push({ key: 'female', label: '女声' });
  if (langVoices.value.some((v: any) => v.gender === '男')) f.push({ key: 'male', label: '男声' });
  if (langVoices.value.some((v: any) => v.category === '角色')) f.push({ key: '角色', label: '角色音' });
  if (langVoices.value.some((v: any) => v.category === '方言')) f.push({ key: '方言', label: '方言' });
  return f;
});
const filteredVoices = computed(() => {
  const q = voiceSearch.value.trim().toLowerCase();
  const f = voiceFilter.value;
  return langVoices.value.filter((v: any) => {
    const okF = f === 'all' || (f === 'female' && v.gender === '女') || (f === 'male' && v.gender === '男') || v.category === f;
    const okQ = !q || (v.label || '').toLowerCase().includes(q) || (v.desc || '').toLowerCase().includes(q);
    return okF && okQ;
  });
});
// 切换语言后，若当前音色不支持该语言，自动切到第一个支持的，杜绝「中文音色配英文」
watch(language, () => {
  if (voice.value && !langVoices.value.some((v: any) => v.id === voice.value)) {
    voice.value = langVoices.value[0]?.id || '';
  }
});
function openVoicePicker() { voiceSearch.value = ''; voiceFilter.value = 'all'; showVoicePicker.value = true; }

const task = ref<any>(null);
const result = ref<any>(null);
const generating = ref(false);
const variants = ref<any[]>([]); // 出2版：[{ taskId, task, result, startFailed }]
const previewPanel = ref<HTMLElement | null>(null);
let pollTimer: ReturnType<typeof setTimeout> | null = null;

type GenerationStep = { status?: string; label?: string };
function sceneIndex(i: string | number) { return Number(i) || 0; }
function runningStepLabel(steps?: GenerationStep[]) {
  return (steps || []).find((s) => s.status === 'running')?.label || '排队中…';
}
const hasGeneratedResult = computed(() => !!result.value || variants.value.some((v: any) => !!v.result));
const previewTitle = computed(() => {
  if (result.value) return '成片已生成';
  if (variants.value.length && hasGeneratedResult.value) return '已有版本生成';
  if (variants.value.length) return generating.value ? '正在生成两版' : '两版结果';
  if (generating.value) return '正在生成';
  return '等待生成';
});
const previewSubtitle = computed(() => {
  if (result.value) return '视频、下载和换一版都在这里';
  if (variants.value.length && hasGeneratedResult.value) return '生成好的版本会出现在这里';
  if (generating.value) return '完成后会自动跳到这里';
  return '开始生成后，这里会显示进度和成片';
});
function scrollResultIntoView() {
  previewPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// —— 生成进度的友好提示：耗时预期 + 计时 + 轮播文案（生成较久，给用户心理预期）——
const elapsed = ref(0); // 已用秒数
let elapsedTimer: ReturnType<typeof setInterval> | null = null;
const GEN_TIPS = [
  '正在拆解爆款的脚本结构与分镜节奏…',
  '正在逐个镜头生成画面，这一步最耗时，请耐心等待…',
  '正在为每个镜头做图生视频运镜…',
  '正在合成 AI 配音与字幕…',
  '正在把镜头拼接、渲染成 9:16 成片…',
  '快好了，正在做最后的打包与上传…',
];
const tipIndex = ref(0);
let tipTimer: ReturnType<typeof setInterval> | null = null;
const currentTip = computed(() => GEN_TIPS[tipIndex.value % GEN_TIPS.length]);
const elapsedText = computed(() => {
  const m = Math.floor(elapsed.value / 60);
  const s = elapsed.value % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
});
function startProgressUx() {
  stopProgressUx();
  elapsed.value = 0;
  tipIndex.value = 0;
  elapsedTimer = setInterval(() => { elapsed.value += 1; }, 1000);
  tipTimer = setInterval(() => { tipIndex.value += 1; }, 5000);
}
function stopProgressUx() {
  if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
  if (tipTimer) { clearInterval(tipTimer); tipTimer = null; }
}

// 成片秒数：选了固定时长用它；否则(跟源)用上传源视频时长，封顶 outputMaxSec；动作复刻成片上限 15s
const outputSeconds = computed(() => {
  const maxSec = replicaMode.value === 'motion' ? 15 : (pricing.value?.outputMaxSec || 45);
  const sec = targetDuration.value > 0 ? targetDuration.value : Math.round(sourceDuration.value) || 12;
  return Math.min(maxSec, sec);
});
const estimatedCredits = computed(() => {
  if (!pricing.value) return 240;
  const perSec = pricing.value.video.find((x: any) => x.id === videoModel.value)?.perSec || 12;
  const im = pricing.value.image.find((x: any) => x.id === imageModel.value)?.price || 0;
  return (pricing.value.base || 0) + Math.round(perSec * outputSeconds.value) + im;
});
const settingsSummary = computed(() => {
  const videoFallback: Record<string, string> = { seedance: 'Seedance', kling: '可灵' };
  const imageFallback: Record<string, string> = { gemini: 'Gemini', seedream: 'Seedream', openai: 'GPT Image' };
  const vm = (pricing.value?.video?.find((x: any) => x.id === videoModel.value)?.label || videoFallback[videoModel.value] || videoModel.value).replace(/^(高级|标准)\s*·\s*/, '');
  const im = (pricing.value?.image?.find((x: any) => x.id === imageModel.value)?.label || imageFallback[imageModel.value] || imageModel.value).replace(/^(高级|标准|高清)\s*·\s*/, '');
  const sound = generateVoice.value ? 'AI配音' : (generateMusic.value ? '源视频背景乐' : '无音频');
  return `${vm} · ${im} · ${sound}`;
});
const canGenerate = computed(() => auth.isLoggedIn && !!productAsset.value && promptReady.value && !generating.value
  && (replicaMode.value !== 'motion' || !!sourceVideoAsset.value)); // 动作复刻必须有参考视频(动作的来源)

async function generatePromptGuide() {
  if (!auth.isLoggedIn) { alert('请先登录'); return; }
  if (!productAsset.value && !sourceVideoAsset.value) { alert('请先上传商品图或参考视频'); return; }
  showPromptGuide.value = true;
  promptGuideError.value = '';
  promptGuideStep.value = 0;
  guidingPrompt.value = true;
  try {
    const r = await fetch('/api/replica/prompt-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: auth.email,
        productImageId: productAsset.value?.id || null,
        sourceVideoAssetId: sourceVideoAsset.value?.id || null,
        product: {
          name: productName.value,
          sellingPoints: sellingPoints.value.split(/[,，]/).map(s => s.trim()).filter(Boolean),
        },
        language: language.value,
      }),
    });
    const contentType = r.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new Error('提示词向导接口未连接，请确认后端服务已启动');
    const j = await safeJson(r);
    if (!j.success) throw new Error(j.message || 'AI 建议生成失败');
    const g = j.guide || {};
    promptGuide.value = g;
    selectedGuideScenario.value = 0;
    guideFinalPrompt.value = (Array.isArray(g.scenarios) && g.scenarios[0]?.prompt) || g.creativePrompt || creativePrompt.value;
    guideNegativePrompt.value = g.negativePrompt || negativePrompt.value || DEFAULT_NEGATIVE_PROMPT;
  } catch (e: any) {
    promptGuideError.value = e.message || 'AI 建议生成失败，请手动填写';
  } finally {
    guidingPrompt.value = false;
  }
}

function selectGuideScenario(index: number | string) {
  const n = Number(index) || 0;
  selectedGuideScenario.value = n;
  const s = guideScenarios.value[n];
  guideFinalPrompt.value = s?.prompt || promptGuide.value?.creativePrompt || creativePrompt.value;
  promptGuideStep.value = 2;
}

function applyPromptGuide() {
  const g = promptGuide.value || {};
  if (g.productName && (!productName.value || productName.value === '本商品')) productName.value = g.productName;
  if (Array.isArray(g.sellingPoints) && g.sellingPoints.length) sellingPoints.value = g.sellingPoints.join('，');
  if (guideFinalPrompt.value.trim()) creativePrompt.value = guideFinalPrompt.value.trim();
  if (guideNegativePrompt.value.trim()) negativePrompt.value = guideNegativePrompt.value.trim();
  showPromptGuide.value = false;
}

function closePromptGuide() {
  if (guidingPrompt.value) return;
  showPromptGuide.value = false;
}

// 上传素材后：自动让 AI 写好提示词并填进输入框（可见、可改）。
// 这样"提示词门槛"自动满足——既不强制用户手填(无阻力)，又绝不拿空提示词去生成(质量有保障、AI 不裸奔)。
async function autoFillPromptSilently() {
  if (!auth.isLoggedIn) return;
  if (!productAsset.value && !sourceVideoAsset.value) return;
  if (creativePromptText.value.length >= MIN_CREATIVE_PROMPT_LENGTH) return; // 用户已写，绝不覆盖
  if (guidingPrompt.value) return;
  guidingPrompt.value = true;
  try {
    const r = await fetch('/api/replica/prompt-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: auth.email,
        productImageId: productAsset.value?.id || null,
        sourceVideoAssetId: sourceVideoAsset.value?.id || null,
        product: { name: productName.value, sellingPoints: sellingPoints.value.split(/[,，]/).map(s => s.trim()).filter(Boolean) },
        language: language.value,
      }),
    });
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return; // 后端没接好就静默放弃，用户仍可手动点「AI 填写建议」
    const j = await safeJson(r);
    if (!j.success) return;
    const g = j.guide || {};
    promptGuide.value = g;
    selectedGuideScenario.value = 0;
    guideFinalPrompt.value = (Array.isArray(g.scenarios) && g.scenarios[0]?.prompt) || g.creativePrompt || '';
    guideNegativePrompt.value = g.negativePrompt || DEFAULT_NEGATIVE_PROMPT;
    if (g.productName && (!productName.value || productName.value === '本商品')) productName.value = g.productName;
    if (Array.isArray(g.sellingPoints) && g.sellingPoints.length && !sellingPoints.value.trim()) sellingPoints.value = g.sellingPoints.join('，');
    if (guideFinalPrompt.value.trim() && !creativePrompt.value.trim()) {
      creativePrompt.value = guideFinalPrompt.value.trim();
      promptAutoFilled.value = true;
    }
    if (guideNegativePrompt.value.trim() && (!negativePrompt.value.trim() || negativePrompt.value === DEFAULT_NEGATIVE_PROMPT)) {
      negativePrompt.value = guideNegativePrompt.value.trim();
    }
  } catch { /* 静默失败：不打扰用户，仍可手动点「AI 填写建议」 */ }
  finally { guidingPrompt.value = false; }
}

// 把内部降级/报错 notes 转成对用户友好的一句提示（绝不暴露原始 API 报错码）
const genNote = computed(() => {
  const notes = result.value?.notes || [];
  if (!notes.length) return '';
  const txt = notes.join(' ');
  if (/配音降级|无配音|无声|TTS/i.test(txt)) return '提示：本条未生成 AI 配音，已附文案脚本，可自行后期配音。';
  if (/失败|降级|limit|Detected|over|敏感|sensitive/i.test(txt)) return '提示：个别镜头的视频引擎临时受限，已自动用静态运镜兜底，成片可正常使用；想要更佳动态效果可点「再做一条」重试。';
  return '';
});

async function uploadAsset(file: File, assetType: string) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('assetType', assetType);
  fd.append('userEmail', auth.email || '');
  const r = await fetch('/api/assets/upload', { method: 'POST', body: fd });
  const j = await safeJson(r);
  if (!j.success) throw new Error(j.message || '上传失败');
  return j.asset;
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    const cleanup = () => URL.revokeObjectURL(url);
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = Number(video.duration) || 0;
      cleanup();
      resolve(duration);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('无法读取视频时长，请换一个视频文件'));
    };
    video.src = url;
  });
}

async function onFile(e: Event, assetType: string, slot: string) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  if (!files.length) return;
  try {
    if (assetType === 'source_video') {
      const duration = await readVideoDuration(files[0]);
      if (duration > MAX_SOURCE_VIDEO_SECONDS + 0.5) {
        alert(`爆款参考视频最多支持 ${MAX_SOURCE_VIDEO_SECONDS} 秒。当前视频约 ${Math.round(duration)} 秒，请先裁剪后再上传。`);
        input.value = '';
        return;
      }
      sourceDuration.value = duration; // 记下源视频时长 → "跟源"按时长计费
    }
    uploading.value = slot;
    if (slot === 'product') {
      // 多图串视频：一次可选多张，与已传的累计、封顶 5 张
      const room = 5 - productAssets.value.length;
      if (room <= 0) { alert('商品图最多 5 张，删除几张后再加。'); return; }
      const picked = files.slice(0, room);
      if (files.length > room) alert(`商品图最多 5 张，本次只取前 ${picked.length} 张。`);
      for (const f of picked) {
        const asset = await uploadAsset(f, assetType);
        productAssets.value = [...productAssets.value, asset];
      }
    } else {
      const asset = await uploadAsset(files[0], assetType);
      if (slot === 'model') modelAsset.value = asset;
      else sourceVideoAsset.value = asset;
    }
      // 传完商品/参考视频 → 自动让 AI 写好提示词（后台跑、不阻塞上传；空着才填，不覆盖用户已写的）
      if (slot === 'product' || slot === 'source') autoFillPromptSilently();
  } catch (err: any) {
    alert(err.message || '上传失败');
  } finally {
    uploading.value = '';
    input.value = '';
  }
}

// 出2版共用：建源视频记录 + 构造生成请求体（与单版完全一致，保证两版同素材同设置）
async function ensureSourceVideoId() {
  if (!sourceVideoAsset.value) return null;
  const r = await fetch('/api/source-videos', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail: auth.email, assetId: sourceVideoAsset.value.id }),
  });
  const j = await safeJson(r);
  return j.success ? j.sourceVideo.id : null;
}
function buildGenBody(sourceVideoId: any) {
  return {
    userEmail: auth.email, sourceVideoId,
    assets: {
      product_image_id: productAsset.value?.id, // 主图(向后兼容)
      product_image_ids: productAssets.value.map((p) => p.id).filter(Boolean), // 多图串视频(1-5张)
      model_image_id: modelAsset.value?.id || null,
    },
    product: { name: productName.value || '本商品', sellingPoints: sellingPoints.value.split(/[,，]/).map(s => s.trim()).filter(Boolean) },
    options: { generate_voice: generateVoice.value, generate_subtitle: generateSubtitle.value, ttsVoice: voice.value, generate_music: generateMusic.value, targetDurationSec: targetDuration.value, sourceDurationSec: Math.round(sourceDuration.value), replicaMode: replicaMode.value, creativePrompt: creativePromptText.value, negativePrompt: negativePrompt.value.trim() },
    models: { video: videoModel.value, image: imageModel.value },
    language: language.value, aspectRatio: '9:16',
  };
}

async function generate() {
  if (!canGenerate.value) return;
  // 动作复刻走平台排队，耗时明显长于智能/贴帧——开始前明确提醒，避免用户以为卡死
  if (replicaMode.value === 'motion' && !confirm('动作复刻为整段动作迁移，预计需要 5–25 分钟（平台排队，时长不可控），明显长于智能/贴帧。\n生成期间可离开页面，稍后到「历史」查看成片；若被内容审核拒绝会自动全额退款。\n\n确定开始？')) return;
  generating.value = true;
  result.value = null;
  task.value = null;
  variants.value = [];
  startProgressUx();
  try {
    const sourceVideoId = await ensureSourceVideoId();
    const r = await fetch('/api/replica/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildGenBody(sourceVideoId)),
    });
    const j = await safeJson(r);
    if (!j.success) {
      if (j.code === 'INSUFFICIENT') { generating.value = false; stopProgressUx(); openRecharge(`积分不足：本次需 ${j.need}，当前 ${j.points}`); return; }
      throw new Error(j.message || '生成失败');
    }
    if (auth.email) auth.fetchPointsFromServer(auth.email); // 扣费后刷新余额
    pollTask(j.taskId);
  } catch (err: any) {
    alert(err.message);
    generating.value = false;
    stopProgressUx();
  }
}

function pollTask(taskId: string) {
  const tick = async () => {
    try {
      const r = await fetch('/api/generation-tasks/' + taskId);
      const j = await safeJson(r);
      if (j.success) {
        task.value = j.task;
        if (j.task.status === 'succeeded') {
          result.value = j.task.output_json;
          generating.value = false;
          stopProgressUx();
          nextTick(scrollResultIntoView);
          if (auth.email) auth.fetchPointsFromServer(auth.email);
          return;
        }
        if (j.task.status === 'failed') {
          generating.value = false; stopProgressUx();
          if (auth.email) auth.fetchPointsFromServer(auth.email); // 失败已自动退款，刷新余额
          alert(j.task.error_message || '生成失败，请稍后重试或联系管理员');
          return;
        }
      }
    } catch { /* 网络抖动，继续轮询 */ }
    pollTimer = setTimeout(tick, 3000);
  };
  tick();
}

function reset() { task.value = null; result.value = null; variants.value = []; stopProgressUx(); }
// 换一版：复用当前商品/模特/爆款/选项，再生成一条不同版本（AI 视频有波动，多生成几条挑最好的）
function regenerate() {
  if (generating.value) return;
  if (!confirm(`换一版：用同样的素材再生成一条不同的版本，需扣约 ${estimatedCredits.value} 积分。继续？`)) return;
  generate();
}

// 出2版：用同样素材并行生成 2 条不同版本，工作台并排展示供挑（扣 2 倍积分；后端每版独立扣费/失败自动退款）
async function generateVariants() {
  if (!canGenerate.value) return;
  if (!confirm(`出 2 版：用同样的素材并行生成 2 条不同版本供你挑，需扣约 ${estimatedCredits.value * 2} 积分。继续？`)) return;
  generating.value = true;
  result.value = null;
  task.value = null;
  variants.value = [{ taskId: null, task: null, result: null, startFailed: '' }, { taskId: null, task: null, result: null, startFailed: '' }];
  startProgressUx();
  try {
    const sourceVideoId = await ensureSourceVideoId(); // 两版共用一条源视频记录
    for (let k = 0; k < 2; k++) {
      try {
        const r = await fetch('/api/replica/generate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildGenBody(sourceVideoId)),
        });
        const j = await safeJson(r);
        if (!j.success) { variants.value[k].startFailed = j.code === 'INSUFFICIENT' ? '积分不足，这版未生成' : (j.message || '启动失败'); continue; }
        variants.value[k].taskId = j.taskId;
        pollVariant(k, j.taskId);
      } catch { variants.value[k].startFailed = '网络错误，这版未生成'; }
    }
    if (variants.value.every(v => v.startFailed)) {
      generating.value = false; stopProgressUx();
      if (variants.value.some(v => /积分不足/.test(v.startFailed))) { variants.value = []; openRecharge('积分不足，请充值后再「出2版」'); }
      return;
    }
    if (auth.email) auth.fetchPointsFromServer(auth.email);
  } catch (err: any) {
    alert(err.message); generating.value = false; stopProgressUx(); variants.value = [];
  }
}
function pollVariant(k: number, taskId: string) {
  const tick = async () => {
    try {
      const r = await fetch('/api/generation-tasks/' + taskId);
      const j = await safeJson(r);
      if (j.success) {
        variants.value[k].task = j.task;
        if (j.task.status === 'succeeded') { variants.value[k].result = j.task.output_json; nextTick(scrollResultIntoView); onVariantSettled(); return; }
        if (j.task.status === 'failed') { onVariantSettled(); if (auth.email) auth.fetchPointsFromServer(auth.email); return; }
      }
    } catch { /* 网络抖动，继续轮询 */ }
    setTimeout(tick, 3000);
  };
  tick();
}
// 两版都结束(成功/失败/未启动)后收尾全局进度
function onVariantSettled() {
  const running = variants.value.some(v => !v.startFailed && !v.result && v.task?.status !== 'failed');
  if (!running) { generating.value = false; stopProgressUx(); if (auth.email) auth.fetchPointsFromServer(auth.email); }
}

const REGEN_COST = 15; // 换单镜单价（与后端 REGEN_SCENE_COST 保持一致）
// 能否换单镜：结果带完整分镜缓存(底图+动画片)且能定位到原任务 id（刚生成完即可用）
const canRegenScene = computed(() => {
  const r = result.value;
  return !!(r && Array.isArray(r.sceneClips) && r.sceneClips.length && Array.isArray(r.shots) && r.sceneClips.length === r.shots.length && task.value?.id);
});
// 换单镜：只重生第 i 镜，其余镜复用缓存（AI 偶尔某一镜翻车，单独重出比整条重赌划算且便宜）
async function regenerateScene(i: number) {
  if (generating.value) return;
  const tid = task.value?.id;
  if (!tid) { alert('无法定位原视频任务，请整条重新生成一次再试'); return; }
  if (!confirm(`只重出第 ${i + 1} 个镜头（其余镜头保持不变），需扣约 ${REGEN_COST} 积分。继续？`)) return;
  generating.value = true;
  result.value = null;
  startProgressUx();
  try {
    const r = await fetch('/api/replica/regenerate-scene', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: auth.email, taskId: tid, sceneIndex: i }),
    });
    const j = await safeJson(r);
    if (!j.success) {
      if (j.code === 'INSUFFICIENT') { generating.value = false; stopProgressUx(); openRecharge(`积分不足：本次需 ${j.need}，当前 ${j.points}`); return; }
      throw new Error(j.message || '换单镜失败');
    }
    if (auth.email) auth.fetchPointsFromServer(auth.email); // 扣费后刷新余额
    pollTask(j.taskId);
  } catch (err: any) {
    alert(err.message); generating.value = false; stopProgressUx();
  }
}

// 直接下载成片：浏览器拉 blob 触发下载，停留在当前页（不再整页跳到视频直链）
const downloading = ref(false);
function downloadVideo() { return downloadFromUrl(result.value?.videoUrl, `moly-${result.value?.generatedVideoId || 'video'}.mp4`); }
function downloadVariant(v: any) { return downloadFromUrl(v?.result?.videoUrl, `moly-${v?.result?.generatedVideoId || 'variant'}.mp4`); }
async function downloadFromUrl(url: string, name: string) {
  if (!url || downloading.value) return;
  downloading.value = true;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('fetch failed');
    const blob = await resp.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
  } catch {
    window.open(url, '_blank'); // 兜底：新标签打开，至少不跳走当前页
  } finally {
    downloading.value = false;
  }
}

onMounted(async () => {
  // 找爆款「用它复刻」带入的素材（DiscoverView 写入 sessionStorage）
  try {
    const raw = sessionStorage.getItem('moly_prefill');
    if (raw) {
      sessionStorage.removeItem('moly_prefill');
      const p = JSON.parse(raw);
      if (p.kind === 'productImage' && p.asset) productAssets.value = [p.asset];
      else if (p.kind === 'sourceVideo' && p.asset) sourceVideoAsset.value = p.asset; // 兼容旧逻辑
      else if (p.kind === 'inspiration') {
        refInspiration.value = { cover: p.cover || '', desc: p.desc || '' };
        // 把爆款文案作为卖点种子带入（去掉话题标签/多余空白），用户可再改
        if (!sellingPoints.value && p.desc) {
          sellingPoints.value = String(p.desc).replace(/#[^\s#]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
        }
      }
      else if (p.kind === 'redo') {
        // 历史「再做一条」：带入商品名/卖点/语言（图片需重新选）
        if (p.product?.name) productName.value = p.product.name;
        if (Array.isArray(p.product?.sellingPoints) && p.product.sellingPoints.length) sellingPoints.value = p.product.sellingPoints.join('，');
        if (p.language) language.value = p.language;
      }
    }
  } catch { /* 忽略 */ }
  try {
    const j = await (await fetch('/api/replica/pricing')).json();
    if (j.success) { pricing.value = j.pricing; packages.value = j.packages; }
  } catch { /* 拉不到就用默认价 */ }
  try {
    const jv = await (await fetch('/api/replica/voices')).json();
    if (jv.success) { voices.value = jv.voices; voice.value = jv.defaultVoice || voice.value; }
  } catch { /* 忽略 */ }
  if (auth.isLoggedIn && auth.email) auth.fetchPointsFromServer(auth.email);
});

function selectVoice(v: any) {
  voice.value = v.id; // 仅选用，不自动播放
}
function auditionVoice(v: any) {
  // 仅试听（不改变选择）：所选语言==样本语言→用静态样本(秒开)；否则按所选语言实时合成，避免“选西语却放日语”
  const lang = language.value;
  const sampleLang = (v.langs && v.langs[0]) || 'zh-CN';
  const src = (lang === sampleLang && v.sample)
    ? v.sample
    : `/api/replica/voice-sample?id=${encodeURIComponent(v.id)}&lang=${encodeURIComponent(lang)}`;
  try { if (voiceAudio) voiceAudio.pause(); voiceAudio = new Audio(src); voiceAudio.play(); } catch { /* 忽略 */ }
}

function openRecharge(msg = '') { rechargeMsg.value = msg; showRecharge.value = true; payStep.value = 'pkg'; loadPayChannels(); }
// ── 真实支付流(聚合支付：微信/支付宝)：选套餐 → 选通道 → 扫码 → 轮询到账。测试账号点套餐直充(调试用)。
const payStep = ref<'pkg' | 'channel' | 'qr' | 'done'>('pkg');
const selectedPkg = ref<any>(null);
const payChannels = ref({ wechat: false, alipay: false });
const payOrder = ref<any>(null);
const paying = ref(false);
let payTimer: any = null;

async function loadPayChannels() {
  try { payChannels.value = await safeJson(await fetch('/api/pay/channels')); } catch { /* 保持禁用态 */ }
}

function choosePkg(pkg: any) {
  if (auth.isTester) { rechargeTester(pkg); return; } // 测试账号保留直充
  selectedPkg.value = pkg;
  rechargeMsg.value = '';
  payStep.value = 'channel';
}

async function startPay(channel: 'wechat' | 'alipay') {
  if (!selectedPkg.value || paying.value) return;
  paying.value = true; rechargeMsg.value = '';
  try {
    const r = await fetch('/api/pay/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userEmail: auth.email, packageId: selectedPkg.value.id, channel }) });
    const j = await safeJson(r);
    if (!j.success) { rechargeMsg.value = j.message || '下单失败'; return; }
    payOrder.value = { ...j, channel };
    payStep.value = 'qr';
    payTimer = setInterval(pollPay, 3000);
  } catch (e: any) { rechargeMsg.value = e.message || '网络错误，请重试'; }
  finally { paying.value = false; }
}

async function pollPay() {
  if (!payOrder.value?.orderId) return;
  try {
    const j = await safeJson(await fetch(`/api/pay/order?orderId=${encodeURIComponent(payOrder.value.orderId)}`));
    if (j.status === 'paid') {
      clearInterval(payTimer); payTimer = null;
      if (auth.email) await auth.fetchPointsFromServer(auth.email);
      payStep.value = 'done';
    }
  } catch { /* 下一轮再试 */ }
}

function closeRecharge() {
  if (payTimer) { clearInterval(payTimer); payTimer = null; }
  showRecharge.value = false;
  rechargeMsg.value = '';
  payStep.value = 'pkg';
  payOrder.value = null;
  selectedPkg.value = null;
}

// 测试账号直充(旧逻辑保留，仅 isTester 可用——后端同样校验)
async function rechargeTester(pkg: any) {
  recharging.value = pkg.id;
  try {
    const r = await fetch('/api/replica/recharge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userEmail: auth.email, packageId: pkg.id }) });
    const j = await safeJson(r);
    if (j.success) {
      if (auth.email) await auth.fetchPointsFromServer(auth.email);
      rechargeMsg.value = `充值成功，已到账 ${j.added} 积分`;
      setTimeout(() => closeRecharge(), 1200);
    } else { rechargeMsg.value = j.message || '充值失败'; }
  } catch { rechargeMsg.value = '网络错误，请重试'; }
  finally { recharging.value = ''; }
}

// 内联登录（绕开旧登录页的地区检测/手机号流程，演示账号已预填）
const loginEmail = ref('demo@moly.test');
const loginPassword = ref('moly1234');
const loginError = ref('');
const loggingIn = ref(false);
async function doLogin() {
  loginError.value = '';
  loggingIn.value = true;
  try {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account: loginEmail.value.trim(), password: loginPassword.value }) });
    const j = await safeJson(r);
    if (j.success && j.user) auth.login({ email: j.user.email, points: j.user.points });
    else loginError.value = j.message || '登录失败';
  } catch {
    loginError.value = '网络错误：连不上后端，请确认后端已启动（npm run dev:server）';
  } finally {
    loggingIn.value = false;
  }
}

// 示例商品（没素材也能直接试）
const SB = 'https://ycivzfqijxngognpoeil.supabase.co/storage/v1/object/public/moly-media/samples/';
const SAMPLES = [
  { id: 'bottle', name: 'Insulated Travel Tumbler', points: '保温12小时, 防漏, 一手掌握', url: SB + 'case_bottle.png' },
  { id: 'earbuds', name: '无线降噪蓝牙耳机', points: '降噪, 超长续航, 触控操作', url: SB + 'case_earbuds.png' },
  { id: 'serum', name: 'Glow Repair Serum', points: '提亮, 保湿, 敏感肌可用', url: SB + 'case_serum.png' },
];
async function useSample(s: { id: string; name: string; points: string; url: string }) {
  uploading.value = 'product';
  try {
    const resp = await fetch(s.url);
    const blob = await resp.blob();
    const file = new File([blob], s.id + '.png', { type: blob.type || 'image/png' });
    productAssets.value = [await uploadAsset(file, 'product_image')];
    productName.value = s.name;
    sellingPoints.value = s.points;
    creativePrompt.value = '';
    negativePrompt.value = '';
  } catch (e: any) { alert('加载示例失败：' + e.message); }
  finally { uploading.value = ''; }
}

onUnmounted(() => { if (pollTimer) clearTimeout(pollTimer); stopProgressUx(); });
</script>

<style scoped lang="scss">
.studio { position: relative; min-height: 100vh; background: var(--color-bg-subtle); display: flex; flex-direction: column; }
.studio-aurora {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(46% 38% at 16% 0%, rgba(59,130,246,.16), transparent 70%),
    radial-gradient(42% 34% at 92% 6%, rgba(99,102,241,.14), transparent 70%),
    radial-gradient(38% 30% at 60% 0%, rgba(6,182,212,.08), transparent 72%);
}
.topbar, .canvas { position: relative; z-index: 1; }

.topbar {
  height: 60px; padding: 0 28px; display: flex; align-items: center; justify-content: space-between;
  background: rgba(255,255,255,.72); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(255,255,255,.6);
  box-shadow: 0 1px 0 rgba(37,99,235,.06); position: sticky; top: 0; z-index: 20;
  .brand { display: flex; align-items: center; gap: 9px; text-decoration: none; }
  .brand-mark { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg,#3B82F6,#6366F1); color:#fff; font-weight:800; display:flex; align-items:center; justify-content:center; font-size:15px; box-shadow: 0 6px 14px -4px rgba(37,99,235,.6); }
  .brand-name { font-size: 19px; font-weight: 800; letter-spacing: -.02em; color: var(--color-text-primary); }
  .brand-tag { font-size: 12px; font-weight: 600; color: #2563eb; background: rgba(37,99,235,.09); padding: 3px 9px; border-radius: 999px; margin-left: 4px; }
  .credits { display:flex; align-items:center; gap:7px; padding:7px 14px; background:rgba(255,255,255,.9); border:1px solid var(--color-border); border-radius:999px; font-size:13px; font-weight:600; color:var(--color-text-primary); cursor:pointer; transition: all .2s ease; &:hover { border-color:#c7d2fe; box-shadow: 0 4px 12px -4px rgba(37,99,235,.3); } }
  .credits-dot { width:7px; height:7px; border-radius:50%; background:#10b981; box-shadow: 0 0 0 0 rgba(16,185,129,.5); animation: pulse 2s infinite; }
  .login-link { font-weight:600; color:#2563eb; }
}

.canvas { flex:1; width:100%; max-width: 1480px; margin: 0 auto; padding: 40px 40px 56px; }

.hero { text-align:center; margin-bottom: 32px; animation: fadeUp .6s ease both;
  .hero-badge { display:inline-flex; align-items:center; gap:7px; padding:5px 13px; margin-bottom:16px; font-size:12px; font-weight:600; color:#2563eb; background:rgba(37,99,235,.08); border:1px solid rgba(37,99,235,.18); border-radius:999px;
    .badge-dot { width:6px; height:6px; border-radius:50%; background:#2563eb; animation:pulse 2s infinite; } }
  h1 { font-size: clamp(24px, 3.2vw, 34px); font-weight: 800; letter-spacing:-.02em; margin:0 0 10px; color:#0f172a;
    .grad { background: linear-gradient(110deg,#2563eb,#6366f1 55%,#06b6d4); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; } }
  p { color: var(--color-text-secondary); font-size: 15px; margin:0; }
}
.hero-limits { display:flex; justify-content:center; flex-wrap:wrap; gap:8px; margin-top:14px;
  span { padding:6px 11px; border-radius:999px; background:rgba(255,255,255,.74); border:1px solid rgba(148,163,184,.24); color:#64748b; font-size:12px; font-weight:600; }
}

.workspace { display:grid; grid-template-columns: minmax(0, 1fr) 500px; gap: 28px; align-items:start; }
.workspace.has-output { grid-template-columns: minmax(0, 1fr) minmax(420px, 480px); }

.card { background:rgba(255,255,255,.72); border:1px solid rgba(255,255,255,.7); border-radius: var(--radius-2xl); padding: 22px; margin-bottom:18px; box-shadow: 0 10px 34px -20px rgba(15,23,42,.28); backdrop-filter: blur(10px); transition: box-shadow .3s ease;
  &:hover { box-shadow: 0 16px 40px -22px rgba(37,99,235,.34); } }
.card-title { display:flex; align-items:center; gap:10px; font-weight:700; font-size:15px; margin-bottom:18px; color:#0f172a;
  .num { width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-size:13px; display:flex; align-items:center; justify-content:center; font-weight:800; box-shadow:0 6px 14px -5px rgba(37,99,235,.6); }
}

.uploads { display:grid; grid-template-columns: repeat(3,1fr); gap:12px; }
.upload {
  position:relative; aspect-ratio: 3/4; border:1.5px dashed var(--color-border-muted); border-radius: var(--radius-lg);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; cursor:pointer;
  background: rgba(248,250,252,.7); transition: all var(--transition-fast); overflow:hidden;
  &:hover { border-color: var(--color-primary); background: var(--color-primary-light); transform: translateY(-2px); }
  &.filled { border-style:solid; border-color: #c7d2fe; }
  img, .upload-video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .upload-vtag { position:absolute; bottom:6px; left:6px; padding:2px 7px; font-size:10px; font-weight:600; color:#fff; background:rgba(0,0,0,.55); border-radius:6px; backdrop-filter:blur(4px); z-index:1; }
  .upload-plus { font-size:22px; color: var(--color-text-tertiary); }
  .upload-label { font-size:12px; color: var(--color-text-secondary); text-align:center; em { display:block; font-style:normal; font-size:11px; color: var(--color-text-tertiary); margin-top:2px; } }
  .upload-spin { position:absolute; inset:0; background:rgba(255,255,255,.7); &::after { content:''; position:absolute; top:50%; left:50%; width:20px; height:20px; margin:-10px; border:2px solid var(--color-border); border-top-color: var(--color-primary); border-radius:50%; animation: spin .8s linear infinite; } }
  .upload-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .upload-del { position:absolute; top:5px; right:5px; z-index:3; width:22px; height:22px; padding:0; border:none; border-radius:50%; background:rgba(15,23,42,.6); color:#fff; font-size:15px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity .15s, background .15s; &:hover { background:rgba(220,38,38,.92); } }
  &:hover .upload-del { opacity:1; }
  .upload-play { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:2; width:40px; height:40px; padding:0; border:1.5px solid rgba(255,255,255,.7); border-radius:50%; background:rgba(15,23,42,.42); backdrop-filter:blur(4px); cursor:pointer; display:flex; align-items:center; justify-content:center;
    .tri { width:0; height:0; margin-left:3px; border-left:12px solid #fff; border-top:7px solid transparent; border-bottom:7px solid transparent; }
    &:hover { background:rgba(37,99,235,.7); } }
}
.upload-note { margin:12px 0 0; color:#64748b; font-size:12px; line-height:1.7; }
.upload-count { position:absolute; bottom:6px; right:6px; z-index:1; padding:2px 8px; border-radius:999px; background:rgba(37,99,235,.9); color:#fff; font-size:11px; font-weight:800; }
.product-thumbs { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-top:10px;
  .pt-item { position:relative; width:56px; height:56px; border-radius:10px; overflow:hidden; border:1px solid var(--color-border);
    img { width:100%; height:100%; object-fit:cover; }
    em { position:absolute; bottom:0; left:0; right:0; padding:1px 0; background:rgba(37,99,235,.85); color:#fff; font-size:9px; font-style:normal; font-weight:800; text-align:center; }
    .pt-del { position:absolute; top:2px; right:2px; width:16px; height:16px; padding:0; border:none; border-radius:50%; background:rgba(15,23,42,.65); color:#fff; font-size:11px; line-height:1; cursor:pointer; }
  }
  .pt-add { width:56px; height:56px; display:flex; align-items:center; justify-content:center; border:1.5px dashed var(--color-border-muted); border-radius:10px; color:var(--color-text-tertiary); font-size:20px; cursor:pointer;
    &:hover { border-color:#93c5fd; color:#2563eb; }
  }
  .pt-tip { flex-basis:100%; color:var(--color-text-tertiary); font-size:11.5px; }
}

.product-fields { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
.field { width:100%; padding:11px 14px; border:1px solid var(--color-border); border-radius: var(--radius-md); font-size:14px; background:rgba(255,255,255,.82); transition: all var(--transition-fast); &:focus{ border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); outline:none; } }
.prompt-composer { border:1px solid rgba(148,163,184,.28); border-radius:18px; background:rgba(255,255,255,.82); box-shadow:0 16px 34px -28px rgba(15,23,42,.5); overflow:hidden; transition:border-color .18s ease, box-shadow .18s ease, background .18s ease;
  &:focus-within { border-color:#93c5fd; box-shadow:0 16px 36px -24px rgba(37,99,235,.45), 0 0 0 3px rgba(37,99,235,.08); background:#fff; }
  &.ready { border-color:rgba(34,197,94,.36); }
}
.prompt-composer-head { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:14px 16px 10px; border-bottom:1px solid rgba(226,232,240,.8);
  div { display:flex; flex-direction:column; gap:3px; min-width:0; }
  b { font-size:16px; color:#0f172a; line-height:1.3; }
}
.prompt-kicker { font-size:11px; font-weight:800; color:#2563eb; letter-spacing:0; }
.prompt-guide-btn { flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:34px; padding:0 12px; border:1px solid #bfdbfe; border-radius:999px; background:#eff6ff; color:#2563eb; font-size:13px; font-weight:700; cursor:pointer; transition:all .15s ease;
  &:not(:disabled):hover { background:#dbeafe; border-color:#93c5fd; }
  &:disabled { opacity:.55; cursor:not-allowed; }
}
.prompt-autofill-note { display:flex; align-items:center; gap:10px; margin:10px 16px 0; padding:11px 14px; border:1px solid rgba(37,99,235,.22); border-radius:12px; background:rgba(37,99,235,.06); color:#1e40af; font-size:13px; line-height:1.5;
  b { font-weight:800; }
  .mini-spin { flex-shrink:0; }
}
.prompt-main.autofilling { background:linear-gradient(100deg, rgba(37,99,235,.04) 30%, rgba(37,99,235,.09) 50%, rgba(37,99,235,.04) 70%); background-size:220% 100%; animation: autofillShimmer 1.6s linear infinite; }
@keyframes autofillShimmer { 0% { background-position:120% 0; } 100% { background-position:-100% 0; } }
.prompt-main { display:block; width:100%; min-height:142px; padding:16px; border:0; resize:vertical; background:transparent; color:#0f172a; font-size:15px; line-height:1.65; font-family:inherit; outline:none;
  &::placeholder { color:#94a3b8; }
}
.prompt-composer-foot { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px 12px 16px; border-top:1px solid rgba(226,232,240,.72); background:rgba(248,250,252,.72); }
.prompt-required { margin:0; font-size:12px; line-height:1.5; color:#b45309; min-width:0;
  &.ok { color:#047857; }
}
.advanced-toggle { flex-shrink:0; display:inline-flex; align-items:center; gap:7px; min-height:30px; padding:0 10px; border:1px solid rgba(148,163,184,.35); border-radius:999px; background:#fff; color:#475569; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s ease;
  span { width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#e2e8f0; color:#334155; line-height:1; }
  &:hover { border-color:#93c5fd; color:#2563eb; }
}
.advanced-negative { padding:12px 16px 16px; border-top:1px solid rgba(226,232,240,.72); background:#fff;
  label { display:block; margin-bottom:7px; color:#475569; font-size:12px; font-weight:800; }
}
.negative-field { width:100%; min-height:62px; padding:11px 12px; border:1px solid var(--color-border); border-radius:12px; resize:vertical; font-family:inherit; font-size:13px; line-height:1.55; outline:none; background:#f8fafc;
  &:focus { border-color:#93c5fd; box-shadow:0 0 0 3px rgba(37,99,235,.08); background:#fff; }
}
.negative-summary { width:100%; padding:9px 16px 13px; border:0; border-top:1px solid rgba(226,232,240,.72); background:rgba(248,250,252,.72); color:#64748b; font-size:12px; line-height:1.45; text-align:left; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  &:hover { color:#2563eb; background:#eff6ff; }
}
.mini-spin { width:13px; height:13px; border:2px solid rgba(37,99,235,.22); border-top-color:#2563eb; border-radius:50%; animation: spin .8s linear infinite; }

.switches { display:flex; align-items:center; gap:18px; }
.switch.disabled { opacity:.42; cursor:not-allowed; }
.switch { display:flex; align-items:center; gap:7px; font-size:13px; cursor:pointer; user-select:none;
  input { display:none; }
  span { width:36px; height:20px; border-radius:999px; background: var(--color-border-muted); position:relative; transition: background var(--transition-fast); flex-shrink:0;
    &::after { content:''; position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition: transform var(--transition-fast); box-shadow:0 1px 3px rgba(0,0,0,.2); } }
  input:checked + span { background: linear-gradient(135deg,#2563eb,#4f46e5); &::after { transform: translateX(16px); } }
}
.lang { margin-left:auto; padding:7px 10px; border:1px solid var(--color-border); border-radius: var(--radius-md); font-size:13px; background:#fff; cursor:pointer; }

.generate { position:relative; overflow:hidden; width:100%; padding:16px; border:none; border-radius: var(--radius-lg); background: linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-size:15px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:9px; box-shadow: 0 10px 26px -8px rgba(37,99,235,.55); cursor:pointer; transition: transform .2s ease, box-shadow .2s ease;
  &:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 14px 32px -8px rgba(37,99,235,.62); }
  &::after { content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%; background: radial-gradient(circle, rgba(255,255,255,.28) 0%, transparent 60%); opacity:0; transform:scale(.5); transition: opacity .3s, transform .3s; }
  &:not(:disabled):hover::after { opacity:1; transform:scale(1); }
  &:disabled { opacity:.45; box-shadow:none; cursor:not-allowed; }
}
.gen-spin { width:16px; height:16px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation: spin .8s linear infinite; }
.generate-2up { width:100%; margin-top:10px; padding:12px; border:1px solid var(--color-primary); border-radius: var(--radius-lg); background: var(--color-primary-light,#eef2ff); color: var(--color-primary); font-size:14px; font-weight:700; cursor:pointer; transition: all .2s ease;
  &:not(:disabled):hover { background:#e0e7ff; transform: translateY(-1px); }
  &:disabled { opacity:.45; cursor:not-allowed; }
}
.result-jump { position:sticky; bottom:18px; z-index:8; width:100%; margin-top:12px; min-height:46px; border:1px solid rgba(37,99,235,.22); border-radius:14px; background:#111827; color:#fff; font-size:15px; font-weight:900; cursor:pointer; box-shadow:0 18px 36px -20px rgba(15,23,42,.72);
  &:hover { background:#0f172a; transform:translateY(-1px); }
}
.duration-note { text-align:center; font-size:12px; line-height:1.6; color:#64748b; margin:10px 0 0; }
.hint { text-align:center; font-size:13px; color: var(--color-text-tertiary); margin:12px 0 0; }
.hint.warn { color:#b45309; }

.preview { position:sticky; top:88px; background:rgba(255,255,255,.86); border:1px solid rgba(255,255,255,.72); border-radius: var(--radius-2xl); padding:18px; box-shadow: 0 18px 44px -22px rgba(15,23,42,.32); backdrop-filter: blur(12px); min-height: 560px; display:flex; flex-direction:column; scroll-margin-top:88px;
  &.has-output { border-color:rgba(37,99,235,.24); box-shadow:0 28px 70px -32px rgba(37,99,235,.52); }
}
.preview-headline { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; padding:3px 2px 15px; margin-bottom:15px; border-bottom:1px solid rgba(226,232,240,.85);
  div { display:flex; flex-direction:column; gap:4px; min-width:0; }
  span { color:#2563eb; font-size:12px; font-weight:900; }
  b { color:#0f172a; font-size:18px; font-weight:900; line-height:1.25; }
  em { max-width:170px; color:#64748b; font-size:12px; font-style:normal; line-height:1.45; text-align:right; }
}
.preview-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; color: var(--color-text-tertiary);
  .phone { width:150px; aspect-ratio:9/16; border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#fff; background: linear-gradient(160deg,#1e293b,#0f172a); box-shadow: 0 20px 44px -16px rgba(37,99,235,.4); position:relative;
    &::before { content:''; position:absolute; inset:6px; border-radius:15px; border:1.5px dashed rgba(255,255,255,.22); }
    span { position:relative; opacity:.85; } }
  p { font-size:13px; margin:0; }
}
.preview-variants { flex:1; display:flex; flex-direction:column; gap:14px;
  .pv-head { display:flex; flex-direction:column; gap:4px; b { font-size:16px; font-weight:800; color:#0f172a; } .pv-eta { font-size:12px; color: var(--color-text-tertiary); } }
  .pv-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .pv-cell { display:flex; flex-direction:column; gap:8px; min-width:0; background:rgba(248,250,252,.7); border:1px solid var(--color-border-light); border-radius: var(--radius-lg); padding:10px; }
  .pv-label { font-size:12px; font-weight:700; color: var(--color-primary); }
  .pv-video { width:100%; border-radius: var(--radius-md); background:#000; aspect-ratio:9/16; object-fit:contain; box-shadow:0 10px 24px -14px rgba(15,23,42,.5); }
  .pv-dl { padding:9px; font-size:13px; text-align:center; background: linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; border:none; border-radius: var(--radius-md); font-weight:600; cursor:pointer; &:disabled { opacity:.6; cursor:default; } }
  .pv-msg { aspect-ratio:9/16; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; text-align:center; font-size:12px; color: var(--color-text-tertiary); line-height:1.4;
    &.fail { color: var(--color-error); font-weight:600; } small { color: var(--color-text-tertiary); font-weight:400; } }
  .pv-step { margin:0; font-size:12px; color: var(--color-text-secondary); }
  .progress-ring.sm { width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; color:#0f172a; background: conic-gradient(#2563eb var(--p), #e8edf5 0); position:relative;
    &::before { content:''; position:absolute; inset:6px; background:#fff; border-radius:50%; }
    &.running { animation: ringGlow 2s ease-in-out infinite; }
    span { position:relative; z-index:1; } }
  .pv-actions { display:flex; gap:10px; .btn-again { flex:1; padding:11px; background:#fff; border:1px solid var(--color-border); border-radius: var(--radius-md); font-weight:600; font-size:14px; color: var(--color-text-primary); cursor:pointer; &:disabled { opacity:.5; } } }
  .pv-tip { margin:0; font-size:12px; line-height:1.5; color: var(--color-text-tertiary); background: rgba(37,99,235,.05); border:1px solid rgba(37,99,235,.1); padding:9px 12px; border-radius:10px; }
}
.preview-done { flex:1; display:flex; flex-direction:column; gap:14px;
  .result-video { display:block; width:auto; max-width:100%; max-height:min(62vh, 600px); margin:0 auto; border-radius: var(--radius-lg); background:#000; aspect-ratio:9/16; object-fit:contain; box-shadow: 0 16px 36px -18px rgba(15,23,42,.5); }
  .result-actions { display:flex; gap:10px; }
  .btn-download { flex:1; text-align:center; padding:12px; background: linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; border:none; border-radius: var(--radius-md); font-weight:600; font-size:14px; text-decoration:none; cursor:pointer; box-shadow:0 8px 20px -8px rgba(37,99,235,.55); &:disabled { opacity:.6; cursor:default; } }
  .btn-again { flex:1; padding:12px; background:#fff; border:1px solid var(--color-border); border-radius: var(--radius-md); font-weight:600; font-size:14px; color: var(--color-text-primary); cursor:pointer; }
  .btn-variant { flex:1; padding:12px; background: var(--color-primary-light, #eef2ff); border:1px solid var(--color-primary); border-radius: var(--radius-md); font-weight:600; font-size:14px; color: var(--color-primary); cursor:pointer; &:disabled { opacity:.5; cursor:default; } }
  .result-notes { font-size:12px; color: var(--color-text-tertiary); margin:0; line-height:1.5; }
}
.preview-progress { flex:1; display:flex; flex-direction:column; align-items:center; padding-top:24px; gap:18px;
  .gen-head { text-align:center; display:flex; flex-direction:column; gap:6px;
    b { font-size:17px; font-weight:800; color:#0f172a; }
    .gen-eta { font-size:12px; color: var(--color-text-tertiary); }
  }
  .gen-tip { display:flex; align-items:flex-start; gap:8px; max-width:330px; margin:0; font-size:13px; line-height:1.5; color: var(--color-text-secondary);
    background: rgba(37,99,235,.06); border:1px solid rgba(37,99,235,.12); padding:10px 14px; border-radius:12px;
    .gen-tip-ic { flex-shrink:0; }
  }
  .gen-hint { max-width:330px; margin:0; font-size:12px; line-height:1.5; color: var(--color-text-tertiary); text-align:center; }
  .progress-ring { width:104px; height:104px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px; color:#0f172a;
    background: conic-gradient(#2563eb var(--p), #e8edf5 0); position:relative;
    &::before { content:''; position:absolute; inset:9px; background:#fff; border-radius:50%; }
    &.running { box-shadow: 0 0 0 6px rgba(37,99,235,.08); animation: ringGlow 2s ease-in-out infinite; }
    span { position:relative; z-index:1; }
  }
  .steps { list-style:none; padding:0; margin:0; width:100%; display:flex; flex-direction:column; gap:12px;
    li { display:flex; align-items:center; gap:10px; font-size:14px; color: var(--color-text-tertiary);
      .dot { width:8px; height:8px; border-radius:50%; background: var(--color-border-muted); flex-shrink:0; }
      em { font-style:normal; font-size:11px; color: var(--color-text-tertiary); margin-left:auto; }
      &.running { color: var(--color-text-primary); font-weight:600; .dot { background: var(--color-primary); box-shadow:0 0 0 4px rgba(37,99,235,.15); animation: pulse 1.2s infinite; } }
      &.succeeded { color: var(--color-text-primary); .dot { background: var(--color-success); } }
      &.failed { color: var(--color-error); .dot { background: var(--color-error); } }
      &.skipped { .dot { background: var(--color-warning-icon); } }
    }
  }
  .fail { color: var(--color-error); font-size:13px; text-align:center; }
}

.login-panel { display:flex; align-items:center; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:28px; padding:18px; background:rgba(255,255,255,.6); border:1px solid rgba(37,99,235,.14); border-radius:var(--radius-xl); backdrop-filter: blur(10px); box-shadow: 0 10px 30px -18px rgba(37,99,235,.3); }
.login-field { padding:10px 14px; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:14px; width:180px; background:#fff; &:focus{ border-color:var(--color-primary); outline:none; box-shadow:0 0 0 3px rgba(37,99,235,.12); } }
.login-btn { padding:10px 24px; border:none; border-radius:var(--radius-md); background:linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-weight:600; font-size:14px; cursor:pointer; box-shadow:0 8px 18px -8px rgba(37,99,235,.5); }
.login-btn:disabled { opacity:.5; }
.login-err { font-size:13px; color:var(--color-error); width:100%; text-align:center; }
.login-hint { font-size:13px; color:var(--color-text-secondary); }

.samples { margin-top:16px; padding-top:16px; border-top:1px dashed var(--color-border-light); }
.samples-label { font-size:13px; color:var(--color-text-secondary); }
.samples-row { display:flex; gap:10px; margin-top:10px; }
.sample { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; padding:8px; border:1px solid var(--color-border); border-radius:var(--radius-md); background:rgba(255,255,255,.8); cursor:pointer; transition:all var(--transition-fast); }
.sample:hover { border-color:var(--color-primary); background:var(--color-primary-light); transform: translateY(-2px); }
.sample img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:var(--radius-sm); }
.sample span { font-size:11px; color:var(--color-text-secondary); text-align:center; line-height:1.3; }

.credits-plus { margin-left:7px; padding-left:8px; border-left:1px solid var(--color-border-light); color:var(--color-primary); font-weight:700; }

.quick-settings { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.model-opts { display:flex; flex-direction:column; gap:14px; margin-bottom:14px; }
.model-row { display:flex; flex-direction:column; gap:8px; }
.model-label { font-size:13px; font-weight:600; color:var(--color-text-secondary); }
.model-hint { margin:-2px 0 0; font-size:12px; line-height:1.5; color:#b45309; background:rgba(245,158,11,.1); border:1px solid rgba(245,158,11,.25); padding:7px 10px; border-radius:8px;
  &.ok { color:#047857; background:rgba(16,185,129,.1); border-color:rgba(16,185,129,.25); } }
.ml-note { font-style:normal; font-weight:400; font-size:11px; color:var(--color-text-tertiary); margin-left:6px; }
.lang-row { margin-bottom:20px; }
.switches { margin-bottom:4px; }
.settings-toggle { width:100%; margin-top:12px; padding:12px 13px; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:10px; border:1px solid rgba(148,163,184,.3); border-radius:14px; background:rgba(248,250,252,.78); color:#0f172a; cursor:pointer; transition:all .15s ease; text-align:left;
  span { font-size:13px; font-weight:800; }
  em { min-width:0; font-style:normal; color:#64748b; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  b { width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#e2e8f0; color:#334155; font-size:13px; line-height:1; }
  &:hover { border-color:#93c5fd; background:#eff6ff; }
}
.advanced-settings { margin-top:12px; padding:14px; border:1px solid rgba(226,232,240,.9); border-radius:16px; background:rgba(255,255,255,.72); }
.seg { display:flex; gap:8px; }
.seg button { flex:1; padding:11px 12px; border:1px solid var(--color-border); border-radius:var(--radius-md); background:rgba(255,255,255,.8); font-size:13px; font-weight:600; color:var(--color-text-secondary); cursor:pointer; transition:all var(--transition-fast); display:flex; flex-direction:column; align-items:center; gap:3px; line-height:1.2;
  em { font-style:normal; font-size:11px; font-weight:500; color:var(--color-text-tertiary); }
  &:hover { border-color:var(--color-primary); transform: translateY(-1px); }
  &.active { border-color:var(--color-primary); background:var(--color-primary-light); color:var(--color-primary); box-shadow:0 6px 16px -8px rgba(37,99,235,.4); em { color:var(--color-primary); } }
}

.modal-mask { position:fixed; inset:0; background:rgba(15,23,42,.5); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal { width:100%; max-width:420px; background:#fff; border-radius:var(--radius-2xl); padding:24px; box-shadow:var(--shadow-xl); }
.modal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; b { font-size:18px; font-weight:800; } }
.modal-x { width:30px; height:30px; border:none; background:var(--color-bg-subtle); border-radius:50%; font-size:18px; color:var(--color-text-secondary); cursor:pointer; line-height:1; }
.modal-msg { font-size:13px; color:var(--color-primary); background:var(--color-primary-light); padding:10px 12px; border-radius:var(--radius-md); margin:0 0 14px; }
.pkgs { display:flex; flex-direction:column; gap:10px; }
.pkg { position:relative; display:flex; align-items:center; gap:12px; padding:16px; border:1px solid var(--color-border); border-radius:var(--radius-lg); background:#fff; cursor:pointer; transition:all var(--transition-fast);
  &:hover:not(:disabled) { border-color:var(--color-primary); background:var(--color-primary-light); transform: translateY(-1px); }
  &:disabled { opacity:.6; cursor:default; }
}
.pkg-credits { font-size:20px; font-weight:800; color:var(--color-text-primary); em { font-style:normal; font-size:12px; font-weight:500; color:var(--color-text-tertiary); margin-left:3px; } }
.pkg-bonus { font-size:11px; font-weight:600; color:#f59e0b; background:#fef3c7; padding:2px 8px; border-radius:999px; }
.pkg-price { margin-left:auto; font-size:17px; font-weight:800; color:var(--color-primary); }
.pkg-spin { position:absolute; right:16px; width:16px; height:16px; border:2px solid var(--color-border); border-top-color:var(--color-primary); border-radius:50%; animation:spin .8s linear infinite; }
.modal-foot { font-size:11px; color:var(--color-text-tertiary); text-align:center; margin:14px 0 0; }
.modal-tip { font-size:14px; line-height:1.75; color: var(--color-text-secondary); text-align:center; padding:6px 4px 2px; b { color: var(--color-primary); font-weight:700; } }
.pay-sub { margin:4px 0 12px; color:#334155; font-size:14px; line-height:1.6; b { color:var(--color-primary); } }
.pay-channels { display:grid; grid-template-columns:1fr 1fr; gap:12px;
  .pay-ch { min-height:52px; border:none; border-radius:14px; color:#fff; font-size:15px; font-weight:900; cursor:pointer;
    &:disabled { opacity:.45; cursor:not-allowed; }
    &.wechat { background:#07c160; }
    &.alipay { background:#1677ff; }
  }
}
.pay-back { margin-top:14px; padding:8px 14px; border:1px solid var(--color-border); border-radius:10px; background:#fff; color:#475569; font-size:13px; font-weight:700; cursor:pointer; }
.pay-qr { display:flex; align-items:center; justify-content:center; min-height:200px; margin:6px 0;
  img { width:200px; height:200px; border-radius:12px; border:1px solid var(--color-border); }
  .pay-link { color:#2563eb; font-weight:800; }
}
.pay-wait { display:flex; align-items:center; justify-content:center; gap:8px; margin:4px 0 8px; color:#64748b; font-size:13px; }
.pay-h5 { display:block; text-align:center; color:#2563eb; font-size:13px; font-weight:700; margin-bottom:4px; }
.pay-done { margin:14px 0; color:#047857; font-size:15px; line-height:1.7; text-align:center; b { color:var(--color-primary); } }

.voice-hint { font-size:12px; color:var(--color-text-tertiary); margin:10px 0 0; line-height:1.5; }
.script { background:rgba(248,250,252,.8); border:1px solid var(--color-border-light); border-radius:var(--radius-md); padding:12px 14px;
  .script-head { font-size:13px; font-weight:700; margin-bottom:8px; }
  .regen-hint { font-size:11.5px; color:var(--color-text-tertiary); margin:0 0 10px; line-height:1.5; }
  .scene-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
  .scene-item { display:flex; align-items:center; gap:10px; }
  .scene-thumb { width:34px; height:60px; object-fit:cover; border-radius:6px; flex-shrink:0; background:#e2e8f0; border:1px solid var(--color-border-light); }
  .scene-meta { flex:1; min-width:0; font-size:13px; color:var(--color-text-primary); line-height:1.35;
    em { font-style:normal; font-size:11px; font-weight:600; color:var(--color-primary); margin-right:6px; text-transform:uppercase; } }
  .scene-regen { flex-shrink:0; width:34px; height:34px; border:1px solid var(--color-border); border-radius:8px; background:#fff; cursor:pointer; font-size:15px; line-height:1; display:flex; align-items:center; justify-content:center; transition:all var(--transition-fast);
    &:hover:not(:disabled) { border-color:var(--color-primary); background:var(--color-primary-light,#eef2ff); transform:rotate(-30deg); }
    &:disabled { opacity:.4; cursor:default; } }
}

.voice-pick { margin-top:14px; display:flex; flex-direction:column; gap:8px; }
.voice-trigger {
  display:flex; align-items:center; gap:10px; width:100%; padding:11px 14px; text-align:left;
  border:1px solid var(--color-border); border-radius:var(--radius-md); background:rgba(255,255,255,.85);
  cursor:pointer; transition:all var(--transition-fast);
  &:hover { border-color:var(--color-primary); box-shadow:0 4px 12px -6px rgba(37,99,235,.35); }
  .vt-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; &.f{ background:#db2777; } &.m{ background:#2563eb; } }
  .vt-name { font-size:14px; font-weight:700; color:var(--color-text-primary); flex-shrink:0; }
  .vt-desc { font-size:12px; color:var(--color-text-tertiary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .vt-play { margin-left:auto; width:24px; height:24px; flex-shrink:0; border-radius:50%; background:var(--color-primary-light); color:var(--color-primary); font-size:9px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all var(--transition-fast); &:hover { background:var(--color-primary); color:#fff; } }
  .vt-more { font-size:12px; font-weight:600; color:var(--color-primary); flex-shrink:0; }
}

.vp-mask { position:fixed; inset:0; background:rgba(15,23,42,.5); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:120; padding:20px; }
.vp-modal { width:100%; max-width:560px; max-height:82vh; display:flex; flex-direction:column; background:#fff; border-radius:var(--radius-2xl); box-shadow:var(--shadow-xl); overflow:hidden; }
.vp-head { display:flex; align-items:center; justify-content:space-between; padding:18px 20px 12px; b{ font-size:17px; font-weight:800; } }
.vp-x { width:30px; height:30px; border:none; background:var(--color-bg-subtle); border-radius:50%; font-size:18px; color:var(--color-text-secondary); cursor:pointer; line-height:1; }
.vp-search { margin:0 20px; padding:11px 14px; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:14px; background:var(--color-bg-subtle); &:focus{ outline:none; border-color:var(--color-primary); box-shadow:0 0 0 3px rgba(37,99,235,.12); background:#fff; } }
.vp-tabs { display:flex; flex-wrap:wrap; gap:8px; padding:14px 20px 6px;
  button { padding:6px 14px; border:1px solid var(--color-border); border-radius:999px; background:#fff; font-size:13px; font-weight:600; color:var(--color-text-secondary); cursor:pointer; transition:all var(--transition-fast);
    &:hover { border-color:var(--color-primary); }
    &.active { background:linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; border-color:transparent; box-shadow:0 6px 14px -6px rgba(37,99,235,.5); } }
}
.vp-grid { flex:1; overflow-y:auto; display:grid; grid-template-columns:repeat(2,1fr); gap:10px; padding:12px 20px;
  @media (min-width:480px){ grid-template-columns:repeat(3,1fr); }
}
.vp-card { position:relative; display:flex; flex-direction:column; gap:5px; padding:13px; border:1px solid var(--color-border); border-radius:var(--radius-lg); background:#fff; cursor:pointer; text-align:left; transition:all var(--transition-fast);
  &:hover { border-color:var(--color-primary); transform:translateY(-2px); box-shadow:0 10px 20px -10px rgba(37,99,235,.4); }
  &.active { border-color:var(--color-primary); background:var(--color-primary-light); box-shadow:0 10px 20px -10px rgba(37,99,235,.5);
    .vp-card-name{ color:var(--color-primary); } }
  .vp-card-top { display:flex; align-items:center; justify-content:space-between; }
  .vp-gender { min-width:18px; text-align:center; font-size:10px; font-weight:700; padding:1px 6px; border-radius:999px; &.f{ color:#db2777; background:rgba(219,39,119,.1); } &.m{ color:#2563eb; background:rgba(37,99,235,.1); } }
  .vp-play { width:22px; height:22px; border-radius:50%; background:var(--color-primary-light); color:var(--color-primary); font-size:9px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all var(--transition-fast); &:hover { background:var(--color-primary); color:#fff; transform:scale(1.1); } }
  .vp-card-name { font-size:14px; font-weight:700; color:var(--color-text-primary); }
  .vp-card-desc { font-size:11px; color:var(--color-text-tertiary); line-height:1.4; }
}
.vp-empty { grid-column:1/-1; text-align:center; color:var(--color-text-tertiary); font-size:13px; padding:28px 0; }
.vp-foot { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 20px 16px; border-top:1px solid var(--color-border-light); font-size:12px; color:var(--color-text-tertiary);
  .vp-done { padding:9px 24px; border:none; border-radius:var(--radius-md); background:linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 6px 14px -6px rgba(37,99,235,.5); flex-shrink:0; }
}

.prompt-guide-mask { position:fixed; inset:0; z-index:180; display:flex; align-items:center; justify-content:center; padding:24px; background:rgba(15,23,42,.62); backdrop-filter:blur(7px); }
.prompt-guide-modal { width:min(1180px, 96vw); max-height:90vh; display:flex; flex-direction:column; overflow:hidden; background:#fff; border:1px solid rgba(226,232,240,.75); border-radius:24px; box-shadow:0 34px 90px -32px rgba(2,6,23,.62); }
.pg-head { display:flex; align-items:center; justify-content:space-between; gap:18px; padding:24px 28px 18px;
  div { display:flex; align-items:center; gap:10px; min-width:0; }
  b { color:#0f172a; font-size:21px; font-weight:900; }
}
.pg-icon { width:31px; height:31px; display:inline-flex; align-items:center; justify-content:center; border-radius:10px; background:linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-size:16px; font-weight:900; box-shadow:0 6px 14px -6px rgba(37,99,235,.6); }
.pg-x { width:34px; height:34px; flex-shrink:0; border:none; border-radius:50%; background:#f8fafc; color:#475569; font-size:22px; line-height:1; cursor:pointer;
  &:hover { background:#e2e8f0; color:#0f172a; }
}
.pg-steps { display:flex; align-items:center; gap:8px; padding:0 28px 18px; border-bottom:1px solid #eef2f7;
  button { display:inline-flex; align-items:center; gap:8px; min-height:36px; padding:0 14px; border:none; border-radius:999px; background:transparent; color:#94a3b8; font-size:13.5px; font-weight:800; cursor:pointer; transition:all .16s ease;
    span { width:21px; height:21px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; border-radius:50%; background:#eef2f7; color:#94a3b8; font-size:11px; font-weight:900; transition:all .16s ease; }
    &:disabled { cursor:default; }
    &.active { background:rgba(37,99,235,.08); color:#1d4ed8;
      span { background:#2563eb; color:#fff; box-shadow:0 4px 10px -3px rgba(37,99,235,.55); }
    }
    &.done:not(.active) { color:#475569;
      span { background:#dbeafe; color:#1d4ed8; }
    }
    &:not(:first-child)::before { content:''; width:18px; height:1.5px; margin-right:8px; background:#e2e8f0; border-radius:1px; }
  }
}
.pg-loading, .pg-error { min-height:240px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; color:#64748b; font-size:13.5px; text-align:center; padding:34px; }
.pg-loading p { margin:0; color:#94a3b8; }
.pg-loading-stages { display:flex; flex-direction:column; gap:13px; text-align:left;
  .stage { display:flex; align-items:center; gap:11px; color:#334155; font-size:14.5px; font-weight:700; }
  .dot { width:9px; height:9px; flex-shrink:0; border-radius:50%; background:#2563eb; opacity:.25; animation: pgPulse 1.5s ease-in-out infinite; }
  .stage:nth-child(2) .dot { animation-delay:.5s; }
  .stage:nth-child(3) .dot { animation-delay:1s; }
}
@keyframes pgPulse { 0%,100% { opacity:.22; transform:scale(1); } 50% { opacity:1; transform:scale(1.25); } }
.pg-error p { margin:0; color:#b45309; }
.pg-error button { padding:10px 18px; border:1px solid #bfdbfe; border-radius:999px; background:#eff6ff; color:#2563eb; font-weight:800; cursor:pointer; }
.pg-pane { min-height:0; overflow-y:auto; padding:26px 28px 30px;
  h3 { margin:0 0 18px; color:#0f172a; font-size:19px; font-weight:900; }
}
.pg-core-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:14px;
  div { min-height:76px; padding:14px 16px; border:1px solid #e5e7eb; border-radius:14px; background:#fafafa; }
  span { display:block; margin-bottom:7px; color:#64748b; font-size:12px; font-weight:800; }
  b { color:#111827; font-size:15px; line-height:1.45; }
}
.pg-selling { margin-top:14px; padding:16px; border:1px solid #e5e7eb; border-radius:14px; background:#fff;
  span { display:block; margin-bottom:10px; color:#64748b; font-size:12px; font-weight:900; }
  em { display:inline-flex; margin:0 8px 8px 0; padding:7px 12px; border-radius:999px; background:rgba(37,99,235,.07); color:#1d4ed8; font-size:13px; font-style:normal; font-weight:800; }
}
.pg-pane-title { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:18px;
  h3 { margin:0; }
}
.pg-scenario-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:16px; }
.pg-scenario-card { display:flex; flex-direction:column; padding:20px; border:1px solid #e5e7eb; border-radius:18px; background:#fff; box-shadow:0 10px 28px -22px rgba(15,23,42,.5); transition:all .16s ease;
  &:hover { border-color:#c7d7fe; transform:translateY(-1px); }
  &.active { border-color:#2563eb; background:linear-gradient(180deg, rgba(37,99,235,.045), rgba(255,255,255,0) 38%); box-shadow:0 16px 34px -24px rgba(37,99,235,.55); }
  h4 { margin:0 0 16px; padding-left:11px; border-left:3px solid #2563eb; color:#111827; font-size:16.5px; line-height:1.4; font-weight:900; }
  .pg-card-pick { margin-top:auto; }
}
.pg-row { display:grid; grid-template-columns:54px 1fr; gap:10px; margin:0 0 12px; color:#1f2937; font-size:14px; line-height:1.58;
  span { align-self:start; justify-self:start; min-width:44px; padding:3px 9px; border-radius:8px; background:#f1f5f9; color:#475569; font-size:12px; font-weight:800; text-align:center; }
  &.actions { display:block; margin-bottom:16px;
    span { display:inline-flex; margin-bottom:8px; }
    ol { margin:0; padding-left:20px; color:#1f2937; }
    li { margin-bottom:6px; }
  }
}
.pg-card-pick { width:100%; min-height:45px; border:none; border-radius:12px; background:#111827; color:#fff; font-size:15px; font-weight:900; cursor:pointer;
  &:hover { background:#0f172a; box-shadow:0 10px 22px -12px rgba(2,6,23,.55); }
}
.pg-final-prompt, .pg-final-negative { width:100%; border:1px solid #e5e7eb; border-radius:14px; background:#fafafa; color:#0f172a; font:inherit; line-height:1.65; resize:vertical; outline:none;
  &:focus { border-color:#93c5fd; background:#fff; box-shadow:0 0 0 3px rgba(37,99,235,.09); }
}
.pg-final-prompt { min-height:210px; padding:16px; font-size:15px; }
.pg-negative-label { display:block; margin:18px 0 8px; color:#475569; font-size:13px; font-weight:900; }
.pg-final-negative { min-height:86px; padding:12px 14px; font-size:13px; color:#334155; }
.pg-actions { display:flex; justify-content:flex-end; gap:12px; margin-top:20px; }
.pg-primary, .pg-secondary { min-height:42px; padding:0 20px; border-radius:12px; font-size:14px; font-weight:900; cursor:pointer; }
.pg-primary { border:none; background:#111827; color:#fff;
  &:hover { background:#0f172a; box-shadow:0 10px 22px -12px rgba(2,6,23,.55); }
}
.pg-secondary { border:1px solid #e5e7eb; background:#fff; color:#111827;
  &:hover { border-color:#cbd5e1; background:#f8fafc; }
}

@keyframes ringGlow { 0%,100% { box-shadow: 0 0 0 6px rgba(37,99,235,.08); } 50% { box-shadow: 0 0 0 10px rgba(37,99,235,.04); } }
@keyframes fadeUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: none; } }

@media (max-width: 880px) {
  .workspace { grid-template-columns: 1fr; }
  .workspace.has-output { grid-template-columns:1fr; }
  .preview { position:relative; top:0; }
  .prompt-guide-modal { width:100%; max-height:92vh; }
  .pg-scenario-grid { grid-template-columns:1fr; }
  .pg-scenario-card { min-height:0; }
}
/* 手机端：减小内边距、防溢出 */
@media (max-width: 640px) {
  .canvas { padding: 24px 16px 48px; }
  .card { padding: 18px 16px; }
  .uploads { gap:10px; }
  .upload { min-width:0; }
  .product-fields { grid-template-columns:1fr; }
  .quick-settings { grid-template-columns:1fr; }
  .prompt-composer-head, .prompt-composer-foot { align-items:flex-start; flex-direction:column; }
  .prompt-guide-btn, .advanced-toggle { width:100%; }
  .prompt-guide-mask { padding:10px; align-items:flex-end; }
  .prompt-guide-modal { max-height:94vh; border-radius:20px 20px 0 0; }
  .pg-head { padding:18px 18px 14px; }
  .pg-steps { flex-wrap:wrap; gap:6px; padding:0 18px 14px; }
  .pg-steps button { min-height:38px;
    &:not(:first-child)::before { display:none; }
  }
  .pg-pane { padding:20px 18px 24px; }
  .pg-core-grid { grid-template-columns:1fr; }
  .pg-actions { flex-direction:column-reverse; }
  .pg-primary, .pg-secondary { width:100%; }
  .hero { margin-bottom: 24px; h1 { font-size: clamp(22px, 6vw, 30px); } p { font-size: 14px; } }
}
/* 参考视频播放弹层 */
.pv-mask { position:fixed; inset:0; background:rgba(15,23,42,.62); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:220; padding:20px; }
.pv-box { position:relative; background:#000; border-radius:var(--radius-2xl); overflow:hidden; box-shadow:var(--shadow-xl); max-width:min(92vw, 460px); }
.pv-x { position:absolute; top:8px; right:10px; z-index:3; width:32px; height:32px; border:none; border-radius:50%; background:rgba(15,23,42,.55); color:#fff; font-size:20px; line-height:1; cursor:pointer; }
.pv-video { display:block; width:100%; max-height:86vh; object-fit:contain; background:#000; }
</style>
