<template>
  <div class="listing-optimize">
    <header class="tool-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <router-link to="/tools/listing">一键生成 Listing</router-link>
          <RightOutlined class="crumb-icon" />
          <span>Listing 优化</span>
        </div>
        <div class="header-right">
          <span class="points"><ThunderboltFilled /> {{ auth.points }} 积分</span>
          <router-link to="/recharge" class="recharge-link">充值</router-link>
        </div>
      </div>
    </header>

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
            市场洞察 <strong>10-20</strong> 积分（无竞品 10 / 有竞品 20），优化消耗 <strong>75</strong> 积分（含合规主图）
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
            <button class="btn-next" :disabled="store.isGenerating || !store.hasPipelineAnalysis" @click="startOptimization">
              <LoadingOutlined v-if="store.isGenerating" class="spin" />
              <RocketOutlined v-else />
              {{ store.isGenerating ? '优化中...' : '自动优化 Listing（75 积分）' }}
            </button>
          </div>
        </div>

        <div v-if="store.isGenerating" class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: store.progress + '%' }"></div>
          </div>
          <span class="progress-text">{{ store.progressMessage }}</span>
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
            <p class="ai-status-text">{{ store.isGenerating ? '正在优化 Listing...' : '优化完成' }}</p>

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
                <span>生成 Amazon 合规主图</span>
              </div>
              <div class="task-item" :class="optTaskStatus('compliance')">
                <span class="task-dot" />
                <span>主图合规检测</span>
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
                <span class="score-label">预估优化后</span>
                <span class="score-value after">{{ Math.min(99, (displayReport.score ?? 60) + 20) }}</span>
              </div>
            </div>
          </aside>

          <div class="opt-content">
            <div v-if="store.isGenerating" class="gen-progress-hint">
              <LoadingOutlined class="spin" />
              <span>{{ store.progressMessage || '优化中，请稍候...' }}</span>
            </div>

            <ListingResult
              v-if="store.hasGeneratedListing"
              :listing="store.generatedListing"
              :images="store.generatedImages"
              :main-image="store.mainImageUrl"
              :compliance-result="store.complianceResult"
              @regenerate="handleRegenerate"
              @update-listing="onUpdateListing"
            />

            <div v-if="!store.isGenerating && !store.hasGeneratedListing" class="empty-state">
              <p>正在准备优化...</p>
            </div>
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
      </div>

      <!-- Step 3: 结果编辑与导出 -->
      <div v-show="store.currentStep === 3" class="step-content">
        <ListingResult
          :listing="store.generatedListing"
          :images="store.generatedImages"
          :main-image="store.mainImageUrl"
          :compliance-result="store.complianceResult"
          @regenerate="handleRegenerate"
          @update-listing="onUpdateListing"
        />

        <MainImageCompliance
          v-if="store.complianceResult"
          :result="store.complianceResult"
          :is-regenerating="store.isGenerating"
          @regenerate="regenerateMainImage"
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
  RobotOutlined, RocketOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import { useListingStore } from '@/stores/listing'
import { listingService } from '@/services/listing.service'
import { runAnalysisPipeline } from '@/services/pipeline'
import { LISTING_POINTS_COST } from '@/config/listing.config'
import { adaptPipelineReportToDisplay } from '@/utils/adaptPipelineReport'
import StepIndicator from './components/StepIndicator.vue'
import AnalysisReport from './components/AnalysisReport.vue'
import ListingResult from './components/ListingResult.vue'
import MainImageCompliance from './components/MainImageCompliance.vue'
import AddonServices from './components/AddonServices.vue'

const auth = useAuthStore()
const store = useListingStore()
const optimizeLang = ref('en')

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

