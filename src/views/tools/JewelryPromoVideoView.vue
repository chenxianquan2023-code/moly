<template>
  <div class="jewelry-promo-page">
    <main class="page-main">
      <section class="page-bar">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <span>首饰宣发短视频</span>
        </div>
        <div class="header-right">
          <span class="points"><ThunderboltFilled /> {{ auth.points }} 积分</span>
          <router-link to="/recharge" class="recharge-link">充值</router-link>
        </div>
      </section>

      <section class="hero-card">
        <div class="hero-copy">
          <p class="eyebrow">首饰短视频</p>
          <h1>首饰宣发短视频</h1>
          <p class="hero-desc">
            上传模特图与商品图，自动生成 4 张关键帧、封面图和 12 秒竖屏成片。
          </p>
        </div>
        <div class="hero-meta">
          <div class="meta-pill">4 张关键帧</div>
          <div class="meta-pill">1 张封面</div>
          <div class="meta-pill">12 秒成片</div>
          <div class="meta-pill">{{ generationCost }} 积分</div>
        </div>
      </section>

      <section class="workflow-nav">
        <button
          v-for="(step, index) in stepItems"
          :key="step.title"
          type="button"
          class="step-button"
          :class="{
            active: currentViewStep === index,
            completed: step.completed,
            disabled: !step.enabled,
          }"
          :disabled="!step.enabled"
          @click="openStep(index)"
        >
          <span class="step-icon">
            <CheckOutlined v-if="step.completed" />
            <span v-else>{{ index + 1 }}</span>
          </span>
          <span class="step-copy">
            <strong>{{ step.title }}</strong>
            <small>{{ step.detail }}</small>
          </span>
        </button>
      </section>

      <div class="content-grid">
        <div class="main-column">
          <section v-if="currentViewStep === 0" class="panel">
            <div class="panel-head">
              <div>
                <p class="step-tag">第 1 步</p>
                <h2>上传素材</h2>
              </div>
              <span class="panel-summary">{{ uploadedCount }}/2 已上传</span>
            </div>

            <div class="upload-grid">
              <div class="upload-card">
                <div class="field-top">
                  <span class="field-label">模特图</span>
                  <span class="field-hint">建议正脸或半侧脸，脸部清晰</span>
                </div>
                <div
                  class="upload-box"
                  :class="{ filled: Boolean(inputs.modelImage), disabled: isBusy }"
                  @click="!isBusy && modelInputRef?.click()"
                >
                  <img v-if="inputs.modelImage" :src="inputs.modelImage" alt="模特图" class="upload-preview" />
                  <div v-else class="upload-empty">
                    <PlusOutlined />
                    <span>上传模特图</span>
                  </div>
                </div>
                <div class="upload-actions">
                  <button type="button" class="subtle-btn" :disabled="isBusy" @click="modelInputRef?.click()">选择图片</button>
                  <button
                    type="button"
                    class="subtle-btn danger"
                    :disabled="isBusy || !inputs.modelImage"
                    @click="clearImage('model')"
                  >
                    清空
                  </button>
                </div>
                <input
                  ref="modelInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden-input"
                  @change="(event) => handleFileChange(event, 'model')"
                />
              </div>

              <div class="upload-card">
                <div class="field-top">
                  <span class="field-label">商品图</span>
                  <span class="field-hint">建议首饰主体清晰、无遮挡</span>
                </div>
                <div
                  class="upload-box"
                  :class="{ filled: Boolean(inputs.productImage), disabled: isBusy }"
                  @click="!isBusy && productInputRef?.click()"
                >
                  <img v-if="inputs.productImage" :src="inputs.productImage" alt="商品图" class="upload-preview" />
                  <div v-else class="upload-empty">
                    <PlusOutlined />
                    <span>上传商品图</span>
                  </div>
                </div>
                <div class="upload-actions">
                  <button type="button" class="subtle-btn" :disabled="isBusy" @click="productInputRef?.click()">选择图片</button>
                  <button
                    type="button"
                    class="subtle-btn danger"
                    :disabled="isBusy || !inputs.productImage"
                    @click="clearImage('product')"
                  >
                    清空
                  </button>
                </div>
                <input
                  ref="productInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden-input"
                  @change="(event) => handleFileChange(event, 'product')"
                />
              </div>
            </div>

            <div class="control-grid">
              <label class="control-field">
                <span class="field-label">商品类型</span>
                <select v-model="selectedJewelryType" class="field-select" :disabled="isBusy" @change="handleJewelryTypeChange">
                  <option :value="''">自动识别</option>
                  <option value="earring">耳饰</option>
                  <option value="necklace">项链</option>
                </select>
              </label>

              <label class="control-field">
                <span class="field-label">风格模板</span>
                <select v-model="inputs.styleTemplate" class="field-select" :disabled="isBusy" @change="handleStyleTemplateChange">
                  <option value="magazine">高级杂志</option>
                  <option value="ins-natural">ins 自然光</option>
                  <option value="luxury-ecommerce">轻奢电商</option>
                </select>
              </label>
            </div>

            <div class="action-row">
              <button type="button" class="primary-btn" :disabled="!canStartGeneration || isBusy" @click="startGeneration">
                <LoadingOutlined v-if="isAnalyzing || isGeneratingShots" class="spin" />
                <PlayCircleOutlined v-else />
                {{ isAnalyzing || isGeneratingShots ? progressText : '开始生成候选镜头' }}
              </button>
              <span class="cost-note">开始生成即扣除 {{ generationCost }} 积分，镜头重生免费</span>
            </div>
          </section>

          <section v-else-if="currentViewStep === 1" class="panel">
            <div class="panel-head">
              <div>
                <p class="step-tag">第 2 步</p>
                <h2>选择关键帧</h2>
              </div>
              <span class="panel-summary">
                {{ isAnalyzing || isGeneratingShots ? progressText : `${selectedCount}/${shots.length || 4} 已选择` }}
              </span>
            </div>

            <div v-if="isAnalyzing" class="state-box loading-box">
              <LoadingOutlined class="spin" />
              <span>正在解析人物、首饰位置、可见性与参考风格...</span>
            </div>

            <template v-else-if="analysis">
              <div class="summary-grid">
                <div v-for="item in analysisSummaryItems" :key="item.label" class="summary-item">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>

              <div v-if="warningMessages.length" class="warning-list">
                <div v-for="warning in warningMessages" :key="warning" class="warning-item">
                  <InfoCircleOutlined />
                  <span>{{ warning }}</span>
                </div>
              </div>
            </template>

            <div v-else class="state-box empty-box">
              <span>上传素材并开始生成后，这里会展示解析摘要与镜头候选。</span>
            </div>

            <template v-if="shots.length">
              <div class="shot-switcher">
                <button
                  v-for="shot in shots"
                  :key="shot.id"
                  type="button"
                  class="shot-tab"
                  :class="{
                    active: currentShot?.id === shot.id,
                    selected: Boolean(selectedByShot[shot.id]),
                  }"
                  @click="activateShot(shot.id)"
                >
                  <span class="shot-tab-index">镜头 {{ shot.index }}</span>
                  <strong>{{ shotDisplay(shot).title }}</strong>
                  <span class="shot-tab-status">{{ selectedByShot[shot.id] ? '已选关键帧' : '待选择' }}</span>
                </button>
              </div>

              <article v-if="currentShot" class="shot-card">
                <div class="shot-head">
                  <div>
                    <span class="shot-index">镜头 {{ currentShot.index }}</span>
                    <h3>{{ shotDisplay(currentShot).title }}</h3>
                    <p>{{ shotDisplay(currentShot).subtitle }}</p>
                  </div>
                  <div class="shot-actions">
                    <span class="shot-meta">{{ currentShot.durationSeconds }} 秒</span>
                    <span v-if="currentShotSelection" class="shot-selection-badge">
                      已选候选 {{ candidateSuffix(currentShotSelection.candidateId) }}
                    </span>
                    <button
                      type="button"
                      class="subtle-btn"
                      :disabled="!analysis || isBusy"
                      @click="regenerateShot(currentShot)"
                    >
                      <ReloadOutlined />
                      重生候选
                    </button>
                  </div>
                </div>

                <div class="shot-desc-grid">
                  <div class="shot-desc-item">
                    <span>构图</span>
                    <strong>{{ shotDisplay(currentShot).framing }}</strong>
                  </div>
                  <div class="shot-desc-item">
                    <span>关注点</span>
                    <strong>{{ shotDisplay(currentShot).focusPoint }}</strong>
                  </div>
                  <div class="shot-desc-item">
                    <span>微动作</span>
                    <strong>{{ shotDisplay(currentShot).motionHint }}</strong>
                  </div>
                </div>

                <div v-if="shotIsLoading(currentShot.id)" class="state-box loading-box shot-feedback">
                  <LoadingOutlined class="spin" />
                  <span>正在生成镜头 {{ currentShot.index }} 的候选图...</span>
                </div>

                <div v-else-if="currentShotCandidates.length" class="candidate-grid">
                  <button
                    v-for="candidate in currentShotCandidates"
                    :key="candidate.id"
                    type="button"
                    class="candidate-card"
                    :class="{ selected: currentShotSelection?.candidateId === candidate.id }"
                    :disabled="isBusy"
                    @click="selectCandidate(currentShot, candidate)"
                  >
                    <img :src="candidate.imageUrl" :alt="`${currentShot.title} 候选图`" class="candidate-image" />
                    <div class="candidate-footer">
                      <span>候选 {{ candidateSuffix(candidate.id) }}</span>
                      <span v-if="currentShotSelection?.candidateId === candidate.id" class="selected-tag">
                        <CheckOutlined />
                        已选
                      </span>
                    </div>
                  </button>
                </div>

                <div v-else class="state-box empty-box shot-feedback">
                  <span>当前镜头候选待生成。</span>
                </div>
              </article>
            </template>
          </section>

          <section v-else-if="currentViewStep === 2" class="panel">
            <div class="panel-head">
              <div>
                <p class="step-tag">第 3 步</p>
                <h2>生成封面与视频</h2>
              </div>
              <span class="panel-summary">
                {{ finalizing.cover || finalizing.video ? '生成中' : `${selectedCount}/${shots.length || 4} 已完成关键帧` }}
              </span>
            </div>

            <div v-if="!shots.length" class="state-box empty-box">
              <span>请先完成关键帧生成。</span>
            </div>

            <div v-else class="finalize-card">
              <div class="finalize-status">
                <div class="finalize-item">
                  <span>关键帧</span>
                  <strong>{{ selectedCount }}/{{ shots.length }}</strong>
                </div>
                <div class="finalize-item">
                  <span>封面状态</span>
                  <strong>{{ coverStatusText }}</strong>
                </div>
                <div class="finalize-item">
                  <span>视频状态</span>
                  <strong>{{ videoStatusText }}</strong>
                </div>
              </div>

              <div class="selection-summary-grid">
                <div
                  v-for="shot in shots"
                  :key="`${shot.id}-selection-summary`"
                  class="selection-summary-item"
                  :class="{ ready: Boolean(selectedByShot[shot.id]) }"
                >
                  <span>镜头 {{ shot.index }}</span>
                  <strong>{{ selectionSummaryText(shot.id) }}</strong>
                </div>
              </div>

              <div class="action-row compact">
                <button
                  type="button"
                  class="primary-btn"
                  :disabled="!allShotsSelected || finalizing.cover || finalizing.video"
                  @click="generateFinalAssets"
                >
                  <LoadingOutlined v-if="finalizing.cover || finalizing.video" class="spin" />
                  <PlayCircleOutlined v-else />
                  {{ finalizing.cover || finalizing.video ? '正在生成封面和成片...' : '生成封面图和成片' }}
                </button>
                <span class="cost-note">仅在当前 4 张关键帧确认后生成封面与视频。</span>
              </div>

              <div v-if="fatalError" class="inline-error">
                <InfoCircleOutlined />
                <span>{{ fatalError }}</span>
              </div>
            </div>
          </section>

          <section v-else class="panel">
            <div class="panel-head">
              <div>
                <p class="step-tag">第 4 步</p>
                <h2>查看结果</h2>
              </div>
              <div class="result-actions">
                <button type="button" class="subtle-btn" :disabled="!downloadReady" @click="downloadAllAsZip">
                  <DownloadOutlined />
                  一键打包
                </button>
              </div>
            </div>

            <div v-if="!hasResultAssets" class="state-box empty-box">
              <span>当前还没有可查看的结果。</span>
            </div>

            <div v-else class="result-stack">
              <div class="result-block">
                <div class="result-block-head">
                  <h3>关键帧</h3>
                </div>
                <div class="result-grid">
                  <article v-for="shot in shots" :key="`${shot.id}-result`" class="result-card">
                    <img
                      v-if="selectedByShot[shot.id]"
                      :src="selectedByShot[shot.id]?.imageUrl"
                      :alt="shot.title"
                      class="result-image"
                    />
                    <div v-else class="result-empty">镜头 {{ shot.index }} 暂未选择关键帧</div>
                    <div class="result-meta">
                      <div>
                        <span class="result-kicker">镜头 {{ shot.index }}</span>
                        <strong>{{ shotDisplay(shot).title }}</strong>
                      </div>
                      <button
                        type="button"
                        class="subtle-btn"
                        :disabled="!selectedByShot[shot.id]"
                        @click="downloadSingleAsset(selectedByShot[shot.id]?.imageUrl || '', `keyframe-${shot.index}.png`)"
                      >
                        下载
                      </button>
                    </div>
                  </article>
                </div>
              </div>

              <div v-if="coverResult" class="result-block">
                <div class="result-block-head">
                  <h3>封面图</h3>
                </div>
                <article class="result-card cover-card">
                  <img :src="coverResult.imageUrl" alt="封面图" class="result-image" />
                  <div class="result-meta">
                    <div>
                      <span class="result-kicker">封面</span>
                      <strong>单独生成封面图</strong>
                    </div>
                    <button type="button" class="subtle-btn" @click="downloadSingleAsset(coverResult.imageUrl, 'cover.png')">
                      下载
                    </button>
                  </div>
                </article>
              </div>

              <div v-if="videoTask?.videoUrl" class="result-block">
                <div class="result-block-head">
                  <h3>12 秒成片</h3>
                </div>
                <div class="video-card">
                  <video :src="videoTask.videoUrl" controls playsinline class="result-video"></video>
                  <div class="result-meta">
                    <div>
                      <span class="result-kicker">视频</span>
                      <strong>{{ videoTask.duration ? `${videoTask.duration.toFixed(1)} 秒` : '12 秒竖屏成片' }}</strong>
                    </div>
                    <button
                      type="button"
                      class="subtle-btn"
                      @click="downloadSingleAsset(videoTask.videoUrl || '', 'jewelry-promo.mp4')"
                    >
                      下载
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside class="side-column">
          <section class="side-card">
            <h3>工作流状态</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span>素材</span>
                <strong>{{ uploadedCount }}/2</strong>
              </div>
              <div class="stat-item">
                <span>关键帧</span>
                <strong>{{ selectedCount }}/{{ shots.length || 4 }}</strong>
              </div>
              <div class="stat-item">
                <span>封面</span>
                <strong>{{ coverStatusText }}</strong>
              </div>
              <div class="stat-item">
                <span>视频</span>
                <strong>{{ videoStatusText }}</strong>
              </div>
            </div>

            <p class="status-caption">当前阶段：{{ currentStageLabel }}</p>

            <div v-if="shots.length" class="quick-shot-list">
              <button
                v-for="shot in shots"
                :key="`${shot.id}-quick`"
                type="button"
                class="quick-shot-item"
                :class="{
                  active: currentShot?.id === shot.id && currentViewStep === 1,
                  selected: Boolean(selectedByShot[shot.id]),
                }"
                @click="activateShot(shot.id)"
              >
                <span>镜头 {{ shot.index }}</span>
                <strong>{{ selectedByShot[shot.id] ? '已选' : '待选' }}</strong>
              </button>
            </div>
          </section>

          <section v-if="fatalError" class="side-card error-card">
            <h3>异常记录</h3>
            <p>{{ fatalError }}</p>
          </section>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import {
  CheckOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  ThunderboltFilled,
} from '@ant-design/icons-vue'
import JSZip from 'jszip'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import { jewelryPromoService } from '@/services/jewelryPromo.service'
import type {
  JewelryAnalysis,
  JewelryPromoInput,
  JewelryShotCandidate,
  JewelryShotSelection,
  JewelryShotTemplate,
  JewelryType,
  VideoGenerationTask,
} from '@/types/jewelryPromo.types'

