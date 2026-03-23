/**
 * ClaudeService.js - Claude API 服务
 * 封装 Claude 调用，支持文本生成和 JSON 输出
 * 
 * 使用方式：
 * 1. 设置 CLAUDE_API_KEY 环境变量 → 调用真实 API
 * 2. 未设置 API Key → 使用 Mock 模式（演示用）
 */

import { config } from '../../config/index.js';

export class ClaudeService {
  constructor() {
    this.apiKey = config.claudeApiKey || process.env.CLAUDE_API_KEY;
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.model = 'claude-3-opus-20240229';
    this.mockMode = !this.apiKey || this.apiKey === 'your_claude_api_key';
    
    if (this.mockMode) {
      console.log('[ClaudeService] Running in MOCK mode (no API key provided)');
    } else {
      console.log('[ClaudeService] Running with real Claude API');
    }
  }

  /**
   * 生成文本
   */
  async generate(prompt, options = {}) {
    // Mock 模式：返回模拟响应
    if (this.mockMode) {
      return this.mockGenerate(prompt, options);
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.model || this.model,
        max_tokens: options.maxTokens || 4096,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Mock 生成（演示用）
   */
  async mockGenerate(prompt, options = {}) {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 根据 prompt 内容返回不同的模拟响应
    if (prompt.includes('分析产品') || prompt.includes('产品信息')) {
      return JSON.stringify({
        productType: '充电宝',
        sellingPoints: ['20000mAh大容量', '65W快充', '便携设计'],
        targetAudience: '商务人士、学生',
        brandStyle: '简约现代',
      });
    }
    
    if (prompt.includes('规划') || prompt.includes('布局')) {
      return JSON.stringify({
        sections: [
          { type: 'hero', title: '主视觉', description: '突出大容量' },
          { type: 'lifestyle', title: '场景图', description: '商务出差' },
          { type: 'infographic', title: '功能图', description: '快充对比' },
          { type: 'specs', title: '规格表', description: '技术参数' },
        ]
      });
    }
    
    if (prompt.includes('关键词') || prompt.includes('SEO')) {
      return JSON.stringify({
        coreKeywords: ['power bank', 'portable charger', '20000mah power bank'],
        longTailKeywords: ['fast charging power bank', 'compact power bank for travel'],
        backendKeywords: 'power bank 20000mah fast charging portable',
      });
    }
    
    // 默认响应
    return '我已收到您的请求，正在处理中...';
  }

  /**
   * 生成 JSON
   */
  async generateJSON(prompt, options = {}) {
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no explanation.`;
    const text = await this.generate(jsonPrompt, options);
    
    try {
      // 尝试解析 JSON
      return JSON.parse(text);
    } catch (error) {
      // 如果失败，尝试提取 JSON 部分
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // Mock 模式下直接返回对象
      if (this.mockMode) {
        return { result: text };
      }
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }

  /**
   * 流式生成（用于实时对话）
   */
  async *generateStream(prompt, options = {}) {
    // Mock 模式：逐字输出
    if (this.mockMode) {
      const text = await this.mockGenerate(prompt, options);
      const words = text.split('');
      for (const word of words) {
        yield word;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      return;
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.model || this.model,
        max_tokens: options.maxTokens || 4096,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.delta?.text) {
              yield parsed.delta.text;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  }
}

// 创建全局实例
export const claudeService = new ClaudeService();

export default ClaudeService;
