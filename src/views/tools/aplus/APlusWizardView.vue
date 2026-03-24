<template>
  <div class="aplus-wizard">
    <header class="tool-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <span>A+ 向导</span>
        </div>
        <div class="header-right">
          <span class="points"><ThunderboltFilled /> {{ auth.points }} 积分</span>
          <router-link to="/recharge" class="recharge-link">充值</router-link>
        </div>
      </div>
    </header>

    <main class="wizard-main">
      <StepIndicator
        :steps="['输入信息', '风格生成', '生成图片']"
        :current="step - 1"
        :subtitles="{ 0: '填写商品', 1: '策略与规划', 2: '生成配图' }"
      />

      <div class="step-content card">
        <!-- Step 1: Input -->
        <section v-if="step === 1">
          <APlusInputForm
            v-model:aspect-ratio="aspectRatio"
            v-model:quality-tier="qualityTier"
            :show-validation="showStep1Validation"
          />

          <div class="step-footer">
            <div class="cost-hint cost-hint-aplus">
              <ThunderboltFilled class="cost-icon" />
              预估消耗 <strong>{{ aplusCost }}</strong> 积分（{{ moduleCount }} 张 × {{ LISTING_POINTS_COST.aPlusImagePerUnit }}/张）
            </div>
            <div class="footer-actions">
              <button class="btn-next" @click="handleStep1Next">
                下一步：风格生成 <RightOutlined />
              </button>
            </div>
          </div>
        </section>

        <!-- Step 2: 风格生成 -->
        <section v-else-if="step === 2">
          <!-- 策略配置卡片 -->
          <div class="config-card">
            <h4 class="config-title">策略配置</h4>
            <div class="config-grid">
              <div class="field">
                <label>模板</label>
                <select v-model="templateId" class="text-input">
                  <option v-for="opt in APLUS_TEMPLATE_OPTIONS" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
                <span class="hint">模板影响模块顺序与写作重心</span>
              </div>
              <div class="field">
                <label>生图数量（=模块数）</label>
                <select v-model.number="moduleCount" class="text-input">
                  <option v-for="n in 5" :key="n" :value="n + 2">{{ n + 2 }}</option>
                </select>
                <span class="hint">3–7 张，分析将按此数量生成模块规划</span>
              </div>
            </div>
          </div>

          <!-- 分析按钮（独立突出） -->
          <div v-if="!store.analysisReport && !isAnalyzing && !analysisError" class="analyze-action">
            <p class="section-desc">请先选择模板与生图数量，然后点击下方按钮开始分析。</p>
            <button class="btn-generate" :disabled="!canProceedStep1" @click="retryAnalysis">
              <ExperimentOutlined /> 开始分析
            </button>
          </div>

          <div v-else-if="isAnalyzing" class="panel">
            <div class="row">
              <span>正在分析…</span>
              <strong>{{ analysisProgress }}%</strong>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: analysisProgress + '%' }" />
            </div>
            <div class="progress-msg">{{ analysisProgressMessage }}</div>
          </div>

          <template v-else-if="store.analysisReport && aplus.visualPlan">
            <p class="section-desc">请审阅并编辑「全局规范」与「模块规划」。点击卡片或「编辑」展开详情。</p>

            <!-- 全局规范：渐进式卡片 -->
            <div class="summary-section">
              <h4 class="section-subtitle">全局规范</h4>
              <div class="summary-cards">
                <div v-for="gk in globalKeys" :key="gk.key" class="summary-card">
                  <div v-if="expandedGlobal !== gk.key" class="summary-preview" @click="expandedGlobal = gk.key">
                    <span class="summary-label">{{ gk.label }}</span>
                    <p class="summary-text">{{ truncatePreview(aplus.visualPlan.global[gk.key]) }}</p>
                    <button class="edit-btn" @click.stop="expandedGlobal = gk.key">编辑</button>
                  </div>
                  <div v-else class="summary-expanded">
                    <label>{{ gk.label }}</label>
                    <textarea :value="aplus.visualPlan.global[gk.key]" class="prompt-textarea" :rows="gk.key === 'negativePrompt' ? 2 : 3" @input="onGlobalInput(gk.key, ($event.target as HTMLTextAreaElement).value)" />
                    <div v-if="gk.key === 'negativePrompt'" class="hint">建议英文逗号分隔，包含常见瑕疵排除项（如 watermark, logo, extra fingers）。</div>
                    <button class="edit-btn" @click="expandedGlobal = null">收起</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 模块规划：渐进式卡片 -->
            <div class="summary-section">
              <div class="section-title-row">
                <h4 class="section-subtitle">模块规划</h4>
                <button class="ghost-btn" :disabled="(aplus.visualPlan.modules?.length ?? 0) >= moduleCount" @click="aplus.addVisualPlanModule()">新增模块</button>
              </div>
              <div class="summary-cards modules-grid">
                <div v-for="(m, idx) in aplus.visualPlan.modules" :key="idx" class="summary-card module-card">
                  <div v-if="expandedModule !== idx" class="summary-preview" @click="expandedModule = idx">
                    <span class="summary-label">模块 {{ idx + 1 }}：{{ m.moduleName || '未命名' }}</span>
                    <p class="summary-text">{{ truncatePreview(m.croLogic) }}</p>
                    <p class="summary-text summary-prompt">{{ truncatePreview(m.imagePromptEn, 80) }}</p>
                    <div class="card-actions">
                      <button class="edit-btn" @click.stop="expandedModule = idx">编辑</button>
                      <button class="ghost-btn small" @click.stop="aplus.removeVisualPlanModule(idx)">删除</button>
                    </div>
                  </div>
                  <div v-else class="summary-expanded module-expanded">
                    <div class="field">
                      <label>模块名称</label>
                      <input :value="m.moduleName" class="text-input" @input="onModuleInput(idx, { moduleName: ($event.target as HTMLInputElement).value })" />
                    </div>
                    <div class="field">
                      <label>表达目的（CRO Logic）</label>
                      <textarea :value="m.croLogic" class="prompt-textarea" rows="2" @input="onModuleInput(idx, { croLogic: ($event.target as HTMLTextAreaElement).value })" />
                    </div>
                    <div class="field">
                      <label>画面内容与表达方式</label>
                      <textarea :value="m.sceneDesc" class="prompt-textarea" rows="3" @input="onModuleInput(idx, { sceneDesc: ($event.target as HTMLTextAreaElement).value })" />
                    </div>
                    <div class="field">
                      <label>英文生图提示词（AI Prompt）</label>
                      <textarea :value="m.imagePromptEn" class="prompt-textarea" rows="4" @input="onModuleInput(idx, { imagePromptEn: ($event.target as HTMLTextAreaElement).value })" />
                      <div class="hint">必须包含 Negative Space 留白指令与 --ar 参数（如 --ar 16:9）。</div>
                    </div>
                    <button class="edit-btn" @click="expandedModule = null">收起</button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="analysisError" class="analysis-error">
              <span>{{ analysisError }}</span>
              <button class="ghost-btn" @click="retryAnalysis">重新分析</button>
            </div>
          </template>

          <div v-else-if="analysisError" class="panel">
            <div class="analysis-error">
              <span>{{ analysisError }}</span>
              <button class="btn-generate" @click="retryAnalysis">重新分析</button>
            </div>
          </div>

          <div class="step-footer">
            <div></div>
            <div class="footer-actions">
              <button class="btn-back" @click="step = 1">
                <ArrowLeftOutlined /> 上一步
              </button>
              <button class="btn-next" :disabled="!store.analysisReport" @click="handleStep2Next">
                确认规划并生成图片 <ArrowRightOutlined />
              </button>
            </div>
          </div>
        </section>

        <!-- Step 3: 生成图片 -->
        <section v-else-if="step === 3" class="step3-section">
          <div class="generating-layout">
            <aside class="ai-status-panel">
              <div class="ai-avatar">
                <RobotOutlined class="ai-icon" />
              </div>
              <h4 class="ai-name">Moly AI</h4>
              <p class="ai-status-text">{{ isGenerating ? '正在为你生成 A+ 配图...' : (aplus.activeDraft?.modules?.length ? '生成完成！' : '准备就绪') }}</p>

              <div class="task-list">
                <div class="task-item" :class="taskStatus('analyze')">
                  <span class="task-dot" />
                  <span>分析商品与策略</span>
                </div>
                <div v-for="i in moduleCount" :key="i" class="task-item" :class="taskStatus(`module-${i - 1}`)">
                  <span class="task-dot" />
                  <span>模块 {{ i }} 配图</span>
                </div>
                <div class="task-item" :class="taskStatus('done')">
                  <span class="task-dot" />
                  <span>完成</span>
                </div>
              </div>

              <div class="overall-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: progress + '%' }" />
                </div>
                <span class="progress-label">{{ progress }}%</span>
              </div>
            </aside>

            <div class="gen-content">
              <div class="cost-card cost-card-aplus">
                <div class="cost-row">
                  <span>A+ 生成消耗</span>
                  <span><ThunderboltFilled class="cost-icon" /> {{ aplusCost }} 积分</span>
                </div>
                <div class="cost-row">
                  <span>当前余额</span>
                  <span>{{ auth.points }} 积分</span>
                </div>
              </div>

              <div v-if="isGenerating" class="gen-progress-hint">
                <LoadingOutlined class="spin" />
                <span>{{ progressMessage || '生成中，请稍候...' }}</span>
              </div>

              <div v-if="aplus.activeDraft?.modules?.length" class="gallery-section">
                <div class="gallery-header">
                  <h3 class="section-title">生成结果</h3>
                  <button class="ghost-btn" @click="copyGeneratedCopy">复制整页文案</button>
                </div>
                <div class="gallery-grid">
                  <div v-for="(m, idx) in aplus.activeDraft.modules" :key="m.id" class="gallery-card">
                    <div class="gallery-image-wrap">
                      <div v-if="m.imageUrl" class="gallery-image clickable" @click="openLightbox(idx)">
                        <img :src="m.imageUrl" alt="" />
                      </div>
                      <div v-else class="image-placeholder">生成中…</div>
                      <button v-if="m.imageUrl" class="download-btn ghost-btn icon-btn" title="下载图片" @click.stop="downloadSingleImage(idx)">
                        <DownloadOutlined />
                      </button>
                    </div>
                    <div class="gallery-body">
                      <div class="gallery-headerline">
                        <span class="module-tag">模块 {{ idx + 1 }}｜{{ m.type }}</span>
                      </div>
                      <div v-if="expandedGallery.includes(idx)" class="gallery-text-expanded">
                        <div class="module-headline">{{ m.headline }}</div>
                        <div class="module-body">{{ m.body }}</div>
                        <button class="expand-toggle" @click="toggleGalleryExpand(idx)">收起</button>
                      </div>
                      <div v-else class="gallery-text-preview">
                        <div class="module-headline">{{ m.headline }}</div>
                        <div class="module-body clamp">{{ m.body }}</div>
                        <button class="expand-toggle" @click="toggleGalleryExpand(idx)">展开</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Teleport to="body">
            <div
              ref="lightboxRef"
              v-if="lightboxVisible"
              class="lightbox-overlay"
              role="dialog"
              aria-modal="true"
              :aria-label="`图片预览 ${lightboxIndex + 1} / ${aplus.activeDraft?.modules?.length ?? 0}`"
              tabindex="-1"
              @click.self="closeLightbox"
              @keydown="onLightboxKeydown"
            >
              <button class="lightbox-close" @click="closeLightbox">×</button>
              <button v-if="(aplus.activeDraft?.modules?.length ?? 0) > 1" class="lightbox-nav lightbox-prev" @click="lightboxPrev">
                <LeftOutlined />
              </button>
              <div class="lightbox-content" @click.self="closeLightbox">
                <img v-if="aplus.activeDraft?.modules?.[lightboxIndex]?.imageUrl" :src="aplus.activeDraft.modules[lightboxIndex].imageUrl" alt="" />
              </div>
              <button v-if="(aplus.activeDraft?.modules?.length ?? 0) > 1" class="lightbox-nav lightbox-next" @click="lightboxNext">
                <RightOutlined />
              </button>
            </div>
          </Teleport>

          <div class="step-footer">
            <div></div>
            <div class="footer-actions">
              <button class="btn-back" @click="step = 2">
                <ArrowLeftOutlined /> 上一步
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeftOutlined, RightOutlined, ThunderboltFilled, DownloadOutlined, LeftOutlined, ExperimentOutlined, RobotOutlined, LoadingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import APlusInputForm from '@/views/tools/aplus/components/APlusInputForm.vue'
import StepIndicator from '@/views/tools/listing/components/StepIndicator.vue'
import { useAuthStore } from '@/stores/auth'
import { useListingStore } from '@/stores/listing'
import { aplusService } from '@/services/aplus.service'
import { LISTING_POINTS_COST } from '@/config/listing.config'
import { APLUS_TEMPLATE_OPTIONS, type APlusTemplateId } from '@/config/aplus.config'
import { useAPlusStore } from '@/stores/aplus'
import type { APlusVisualPlanModule, StrategyPrompts } from '@/services/pipeline/types'

