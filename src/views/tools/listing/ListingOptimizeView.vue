<template>
  <div class="listing-optimize">
    <ListingToolHeader breadcrumb-label="Listing 优化" />

    <main class="optimize-main">
      <StepIndicator
        :steps="['输入 ASIN', 'AI 分析', '优化生成', '结果编辑']"
        :current="store.currentStep"
      />

      <!-- Step 0: 输入 ASIN -->
      <div v-show="store.currentStep === 0" class="step-content">
        <div class="asin-entry">
          <div class="entry-icon-wrap">
            <SearchOutlined class="entry-icon" />
          </div>
          <h3 class="entry-title">输入商品 ASIN 或链接</h3>
          <p class="entry-desc">输入你想优化的 Amazon 商品 ASIN 编码或粘贴商品链接，AI 将自动分析现有 Listing 的亮点与不足</p>

          <div class="asin-input-wrapper">
            <SearchOutlined class="input-prefix" />
            <input
              v-model="store.asinInput"
              class="asin-input"
              placeholder="输入 ASIN（如 B09V3K1234）或粘贴 Amazon 商品链接"
              @input="onAsinInput"
              @keyup.enter="startAnalysis"
            />
          </div>

          <p v-if="store.extractedAsin" class="extracted-hint">
            <CheckCircleFilled class="check-icon" />
            已识别 ASIN：<strong>{{ store.extractedAsin }}</strong>
          </p>

          <div class="competitor-section">
            <label class="section-label">竞品 ASIN（可选，用于对比分析；无竞品时将基于最佳实践优化）</label>
            <div v-for="(asin, idx) in store.competitorAsins" :key="idx" class="asin-row">
              <input
                :value="asin"
                class="asin-field"
                placeholder="竞品 ASIN 或链接"
                @input="store.updateCompetitorAsin(idx, ($event.target as HTMLInputElement).value)"
              />
              <button v-if="store.competitorAsins.length > 1" class="rm-btn" @click="store.removeCompetitorAsin(idx)">×</button>
            </div>
            <button v-if="store.competitorAsins.length < 3" class="add-btn" @click="store.addCompetitorAsin()">+ 添加竞品</button>
          </div>

          <div v-if="!hasAtLeastOneCompetitor" class="extra-section">
            <label class="section-label">补充信息（可选，无竞品时可帮助 AI 更好理解优化方向）</label>
            <div class="extra-row">
              <span class="extra-label">目标关键词</span>
              <input
                :value="store.targetKeywords.join(', ')"
                class="asin-field"
                placeholder="如：wireless earbuds, bluetooth 5.0"
                @input="onTargetKeywordsInput($event)"
              />
            </div>
            <div class="extra-row">
              <span class="extra-label">目标受众</span>
              <textarea
                :value="store.targetAudience"
                class="audience-field"
                placeholder="如：年轻上班族、通勤、运动爱好者"
                rows="2"
                @input="store.updateTargetAudience(($event.target as HTMLTextAreaElement).value)"
              />
            </div>
          </div>

          <div class="lang-section">
            <label class="lang-label">目标站点</label>
            <div class="market-toggle">
              <button
                v-for="m in TARGET_MARKETS"
                :key="m.value"
                class="lang-btn"
                :class="{ active: optimizeMarket === m.value }"
                @click="optimizeMarket = m.value"
              >{{ m.label }}</button>
            </div>
          </div>
          <div class="lang-section">
            <label class="lang-label">优化输出语言</label>
            <div class="lang-toggle">
              <button
                class="lang-btn"
                :class="{ active: optimizeLang === 'en' }"
                @click="optimizeLang = 'en'"
              >English</button>
              <button
                class="lang-btn"
                :class="{ active: optimizeLang === 'zh' }"
                @click="optimizeLang = 'zh'"
              >中文</button>
            </div>
          </div>
        </div>

        <div class="step-footer">
          <div class="cost-hint">
            <ThunderboltFilled class="cost-icon" />
            市场洞察 <strong>{{ LISTING_POINTS_COST.marketInsightWithoutCompetitors }}-{{ LISTING_POINTS_COST.marketInsightWithCompetitors }}</strong> 积分（无竞品 {{ LISTING_POINTS_COST.marketInsightWithoutCompetitors }} / 有竞品 {{ LISTING_POINTS_COST.marketInsightWithCompetitors }}），优化消耗 <strong>{{ LISTING_POINTS_COST.fullGeneration }}</strong> 积分（含合规主图）
          </div>
          <div class="footer-actions">
            <button class="btn-back" @click="$router.push('/tools/listing')">
              <ArrowLeftOutlined /> 返回
            </button>
            <button
              class="btn-next"
              :disabled="!store.extractedAsin || store.isAnalyzing"
              @click="startAnalysis"
            >
              <LoadingOutlined v-if="store.isAnalyzing" class="spin" />
              <ExperimentOutlined v-else />
              {{ store.isAnalyzing ? '分析中...' : '开始分析' }}
            </button>
          </div>
        </div>

        <div v-if="store.isAnalyzing" class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: store.progress + '%' }"></div>
          </div>
          <span class="progress-text">{{ store.progressMessage }}</span>
        </div>
      </div>

      <!-- Step 1: AI 分析报告 -->
      <div v-show="store.currentStep === 1" class="step-content">
        <AnalysisReport
          v-if="displayReport"
          title="Listing 分析报告"
          :score="displayReport.score"
          :strengths="displayReport.strengths"
          :weaknesses="displayReport.weaknesses"
          :suggestions="displayReport.suggestions"
          :keywords="displayReport.keywords"
          :missing-keywords="displayReport.missingKeywords"
        />

        <div class="step-footer">
          <div></div>
          <div class="footer-actions">
            <button class="btn-back" @click="store.prevStep()">
              <ArrowLeftOutlined /> 上一步
            </button>
            <button class="btn-next" :disabled="!store.hasPipelineAnalysis" @click="store.nextStep()">
              下一步：优化生成 <ArrowRightOutlined />
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2: 优化生成 -->
      <div v-show="store.currentStep === 2" class="step-content">
        <div class="optimize-layout">
          <aside class="ai-status-panel">
            <div class="ai-avatar">
              <RobotOutlined class="ai-icon" />
            </div>
            <h4 class="ai-name">Moly AI</h4>
            <p class="ai-status-text">{{ store.isGenerating ? '正在优化 Listing...' : (store.hasGeneratedListing ? '优化完成' : '准备就绪') }}</p>

            <div class="task-list">
              <div class="task-item" :class="optTaskStatus('rewrite')">
                <span class="task-dot" />
                <span>重写标题与关键词</span>
              </div>
              <div class="task-item" :class="optTaskStatus('bullets')">
                <span class="task-dot" />
                <span>优化五点描述</span>
              </div>
              <div class="task-item" :class="optTaskStatus('desc')">
                <span class="task-dot" />
                <span>优化产品描述</span>
              </div>
              <div class="task-item" :class="optTaskStatus('mainImage')">
                <span class="task-dot" />
                <span>生成 Amazon 主图</span>
              </div>
            </div>

            <div v-if="store.isGenerating" class="overall-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: store.progress + '%' }"></div>
              </div>
              <span class="progress-label">{{ store.progress }}%</span>
            </div>

            <div v-if="displayReport?.score !== undefined" class="score-compare">
              <div class="score-before">
                <span class="score-label">优化前</span>
                <span class="score-value before">{{ displayReport.score }}</span>
              </div>
              <ArrowRightOutlined class="score-arrow" />
              <div class="score-after">
                <span class="score-label">预估优化后（示意）</span>
                <span class="score-value after">{{ Math.min(99, (displayReport.score ?? 60) + 20) }}</span>
              </div>
            </div>
          </aside>

          <div class="opt-content">
            <div v-if="!store.isGenerating && !store.hasGeneratedListing" class="opt-start">
              <div class="opt-start-info">
                <h3>准备优化 Listing</h3>
                <p v-if="store.hasPipelineAnalysis">
                  AI 将基于分析报告，优化你的标题、五点、描述并生成合规主图。
                </p>
                <p v-else class="opt-hint">
                  请先完成上一步「AI 分析」，以便开始优化。
                </p>
                <p v-if="store.hasPipelineAnalysis && !hasRefImagesForMainImage" class="opt-hint ref-images-hint">
                  当前商品无副图参考，主图生成质量可能受限。若商品页有多张图片，抓取数据将更完整。
                </p>
                <div class="cost-summary">
                  <div class="cost-row">
                    <span>标题 + 五点描述</span>
                    <span><ThunderboltFilled class="cost-icon" /> 20 积分</span>
                  </div>
                  <div class="cost-row">
                    <span>产品描述</span>
                    <span><ThunderboltFilled class="cost-icon" /> 15 积分</span>
                  </div>
                  <div class="cost-row">
                    <span>搜索关键词</span>
                    <span><ThunderboltFilled class="cost-icon" /> 10 积分</span>
                  </div>
                  <div class="cost-row">
                    <span>Amazon 合规主图</span>
                    <span><ThunderboltFilled class="cost-icon" /> 30 积分</span>
                  </div>
                  <div class="cost-row total">
                    <span>合计</span>
                    <span><ThunderboltFilled class="cost-icon" /> {{ LISTING_POINTS_COST.fullGeneration }} 积分</span>
                  </div>
                </div>
              </div>
              <button
                class="btn-generate"
                :disabled="!store.hasPipelineAnalysis"
                @click="startOptimization"
              >
                <ExperimentOutlined /> 开始优化
              </button>
            </div>

            <div v-if="store.isGenerating" class="gen-progress-hint">
              <LoadingOutlined class="spin" />
              <span>{{ store.progressMessage || '优化中，请稍候...' }}</span>
            </div>

            <ListingResult
              v-if="store.hasGeneratedListing"
              :listing="store.generatedListing"
              :images="store.generatedImages"
              :main-image="store.mainImageUrl"
              @update-listing="onUpdateListing"
            />
          </div>
        </div>

        <div v-if="store.hasGeneratedListing" class="step-footer">
          <div></div>
          <div class="footer-actions">
            <button class="btn-back" @click="store.prevStep()">
              <ArrowLeftOutlined /> 上一步
            </button>
            <button class="btn-next" @click="store.nextStep()">
              查看完整结果 <ArrowRightOutlined />
            </button>
          </div>
        </div>
        <div v-else-if="!store.isGenerating" class="step-footer">
          <div></div>
          <div class="footer-actions">
            <button class="btn-back" @click="store.prevStep()">
              <ArrowLeftOutlined /> 上一步
            </button>
          </div>
        </div>
      </div>

      <!-- Step 3: 结果编辑与导出 -->
      <div v-show="store.currentStep === 3" class="step-content">
        <ListingResult
          :listing="store.generatedListing"
          :images="store.generatedImages"
          :main-image="store.mainImageUrl"
          @update-listing="onUpdateListing"
        />

        <AddonServices />

        <div class="step-footer">
          <div class="cost-hint">
            <ThunderboltFilled class="cost-icon" />
            本次共消耗 <strong>{{ store.totalPointsCost }}</strong> 积分
          </div>
          <div class="footer-actions">
            <button class="btn-back" @click="store.prevStep()">
              <ArrowLeftOutlined /> 上一步
            </button>
            <button class="btn-finish" @click="$router.push('/tools/listing')">
              完成
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  RightOutlined, ThunderboltFilled, ArrowLeftOutlined, ArrowRightOutlined,
  SearchOutlined, CheckCircleFilled, ExperimentOutlined, LoadingOutlined,
  RobotOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import { useListingStore } from '@/stores/listing'
