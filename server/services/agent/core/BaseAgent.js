/**
 * BaseAgent.js - Agent 基类
 * 复用 LangChain 的 Agent 概念，但极简实现
 */

import { Chain } from './Chain.js';

export class BaseAgent {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.avatar = config.avatar || 'AI';
    this.systemPrompt = config.systemPrompt;
    this.requiredFields = config.requiredFields || [];
    this.tools = config.tools || [];
    this.llmService = config.llmService;
    
    // 收集阶段的问题模板
    this.questionTemplates = config.questionTemplates || {};
  }

  /**
   * 主入口：处理用户消息
   * @param {object} input - 用户输入
   * @param {string} input.message - 用户消息
   * @param {array} input.images - 图片列表
   * @param {object} input.context - 已收集的上下文
   * @returns {Promise<object>} - 响应
   */
  async handle(input) {
    const { message, images = [], context = {} } = input;
    
    console.log(`[Agent:${this.name}] Handling message:`, message);

    // 1. 更新上下文
    const updatedContext = {
      ...context,
      lastMessage: message,
      images: [...(context.images || []), ...images],
    };

    // 2. 检查是否缺少必需信息
    const missingFields = this.checkMissingFields(updatedContext);
    
    if (missingFields.length > 0) {
      // 信息不够 → 提问
      const question = await this.generateQuestion(missingFields[0], updatedContext);
      return {
        type: 'question',
        agent: this.id,
        content: question.text,
        options: question.options,
        field: missingFields[0],
        context: updatedContext,
      };
    }

    // 3. 信息足够 → 执行
    return await this.execute(message, updatedContext);
  }

  /**
   * 检查缺少哪些字段
   */
  checkMissingFields(context) {
    return this.requiredFields.filter(field => {
      const value = context[field];
      return value === undefined || value === null || value === '';
    });
  }

  /**
   * 生成问题
   */
  async generateQuestion(field, context) {
    // 如果有预设模板，直接使用
    if (this.questionTemplates[field]) {
      return this.questionTemplates[field];
    }

    // 否则使用 LLM 生成问题
    const prompt = `
${this.systemPrompt}

你正在收集信息以完成任务。当前已知信息：
${JSON.stringify(context, null, 2)}

缺少字段：${field}

请生成一个自然的问题来询问用户，以获取这个信息。
返回 JSON 格式：
{
  "text": "问题内容",
  "options": ["选项1", "选项2"] // 如果是选择题，否则为空数组
}
`;

    try {
      const response = await this.llmService.generateJSON(prompt);
      return {
        text: response.text,
        options: response.options || [],
      };
    } catch (error) {
      // 如果 LLM 失败，使用默认问题
      return {
        text: `请提供${field}：`,
        options: [],
      };
    }
  }

  /**
   * 执行 Agent 任务（子类可覆盖）
   */
  async execute(message, context) {
    // 默认实现：创建执行计划并执行
    const plan = await this.createExecutionPlan(message, context);
    return await this.executePlan(plan, context);
  }

  /**
   * 创建执行计划
   */
  async createExecutionPlan(message, context) {
    const prompt = `
${this.systemPrompt}

用户请求：${message}
已收集信息：${JSON.stringify(context, null, 2)}

可用工具：${this.tools.map(t => t.name).join(', ')}

请制定执行计划，返回 JSON 格式：
{
  "steps": [
    {
      "type": "tool",
      "tool": "工具名称",
      "params": { ...参数 },
      "description": "步骤描述"
    }
  ],
  "expectedOutput": "预期输出描述"
}
`;

    return await this.llmService.generateJSON(prompt);
  }

  /**
   * 执行计划
   */
  async executePlan(plan, context) {
    const chain = new Chain(
      plan.steps.map((step, index) => ({
        name: step.tool || `step-${index}`,
        description: step.description,
        fn: async (input, ctx) => {
          if (step.type === 'tool') {
            const tool = this.tools.find(t => t.name === step.tool);
            if (!tool) {
              throw new Error(`Tool not found: ${step.tool}`);
            }
            return await tool.execute(step.params);
          }
          
          if (step.type === 'transform') {
            return await step.fn(input, ctx);
          }
          
          return input;
        },
      })),
      { name: `${this.name}-execution` }
    );

    const result = await chain.run(null, context);
    
    return {
      type: 'result',
      agent: this.id,
      content: this.formatResult(result.result),
      data: result.result,
      context: result.context,
      executionLog: result.executionLog,
    };
  }

  /**
   * 格式化结果（子类可覆盖）
   */
  formatResult(result) {
    return result;
  }

  /**
   * 获取 Agent 信息
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      avatar: this.avatar,
      requiredFields: this.requiredFields,
      tools: this.tools.map(t => t.name),
    };
  }
}

export default BaseAgent;
