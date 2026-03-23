<template>
  <div class="tool-page">
    <header class="tool-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <span>手持商品图</span>
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
          <div class="section-label">商品图（白底更佳）</div>
          <div class="upload-area large" :class="{ hasImage: inputImage }" @click="!inputImage && openFile()" @dragover.prevent @drop.prevent="onDrop">
            <img v-if="inputImage" :src="inputImage" class="preview-img" />
            <div v-if="inputImage" class="image-overlay">
              <button class="overlay-btn" @click.stop="clearImage">删除</button>
              <button class="overlay-btn" @click.stop="openFile">更换</button>
            </div>
            <div v-else class="upload-placeholder">
              <PictureOutlined class="upload-icon" />
              <span>点击或拖拽上传商品图</span>
            </div>
          </div>
          <input ref="fileRef" type="file" class="hidden-input" accept="image/*" @change="onFileChange" />
          <div class="example-row">
            <span class="example-label">示例：</span>
            <button type="button" class="demo-btn" @click="openFile">本地上传</button>
            <button v-for="(url, i) in examples" :key="i" class="example-thumb" @click="inputImage = url"><img :src="url" alt="示例" /></button>
          </div>
        </div>
      </aside>
      <div class="right-panel">
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
          <div v-if="!resultImage && !isGenerating" class="preview-empty">上传商品图，点击生成</div>
          <div v-else-if="isGenerating" class="preview-loading"><LoadingOutlined class="spin" /><span>生成中...</span></div>
          <img v-else-if="resultImage" :src="resultImage" alt="结果" class="preview-result" />
        </div>
        <div class="cost-row">预估消耗 <ThunderboltFilled class="icon" /> 3 积分</div>
        <button class="generate-btn" :class="{ disabled: isGenerating || !inputImage }" :disabled="isGenerating || !inputImage" @click="generate">
          <ExperimentOutlined v-if="!isGenerating" /><LoadingOutlined v-else class="spin" />
          {{ isGenerating ? '生成中...' : '生成手持图' }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RightOutlined, ThunderboltFilled, PictureOutlined, ExperimentOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { geminiService } from '@/services/gemini.service';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';

const auth = useAuthStore();
const fileRef = ref<HTMLInputElement | null>(null);
const inputImage = ref<string | null>(null);
const resultImage = ref<string | null>(null);
const isGenerating = ref(false);
const aspectRatio = ref('3:4');

const examples = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop',
];

function openFile() { fileRef.value?.click(); }
function clearImage() { inputImage.value = null; resultImage.value = null; }
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
  if (auth.points < 3) { message.warning(`积分不足`); return; }
  if (!auth.deductPoints(3)) return;
  isGenerating.value = true; resultImage.value = null;
  const prompt = `请生成一张手持商品展示图：

【任务】图中是商品产品图，请生成真人模特手持该商品的自然展示图。

【要求】
1. 商品外观与图片100%一致
2. 手部姿势自然、握持合理
3. 背景简洁，突出商品
4. 适合电商主图`;
  try {
    const res = await geminiService.generateImage(prompt, [inputImage.value], { aspectRatio: aspectRatio.value });
    if (res.startsWith('data:image')) { resultImage.value = res; message.success('生成成功！'); }
    else message.error('生成失败，请重试');
  } catch { message.error('生成失败，请稍后重试'); }
  finally { isGenerating.value = false; }
}
</script>

<style scoped lang="scss">@import './tool-page-common.scss';</style>
