<template>
  <div class="tool-page">
    <header class="tool-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <span>AI 模特换脸</span>
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
          <div class="section-label">1. 模特原图（含 pose）</div>
          <div
            class="upload-area large"
            :class="{ hasImage: inputs.model }"
            @click="!inputs.model && setActiveUpload('model')"
            @dragover.prevent
            @drop.prevent="e => onDrop(e, 'model')"
          >
            <img v-if="inputs.model" :src="inputs.model" class="preview-img" />
            <div v-if="inputs.model" class="image-overlay">
              <button class="overlay-btn" @click.stop="clearImage('model')">删除</button>
              <button class="overlay-btn" @click.stop="setActiveUpload('model')">更换</button>
            </div>
            <div v-else class="upload-placeholder">
              <UserOutlined class="upload-icon" />
              <span>上传模特图</span>
            </div>
          </div>
        </div>
        <div class="upload-section">
          <div class="section-label">2. 目标面孔</div>
          <div
            class="upload-area large"
            :class="{ hasImage: inputs.face }"
            @click="!inputs.face && setActiveUpload('face')"
            @dragover.prevent
            @drop.prevent="e => onDrop(e, 'face')"
          >
            <img v-if="inputs.face" :src="inputs.face" class="preview-img" />
            <div v-if="inputs.face" class="image-overlay">
              <button class="overlay-btn" @click.stop="clearImage('face')">删除</button>
              <button class="overlay-btn" @click.stop="setActiveUpload('face')">更换</button>
            </div>
            <div v-else class="upload-placeholder">
              <SmileOutlined class="upload-icon" />
              <span>上传目标面孔</span>
            </div>
          </div>
        </div>
        <input ref="fileRef" type="file" class="hidden-input" accept="image/*" @change="onFileChange" />
        <div class="example-row">
          <span class="example-label">示例：</span>
          <button type="button" class="demo-btn" @click="fileRef?.click()">本地上传</button>
          <button v-for="(url, i) in modelExamples" :key="'m'+i" class="example-thumb" @click="inputs.model = url"><img :src="url" alt="" /></button>
          <span class="example-divider">|</span>
          <button v-for="(url, i) in faceExamples" :key="'f'+i" class="example-thumb" @click="inputs.face = url"><img :src="url" alt="" /></button>
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
          <div v-if="!resultImage && !isGenerating" class="preview-empty">上传两张图，点击生成</div>
          <div v-else-if="isGenerating" class="preview-loading">
            <LoadingOutlined class="spin" />
            <span>生成中...</span>
          </div>
          <img v-else-if="resultImage" :src="resultImage" alt="结果" class="preview-result" />
        </div>

        <div class="cost-row">预估消耗 <ThunderboltFilled class="icon" /> 3 积分</div>
        <button
          class="generate-btn"
          :class="{ disabled: isGenerating || !inputs.model || !inputs.face }"
          :disabled="isGenerating || !inputs.model || !inputs.face"
          @click="generate"
        >
          <ExperimentOutlined v-if="!isGenerating" />
          <LoadingOutlined v-else class="spin" />
          {{ isGenerating ? '生成中...' : '生成换脸图' }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { RightOutlined, ThunderboltFilled, UserOutlined, SmileOutlined, ExperimentOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { geminiService } from '@/services/gemini.service';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';

const auth = useAuthStore();
const fileRef = ref<HTMLInputElement | null>(null);
const inputs = reactive<{ model: string | null; face: string | null }>({ model: null, face: null });
const resultImage = ref<string | null>(null);
const isGenerating = ref(false);
const aspectRatio = ref('3:4');
const activeSlot = ref<'model' | 'face'>('model');

const modelExamples = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
];
const faceExamples = [
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
];

function setActiveUpload(slot: 'model' | 'face') {
  activeSlot.value = slot;
  fileRef.value?.click();
}

function clearImage(slot: 'model' | 'face') {
  inputs[slot] = null;
  resultImage.value = null;
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  inputs[activeSlot.value] = URL.createObjectURL(file);
  target.value = '';
}

function onDrop(e: DragEvent, slot: 'model' | 'face') {
  const f = e.dataTransfer?.files?.[0];
  if (!f?.type.startsWith('image/')) return;
  inputs[slot] = URL.createObjectURL(f);
}

async function generate() {
  if (!inputs.model || !inputs.face) return;
  if (auth.points < 3) {
    message.warning(`积分不足，当前剩余 ${auth.points} 积分`);
    return;
  }
  if (!auth.deductPoints(3)) return;
  isGenerating.value = true;
  resultImage.value = null;
  const prompt = `请生成一张换脸后的模特图：

【任务】
- 图1：模特原图，含完整 pose 与身体
- 图2：目标面孔
- 将图2中的面孔替换到图1中的模特脸上，保持 pose、身材、服装、背景完全不变

【要求】
1. 面部与肤色自然融合
2. 光线方向一致
3. 不改变身体与背景`;
  try {
    const res = await geminiService.generateImage(prompt, [inputs.model, inputs.face], { aspectRatio: aspectRatio.value });
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
.example-divider { color: #9ca3af; font-size: 12px; margin: 0 8px; }
</style>
