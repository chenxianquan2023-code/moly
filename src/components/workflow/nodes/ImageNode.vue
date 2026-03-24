<script setup lang="ts">
import { ref, watch } from 'vue';
import { Handle, Position } from '@vue-flow/core';

const props = defineProps<{
  id: string
  data: {
    title: string
    imageUrl?: string | null
    videoUrl?: string | null
    loading?: boolean
  }
}>();

// Dynamic node dimensions based on image/video aspect ratio
const nodeDimensions = ref({
  width: 220,
  height: 264
});

// Calculate optimal node size when image loads
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  const aspectRatio = img.naturalWidth / img.naturalHeight;
  
  // Define base dimensions
  const baseWidth = 220;
  const minWidth = 180;
  const maxWidth = 260;
  const minHeight = 180;
  const maxHeight = 320;
  
  let newWidth = baseWidth;
  let newHeight = baseWidth / aspectRatio;
  
  // Adjust based on aspect ratio
  if (aspectRatio > 1) {
    // Landscape image
    newWidth = Math.min(maxWidth, baseWidth * Math.min(aspectRatio, 1.5));
    newHeight = newWidth / aspectRatio;
  } else if (aspectRatio < 1) {
    // Portrait image
    newHeight = Math.min(maxHeight, baseWidth / aspectRatio);
    newWidth = newHeight * aspectRatio;
  }
  
  // Apply constraints
  newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
  newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
  
  // Add header height (36px)
  nodeDimensions.value = {
    width: Math.round(newWidth),
    height: Math.round(newHeight) + 36
  };
};

// Reset dimensions when content changes
watch(() => [props.data.imageUrl, props.data.videoUrl], () => {
  if (!props.data.imageUrl && !props.data.videoUrl) {
    // Reset to default when no content
    nodeDimensions.value = {
      width: 220,
      height: 264
    };
  }
});

// Video element ref for hover play control
const videoRef = ref<HTMLVideoElement | null>(null);

// Calculate optimal node size when video metadata loads
const handleVideoLoad = (event: Event) => {
  const video = event.target as HTMLVideoElement;
  const aspectRatio = video.videoWidth / video.videoHeight;
  
  console.log('[ImageNode] Video dimensions:', video.videoWidth, 'x', video.videoHeight, 'ratio:', aspectRatio);
  
  // Define base dimensions (same as image)
  const baseWidth = 220;
  const minWidth = 180;
  const maxWidth = 260;
  const minHeight = 180;
  const maxHeight = 320;
  
  let newWidth = baseWidth;
  let newHeight = baseWidth / aspectRatio;
  
  // Adjust based on aspect ratio
  if (aspectRatio > 1) {
    // Landscape video
    newWidth = Math.min(maxWidth, baseWidth * Math.min(aspectRatio, 1.5));
    newHeight = newWidth / aspectRatio;
  } else if (aspectRatio < 1) {
    // Portrait video
    newHeight = Math.min(maxHeight, baseWidth / aspectRatio);
    newWidth = newHeight * aspectRatio;
  }
  
  // Apply constraints
  newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
  newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
  
  // Add header height (36px)
  nodeDimensions.value = {
    width: Math.round(newWidth),
    height: Math.round(newHeight) + 36
  };
};

// Play video on mouse enter
const handleVideoMouseEnter = () => {
  if (videoRef.value) {
    videoRef.value.play().catch(err => {
      console.warn('[ImageNode] Video play failed:', err);
    });
  }
};

// Pause video on mouse leave
const handleVideoMouseLeave = () => {
  if (videoRef.value) {
    videoRef.value.pause();
  }
};
</script>

<template>
  <div class="image-node" :style="{ width: nodeDimensions.width + 'px', height: nodeDimensions.height + 'px' }">
    <!-- 标题栏 -->
    <div class="node-header">
      <span class="node-title">{{ data.title }}</span>
    </div>
    
    <!-- 内容区域 -->
    <div class="node-content">
      <!-- 加载中遮罩 - 全息扫描效果 -->
      <div v-if="data.loading" class="loading-overlay">
        <div class="scan-line"></div>
        <div class="scan-gradient"></div>
        <div class="spinner-container">
          <div class="spinner-ring spinner-outer"></div>
          <div class="spinner-ring spinner-inner"></div>
        </div>
        <div class="loading-text">AI 正在绘图</div>
        <div class="loading-subtext">Processing...</div>
      </div>
      
      <img 
        v-if="data.imageUrl && !data.videoUrl" 
        :src="data.imageUrl" 
        class="content-image" 
        :class="{ 'is-loading': data.loading }" 
        @load="handleImageLoad"
      />
      <video 
        v-else-if="data.videoUrl"
        ref="videoRef"
        :src="data.videoUrl"
        class="content-video"
        loop
        muted
        playsinline
        @loadedmetadata="handleVideoLoad"
        @mouseenter="handleVideoMouseEnter"
        @mouseleave="handleVideoMouseLeave"
        @loadeddata="() => console.log('[ImageNode] Video loaded:', data.videoUrl)"
        @error="(e) => console.error('[ImageNode] Video error:', e, data.videoUrl)"
      >
        您的浏览器不支持视频播放
      </video>
      <div v-else class="content-placeholder"></div>
    </div>
    
    <!-- 端口 -->
    <Handle v-if="id !== 'result'" type="source" :position="Position.Right" class="port port-out" />
    <Handle v-if="id === 'process' || id === 'result'" type="target" :position="Position.Left" class="port port-in" />
  </div>
</template>

<style scoped lang="scss">
.image-node {
  // Dynamic width and height set via inline style
  background: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;

  .node-header {
    height: 36px;
    background: #F9FAFB;
    border-bottom: 1px solid #E5E7EB;
    display: flex;
    align-items: center;
    padding: 0 15px;

    .node-title {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      font-family: 'Inter', sans-serif;
    }
  }

  .node-content {
    height: calc(100% - 36px);
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .content-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 8px;
      transition: opacity 0.3s;

      &.is-loading {
        opacity: 0.3;
      }
    }

    .content-video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 8px;
      background: #F3F4F6;
      cursor: pointer;
      transition: opacity 0.3s;

      // Hide controls completely
      &::-webkit-media-controls {
        display: none !important;
      }

      &::-webkit-media-controls-enclosure {
        display: none !important;
      }

      // Hover effect
      &:hover {
        opacity: 0.95;
      }
    }

    .content-placeholder {
      width: 100%;
      height: 100%;
      background: #F3F4F6;
      border-radius: 8px;
    }

    // 加载遮罩
    .loading-overlay {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(2px);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      overflow: hidden;

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

      .spinner-container {
        position: relative;
        width: 48px;
        height: 48px;
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
        inset: 8px;
        border: 2px solid rgba(168, 85, 247, 0.2);
        border-bottom-color: #c084fc;
        animation: spin-reverse 1.5s linear infinite;
      }

      .loading-text {
        font-size: 12px;
        font-weight: 600;
        background: linear-gradient(to right, #2563EB, #3B82F6);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: pulse 1.5s ease-in-out infinite;
      }

      .loading-subtext {
        font-size: 10px;
        color: #6B7280;
        font-family: monospace;
        margin-top: 4px;
      }
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
}

.port {
  width: 10px !important;
  height: 10px !important;
  background: #ffffff !important;
  border: 2px solid #93C5FD !important;

  &.port-in {
    left: -5px !important;
  }

  &.port-out {
    right: -5px !important;
  }
}
</style>
