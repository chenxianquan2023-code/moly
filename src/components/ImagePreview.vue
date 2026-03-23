<template>
  <div
    class="image-preview"
    :class="{ 'is-fullscreen': isFullscreen }"
    @click="handleBackdropClick"
  >
    <img
      :src="src"
      class="preview-image"
      :style="imageStyle"
      @click.stop
      @load="handleLoad"
      @error="handleError"
    />
    
    <!-- 工具栏 -->
    <div class="toolbar" @click.stop>
      <button
        v-for="action in actions"
        :key="action.key"
        class="toolbar-btn"
        :title="action.title"
        @click="handleAction(action.key)"
      >
        <span v-if="action.icon" v-html="action.icon"></span>
        <span v-else>{{ action.label }}</span>
      </button>
    </div>
    
    <!-- 关闭按钮 -->
    <button
      v-if="closable"
      class="close-btn"
      @click.stop="handleClose"
    >
      ×
    </button>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Action {
  key: string
  label: string
  title?: string
  icon?: string
}

interface Props {
  src: string
  alt?: string
  closable?: boolean
  isFullscreen?: boolean
  actions?: Action[]
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  closable: true,
  isFullscreen: false,
  actions: () => [
    { key: 'download', label: '下载', title: '下载图片', icon: '⬇' },
    { key: 'zoom', label: '放大', title: '查看原图', icon: '🔍' }
  ]
})

const emit = defineEmits<{
  'close': []
  'action': [key: string]
  'load': []
  'error': []
}>()

const loading = ref(true)
const scale = ref(1)

const imageStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transition: 'transform 0.3s ease'
}))

function handleLoad() {
  loading.value = false
  emit('load')
}

function handleError() {
  loading.value = false
  emit('error')
}

function handleClose() {
  emit('close')
}

function handleBackdropClick() {
  if (props.closable) {
    emit('close')
  }
}

function handleAction(key: string) {
  if (key === 'zoom') {
    scale.value = scale.value === 1 ? 2 : 1
  } else {
    emit('action', key)
  }
}
</script>

<style scoped lang="scss">
.image-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
  overflow: hidden;
  
  &.is-fullscreen {
    position: fixed;
    inset: 0;
    z-index: 1000;
  }
}

.preview-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  cursor: zoom-in;
}

.toolbar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
}

.toolbar-btn {
  padding: 8px 16px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
