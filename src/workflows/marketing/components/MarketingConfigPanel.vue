<template>
  <aside class="config-panel">
    <div class="config-header">
      <h2 class="config-title">营销物料配置</h2>
      <p class="config-subtitle">AI 生成商品营销素材</p>
    </div>

    <div class="config-body">
      <!-- 功能模式选择 -->
      <div class="config-group">
        <div class="group-title">功能模式</div>
        <div class="config-field">
          <div class="select-wrapper">
            <select v-model="configData.mode" class="config-select">
              <option value="decompose">全能分解</option>
              <option value="creative">文创周边生成</option>
              <option value="promotion">爆款折扣促销海报</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 提示词输入 -->
      <div class="config-group">
        <div class="group-title">生成提示词</div>
        <div class="config-field">
          <textarea 
            v-model="configData.prompt" 
            class="config-textarea"
            :placeholder="configData.mode === 'decompose' ? '描述您想要的分解动画效果，如：产品缓慢旋转展示内部结构，组件依次展开...' : 
                         configData.mode === 'creative' ? '描述您想要的文创周边设计，如：将产品图案应用到T恤、马克杯等周边上，风格年轻时尚...' :
                         '描述您想要的促销海报效果，如：醒目的折扣标签，动感的背景，突出产品卖点...'"
            rows="6"
          />
        </div>
      </div>

      <!-- 图片设置（仅文创周边和促销海报模式） -->
      <div v-if="configData.mode !== 'decompose'" class="config-group">
        <div class="group-title">图片设置</div>
        
        <!-- 图片比例 -->
        <div class="config-field">
          <label class="field-label">图片比例</label>
          <div class="select-wrapper">
            <select v-model="configData.aspectRatio" class="config-select">
              <option value="3:4">3:4 竖版</option>
              <option value="16:9">16:9 横版</option>
              <option value="1:1">1:1 方形</option>
              <option value="4:3">4:3 横版</option>
            </select>
          </div>
        </div>

        <!-- 图片质量 -->
        <div class="config-field">
          <label class="field-label">图片质量</label>
          <div class="select-wrapper">
            <select v-model="configData.imageSize" class="config-select">
              <option value="2K">2K 高清</option>
              <option value="4K">4K 超清</option>
              <option value="1K">1K 标清</option>
            </select>
          </div>
        </div>

        <!-- 创意程度 -->
        <div class="config-field">
          <label class="field-label">创意程度: {{ configData.temperature }}</label>
          <div class="slider-container">
            <span class="slider-label">保守</span>
            <input 
              type="range" 
              v-model.number="configData.temperature"
              min="0" 
              max="1" 
              step="0.1"
              class="creative-slider"
            />
            <span class="slider-label">创意</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 生成按钮 -->
    <div class="config-footer">
      <div class="cost-info">
        <span>预估消耗</span>
        <span class="cost-value">
          <ThunderboltFilled class="cost-icon" /> 5 积分
        </span>
      </div>
      <button 
        class="generate-btn" 
        :class="{ disabled: !canGenerate }"
        :disabled="!canGenerate || isExecuting"
        @click="handleExecute"
      >
        <template v-if="!isExecuting">
          <ExperimentOutlined class="btn-icon" />
          <span>生成营销物料</span>
        </template>
        <template v-else>
          <LoadingOutlined class="btn-icon spinning" />
          <span>正在生成...</span>
        </template>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import {
  ThunderboltFilled,
  ExperimentOutlined,
  LoadingOutlined
} from '@ant-design/icons-vue';

interface Props {
  canGenerate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canGenerate: false
});

const emit = defineEmits<{
  execute: [config: Record<string, any>];
  change: [config: Record<string, any>];
}>();

const isExecuting = ref(false);

const configData = reactive({
  mode: 'decompose',
  prompt: '',
  aspectRatio: '4:3',
  imageSize: '2K',
  temperature: 0.7
});

// Watch for config changes and emit to parent
watch(() => configData.mode, () => {
  emit('change', { ...configData });
}, { immediate: true });

watch(() => configData.prompt, () => {
  emit('change', { ...configData });
});

const handleExecute = () => {
  emit('execute', { ...configData });
};

const getData = () => ({ ...configData });
const setExecuting = (executing: boolean) => {
  isExecuting.value = executing;
};

defineExpose({ getData, setExecuting });
</script>

<style scoped lang="scss">
// 完全复制 WorkflowView.vue 的样式
.config-panel {
  width: 320px;
  background: #121212;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
  z-index: 20;
}

.config-header {
  margin-bottom: 24px;

  .config-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: #fff;
  }

  .config-subtitle {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
  }
}

.config-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.config-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-title {
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-wrapper {
  position: relative;
}

.config-select {
  width: 100%;
  padding: 10px 12px;
  background: #F9FAFB;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(59, 130, 246, 0.5);
    background: #262626;
  }

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  option {
    background: #F9FAFB;
    color: #fff;
  }
}

.config-textarea {
  width: 100%;
  padding: 10px 12px;
  background: #F9FAFB;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: all 0.2s;
  line-height: 1.5;

  &::placeholder {
    color: #6b7280;
  }

  &:hover {
    border-color: rgba(59, 130, 246, 0.5);
    background: #262626;
  }

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #d1d5db;
  font-weight: 500;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.slider-label {
  font-size: 12px;
  color: #9ca3af;
  min-width: 36px;
}

.creative-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 2px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #8b5cf6;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
    }
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #8b5cf6;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
    }
  }
}

.config-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cost-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #9ca3af;

  .cost-value {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #fbbf24;
  }

  .cost-icon {
    font-size: 14px;
  }
}

.generate-btn {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

  &:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }

  &:active:not(.disabled) {
    transform: translateY(0);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-icon {
    font-size: 16px;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