type ShotDisplayCopy = Pick<JewelryShotTemplate, 'title' | 'subtitle' | 'framing' | 'focusPoint' | 'motionHint'>

const SHOT_DISPLAY_MAP: Record<string, ShotDisplayCopy> = {
  'earring-shot-1': {
    title: '侧脸建立镜头',
    subtitle: '用干净的侧脸角度建立人物身份与耳饰佩戴位置。',
    framing: '9:16 竖屏，中近景，35 至 45 度侧脸',
    focusPoint: '耳饰位置、人物身份、发丝轮廓',
    motionHint: '仅保留呼吸、轻微转头和细微发丝摆动',
  },
  'earring-shot-2': {
    title: '正面人像镜头',
    subtitle: '强化面部一致性和双侧耳饰的可见度。',
    framing: '9:16 竖屏，正面中近景',
    focusPoint: '耳饰数量、材质高光、面部一致性',
    motionHint: '仅保留眨眼、呼吸和轻微摆头',
  },
  'earring-shot-3': {
    title: '耳饰细节镜头',
    subtitle: '突出材质、表面处理和工艺细节。',
    framing: '9:16 竖屏，耳部细节近景',
    focusPoint: '材质、轮廓、数量与准确佩戴位置',
    motionHint: '仅保留轻微推进感和细小摆动',
  },
  'earring-shot-4': {
    title: '收尾氛围镜头',
    subtitle: '以精致高级的品牌感画面完成结尾。',
    framing: '9:16 竖屏，美感近景或半身氛围画面',
    focusPoint: '高级时尚氛围中的耳饰可见性',
    motionHint: '仅保留呼吸、轻微眼神变化和极小肩部动作',
  },
  'necklace-shot-1': {
    title: '半身建立镜头',
    subtitle: '清晰交代人物与颈部区域，确保项链可见。',
    framing: '9:16 竖屏，半身人像',
    focusPoint: '锁骨、项链佩戴位置、人物身份',
    motionHint: '仅保留呼吸和轻微肩颈动作',
  },
  'necklace-shot-2': {
    title: '锁骨细节镜头',
    subtitle: '突出链条、吊坠和佩戴位置细节。',
    framing: '9:16 竖屏，锁骨与项链近景',
    focusPoint: '链条结构、吊坠材质、准确位置',
    motionHint: '仅保留轻微镜头漂移和呼吸',
  },
  'necklace-shot-3': {
    title: '互动触碰镜头',
    subtitle: '营造柔和互动，同时不遮挡项链主体。',
    framing: '9:16 竖屏，中近景，手部进入锁骨区域',
    focusPoint: '项链主体、手势、面部一致性',
    motionHint: '仅保留轻柔指尖触碰和轻微头部动作',
  },
  'necklace-shot-4': {
    title: '收尾氛围镜头',
    subtitle: '以精致高级的珠宝人像完成结尾。',
    framing: '9:16 竖屏，氛围感近景人像',
    focusPoint: '项链可见性与整体造型协调',
    motionHint: '仅保留呼吸、轻微眼神变化和极小肩部动作',
  },
}

const TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/earlobes?/gi, '耳垂'],
  [/ear area/gi, '耳部区域'],
  [/bilateral visibility/gi, '双侧可见'],
  [/front collarbone area/gi, '前侧锁骨区域'],
  [/collarbone/gi, '锁骨'],
  [/yellow gold-toned/gi, '黄金沙色'],
  [/rose gold/gi, '玫瑰金'],
  [/silver-toned/gi, '银色调'],
  [/textured or coiled wire loops/gi, '纹理感或盘绕金属环'],
  [/one pair of large dangling earrings/gi, '一对大型垂坠耳饰'],
  [/one pair of earrings/gi, '一对耳饰'],
  [/one necklace/gi, '一条项链'],
  [/metal or gemstone jewelry finish/gi, '金属或宝石首饰质感'],
  [/clean premium portrait-friendly jewelry campaign style/gi, '干净高级的人像珠宝宣发风格'],
  [/same face, hairstyle, and overall vibe/gi, '保持同一张脸、发型与整体气质'],
  [/\s*\/\s*/g, ' / '],
]

const WARNING_TRANSLATIONS: Array<[RegExp, string]> = [
  [
    /product size is significantly larger than the earrings currently worn by the model/i,
    '商品尺寸明显大于模特当前佩戴的耳饰，生成时需注意佩戴比例一致。',
  ],
  [
    /color mismatch between model'?s rose gold jewelry and product'?s yellow gold/i,
    '模特现有首饰偏玫瑰金，与商品黄金沙色不一致，生成时需以商品颜色为准。',
  ],
]

