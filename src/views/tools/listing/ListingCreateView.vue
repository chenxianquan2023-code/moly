<template>
  <div class="listing-create">
    <ListingToolHeader breadcrumb-label="首次创作" />

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
            预估消耗 <strong>{{ LISTING_POINTS_COST.fullGeneration }}</strong> 积分（含文案 + 合规主图）
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
              <div class="task-item" :class="taskStatus('text')">
                <span class="task-dot" />
                <span>生成标题、五点、描述与关键词</span>
              </div>
              <div class="task-item" :class="taskStatus('mainImage')">
                <span class="task-dot" />
                <span>生成 Amazon 主图</span>
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
                    <span><ThunderboltFilled class="cost-icon" /> {{ LISTING_POINTS_COST.fullGeneration }} 积分</span>
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
  ThunderboltFilled, ArrowLeftOutlined, ArrowRightOutlined,
  ExperimentOutlined, LoadingOutlined, RobotOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import { useListingStore } from '@/stores/listing'
import { listingService } from '@/services/listing.service'
import { runAnalysisPipeline } from '@/services/pipeline'
import { LISTING_POINTS_COST, MISSING_FIELD_PREVIEWS, REQUIRED_FIELD_LABELS } from '@/config/listing.config'
import ListingToolHeader from './components/ListingToolHeader.vue'
import StepIndicator from './components/StepIndicator.vue'
import ProductInfoForm from './components/ProductInfoForm.vue'
import CompetitorAnalysis from './components/CompetitorAnalysis.vue'
import ListingResult from './components/ListingResult.vue'
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

type GenPhase = 'idle' | 'analyze' | 'text' | 'mainImage' | 'done'
const genPhase = ref<GenPhase>('idle')

function taskStatus(phase: string) {
  const order: GenPhase[] = ['analyze', 'text', 'mainImage']
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
  } catch (err) {
    message.error('市场洞察失败，请重试')
    console.error('[ListingCreate] market insight no-competitor error:', err)
  } finally {
    store.isAnalyzing = false
  }
}

// 市场分析仅在用户点击按钮后执行：有竞品点「开始分析竞品」，无竞品点「无竞品，直接下一步」

async function startGeneration() {
  const totalCost = LISTING_POINTS_COST.fullGeneration
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

    // Phase 2: Generate text from strategy (title + bullets + description + keywords in one call)
    genPhase.value = 'text'
    store.updateProgress(18, '正在生成文案...')

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
    } else {
      store.mainImageUrl = null
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

function goToResult() {
  store.setStep(3)
}
</script>

<style scoped lang="scss">
.listing-create {
  min-height: 100vh;
  background: var(--color-bg);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
}

.create-main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

.step-content { margin-top: 24px; }

.step-footer {
  margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--color-border);
  display: flex; align-items: center; justify-content: space-between;
}

.cost-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  .cost-icon { color: var(--color-warning-icon); margin-right: 2px; }
  strong { color: var(--color-text-primary); }
}

.footer-actions { display: flex; gap: 12px; }

.btn-back, .btn-next, .btn-finish, .btn-generate {
  display: flex; align-items: center; gap: 6px; padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease; border: none;
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
  &.completed { color: #059669; .task-dot { background: #059669; } }
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

.gen-content { min-height: 300px; }

.gen-start {
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
  .gen-hint { color: var(--color-warning); }
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

/* 缺项预览 Modal */
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.missing-fields-modal {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  max-width: 560px;
  width: 100%;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--color-border);

  .modal-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 8px;
  }
  .modal-desc {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0 0 20px;
  }
  .preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin-bottom: 24px;
    th, td {
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }
    th { font-weight: 600; color: var(--color-text-primary); }
    td:first-child { font-weight: 500; color: var(--color-text-primary); min-width: 100px; }
    td:last-child { color: var(--color-text-secondary); }
  }
  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  .btn-fill {
    padding: 10px 22px;
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
    transition: all 0.2s ease;
    &:hover {
      background: var(--color-primary-hover);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
  }
  .btn-force {
    padding: 10px 22px;
    background: transparent;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background: var(--color-primary-light);
      color: var(--color-primary);
    }
  }
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
