<template>
  <div class="loading-skeleton" :class="{ 'is-animated': animated }">
    <div
      v-for="i in rows"
      :key="i"
      class="skeleton-row"
      :style="{ height: `${rowHeight}px` }"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  rows?: number
  rowHeight?: number
  animated?: boolean
}

withDefaults(defineProps<Props>(), {
  rows: 3,
  rowHeight: 20,
  animated: true
})
</script>

<style scoped lang="scss">
.loading-skeleton {
  width: 100%;
}

.skeleton-row {
  background: #e5e7eb;
  border-radius: 4px;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.is-animated {
  .skeleton-row {
    background: linear-gradient(
      90deg,
      #e5e7eb 25%,
      #f3f4f6 50%,
      #e5e7eb 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
