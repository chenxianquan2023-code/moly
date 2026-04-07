<template>
  <!-- 悬浮按钮 -->
  <button class="agent-fab" :class="{ open: isOpen }" @click="toggleOpen" title="Moly AI 助手">
    <svg v-if="!isOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>

  <!-- 聊天面板 -->
  <Transition name="agent-slide">
    <div v-if="isOpen" class="agent-panel">
      <div class="agent-header">
        <div class="agent-avatar">M</div>
        <div class="agent-title-group">
          <div class="agent-name">Moly 助手</div>
          <div class="agent-status">在线 · 随时为你服务</div>
        </div>
        <button class="agent-close" @click="isOpen = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div ref="messagesRef" class="agent-messages">
        <div v-for="(msg, i) in messages" :key="i" class="msg-row" :class="msg.role">
          <div class="msg-bubble">
            <div v-if="msg.type === 'text'" class="msg-text" v-html="renderText(msg.content)"></div>
            <img v-else-if="msg.type === 'image'" :src="msg.content" class="msg-image" />
            <div v-else-if="msg.type === 'loading'" class="msg-loading">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="agent-input-area">
        <textarea
          ref="inputRef"
          v-model="inputText"
          class="agent-input"
          placeholder="问我任何问题，或告诉我你想做什么..."
          rows="1"
          @keydown.enter.exact.prevent="sendMessage"
          @input="autoResize"
        />
        <button class="agent-send" :disabled="!inputText.trim() || isThinking" @click="sendMessage">
          <svg v-if="!isThinking" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { geminiService } from '@/services/gemini.service';

const isOpen = ref(false);
const isThinking = ref(false);
const inputText = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);
const messagesRef = ref<HTMLDivElement | null>(null);

interface Message {
  role: 'user' | 'assistant';
  type: 'text' | 'image' | 'loading';
  content: string;
}

const messages = ref<Message[]>([
  {
    role: 'assistant',
    type: 'text',
    content: '你好！我是 Moly 助手 👋\n\n告诉我你想做什么，我来告诉你用哪个功能、怎么操作。',
  }
]);

const SYSTEM_PROMPT = `你是 Moly AI 助手，负责帮用户找到最适合的工具，语言简洁友好。

Moly 平台工具清单：
1. **营销海报**（路径：/tools/marketing-poster）
   - 晒转介绍：上传微信聊天截图 → 生成朋友圈转介绍海报
   - 晒团队：上传团队聊天/照片 → 生成团队展示海报
   - 晒产品：上传产品图 → 生成促销/软广海报

2. **AI 模特试穿**（路径：/tools/virtual-try-on）
   - 上传模特图 + 服装图 → 生成穿搭效果图

3. **AI 商品场景图**（路径：/tools/scene-generation）
   - 上传商品图 + 描述场景 → 生成电商场景主图

4. **抠图换背景**（路径：/tools/background-replace）
   - 上传图片 → 自动抠图，替换为新背景

5. **AI 换脸**（路径：/tools/face-swap）
   - 上传模特图 + 人脸图 → 保持服装换模特脸

6. **图片超清放大**（路径：/tools/upscale）
   - 上传模糊图片 → 2x/4x 超分辨率放大

7. **首饰促销视频**（路径：/tools/jewelry-promo-video）
   - 上传首饰图 + 模特图 → 生成短视频

8. **Amazon Listing 文案**（路径：/tools/listing）
   - 输入商品信息 → 生成标题、五点描述、Search Terms

9. **A+ 设计**（路径：/tools/aplus-wizard）
   - 输入商品信息 → 生成 Amazon A+ 模块内容

积分规则：注册送 100 积分，生图消耗 3-10 积分，积分不足可在个人中心充值。

回复规范：
- 直接告诉用户该用哪个工具，给出工具名称
- 简短说明操作步骤（1-3步）
- 如果需求不明确，反问一个关键问题来确认
- 不要尝试自己生成图片，只做引导
- 回复控制在100字以内，简洁有力`;

function toggleOpen() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      inputRef.value?.focus();
      scrollToBottom();
    });
  }
}