const auth = useAuthStore()
const generationCost = jewelryPromoService.getGenerationCost()

const modelInputRef = ref<HTMLInputElement | null>(null)
const productInputRef = ref<HTMLInputElement | null>(null)

const inputs = reactive<JewelryPromoInput>({
  modelImage: '',
  productImage: '',
  jewelryType: null,
  styleTemplate: 'magazine',
})

const selectedJewelryType = ref<'' | JewelryType>('')
const analysis = ref<JewelryAnalysis | null>(null)
const shots = ref<JewelryShotTemplate[]>([])
const candidatesByShot = ref<Record<string, JewelryShotCandidate[]>>({})
const selectedByShot = ref<Record<string, JewelryShotSelection | null>>({})
const coverResult = ref<JewelryShotCandidate | null>(null)
const videoTask = ref<VideoGenerationTask | null>(null)
const currentStage = ref<'input' | 'analysis' | 'candidates' | 'finalizing' | 'result'>('input')
const currentViewStep = ref(0)
const activeShotId = ref('')
const progressText = ref('正在准备...')
const fatalError = ref('')

const isAnalyzing = ref(false)
const isGeneratingShots = ref(false)
const activeGeneratingShotId = ref<string | null>(null)
const regeneratingShotIds = ref<string[]>([])
const finalizing = reactive({
  cover: false,
  video: false,
})

const billingTaskId = ref('')
const hasCharged = ref(false)
const refunded = ref(false)
const previewObjectUrls: Record<'model' | 'product', string> = {
  model: '',
  product: '',
}

const uploadedCount = computed(() => Number(Boolean(inputs.modelImage)) + Number(Boolean(inputs.productImage)))
const canStartGeneration = computed(() => Boolean(inputs.modelImage && inputs.productImage))
const isBusy = computed(
  () =>
    isAnalyzing.value ||
    isGeneratingShots.value ||
    finalizing.cover ||
    finalizing.video ||
    regeneratingShotIds.value.length > 0
)

const selectedCount = computed(() => shots.value.filter((shot) => selectedByShot.value[shot.id]).length)
const allShotsSelected = computed(() => shots.value.length === 4 && selectedCount.value === 4)
const analysisWarnings = computed(() => analysis.value?.warnings || [])
const hasResultAssets = computed(() => Boolean(selectedCount.value || coverResult.value || videoTask.value?.videoUrl))
const downloadReady = computed(() => hasResultAssets.value)
const resultAssetCount = computed(
  () => selectedCount.value + Number(Boolean(coverResult.value)) + Number(Boolean(videoTask.value?.videoUrl))
)

const coverStatusText = computed(() => {
  if (finalizing.cover) return '生成中'
  if (coverResult.value) return '已完成'
  return '待生成'
})

const videoStatusText = computed(() => {
  if (finalizing.video) return '生成中'
  if (videoTask.value?.videoUrl) return '已完成'
  return '待生成'
})

