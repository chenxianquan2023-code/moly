<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 左侧导航栏 -->
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-200">
        <div class="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center font-bold text-white mr-3">M</div>
        <span class="text-xl font-bold text-blue-600">Moly</span>
      </div>
      
      <!-- 导航菜单 -->
      <nav class="flex-1 py-4">
        <router-link to="/" class="sidebar-item flex items-center gap-3 px-6 py-3 text-gray-600 hover:text-gray-900 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          <span>首页</span>
        </router-link>
        
        <div class="sidebar-item active flex items-center gap-3 px-6 py-3 text-gray-900 font-medium">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
          <span>AI 助手</span>
        </div>
        
        <router-link to="/tools" class="sidebar-item flex items-center gap-3 px-6 py-3 text-gray-600 hover:text-gray-900 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
          <span>创作中心</span>
        </router-link>
        
        <router-link to="/workbench" class="sidebar-item flex items-center gap-3 px-6 py-3 text-gray-600 hover:text-gray-900 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
          </svg>
          <span>工作台</span>
        </router-link>
      </nav>
      
      <!-- 用户信息 -->
      <div class="p-4 border-t border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium">泉</div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm truncate">泉哥</div>
            <div class="text-xs text-gray-500">专业版</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="flex-1 overflow-auto">
      <!-- 顶部栏 -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
        <h1 class="text-xl font-semibold text-gray-900">AI 助手</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-yellow-600">💰 1,250 积分</span>
          <button class="px-4 py-2 rounded-lg gradient-bg text-white text-sm font-medium hover:opacity-90 transition" @click="goToCreate">
            + 新建 Listing
          </button>
        </div>
      </header>

      <!-- 内容区域 -->
      <div class="p-8 max-w-5xl mx-auto">
        <!-- 步骤条（仅在对话进行中显示） -->
        <div v-if="hasMessages" class="flex items-center justify-center mb-8">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium">1</div>
            <span class="ml-2 text-sm font-medium text-gray-900">选择Agent</span>
            <div class="w-16 h-0.5 bg-gray-200 mx-2"></div>
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center font-medium', currentStep >= 2 ? 'gradient-bg text-white' : 'bg-gray-200 text-gray-500']">2</div>
            <span :class="['ml-2 text-sm', currentStep >= 2 ? 'font-medium text-gray-900' : 'text-gray-500']">信息收集</span>
            <div class="w-16 h-0.5 bg-gray-200 mx-2"></div>
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center font-medium', currentStep >= 3 ? 'gradient-bg text-white' : 'bg-gray-200 text-gray-500']">3</div>
            <span :class="['ml-2 text-sm', currentStep >= 3 ? 'font-medium text-gray-900' : 'text-gray-500']">生成结果</span>
          </div>
        </div>

        <!-- Agent 选择卡片（仅在开始对话前显示） -->
        <div v-if="!hasMessages" class="mb-8">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">选择专业 Agent，开始创作</h2>
            <p class="text-gray-500">每个 Agent 都是电商领域的专家，可以帮您完成特定任务</p>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="agent in agents"
              :key="agent.id"
              :class="['bg-white rounded-2xl border-2 p-6 cursor-pointer transition hover:shadow-lg', selectedAgent === agent.id ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-blue-300']"
              @click="selectAgent(agent.id)"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                  {{ agent.avatar }}
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900 mb-1">{{ agent.name }}</h3>
                  <p class="text-sm text-gray-500">{{ agent.description }}</p>
                </div>
                <div v-if="selectedAgent === agent.id" class="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 消息区域 -->
        <div v-if="hasMessages" class="space-y-6 mb-8">
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['flex gap-4', message.role === 'user' ? 'flex-row-reverse' : '']"
          >
            <!-- 头像 -->
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', message.role === 'assistant' ? 'gradient-bg text-white' : 'bg-gray-200']">
              {{ message.role === 'assistant' ? getAgentAvatar(message.agent) : '👤' }}
            </div>
            
            <!-- 内容 -->
            <div :class="['max-w-[80%]', message.role === 'user' ? 'text-right' : '']">
              <div :class="['inline-block rounded-2xl px-5 py-3', message.role === 'assistant' ? 'bg-white border border-gray-200 text-gray-800' : 'gradient-bg text-white']">
                <div class="text-sm leading-relaxed" v-html="formatMessage(message.content)"></div>
              </div>
              
              <!-- 选项按钮 -->
              <div v-if="message.type === 'question' && message.options?.length" class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="option in message.options"
                  :key="option"
                  class="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600 transition bg-white"
                  @click="answerQuestion(message.field, option)"
                >
                  {{ option }}
                </button>
              </div>
              
              <!-- 结果卡片 -->
              <div v-if="message.type === 'result' && message.data" class="mt-3 bg-white rounded-2xl border border-gray-200 p-5">
                <div class="font-semibold text-gray-900 mb-3">📋 执行结果</div>
                <div class="text-sm text-gray-600">
                  <pre class="whitespace-pre-wrap">{{ JSON.stringify(message.data, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 加载中 -->
          <div v-if="isLoading" class="flex gap-4">
            <div class="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white">
              {{ currentAgentInfo?.avatar }}
            </div>
            <div class="bg-white rounded-2xl border border-gray-200 px-5 py-3">
              <div class="flex gap-1">
                <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
                <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="bg-white rounded-2xl border border-gray-200 p-4">
          <div class="flex gap-4">
            <div class="flex-1">
              <textarea
                v-model="userInput"
                :placeholder="hasMessages ? '请输入您的回复...' : '请输入产品详情，例如：我要做一款20000mAh充电宝的A+页面...'"
                class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 resize-none"
                rows="3"
                @keydown.enter.prevent="handleSubmit"
              ></textarea>
            </div>
          </div>
          <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div class="flex items-center gap-2">
              <button class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm" @click="triggerUpload">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                上传图片
              </button>
              <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="handleFileChange">
              
              <!-- 已上传图片 -->
              <div v-if="uploadedImages.length" class="flex gap-2">
                <span v-for="(img, i) in uploadedImages" :key="i" class="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs">
                  图片{{ i + 1 }}
                  <button @click="removeImage(i)" class="hover:text-blue-800">×</button>
                </span>
              </div>
            </div>
            <button 
              :class="['px-6 py-2 rounded-lg text-white font-medium transition', canSubmit ? 'gradient-bg hover:opacity-90' : 'bg-gray-300 cursor-not-allowed']"
              :disabled="!canSubmit"
              @click="handleSubmit"
            >
              {{ isLoading ? '处理中...' : '发送' }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAgentStore } from '@/stores/agent.store';

const router = useRouter();
const store = useAgentStore();

// 状态
const userInput = ref('');
const uploadedImages = ref<string[]>([]);
const fileInput = ref<HTMLInputElement>();
const currentStep = ref(1);

// 从 store 获取
const { agents, currentAgent, messages, isLoading, hasMessages, currentAgentInfo } = store;

// 计算属性
const selectedAgent = computed({
  get: () => currentAgent || agents[0]?.id,
  set: (val: string) => store.selectAgent(val),
});

const canSubmit = computed(() => {
  return userInput.value.trim() && !isLoading;
});

// 方法
function getAgentAvatar(agentId: string) {
  const agent = agents.find((a: any) => a.id === agentId);
  return agent?.avatar || '🤖';
}

function formatMessage(content: string) {
  return content.replace(/\n/g, '<br>');
}

function selectAgent(agentId: string) {
  store.selectAgent(agentId);
}

async function handleSubmit() {
  if (!canSubmit.value) return;

  const message = userInput.value.trim();
  const images = [...uploadedImages.value];

  userInput.value = '';
  uploadedImages.value = [];

  // 更新步骤
  if (currentStep.value < 2) currentStep.value = 2;

  await store.sendMessage(message, images);
  
  // 检查是否进入结果阶段
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.type === 'result') {
    currentStep.value = 3;
  }
}

async function answerQuestion(field: string, value: string) {
  await store.answerQuestion(field, value);
}

function triggerUpload() {
  fileInput.value?.click();
}

function handleFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files) return;

  Array.from(files).forEach(file => {
    const url = URL.createObjectURL(file);
    uploadedImages.value.push(url);
  });
}

function removeImage(index: number) {
  uploadedImages.value.splice(index, 1);
}

function goToCreate() {
  router.push('/tools/listing/create');
}

// 初始化
onMounted(() => {
  store.loadAgents();
});
</script>

<style scoped>
.gradient-bg {
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
}

.sidebar-item {
  transition: all 0.2s;
}

.sidebar-item:hover {
  background: rgba(59, 130, 246, 0.1);
}

.sidebar-item.active {
  background: rgba(59, 130, 246, 0.15);
  border-right: 3px solid #2563EB;
}
</style>
