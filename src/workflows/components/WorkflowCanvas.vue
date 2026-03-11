<template>
  <main class="canvas-area">
    <!-- Zoom Controls -->
    <div class="zoom-controls">
      <button class="zoom-btn" @click="handleFitView" title="适应屏幕">
        <ExpandOutlined />
      </button>
      <div class="zoom-divider"></div>
      <button class="zoom-btn" @click="handleZoomOut">
        <MinusOutlined />
      </button>
      <span class="zoom-level">{{ Math.round(viewport.zoom * 100) }}%</span>
      <button class="zoom-btn" @click="handleZoomIn">
        <PlusOutlined />
      </button>
    </div>

    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :default-viewport="{ x: 0, y: 0, zoom: 1 }"
      :min-zoom="0.2"
      :max-zoom="3"
      :snap-to-grid="false"
      :snap-grid="[24, 24]"
      :nodes-draggable="true"
      :pan-on-drag="true"
      :zoom-on-scroll="true"
      class="workflow-flow"
      @viewport-change="onViewportChange"
    >
      <!-- Custom Nodes -->
      <template #node-image="nodeProps">
        <ImageNode v-bind="nodeProps" />
      </template>
      <template #node-text="nodeProps">
        <TextNode v-bind="nodeProps" />
      </template>

      <!-- Background Grid -->
      <Background :gap="24" :size="1" pattern-color="#222" />
    </VueFlow>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ExpandOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import type { Node, Edge } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

import ImageNode from '@/components/workflow/nodes/ImageNode.vue';
import TextNode from '@/components/workflow/nodes/TextNode.vue';

interface Props {
  nodes: Node[];
  edges: Edge[];
}

defineProps<Props>();

const { fitView, zoomIn, zoomOut } = useVueFlow();
const viewport = ref({ x: 0, y: 0, zoom: 1 });

const onViewportChange = (vp: { x: number; y: number; zoom: number }) => {
  viewport.value = vp;
};

const handleFitView = () => {
  fitView({ padding: 0.2 });
};

const handleZoomIn = () => {
  zoomIn();
};

const handleZoomOut = () => {
  zoomOut();
};

defineExpose({
  fitView: handleFitView,
  zoomIn: handleZoomIn,
  zoomOut: handleZoomOut
});
</script>

<style scoped lang="scss">
.canvas-area {
  flex: 1;
  position: relative;
  background: #0a0a0a;
}

.zoom-controls {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 14px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.zoom-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 4px;
}

.zoom-level {
  min-width: 48px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.workflow-flow {
  width: 100%;
  height: 100%;
}
</style>