const currentStageLabel = computed(() => {
  if (currentStage.value === 'analysis') return '图像解析'
  if (currentStage.value === 'candidates') return isGeneratingShots.value ? '生成候选镜头' : '关键帧选择'
  if (currentStage.value === 'finalizing') return '生成封面与视频'
  if (currentStage.value === 'result') return '结果已就绪'
  return '等待素材'
})

const currentShot = computed<JewelryShotTemplate | null>(() => {
  if (!shots.value.length) return null
  return shots.value.find((shot) => shot.id === activeShotId.value) || shots.value[0] || null
})

const currentShotCandidates = computed(() => {
  if (!currentShot.value) return []
  return candidatesByShot.value[currentShot.value.id] || []
})

const currentShotSelection = computed(() => {
  if (!currentShot.value) return null
  return selectedByShot.value[currentShot.value.id] || null
})

const resolvedTypeConflict = computed(() => {
  if (!analysis.value?.detectedJewelryType || analysis.value.detectedJewelryType === 'unknown') {
    return false
  }

  return Boolean(
    selectedJewelryType.value &&
      selectedJewelryType.value !== analysis.value.detectedJewelryType &&
      selectedJewelryType.value === analysis.value.resolvedJewelryType
  )
})

const warningMessages = computed(() => {
  const warnings = analysisWarnings.value.map((warning) => translateWarningText(warning))
  if (resolvedTypeConflict.value) {
    warnings.push('检测品类与手动选择不一致，系统已按你的手动选择继续执行。')
  }
  return warnings
})

const analysisSummaryItems = computed(() => {
  if (!analysis.value) return []

  return [
    { label: '识别品类', value: jewelryTypeLabel(analysis.value.detectedJewelryType) },
    { label: '执行品类', value: jewelryTypeLabel(analysis.value.resolvedJewelryType) },
    { label: '首饰位置', value: translateDisplayText(analysis.value.jewelryPosition) },
    { label: '可见性', value: visibilityLabel(analysis.value.jewelryVisibility) },
    {
      label: '材质 / 数量',
      value: `${translateDisplayText(analysis.value.materialSummary)} / ${translateDisplayText(analysis.value.quantitySummary)}`,
    },
  ]
})

const stepEnabledStates = computed(() => [
  true,
  isAnalyzing.value || Boolean(analysis.value) || isGeneratingShots.value || shots.value.length > 0,
  shots.value.length > 0 || currentStage.value === 'finalizing' || currentStage.value === 'result',
  hasResultAssets.value || currentStage.value === 'result',
])

const stepItems = computed(() => [
  {
    title: '上传素材',
    detail: uploadedCount.value ? `${uploadedCount.value}/2 已上传` : '待上传',
    enabled: stepEnabledStates.value[0],
    completed: uploadedCount.value === 2,
  },
  {
    title: '选择关键帧',
    detail: isAnalyzing.value || isGeneratingShots.value ? progressText.value : `${selectedCount.value}/${shots.value.length || 4} 已选择`,
    enabled: stepEnabledStates.value[1],
    completed: allShotsSelected.value,
  },
  {
    title: '生成封面与视频',
    detail: finalizing.cover || finalizing.video ? '生成中' : allShotsSelected.value ? '可开始生成' : '待关键帧确认',
    enabled: stepEnabledStates.value[2],
    completed: currentStage.value === 'result' && (Boolean(coverResult.value) || Boolean(videoTask.value?.videoUrl)),
  },
  {
    title: '查看结果',
    detail: hasResultAssets.value ? `${resultAssetCount.value} 项结果` : '待生成',
    enabled: stepEnabledStates.value[3],
    completed: false,
  },
])

watch(
  shots,
  (nextShots) => {
    if (!nextShots.length) {
      activeShotId.value = ''
      return
    }

    if (!nextShots.some((shot) => shot.id === activeShotId.value)) {
      activeShotId.value = nextShots[0]?.id ?? ''
    }
  },
  { immediate: true }
)

function openStep(stepIndex: number) {
  if (!stepEnabledStates.value[stepIndex]) {
    return
  }
  currentViewStep.value = stepIndex
}

function activateShot(shotId: string) {
  activeShotId.value = shotId
  if (stepEnabledStates.value[1]) {
    currentViewStep.value = 1
  }
}

function jewelryTypeLabel(type: JewelryAnalysis['detectedJewelryType'] | JewelryType) {
  if (type === 'earring') return '耳饰'
  if (type === 'necklace') return '项链'
  return '未识别'
}

function visibilityLabel(visibility: JewelryAnalysis['jewelryVisibility']) {
  if (visibility === 'high') return '高'
  if (visibility === 'medium') return '中'
  return '低'
}

function candidateSuffix(candidateId: string) {
  return candidateId.includes('-1-') || candidateId.endsWith('-1') ? 'A' : 'B'
}

function translateDisplayText(value: string) {
  let result = String(value || '').trim()
  if (!result) return result

  for (const [pattern, replacement] of TEXT_REPLACEMENTS) {
    result = result.replace(pattern, replacement)
  }

  return result.replace(/\s{2,}/g, ' ').trim()
}

function translateWarningText(value: string) {
  const warning = String(value || '').trim()
  if (!warning) return warning

  for (const [pattern, replacement] of WARNING_TRANSLATIONS) {
    if (pattern.test(warning)) {
      return replacement
    }
  }

  return translateDisplayText(warning)
}

function shotDisplay(shot: JewelryShotTemplate | null | undefined): ShotDisplayCopy {
  if (!shot) {
    return {
      title: '',
      subtitle: '',
      framing: '',
      focusPoint: '',
      motionHint: '',
    }
  }

  return (
    SHOT_DISPLAY_MAP[shot.id] || {
      title: translateDisplayText(shot.title),
      subtitle: translateDisplayText(shot.subtitle),
      framing: translateDisplayText(shot.framing),
      focusPoint: translateDisplayText(shot.focusPoint),
      motionHint: translateDisplayText(shot.motionHint),
    }
  )
}

function selectionSummaryText(shotId: string) {
  const candidateId = selectedByShot.value[shotId]?.candidateId
  return candidateId ? `候选 ${candidateSuffix(candidateId)}` : '待选择'
}

