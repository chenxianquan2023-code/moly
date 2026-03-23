<template>
  <div class="agent-chat-page">
    <!-- 左侧导航 - 参考 Moly 现有设计 -->
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">M</div>
        <div class="logo-text">Moly</div>
      </div>
      
      <nav class="nav-menu">
        <router-link to="/" class="nav-item">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          <span>首页</span>
        </router-link>
        
        <div class="nav-item active">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
          <span>AI 助手</span>
        </div>
        
        <router-link to="/tools" class="nav-item">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
          <span>创作中心</span>
        </router-link>
        
        <router-link to="/workbench" class="nav-item">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
          </svg>
          <span>工作台</span>
        </router-link>
      </nav>
      
      <div class="user-profile">
        <div class="user-avatar">泉</div>
        <div class="user-info">
          <div class="user-name">泉哥</div>
          <div class="user-plan">专业版</div>
        </div>
      </div>
    </aside>
    
    <!-- 主内容 -->
    <main class="main">
      <!-- 顶部栏 -->
      <header class="header">
        <h1 class="header-title">AI 助手</h1>
        <div class="header-actions">
          <div class="credits">
            <span class="credits-icon">💰</span>
            <span>1,250 积分</span>
          </div>
          <button class="btn-primary" @click="goToCreate">+ 新建 Listing</button>
        </div>
      </header>
      
      <!-- 聊天区域 -->
      <div class="chat-container">
        <!-- Agent 选择横幅 -->
        <div class="agent-banner">
          <div class="agent-banner-title">🎯 选择专业 Agent，开始创作</div>
          <div class="agent-banner-desc">每个 Agent 都是电商领域的专家，可以帮您完成特定任务</div>
          <div class="agent-selector">
            <div
              v-for="agent in agents"
              :key="agent.id"
              :class="['agent-chip', { active: selectedAgent === agent.id }]"
              @click="selectAgent(agent.id)"
            >
              <span class="agent-chip-avatar">{{ agent.avatar }}</span>
              <span>{{ agent.name }}</span>
            </div>
          </div>
        </div>
        
        <!-- 消息区域 -->
        <div class="messages" ref="messagesRef">
          <!-- 空状态 -->
          <div v-if="!hasMessages" class="empty-state">
            <div class="empty-icon">🤖</div>
            <div class="empty-title">开始您的 AI 创作之旅</div>
            <div class="empty-desc">选择上方的 Agent，告诉我您需要什么帮助</div>
            <div class="quick-prompts">
              <button 
                v-for="prompt in quickPrompts" 
                :key="prompt"
                class="quick-prompt"
                @click="useQuickPrompt(prompt)"
              >
                {{ prompt }}
              </button>
            </div>
          </div>
          
          <!-- 消息列表 -->
          <template v-else>
            <div
              v-for="(message, index) in messages"
              :key="index"
              :class="['message', message.role]"
            >
              <div class="message-avatar">
                {{ message.role === 'assistant' ? getAgentAvatar(message.agent) : '👤' }}
              </div>
              <div class="message-content">
                <!-- 文本 -->
                <div class="message-text" v-html="formatMessage(message.content)"></div>
                
                <!-- 图片 -->
                <div v-if="message.images?.length" class="message-images">
                  <img
                    v-for="(img, i) in message.images"
                    :key="i"
                    :src="img"
                    alt="Uploaded"
                  />
                </div>
                
                <!-- 选项按钮 -->
                <div v-if="message.type === 'question' && message.options?.length" class="options">
                  <button
                    v-for="option in message.options"
                    :key="option"
                    class="option-btn"
                    @click="answerQuestion(message.field, option)"
                  >
                    {{ option }}
                  </button>
                </div>
                
                <!-- 结果卡片 -->
                <div v-if="message.type === 'result' && message.data" class="result-card">
                  <div class="result-title">📋 执行结果</div>
                  <div class="result-content">
                    <pre>{{ JSON.stringify(message.data, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 加载中 -->
            <div v-if="isLoading" class="message assistant loading">
              <div class="message-avatar">{{ currentAgentInfo?.avatar }}</div>
              <div class="message-content">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </template>
        </div>
        
        <!-- 输入区域 -->
        <div class="input-area">
          <div class="input-box">
            <textarea
              v-model="userInput"
              placeholder="请输入产品详情，例如：我要做一款20000mAh充电宝的A+页面..."
              @keydown.enter.prevent="handleSubmit"
              :disabled="isLoading"
              rows="3"
            ></textarea>
            <div class="input-toolbar">
              <div class="toolbar-left">
                <button class="toolbar-btn" @click="triggerUpload" :disabled="isLoading">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  上传图片
                </button>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  multiple
                  style="display: none"
                  @change="handleFileChange"
                />
                
                <!-- 已上传图片 -->
                <div v-if="uploadedImages.length" class="uploaded-preview">
                  <span v-for="(img, i) in uploadedImages" :key="i" class="image-tag">
                    图片{{ i + 1 }}
                    <button @click="removeImage(i)">×</button>
                  </span>
                </div>
              </div>
              <button
                class="send-btn"
                @click="handleSubmit"
                :disabled="!canSubmit"
              >
                {{ isLoading ? '处理中...' : '发送' }}
              </button>
            </div>
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
const messagesRef = ref<HTMLElement>();

// 快速提示
const quickPrompts = [
  '帮我做充电宝的A+页面',
  '生成耳机产品的关键词',
  '制作手机壳的短视频脚本',
  '优化一下我的Listing文案',
];

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

function useQuickPrompt(prompt: string) {
  userInput.value = prompt;
}

async function handleSubmit() {
  if (!canSubmit.value) return;

  const message = userInput.value.trim();
  const images = [...uploadedImages.value];

  userInput.value = '';
  uploadedImages.value = [];

  await store.sendMessage(message, images);
  scrollToBottom();
}

async function answerQuestion(field: string, value: string) {
  await store.answerQuestion(field, value);
  scrollToBottom();
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

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
}

function goToCreate() {
  router.push('/tools/listing/create');
}

// 监听消息变化
watch(messages, scrollToBottom, { deep: true });

// 初始化
onMounted(() => {
  store.loadAgents();
});
</script>

<style scoped lang="scss">
// 颜色变量 - 参考 Moly 设计（白色+蓝色风格）
$primary: #2563EB;        // Moly 蓝色
$primary-light: #3B82F6;  // 浅蓝
$primary-bg: #EFF6FF;     // 蓝色背景（选中状态）
$bg-gray: #F8FAFC;        // 页面背景
$bg-white: #FFFFFF;       // 卡片背景
$border: #E5E7EB;         // 边框
$text-primary: #111827;   // 主文字
$text-secondary: #6B7280; // 次要文字

.agent-chat-page {
  display: flex;
  height: 100vh;
  background: $bg-gray;
}

// 左侧导航
.sidebar {
  width: 200px;
  background: white;
  border-right: 1px solid $border;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid $border;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: $primary;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
}

.nav-menu {
  flex: 1;
  padding: 12px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 6px;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  text-decoration: none;

  &:hover {
    background: #F3F4F6;
    color: #374151;
  }

  &.active {
    background: $primary-bg;
    color: $primary;
    font-weight: 500;
  }
}

.nav-icon {
  width: 20px;
  height: 20px;
}

.user-profile {
  padding: 16px;
  border-top: 1px solid $border;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: $primary;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: $text-primary;
}

.user-plan {
  font-size: 12px;
  color: $text-secondary;
}

// 主内容
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 64px;
  background: white;
  border-bottom: 1px solid $border;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.credits {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #fef3c7;
  border-radius: 20px;
  font-size: 14px;
  color: #92400e;
}

.credits-icon {
  font-size: 16px;
}

.btn-primary {
  padding: 8px 16px;
  background: $primary;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1D4ED8;
  }
}

// 聊天容器
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// Agent 横幅
.agent-banner {
  background: $bg-white;
  padding: 24px 32px;
  border-bottom: 1px solid $border;
}

.agent-banner-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: $text-primary;
}

.agent-banner-desc {
  font-size: 14px;
  color: $text-secondary;
  margin-bottom: 16px;
}

.agent-selector {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.agent-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: $bg-white;
  border: 1px solid $border;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: $text-secondary;

  &:hover {
    border-color: $primary;
    color: $primary;
  }

  &.active {
    background: $primary-bg;
    border-color: $primary;
    color: $primary;
    font-weight: 500;
  }
}

.agent-chip-avatar {
  font-size: 18px;
}

// 消息区域
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 空状态
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  margin-bottom: 24px;
}

