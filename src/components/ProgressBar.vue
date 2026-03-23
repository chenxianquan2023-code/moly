<template>
  <div class="progress-bar" :class="{ 'is-indeterminate': indeterminate }">
    <div class="progress-track">
      <div
        class="progress-fill"
        :style="{ width: `${normalizedProgress}%` }"
      />
    </div>
    <div v-if="showText" class="progress-text">
      <slot :progress="progress" :message="message">
        {{ message || `${normalizedProgress}%` }}
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  progress: number
  message?: string
  showText?: boolean
  indeterminate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showText: true,
  indeterminate: false
})

const normalizedProgress = computed(() => {
  if (props.indeterminate) return 100
  return Math.min(100, Math.max(0, props.progress))
})
</script>

<style scoped lang="scss">
.progress-bar {
  width: 100%;
}

.progress-track {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
}

// 不确定进度动画
.is-indeterminate {
  .progress-fill {
    width: 30%;
    animation: indeterminate 1.5s ease-in-out infinite;
  }
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}
</style>