function shotIsLoading(shotId: string) {
  return activeGeneratingShotId.value === shotId || regeneratingShotIds.value.includes(shotId)
}

function revokePreviewUrl(type: 'model' | 'product') {
  const objectUrl = previewObjectUrls[type]

  if (!objectUrl) {
    return
  }

  URL.revokeObjectURL(objectUrl)
  previewObjectUrls[type] = ''
}

onBeforeUnmount(() => {
  revokePreviewUrl('model')
  revokePreviewUrl('product')
})

function syncJewelryType() {
  inputs.jewelryType = selectedJewelryType.value || null
}

function handleJewelryTypeChange() {
  syncJewelryType()
  resetGeneratedState()
}

function handleStyleTemplateChange() {
  resetGeneratedState()
}

function resetGeneratedState() {
  analysis.value = null
  shots.value = []
  candidatesByShot.value = {}
  selectedByShot.value = {}
  coverResult.value = null
  videoTask.value = null
  currentStage.value = 'input'
  currentViewStep.value = 0
  activeShotId.value = ''
  progressText.value = '正在准备...'
  fatalError.value = ''
  activeGeneratingShotId.value = null
  regeneratingShotIds.value = []
  finalizing.cover = false
  finalizing.video = false
}

function clearImage(type: 'model' | 'product') {
  if (isBusy.value) return

  revokePreviewUrl(type)

  if (type === 'model') {
    inputs.modelImage = ''
  } else {
    inputs.productImage = ''
  }

  resetGeneratedState()
}

function handleFileChange(event: Event, type: 'model' | 'product') {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return
  if (!file.type.startsWith('image/')) {
    message.warning('请上传图片文件')
    return
  }

  revokePreviewUrl(type)
  const objectUrl = URL.createObjectURL(file)
  previewObjectUrls[type] = objectUrl

  if (type === 'model') {
    inputs.modelImage = objectUrl
  } else {
    inputs.productImage = objectUrl
  }

  target.value = ''
  resetGeneratedState()
}

async function refundIfNeeded(reason: string) {
  if (!hasCharged.value || refunded.value || !billingTaskId.value) {
    return
  }

  auth.refundPoints(generationCost, reason, billingTaskId.value)
  refunded.value = true
}

async function handleFatalWorkflowError(error: unknown, fallbackMessage: string) {
  const content = error instanceof Error ? error.message : fallbackMessage
  fatalError.value = content
  currentViewStep.value = 1
  await refundIfNeeded('首饰宣发短视频生成失败退款')
  message.error(content)
}

async function generateShotCandidatesSequentially() {
  if (!analysis.value) return

  currentStage.value = 'candidates'
  currentViewStep.value = 1
  isGeneratingShots.value = true
  const nextCandidates: Record<string, JewelryShotCandidate[]> = {}
  const nextSelections: Record<string, JewelryShotSelection | null> = {}

  try {
    for (const shot of shots.value) {
      activeGeneratingShotId.value = shot.id
      activeShotId.value = shot.id
      progressText.value = `正在生成镜头 ${shot.index} / ${shots.value.length}`
      const candidates = await jewelryPromoService.generateShotCandidates(inputs, analysis.value, shot)
      nextCandidates[shot.id] = candidates
      nextSelections[shot.id] = null
    }

    candidatesByShot.value = nextCandidates
    selectedByShot.value = nextSelections
    message.success('4 个镜头候选图已生成，请逐个选择关键帧')
  } finally {
    isGeneratingShots.value = false
    activeGeneratingShotId.value = null
    progressText.value = '候选镜头生成完成'
  }
}

async function startGeneration() {
  syncJewelryType()

  if (!canStartGeneration.value || isBusy.value) {
    return
  }

  if (auth.points < generationCost) {
    message.warning(`积分不足，当前剩余 ${auth.points} 积分`)
    return
  }

  resetGeneratedState()
  billingTaskId.value = jewelryPromoService.createTaskId()
  hasCharged.value = auth.deductPoints(generationCost, '首饰宣发短视频生成', billingTaskId.value)
  refunded.value = false

  if (!hasCharged.value) {
    message.warning('积分扣费失败，请稍后重试')
    return
  }

  currentViewStep.value = 1

  try {
    currentStage.value = 'analysis'
    isAnalyzing.value = true
    progressText.value = '正在解析图像'
    analysis.value = await jewelryPromoService.analyzeInput(inputs)
    shots.value = jewelryPromoService.buildShotTemplates(analysis.value.resolvedJewelryType)
    message.success('图像解析完成，开始生成镜头候选')
  } catch (error) {
    await handleFatalWorkflowError(error, '图像解析失败')
    return
  } finally {
    isAnalyzing.value = false
  }

  try {
    await generateShotCandidatesSequentially()
  } catch (error) {
    await handleFatalWorkflowError(error, '镜头候选生成失败')
  }
}

function focusNextPendingShot(currentShotId: string, selectionMap: Record<string, JewelryShotSelection | null>) {
  const currentIndex = shots.value.findIndex((shot) => shot.id === currentShotId)
  const orderedShots =
    currentIndex >= 0
      ? [...shots.value.slice(currentIndex + 1), ...shots.value.slice(0, currentIndex + 1)]
      : shots.value

  const nextPending = orderedShots.find((shot) => !selectionMap[shot.id])
  if (nextPending) {
    activeShotId.value = nextPending.id
  }
}

function selectCandidate(shot: JewelryShotTemplate, candidate: JewelryShotCandidate) {
  if (isBusy.value) {
    return
  }

  const nextSelections = {
    ...selectedByShot.value,
    [shot.id]: {
      shotId: shot.id,
      candidateId: candidate.id,
      imageUrl: candidate.imageUrl,
      sourceUrl: candidate.sourceUrl,
      prompt: candidate.prompt,
    },
  }

  selectedByShot.value = nextSelections
  coverResult.value = null
  videoTask.value = null

  const nextCount = shots.value.filter((item) => nextSelections[item.id]).length
  if (nextCount === shots.value.length && shots.value.length > 0) {
    currentViewStep.value = 2
    return
  }

  focusNextPendingShot(shot.id, nextSelections)
}

