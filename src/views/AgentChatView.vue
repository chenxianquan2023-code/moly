<template>
  <div class="flex flex-col h-full">
    <!-- 顶部标题栏 -->
    <div class="h-14 flex items-center justify-between px-8 border-b border-gray-100 bg-white flex-shrink-0">
      <h1 class="text-lg font-semibold text-gray-900">AI 助手</h1>
      <span class="text-sm text-gray-400">智能对话，一键创作</span>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-auto p-8">
      <div class="max-w-4xl mx-auto">
        <!-- 步骤条（仅在对话进行中显示） -->
        <div v-if="hasMessages" class="flex items-center justify-center mb-8">
          <div class="flex items-center">
            <div class="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-medium">1</div>
            <span class="ml-2 text-sm font-medium text-gray-900">选择Agent</span>
            <div class="w-12 h-0.5 bg-gray-200 mx-2"></div>
            <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium', currentStep >= 2 ? 'gradient-bg text-white' : 'bg-gray-100 text-gray-400']">2</div>
            <span :class="['ml-2 text-sm', currentStep >= 2 ? 'font-medium text-gray-900' : 'text-gray-400']">信息收集</span>
            <div class="w-12 h-0.5 bg-gray-200 mx-2"></div>
            <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium', currentStep >= 3 ? 'gradient-bg text-white' : 'bg-gray-100 text-gray-400']">3</div>
            <span :class="['ml-2 text-sm', currentStep >= 3 ? 'font-medium text-gray-900' : 'text-gray-400']">生成结果</span>
          </div>
        </div>

        <!-- Agent 选择卡片（仅在开始对话前显示） -->
        <div v-if="!hasMessages" class="mb-8">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">选择专业 Agent，开始创作</h2>
            <p class="text-gray-400">每个 Agent 都是电商领域的专家，可以帮您完成特定任务</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="agent in agents"
              :key="agent.id"
              :class="['bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg', selectedAgent === agent.id ? 'border-blue-500 shadow-md' : 'border-gray-100 hover:border-blue-200']"
              @click="selectAgent(agent.id)"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                  {{ agent.avatar }}
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900 mb-1">{{ agent.name }}</h3>
                  <p class="text-sm text-gray-400">{{ agent.description }}</p>
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
            <div :class="['w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm', message.role === 'assistant' ? 'gradient-bg text-white' : 'bg-gray-100']">
              {{ message.role === 'assistant' ? getAgentAvatar(message.agent) : '' }}
            </div>

            <div :class="['max-w-[75%]', message.role === 'user' ? 'text-right' : '']">
              <div :class="['inline-block rounded-2xl px-5 py-3', message.role === 'assistant' ? 'bg-white border border-gray-100 text-gray-800' : 'gradient-bg text-white']">
                <div class="text-sm leading-relaxed" v-html="formatMessage(message.content)"></div>
              </div>

              <div v-if="message.type === 'question' && message.options?.length" class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="option in message.options"
                  :key="option"
                  class="px-4 py-2 rounded-xl border border-gray-100 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition bg-white"
                  @click="answerQuestion(message.field, option)"
                >
                  {{ option }}
                </button>
              </div>

              <div v-if="message.type === 'result' && message.data" class="mt-3 bg-white rounded-2xl border border-gray-100 p-5">
                <div class="font-semibold text-gray-900 mb-3">执行结果</div>
                <div class="text-sm text-gray-500">
                  <pre class="whitespace-pre-wrap">{{ JSON.stringify(message.data, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>

          <div v-if="isLoading" class="flex gap-4">
            <div class="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-sm">
              {{ currentAgentInfo?.avatar }}
            </div>
            <div class="bg-white rounded-2xl border border-gray-100 px-5 py-3">
              <div class="flex gap-1.5">
                <span class="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                <span class="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
                <span class="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="border-t border-gray-100 bg-white p-6 flex-shrink-0">
      <div class="max-w-4xl mx-auto">
        <div class="bg-gray-50 rounded-2xl p-4">
          <textarea
            v-model="userInput"
            :placeholder="hasMessages ? '请输入您的回复...' : '请输入产品详情，例如：我要做一款20000mAh充电宝的A+页面...'"
            class="w-full bg-transparent px-2 py-1 focus:outline-none resize-none text-sm text-gray-800 placeholder-gray-400"
            rows="2"
            @keydown.enter.prevent="handleSubmit"
          ></textarea>
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-2">
              <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:bg-white hover:text-gray-600 transition text-sm" @click="triggerUpload">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                上传图片
              </button>
              <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="handleFileChange">
              <div v-if="uploadedImages.length" class="flex gap-1.5">
                <span v-for="(img, i) in uploadedImages" :key="i" class="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-500 rounded-lg text-xs">
                  图片{{ i + 1 }}
                  <button @click="removeImage(i)" class="hover:text-blue-700">×</button>
                </span>
              </div>
            </div>
            <button
              :class="['px-5 py-2 rounded-xl text-white text-sm font-medium transition-all', canSubmit ? 'gradient-bg hover:opacity-90 shadow-sm shadow-blue-200' : 'bg-gray-200 cursor-not-allowed']"
              :disabled="!canSubmit"
              @click="handleSubmit"
            >
              {{ isLoading ? '处理中...' : '发送' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAgentStore } from '@/stores/agent.store';

const store = useAgentStore();

const userInput = ref('');
const uploadedImages = ref<string[]>([]);
const fileInput = ref<HTMLInputElement>();
const currentStep = ref(1);

const { agents, currentAgent, messages, isLoading, hasMessages, currentAgentInfo } = store;

const selectedAgent = computed({
  get: () => currentAgent || agents[0]?.id,
  set: (val: string) => store.selectAgent(val),
});

const canSubmit = computed(() => {
  return userInput.value.trim() && !isLoading;
});

function getAgentAvatar(agentId: string) {
  const agent = agents.find((a: any) => a.id === agentId);
  return agent?.avatar || 'AI';
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

  if (currentStep.value < 2) currentStep.value = 2;

  await store.sendMessage(message, images);

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

onMounted(() => {
  store.loadAgents();
});
</script>

<style scoped>
.gradient-bg {
  background: linear-gradient(135deg, #2563EB 0%, #60A5FA 100%);
}
</style>