import { listingService } from '@/services/listing.service'
import { runAnalysisPipeline } from '@/services/pipeline'
import { LISTING_POINTS_COST, TARGET_MARKETS } from '@/config/listing.config'
import { adaptPipelineReportToDisplay } from '@/utils/adaptPipelineReport'
import ListingToolHeader from './components/ListingToolHeader.vue'
import StepIndicator from './components/StepIndicator.vue'
import AnalysisReport from './components/AnalysisReport.vue'
import ListingResult from './components/ListingResult.vue'
import AddonServices from './components/AddonServices.vue'

const auth = useAuthStore()
const store = useListingStore()
const optimizeLang = ref('en')
const optimizeMarket = ref('us')

const hasAtLeastOneCompetitor = computed(() =>
  store.competitorAsins.some((a) => {
    const t = a.trim()
    return t.length >= 10 || t.includes('amazon')
  })
)

const displayReport = computed(() => {
  if (!store.analysisReport) return null
  return adaptPipelineReportToDisplay(store.analysisReport)
})

const hasRefImagesForMainImage = computed(
  () => (store.userListingData?.secondaryImageUrls?.length ?? 0) > 0
)

type OptPhase = 'idle' | 'rewrite' | 'bullets' | 'desc' | 'mainImage' | 'done'
const optPhase = ref<OptPhase>('idle')

