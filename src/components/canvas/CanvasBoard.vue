<template>
  <div class="canvas-container" ref="containerRef" @drop="handleDrop" @dragover="handleDragOver">
    <canvas ref="canvasEl"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
// Fabric import strategy often depends on version.
// Fabric import strategy often depends on version.
// For 'fabric' package (usually v5 or v6 beta), named exports might not be available if it's v5 commonjs.
// Let's try standard import * as fabric from 'fabric'; for safety if version is uncertain.
import * as fabric from 'fabric';
import { useCanvasStore } from '../../stores/canvas';

const containerRef = ref<HTMLDivElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);
const canvasStore = useCanvasStore();
let canvas: any = null;

onMounted(async () => {
  if (canvasEl.value && containerRef.value) {
    // Initialize Fabric Canvas
    // Note: In Fabric v6, it's new Canvas(el, options). In v5, it's also new fabric.Canvas(el, options).
    const { width, height } = containerRef.value.getBoundingClientRect();
    
    // Check if named export works or default
    const CanvasClass = (fabric as any).Canvas || fabric.Canvas;
    
    canvas = new CanvasClass(canvasEl.value, {
      width,
      height,
      backgroundColor: '#1f1f1f', // Dark canvas background
      preserveObjectStacking: true,
    });

    canvasStore.setCanvas(canvas);

    // Initial Test Object based on design (Workbench placeholder)
    const rect = new (fabric as any).Rect({
      left: 100,
      top: 100,
      fill: '#1677ff',
      width: 200,
      height: 200,
      rx: 10,
      ry: 10
    });
    canvas.add(rect);

    // Event Listeners
    canvas.on('selection:created', (e: any) => {
      canvasStore.setActiveObject(e.selected ? e.selected[0] : null);
    });
    canvas.on('selection:cleared', () => {
      canvasStore.setActiveObject(null);
    });
    canvas.on('selection:updated', (e: any) => {
      canvasStore.setActiveObject(e.selected ? e.selected[0] : null);
    });
    
    // Handle Window Resize
    window.addEventListener('resize', handleResize);
  }
});

const handleDrop = async (e: DragEvent) => {
  e.preventDefault();
  if (!canvas) return;

  const type = e.dataTransfer?.getData('text/plain');
  if (type) {
    const { layerX, layerY } = e as any; // Simple coordinate approx
    // In real app, use canvas.getPointer(e)
    
    // Create a mock object based on type
    let obj: any;
    const color = type.includes('Model') ? '#ffa940' : '#1677ff';
    
    if ((fabric as any).Rect) {
         obj = new (fabric as any).Rect({
            left: layerX - 50,
            top: layerY - 50,
            fill: color,
            width: 100,
            height: 100,
            rx: 5,
            ry: 5
        });
    }

    if (obj) {
        canvas.add(obj);
        canvas.setActiveObject(obj);
        obj.set({
            // Custom property to store type if needed
            type: type
        });
        canvas.renderAll();
    }
  }
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault(); // Necessary to allow dropping
};

const handleResize = () => {
  if (canvas && containerRef.value) {
    const { width, height } = containerRef.value.getBoundingClientRect();
    canvas.setWidth(width);
    canvas.setHeight(height);
    canvas.renderAll();
  }
};

onUnmounted(() => {
  if (canvas) {
    canvas.dispose();
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  background-color: #2a2a2a; /* Slightly lighter than canvas bg to show bounds */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
</style>
