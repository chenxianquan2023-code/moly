/**
 * ToolRegistry.js - 工具注册表
 * 复用 LangChain 的 Tool 概念，但直接实现
 */

export class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  /**
   * 注册工具
   * @param {string} name - 工具名称
   * @param {object} tool - 工具定义
   * @param {string} tool.name - 工具名称
   * @param {string} tool.description - 工具描述（用于 LLM 理解）
   * @param {object} tool.parameters - 参数定义（JSON Schema）
   * @param {function} tool.execute - 执行函数
   */
  register(name, tool) {
    if (this.tools.has(name)) {
      console.warn(`[ToolRegistry] Tool ${name} already exists, overwriting`);
    }
    
    this.tools.set(name, {
      name,
      description: tool.description,
      parameters: tool.parameters || {},
      execute: tool.execute,
    });
    
    console.log(`[ToolRegistry] Registered tool: ${name}`);
  }

  /**
   * 获取工具
   */
  get(name) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool;
  }

  /**
   * 执行工具
   */
  async execute(name, params) {
    const tool = this.get(name);
    console.log(`[ToolRegistry] Executing: ${name}`, params);
    
    try {
      const result = await tool.execute(params);
      console.log(`[ToolRegistry] ${name} completed`);
      return {
        success: true,
        tool: name,
        result,
      };
    } catch (error) {
      console.error(`[ToolRegistry] ${name} failed:`, error);
      return {
        success: false,
        tool: name,
        error: error.message,
      };
    }
  }

  /**
   * 列出所有工具（用于 LLM 选择）
   */
  list() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  /**
   * 生成工具选择提示词
   */
  getToolSelectionPrompt() {
    const tools = this.list();
    return `Available tools:\n${tools.map(t => 
      `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters)}`
    ).join('\n')}`;
  }
}

// 创建全局工具注册表实例
export const toolRegistry = new ToolRegistry();

export default ToolRegistry;