function onAsinInput() {
  const extracted = listingService.extractAsin(store.asinInput)
  store.extractedAsin = extracted || ''
}

function onTargetKeywordsInput(ev: Event) {
  const raw = (ev.target as HTMLInputElement).value
  const kw = raw.split(/[,，;；]/).map(k => k.trim()).filter(Boolean)
  store.updateTargetKeywords(kw)
}

function optTaskStatus(phase: string) {
  const order: OptPhase[] = ['rewrite', 'bullets', 'desc', 'mainImage']
  const currentIdx = order.indexOf(optPhase.value as OptPhase)
  const phaseIdx = order.indexOf(phase as OptPhase)
  if (optPhase.value === 'done') return 'completed'
  if (phaseIdx < currentIdx) return 'completed'
  if (phaseIdx === currentIdx) return 'active'
  return 'pending'
}

async function startAnalysis() {
  if (!store.extractedAsin) {
    message.warning('请输入有效的 ASIN 或 Amazon 商品链接')
    return
  }

  const competitorList = store.competitorAsins
    .map((a) => a.trim())
    .filter((a) => a.length >= 10 || a.includes('amazon'))
    .map((a) => listingService.extractAsin(a) || a.substring(0, 10).toUpperCase())

  const cost = competitorList.length > 0
    ? LISTING_POINTS_COST.marketInsightWithCompetitors
    : LISTING_POINTS_COST.marketInsightWithoutCompetitors

  if (auth.points < cost) {
    message.warning(`积分不足，市场洞察需要 ${cost} 积分`)
    return
  }

  store.isAnalyzing = true
  store.progress = 0
  store.progressMessage = competitorList.length > 0 ? '开始分析...' : '正在分析类目最佳实践...'

  try {
    const params: Parameters<typeof runAnalysisPipeline>[0] = {
      mode: 'optimize',
      userAsin: store.extractedAsin,
      competitorAsins: competitorList,
      market: optimizeMarket.value,
      language: optimizeLang.value,
    }
    if (competitorList.length === 0) {
      params.targetKeywords = store.targetKeywords.length ? store.targetKeywords : undefined
      params.targetAudience = store.targetAudience || undefined
    }

    const result = await runAnalysisPipeline(
      params,
      (info) => {
        const p = info.step && info.totalSteps ? Math.round((info.step / info.totalSteps) * 100) : info.progress ?? 0
        store.updateProgress(p, info.message ?? '')
      }
    )
    store.analysisReport = result.analysisReport
    store.strategyPrompts = result.strategyPrompts
    store.pipelineExtractedData = result.extractedData
    store.setUserListingData(result.userListingData ?? null)
    auth.deductPoints(cost, `市场洞察 (${store.extractedAsin})`)
    store.nextStep()
    message.success('分析完成！')
  } catch (err: any) {
    message.error(err?.message || '分析失败，请重试')
    console.error('[ListingOptimize] analysis error:', err)
  } finally {
    store.isAnalyzing = false
  }
}

