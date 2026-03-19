<template>
  <div class="analysis-report">
    <div class="report-header">
      <h3 class="report-title">{{ title }}</h3>
      <div v-if="score !== undefined" class="score-badge" :class="scoreClass">
        {{ score }} 分
      </div>
    </div>

    <div v-if="strengths.length" class="report-section">
      <h4 class="section-label strengths-label">
        <CheckCircleFilled class="label-icon" /> 亮点
      </h4>
      <div class="tag-list">
        <div v-for="(s, i) in strengths" :key="i" class="report-tag strength">
          <span class="tag-aspect">{{ s.aspect }}</span>
          <span class="tag-detail">{{ s.detail }}</span>
        </div>
      </div>
    </div>

    <div v-if="weaknesses.length" class="report-section">
      <h4 class="section-label weaknesses-label">
        <CloseCircleFilled class="label-icon" /> 不足
      </h4>
      <div class="tag-list">
        <div v-for="(w, i) in weaknesses" :key="i" class="report-tag weakness">
          <span class="tag-aspect">{{ w.aspect }}</span>
          <span class="tag-detail">{{ w.detail }}</span>
        </div>
      </div>
    </div>

    <div v-if="suggestions.length" class="report-section">
      <h4 class="section-label suggestions-label">
        <BulbOutlined class="label-icon" /> 优化建议
      </h4>
      <ul class="suggestion-list">
        <li v-for="(s, i) in suggestions" :key="i">{{ s }}</li>
      </ul>
    </div>

    <div v-if="keywords.length" class="report-section">
      <h4 class="section-label keywords-label">
        <TagOutlined class="label-icon" /> 关键词
      </h4>
      <div class="keyword-cloud">
        <span v-for="(kw, i) in keywords" :key="i" class="keyword-tag">{{ kw }}</span>
      </div>
    </div>

    <div v-if="missingKeywords.length" class="report-section">
      <h4 class="section-label missing-label">
        <WarningOutlined class="label-icon" /> 缺失关键词
      </h4>
      <div class="keyword-cloud">
        <span v-for="(kw, i) in missingKeywords" :key="i" class="keyword-tag missing">{{ kw }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  BulbOutlined,
  TagOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue'

const props = defineProps<{
  title: string
  score?: number
  strengths: { aspect: string; detail: string }[]
  weaknesses: { aspect: string; detail: string }[]
  suggestions: string[]
  keywords: string[]
  missingKeywords?: string[]
}>()

const scoreClass = computed(() => {
  if (!props.score) return ''
  if (props.score >= 80) return 'score-good'
  if (props.score >= 60) return 'score-mid'
  return 'score-low'
})
</script>

<style scoped lang="scss">
.analysis-report {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.report-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.score-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  &.score-good { background: rgba(5, 150, 105, 0.12); color: var(--color-success); }
  &.score-mid { background: rgba(217, 119, 6, 0.12); color: var(--color-warning); }
  &.score-low { background: rgba(220, 38, 38, 0.12); color: var(--color-error); }
}

.report-section { display: flex; flex-direction: column; gap: 8px; }

.section-label {
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  .label-icon { font-size: 15px; }

  &.strengths-label { color: var(--color-success); }
  &.weaknesses-label { color: var(--color-error); }
  &.suggestions-label { color: var(--color-warning); }
  &.keywords-label { color: var(--color-primary); }
  &.missing-label { color: #9333ea; }
}

.tag-list { display: flex; flex-direction: column; gap: 8px; }

.report-tag {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 2px;

  .tag-aspect { font-size: 13px; font-weight: 600; }
  .tag-detail { font-size: 13px; color: var(--color-text-secondary); }

  &.strength { background: rgba(5, 150, 105, 0.12); .tag-aspect { color: var(--color-success); } }
  &.weakness { background: rgba(220, 38, 38, 0.12); .tag-aspect { color: var(--color-error); } }
}

.suggestion-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  li { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }
}

.keyword-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  background: var(--color-primary-light);
  color: var(--color-primary);

  &.missing { background: rgba(147, 51, 234, 0.12); color: #9333ea; }
}
</style>