.quick-prompts {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.quick-prompt {
  padding: 8px 16px;
  background: $bg-white;
  border: 1px solid $border;
  border-radius: 6px;
  font-size: 13px;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $primary;
    color: $primary;
  }
}

// 消息
.message {
  display: flex;
  gap: 12px;
  max-width: 80%;

  &.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.message.assistant .message-avatar {
  background: $primary;
}

.message.user .message-avatar {
  background: #E5E7EB;
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.message.assistant .message-content {
  background: white;
  border: 1px solid $border;
  color: #374151;
}

.message.user .message-content {
  background: $primary;
  color: white;
}

.message-text {
  :deep(br) {
    margin-bottom: 8px;
  }
}

.message-images {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  img {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
  }
}

.options {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-btn {
  padding: 8px 16px;
  background: $bg-white;
  border: 1px solid $border;
  color: $text-secondary;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    border-color: $primary;
    color: $primary;
  }
}

.result-card {
  margin-top: 12px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid $border;
}

.result-title {
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8px;
}

.result-content {
  font-size: 13px;
  color: $text-secondary;

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

// 加载中
.message.loading {
  .typing-indicator {
    display: flex;
    gap: 4px;

    span {
      width: 8px;
      height: 8px;
      background: #999;
      border-radius: 50%;
      animation: typing 1s infinite;

      &:nth-child(2) {
        animation-delay: 0.2s;
      }

      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
}

@keyframes typing {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

// 输入区域
.input-area {
  background: white;
  border-top: 1px solid $border;
  padding: 20px 32px;
}

.input-box {
  background: #f8fafc;
  border: 1px solid $border;
  border-radius: 16px;
  padding: 16px;
}

textarea {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  min-height: 60px;
  font-family: inherit;

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    opacity: 0.5;
  }
}

.input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid $border;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border: 1px solid $border;
  border-radius: 8px;
  font-size: 13px;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    color: #374151;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.uploaded-preview {
  display: flex;
  gap: 8px;
}

.image-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: $primary-bg;
  border-radius: 4px;
  font-size: 12px;
  color: $primary;

  button {
    border: none;
    background: none;
    cursor: pointer;
    color: $primary;
    font-size: 14px;
    line-height: 1;
  }
}

.send-btn {
  padding: 10px 24px;
  background: $primary;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #1D4ED8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