async function startOptimization() {
  if (!store.strategyPrompts || !store.analysisReport) return

  const totalCost = LISTING_POINTS_COST.fullGeneration
  if (auth.points < totalCost) {
    message.warning(`积分不足，优化生成需要 ${totalCost} 积分（当前 ${auth.points}）`)
    return
  }

  store.isGenerating = true
  store.progress = 0

  const productName = store.userListingData?.title || store.extractedAsin
  const features = store.userListingData?.bulletPoints.join(', ') || ''

  try {
    optPhase.value = 'rewrite'
    store.updateProgress(10, '正在重写标题与关键词...')

    optPhase.value = 'bullets'
    store.updateProgress(25, '正在优化五点描述...')

    optPhase.value = 'desc'
    store.updateProgress(40, '正在优化产品描述...')

    const listing = await listingService.generateListingTextFromStrategy(
      {
        mode: 'optimize',
        userListing: store.userListingData ?? undefined,
        strategyPrompts: store.strategyPrompts,
        language: optimizeLang.value,
        market: optimizeMarket.value,
      },
      (p, msg) => {
        const mapped = 10 + p * 0.45
        store.updateProgress(Math.min(55, mapped), msg)
      }
    )
    store.generatedListing = listing

    if (store.userListingData && store.analysisReport) {
      const comp = await listingService.compareListing(
        store.userListingData,
        listing,
        store.analysisReport,
        (p, msg) => store.updateProgress(Math.min(58, 50 + p * 0.08), msg ?? '正在生成对比报告...')
      )
      store.comparison = comp
    }

    optPhase.value = 'mainImage'
    const hasRefImages = (store.userListingData?.secondaryImageUrls?.length ?? 0) > 0
    store.updateProgress(58, hasRefImages ? '正在生成 Amazon 合规主图...' : '正在生成主图（无参考图时质量可能受限）...')

    const imgResult = await listingService.generateMainImageFromStrategy(
      store.userListingData?.secondaryImageUrls ?? [],
      productName,
      features,
      store.strategyPrompts,
      (p, msg) => store.updateProgress(Math.min(80, 58 + p * 0.22), msg)
    )

    if (imgResult.success && imgResult.imageUrl) {
      store.mainImageUrl = imgResult.imageUrl
      store.generatedImages = [imgResult.imageUrl]
    } else {
      store.mainImageUrl = null
      message.warning('主图生成失败，文案已优化成功，可稍后重试主图')
    }

    optPhase.value = 'done'
    store.updateProgress(100, '优化完成！')

    auth.deductPoints(totalCost, `Listing 优化（文案 + 合规主图）(${store.extractedAsin})`)
    message.success('Listing 优化成功！')
  } catch (err) {
    message.error('优化失败，请重试')
    console.error('[ListingOptimize] optimization error:', err)
    optPhase.value = 'idle'
    store.prevStep()
  } finally {
    store.isGenerating = false
  }
}

