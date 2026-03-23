<template>
  <div class="competitor-analysis">
    <div class="ca-card">
      <div class="ca-header">
        <h3 class="ca-title">市场洞察</h3>
        <p class="ca-desc">有竞品时输入 ASIN 分析竞品；无竞品时 AI 将基于类目最佳实践生成商业化标准 Listing</p>
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
        <button class="analyze-btn" :disabled="store.isAnalyzing" @click="onAnalyzeClick">
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

const emit = defineEmits<{ analyze: [] ; skip: [] }>()

function onAnalyzeClick() {
  if (hasValidAsins.value) {
    emit('analyze')
  } else {
    emit('skip') // 无竞品时走类目最佳实践分析
  }
}

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
.competitor-analysis {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
}

.ca-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px 28px;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ca-header {
  padding-bottom: 4px;
}

.ca-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.ca-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 6px 0 0;
}

.asin-inputs {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.asin-row {
  display: flex;
  align-items: center;
  gap: 12px;
  .row-label {
    font-size: 13px;
    color: var(--color-text-secondary);
    min-width: 80px;
  }
  .asin-field {
    flex: 1;
    padding: 12px 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  }
  .rm-btn {
    width: 40px;
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: #fff;
    color: var(--color-error);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    &:hover { background: #fef2f2; }
  }
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  font-size: 14px;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  &:hover { text-decoration: underline; }
}

.ca-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  .analyze-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
    transition: all 0.2s ease;
    &:hover:not(:disabled) {
      background: var(--color-primary-hover);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }
    &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  }
}

.progress-bar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
  .progress-bar {
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
  .progress-text {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.ca-results {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.result-section {
  background: #f9fafb;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  .rs-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    &.highlights-title { color: var(--color-success); }
    &.weaknesses-title { color: var(--color-error); }
    &.keywords-title { color: var(--color-primary); }
    &.diff-title { color: var(--color-warning); }
  }
  .rs-list {
    margin: 0;
    padding-left: 18px;
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.7;
  }
}

.keyword-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
.kw-tag {
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  background: var(--color-primary-light);
  color: var(--color-primary);
}
</style>
