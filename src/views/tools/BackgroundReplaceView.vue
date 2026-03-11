<template>
  <div class="tool-page">
    <header class="tool-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <span>AI 背景替换</span>
        </div>
        <div class="header-right">
          <span class="points"><ThunderboltFilled /> {{ auth.points }} 积分</span>
          <router-link to="/recharge" class="recharge-link">充值</router-link>
        </div>
      </div>
    </header>

    <main class="tool-main">
      <aside class="upload-panel">
        <div class="upload-section">
          <div class="section-label">主体图片</div>
          <div
            class="upload-area large"
            :class="{ hasImage: inputImage }"
            @click="!inputImage && openFile()"
            @dragover.prevent
            @drop.prevent="onDrop"
          >
            <img v-if="inputImage" :src="inputImage" class="preview-img" />
            <div v-if="inputImage" class="image-overlay">
              <button class="overlay-btn" @click.stop="clearImage">删除</button>
              <button class="overlay-btn" @click.stop="openFile">更换</button>
            </div>
            <div v-else class="upload-placeholder">
              <PictureOutlined class="upload-icon" />
              <span>点击或拖拽上传图片</span>
            </div>
          </div>
          <input ref="fileRef" type="file" class="hidden-input" accept="image/*" @change="onFileChange" />
          <div class="example-row">
            <span class="example-label">示例：</span>
            <button type="button" class="demo-btn" @click="openFile">本地上传</button>
            <button v-for="(url, i) in examples" :key="i" class="example-thumb" @click="inputImage = url">
              <img :src="url" alt="示例" />
            </button>
          </div>
        </div>
      </aside>

      <div class="right-panel">
        <div class="tabs-area">
          <div class="tab-item" :class="{ active: activeTab === 'preset' }" @click="activeTab = 'preset'">预设</div>
          <div class="tab-item" :class="{ active: activeTab === 'custom' }" @click="activeTab = 'custom'">自定义</div>
        </div>

        <div v-show="activeTab === 'preset'" class="tab-content">
          <label class="field-label">背景类型</label>
          <select v-model="bgPreset" class="field-select">
            <option value="white">纯白</option>
            <option value="gray">浅灰</option>
            <option value="gradient">渐变</option>
            <option value="studio">棚拍背景</option>
            <option value="outdoor">户外自然</option>
          </select>
        </div>

        <div v-show="activeTab === 'custom'" class="tab-content">
          <label class="field-label">背景描述</label>
          <textarea v-model="bgCustom" rows="3" class="field-textarea" placeholder="如：木质桌面、暖色灯光、绿植"></textarea>
        </div>

        <div class="tab-content">
          <label class="field-label">输出比例</label>
          <select v-model="aspectRatio" class="field-select">
            <option value="1:1">1:1</option>
            <option value="3:4">3:4</option>
            <option value="4:3">4:3</option>
          </select>
        </div>

        <div class="preview-area">
          <div class="preview-label">生成结果</div>
          <div v-if="!resultImage && !isGenerating" class="preview-empty">上传图片，点击生成</div>
          <div v-else-if="isGenerating" class="preview-loading">
            <LoadingOutlined class="spin" />
            <span>生成中...</span>
          </div>
          <img v-else-if="resultImage" :src="resultImage" alt="结果" class="preview-result" />
        </div>

        <div class="cost-row">预估消耗 <ThunderboltFilled class="icon" /> 3 积分</div>
        <button
          class="generate-btn"
          :class="{ disabled: isGenerating || !inputImage }"
          :disabled="isGenerating || !inputImage"
          @click="generate"
        >
          <ExperimentOutlined v-if="!isGenerating" />
          <LoadingOutlined v-else class="spin" />
          {{ isGenerating ? '生成中...' : '替换背景' }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { RightOutlined, ThunderboltFilled, PictureOutlined, ExperimentOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { geminiService } from '@/services/gemini.service';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';

const auth = useAuthStore();
const fileRef = ref<HTMLInputElement | null>(null);
const inputImage = ref<string | null>(null);
const resultImage = ref<string | null>(null);
const isGenerating = ref(false);
const activeTab = ref<'preset' | 'custom'>('preset');
const bgPreset = ref('white');
const bgCustom = ref('');
const aspectRatio = ref('1:1');

const presetLabels: Record<string, string> = {
  white: '纯白背景',
  gray: '浅灰背景',
  gradient: '柔和渐变',
  studio: '棚拍背景',
  outdoor: '户外自然',
};

const bgDescription = computed(() => {
  if (activeTab.value === 'custom' && bgCustom.value.trim()) return bgCustom.value.trim();
  return presetLabels[bgPreset.value] || '纯白背景';
});

const examples = [
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop',
];

function openFile() {
  fileRef.value?.click();
}

function clearImage() {
  inputImage.value = null;
  resultImage.value = null;
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  inputImage.value = URL.createObjectURL(file);
  target.value = '';
}

function onDrop(e: DragEvent) {
  const f = e.dataTransfer?.files?.[0];
  if (!f?.type.startsWith('image/')) return;
  inputImage.value = URL.createObjectURL(f);
}

async function generate() {
  if (!inputImage.value) return;
  if (auth.points < 3) {
    message.warning(`积分不足，当前剩余 ${auth.points} 积分`);
    return;
  }
  if (!auth.deductPoints(3)) return;
  isGenerating.value = true;
  resultImage.value = null;
  const desc = bgDescription.value;
  const prompt = `请替换图片背景：

【任务】
- 输入：一张含主体人物的商品/模特图
- 将背景替换为：${desc}
- 保持主体（人物/商品）完全不变

【要求】
1. 抠图边缘自然
2. 新背景与主体光线协调
3. 不改变主体外观`;
  try {
    const res = await geminiService.generateImage(prompt, [inputImage.value], { aspectRatio: aspectRatio.value });
    if (res.startsWith('data:image')) {
      resultImage.value = res;
      message.success('生成成功！');
    } else message.error('生成失败，请重试');
  } catch {
    message.error('生成失败，请稍后重试');
  } finally {
    isGenerating.value = false;
  }
}
</script>

<style scoped lang="scss">
@import './tool-page-common.scss';
</style>
