<template>
  <div class="feature-card" @click="onClick">
    <div class="card-icon">
      <component :is="icon" />
    </div>
    <h3 class="card-title">{{ title }}</h3>
    <p class="card-desc">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  title: string;
  description: string;
  icon: Component;
}>();

const emit = defineEmits<{ click: [] }>();

function onClick() {
  emit('click');
}
</script>

<style scoped lang="scss">
.feature-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }

  .card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #ecfdf5;
    color: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    margin-bottom: 20px;
  }

  .card-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 12px 0;
  }

  .card-desc {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.6;
    margin: 0;
    flex: 1;
  }
}
</style>