type OptPhase = 'idle' | 'rewrite' | 'bullets' | 'desc' | 'mainImage' | 'compliance' | 'done'
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
  const order: OptPhase[] = ['rewrite', 'bullets', 'desc', 'mainImage', 'compliance']
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
      market: 'us',
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

  const totalCost = 75
  if (auth.points < totalCost) {
    message.warning(`积分不足，优化生成需要 ${totalCost} 积分（当前 ${auth.points}）`)
    return
  }

  store.isGenerating = true
  store.progress = 0
  store.nextStep()

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
        market: 'us',
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
    store.updateProgress(58, '正在生成 Amazon 合规主图...')

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

      // Phase 5: compliance check
      optPhase.value = 'compliance'
      store.updateProgress(82, '正在进行主图合规检测...')

      const compliance = await listingService.checkMainImageCompliance(
        imgResult.imageUrl,
        (p, msg) => store.updateProgress(Math.min(98, 82 + p * 0.16), msg)
      )
      store.complianceResult = compliance
    } else {
      store.mainImageUrl = null
      store.complianceResult = null
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

async function regenerateMainImage() {
  if (!store.strategyPrompts) {
    message.warning('无法重新生成：缺少策略数据')
    return
  }

  store.isGenerating = true
  store.updateProgress(0, '正在重新生成主图...')

  const productName = store.userListingData?.title || store.extractedAsin
  const features = store.generatedListing?.bulletPoints.join(', ') || ''
  const refImages = store.userListingData?.secondaryImageUrls ?? []

  try {
    const imgResult = await listingService.generateMainImageFromStrategy(
      refImages,
      productName,
      features,
      store.strategyPrompts,
      (p, msg) => store.updateProgress(Math.min(60, p * 0.6), msg)
    )

    if (imgResult.success && imgResult.imageUrl) {
      store.mainImageUrl = imgResult.imageUrl
      store.generatedImages = [imgResult.imageUrl]

      store.updateProgress(65, '正在重新检测合规...')
      const compliance = await listingService.checkMainImageCompliance(
        imgResult.imageUrl,
        (p, msg) => store.updateProgress(Math.min(98, 65 + p * 0.33), msg)
      )
      store.complianceResult = compliance
      store.updateProgress(100, '完成')
      message.success(compliance.passed ? '主图合规检测通过！' : '主图已重新生成，请查看合规报告')
    } else {
      message.error(imgResult.error || '主图重新生成失败')
    }
  } catch (err) {
    message.error('重新生成失败，请重试')
    console.error('[ListingOptimize] main image regeneration error:', err)
  } finally {
    store.isGenerating = false
  }
}

async function handleRegenerate(_field: string) {
  if (!store.strategyPrompts) return
  message.info('正在重新优化...')
  store.setStep(1)
  optPhase.value = 'idle'
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
  background: #ffffff;
}

.tool-header {
  background: #fff; border-bottom: 1px solid #e5e7eb; padding: 12px 20px;
  .header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .breadcrumb {
    font-size: 14px; color: #6b7280; display: flex; align-items: center; gap: 8px;
    a { color: #2563eb; text-decoration: none; &:hover { text-decoration: underline; } }
    .crumb-icon { font-size: 10px; }
  }
  .header-right { display: flex; align-items: center; gap: 16px; font-size: 14px; }
  .points { color: #6b7280; }
  .recharge-link { color: #2563eb; text-decoration: none; }
}

.optimize-main { max-width: 1100px; margin: 0 auto; padding: 24px 24px 80px; }
.step-content { margin-top: 8px; }

.asin-entry {
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px;
  padding: 40px 32px; display: flex; flex-direction: column; align-items: center;
  gap: 12px; text-align: center; max-width: 640px; margin: 0 auto;
  .entry-icon-wrap {
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    display: flex; align-items: center; justify-content: center;
    .entry-icon { font-size: 28px; color: #d97706; }
  }
  .entry-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0; }
  .entry-desc { font-size: 14px; color: #6b7280; margin: 0; max-width: 480px; line-height: 1.6; }
}

.asin-input-wrapper {
  width: 100%; max-width: 500px; position: relative; margin-top: 8px;
  .input-prefix { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; color: #9ca3af; }
  .asin-input {
    width: 100%; padding: 14px 14px 14px 42px; border: 1px solid #d1d5db; border-radius: 12px;
    font-size: 15px; color: #111827; transition: border-color 0.2s;
    &:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
  }
}

.extracted-hint {
  font-size: 13px; color: #059669; display: flex; align-items: center; gap: 6px;
  .check-icon { font-size: 14px; }
  strong { color: #111827; }
}

.competitor-section {
  width: 100%; max-width: 500px; margin-top: 16px; text-align: left;
  .section-label { font-size: 13px; color: #6b7280; display: block; margin-bottom: 8px; }
  .asin-row {
    display: flex; gap: 8px; margin-bottom: 8px;
    .asin-field {
      flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;
      &:focus { outline: none; border-color: #2563eb; }
    }
    .rm-btn { width: 36px; height: 36px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; color: #ef4444; cursor: pointer; font-size: 18px; }
  }
  .add-btn { padding: 6px 0; font-size: 14px; color: #2563eb; background: none; border: none; cursor: pointer; &:hover { text-decoration: underline; } }
}

.extra-section {
  width: 100%; max-width: 500px; margin-top: 16px; text-align: left;
  .section-label { font-size: 13px; color: #6b7280; display: block; margin-bottom: 8px; }
  .extra-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .extra-label { font-size: 13px; color: #6b7280; min-width: 80px; }
  .asin-field { flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; &:focus { outline: none; border-color: #2563eb; } }
  .audience-field { flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; resize: vertical; &:focus { outline: none; border-color: #2563eb; } }
}

.lang-section { display: flex; align-items: center; gap: 12px; margin-top: 8px; .lang-label { font-size: 14px; color: #374151; } }
.lang-toggle {
  display: flex; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden;
  .lang-btn {
    padding: 7px 18px; font-size: 13px; border: none; background: #fff; color: #6b7280; cursor: pointer; transition: all 0.2s;
    &.active { background: #2563eb; color: #fff; }
    &:not(.active):hover { background: #f3f4f6; }
  }
}

.step-footer {
  margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;
  display: flex; align-items: center; justify-content: space-between;
}
.cost-hint { font-size: 13px; color: #6b7280; .cost-icon { color: #f59e0b; margin-right: 2px; } strong { color: #111827; } }
.footer-actions { display: flex; gap: 12px; }

.btn-back, .btn-next, .btn-finish {
  display: flex; align-items: center; gap: 6px; padding: 10px 20px;
  border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none;
}
.btn-back { background: #fff; color: #6b7280; border: 1px solid #d1d5db; &:hover { background: #f3f4f6; color: #374151; } }
.btn-next { background: #2563eb; color: #fff; &:hover:not(:disabled) { background: #1d4ed8; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btn-finish { background: #059669; color: #fff; &:hover { background: #047857; } }

.progress-section {
  margin-top: 16px; display: flex; flex-direction: column; gap: 6px;
  .progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: #2563eb; border-radius: 3px; transition: width 0.3s; }
  .progress-text { font-size: 13px; color: #6b7280; }
}

.optimize-layout {
  display: grid; grid-template-columns: 260px 1fr; gap: 28px; align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.ai-status-panel {
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px;
  padding: 24px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px;
  position: sticky; top: 24px;
  .ai-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg, #d97706, #f59e0b);
    display: flex; align-items: center; justify-content: center;
    .ai-icon { font-size: 26px; color: #fff; }
  }
  .ai-name { font-size: 16px; font-weight: 700; color: #111827; margin: 0; }
  .ai-status-text { font-size: 13px; color: #6b7280; margin: 0; text-align: center; }
}

.task-list { width: 100%; display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
.task-item {
  display: flex; align-items: center; gap: 10px; font-size: 13px; color: #9ca3af;
  .task-dot { width: 10px; height: 10px; border-radius: 50%; background: #d1d5db; flex-shrink: 0; transition: all 0.3s; }
  &.completed { color: #059669; .task-dot { background: #059669; } }
  &.active { color: #2563eb; font-weight: 600; .task-dot { background: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2); } }
}

.overall-progress {
  width: 100%; display: flex; align-items: center; gap: 8px; margin-top: 8px;
  .progress-bar { flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: #2563eb; border-radius: 3px; transition: width 0.3s; }
  .progress-label { font-size: 12px; font-weight: 700; color: #2563eb; min-width: 32px; text-align: right; }
}

.score-compare {
  display: flex; align-items: center; gap: 12px; margin-top: 12px; padding: 12px; background: #fff;
  border-radius: 10px; border: 1px solid #e5e7eb; width: 100%;
  .score-before, .score-after { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; }
  .score-label { font-size: 11px; color: #6b7280; }
  .score-value { font-size: 22px; font-weight: 800; &.before { color: #dc2626; } &.after { color: #059669; } }
  .score-arrow { font-size: 14px; color: #9ca3af; }
}

.opt-content { min-height: 300px; }
.gen-progress-hint {
  display: flex; align-items: center; gap: 10px; padding: 16px;
  background: #eff6ff; border-radius: 10px; font-size: 14px; color: #2563eb; margin-bottom: 20px;
}
.empty-state { display: flex; align-items: center; justify-content: center; min-height: 200px; p { color: #9ca3af; font-size: 14px; } }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
