<template>
  <div class="tool-page">
    <header class="tool-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <span>AI 商品场景图</span>
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
              <span>点击或拖拽上传商品图</span>
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
          <div class="tab-item" :class="{ active: activeTab === 'style' }" @click="activeTab = 'style'">场景</div>
          <div class="tab-item" :class="{ active: activeTab === 'size' }" @click="activeTab = 'size'">比例</div>
        </div>

        <div v-show="activeTab === 'style'" class="tab-content">
          <label class="field-label">场景风格</label>
          <select v-model="sceneStyle" class="field-select">
            <option value="minimal">极简白背景</option>
            <option value="lifestyle">生活场景</option>
            <option value="studio">棚拍商业</option>
            <option value="nature">户外自然</option>
          </select>
          <label class="field-label mt">场景描述</label>
          <textarea v-model="sceneDesc" rows="2" class="field-textarea" placeholder="如：木质桌面、绿植、暖光"></textarea>
        </div>

        <div v-show="activeTab === 'size'" class="tab-content">
          <label class="field-label">输出比例</label>
          <select v-model="aspectRatio" class="field-select">
            <option value="1:1">1:1 正方形</option>
            <option value="3:4">3:4 竖版</option>
            <option value="4:3">4:3 横版</option>
          </select>
        </div>

        <div class="preview-area">
          <div class="preview-label">生成结果</div>
          <div v-if="!resultImage && !isGenerating" class="preview-empty">上传商品图，点击生成</div>
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
          {{ isGenerating ? '生成中...' : '生成场景图' }}
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
const activeTab = ref<'style' | 'size'>('style');
const sceneStyle = ref('lifestyle');
const sceneDesc = ref('木质桌面、绿植、柔和自然光');
const aspectRatio = ref('3:4');

const examples = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&auto=format&fit=crop',
];

const styleLabels: Record<string, string> = {
  minimal: '极简纯白背景',
  lifestyle: '生活化场景',
  studio: '棚拍商业风',
  nature: '户外自然',
};

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
  const style = styleLabels[sceneStyle.value] || sceneStyle.value;
  const desc = sceneDesc.value.trim() || '自然光、简洁背景';
  const prompt = `请生成一张商品营销场景图：

【任务】将提供的商品图（白底产品图）放置在专业的${style}中。

【要求】
1. 保持商品外观100%不变
2. 场景描述：${desc}
3. 光线自然、构图专业
4. 适合电商主图使用`;
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
