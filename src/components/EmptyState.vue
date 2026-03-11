<template>
  <div class="empty-state">
    <div class="empty-icon">
      <slot name="icon">
        <span v-if="icon">{{ icon }}</span>
        <span v-else>📭</span>
      </slot>
    </div>
    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string
  title?: string
  description?: string
}

defineProps<Props>()
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px;
}

.empty-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px;
  max-width: 400px;
}

.empty-action {
  :deep(button) {
    padding: 10px 24px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
    
    &:hover {
      background: #2563eb;
    }
  }
}
</style>
