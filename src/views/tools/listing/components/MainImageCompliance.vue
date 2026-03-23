<template>
  <div class="compliance-report">
    <div class="compliance-header">
      <div class="status-badge" :class="result.passed ? 'passed' : 'failed'">
        <CheckCircleFilled v-if="result.passed" />
        <CloseCircleFilled v-else />
        {{ result.passed ? '合规通过' : '存在不合规项' }}
      </div>
      <div class="score-ring">
        <span class="score-value">{{ result.score }}</span>
        <span class="score-label">/ 100</span>
      </div>
    </div>

    <div class="compliance-items">
      <div
        v-for="(item, idx) in result.items"
        :key="idx"
        class="compliance-item"
        :class="item.passed ? 'item-pass' : 'item-fail'"
      >
        <div class="item-icon">
          <CheckOutlined v-if="item.passed" />
          <CloseOutlined v-else />
        </div>
        <div class="item-content">
          <span class="item-rule">{{ item.rule }}</span>
          <span class="item-detail">{{ item.detail }}</span>
        </div>
      </div>
    </div>

    <div v-if="!result.passed" class="compliance-action">
      <p class="action-hint">主图存在不合规项，可能导致 Amazon 审核不通过</p>
      <button class="regen-btn" :disabled="isRegenerating" @click="$emit('regenerate')">
        <LoadingOutlined v-if="isRegenerating" class="spin" />
        <ReloadOutlined v-else />
        {{ isRegenerating ? '重新生成中...' : '重新生成主图' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CheckCircleFilled, CloseCircleFilled, CheckOutlined,
  CloseOutlined, ReloadOutlined, LoadingOutlined,
} from '@ant-design/icons-vue'
import type { ComplianceResult } from '@/services/listing.service'

defineProps<{
  result: ComplianceResult
  isRegenerating?: boolean
}>()

defineEmits<{ regenerate: [] }>()
</script>

<style scoped lang="scss">
.compliance-report {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.compliance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 700;

  &.passed { background: #ecfdf5; color: #059669; }
  &.failed { background: #fef2f2; color: #dc2626; }
}

.score-ring {
  display: flex;
  align-items: baseline;
  gap: 2px;

  .score-value { font-size: 28px; font-weight: 800; color: #111827; }
  .score-label { font-size: 14px; color: #9ca3af; }
}

.compliance-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compliance-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;

  .item-icon {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .item-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item-rule { font-size: 13px; font-weight: 600; }
  .item-detail { font-size: 12px; color: #6b7280; }

  &.item-pass {
    background: #f0fdf4;
    .item-icon { background: #dcfce7; color: #16a34a; }
    .item-rule { color: #15803d; }
  }

  &.item-fail {
    background: #fef2f2;
    .item-icon { background: #fee2e2; color: #dc2626; }
    .item-rule { color: #dc2626; }
  }
}

.compliance-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;

  .action-hint { font-size: 13px; color: #dc2626; margin: 0; }

  .regen-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    &:hover:not(:disabled) { background: #1d4ed8; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
