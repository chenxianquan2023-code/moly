<template>
  <div
    class="upload-area"
    :class="{
      'has-image': modelValue,
      'is-dragging': isDragging,
      'is-loading': isLoading,
      'is-disabled': disabled
    }"
    @click="handleClick"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- 图片预览 -->
    <img
      v-if="modelValue"
      :src="modelValue"
      class="preview-img"
      :class="{ 'is-garment': garmentMode }"
      alt="预览"
    />
    
    <!-- 图片操作遮罩 -->
    <div v-if="modelValue" class="image-overlay">
      <button
        v-if="!disabled"
        class="action-btn delete-btn"
        @click.stop="handleDelete"
        title="删除图片"
      >
        <slot name="delete-icon">
          <span>×</span>
        </slot>
      </button>
      <button
        v-if="!disabled"
        class="action-btn replace-btn"
        @click.stop="handleReplace"
        title="更换图片"
      >
        <slot name="replace-icon">
          <span>↻</span>
        </slot>
      </button>
    </div>
    
    <!-- 上传占位 -->
    <div v-else class="upload-placeholder">
      <slot name="icon">
        <span class="upload-icon">+</span>
      </slot>
      <slot name="text">
        <span class="upload-text">点击上传</span>
      </slot>
      <slot name="hint">
        <span v-if="accept" class="upload-hint">支持 {{ accept }}</span>
      </slot>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <slot name="loading">
        <div class="spinner"></div>
        <span>上传中...</span>
      </slot>
    </div>
    
    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      class="hidden-input"
      :accept="accept"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue?: string
  accept?: string
  disabled?: boolean
  isLoading?: boolean
  garmentMode?: boolean
  maxSize?: number // MB
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/*',
  disabled: false,
  isLoading: false,
  garmentMode: false,
  maxSize: 10
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [file: File]
  'delete': []
  'error': [message: string]
}>()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)

function handleClick() {
  if (props.disabled || props.isLoading) return
  
  if (props.modelValue) {
    // 有图片时点击不触发上传
    return
  }
  
  fileInput.value?.click()
}

function handleReplace() {
  if (props.disabled || props.isLoading) return
  fileInput.value?.click()
}

function handleDelete() {
  emit('update:modelValue', '')
  emit('delete')
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (file) {
    processFile(file)
  }
}

function handleDragEnter() {
  if (!props.disabled && !props.isLoading) {
    isDragging.value = true
  }
}

function handleDragOver() {
  if (!props.disabled && !props.isLoading) {
    isDragging.value = true
  }
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  
  if (props.disabled || props.isLoading) return
  
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

function processFile(file: File) {
  // 检查文件大小
  if (file.size > props.maxSize * 1024 * 1024) {
    emit('error', `文件大小不能超过 ${props.maxSize}MB`)
    return
  }
  
  // 转换为 base64
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    emit('update:modelValue', result)
    emit('change', file)
  }
  reader.onerror = () => {
    emit('error', '文件读取失败')
  }
  reader.readAsDataURL(file)
}
</script>

<style scoped lang="scss">
.upload-area {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9fafb;
  
  &:hover:not(.is-disabled) {
    border-color: #3b82f6;
    background: #eff6ff;
  }
  
  &.is-dragging {
    border-color: #3b82f6;
    background: #dbeafe;
  }
  
  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.has-image {
    border-style: solid;
    border-color: #e5e7eb;
    cursor: default;
  }
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  
  &.is-garment {
    object-fit: contain;
    background: #f3f4f6;
  }
}

.image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s;
  
  .upload-area:hover & {
    opacity: 1;
  }
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: white;
  color: #374151;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: #f3f4f6;
    transform: scale(1.1);
  }
}

.upload-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6b7280;
}

.upload-icon {
  font-size: 32px;
  font-weight: 300;
}

.upload-text {
  font-size: 14px;
}

.upload-hint {
  font-size: 12px;
  color: #9ca3af;
}

.hidden-input {
  display: none;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #6b7280;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
