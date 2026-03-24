<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'

const props = defineProps<{
  id: string
  data: {
    title: string
    content: string
    editable?: boolean
    tall?: boolean
    loading?: boolean
  }
}>()

const emit = defineEmits<{
  (e: 'content-change', nodeId: string, content: string): void
}>()

const { updateNodeData } = useVueFlow()

const handleInput = (e: Event) => {
  const value = (e.target as HTMLTextAreaElement).value
  updateNodeData(props.id, { content: value })
  // 通知父组件内容已变化
  emit('content-change', props.id, value)
}
</script>

<template>
  <div class="text-node" :class="{ 'text-node--editable': data.editable, 'text-node--tall': data.tall }">
    <!-- 加载中遮罩 - 全息扫描效果 -->
    <div v-if="data.loading" class="loading-overlay">
      <!-- 扫描光效 -->
      <div class="scan-line"></div>
      <div class="scan-gradient"></div>
      
      <!-- 双层旋转圆环 -->
      <div class="spinner-container">
        <div class="spinner-ring spinner-outer"></div>
        <div class="spinner-ring spinner-inner"></div>
      </div>
      
      <!-- 文字 -->
      <div class="loading-text">AI 分析中</div>
      <div class="loading-subtext">Processing...</div>
    </div>
    
    <!-- 标题栏 -->
    <div class="node-header">
      <span class="node-title">{{ data.title }}</span>
    </div>
    
    <!-- 内容区域 -->
    <div class="node-content">
      <!-- 可编辑模式 -->
      <textarea 
        v-if="data.editable"
        class="content-textarea" 
        :value="data.content"
        @input="handleInput"
        @mousedown.stop
        placeholder="输入动作描述..."
      ></textarea>
      <!-- 只读模式 -->
      <p v-else class="content-text">{{ data.content }}</p>
    </div>
    
    <!-- 端口 -->
    <Handle type="source" :position="Position.Right" class="port port-out" />
    <Handle v-if="id === 'generated'" type="target" :position="Position.Left" class="port port-in" />
  </div>
</template>

<style scoped lang="scss">
.text-node {
  width: 240px;
  height: 160px;
  background: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
  position: relative;

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(2px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    overflow: hidden;

    // 扫描线
    .scan-line {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: #60a5fa;
      box-shadow: 0 0 15px rgba(59, 130, 246, 1);
      animation: scan-move 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    // 扫描渐变
    .scan-gradient {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 50%;
      background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.3));
      animation: scan-move 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      pointer-events: none;
    }

    // 双层旋转圆环
    .spinner-container {
      position: relative;
      width: 40px;
      height: 40px;
      margin-bottom: 12px;
    }

    .spinner-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
    }

    .spinner-outer {
      border: 2px solid rgba(59, 130, 246, 0.2);
      border-top-color: #60a5fa;
      animation: spin 1s linear infinite;
    }

    .spinner-inner {
      inset: 6px;
      border: 2px solid rgba(168, 85, 247, 0.2);
      border-bottom-color: #c084fc;
      animation: spin-reverse 1.5s linear infinite;
    }

    .loading-text {
      font-size: 11px;
      font-weight: 600;
      background: linear-gradient(to right, #2563EB, #3B82F6);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .loading-subtext {
      font-size: 9px;
      color: #6B7280;
      font-family: monospace;
      margin-top: 4px;
    }
  }

  @keyframes scan-move {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(300%); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes spin-reverse {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  &--editable {
    border-color: #DBEAFE;
  }

  &--tall {
    height: 200px;
  }

  .node-header {
    height: 36px;
    background: #F9FAFB;
    border-bottom: 1px solid #E5E7EB;
    display: flex;
    align-items: center;
    padding: 0 15px;
    border-radius: 11px 11px 0 0;

    .node-title {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      font-family: 'Inter', sans-serif;
    }
  }

  .node-content {
    height: calc(100% - 36px);
    padding: 12px 15px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #D1D5DB;
      border-radius: 2px;
    }

    .content-text {
      font-size: 12px;
      color: #6B7280;
      line-height: 1.6;
      margin: 0;
      font-family: 'Inter', sans-serif;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .content-textarea {
      width: 100%;
      height: 100%;
      background: transparent;
      border: none;
      color: #111827;
      font-size: 12px;
      line-height: 1.5;
      padding: 0;
      resize: none;
      outline: none;
      font-family: 'Inter', sans-serif;

      &::placeholder {
        color: #9CA3AF;
      }

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: #D1D5DB;
        border-radius: 2px;
      }
    }
  }
}

.port {
  width: 10px !important;
  height: 10px !important;
  background: #ffffff !important;
  border: 2px solid #93C5FD !important;
  
  &.port-out {
    right: -5px !important;
  }

  &.port-in {
    left: -5px !important;
  }
}
</style>
