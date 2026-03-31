<template>
  <div class="tool-page omni-model-view">
    <header class="tool-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <span>全能模特</span>
        </div>
        <div class="header-right">
          <span class="points"><ThunderboltFilled /> {{ auth.points }} 积分</span>
          <router-link to="/recharge" class="recharge-link">充值</router-link>
          <span class="model-badge">{{ FLASH_IMAGE_MODEL }}</span>
        </div>
      </div>
    </header>

    <main class="tool-main">
      <aside class="upload-panel">
        <section class="mode-section">
          <div class="section-label">功能模式</div>
          <div class="mode-grid">
            <button
              v-for="mode in modes"
              :key="mode.key"
              class="mode-btn"
              :class="{ active: activeMode === mode.key }"
              @click="setMode(mode.key)"
            >
              <strong>{{ mode.label }}</strong>
              <span>{{ mode.shortDesc }}</span>
            </button>
          </div>
        </section>

        <section class="upload-section">
          <div class="section-label">原图（必传）</div>
          <div
            class="upload-area large"
            :class="{ hasImage: inputs.base }"
            @click="!inputs.base && baseRef?.click()"
            @dragover.prevent
            @drop.prevent="(e) => onDrop(e, 'base')"
          >
            <img v-if="inputs.base" :src="inputs.base" class="preview-img" />
            <div v-if="inputs.base" class="image-overlay">
              <button class="overlay-btn" @click.stop="clearImage('base')">删除</button>
              <button class="overlay-btn" @click.stop="baseRef?.click()">更换</button>
            </div>
            <div v-else class="upload-placeholder">
              <PlusOutlined class="upload-icon" />
              <span>点击或拖拽上传原图</span>
            </div>
          </div>
          <input
            ref="baseRef"
            type="file"
            class="hidden-input"
            accept="image/*"
            @change="(e) => onFileChange(e, 'base')"
          />
          <div class="example-row">
            <span class="example-label">示例：</span>
            <button type="button" class="demo-btn" @click="baseRef?.click()">本地上传</button>
            <button
              v-for="(url, index) in baseExamples"
              :key="`base-${index}`"
              class="example-thumb"
              @click="inputs.base = url"
            >
              <img :src="url" alt="原图示例" />
            </button>
          </div>
        </section>

        <section class="upload-section">
          <div class="section-label">{{ currentMode.referenceLabel }}（{{ currentMode.required ? '必传' : '可选' }}）</div>
          <div
            class="upload-area large"
            :class="{ hasImage: modeReferenceImage }"
            @click="!modeReferenceImage && modeRefRef?.click()"
            @dragover.prevent
            @drop.prevent="(e) => onDrop(e, 'modeRef')"
          >
            <img v-if="modeReferenceImage" :src="modeReferenceImage" class="preview-img" />
            <div v-if="modeReferenceImage" class="image-overlay">
              <button class="overlay-btn" @click.stop="clearImage('modeRef')">删除</button>
              <button class="overlay-btn" @click.stop="modeRefRef?.click()">更换</button>
            </div>
            <div v-else class="upload-placeholder">
              <PlusOutlined class="upload-icon" />
              <span>{{ currentMode.referenceHint }}</span>
            </div>
          </div>
          <input
            ref="modeRefRef"
            type="file"
            class="hidden-input"
            accept="image/*"
            @change="(e) => onFileChange(e, 'modeRef')"
          />
          <div class="example-row">
            <span class="example-label">示例：</span>
            <button type="button" class="demo-btn" @click="modeRefRef?.click()">本地上传</button>
            <button
              v-for="(url, index) in modeExamples"
              :key="`${activeMode}-${index}`"
              class="example-thumb"
              @click="setModeReferenceImage(url)"
            >
              <img :src="url" alt="参考图示例" />
            </button>
          </div>
        </section>

        <section class="upload-section">
          <div class="section-label">额外参考图（可选）</div>
          <div
            class="upload-area large"
            :class="{ hasImage: inputs.extraRef }"
            @click="!inputs.extraRef && extraRefRef?.click()"
            @dragover.prevent
            @drop.prevent="(e) => onDrop(e, 'extraRef')"
          >
            <img v-if="inputs.extraRef" :src="inputs.extraRef" class="preview-img" />
            <div v-if="inputs.extraRef" class="image-overlay">
              <button class="overlay-btn" @click.stop="clearImage('extraRef')">删除</button>
              <button class="overlay-btn" @click.stop="extraRefRef?.click()">更换</button>
            </div>
            <div v-else class="upload-placeholder">
              <PlusOutlined class="upload-icon" />
              <span>可上传风格、质感或构图参考图</span>
            </div>
          </div>
          <input
            ref="extraRefRef"
            type="file"
            class="hidden-input"
            accept="image/*"
            @change="(e) => onFileChange(e, 'extraRef')"
          />
        </section>
      </aside>

      <div class="right-panel">
        <div class="tab-content">
          <label class="field-label">输出比例</label>
          <select v-model="aspectRatio" class="field-select">
            <option value="1:1">1:1 正方形</option>
            <option value="3:4">3:4 竖版</option>
            <option value="4:3">4:3 横版</option>
            <option value="16:9">16:9 横版</option>
            <option value="9:16">9:16 竖版</option>
          </select>

          <label class="field-label mt">图片质量</label>
          <select v-model="imageSize" class="field-select">
            <option value="1K">1K 标准（更快）</option>
            <option value="2K">2K 高清（较慢）</option>
            <option value="4K">4K 超清（最慢）</option>
          </select>

          <template v-if="activeMode === 'background'">
            <label class="field-label mt">背景描述</label>
            <textarea
              v-model="backgroundDesc"
              class="field-textarea"
              rows="2"
              placeholder="如：现代客厅、自然光、浅灰墙面"
            />
          </template>

          <label class="field-label mt">补充要求（可选）</label>
          <textarea
            v-model="extraInstruction"
            class="field-textarea"
            rows="3"
            placeholder="如：保持高端时尚质感，人物肤色自然，服装纹理清晰"
          />
        </div>

        <div class="mode-note">
          <strong>{{ currentMode.label }}</strong>
          <p>{{ currentMode.longDesc }}</p>
        </div>

        <div class="preview-area">
          <div v-if="!resultImage && !isGenerating" class="preview-empty">上传原图和参考图后点击生成</div>
          <div v-else-if="isGenerating" class="preview-loading">
            <LoadingOutlined class="spin" />
            <div class="progress-title">{{ progressLabel }}</div>
            <div class="progress-meta">
              已耗时 {{ elapsedText }} · 预计 {{ estimatedDurationText }}
            </div>
            <div class="progress-track" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
            </div>
          </div>
          <img v-else-if="resultImage" :src="resultImage" alt="结果" class="preview-result" />
        </div>

        <div class="cost-row">
          <span>预估消耗 <ThunderboltFilled class="icon" /> {{ GENERATION_COST }} 积分</span>
          <span class="cost-model">{{ FLASH_IMAGE_MODEL }}</span>
        </div>

        <button class="generate-btn" :class="{ disabled: !canGenerate || isGenerating }" :disabled="!canGenerate || isGenerating" @click="generate">
          <ExperimentOutlined v-if="!isGenerating" />
          <LoadingOutlined v-else class="spin" />
          {{ isGenerating ? '生成中...' : `开始${currentMode.label}` }}
        </button>

        <button v-if="resultImage && !isGenerating" class="download-btn" @click="downloadResult">
          下载结果图
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  RightOutlined,
  ThunderboltFilled,
  PlusOutlined,
  ExperimentOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import { geminiService } from '@/services/gemini.service'

