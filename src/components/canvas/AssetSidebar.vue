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
  background-color: #ffffff;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.ant-tabs-nav) {
  margin-bottom: 1px;
  background-color: #ffffff;

  &::before {
    border-bottom: 1px solid #E5E7EB;
  }
}

:deep(.ant-tabs-tab) {
  color: #6B7280;
  &:hover {
    color: #111827;
  }
}

:deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #2563EB !important;
}

.asset-grid {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  overflow-y: auto;
  max-height: calc(100vh - 110px);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #D1D5DB;
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
    background-color: #F3F4F6;
    margin-bottom: 12px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;
  }

  &:hover .asset-thumb {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(37, 99, 235, 0.12);
    border: 1px solid #2563EB;
  }

  .asset-name {
    font-size: 13px;
    color: #6B7280;
    font-weight: 500;
  }
}
</style>