type APlusWizardStep = 1 | 2 | 3

const route = useRoute()
const auth = useAuthStore()
const store = useListingStore()
const aplus = useAPlusStore()
const analysisProgress = ref(0)
const analysisProgressMessage = ref('')
const analysisError = ref('')

const step = ref<APlusWizardStep>(1)
const showStep1Validation = ref(false)
const isAnalyzing = ref(false)
const expandedGlobal = ref<'commercialTone' | 'lightingStyle' | 'negativeSpace' | 'negativePrompt' | null>(null)
const expandedModule = ref<number | null>(null)

const globalKeys = [
  { key: 'commercialTone' as const, label: '整体商业调性与艺术语言' },
  { key: 'lightingStyle' as const, label: '全局光影与摄影风格' },
  { key: 'negativeSpace' as const, label: '排版与负空间逻辑' },
  { key: 'negativePrompt' as const, label: '全局负向提示词（英文）' },
]

function truncatePreview(text: string | undefined, maxLen = 120): string {
  if (!text?.trim()) return '（未填写）'
  const t = text.trim()
  if (t.length <= maxLen) return t
  return t.slice(0, maxLen) + '…'
}

const expandedGallery = ref<number[]>([])
function toggleGalleryExpand(idx: number) {
  const i = expandedGallery.value.indexOf(idx)
  if (i >= 0) {
    expandedGallery.value = expandedGallery.value.filter((x) => x !== idx)
  } else {
    expandedGallery.value = [...expandedGallery.value, idx]
  }
}

