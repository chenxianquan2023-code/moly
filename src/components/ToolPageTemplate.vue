<template>
  <MainLayout>
    <div class="p-8 max-w-5xl mx-auto">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ title }}</h1>
        <p class="text-gray-500">{{ description }}</p>
      </div>

      <!-- 上传区域 -->
      <div class="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
        <div 
          class="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 transition cursor-pointer"
          @click="triggerUpload"
          @drop.prevent="handleDrop"
          @dragover.prevent
        >
          <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">点击或拖拽上传图片</h3>
          <p class="text-sm text-gray-500">支持 JPG、PNG 格式，最大 10MB</p>
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileChange">
        </div>

        <!-- 已上传图片预览 -->
        <div v-if="uploadedImage" class="mt-6">
          <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <img :src="uploadedImage" class="w-20 h-20 object-cover rounded-lg" alt="" />
            <div class="flex-1">
              <div class="font-medium text-gray-900">已上传图片</div>
              <div class="text-sm text-gray-500">点击重新上传可更换</div>
            </div>
            <button class="text-red-500 hover:text-red-600" @click="uploadedImage = ''">
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- 参数设置 -->
      <div class="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
        <h3 class="font-semibold text-gray-900 mb-6">参数设置</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <slot name="settings"></slot>
        </div>
      </div>

      <!-- 生成按钮 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm text-yellow-600">
          <span>⚡</span>
          <span>预估消耗 <strong>{{ cost }}</strong> 积分</span>
        </div>
        <button 
          class="px-8 py-3 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          :disabled="!uploadedImage || isGenerating"
          @click="generate"
        >
          {{ isGenerating ? '生成中...' : '开始生成' }}
        </button>
      </div>

      <!-- 生成结果 -->
      <div v-if="result" class="mt-8 bg-white rounded-2xl border border-gray-200 p-8">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-semibold text-gray-900">生成结果</h3>
          <button class="px-4 py-2 rounded-lg gradient-bg text-white text-sm hover:opacity-90 transition" @click="download">
            下载图片
          </button>
        </div>
        <div class="rounded-xl overflow-hidden">
          <img :src="result" class="w-full" alt="Result" />
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MainLayout from '@/layout/MainLayout.vue';

interface Props {
  title: string;
  description: string;
  cost: number;
}

const props = defineProps<Props>();

const fileInput = ref<HTMLInputElement>();
const uploadedImage = ref('');
const isGenerating = ref(false);
const result = ref('');

function triggerUpload() {
  fileInput.value?.click();
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    uploadedImage.value = URL.createObjectURL(file);
  }
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0];
  if (file && file.type.startsWith('image/')) {
    uploadedImage.value = URL.createObjectURL(file);
  }
}

function generate() {
  isGenerating.value = true;
  setTimeout(() => {
    isGenerating.value = false;
    result.value = uploadedImage.value; // 模拟结果
  }, 2000);
}

function download() {
  // 下载逻辑
}
</script>

<style scoped>
.gradient-bg {
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
}
</style>
