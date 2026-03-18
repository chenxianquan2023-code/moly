<template>
  <div class="listing-create">
    <header class="tool-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <router-link to="/tools/listing">一键生成 Listing</router-link>
          <RightOutlined class="crumb-icon" />
          <span>首次创作</span>
        </div>
        <div class="header-right">
          <span class="points"><ThunderboltFilled /> {{ auth.points }} 积分</span>
          <router-link to="/recharge" class="recharge-link">充值</router-link>
        </div>
      </div>
    </header>

    <main class="create-main">
      <StepIndicator
        :steps="['商品信息', '市场洞察', 'AI 生成', '结果预览']"
        :current="store.currentStep"
      />

      <!-- Step 0: 商品信息 -->
      <div v-show="store.currentStep === 0" class="step-content">
        <ProductInfoForm />
        <div class="step-footer">
          <div class="cost-hint">
            <ThunderboltFilled class="cost-icon" />
            预估消耗 <strong>75</strong> 积分（含文案 + 合规主图）
          </div>
          <div class="footer-actions">
            <button class="btn-back" @click="$router.push('/tools/listing')">
              <ArrowLeftOutlined /> 返回
            </button>
            <button
              class="btn-next"
              @click="handleStep0Next"
            >
              下一步：市场洞察 <ArrowRightOutlined />
            </button>
          </div>
        </div>
      </div>

      <!-- 缺项预览 Modal -->
      <div v-if="showMissingFieldsModal" class="modal-mask" @click.self="showMissingFieldsModal = false">
        <div class="missing-fields-modal">
          <h4 class="modal-title">请完善以下必填项</h4>
          <p class="modal-desc">以下信息将直接影响 Listing 质量，建议填写后再继续。</p>
          <table class="preview-table">
            <thead>
              <tr>
                <th>缺项</th>
                <th>若未填写，AI 可能…</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="key in missingFieldsList" :key="key">
                <td>{{ REQUIRED_FIELD_LABELS[key] || key }}</td>
                <td>{{ MISSING_FIELD_PREVIEWS[key] || '可能影响生成质量' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="modal-actions">
            <button class="btn-fill" @click="showMissingFieldsModal = false">
              返回填写
            </button>
            <button class="btn-force" @click="forceContinue">
              强制继续（不推荐）
            </button>
          </div>
        </div>
      </div>

      <!-- Step 1: 市场洞察 -->
      <div v-show="store.currentStep === 1" class="step-content">
        <CompetitorAnalysis
          @analyze="runCompetitorAnalysis"
          @skip="runMarketInsightNoCompetitors"
        />
        <div v-if="store.hasPipelineAnalysis" class="step-footer">
          <div></div>
          <div class="footer-actions">
            <button class="btn-back" @click="store.prevStep()">
              <ArrowLeftOutlined /> 上一步
            </button>
            <button class="btn-next" @click="store.nextStep()">
              下一步：AI 生成 <ArrowRightOutlined />
            </button>
          </div>
        </div>
        <div v-else-if="!store.isAnalyzing" class="step-footer">
          <div></div>
          <div class="footer-actions">
            <button class="btn-back" @click="store.prevStep()">
              <ArrowLeftOutlined /> 上一步
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2: AI 生成中 -->
      <div v-show="store.currentStep === 2" class="step-content">
        <div class="generating-layout">
          <aside class="ai-status-panel">
            <div class="ai-avatar">
              <RobotOutlined class="ai-icon" />
            </div>
            <h4 class="ai-name">Moly AI</h4>
            <p class="ai-status-text">{{ store.isGenerating ? '正在为你生成 Listing...' : '准备就绪' }}</p>

            <div class="task-list">
              <div class="task-item" :class="taskStatus('analyze')">
                <span class="task-dot" />
                <span>分析商品图片</span>
              </div>
              <div class="task-item" :class="taskStatus('title')">
                <span class="task-dot" />
                <span>生成标题与关键词</span>
              </div>
              <div class="task-item" :class="taskStatus('bullets')">
                <span class="task-dot" />
                <span>撰写五点描述</span>
              </div>
              <div class="task-item" :class="taskStatus('description')">
                <span class="task-dot" />
                <span>撰写产品描述</span>
              </div>
              <div class="task-item" :class="taskStatus('mainImage')">
                <span class="task-dot" />
                <span>生成 Amazon 合规主图</span>
              </div>
              <div class="task-item" :class="taskStatus('compliance')">
                <span class="task-dot" />
                <span>主图合规检测</span>
              </div>
            </div>

            <div class="overall-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: store.progress + '%' }"></div>
              </div>
              <span class="progress-label">{{ store.progress }}%</span>
            </div>
          </aside>

          <div class="gen-content">
            <div v-if="!store.isGenerating && !store.hasGeneratedListing" class="gen-start">
              <div class="gen-start-info">
                <h3>准备生成 Listing</h3>
                <p v-if="store.hasPipelineAnalysis">
                  AI 将基于你提供的商品信息和市场洞察结果，自动生成完整的 Amazon Listing 和合规主图。
                </p>
                <p v-else class="gen-hint">
                  请先完成上一步「市场洞察」，以便 AI 生成高质量 Listing。
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
                    <span><ThunderboltFilled class="cost-icon" /> 75 积分</span>
                  </div>
                </div>
              </div>
              <button
                class="btn-generate"
                :disabled="!store.hasPipelineAnalysis"
                @click="startGeneration"
              >
                <ExperimentOutlined /> 开始生成
              </button>
            </div>

            <div v-if="store.isGenerating" class="gen-progress-hint">
              <LoadingOutlined class="spin" />
              <span>{{ store.progressMessage || '生成中，请稍候...' }}</span>
            </div>

            <ListingResult
              v-if="store.hasGeneratedListing"
              :listing="store.generatedListing"
              :images="store.generatedImages"
              :main-image="store.mainImageUrl"
              :compliance-result="store.complianceResult"
              @regenerate="handleRegenerate"
            />
          </div>
        </div>

        <div v-if="store.hasGeneratedListing" class="step-footer">
          <div></div>
          <div class="footer-actions">
            <button class="btn-back" @click="store.prevStep()">
              <ArrowLeftOutlined /> 上一步
            </button>
            <button class="btn-next" @click="goToResult">
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

      <!-- Step 3: 结果预览 -->
      <div v-show="store.currentStep === 3" class="step-content">
        <ListingResult
          :listing="store.generatedListing"
          :images="store.generatedImages"
          :main-image="store.mainImageUrl"
          :compliance-result="store.complianceResult"
          @regenerate="handleRegenerate"
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
  ExperimentOutlined, LoadingOutlined, RobotOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import { useListingStore } from '@/stores/listing'
import { listingService } from '@/services/listing.service'
import { runAnalysisPipeline } from '@/services/pipeline'
import { LISTING_POINTS_COST, MISSING_FIELD_PREVIEWS, REQUIRED_FIELD_LABELS } from '@/config/listing.config'
import StepIndicator from './components/StepIndicator.vue'
import ProductInfoForm from './components/ProductInfoForm.vue'
import CompetitorAnalysis from './components/CompetitorAnalysis.vue'
import ListingResult from './components/ListingResult.vue'
import MainImageCompliance from './components/MainImageCompliance.vue'
import AddonServices from './components/AddonServices.vue'

const auth = useAuthStore()
const store = useListingStore()
const showMissingFieldsModal = ref(false)

const missingFieldsList = computed(() => store.getMissingRequiredFields())

function handleStep0Next() {
  const missing = store.getMissingRequiredFields()
  if (missing.length === 0) {
    store.nextStep()
  } else {
    showMissingFieldsModal.value = true
  }
}

function forceContinue() {
  showMissingFieldsModal.value = false
  store.nextStep()
}

type GenPhase = 'idle' | 'analyze' | 'title' | 'bullets' | 'description' | 'mainImage' | 'compliance' | 'done'
const genPhase = ref<GenPhase>('idle')

function taskStatus(phase: string) {
  const order: GenPhase[] = ['analyze', 'title', 'bullets', 'description', 'mainImage', 'compliance']
  const currentIdx = order.indexOf(genPhase.value as GenPhase)
  const phaseIdx = order.indexOf(phase as GenPhase)
  if (genPhase.value === 'done') return 'completed'
  if (phaseIdx < currentIdx) return 'completed'
  if (phaseIdx === currentIdx) return 'active'
  return 'pending'
}

async function runCompetitorAnalysis() {
  const validAsins = store.competitorAsins
    .map(a => a.trim())
    .filter(a => a.length >= 10 || a.includes('amazon'))

  if (!validAsins.length) {
    message.warning('请输入至少一个有效的竞品 ASIN')
    return
  }

  const extractedAsins = validAsins.map(a => {
    const extracted = listingService.extractAsin(a)
    return extracted || a.trim().substring(0, 10).toUpperCase()
  })

  const cost = LISTING_POINTS_COST.marketInsightWithCompetitors
  if (auth.points < cost) {
    message.warning(`积分不足，市场洞察需要 ${cost} 积分`)
    return
  }

  store.isAnalyzing = true
  store.progress = 0
  store.progressMessage = '开始分析...'

  try {
    const result = await runAnalysisPipeline(
      {
        mode: 'create',
        userProduct: store.productInfo,
        competitorAsins: extractedAsins,
        market: store.productInfo.market,
        language: store.productInfo.language,
      },
      (info) => {
        const p = info.step && info.totalSteps ? Math.round((info.step / info.totalSteps) * 100) : info.progress ?? 0
        store.updateProgress(p, info.message ?? '')
      }
    )
    store.analysisReport = result.analysisReport
    store.strategyPrompts = result.strategyPrompts
    store.pipelineExtractedData = result.extractedData
    auth.deductPoints(cost, '市场洞察（有竞品）')
    message.success('市场洞察完成')
  } catch (err) {
    message.error('市场洞察失败，请重试')
    console.error('[ListingCreate] market insight error:', err)
  } finally {
    store.isAnalyzing = false
  }
}

async function runMarketInsightNoCompetitors() {
  const cost = LISTING_POINTS_COST.marketInsightWithoutCompetitors
  if (auth.points < cost) {
    message.warning(`积分不足，类目分析需要 ${cost} 积分`)
    return
  }

  store.isAnalyzing = true
  store.progress = 0
  store.progressMessage = '正在分析类目最佳实践...'

  try {
    const result = await runAnalysisPipeline(
      {
        mode: 'create',
        userProduct: store.productInfo,
        competitorAsins: [],
        market: store.productInfo.market,
        language: store.productInfo.language,
      },
      (info) => {
        const p = info.step && info.totalSteps ? Math.round((info.step / info.totalSteps) * 100) : info.progress ?? 0
        store.updateProgress(p, info.message ?? '')
      }
    )
    store.analysisReport = result.analysisReport
    store.strategyPrompts = result.strategyPrompts
    store.pipelineExtractedData = result.extractedData
    auth.deductPoints(cost, '市场洞察（无竞品）')
    message.success('类目最佳实践分析完成')
    store.nextStep()
  } catch (err) {
    message.error('市场洞察失败，请重试')
    console.error('[ListingCreate] market insight no-competitor error:', err)
  } finally {
    store.isAnalyzing = false
  }
}

// 市场分析仅在用户点击按钮后执行：有竞品点「开始分析竞品」，无竞品点「无竞品，直接下一步」

async function startGeneration() {
  const totalCost = 75
  if (auth.points < totalCost) {
    message.warning(`积分不足，生成需要 ${totalCost} 积分（当前 ${auth.points}）`)
    return
  }
  if (!store.strategyPrompts) {
    message.warning('请先完成市场洞察')
    return
  }

  store.isGenerating = true
  store.progress = 0

  try {
    // Phase 1: Optional image analysis (kept for reference, not fed to strategy-based gen)
    genPhase.value = 'analyze'
    store.updateProgress(5, '正在准备...')

    if (store.productInfo.images.length > 0) {
      const imageResult = await listingService.analyzeProductImages(
        store.productInfo.images,
        store.productInfo.name,
        store.productInfo.features,
        (p, msg) => store.updateProgress(Math.min(15, 5 + p * 0.1), msg)
      )
      store.imageAnalysis = imageResult
    }

    // Phase 2-4: Generate text from strategy
    genPhase.value = 'title'
    store.updateProgress(18, '正在生成标题...')

    genPhase.value = 'bullets'
    store.updateProgress(30, '正在撰写五点描述...')

    genPhase.value = 'description'
    store.updateProgress(42, '正在撰写产品描述...')

    const listing = await listingService.generateListingTextFromStrategy(
      {
        mode: 'create',
        userProduct: store.productInfo,
        strategyPrompts: store.strategyPrompts,
        language: store.productInfo.language,
        market: store.productInfo.market,
      },
      (p, msg) => {
        const mapped = 18 + p * 0.37
        store.updateProgress(Math.min(55, mapped), msg)
      }
    )
    store.generatedListing = listing

    // Phase 5: Generate Amazon-compliant main image from strategy
    genPhase.value = 'mainImage'
    store.updateProgress(58, '正在生成 Amazon 合规主图...')

    const imgResult = await listingService.generateMainImageFromStrategy(
      store.productInfo.images,
      store.productInfo.name,
      store.productInfo.features,
      store.strategyPrompts,
      (p, msg) => store.updateProgress(Math.min(80, 58 + p * 0.22), msg)
    )

    if (imgResult.success && imgResult.imageUrl) {
      store.mainImageUrl = imgResult.imageUrl
      store.generatedImages = [imgResult.imageUrl]

      // Phase 6: Compliance check
      genPhase.value = 'compliance'
      store.updateProgress(82, '正在进行主图合规检测...')

      const compliance = await listingService.checkMainImageCompliance(
        imgResult.imageUrl,
        (p, msg) => store.updateProgress(Math.min(98, 82 + p * 0.16), msg)
      )
      store.complianceResult = compliance
    } else {
      store.mainImageUrl = null
      store.complianceResult = null
      message.warning('主图生成失败，文案已生成成功，可稍后重试主图')
    }

    genPhase.value = 'done'
    store.updateProgress(100, '生成完成！')

    auth.deductPoints(totalCost, 'Listing 一键生成（文案 + 合规主图）')
    message.success('Listing 生成成功！')
  } catch (err) {
    message.error('生成失败，请重试')
    console.error('[ListingCreate] generation error:', err)
    genPhase.value = 'idle'
  } finally {
    store.isGenerating = false
  }
}

async function regenerateMainImage() {
  if (!store.productInfo.images.length) {
    message.warning('请先上传商品实拍图')
    return
  }
  if (!store.strategyPrompts) {
    message.warning('无法重新生成：缺少策略数据')
    return
  }

  store.isGenerating = true
  store.updateProgress(0, '正在重新生成主图...')

  try {
    const imgResult = await listingService.generateMainImageFromStrategy(
      store.productInfo.images,
      store.productInfo.name,
      store.productInfo.features,
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
    console.error('[ListingCreate] main image regeneration error:', err)
  } finally {
    store.isGenerating = false
  }
}

function goToResult() {
  store.setStep(3)
}

async function handleRegenerate(field: string) {
  message.info(`正在重新生成${field === 'title' ? '标题' : field === 'bullets' ? '五点描述' : '产品描述'}...`)
  await startGeneration()
}
</script>

<style scoped lang="scss">
.listing-create {
  min-height: 100vh;
  background: #ffffff;
}

.tool-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 20px;
  .header-inner {
    max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between;
  }
  .breadcrumb {
    font-size: 14px; color: #6b7280; display: flex; align-items: center; gap: 8px;
    a { color: #2563eb; text-decoration: none; &:hover { text-decoration: underline; } }
    .crumb-icon { font-size: 10px; }
  }
  .header-right { display: flex; align-items: center; gap: 16px; font-size: 14px; }
  .points { color: #6b7280; }
  .recharge-link { color: #2563eb; text-decoration: none; }
}

.create-main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 24px 80px;
}

.step-content { margin-top: 8px; }

.step-footer {
  margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;
  display: flex; align-items: center; justify-content: space-between;
}

.cost-hint {
  font-size: 13px; color: #6b7280;
  .cost-icon { color: #f59e0b; margin-right: 2px; }
  strong { color: #111827; }
}

.footer-actions { display: flex; gap: 12px; }

.btn-back, .btn-next, .btn-finish, .btn-generate {
  display: flex; align-items: center; gap: 6px; padding: 10px 20px;
  border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; border: none;
}

.btn-back {
  background: #fff; color: #6b7280; border: 1px solid #d1d5db;
  &:hover { background: #f3f4f6; color: #374151; }
}

.btn-next {
  background: #2563eb; color: #fff;
  &:hover:not(:disabled) { background: #1d4ed8; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-finish {
  background: #059669; color: #fff;
  &:hover { background: #047857; }
}

.btn-generate {
  background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; font-size: 16px; padding: 14px 32px;
  border-radius: 12px;
  &:hover { opacity: 0.9; }
}

.generating-layout {
  display: grid; grid-template-columns: 260px 1fr; gap: 28px; align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.ai-status-panel {
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px;
  padding: 24px 20px; display: flex; flex-direction: column; align-items: center;
  gap: 12px; position: sticky; top: 24px;

  .ai-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    display: flex; align-items: center; justify-content: center;
    .ai-icon { font-size: 26px; color: #fff; }
  }
  .ai-name { font-size: 16px; font-weight: 700; color: #111827; margin: 0; }
  .ai-status-text { font-size: 13px; color: #6b7280; margin: 0; text-align: center; }
}

.task-list { width: 100%; display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }

.task-item {
  display: flex; align-items: center; gap: 10px; font-size: 13px; color: #9ca3af;
  .task-dot {
    width: 10px; height: 10px; border-radius: 50%; background: #d1d5db; flex-shrink: 0; transition: all 0.3s;
  }
  &.completed { color: #059669; .task-dot { background: #059669; } }
  &.active { color: #2563eb; font-weight: 600; .task-dot { background: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2); } }
}

.overall-progress {
  width: 100%; display: flex; align-items: center; gap: 8px; margin-top: 8px;
  .progress-bar { flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: #2563eb; border-radius: 3px; transition: width 0.3s; }
  .progress-label { font-size: 12px; font-weight: 700; color: #2563eb; min-width: 32px; text-align: right; }
}

.gen-content { min-height: 300px; }

.gen-start {
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 14px;
  padding: 32px; display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center;
  h3 { font-size: 20px; font-weight: 700; color: #111827; margin: 0; }
  p { font-size: 14px; color: #6b7280; margin: 0; max-width: 460px; }
  .gen-hint { color: #d97706; }
}

.cost-summary {
  width: 100%; max-width: 320px; margin-top: 8px;
  display: flex; flex-direction: column; gap: 8px;
  .cost-row {
    display: flex; justify-content: space-between; font-size: 13px; color: #374151;
    .cost-icon { color: #f59e0b; font-size: 12px; }
    &.total { padding-top: 8px; border-top: 1px solid #e5e7eb; font-weight: 700; color: #111827; }
  }
}

.gen-progress-hint {
  display: flex; align-items: center; gap: 10px;
  padding: 16px; background: #eff6ff; border-radius: 10px;
  font-size: 14px; color: #2563eb; margin-bottom: 20px;
}

/* 缺项预览 Modal */
.modal-mask {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

.missing-fields-modal {
  background: #fff; border-radius: 12px; max-width: 560px; width: 100%;
  padding: 24px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  .modal-title { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 8px; }
  .modal-desc { font-size: 14px; color: #6b7280; margin: 0 0 16px; }
  .preview-table {
    width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { font-weight: 600; color: #374151; }
    td:first-child { font-weight: 500; color: #111827; min-width: 100px; }
    td:last-child { color: #6b7280; }
  }
  .modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
  .btn-fill {
    padding: 10px 20px; background: #2563eb; color: #fff; border: none; border-radius: 8px;
    font-weight: 600; cursor: pointer;
    &:hover { background: #1d4ed8; }
  }
  .btn-force {
    padding: 10px 20px; background: #fff; color: #6b7280; border: 1px solid #d1d5db;
    border-radius: 8px; font-size: 13px; cursor: pointer;
    &:hover { background: #f9fafb; color: #374151; }
  }
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
