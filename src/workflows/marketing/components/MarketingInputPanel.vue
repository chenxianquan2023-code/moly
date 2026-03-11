<template>
  <aside class="input-panel">
    <!-- Product Upload -->
    <div class="input-section">
      <div class="section-header">
        <span class="section-title">1. 商品图输入</span>
      </div>
      <div 
        class="upload-area" 
        :class="{ 'has-image': inputData.product }"
        @click="!inputData.product && triggerUpload('product')"
      >
        <img v-if="inputData.product" :src="inputData.product" class="preview-img" />
        <div v-if="inputData.product" class="image-overlay">
          <button class="delete-btn" @click.stop="clearImage('product')" title="删除图片">
            <CloseOutlined />
          </button>
          <button class="replace-btn" @click.stop="triggerUpload('product')" title="更换图片">
            <ReloadOutlined />
          </button>
        </div>
        <div v-else class="upload-placeholder">
          <PlusOutlined class="upload-icon" />
          <span class="upload-text">点击上传商品</span>
        </div>
      </div>
      <input 
        type="file" 
        ref="productInputRef" 
        class="hidden-input" 
        accept="image/*"
        @change="(e) => handleFileChange(e, 'product')"
      />
      <button class="demo-btn" @click="useDemoImage('product')">使用示例图片</button>
    </div>

    <!-- Scene Upload -->
    <div class="input-section">
      <div class="section-header">
        <span class="section-title">2. 设计素材输入</span>
      </div>
      <div 
        class="upload-area" 
        :class="{ 'has-image': inputData.scene }"
        @click="!inputData.scene && triggerUpload('scene')"
      >
        <img v-if="inputData.scene" :src="inputData.scene" class="preview-img garment" />
        <div v-if="inputData.scene" class="image-overlay">
          <button class="delete-btn" @click.stop="clearImage('scene')" title="删除图片">
            <CloseOutlined />
          </button>
          <button class="replace-btn" @click.stop="triggerUpload('scene')" title="更换图片">
            <ReloadOutlined />
          </button>
        </div>
        <div v-else class="upload-placeholder">
          <SkinOutlined class="upload-icon" />
          <span class="upload-text">点击上传场景</span>
        </div>
      </div>
      <input 
        type="file" 
        ref="sceneInputRef" 
        class="hidden-input" 
        accept="image/*"
        @change="(e) => handleFileChange(e, 'scene')"
      />
      <button class="demo-btn" @click="useDemoImage('scene')">使用示例图片</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { PlusOutlined, CloseOutlined, ReloadOutlined, SkinOutlined } from '@ant-design/icons-vue';

// Import demo images
import iphoneImg from '@/assets/img/iphone.png';
import iphone2Img from '@/assets/img/iphone-2.png';
import beiziImg from '@/assets/img/beizi.png';
import beizi2Img from '@/assets/img/beizi-2.png';
import erjiImg from '@/assets/img/erji.png';

interface Props {
  mode?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'decompose'
});

const emit = defineEmits<{
  change: [data: Record<string, any>];
}>();

const productInputRef = ref<HTMLInputElement>();
const sceneInputRef = ref<HTMLInputElement>();

const inputData = reactive({
  product: null as string | null,
  scene: null as string | null
});

// Mode-specific demo images
const demoImages = computed(() => {
  const mode = props.mode || 'decompose';
  
  if (mode === 'decompose') {
    return {
      product: iphoneImg,
      scene: iphone2Img
    };
  } else if (mode === 'creative') {
    return {
      product: beiziImg,
      scene: beizi2Img
    };
  } else if (mode === 'promotion') {
    return {
      product: erjiImg,
      scene: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400'
    };
  }
  
  // Default fallback
  return {
    product: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    scene: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400'
  };
});

const triggerUpload = (type: string) => {
  if (type === 'product') productInputRef.value?.click();
  else sceneInputRef.value?.click();
};

const handleFileChange = (e: Event, type: string) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  const url = URL.createObjectURL(file);
  (inputData as any)[type] = url;
  emit('change', { ...inputData });
};

const clearImage = (type: string) => {
  (inputData as any)[type] = null;
  emit('change', { ...inputData });
};

const useDemoImage = (type: string) => {
  const url = type === 'product' 
    ? demoImages.value.product 
    : demoImages.value.scene;
  (inputData as any)[type] = url;
  emit('change', { ...inputData });
};

const getData = () => ({ ...inputData });
// Validation: Only require product image at InputPanel level
// Mode-specific validation (e.g., promotion allowing single image) is handled by Service
const validate = () => !!inputData.product;

defineExpose({ getData, validate });
</script>

<style scoped lang="scss">
// 完全复制 WorkflowView.vue 的样式
.input-panel {
  width: 320px;
  background: #121212;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  flex-shrink: 0;
  z-index: 20;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #d1d5db;
}

.upload-area {
  height: 192px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  background: #1c1c1e;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: rgba(59, 130, 246, 0.5);
    background: #262626;
  }

  &.has-image {
    border-style: solid;
  }

  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: contain;

    &.garment {
      object-fit: contain;
      padding: 8px;
    }
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .image-overlay {
    opacity: 1;
  }

  .delete-btn, .replace-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.2s;
  }

  .delete-btn {
    background: rgba(239, 68, 68, 0.9);
    color: #fff;

    &:hover {
      background: #ef4444;
      transform: scale(1.1);
    }
  }

  .replace-btn {
    background: rgba(59, 130, 246, 0.9);
    color: #fff;

    &:hover {
      background: #3b82f6;
      transform: scale(1.1);
    }
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #6b7280;

    .upload-icon {
      font-size: 24px;
    }

    .upload-text {
      font-size: 12px;
    }
  }
}

.hidden-input {
  display: none;
}

.demo-btn {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
}
</style>
