/**
 * AgentRegistry.js - Agent 注册表
 * 管理所有 Agent
 */

import { BaseAgent } from './BaseAgent.js';

export class AgentRegistry {
  constructor() {
    this.agents = new Map();
  }

  /**
   * 注册 Agent
   */
  register(agent) {
    if (!(agent instanceof BaseAgent)) {
      throw new Error('Agent must be an instance of BaseAgent');
    }
    
    this.agents.set(agent.id, agent);
    console.log(`[AgentRegistry] Registered agent: ${agent.name} (${agent.id})`);
  }

  /**
   * 获取 Agent
   */
  get(id) {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }
    return agent;
  }

  /**
   * 列出所有 Agent
   */
  list() {
    return Array.from(this.agents.values()).map(agent => agent.getInfo());
  }

  /**
   * 处理消息
   */
  async handle(agentId, input) {
    const agent = this.get(agentId);
    return await agent.handle(input);
  }
}

// 创建全局实例
export const agentRegistry = new AgentRegistry();

export default AgentRegistry;
