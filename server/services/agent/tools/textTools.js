/**
 * textTools.js - 文本生成工具
 * 封装 Claude 等文本生成服务
 */

import { claudeService } from '../../../services/llm/ClaudeService.js';

/**
 * 文本生成工具
 */
export const textGenerationTool = {
  name: 'textGeneration',
  description: '使用 AI 生成文本内容（文案、描述等）',
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: '文本类型',
        enum: ['product-description', 'a-plus-copy', 'ad-copy', 'seo-title'],
      },
      productInfo: {
        type: 'object',
        description: '产品信息',
      },
      tone: {
        type: 'string',
        description: '语气风格',
        enum: ['professional', 'friendly', 'persuasive', 'minimal'],
      },
      length: {
        type: 'string',
        description: '长度要求',
        enum: ['short', 'medium', 'long'],
      },
    },
    required: ['type', 'productInfo'],
  },
  
  async execute(params) {
    console.log('[Tool:textGeneration] Generating text:', params.type);
    
    const prompt = buildPrompt(params);
    const text = await claudeService.generate(prompt, {
      maxTokens: params.length === 'long' ? 2000 : 1000,
    });
    
    return {
      success: true,
      text,
      type: params.type,
      creditsUsed: 1, // 消耗1积分
    };
  },
};

/**
 * 构建提示词
 */
function buildPrompt(params) {
  const { type, productInfo, tone = 'professional' } = params;
  
  const prompts = {
    'product-description': `
为以下产品撰写亚马逊产品描述：
产品类型：${productInfo.type}
核心卖点：${productInfo.sellingPoints}
目标受众：${productInfo.targetAudience || '通用'}
语气风格：${tone}

要求：
- 突出产品优势
- 使用 bullet points
- 包含关键词
- 长度：200-300字
`,
    
    'a-plus-copy': `
为以下产品撰写亚马逊A+页面文案：
产品类型：${productInfo.type}
核心卖点：${productInfo.sellingPoints}
目标受众：${productInfo.targetAudience}
品牌风格：${productInfo.brandStyle || '专业'}

要求：
- 包含标题、副标题、正文
- 突出差异化优势
- 引导购买
- 长度：每个区块50-100字
`,
    
    'ad-copy': `
为以下产品撰写广告文案：
产品类型：${productInfo.type}
核心卖点：${productInfo.sellingPoints}
投放平台：${productInfo.platform || '亚马逊'}

要求：
- 前3秒抓住注意力
- 突出核心利益点
- 包含行动号召
- 长度：50-100字
`,
    
    'seo-title': `
为以下产品撰写SEO优化标题：
产品类型：${productInfo.type}
核心关键词：${productInfo.keywords}
字符限制：200字符以内

要求：
- 包含核心关键词
- 突出主要卖点
- 符合亚马逊规范
`,
  };
  
  return prompts[type] || prompts['product-description'];
}

export default {
  textGenerationTool,
};