function onUpdateListing(payload: { field: 'title' | 'bullets' | 'description'; value: string | string[] }) {
  if (payload.field === 'title' && typeof payload.value === 'string') {
    store.updateGeneratedListing({ title: payload.value })
  } else if (payload.field === 'description' && typeof payload.value === 'string') {
    store.updateGeneratedListing({ description: payload.value })
  } else if (payload.field === 'bullets' && Array.isArray(payload.value)) {
    store.updateGeneratedListing({ bulletPoints: payload.value })
  }
}
</script>

<style scoped lang="scss">
.listing-optimize {
  min-height: 100vh;
  background: var(--color-bg);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
}

.market-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  .lang-btn {
    padding: 7px 14px;
    font-size: 13px;
    border: 1px solid var(--color-border-muted);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    &.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    &:not(.active):hover { background: var(--color-border-light); }
  }
}

.optimize-main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}
.step-content { margin-top: 24px; }

.asin-entry {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  max-width: 640px;
  margin: 0 auto;
  .entry-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    display: flex;
    align-items: center;
    justify-content: center;
    .entry-icon { font-size: 28px; color: #d97706; }
  }
  .entry-title { font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
  .entry-desc { font-size: 14px; color: var(--color-text-secondary); margin: 0; max-width: 480px; line-height: 1.6; }
}

.asin-input-wrapper {
  width: 100%;
  max-width: 500px;
  position: relative;
  margin-top: 8px;
  .input-prefix { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; color: var(--color-text-tertiary); }
  .asin-input {
    width: 100%;
    padding: 14px 14px 14px 42px;
    border: 1px solid var(--color-border-muted);
    border-radius: var(--radius-lg);
    font-size: 15px;
    color: var(--color-text-primary);
    transition: border-color 0.2s;
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  }
}

.extracted-hint {
  font-size: 13px;
  color: var(--color-success);
  display: flex;
  align-items: center;
  gap: 6px;
  .check-icon { font-size: 14px; }
  strong { color: var(--color-text-primary); }
}

.competitor-section {
  width: 100%;
  max-width: 500px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
  text-align: left;
  .section-label { font-size: 13px; color: var(--color-text-secondary); display: block; margin-bottom: 8px; }
  .asin-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    .asin-field {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid var(--color-border-muted);
      border-radius: var(--radius-md);
      font-size: 14px;
      &:focus { outline: none; border-color: var(--color-primary); }
    }
    .rm-btn {
      width: 36px;
      height: 36px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg);
      color: var(--color-error);
      cursor: pointer;
      font-size: 18px;
    }
  }
  .add-btn { padding: 6px 0; font-size: 14px; color: var(--color-primary); background: none; border: none; cursor: pointer; &:hover { text-decoration: underline; } }
}