type ModeKey = 'outfit' | 'model' | 'background' | 'pose'
type UploadField = 'base' | 'modeRef' | 'extraRef'

const FLASH_IMAGE_MODEL = 'gemini-3.1-flash-image-preview'
const GENERATION_COST = 3
const REQUEST_TIMEOUT_BY_SIZE: Record<'1K' | '2K' | '4K', number> = {
  '1K': 180000,
  '2K': 300000,
  '4K': 480000,
}

const modes: Array<{
  key: ModeKey
  label: string
  shortDesc: string
  longDesc: string
  required: boolean
  referenceLabel: string
  referenceHint: string
}> = [
  {
    key: 'outfit',
    label: '换装',
    shortDesc: '替换服装',
    longDesc: '保持人物身份与场景，将原图人物替换为参考服装效果。',
    required: true,
    referenceLabel: '服装参考图',
    referenceHint: '上传服装平铺图或服装参考图',
  },
  {
    key: 'model',
    label: '换模特',
    shortDesc: '替换人物风格',
    longDesc: '保持服装与场景不变，将人物风格替换为参考模特风格。',
    required: true,
    referenceLabel: '模特参考图',
    referenceHint: '上传目标模特参考图',
  },
  {
    key: 'background',
    label: '换背景',
    shortDesc: '替换场景',
    longDesc: '保持人物和服装不变，将背景替换成参考场景或文本描述场景。',
    required: false,
    referenceLabel: '背景参考图',
    referenceHint: '上传背景图（也可只填写背景描述）',
  },
  {
    key: 'pose',
    label: '换姿势',
    shortDesc: '替换动作姿态',
    longDesc: '保持人物身份和服装特征，按参考图中的姿势进行动作重构。',
    required: true,
    referenceLabel: '姿势参考图',
    referenceHint: '上传目标姿势参考图',
  },
]

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const parseMode = (value: unknown): ModeKey => {
  if (value === 'outfit' || value === 'model' || value === 'background' || value === 'pose') return value
  return 'outfit'
}

