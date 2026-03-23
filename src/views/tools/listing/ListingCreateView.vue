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

      <!-- Step 1: 输入信息 -->
      <div v-if="currentStep === 0" class="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">快速创建 Listing</h2>
        <p class="text-gray-500 mb-8">输入产品 ASIN 或链接，AI 自动分析并生成完整 Listing</p>

        <!-- 输入方式切换 -->
        <div class="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
          <button 
            v-for="mode in inputModes" 
            :key="mode.value"
            :class="['px-4 py-2 rounded-md text-sm font-medium transition', inputMode === mode.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900']"
            @click="inputMode = mode.value"
          >
            {{ mode.label }}
          </button>
        </div>

        <!-- ASIN 输入 -->
        <div v-if="inputMode === 'asin'" class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">输入 Amazon ASIN</label>
          <div class="relative">
            <input 
              v-model="asin"
              type="text" 
              placeholder="例如：B08N5WRWNW" 
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 text-lg"
            />
            <button 
              class="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg gradient-bg text-white text-sm"
              @click="autoRecognize"
            >
              自动识别
            </button>
          </div>
          <p class="mt-2 text-sm text-gray-500">输入 ASIN 后，AI 将自动抓取产品信息并分析竞品</p>
        </div>

        <!-- 链接输入 -->
        <div v-else-if="inputMode === 'url'" class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">输入 Amazon 产品链接</label>
          <input 
            v-model="productUrl"
            type="text" 
            placeholder="https://www.amazon.com/dp/..." 
            class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 text-lg"
          />
        </div>

        <!-- 手动输入 -->
        <div v-else class="space-y-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">产品名称</label>
            <input v-model="productInfo.name" type="text" class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">产品类别</label>
            <input v-model="productInfo.category" type="text" class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">核心卖点</label>
            <textarea v-model="productInfo.sellingPoints" rows="3" class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 resize-none"></textarea>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="flex items-center justify-between pt-6 border-t border-gray-100">
          <div class="flex items-center gap-2 text-sm text-yellow-600">
            <span>⚡</span>
            <span>预估消耗 <strong>50</strong> 积分</span>
          </div>
          <div class="flex gap-3">
            <button class="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition" @click="$router.back()">
              返回
            </button>
            <button class="px-6 py-2.5 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition" @click="nextStep">
              下一步：市场洞察
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2: 市场洞察 -->
      <div v-else-if="currentStep === 1" class="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">市场洞察</h2>
        <p class="text-gray-500 mb-8">AI 正在分析竞品和市场趋势</p>

        <!-- 分析状态 -->
        <div v-if="isAnalyzing" class="text-center py-12">
          <div class="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-white text-3xl mx-auto mb-4 animate-pulse">
            🤖
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">正在分析竞品...</h3>
          <p class="text-gray-500">AI 正在抓取竞品数据并分析市场趋势</p>
        </div>

        <!-- 分析结果 -->
        <div v-else class="space-y-6">
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-blue-50 rounded-xl p-4 text-center">
              <div class="text-2xl font-bold text-blue-600 mb-1">12</div>
              <div class="text-sm text-gray-600">竞品分析</div>
            </div>
            <div class="bg-purple-50 rounded-xl p-4 text-center">
              <div class="text-2xl font-bold text-purple-600 mb-1">85%</div>
              <div class="text-sm text-gray-600">市场热度</div>
            </div>
            <div class="bg-green-50 rounded-xl p-4 text-center">
              <div class="text-2xl font-bold text-green-600 mb-1">Top 3</div>
              <div class="text-sm text-gray-600">关键词排名</div>
            </div>
          </div>

          <!-- 竞品列表 -->
          <div class="border border-gray-200 rounded-xl overflow-hidden">
            <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 class="font-medium text-gray-900">主要竞品</h4>
            </div>
            <div class="divide-y divide-gray-200">
              <div v-for="i in 3" :key="i" class="px-4 py-3 flex items-center gap-4">
                <div class="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0"></div>
                <div class="flex-1">
                  <div class="font-medium text-gray-900">竞品 {{ i }}</div>
                  <div class="text-sm text-gray-500">月销量 1000+</div>
                </div>
                <div class="text-sm text-blue-600">查看详情</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
          <button class="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition" @click="prevStep">
            上一步
          </button>
          <button class="px-6 py-2.5 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition" @click="nextStep">
            下一步：AI 生成
          </button>
        </div>
      </div>

      <!-- Step 3: AI 生成中 -->
      <div v-else-if="currentStep === 2" class="bg-white rounded-2xl border border-gray-200 p-8">
        <div class="text-center py-12">
          <div class="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-white text-4xl mx-auto mb-6">
            🤖
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">AI 正在生成 Listing...</h2>
          <p class="text-gray-500 mb-8">预计需要 30-60 秒，请稍候</p>

          <!-- 进度条 -->
          <div class="max-w-md mx-auto">
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full gradient-bg rounded-full transition-all duration-500" :style="{ width: progress + '%' }"></div>
            </div>
            <div class="mt-4 space-y-2">
              <div v-for="(task, index) in tasks" :key="index" :class="['flex items-center gap-2 text-sm', task.done ? 'text-green-600' : 'text-gray-500']">
                <span v-if="task.done">✓</span>
                <span v-else class="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></span>
                <span>{{ task.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: 结果预览 -->
      <div v-else-if="currentStep === 3" class="space-y-6">
        <!-- 标题 -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">产品标题</h3>
            <button class="text-blue-600 text-sm hover:underline">编辑</button>
          </div>
          <p class="text-gray-800">{{ generatedResult.title }}</p>
        </div>

        <!-- 五点描述 -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">五点描述</h3>
            <button class="text-blue-600 text-sm hover:underline">编辑</button>
          </div>
          <ul class="space-y-3">
            <li v-for="(point, index) in generatedResult.bulletPoints" :key="index" class="flex gap-3">
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">{{ index + 1 }}</span>
              <span class="text-gray-800">{{ point }}</span>
            </li>
          </ul>
        </div>

        <!-- 产品描述 -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">产品描述</h3>
            <button class="text-blue-600 text-sm hover:underline">编辑</button>
          </div>
          <p class="text-gray-800 whitespace-pre-line">{{ generatedResult.description }}</p>
        </div>

        <!-- 底部操作 -->
        <div class="flex justify-end gap-3">
          <button class="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition" @click="currentStep = 0">
            重新生成
          </button>
          <button class="px-6 py-2.5 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition">
            导出 Listing
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import MainLayout from '@/layout/MainLayout.vue';

const steps = ['输入信息', '市场洞察', 'AI 生成', '结果预览'];
const currentStep = ref(0);
const inputMode = ref('asin');
const asin = ref('');
const productUrl = ref('');
const isAnalyzing = ref(false);
const progress = ref(0);

const inputModes = [
  { value: 'asin', label: 'ASIN' },
  { value: 'url', label: '产品链接' },
  { value: 'manual', label: '手动输入' },
];

const productInfo = reactive({
  name: '',
  category: '',
  sellingPoints: '',
});

const tasks = reactive([
  { name: '分析竞品数据', done: true },
  { name: '生成产品标题', done: true },
  { name: '生成五点描述', done: false },
  { name: '优化关键词', done: false },
]);

const generatedResult = reactive({
  title: '20000mAh Portable Charger Power Bank - Fast Charging USB C Battery Pack with 3 Outputs & 2 Inputs, External Battery Compatible with iPhone, Samsung, iPad, etc.',
  bulletPoints: [
    '【20000mAh High Capacity】Charge your iPhone 12 up to 5 times, Samsung S20 up to 4 times, providing days of power.',
    '【Fast Charging Technology】Support PD 20W fast charging, charge your devices up to 50% in just 30 minutes.',
    '【3 Outputs & 2 Inputs】Charge 3 devices simultaneously with 2 USB-A and 1 USB-C ports.',
    '【Safe & Reliable】Built-in multi-protection system to ensure safe charging.',
    '【Compact & Portable】Slim design fits easily in your bag, perfect for travel and daily use.',
  ],
  description: 'This high-capacity power bank is designed for modern life...',
});

function autoRecognize() {
  // 模拟自动识别
  productInfo.name = '20000mAh 充电宝';
  productInfo.category = '数码电子';
  productInfo.sellingPoints = '大容量、快充、便携';
}

function nextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
    
    if (currentStep.value === 1) {
      // 模拟分析
      isAnalyzing.value = true;
      setTimeout(() => {
        isAnalyzing.value = false;
      }, 2000);
    }
    
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
