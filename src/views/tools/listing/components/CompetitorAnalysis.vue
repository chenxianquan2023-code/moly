<template>
  <div class="competitor-analysis">
    <div class="ca-header">
      <div>
        <h3 class="ca-title">市场洞察</h3>
        <p class="ca-desc">有竞品时输入 ASIN 分析竞品；无竞品时 AI 将基于类目最佳实践生成商业化标准 Listing</p>
      </div>
    </div>

    <div class="asin-inputs">
      <div v-for="(asin, idx) in store.competitorAsins" :key="idx" class="asin-row">
        <span class="row-label">竞品 {{ idx + 1 }}（可选）</span>
        <input
          :value="asin"
          class="asin-field"
          placeholder="输入 ASIN 或 Amazon 链接"
          @input="store.updateCompetitorAsin(idx, ($event.target as HTMLInputElement).value)"
        />
        <button v-if="store.competitorAsins.length > 1" class="rm-btn" @click="store.removeCompetitorAsin(idx)">
          <DeleteOutlined />
        </button>
      </div>
      <button v-if="store.competitorAsins.length < 3" class="add-btn" @click="store.addCompetitorAsin()">
        <PlusOutlined /> 添加竞品
      </button>
    </div>

    <div class="ca-actions">
      <button class="analyze-btn" :disabled="store.isAnalyzing" @click="$emit('analyze')">
        <LoadingOutlined v-if="store.isAnalyzing" class="spin" />
        <ExperimentOutlined v-else />
        {{ store.isAnalyzing ? '分析中...' : (hasValidAsins ? '开始分析竞品' : '开始分析（类目最佳实践）') }}
      </button>
    </div>

    <div v-if="store.isAnalyzing" class="progress-bar-wrapper">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: store.progress + '%' }"></div>
      </div>
      <span class="progress-text">{{ store.progressMessage }}</span>
    </div>

    <div v-if="displayReport" class="ca-results">
      <div v-if="displayReport.strengths.length" class="result-section">
        <h4 class="rs-title highlights-title"><CheckCircleFilled /> 竞品亮点</h4>
        <ul class="rs-list">
          <li v-for="(s, i) in displayReport.strengths" :key="i">{{ s.detail }}</li>
        </ul>
      </div>
      <div v-if="displayReport.weaknesses.length" class="result-section">
        <h4 class="rs-title weaknesses-title"><CloseCircleFilled /> 竞品不足</h4>
        <ul class="rs-list">
          <li v-for="(w, i) in displayReport.weaknesses" :key="i">{{ w.detail }}</li>
        </ul>
      </div>
      <div v-if="displayReport.keywords.length" class="result-section">
        <h4 class="rs-title keywords-title"><TagOutlined /> 高频关键词</h4>
        <div class="keyword-cloud">
          <span v-for="(kw, i) in displayReport.keywords" :key="i" class="kw-tag">{{ kw }}</span>
        </div>
      </div>
      <div v-if="displayReport.suggestions.length" class="result-section">
        <h4 class="rs-title diff-title"><BulbOutlined /> 差异化机会</h4>
        <ul class="rs-list">
          <li v-for="(d, i) in displayReport.suggestions" :key="i">{{ d }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  PlusOutlined, DeleteOutlined, ExperimentOutlined, LoadingOutlined,
  CheckCircleFilled, CloseCircleFilled, TagOutlined, BulbOutlined,
} from '@ant-design/icons-vue'
import { useListingStore } from '@/stores/listing'
import { adaptPipelineReportToDisplay } from '@/utils/adaptPipelineReport'

const store = useListingStore()

defineEmits<{ analyze: [] }>()

const hasValidAsins = computed(() =>
  store.competitorAsins.some(a => {
    const trimmed = a.trim()
    return trimmed.length >= 10 || trimmed.includes('amazon')
  })
)

const displayReport = computed(() => {
  if (!store.analysisReport) return null
  return adaptPipelineReportToDisplay(store.analysisReport)
})
</script>

<style scoped lang="scss">
.competitor-analysis { display: flex; flex-direction: column; gap: 20px; }

.ca-title { font-size: 20px; font-weight: 700; color: #111827; margin: 0; }
.ca-desc { font-size: 14px; color: #6b7280; margin: 4px 0 0; }

.asin-inputs { display: flex; flex-direction: column; gap: 10px; }

.asin-row {
  display: flex; align-items: center; gap: 8px;
  .row-label { font-size: 13px; color: #6b7280; min-width: 48px; }
  .asin-field {
    flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;
    &:focus { outline: none; border-color: #2563eb; }
  }
  .rm-btn {
    width: 36px; height: 36px; border: 1px solid #e5e7eb; border-radius: 8px;
    background: #fff; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center;
    &:hover { background: #fef2f2; }
  }
}

.add-btn {
  display: flex; align-items: center; gap: 6px; padding: 6px 0; font-size: 14px;
  color: #2563eb; background: none; border: none; cursor: pointer;
  &:hover { text-decoration: underline; }
}

.ca-actions {
  display: flex; align-items: center; gap: 12px;
  .analyze-btn {
    display: flex; align-items: center; gap: 8px; padding: 12px 24px; background: #2563eb; color: #fff;
    border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer;
    transition: background 0.2s;
    &:hover:not(:disabled) { background: #1d4ed8; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
  .skip-btn {
    padding: 12px 20px; background: #fff; color: #6b7280; border: 1px solid #d1d5db;
    border-radius: 10px; font-size: 14px; cursor: pointer;
    &:hover { background: #f3f4f6; color: #374151; }
  }
}

.progress-bar-wrapper {
  display: flex; flex-direction: column; gap: 6px;
  .progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: #2563eb; border-radius: 3px; transition: width 0.3s; }
  .progress-text { font-size: 13px; color: #6b7280; }
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.ca-results {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.result-section {
  background: #f9fafb; border-radius: 10px; padding: 16px;
  .rs-title {
    font-size: 14px; font-weight: 600; margin: 0 0 10px; display: flex; align-items: center; gap: 6px;
    &.highlights-title { color: #059669; }
    &.weaknesses-title { color: #dc2626; }
    &.keywords-title { color: #2563eb; }
    &.diff-title { color: #d97706; }
  }
  .rs-list { margin: 0; padding-left: 18px; font-size: 13px; color: #374151; line-height: 1.7; }
}

.keyword-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
.kw-tag { padding: 3px 10px; border-radius: 14px; font-size: 12px; background: #eff6ff; color: #2563eb; }
</style>
