<template>
  <div class="simplified-tryon">
    <header class="simplified-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <span>AI 模特试穿</span>
        </div>
        <div class="header-right">
          <span class="points"><ThunderboltFilled /> {{ auth.points }} 积分</span>
          <router-link to="/recharge" class="recharge-link">充值</router-link>
          <router-link to="/workflow/try-on" class="advanced-link">高级模式</router-link>
        </div>
      </div>
    </header>

    <UploadImageModal
      v-if="showUploadModal"
      :upload-type="uploadModalType"
      @close="showUploadModal = false"
      @confirm="onUploadConfirm"
    />

    <main class="simplified-main">
      <!-- 左侧：大上传区 + 示例图 -->
      <aside class="upload-panel">
        <div class="upload-section">
          <div class="section-label">1. 模特图</div>
          <div
            class="upload-area large"
            :class="{ hasImage: inputs.model }"
            @click="!inputs.model && openUploadModal('model')"
            @dragover.prevent="onDragOver($event, 'model')"
            @drop.prevent="onDrop($event, 'model')"
          >
            <img v-if="inputs.model" :src="inputs.model" class="preview-img" />
            <div v-if="inputs.model" class="image-overlay">
              <button class="overlay-btn" @click.stop="clearImage('model')" title="删除">删除</button>
              <button class="overlay-btn" @click.stop="openUploadModal('model')" title="更换">更换</button>
            </div>
            <div v-else class="upload-placeholder">
              <PlusOutlined class="upload-icon" />
              <span>点击或拖拽上传模特</span>
            </div>
          </div>
          <input ref="modelInputRef" type="file" class="hidden-input" accept="image/*" @change="e => handleFileChange(e, 'model')" />
          <div class="example-row">
            <span class="example-label">示例：</span>
            <button type="button" class="demo-btn" @click="modelInputRef?.click()">本地上传</button>
            <button
              v-for="(url, i) in modelExamples"
              :key="i"
              class="example-thumb"
              @click="inputs.model = url"
            >
              <img :src="url" alt="示例" />
            </button>
          </div>
        </div>

        <div class="upload-section">
          <div class="section-label">2. 服装图</div>
          <div
            class="upload-area large"
            :class="{ hasImage: inputs.garment }"
            @click="!inputs.garment && openUploadModal('garment')"
            @dragover.prevent="onDragOver($event, 'garment')"
            @drop.prevent="onDrop($event, 'garment')"
          >
            <img v-if="inputs.garment" :src="inputs.garment" class="preview-img" />
            <div v-if="inputs.garment" class="image-overlay">
              <button class="overlay-btn" @click.stop="clearImage('garment')">删除</button>
              <button class="overlay-btn" @click.stop="openUploadModal('garment')">更换</button>
            </div>
            <div v-else class="upload-placeholder">
              <SkinOutlined class="upload-icon" />
              <span>点击或拖拽上传服装（白底更佳）</span>
            </div>
          </div>
          <input ref="garmentInputRef" type="file" class="hidden-input" accept="image/*" @change="e => handleFileChange(e, 'garment')" />
          <div class="example-row">
            <span class="example-label">示例：</span>
            <button type="button" class="demo-btn" @click="garmentInputRef?.click()">本地上传</button>
            <button
              v-for="(url, i) in garmentExamples"
              :key="i"
              class="example-thumb"
              @click="inputs.garment = url"
            >
              <img :src="url" alt="示例" />
            </button>
          </div>
        </div>
      </aside>

      <!-- 右侧：选项卡配置 + 预览 -->
      <div class="right-panel">
        <div class="tabs-area">
          <div class="tab-item" :class="{ active: activeTab === 'style' }" @click="activeTab = 'style'">风格</div>
          <div class="tab-item" :class="{ active: activeTab === 'size' }" @click="activeTab = 'size'">比例</div>
          <div class="tab-item" :class="{ active: activeTab === 'quality' }" @click="activeTab = 'quality'">质量</div>
        </div>

        <div v-show="activeTab === 'style'" class="tab-content">
          <label class="field-label">摄影风格</label>
          <select v-model="configPhotoStyle" class="field-select">
            <option value="realistic">写实摄影</option>
            <option value="fashion">时尚大片</option>
            <option value="street">街拍风格</option>
            <option value="commercial">商业广告风</option>
          </select>
          <label class="field-label mt">模特动作</label>
          <textarea v-model="configActionText" rows="2" class="field-textarea" placeholder="如：潇洒自信，眼神凝视镜头"></textarea>
        </div>

        <div v-show="activeTab === 'size'" class="tab-content">
          <label class="field-label">图片比例</label>
          <select v-model="configAspectRatio" class="field-select">
            <option value="1:1">1:1 正方形</option>
            <option value="3:4">3:4 竖版</option>
            <option value="4:3">4:3 横版</option>
            <option value="16:9">16:9 宽屏</option>
            <option value="9:16">9:16 手机竖屏</option>
          </select>
        </div>

        <div v-show="activeTab === 'quality'" class="tab-content">
          <label class="field-label">图片质量</label>
          <select v-model="configImageSize" class="field-select">
            <option value="1K">1K 标准</option>
            <option value="2K">2K 高清</option>
            <option value="4K">4K 超清</option>
          </select>
          <label class="field-label mt">创意程度 {{ configTemperature.toFixed(1) }}</label>
          <input type="range" v-model.number="configTemperature" min="0.1" max="1.5" step="0.1" class="field-slider" />
        </div>

        <div class="preview-area">
          <div class="preview-label">生成结果</div>
          <div v-if="!resultImage && !isGenerating" class="preview-empty">
            上传模特图和服装图，点击生成
          </div>
          <div v-else-if="isGenerating" class="preview-loading">
            <LoadingOutlined class="spin" />
            <span>正在融合...</span>
          </div>
          <img v-else-if="resultImage" :src="resultImage" alt="结果" class="preview-result" />
        </div>

        <div class="cost-row">
          <span>预估消耗 <ThunderboltFilled class="icon" /> {{ GENERATION_COST }} 积分</span>
        </div>
        <button
          class="generate-btn"
          :class="{ disabled: isGenerating || !inputs.model || !inputs.garment || !isGeneratedReady }"
          :disabled="isGenerating || !inputs.model || !inputs.garment || !isGeneratedReady"
          @click="startGeneration"
        >
          <ExperimentOutlined v-if="!isGenerating" />
          <LoadingOutlined v-else class="spin" />
          {{ isGenerating ? '生成中...' : '生成虚拟试穿' }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import {
  RightOutlined,
  PlusOutlined,
  SkinOutlined,
  ThunderboltFilled,
  ExperimentOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue';
import UploadImageModal from '@/components/upload/UploadImageModal.vue';
import { tryOnService } from '@/services/tryOn.service';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';

const auth = useAuthStore();
const GENERATION_COST = 3;

const modelInputRef = ref<HTMLInputElement | null>(null);
const garmentInputRef = ref<HTMLInputElement | null>(null);

const showUploadModal = ref(false);
const uploadModalType = ref<'model' | 'garment'>('model');
function openUploadModal(type: 'model' | 'garment') {
  uploadModalType.value = type;
  showUploadModal.value = true;
}
async function onUploadConfirm(imageUrl: string) {
  inputs[uploadModalType.value] = imageUrl;
  await triggerAnalysisIfReady();
}

const inputs = reactive({ model: null as string | null, garment: null as string | null });
const resultImage = ref<string | null>(null);
const isGenerating = ref(false);
const isGeneratedReady = ref(false);
const modelDesc = ref('');
const garmentDesc = ref('');

const configActionText = ref('潇洒自信，眼神凝视镜头');
const configAspectRatio = ref('3:4');
const configImageSize = ref('2K');
const configTemperature = ref(0.7);
const configPhotoStyle = ref('realistic');

const activeTab = ref<'style' | 'size' | 'quality'>('style');

const modelExamples = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop',
];

const garmentExamples = [
  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop',
];

const styleLabels: Record<string, string> = {
  realistic: '写实摄影风格',
  fashion: '时尚大片风格',
  street: '街拍风格',
  commercial: '商业广告风',
};

function getGeneratedPrompt(): string {
  const actionText = configActionText.value.trim() || '自然站立';
  const mDesc = modelDesc.value || '图1人物';
  const gDesc = garmentDesc.value || '图2服装';
  const styleDesc = styleLabels[configPhotoStyle.value] || '写实摄影风格';
  return `请生成一张${styleDesc}的虚拟试穿效果图：

【任务】让人物A（${mDesc}）以动作C（${actionText}）穿上衣服B（${gDesc}）

【要求】
1. 保证衣服B和原图100%一致
2. 保持人物外貌特征不变

【拍摄参数】半身照，平视角度`;
}

const triggerAnalysisIfReady = async () => {
  if (!inputs.model || !inputs.garment) return;
  isGeneratedReady.value = false;
  try {
    const res = await tryOnService.analyzeBothImages(inputs.model, inputs.garment);
    const parts = res.split('；');
    if (parts.length >= 2) {
      modelDesc.value = parts[0]?.trim() || '';
      garmentDesc.value = parts[1]?.trim() || '';
    } else {
      modelDesc.value = res.trim();
      garmentDesc.value = '';
    }
    isGeneratedReady.value = true;
  } catch (err) {
    modelDesc.value = '图1人物';
    garmentDesc.value = '图2服装';
    isGeneratedReady.value = true;
  }
};

watch([() => inputs.model, () => inputs.garment], () => {
  if (inputs.model && inputs.garment) triggerAnalysisIfReady();
  else isGeneratedReady.value = false;
});

function clearImage(type: 'model' | 'garment') {
  inputs[type] = null;
  isGeneratedReady.value = false;
  if (type === 'model') modelDesc.value = '';
  else garmentDesc.value = '';
  resultImage.value = null;
}

async function handleFileChange(e: Event, type: 'model' | 'garment') {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  inputs[type] = URL.createObjectURL(file);
  target.value = '';
  await triggerAnalysisIfReady();
}

function onDragOver(_e: DragEvent, _t: string) {}
async function onDrop(e: DragEvent, type: 'model' | 'garment') {
  const f = e.dataTransfer?.files?.[0];
  if (!f?.type.startsWith('image/')) return;
  inputs[type] = URL.createObjectURL(f);
  await triggerAnalysisIfReady();
}

const startGeneration = async () => {
  if (!inputs.model || !inputs.garment || !isGeneratedReady.value) return;
  if (auth.points < GENERATION_COST) {
    message.warning(`积分不足，当前剩余 ${auth.points} 积分`);
    return;
  }
  if (!auth.deductPoints(GENERATION_COST)) return;
  isGenerating.value = true;
  resultImage.value = null;
  const prompt = getGeneratedPrompt();
  try {
    const res = await tryOnService.generateByCustomPrompt(
      prompt,
      inputs.model,
      inputs.garment,
      {
        aspectRatio: configAspectRatio.value,
        imageSize: configImageSize.value,
        temperature: configTemperature.value,
      }
    );
    if (res.startsWith('data:image')) {
      resultImage.value = res;
      message.success('生成成功！');
    } else {
      message.error('生成失败，请重试');
    }
  } catch (err) {
    message.error('生成失败，请稍后重试');
  } finally {
    isGenerating.value = false;
  }
};
</script>

<style scoped lang="scss">
.simplified-tryon {
  min-height: 100vh;
  background: #ffffff;
}

.simplified-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 20px;
  position: sticky;
  top: 0;
  z-index: 50;

  .header-inner {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .logo-img { height: 32px; width: auto; object-fit: contain; }

  .breadcrumb {
    font-size: 14px;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 8px;
    a { color: #2563eb; text-decoration: none; &:hover { text-decoration: underline; } }
    .crumb-icon { font-size: 10px; }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 14px;
  }

  .points { color: #6b7280; }
  .recharge-link { color: #2563eb; text-decoration: none; }
  .advanced-link {
    font-size: 13px;
    color: #6b7280;
    text-decoration: none;
    padding: 6px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    transition: all 0.2s;
    &:hover { background: #f3f4f6; color: #111; }
  }
}

.simplified-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px 80px;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 32px;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.upload-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.upload-section {
  .section-label {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
  }
}

.upload-area.large {
  min-height: 200px;
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;

  &:hover:not(.hasImage) { border-color: #2563eb; background: #f9fafb; }

  &.hasImage {
    border-style: solid;
    border-color: #e5e7eb;
  }

  .preview-img {
    max-width: 100%;
    max-height: 280px;
    object-fit: contain;
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  &:hover .image-overlay { opacity: 1; }
  .overlay-btn {
    background: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: #f3f4f6; }
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #9ca3af;
    font-size: 14px;
    .upload-icon { font-size: 32px; }
  }
}

.hidden-input { display: none; }

.example-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  .example-label { font-size: 13px; color: #9ca3af; }
  .demo-btn {
    padding: 6px 12px;
    font-size: 13px;
    color: #6b7280;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: #e5e7eb; color: #374151; }
  }
  .example-thumb {
    width: 56px;
    height: 56px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { border-color: #2563eb; }
    img { width: 100%; height: 100%; object-fit: cover; }
  }
}

.right-panel {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tabs-area {
  display: flex;
  gap: 4px;
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 10px;
    font-size: 14px;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    &.active { background: #2563eb; color: #fff; }
    &:hover:not(.active) { background: #e5e7eb; }
  }
}

.tab-content {
  .field-label { display: block; font-size: 13px; color: #374151; margin-bottom: 6px; }
  .field-label.mt { margin-top: 12px; }
  .field-select, .field-textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
  }
  .field-textarea { resize: vertical; min-height: 60px; }
  .field-slider { width: 100%; margin-top: 4px; }
}

.preview-area {
  min-height: 240px;
  background: #f9fafb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .preview-label { font-size: 13px; color: #6b7280; margin-bottom: 8px; width: 100%; padding-left: 4px; }
  .preview-empty { color: #9ca3af; font-size: 14px; }
  .preview-loading { color: #6b7280; display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .preview-result { max-width: 100%; max-height: 320px; object-fit: contain; }
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.cost-row {
  font-size: 13px;
  color: #6b7280;
  .icon { color: #f59e0b; margin-right: 4px; }
}

.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 24px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(.disabled) { background: #1d4ed8; }
  &.disabled { opacity: 0.6; cursor: not-allowed; }
}
</style>
