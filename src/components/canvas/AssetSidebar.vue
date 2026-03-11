<template>
  <div class="asset-sidebar">
    <a-tabs v-model:activeKey="activeKey" centered class="sidebar-tabs">
      <a-tab-pane key="1" tab="Models">
        <div class="asset-grid">
          <div 
            v-for="i in 10" 
            :key="i" 
            class="asset-item" 
            draggable="true" 
            @dragstart="onDragStart($event, `Model ${i}`)"
          >
            <div class="asset-thumb" :style="{ background: `hsl(${i * 36}, 70%, 50%)` }"></div>
            <span class="asset-name">Model {{ i }}</span>
          </div>
        </div>
      </a-tab-pane>
      <a-tab-pane key="2" tab="Clothes">
        <div class="asset-grid">
          <div 
            v-for="i in 5" 
            :key="i" 
            class="asset-item" 
            draggable="true" 
            @dragstart="onDragStart($event, `Cloth ${i}`)"
          >
           <div class="asset-thumb" :style="{ background: `hsl(${i * 60}, 60%, 40%)` }"></div>
           <span class="asset-name">Cloth {{ i }}</span>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const activeKey = ref('1');

const onDragStart = (event: DragEvent, itemName: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', itemName);
    event.dataTransfer.effectAllowed = 'copy';
  }
};
</script>

<style scoped lang="scss">
.asset-sidebar {
  width: 320px;
  background-color: rgba(20, 20, 20, 0.95); /* Deep dark background */
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.ant-tabs-nav) {
  margin-bottom: 1px;
  background-color: rgba(255, 255, 255, 0.02);
  
  &::before {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
}

:deep(.ant-tabs-tab) {
  color: rgba(255, 255, 255, 0.45);
  &:hover {
    color: rgba(255, 255, 255, 0.8);
  }
}

:deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #1677ff !important;
  text-shadow: 0 0 10px rgba(22, 119, 255, 0.3);
}

.asset-grid {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  overflow-y: auto;
  max-height: calc(100vh - 110px);
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
}

.asset-item {
  cursor: grab;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:active {
    cursor: grabbing;
  }

  .asset-thumb {
    height: 120px;
    border-radius: 12px;
    background-color: #2a2a2a;
    margin-bottom: 12px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
    
    /* Glossy overlay effect */
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 100%);
    }
  }

  &:hover .asset-thumb {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
    border: 1px solid #1677ff;
  }

  .asset-name {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
  }
}
</style>