async function regenerateShot(shot: JewelryShotTemplate) {
  if (!analysis.value || isBusy.value) {
    return
  }

  currentViewStep.value = 1
  activeShotId.value = shot.id
  regeneratingShotIds.value = [...regeneratingShotIds.value, shot.id]

  try {
    const candidates = await jewelryPromoService.generateShotCandidates(inputs, analysis.value, shot)
    candidatesByShot.value = {
      ...candidatesByShot.value,
      [shot.id]: candidates,
    }
    selectedByShot.value = {
      ...selectedByShot.value,
      [shot.id]: null,
    }
    coverResult.value = null
    videoTask.value = null
    message.success(`镜头 ${shot.index} 已重生 2 张候选图`)
  } catch (error) {
    const content = error instanceof Error ? error.message : `镜头 ${shot.index} 重生失败`
    message.error(content)
  } finally {
    regeneratingShotIds.value = regeneratingShotIds.value.filter((item) => item !== shot.id)
  }
}

async function generateFinalAssets() {
  if (!analysis.value || !allShotsSelected.value || finalizing.cover || finalizing.video) {
    return
  }

  const selections = shots.value
    .map((shot) => selectedByShot.value[shot.id])
    .filter(Boolean) as JewelryShotSelection[]

  currentViewStep.value = 2
  currentStage.value = 'finalizing'
  finalizing.cover = true
  finalizing.video = true
  fatalError.value = ''

  const [coverTask, videoResult] = await Promise.allSettled([
    jewelryPromoService.generateCoverImage(inputs, analysis.value, selections),
    jewelryPromoService.generateFinalVideo(inputs, analysis.value, shots.value, selections),
  ])

  finalizing.cover = false
  finalizing.video = false

  if (coverTask.status === 'fulfilled') {
    coverResult.value = coverTask.value
  }

  if (videoResult.status === 'fulfilled') {
    videoTask.value = videoResult.value
  }

  if (coverTask.status === 'rejected' || videoResult.status === 'rejected') {
    const coverError = coverTask.status === 'rejected' ? coverTask.reason : null
    const videoError = videoResult.status === 'rejected' ? videoResult.reason : null
    const content = [coverError, videoError]
      .filter(Boolean)
      .map((item) => (item instanceof Error ? item.message : String(item)))
      .join('；')

    await refundIfNeeded('首饰宣发短视频最终输出失败退款')
    fatalError.value = content || '封面或视频生成失败'
    message.error(fatalError.value)
  } else {
    message.success('封面图和成片已生成完成')
  }

  currentStage.value = 'result'
  currentViewStep.value = 3
}

async function fetchAssetBlob(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`资源下载失败: ${response.status}`)
  }
  return await response.blob()
}

async function downloadSingleAsset(url: string, filename: string) {
  if (!url) return

  try {
    const blob = await fetchAssetBlob(url)
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    const content = error instanceof Error ? error.message : '下载失败'
    message.error(content)
  }
}

function sanitizeFilename(name: string) {
  return name.toLowerCase().replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
}

async function downloadAllAsZip() {
  if (!downloadReady.value) return

  try {
    const zip = new JSZip()
    const keyframeFolder = zip.folder('keyframes')
    const coverFolder = zip.folder('cover')
    const videoFolder = zip.folder('video')

    for (const shot of shots.value) {
      const selection = selectedByShot.value[shot.id]
      if (!selection) continue

      const blob = await fetchAssetBlob(selection.imageUrl)
      keyframeFolder?.file(`${String(shot.index).padStart(2, '0')}-${sanitizeFilename(shotDisplay(shot).title)}.png`, blob)
    }

    if (coverResult.value) {
      const coverBlob = await fetchAssetBlob(coverResult.value.imageUrl)
      coverFolder?.file('cover.png', coverBlob)
    }

    if (videoTask.value?.videoUrl) {
      const videoBlob = await fetchAssetBlob(videoTask.value.videoUrl)
      videoFolder?.file('jewelry-promo.mp4', videoBlob)
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `jewelry-promo-${Date.now()}.zip`
    anchor.click()
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    const content = error instanceof Error ? error.message : '打包下载失败'
    message.error(content)
  }
}
</script>

<style scoped lang="scss">
.jewelry-promo-page {
  min-height: 100%;
  background: var(--color-bg-subtle);
}

.page-main {
  max-width: 1360px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}

.points {
  color: var(--color-text-secondary);
}

.recharge-link {
  color: var(--color-primary);
  text-decoration: none;
}

.hero-card,
.panel,
.side-card,
.workflow-nav {
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-bg);
  box-shadow: var(--shadow-sm);
}

.hero-card {
  padding: 24px 28px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.hero-copy {
  max-width: 760px;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.hero-card h1 {
  margin: 0 0 8px;
  font-size: 32px;
  line-height: 1.2;
  color: var(--color-text-primary);
}

.hero-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.meta-pill {
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 13px;
  white-space: nowrap;
}

.workflow-nav {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.step-button {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-bg);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
  }

  &:disabled {
    cursor: not-allowed;
    background: var(--color-bg-subtle);
  }

  &.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }

  &.completed .step-icon {
    background: var(--color-primary);
    color: #fff;
  }

  &.disabled .step-copy strong,
  &.disabled .step-copy small {
    color: var(--color-text-tertiary);
  }
}

.step-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 700;
}

.step-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  strong {
    font-size: 14px;
    color: var(--color-text-primary);
  }

  small {
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 24px;
  align-items: start;
}

.main-column,
.side-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.side-column {
  position: sticky;
  top: 24px;
}

.panel,
.side-card {
  padding: 24px;
}

.panel-head,
.shot-head,
.result-meta,
.result-block-head,
.action-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel-head {
  margin-bottom: 20px;
}

.panel-head h2 {
  margin: 4px 0 0;
  font-size: 24px;
  color: var(--color-text-primary);
}

