<template>
  <MainLayout>
    <div class="p-8 max-w-5xl mx-auto">
      <!-- 步骤条 -->
      <div class="flex items-center justify-center mb-10">
        <div class="flex items-center">
          <template v-for="(step, index) in steps" :key="index">
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center font-medium transition', currentStep > index ? 'gradient-bg text-white' : currentStep === index ? 'gradient-bg text-white' : 'bg-gray-200 text-gray-500']">
              {{ index + 1 }}
            </div>
            <span :class="['ml-2 text-sm whitespace-nowrap', currentStep >= index ? 'font-medium text-gray-900' : 'text-gray-500']">{{ step }}</span>
            <div v-if="index < steps.length - 1" :class="['w-16 h-0.5 mx-2', currentStep > index ? 'bg-blue-500' : 'bg-gray-200']"></div>
          </template>
        </div>
      </div>

      <!-- Step 1: 选择 Listing -->
      <div v-if="currentStep === 0" class="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">选择 Listing</h2>
        <p class="text-gray-500 mb-8">选择已生成的 Listing，AI 将基于此生成 A+ 内容</p>

        <!-- Listing 列表 -->
        <div class="space-y-4 mb-8">
          <div
            v-for="listing in listings"
            :key="listing.id"
            :class="['p-5 rounded-xl border-2 cursor-pointer transition', selectedListing === listing.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300']"
            @click="selectedListing = listing.id"
          >
            <div class="flex items-start gap-4">
              <div class="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0"></div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 mb-1">{{ listing.title }}</h3>
                <p class="text-sm text-gray-500 mb-2">{{ listing.category }}</p>
                <div class="flex gap-2">
                  <span class="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">已生成</span>
                  <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{{ listing.time }}</span>
                </div>
              </div>
              <div v-if="selectedListing === listing.id" class="w-6 h-6 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="flex justify-end">
          <button 
            class="px-6 py-2.5 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition"
            :disabled="!selectedListing"
            @click="nextStep"
          >
            下一步：选择模板
          </button>
        </div>
      </div>

      <!-- Step 2: 选择模板 -->
      <div v-else-if="currentStep === 1" class="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">选择 A+ 模板</h2>
        <p class="text-gray-500 mb-8">选择适合您产品的 A+ 页面模板</p>

        <div class="grid grid-cols-2 gap-6 mb-8">
          <div
            v-for="template in templates"
            :key="template.id"
            :class="['rounded-xl border-2 overflow-hidden cursor-pointer transition', selectedTemplate === template.id ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300']"
            @click="selectedTemplate = template.id"
          >
            <div class="h-40 bg-gray-100 relative">
              <img :src="template.preview" class="w-full h-full object-cover" alt="" />
              <div v-if="selectedTemplate === template.id" class="absolute top-2 right-2 w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-1">{{ template.name }}</h3>
              <p class="text-sm text-gray-500">{{ template.description }}</p>
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="flex justify-between">
          <button class="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition" @click="prevStep">
            上一步
          </button>
          <button 
            class="px-6 py-2.5 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition"
            :disabled="!selectedTemplate"
            @click="nextStep"
          >
            下一步：生成内容
          </button>
        </div>
      </div>

      <!-- Step 3: 生成中 -->
      <div v-else-if="currentStep === 2" class="bg-white rounded-2xl border border-gray-200 p-8">
        <div class="text-center py-12">
          <div class="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-white text-4xl mx-auto mb-6">
            🤖
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">AI 正在生成 A+ 内容...</h2>
          <p class="text-gray-500 mb-8">预计需要 20-40 秒，请稍候</p>

          <!-- 进度条 -->
          <div class="max-w-md mx-auto">
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full gradient-bg rounded-full transition-all duration-500" :style="{ width: progress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: 结果预览 -->
      <div v-else-if="currentStep === 3" class="space-y-6">
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">A+ 页面预览</h3>
            <div class="flex gap-2">
              <button class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition">编辑</button>
              <button class="px-4 py-2 rounded-lg gradient-bg text-white text-sm hover:opacity-90 transition">导出</button>
            </div>
          </div>
          
          <!-- A+ 模块预览 -->
          <div class="space-y-4">
            <div v-for="(module, index) in aplusModules" :key="index" class="border border-gray-200 rounded-xl p-4">
              <div class="flex items-center gap-4 mb-3">
                <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">{{ index + 1 }}</span>
                <span class="font-medium text-gray-900">{{ module.type }}</span>
              </div>
              <p class="text-gray-700">{{ module.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import MainLayout from '@/layout/MainLayout.vue';

const steps = ['选择 Listing', '选择模板', '生成内容', '结果预览'];
const currentStep = ref(0);
const selectedListing = ref<number | null>(null);
const selectedTemplate = ref<number | null>(null);
const progress = ref(0);

const listings = [
  { id: 1, title: '20000mAh 充电宝', category: '数码电子', time: '2小时前' },
  { id: 2, title: '无线蓝牙耳机', category: '数码电子', time: '昨天' },
];

const templates = [
  { id: 1, name: '标准模板', description: '适合大多数产品，包含主图、场景图、功能图', preview: 'https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=400' },
  { id: 2, name: '对比模板', description: '突出产品对比优势，适合有竞品的产品', preview: 'https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=400' },
];

const aplusModules = [
  { type: '主视觉图', content: '突出 20000mAh 大容量，支持 65W 快充' },
  { type: '场景图', content: '商务出差场景，展示便携性和实用性' },
  { type: '功能对比图', content: '与竞品对比，突出快充优势' },
  { type: '规格参数表', content: '详细技术参数，包括尺寸、重量、接口等' },
];

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
    
    if (currentStep.value === 2) {
      // 模拟生成进度
      let p = 0;
      const interval = setInterval(() => {
        p += 10;
        progress.value = p;
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            currentStep.value++;
          }, 500);
        }
      }, 500);
    }
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}
</script>

<style scoped>
.gradient-bg {
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
}
</style>
