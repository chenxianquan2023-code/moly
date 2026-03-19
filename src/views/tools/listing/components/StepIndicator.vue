<template>
  <div class="step-indicator">
    <div
      v-for="(step, idx) in steps"
      :key="idx"
      class="step-item"
      :class="{
        active: idx === current,
        completed: idx < current,
        upcoming: idx > current,
      }"
    >
      <div class="step-dot">
        <CheckOutlined v-if="idx < current" />
        <span v-else>{{ idx + 1 }}</span>
      </div>
      <div class="step-label-wrap">
        <span class="step-label">{{ step }}</span>
        <span v-if="idx === current && subtitles[idx]" class="step-subtitle">{{ subtitles[idx] }}</span>
      </div>
      <div v-if="idx < steps.length - 1" class="step-line" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckOutlined } from '@ant-design/icons-vue'

const props = withDefaults(
  defineProps<{
    steps: string[]
    current: number
    subtitles?: Record<number, string>
  }>(),
  {
    subtitles: () => ({
      0: '填写商品',
      1: '分析市场',
      2: 'AI 创作',
      3: '预览结果',
    }),
  }
)

const subtitles = computed(() => props.subtitles)
</script>

<style scoped lang="scss">
.step-indicator {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 24px 0;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;

  .step-dot {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    flex-shrink: 0;
    transition: all 0.3s ease;
  }

  .step-label-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .step-label {
    font-size: 14px;
    white-space: nowrap;
    transition: color 0.3s;
  }

  .step-subtitle {
    font-size: 12px;
    color: var(--color-text-secondary);
    font-weight: 400;
  }

  .step-line {
    width: 48px;
    height: 0;
    margin: 0 10px;
    border-top: 3px solid transparent;
    transition: all 0.3s ease;
  }

  &.completed {
    .step-dot {
      background: var(--color-primary);
      color: #fff;
    }
    .step-label { color: var(--color-primary); font-weight: 600; }
    .step-subtitle { color: var(--color-primary); opacity: 0.85; }
    .step-line {
      border-top-color: var(--color-primary);
      border-top-style: solid;
    }
  }

  &.active {
    .step-dot {
      background: var(--color-primary);
      color: #fff;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25);
      animation: step-pulse 2s ease-in-out infinite;
    }
    .step-label { color: var(--color-text-primary); font-weight: 700; }
    .step-subtitle { color: var(--color-text-secondary); }
    .step-line {
      border-top-color: var(--color-border-muted);
      border-top-style: dashed;
    }
  }

  &.upcoming {
    .step-dot {
      background: var(--color-border-light);
      color: var(--color-text-tertiary);
      border: 1px solid var(--color-border);
    }
    .step-label { color: var(--color-text-tertiary); }
    .step-subtitle { color: var(--color-text-tertiary); }
    .step-line {
      border-top-color: var(--color-border-muted);
      border-top-style: dashed;
    }
  }
}

@keyframes step-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25); }
  50% { box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.15); }
}
</style>
