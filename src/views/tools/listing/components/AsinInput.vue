<template>
  <div class="asin-input-panel">
    <h3 class="panel-title">{{ title }}</h3>
    <p class="panel-desc">{{ description }}</p>

    <div v-if="multiple" class="asin-list">
      <div v-for="(asin, idx) in modelValue" :key="idx" class="asin-row">
        <input
          :value="asin"
          class="asin-field"
          placeholder="输入 ASIN 或 Amazon 商品链接"
          @input="onUpdate(idx, ($event.target as HTMLInputElement).value)"
        />
        <button v-if="modelValue.length > 1" class="remove-row-btn" @click="$emit('remove', idx)">
          <DeleteOutlined />
        </button>
      </div>
      <button
        v-if="modelValue.length < maxCount"
        class="add-asin-btn"
        @click="$emit('add')"
      >
        <PlusOutlined /> 添加竞品 ASIN
      </button>
    </div>

    <div v-else class="single-asin">
      <div class="input-wrapper">
        <SearchOutlined class="input-prefix" />
        <input
          :value="typeof modelValue === 'string' ? modelValue : ''"
          class="asin-field large"
          placeholder="输入 ASIN（如 B09V3K1234）或粘贴 Amazon 商品链接"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @keyup.enter="$emit('search')"
        />
      </div>
      <p v-if="extractedAsin" class="extracted-hint">
        <CheckCircleFilled class="check-icon" />
        已识别 ASIN：<strong>{{ extractedAsin }}</strong>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SearchOutlined, PlusOutlined, DeleteOutlined, CheckCircleFilled } from '@ant-design/icons-vue'

defineProps<{
  title: string
  description: string
  modelValue: string | string[]
  multiple?: boolean
  maxCount?: number
  extractedAsin?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  'update:item': [index: number, value: string]
  search: []
  add: []
  remove: [index: number]
}>()

function onUpdate(idx: number, value: string) {
  emit('update:item', idx, value)
}
</script>

<style scoped lang="scss">
.asin-input-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.panel-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.single-asin {
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-prefix {
    position: absolute;
    left: 14px;
    font-size: 16px;
    color: #9ca3af;
  }

  .asin-field.large {
    width: 100%;
    padding: 14px 14px 14px 42px;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    font-size: 15px;
    color: #111827;
    transition: border-color 0.2s;
    &:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
  }
}

.extracted-hint {
  font-size: 13px;
  color: #059669;
  margin: 4px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;

  .check-icon { font-size: 14px; }
  strong { color: #111827; }
}

.asin-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.asin-row {
  display: flex;
  gap: 8px;
  align-items: center;

  .asin-field {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    &:focus { outline: none; border-color: #2563eb; }
  }

  .remove-row-btn {
    width: 36px;
    height: 36px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    color: #ef4444;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover { background: #fef2f2; }
  }
}

.add-asin-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  font-size: 14px;
  color: #2563eb;
  background: none;
  border: none;
  cursor: pointer;
  &:hover { text-decoration: underline; }
}
</style>
