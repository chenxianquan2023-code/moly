<template>
  <div class="tool-page">
    <header class="tool-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <span>AI 细节增强</span>
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
          <div class="section-label">待增强图片</div>
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
              <RocketOutlined class="upload-icon" />
              <span>点击或拖拽上传低清图</span>
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
        <div class="tab-content">
          <label class="field-label">增强强度</label>
          <select v-model="strength" class="field-select">
            <option value="subtle">轻度</option>
            <option value="moderate">适中</option>
            <option value="strong">强</option>
          </select>
          <label class="field-label mt">输出比例</label>
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
          {{ isGenerating ? '生成中...' : '增强细节' }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RightOutlined, ThunderboltFilled, RocketOutlined, ExperimentOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { geminiService } from '@/services/gemini.service';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';

const auth = useAuthStore();
const fileRef = ref<HTMLInputElement | null>(null);
const inputImage = ref<string | null>(null);
const resultImage = ref<string | null>(null);
const isGenerating = ref(false);
const strength = ref('moderate');
const aspectRatio = ref('1:1');

const examples = [
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=30&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=30&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=30&w=400&auto=format&fit=crop',
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

const strengthHints: Record<string, string> = {
  subtle: '轻度增强，保持原图观感',
  moderate: '适中增强，平衡细节与自然',
  strong: '强增强，最大化清晰度',
};

async function generate() {
  if (!inputImage.value) return;
  if (auth.points < 3) {
    message.warning(`积分不足，当前剩余 ${auth.points} 积分`);
    return;
  }
  if (!auth.deductPoints(3)) return;
  isGenerating.value = true;
  resultImage.value = null;
  const hint = strengthHints[strength.value] || strengthHints.moderate;
  const prompt = `请对提供的图片进行细节增强，生成一张高清版本：

【任务】
- 输入：一张模糊或低分辨率图片
- 输出：高清增强后的图片

【要求】
1. ${hint}
2. 不改变构图和内容
3. 适当锐化边缘
4. 保持色彩自然`;
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
