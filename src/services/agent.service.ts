/**
 * agent.service.ts - Agent 服务
 * 前端调用后端 Agent API
 */

import { http } from './http';

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  requiredFields: string[];
  tools: string[];
}

// ChatMessage 已在上面定义

export interface ChatRequest {
  agentId: string;
  message: string;
  images?: string[];
  context?: Record<string, any>;
}

export interface ChatResponse {
  type: 'question' | 'result' | 'text';
  agent: string;
  content: string;
  options?: string[];
  field?: string;
  data?: any;
  context?: Record<string, any>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'question' | 'result' | 'image';
  data?: any;
  images?: string[];
  agent?: string;
  options?: string[];
  field?: string;
}

class AgentService {
  /**
   * 获取所有 Agent 列表
   */
  async getAgents(): Promise<Agent[]> {
    const response = await http.get('/api/agent/agents');
    return response.data.agents;
  }

  /**
   * 获取单个 Agent 信息
   */
  async getAgent(id: string): Promise<Agent> {
    const response = await http.get(`/api/agent/agents/${id}`);
    return response.data.agent;
  }

  /**
   * 发送消息给 Agent
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await http.post('/api/agent/chat', request);
    return response.data;
  }

  /**
   * 执行工具
   */
  async executeTool(toolName: string, params: any): Promise<any> {
    const response = await http.post(`/api/agent/tools/${toolName}`, params);
    return response.data;
  }

  /**
   * 获取工具列表
   */
  async getTools(): Promise<any[]> {
    const response = await http.get('/api/agent/tools');
    return response.data.tools;
  }
}

export const agentService = new AgentService();
export default agentService;