const activeMode = ref<ModeKey>(parseMode(route.query.mode))
const currentMode = computed(() => modes.find((item) => item.key === activeMode.value) || modes[0])

watch(
  () => route.query.mode,
  (mode) => {
    activeMode.value = parseMode(mode)
  }
)

function setMode(mode: ModeKey) {
  activeMode.value = mode
  router.replace({ path: '/tools/omni-model', query: { mode } })
}

const inputs = reactive({
  base: null as string | null,
  outfitRef: null as string | null,
  modelRef: null as string | null,
  backgroundRef: null as string | null,
  poseRef: null as string | null,
  extraRef: null as string | null,
})

const baseRef = ref<HTMLInputElement | null>(null)
const modeRefRef = ref<HTMLInputElement | null>(null)
const extraRefRef = ref<HTMLInputElement | null>(null)

const resultImage = ref<string | null>(null)
const isGenerating = ref(false)
const aspectRatio = ref<'1:1' | '3:4' | '4:3' | '16:9' | '9:16'>('3:4')
const imageSize = ref<'1K' | '2K' | '4K'>('1K')
const backgroundDesc = ref('现代简洁场景，自然光，适合电商主图')
const extraInstruction = ref('')
const progressPercent = ref(0)
const progressLabel = ref('准备中...')
const elapsedSeconds = ref(0)
let progressTimer: ReturnType<typeof setInterval> | null = null

const femaleModels = Array.from({ length: 7 }, (_, i) => `/omni-model-assets/female_models/female_model_${i + 1}.jpg`)
const maleModels = Array.from({ length: 8 }, (_, i) => `/omni-model-assets/male_models/male_model_${i + 1}.jpg`)
const femaleOutfits = Array.from({ length: 3 }, (_, i) => `/omni-model-assets/female_outfits/female_outfit_${i + 1}.png`)
const maleOutfits = Array.from({ length: 3 }, (_, i) => `/omni-model-assets/male_outfits/male_outfit_${i + 1}.png`)
const backgroundRefs = Array.from({ length: 3 }, (_, i) => `/omni-model-assets/background_refs/background_${i + 1}.jpg`)

const baseExamples = computed(() => [...femaleModels.slice(0, 3), ...maleModels.slice(0, 3)])
const modeReferenceImage = computed(() => {
  if (activeMode.value === 'outfit') return inputs.outfitRef
  if (activeMode.value === 'model') return inputs.modelRef
  if (activeMode.value === 'background') return inputs.backgroundRef
  return inputs.poseRef
})

const modeExamples = computed(() => {
  if (activeMode.value === 'outfit') return [...femaleOutfits, ...maleOutfits]
  if (activeMode.value === 'model') return [...femaleModels.slice(0, 4), ...maleModels.slice(0, 4)]
  if (activeMode.value === 'background') return backgroundRefs
  return [...femaleModels.slice(3, 7), ...maleModels.slice(3, 8)]
})