const completedModuleCount = computed(() =>
  aplus.activeDraft?.modules?.filter((m) => m.imageUrl).length ?? 0
)

type TaskPhase = 'analyze' | `module-${number}` | 'done'
function taskStatus(phase: string): string {
  if (!isGenerating.value && aplus.activeDraft?.modules?.length) return 'completed'
  if (phase === 'analyze') {
    if (completedModuleCount.value > 0) return 'completed'
    return isGenerating.value ? 'active' : 'pending'
  }
  if (phase === 'done') {
    if (!isGenerating.value && completedModuleCount.value >= moduleCount.value) return 'completed'
    return !isGenerating.value && completedModuleCount.value > 0 ? 'active' : 'pending'
  }
  const m = parseInt(phase.replace('module-', ''), 10)
  if (completedModuleCount.value > m) return 'completed'
  if (completedModuleCount.value === m && isGenerating.value) return 'active'
  return 'pending'
}

/** 从 Listing 进入时保存的 Listing 策略（Step 2 会覆盖 store.strategyPrompts） */
const listingStrategyPromptsRef = ref<StrategyPrompts | null>(null)

const isFromListing = computed(
  () => route.query.from === 'listing' || !!store.generatedListing
)
const templateId = ref<APlusTemplateId>('default')
/** 按张计费：模块数 × 单图成本 */
const aplusCost = computed(() => LISTING_POINTS_COST.aPlusImagePerUnit * moduleCount.value)
const moduleCount = ref(5)
const editablePrompt = ref('')