.extra-section {
  width: 100%;
  max-width: 500px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
  text-align: left;
  .section-label { font-size: 13px; color: var(--color-text-secondary); display: block; margin-bottom: 8px; }
  .extra-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .extra-label { font-size: 13px; color: var(--color-text-secondary); min-width: 80px; }
  .asin-field { flex: 1; padding: 10px 12px; border: 1px solid var(--color-border-muted); border-radius: var(--radius-md); font-size: 14px; &:focus { outline: none; border-color: var(--color-primary); } }
  .audience-field { flex: 1; padding: 10px 12px; border: 1px solid var(--color-border-muted); border-radius: var(--radius-md); font-size: 14px; resize: vertical; &:focus { outline: none; border-color: var(--color-primary); } }
}

.lang-section { display: flex; align-items: center; gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--color-border); }
.lang-label { font-size: 14px; color: var(--color-text-primary); }
.lang-toggle {
  display: flex;
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  overflow: hidden;
  .lang-btn {
    padding: 7px 18px;
    font-size: 13px;
    border: none;
    background: var(--color-bg);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    &.active { background: var(--color-primary); color: #fff; }
    &:not(.active):hover { background: var(--color-border-light); }
  }
}

.step-footer {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cost-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  .cost-icon { color: var(--color-warning-icon); margin-right: 2px; }
  strong { color: var(--color-text-primary); }
}
.footer-actions { display: flex; gap: 12px; }

.btn-back, .btn-next, .btn-finish, .btn-generate {
  display: flex;
  align-items: center;
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
  &:hover { background: var(--color-border-light); color: var(--color-text-primary); }
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
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
}
.btn-finish {
  background: var(--color-success-cta);
  color: #fff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  &:hover {
    background: var(--color-success);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }
}
.btn-generate {
  background: var(--color-success-cta);
  color: #fff;
  font-size: 16px;
  padding: 14px 32px;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
  &:hover:not(:disabled) {
    background: var(--color-success);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
}

.progress-section {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  .progress-bar { height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--color-primary); border-radius: 3px; transition: width 0.3s; }
  .progress-text { font-size: 13px; color: var(--color-text-secondary); }
}

.optimize-layout {
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

  .ai-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-primary), #7c3aed);
    display: flex;
    align-items: center;
    justify-content: center;
    .ai-icon { font-size: 26px; color: #fff; }
  }
  .ai-name { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
  .ai-status-text { font-size: 13px; color: var(--color-text-secondary); margin: 0; text-align: center; }
}

.task-list { width: 100%; display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
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
  .progress-bar { flex: 1; height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--color-primary); border-radius: 3px; transition: width 0.3s; }
  .progress-label { font-size: 12px; font-weight: 700; color: var(--color-primary); min-width: 36px; text-align: right; }
}

.score-compare {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  width: 100%;
  .score-before, .score-after { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; }
  .score-label { font-size: 11px; color: var(--color-text-secondary); }
  .score-value { font-size: 22px; font-weight: 800; &.before { color: var(--color-error); } &.after { color: var(--color-success); } }
  .score-arrow { font-size: 14px; color: var(--color-text-tertiary); }
}

.opt-content { min-height: 300px; }

.opt-start {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  text-align: center;

  h3 { font-size: 20px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
  p { font-size: 14px; color: var(--color-text-secondary); margin: 0; max-width: 480px; }
  .opt-hint { color: var(--color-warning); }
}

.cost-summary {
  width: 100%;
  max-width: 340px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  .cost-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: var(--color-text-secondary);
    .cost-icon { color: var(--color-warning-icon); font-size: 12px; }
    &.total {
      padding-top: 12px;
      margin-top: 4px;
      border-top: 1px solid var(--color-border);
      font-weight: 700;
      color: var(--color-text-primary);
    }
  }
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
  margin-bottom: 24px;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
