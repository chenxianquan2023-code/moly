/**
 * agent.store.ts - Agent 状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { agentService, type Agent, type ChatMessage, type ChatResponse } from '@/services/agent.service';

export interface AgentState {
  agents: Agent[];
  currentAgent: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  context: Record<string, any>;
}

export const useAgentStore = defineStore('agent', () => {
  // State
  const agents = ref<Agent[]>([]);
  const currentAgent = ref<string | null>(null);
  const messages = ref<ChatMessage[]>([]);
  const isLoading = ref(false);
  const context = ref<Record<string, any>>({});

  // Getters
  const currentAgentInfo = computed(() => {
    return agents.value.find(a => a.id === currentAgent.value);
  });

  const hasMessages = computed(() => messages.value.length > 0);

  // Actions
  /**
   * 加载 Agent 列表
   */
  async function loadAgents() {
    try {
      agents.value = await agentService.getAgents();
      // 默认选择第一个
      if (agents.value.length > 0 && !currentAgent.value) {
        currentAgent.value = agents.value[0].id;
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  }

  /**
   * 选择 Agent
   */
  function selectAgent(agentId: string) {
    currentAgent.value = agentId;
    // 切换 Agent 时清空对话
    messages.value = [];
    context.value = {};
  }

  /**
   * 发送消息
   */
  async function sendMessage(content: string, images: string[] = []) {
    if (!currentAgent.value || isLoading.value) return;

    // 添加用户消息
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      images,
      agent: currentAgent.value,
    };
    messages.value.push(userMessage);
    isLoading.value = true;

    try {
      // 调用 API
      const response = await agentService.chat({
        agentId: currentAgent.value,
        message: content,
        images,
        context: context.value,
      });

      // 更新上下文
      if (response.context) {
        context.value = response.context;
      }

      // 添加 AI 回复
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
        type: response.type,
        data: response.data,
        agent: response.agent,
        options: response.options,
        field: response.field,
      };
      messages.value.push(assistantMessage);

      return response;
    } catch (error) {
      console.error('Failed to send message:', error);
      // 添加错误消息
      messages.value.push({
        role: 'assistant',
        content: '抱歉，处理您的请求时出错了，请稍后重试。',
        type: 'text',
      });
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 回答 Agent 的问题（选择选项）
   */
  async function answerQuestion(field: string, value: string) {
    // 更新上下文
    context.value[field] = value;
    
    // 发送回答
    return await sendMessage(value);
  }

  /**
   * 清空对话
   */
  function clearChat() {
    messages.value = [];
    context.value = {};
  }

  return {
    // State
    agents,
    currentAgent,
    messages,
    isLoading,
    context,
    // Getters
    currentAgentInfo,
    hasMessages,
    // Actions
    loadAgents,
    selectAgent,
    sendMessage,
    answerQuestion,
    clearChat,
  };
});

export default useAgentStore;