// 下个 to-do 5 会把它接到后端生成参数，这里先做输入收集
const aspectRatio = ref<'1:1' | '4:5' | '16:9' | '3:4'>('4:5')
const qualityTier = ref<'1K' | '2K' | '4K'>('2K')

const isGenerating = ref(false)
const progress = ref(0)
const progressMessage = ref('')

function copyGeneratedCopy() {
  const d = aplus.activeDraft
  if (!d) return
  const text = d.modules.map((m, i) => `【${i + 1}｜${m.type}】\n${m.headline}\n\n${m.body}`).join('\n\n---\n\n')
  navigator.clipboard.writeText(text).then(
    () => message.success('已复制整页文案'),
    () => message.error('复制失败')
  )
}

const lightboxVisible = ref(false)
const lightboxIndex = ref(0)

const lightboxRef = ref<HTMLElement | null>(null)
const lightboxPrevFocus = ref<HTMLElement | null>(null)

function openLightbox(idx: number) {
  lightboxPrevFocus.value = document.activeElement as HTMLElement | null
  lightboxIndex.value = idx
  lightboxVisible.value = true
  nextTick(() => lightboxRef.value?.focus())
}

function closeLightbox() {
  lightboxVisible.value = false
  nextTick(() => lightboxPrevFocus.value?.focus())
}