function setModeReferenceImage(url: string | null) {
  if (activeMode.value === 'outfit') inputs.outfitRef = url
  else if (activeMode.value === 'model') inputs.modelRef = url
  else if (activeMode.value === 'background') inputs.backgroundRef = url
  else inputs.poseRef = url
}

function getModeReferenceImage() {
  if (activeMode.value === 'outfit') return inputs.outfitRef
  if (activeMode.value === 'model') return inputs.modelRef
  if (activeMode.value === 'background') return inputs.backgroundRef
  return inputs.poseRef
}

function clearImage(field: UploadField) {
  if (field === 'base') inputs.base = null
  if (field === 'modeRef') setModeReferenceImage(null)
  if (field === 'extraRef') inputs.extraRef = null
  resultImage.value = null
}

function onFileChange(event: Event, field: UploadField) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  const imageUrl = URL.createObjectURL(file)
  applyImage(field, imageUrl)
  target.value = ''
}

function onDrop(event: DragEvent, field: UploadField) {
  const file = event.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  const imageUrl = URL.createObjectURL(file)
  applyImage(field, imageUrl)
}

function applyImage(field: UploadField, imageUrl: string) {
  if (field === 'base') inputs.base = imageUrl
  if (field === 'modeRef') setModeReferenceImage(imageUrl)
  if (field === 'extraRef') inputs.extraRef = imageUrl
  resultImage.value = null
}

const canGenerate = computed(() => {
  if (!inputs.base) return false
  const modeRef = getModeReferenceImage()
  if (currentMode.value.required && !modeRef) return false
  if (activeMode.value === 'background') {
    if (!modeRef && !backgroundDesc.value.trim()) return false
  }
  return true
})

const aspectRatioLabels: Record<string, string> = {
  '1:1': '1:1 正方形',
  '3:4': '3:4 竖版',
  '4:3': '4:3 横版',
  '16:9': '16:9 横版',
  '9:16': '9:16 竖版',
}

const imageSizeLabels: Record<string, string> = {
  '1K': '1K 标准',
  '2K': '2K 高清',
  '4K': '4K 超清',
}

const currentRequestTimeoutMs = computed(() => REQUEST_TIMEOUT_BY_SIZE[imageSize.value] || 180000)
const timeoutMinutesText = computed(() => `${Math.ceil(currentRequestTimeoutMs.value / 60000)}`)

const estimatedDurationText = computed(() => {
  if (imageSize.value === '1K') return '约 40-180 秒（超时自动结束）'
  if (imageSize.value === '2K') return '约 60-300 秒（超时自动结束）'
  return '约 120-480 秒（超时自动结束）'
})