function autoResize(e: Event) {
  const el = e.target as HTMLTextAreaElement;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
}

function renderText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isThinking.value) return;

  messages.value.push({ role: 'user', type: 'text', content: text });
  inputText.value = '';
  if (inputRef.value) inputRef.value.style.height = 'auto';
  scrollToBottom();

  // 添加 loading
  const loadingIndex = messages.value.length;
  messages.value.push({ role: 'assistant', type: 'loading', content: '' });
  isThinking.value = true;
  scrollToBottom();

  try {
    const conversationHistory = messages.value
      .filter(m => m.type === 'text')
      .slice(-6)
      .map(m => `${m.role === 'user' ? '用户' : 'Moly助手'}: ${m.content}`)
      .join('\n');

    const fullPrompt = `${SYSTEM_PROMPT}\n\n对话记录：\n${conversationHistory}\n\n请回复用户。`;
    const reply = await geminiService.generateText(fullPrompt);

    messages.value.splice(loadingIndex, 1, {
      role: 'assistant', type: 'text',
      content: reply || '能换个方式描述你的需求吗？'
    });
  } catch (err) {
    messages.value.splice(loadingIndex, 1, {
      role: 'assistant', type: 'text',
      content: '抱歉，出现了一点问题。请稍后再试，或直接使用左侧工具栏。'
    });
  } finally {
    isThinking.value = false;
    scrollToBottom();
  }
}
</script>

<style scoped lang="scss">
.agent-fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.45);
  z-index: 1000;
  transition: all 0.2s;

  svg { width: 24px; height: 24px; }

  &:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(37, 99, 235, 0.55); }
  &.open { background: #6b7280; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
}

.agent-panel {
  position: fixed;
  bottom: 100px;
  right: 32px;
  width: 360px;
  height: 520px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  z-index: 999;
  overflow: hidden;

  @media (max-width: 480px) {
    width: calc(100vw - 24px);
    right: 12px;
    bottom: 80px;
    height: 60vh;
  }
}

.agent-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  color: #fff;
  flex-shrink: 0;

  .agent-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 16px;
    flex-shrink: 0;
  }

  .agent-title-group { flex: 1; }
  .agent-name { font-weight: 700; font-size: 14px; }
  .agent-status { font-size: 11px; opacity: 0.8; }

  .agent-close {
    background: none;
    border: none;
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    &:hover { color: #fff; background: rgba(255,255,255,0.15); }
    svg { width: 18px; height: 18px; }
  }
}

.agent-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scroll-behavior: smooth;
}

.msg-row {
  display: flex;
  &.user { justify-content: flex-end; }
  &.assistant { justify-content: flex-start; }

  .msg-bubble {
    max-width: 85%;

    .msg-text {
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.6;
    }

    .msg-image {
      max-width: 100%;
      border-radius: 12px;
      cursor: pointer;
    }

    .msg-loading {
      display: flex;
      gap: 4px;
      padding: 14px 18px;
      background: #f3f4f6;
      border-radius: 14px;

      span {
        width: 6px;
        height: 6px;
        background: #9ca3af;
        border-radius: 50%;
        animation: bounce 1.2s infinite;
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
  }

  &.user .msg-bubble .msg-text {
    background: linear-gradient(135deg, #3B82F6, #2563EB);
    color: #fff;
    border-bottom-right-radius: 4px;
  }

  &.assistant .msg-bubble .msg-text {
    background: #f3f4f6;
    color: #1f2937;
    border-bottom-left-radius: 4px;
  }
}

.agent-input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;

  .agent-input {
    flex: 1;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 14px;
    resize: none;
    outline: none;
    line-height: 1.5;
    max-height: 120px;
    overflow-y: auto;
    font-family: inherit;
    &:focus { border-color: #2563eb; }
  }

  .agent-send {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: #2563eb;
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s;
    svg { width: 18px; height: 18px; }

    &:hover:not(:disabled) { background: #1d4ed8; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.agent-slide-enter-active,
.agent-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.agent-slide-enter-from,
.agent-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
</style>
