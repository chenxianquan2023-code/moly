<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  id: string
  data: {
    title: string
    content: string
  }
}>()
</script>

<template>
  <div class="config-node">
    <!-- 标题栏 -->
    <div class="node-header">
      <span class="node-title">{{ data.title }}</span>
    </div>
    
    <!-- 内容区域 -->
    <div class="node-content">
      <p class="content-text">{{ data.content }}</p>
    </div>
    
    <!-- 端口 -->
    <Handle type="target" :position="Position.Left" class="port port-in" />
    <Handle type="source" :position="Position.Right" class="port port-out" />
  </div>
</template>

<style scoped lang="scss">
.config-node {
  width: 240px;
  height: 200px;
  background: #18181b;
  border: 1px solid #333;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transition: all 0.2s;
  
  .node-header {
    height: 36px;
    background: #27272a;
    display: flex;
    align-items: center;
    padding: 0 15px;
    
    .node-title {
      font-size: 13px;
      font-weight: 600;
      color: #e4e4e7;
      font-family: 'Inter', sans-serif;
    }
  }
  
  .node-content {
    height: calc(100% - 36px);
    padding: 12px 15px;
    overflow: hidden;
    
    .content-text {
      font-size: 12px;
      color: #a1a1aa;
      line-height: 1.5;
      margin: 0;
      font-family: 'Inter', sans-serif;
      white-space: pre-wrap;
    }
  }
}

.port {
  width: 10px !important;
  height: 10px !important;
  background: #18181b !important;
  border: 2px solid #71717a !important;
  
  &.port-in {
    left: -5px !important;
  }
  
  &.port-out {
    right: -5px !important;
  }
}
</style>