.step-tag {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.panel-summary {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.upload-grid,
.control-grid,
.summary-grid,
.candidate-grid,
.result-grid,
.shot-desc-grid,
.selection-summary-grid,
.stats-grid {
  display: grid;
  gap: 16px;
}

.upload-grid,
.control-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.upload-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-top,
.control-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.field-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.upload-box {
  min-height: 320px;
  border: 1px dashed var(--color-border-muted);
  border-radius: 16px;
  background: var(--color-bg-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);

  &.filled {
    border-style: solid;
  }

  &.disabled {
    opacity: 0.72;
    cursor: not-allowed;
  }

  &:hover:not(.disabled) {
    border-color: var(--color-primary);
    background: #f8fbff;
  }
}

.upload-preview {
  width: 100%;
  height: 320px;
  object-fit: cover;
}

.upload-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--color-text-secondary);
  font-size: 14px;

  :deep(svg) {
    font-size: 28px;
    color: var(--color-primary);
  }
}

.upload-actions,
.shot-actions,
.result-actions,
.quick-shot-list {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hidden-input {
  display: none;
}

.field-select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-border-muted);
  border-radius: 12px;
  background: var(--color-bg);
  color: var(--color-text-primary);
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
}

.action-row {
  margin-top: 20px;
  flex-wrap: wrap;
}

.action-row.compact {
  margin-top: 16px;
}

.primary-btn,
.subtle-btn,
.shot-tab,
.candidate-card,
.quick-shot-item {
  transition: all var(--transition-fast);
}

.primary-btn {
  min-width: 220px;
  padding: 13px 22px;
  border: none;
  border-radius: 12px;
  background: var(--color-primary);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.subtle-btn {
  padding: 9px 14px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-light);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &.danger:hover:not(:disabled) {
    border-color: var(--color-error);
    color: var(--color-error);
    background: rgba(220, 38, 38, 0.06);
  }
}

.cost-note {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.summary-grid {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.summary-item,
.shot-desc-item,
.finalize-item,
.selection-summary-item,
.stat-item {
  padding: 14px;
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  background: var(--color-bg-subtle);
  display: flex;
  flex-direction: column;
  gap: 6px;

  span {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  strong {
    color: var(--color-text-primary);
    line-height: 1.5;
  }
}

.warning-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.warning-item,
.inline-error {
  padding: 12px 14px;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  line-height: 1.6;
}

.warning-item {
  background: rgba(217, 119, 6, 0.08);
  color: var(--color-warning);
}

.inline-error {
  margin-top: 16px;
  background: rgba(220, 38, 38, 0.08);
  color: var(--color-error);
}

.shot-switcher {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.shot-tab {
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;

  strong {
    color: var(--color-text-primary);
    font-size: 14px;
  }

  &:hover {
    border-color: var(--color-primary);
  }

  &.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }

  &.selected {
    background: #f8fbff;
  }
}

.shot-tab-index,
.shot-tab-status,
.shot-index,
.result-kicker {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.shot-card {
  margin-top: 16px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-bg);
}

.shot-head h3,
.result-block-head h3 {
  margin: 0 0 6px;
  color: var(--color-text-primary);
}

.shot-head p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.shot-meta,
.shot-selection-badge {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
}

.shot-meta {
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
}

.shot-selection-badge {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.shot-desc-grid {
  margin-top: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.shot-feedback {
  margin-top: 16px;
}

.state-box {
  min-height: 140px;
  padding: 24px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: var(--color-text-secondary);
}

.loading-box {
  background: #f8fbff;
}

.empty-box {
  background: var(--color-bg-subtle);
}

.candidate-grid,
.result-grid {
  margin-top: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.candidate-card,
.result-card,
.video-card {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-bg);
}

.candidate-card {
  padding: 0;
  text-align: left;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
  }

  &.selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.candidate-image,
.result-image {
  width: 100%;
  aspect-ratio: 9 / 16;
  object-fit: cover;
  display: block;
  background: var(--color-bg-subtle);
}

.candidate-footer {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
  font-weight: 600;
}

.finalize-card {
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  background: var(--color-bg);
}

.finalize-status,
.selection-summary-grid,
.stats-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.finalize-status,
.selection-summary-grid {
  padding: 20px;
}

.selection-summary-grid {
  padding-top: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.selection-summary-item.ready {
  border-color: rgba(37, 99, 235, 0.2);
  background: var(--color-primary-light);
}

.result-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-block {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cover-card {
  max-width: 360px;
}

.result-meta {
  padding: 14px 16px;

  strong {
    display: block;
    color: var(--color-text-primary);
    line-height: 1.5;
  }
}

.result-empty {
  min-height: 240px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  font-size: 14px;
}

.video-card {
  padding: 16px;
}

.result-video {
  width: 100%;
  max-width: 360px;
  aspect-ratio: 9 / 16;
  border-radius: 12px;
  background: #111827;
}

.side-card h3 {
  margin: 0 0 16px;
  color: var(--color-text-primary);
}

.stats-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.status-caption {
  margin: 16px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.quick-shot-list {
  margin-top: 16px;
}

.quick-shot-item {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);

  strong {
    color: inherit;
    font-size: 12px;
  }

  &.selected {
    background: var(--color-primary-light);
    color: var(--color-primary);
    border-color: rgba(37, 99, 235, 0.2);
  }

  &.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
}

.error-card {
  border-color: rgba(220, 38, 38, 0.2);
  background: rgba(220, 38, 38, 0.04);
  color: var(--color-error);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .side-column {
    position: static;
  }
}

@media (max-width: 900px) {
  .workflow-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-card,
  .page-bar,
  .panel-head,
  .shot-head,
  .result-block-head,
  .result-meta,
  .action-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .upload-grid,
  .control-grid,
  .candidate-grid,
  .result-grid,
  .shot-desc-grid,
  .finalize-status,
  .selection-summary-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .shot-switcher {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .upload-box,
  .upload-preview {
    min-height: 260px;
    height: 260px;
  }
}

@media (max-width: 640px) {
  .page-main {
    gap: 20px;
  }

  .workflow-nav {
    grid-template-columns: 1fr;
  }

  .hero-card,
  .panel,
  .side-card {
    padding: 20px;
  }

  .shot-switcher {
    grid-template-columns: 1fr;
  }
}
</style>