function onLightboxKeydown(e: KeyboardEvent) {
  if (!lightboxVisible.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') lightboxPrev()
  if (e.key === 'ArrowRight') lightboxNext()
}

function lightboxPrev() {
  const mods = aplus.activeDraft?.modules ?? []
  if (mods.length <= 0) return
  lightboxIndex.value = (lightboxIndex.value - 1 + mods.length) % mods.length
}

function lightboxNext() {
  const mods = aplus.activeDraft?.modules ?? []
  if (mods.length <= 0) return
  lightboxIndex.value = (lightboxIndex.value + 1) % mods.length
}

function downloadSingleImage(idx: number) {
  const mods = aplus.activeDraft?.modules ?? []
  const m = mods[idx]
  const url = m?.imageUrl
  if (!url) {
    message.warning('该模块暂无图片')
    return
  }
  const a = document.createElement('a')
  a.href = url
  a.download = `aplus-module-${idx + 1}.png`
  a.target = '_blank'
  a.click()
  message.success('已开始下载')
}

const canProceedStep1 = computed(() => {
  const p = aplus.wizardInput
  return (
    p.productName.trim().length > 0 &&
    p.rawParams.trim().length > 0 &&
    p.images.length > 0 &&
    // A+ 精简版：其余字段均可选
    true
  )
})

const step1Missing = computed(() => {
  const p = aplus.wizardInput
  const missing: string[] = []
  if (!p.productName.trim()) missing.push('产品名称')
  if (!p.rawParams.trim()) missing.push('原始卖点/参数')
  if (!p.images.length) missing.push('商品图片')
  return missing
})

function handleStep1Next() {
  if (!canProceedStep1.value) {
    showStep1Validation.value = true
    message.warning(`请先补全：${step1Missing.value.join('、')}`)
    return
  }
  showStep1Validation.value = false
  step.value = 2
}

function handleStep2Next() {
  if (!store.analysisReport) return
  aplus.resizeVisualPlanModules(moduleCount.value)
  step.value = 3
  void runGenerate()
}

function buildUserProductForPipeline() {
  const w = aplus.wizardInput
  const raw = w.rawParams.trim()
  const diff = w.differentiation.trim()
  const tone = w.brandTone.trim()
  const persona = w.targetPersona.trim()
  const mergedFeatures = [
    raw ? `原始参数/卖点：${raw}` : '',
    tone ? `品牌调性/视觉偏好：${tone}` : '',
    diff ? `差异化/竞品痛点：${diff}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  return {
    name: w.productName.trim(),
    category: store.productInfo.category || 'other',
    features: mergedFeatures,
    market: w.market || store.productInfo.market || 'us',
    language: w.language || store.productInfo.language || 'en',
    images: w.images,
    // Pipeline 类型要求完整字段；A+ 精简输入阶段允许为空，但我们尽可能回填/适配
    brand: '',
    specs: raw,
    priceRange: '',
    targetAudience: persona,
    useCases: '',
    differentiators: diff,
  }
}

function buildMergedPromptFromVisualPlan(plan: typeof aplus.visualPlan): string {
  if (!plan) return ''
  const g = plan.global
  const parts = [
    g?.commercialTone?.trim() ? `【整体商业调性与艺术语言】\n${g.commercialTone.trim()}` : '',
    g?.lightingStyle?.trim() ? `【全局光影与摄影风格】\n${g.lightingStyle.trim()}` : '',
    g?.negativeSpace?.trim() ? `【排版与负空间逻辑】\n${g.negativeSpace.trim()}` : '',
    g?.negativePrompt?.trim() ? `【全局负向提示词｜EN】\n${g.negativePrompt.trim()}` : '',
    plan.modules?.length
      ? `【模块规划】\n${plan.modules
        .map((m, i) => `${i + 1}. ${m.moduleName}\n- CRO: ${m.croLogic}\n- Scene: ${m.sceneDesc}\n- Prompt(EN): ${m.imagePromptEn}`)
        .join('\n\n')}`
      : '',
  ].filter(Boolean)
  return parts.join('\n\n').trim()
}

function syncFromVisualPlanToPrompt() {
  if (!store.strategyPrompts) return
  const merged = buildMergedPromptFromVisualPlan(aplus.visualPlan)
  store.strategyPrompts.aPlusGuidancePrompt = merged
  store.strategyPrompts.imageGuidancePrompt = merged
  const listingPart = listingStrategyPromptsRef.value?.aPlusGuidancePrompt?.trim()
  editablePrompt.value = listingPart
    ? `【Listing 策略】\n${listingPart}\n\n${merged}`
    : merged
}

function onGlobalInput(key: 'commercialTone' | 'lightingStyle' | 'negativeSpace' | 'negativePrompt', value: string) {
  aplus.patchVisualPlanGlobal({ [key]: value } as any)
  syncFromVisualPlanToPrompt()
}

function onModuleInput(index: number, patch: Partial<APlusVisualPlanModule>) {
  aplus.patchVisualPlanModule(index, patch)
  syncFromVisualPlanToPrompt()
}

function showWizardError(msg: string, options?: { setAnalysisError?: boolean }) {
  const errMsg = msg || '操作失败'
  analysisError.value = options?.setAnalysisError !== false ? errMsg : analysisError.value
  message.error(errMsg)
  console.error('[APlusWizard]', errMsg)
}

function retryAnalysis() {
  analysisError.value = ''
  void runAnalysis()
}

function buildContextFingerprint() {
  return aplus.computeContextFingerprint({
    listing: store.generatedListing,
    productInfo: buildUserProductForPipeline(),
    userListing: store.userListingData,
    analysis: store.analysisReport?.aPlusAnalysis,
    strategy: store.strategyPrompts?.aPlusGuidancePrompt,
    mainImageUrl: store.mainImageUrl,
  })
}

async function runAnalysis() {
  if (!canProceedStep1.value) {
    showStep1Validation.value = true
    message.warning(`请先补全：${step1Missing.value.join('、')}`)
    return
  }
  if (isAnalyzing.value) return

  isAnalyzing.value = true
  analysisError.value = ''
  analysisProgress.value = 0
  analysisProgressMessage.value = '正在准备…'
  try {
    const result = await aplusService.runAPlusAnalysis(
      buildUserProductForPipeline(),
      {
        market: aplus.wizardInput.market || store.productInfo.market,
        language: aplus.wizardInput.language || store.productInfo.language,
        moduleCount: moduleCount.value,
        templateId: templateId.value,
      },
      (info) => {
        analysisProgress.value = info.progress ?? 0
        analysisProgressMessage.value = info.message || '分析中…'
      }
    )

    store.analysisReport = result.analysisReport
    store.strategyPrompts = result.strategyPrompts
    store.pipelineExtractedData = []
    aplus.setPromptBlocks(result.promptBlocks)
    aplus.setVisualPlan(result.visualPlan)
    analysisInputFingerprint.value = currentAnalysisFingerprint.value

    syncFromVisualPlanToPrompt()
    const merged = editablePrompt.value || aplusService.buildDefaultPrompt(
      store.strategyPrompts,
      store.analysisReport,
      result.promptBlocks
    )
    if (isFromListing.value && listingStrategyPromptsRef.value?.aPlusGuidancePrompt?.trim()) {
      editablePrompt.value = `【Listing 策略】\n${listingStrategyPromptsRef.value.aPlusGuidancePrompt.trim()}\n\n${merged}`
    } else {
      editablePrompt.value = merged
    }
    message.success('分析完成')
  } catch (err) {
    showWizardError(err instanceof Error ? err.message : '分析失败', { setAnalysisError: true })
  } finally {
    isAnalyzing.value = false
  }
}

/** 不再自动分析：用户需先选完模板、生图数量，再点击「开始分析」 */

/** 第二步输入参数（模板、生图数量、Step1 商品信息）改变时，清空分析结果，需重新生成提示词 */
const currentAnalysisFingerprint = computed(() => {
  const w = aplus.wizardInput
  return JSON.stringify({
    templateId: templateId.value,
    moduleCount: moduleCount.value,
    productName: w.productName.trim(),
    rawParams: w.rawParams.trim().slice(0, 500),
    imagesCount: w.images.length,
    market: w.market || store.productInfo.market,
    language: w.language || store.productInfo.language,
  })
})

const analysisInputFingerprint = ref('')

watch(
  () => [step.value, currentAnalysisFingerprint.value] as const,
  ([newStep, fp]) => {
    if (newStep !== 2) return
    if (!(store.analysisReport || store.strategyPrompts || aplus.visualPlan)) return
    if (analysisInputFingerprint.value && fp !== analysisInputFingerprint.value) {
      store.analysisReport = null
      store.strategyPrompts = null
      store.pipelineExtractedData = []
      aplus.setVisualPlan(null)
      aplus.setPromptBlocks(null)
      analysisError.value = ''
      editablePrompt.value = ''
      analysisInputFingerprint.value = ''
    }
  }
)

async function runGenerate() {
  // 只在进入 Step 5 时执行一次
  if (isGenerating.value) return
  if (step.value !== 3) return
  if (!store.strategyPrompts || !store.analysisReport) {
    message.warning('缺少策略/分析数据，请先完成分析')
    return
  }
  const cost = aplusCost.value
  if (auth.points < cost) {
    message.warning(`积分不足：需要 ${cost} 积分（${moduleCount.value} 张 × ${LISTING_POINTS_COST.aPlusImagePerUnit}/张）`)
    return
  }
  if (!aplus.wizardInput.images.length) {
    message.warning('请先上传至少 1 张商品实拍图')
    return
  }

  isGenerating.value = true
  progress.value = 0
  progressMessage.value = '正在生成…'

  try {
    const contextFingerprint = buildContextFingerprint()
    const defaultPrompt = editablePrompt.value || aplusService.buildDefaultPrompt(
      store.strategyPrompts,
      store.analysisReport,
      aplus.promptBlocks
    )

    // 创建草稿：后续跳转到 A+ 编辑页时可以直接复用
    aplus.createDraft({
      name: 'A+ 草稿',
      contextFingerprint,
      language: aplus.wizardInput.language || store.productInfo.language,
      market: aplus.wizardInput.market || store.productInfo.market,
      defaultPrompt,
    })

    // 让编辑页重绘也沿用当前选择
    aplus.patchSettings({
      templateId: templateId.value,
      moduleCount: moduleCount.value,
      generateImages: true,
      enableSelfCheck: true,
      aspectRatio: aspectRatio.value,
      imageSize: qualityTier.value,
    })
    const res = await aplusService.generateAPlus(
      {
        userEditablePrompt: defaultPrompt,
        strategyPrompts: store.strategyPrompts,
        analysisReport: store.analysisReport,
        generatedListing: store.generatedListing ?? undefined,
        productInfo: buildUserProductForPipeline(),
        userListingData: store.userListingData,
        mainImageUrl: store.mainImageUrl,
        generatedImages: store.generatedImages ?? [],
        settings: {
          language: aplus.wizardInput.language || store.productInfo.language,
          market: aplus.wizardInput.market || store.productInfo.market,
          templateId: templateId.value,
          moduleCount: moduleCount.value,
          generateImages: true,
          enableSelfCheck: true,
          aspectRatio: aspectRatio.value,
          imageSize: qualityTier.value,
        },
        onContentReady: (modules) => aplus.attachGenerationResult(modules),
        onModuleImageReady: (index, module) => {
          if (module.imageUrl) aplus.patchModuleImageByIndex(index, module.imageUrl)
        },
      },
      (p, msg) => {
        progress.value = p
        progressMessage.value = msg
      }
    )

    auth.deductPoints(cost, `A+ 配图生成（${moduleCount.value} 张）`)
    aplus.attachGenerationResult(res.modules)
    message.success('A+ 配图生成完成')
    // 结果直接在 Step 3 展示，无需跳转工作台
  } catch (err) {
    showWizardError(err instanceof Error ? err.message : 'A+ 生成失败', { setAnalysisError: false })
  } finally {
    isGenerating.value = false
  }
}

onMounted(() => {
  // 入口常见来自「Listing 结果页 → 增值服务 → A+」
  const isFromListing = route.query.from === 'listing'
  if (store.generatedListing) {
    if (isFromListing) {
      // from=listing 时先清空上次输入，避免旧数据混入
      aplus.resetWizardInput({
        market: store.productInfo.market,
        language: store.productInfo.language,
      })
    }
    // 保存 Listing 策略供 Step 3 合并（Step 2 会覆盖 store.strategyPrompts）
    if (store.strategyPrompts) {
      listingStrategyPromptsRef.value = { ...store.strategyPrompts }
    }
    // 回填 Listing 数据
    const diff = store.analysisReport?.differentiationAnalysis
    aplus.prefillWizardInput({
      source: 'listing',
      listingTitle: store.generatedListing.title,
      listingBullets: store.generatedListing.bulletPoints,
      listingDescription: store.generatedListing.description,
      listingSearchTerms: store.generatedListing.searchTerms,
      inferredTargetPersona: store.generatedListing.targetAudience,
      listingStoreProductName: store.productInfo.name,
      listingStoreSpecs: store.productInfo.specs,
      listingStoreFeatures: store.productInfo.features,
      listingStoreDifferentiators: store.productInfo.differentiators,
      listingStoreTargetAudience: store.productInfo.targetAudience,
      listingStoreUseCases: store.productInfo.useCases,
      listingStoreKeywords: store.analysisReport?.keywords?.coreKeywords,
      market: store.productInfo.market,
      language: store.productInfo.language,
      images: store.productInfo.images,
      mainImageUrl: store.mainImageUrl ?? undefined,
      competitorWeaknesses: diff?.competitorWeaknesses,
      differentiationSuggestions: diff?.differentiationSuggestions,
    })
  }

  // 非 listing 入口且已有 A+ 分析结果时，可从 Step 2 继续编辑
  if (!store.generatedListing && store.analysisReport && store.strategyPrompts) {
    editablePrompt.value = aplusService.buildDefaultPrompt(
      store.strategyPrompts,
      store.analysisReport,
      aplus.promptBlocks
    )
    step.value = 2
  }
})
</script>

<style scoped lang="scss">
.aplus-wizard {
  min-height: 100vh;
  background: var(--color-bg);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
}

.tool-header {
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  padding: 12px 0;
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.crumb-icon {
  font-size: 10px;
}

.breadcrumb a {
  color: var(--color-primary);
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.points {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.recharge-link {
  font-size: 13px;
  color: var(--color-primary);
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

.wizard-main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  background: var(--color-bg);
}

.cost-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  .cost-icon { color: var(--color-warning-icon); margin-right: 2px; }
  strong { color: var(--color-text-primary); }
}

.cost-hint-aplus {
  padding: 10px 14px;
  background: rgba(16, 185, 129, 0.08);
  border-radius: var(--radius-md);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.section {
  margin-top: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 10px;
}

.section-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 16px;
  line-height: 1.5;
}

.config-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  background: var(--color-bg);
  margin-bottom: 20px;
}

.config-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-light);
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.analyze-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 24px;
  margin-bottom: 20px;
  .section-desc { margin: 0; text-align: center; }
}

.btn-generate {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 32px;
  background: var(--color-success-cta);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
  transition: all 0.2s ease;
  &:hover:not(:disabled) {
    background: var(--color-success);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
}

.summary-section {
  margin-top: 24px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-subtitle {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.summary-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.summary-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  overflow: hidden;
}

.summary-preview {
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: var(--color-border-light); }
}

.summary-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 8px;
}

.summary-text {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0 0 8px;
  white-space: pre-wrap;
  word-break: break-word;
  &.summary-prompt {
    font-size: 12px;
    color: var(--color-text-tertiary);
  }
}

.edit-btn {
  font-size: 12px;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  margin-top: 4px;
  &:hover { text-decoration: underline; }
}

.summary-expanded {
  padding: 16px;
  border-top: 1px solid var(--color-border-light);
  .edit-btn { margin-top: 12px; }
}

.module-expanded .field {
  margin-bottom: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.ghost-btn.small {
  padding: 6px 10px;
  font-size: 12px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 920px) {
  .grid-2 { grid-template-columns: 1fr; }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field > label {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.text-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  font-size: 13px;
  background: var(--color-bg);
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
}

.prompt-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  background: var(--color-bg);
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
}

.hint {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 4px;
}

.analysis-error {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 10px 12px;
  background: #fef2f2;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-error);
}

.actions-row {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.step-footer {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.btn-back,
.btn-next {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-back {
  background: var(--color-bg);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  &:hover {
    background: var(--color-border-light);
    color: var(--color-text-primary);
  }
}

.btn-next {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: var(--color-border-light);
    color: var(--color-text-primary);
  }
}

.panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  background: var(--color-bg);
  margin-top: 12px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--color-text-primary);
}

/* Step 3: generating layout */
.generating-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 32px;
  align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.ai-status-panel {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  position: sticky;
  top: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.ai-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), #3B82F6);
  display: flex;
  align-items: center;
  justify-content: center;
  .ai-icon { font-size: 26px; color: #fff; }
}

.ai-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.ai-status-text {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
  text-align: center;
}

.task-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--color-text-tertiary);
  .task-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-border);
    flex-shrink: 0;
    transition: all 0.3s;
  }
  &.completed { color: var(--color-success); .task-dot { background: var(--color-success); } }
  &.active {
    color: var(--color-primary);
    font-weight: 600;
    .task-dot {
      background: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
    }
  }
}

.overall-progress {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  .progress-bar {
    flex: 1;
    height: 6px;
    background: var(--color-border);
    border-radius: 3px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 3px;
    transition: width 0.3s;
  }
  .progress-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-primary);
    min-width: 36px;
    text-align: right;
  }
}

.gen-content {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cost-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cost-card-aplus {
  background: rgba(16, 185, 129, 0.06);
  border-color: rgba(16, 185, 129, 0.2);
}

.cost-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--color-text-secondary);
  .cost-icon { color: var(--color-warning-icon); margin-right: 4px; }
}

.gen-progress-hint {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  background: var(--color-primary-light);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-primary);
}

.analysis-summary .summary-title,
.listing-preview .summary-title {
  font-size: 13px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 920px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.summary-item {
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 12px;
}

.summary-item .k {
  font-size: 12px;
  font-weight: 800;
  color: #6b7280;
  margin-bottom: 6px;
}

.summary-item .v {
  font-size: 13px;
  color: #111827;
  line-height: 1.5;
}

.listing-title {
  font-size: 14px;
  font-weight: 900;
  margin-bottom: 8px;
}

.bullet-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #374151;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.muted {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.progress-bar {
  height: 8px;
  background: var(--color-border);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.25s ease;
}

.progress-msg {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.gallery-section {
  margin-top: 20px;
}

.gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.gallery-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-bg);
  transition: all 0.2s ease;
  &:hover { border-color: var(--color-primary); box-shadow: 0 6px 24px rgba(37, 99, 235, 0.1); }
}

.gallery-image-wrap {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--color-bg-subtle);
  .download-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    opacity: 0.9;
  }
}

.gallery-image {
  width: 100%;
  height: 100%;
  overflow: hidden;
  &.clickable {
    cursor: pointer;
    &:hover { opacity: 0.95; }
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-subtle);
  border: 1px dashed var(--color-border);
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.gallery-body {
  padding: 14px 16px;
}

.gallery-headerline {
  margin-bottom: 8px;
}

.module-tag {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border-radius: 999px;
  padding: 2px 8px;
}

.module-headline {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  word-break: break-word;
}

.module-body {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  word-break: break-word;
  &.clamp {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.expand-toggle {
  font-size: 12px;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  margin-top: 8px;
  &:hover { text-decoration: underline; }
}

.icon-btn {
  padding: 6px 10px;
  font-size: 14px;
}

.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-close {
  position: absolute;
  top: 16px;
  right: 24px;
  width: 40px;
  height: 40px;
  font-size: 28px;
  line-height: 1;
  color: #fff;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.8;
  &:hover { opacity: 1; }
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.3); }
}

.lightbox-prev { left: 24px; }
.lightbox-next { right: 24px; }

.lightbox-content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
  }
}
</style>