const elapsedText = computed(() => {
  const secs = elapsedSeconds.value
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

function startProgress() {
  stopProgress(false)
  const startedAt = Date.now()
  const totalSeconds = Math.max(60, Math.floor(currentRequestTimeoutMs.value / 1000))
  const phase2End = 25
  const generationPhaseEnd = Math.max(90, Math.floor(totalSeconds * 0.72))
  progressPercent.value = 6
  progressLabel.value = '正在上传图片与参数...'
  elapsedSeconds.value = 0

  progressTimer = setInterval(() => {
    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
    elapsedSeconds.value = elapsed

    if (elapsed < 8) {
      progressLabel.value = '正在上传图片与参数...'
      progressPercent.value = Math.min(22, 6 + elapsed * 2)
      return
    }
    if (elapsed < phase2End) {
      progressLabel.value = '正在解析图片与描述...'
      progressPercent.value = Math.min(56, 22 + (elapsed - 8) * 2)
      return
    }
    if (elapsed < generationPhaseEnd) {
      progressLabel.value = '模型正在生成中...'
      const phaseRange = Math.max(1, generationPhaseEnd - phase2End)
      const passed = elapsed - phase2End
      progressPercent.value = Math.min(90, 56 + Math.floor((passed / phaseRange) * 34))
      return
    }

    progressLabel.value = `处理较慢，最多等待 ${timeoutMinutesText.value} 分钟...`
    const tailRange = Math.max(1, totalSeconds - generationPhaseEnd)
    const tailPassed = Math.max(0, elapsed - generationPhaseEnd)
    progressPercent.value = Math.min(97, 90 + Math.floor((tailPassed / tailRange) * 7))
  }, 1000)
}

function stopProgress(success: boolean) {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
  if (success) {
    progressPercent.value = 100
    progressLabel.value = '已完成'
  }
}

onUnmounted(() => {
  stopProgress(false)
})

function buildPrompt(mode: ModeKey): string {
  const extra = extraInstruction.value.trim()
  const baseRule = [
    '你是资深电商视觉设计师，请严格遵循参考图完成图像编辑。',
    '输出真实摄影质感，避免插画风。',
    '保持服装材质、纹理和光影自然。',
    `输出比例：${aspectRatioLabels[aspectRatio.value] || aspectRatio.value}`,
    `图片质量：${imageSizeLabels[imageSize.value] || imageSize.value}`,
    '速度要求：优先稳定和速度，尽量在 3 分钟内完成，避免无关重绘。',
    '若用户补充要求与硬性约束冲突，必须优先满足硬性约束。',
  ]

  if (mode === 'outfit') {
    return [
      ...baseRule,
      '图1是原始人物图，图2是服装参考图。',
      '任务：仅替换图1人物服装为图2服装。',
      '硬性约束：必须保持图1人物脸部身份、发型、肤色、身材比例完全不变。',
      '硬性约束：必须保持图1人物姿势完全不变，包括头部朝向、肩部角度、手部位置、躯干倾斜与腿部站姿。',
      '硬性约束：必须保持图1背景、构图、镜头距离与透视关系不变。',
      '硬性约束：只允许修改服装区域，禁止更换人物、禁止改变姿势、禁止重构构图。',
      '服装要求：图案、材质、领口、门襟、袖长、版型尽量贴近图2。',
      extra ? `用户补充要求：${extra}` : '用户补充要求：用于电商展示，细节清晰自然。',
    ].join('\n')
  }

  if (mode === 'model') {
    return [
      ...baseRule,
      '图1是原始图片，图2是目标模特参考图。',
      '任务：仅替换图1中的模特身份与人物风格，参考图2。',
      '硬性约束：图1人物姿势必须保持不变，包括头部朝向、肩部角度、手部位置、躯干姿态和腿部站姿。',
      '硬性约束：图1背景、构图、镜头距离和透视关系必须保持不变。',
      '硬性约束：图1服装款式、颜色、材质和细节必须保持不变。',
      '允许变化：人物脸部身份、发型细节与人物风格可参考图2变化。',
      extra ? `用户补充要求：${extra}` : '用户补充要求：输出自然商业摄影风格，避免面部变形。',
    ].join('\n')
  }

  if (mode === 'background') {
    return [
      ...baseRule,
      '图1是原始图片，图2（如果提供）是背景参考图。',
      '任务：仅替换背景场景。',
      '硬性约束：图1人物脸部身份、发型、肤色、身材比例必须保持不变。',
      '硬性约束：图1人物姿势与肢体角度必须保持不变。',
      '硬性约束：图1服装款式、颜色、材质与细节必须保持不变。',
      `背景描述：${backgroundDesc.value.trim() || '高端简洁电商场景，自然光'}`,
      extra ? `用户补充要求：${extra}` : '用户补充要求：边缘融合自然，不要出现抠图痕迹。',
    ].join('\n')
  }

  return [
    ...baseRule,
    '图1是原始人物图，图2是姿势参考图。',
    '任务：仅替换图1人物姿势，参考图2动作。',
    '硬性约束：图1人物脸部身份、发型、肤色、身材比例必须保持不变。',
    '硬性约束：图1背景、构图、镜头距离和透视关系必须保持不变。',
    '硬性约束：图1服装款式、颜色、材质与细节必须保持不变。',
    '硬性约束：严格匹配图2的左右方向，不得镜像翻转。以画面左右位置为准，图2中位于画面左侧的手/脚，在输出图中也必须位于画面左侧。',
    '硬性约束：手臂与手部动作必须与图2一致（例如左手插兜/右手下垂等），若左右手方向不一致则视为失败结果。',
    '允许变化：仅允许人体姿势、肢体角度、重心和手部动作发生变化。',
    extra ? `用户补充要求：${extra}` : '用户补充要求：动作自然，避免肢体扭曲。',
  ].join('\n')
}

function buildReferenceImages(mode: ModeKey): string[] {
  const refs: string[] = []
  if (inputs.base) refs.push(inputs.base)

  const modeRef = getModeReferenceImage()
  if (modeRef) refs.push(modeRef)
  if (inputs.extraRef) refs.push(inputs.extraRef)
  return refs
}

function downloadResult() {
  if (!resultImage.value) {
    message.warning('暂无可下载图片')
    return
  }
  const isPng = resultImage.value.startsWith('data:image/png')
  const ext = isPng ? 'png' : 'jpg'
  const link = document.createElement('a')
  link.href = resultImage.value
  link.download = `omni-model-${activeMode.value}-${Date.now()}.${ext}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function generate() {
  if (!canGenerate.value) {
    message.warning('请先上传必需图片')
    return
  }

  if (auth.points < GENERATION_COST) {
    message.warning(`积分不足，当前剩余 ${auth.points} 积分`)
    return
  }

  const taskId = `omni-model-${Date.now()}`
  const deducted = auth.deductPoints(GENERATION_COST, `全能模特-${currentMode.value.label}`, taskId)
  if (!deducted) return

  isGenerating.value = true
  resultImage.value = null
  startProgress()
  let shouldRefund = true

  try {
    const prompt = buildPrompt(activeMode.value)
    const refs = buildReferenceImages(activeMode.value)
    const result = await geminiService.generateImage(prompt, refs, {
      model: FLASH_IMAGE_MODEL,
      aspectRatio: aspectRatio.value,
      imageSize: imageSize.value,
      requestTimeoutMs: currentRequestTimeoutMs.value,
    })

    if (result.startsWith('data:image')) {
      resultImage.value = result
      stopProgress(true)
      shouldRefund = false
      message.success(`${currentMode.value.label}生成成功`)
    } else {
      console.warn('[OmniModelView] model returned text instead of image:', result)
      const hint = result?.slice(0, 80) || '未知原因'
      message.error(`模型未返回图片：${hint}… 请换一张参考图或稍后重试`, 6)
    }
  } catch (error) {
    console.error('[OmniModelView] generate failed:', error)
    const errMsg = error instanceof Error ? error.message : ''
    if (errMsg.includes('超时')) {
      message.error(`生成超过 ${timeoutMinutesText.value} 分钟未完成，已自动停止`)
    } else {
      message.error('生成失败，请稍后重试')
    }
  } finally {
    if (shouldRefund) {
      auth.refundPoints(GENERATION_COST, '全能模特生成失败，已自动退回积分', taskId)
    }
    stopProgress(!!resultImage.value)
    isGenerating.value = false
  }
}
</script>

<style scoped lang="scss">
@import './tool-page-common.scss';

.omni-model-view {
  .model-badge {
    font-size: 12px;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    border-radius: 999px;
    padding: 4px 10px;
    white-space: nowrap;
  }

  .mode-section {
    .mode-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .mode-btn {
      border: 1px solid #dbe2ea;
      background: #f8fafc;
      border-radius: 12px;
      padding: 12px;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 4px;

      strong {
        font-size: 14px;
        color: #111827;
      }

      span {
        font-size: 12px;
        color: #6b7280;
      }

      &:hover {
        border-color: #93c5fd;
        background: #eff6ff;
      }

      &.active {
        border-color: #2563eb;
        background: #dbeafe;
      }
    }
  }

  .mode-note {
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    border-radius: 10px;
    padding: 12px;

    strong {
      display: block;
      font-size: 14px;
      color: #111827;
      margin-bottom: 6px;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.6;
    }
  }

  .preview-loading {
    width: 100%;
    padding: 10px 14px;
    align-items: stretch;
    text-align: left;
    gap: 10px;
    color: #4b5563;

    .spin {
      align-self: center;
      font-size: 18px;
    }
  }

  .progress-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    text-align: center;
  }

  .progress-meta {
    font-size: 12px;
    color: #6b7280;
    text-align: center;
  }

  .progress-track {
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: #e5e7eb;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
    transition: width 0.4s ease;
  }

  .cost-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .cost-model {
    font-size: 12px;
    color: #64748b;
  }

  .download-btn {
    width: 100%;
    padding: 12px 20px;
    border-radius: 12px;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #dbeafe;
      border-color: #93c5fd;
    }
  }
}
</style>
