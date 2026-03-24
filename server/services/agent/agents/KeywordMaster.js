/**
 * KeywordMaster.js - 关键词大师 Agent
 * 专业的亚马逊关键词优化专家
 */

import { BaseAgent } from '../core/BaseAgent.js';
import { claudeService } from '../../../services/llm/ClaudeService.js';

export class KeywordMaster extends BaseAgent {
  constructor() {
    super({
      id: 'keyword-master',
      name: '关键词大师',
      description: '专业的亚马逊SEO专家，擅长挖掘高转化关键词',
      avatar: 'KW',
      
      systemPrompt: `你是专业的亚马逊SEO专家，精通关键词研究和优化。

你的职责：
1. 分析产品特点和目标市场
2. 挖掘高搜索量、高转化的关键词
3. 区分核心关键词、长尾关键词、品牌关键词
4. 提供关键词布局和优化建议

关键词类型：
- 核心关键词：产品主要类别词（如：power bank）
- 长尾关键词：具体场景词（如：20000mah power bank for camping）
- 品牌关键词：品牌+产品组合
- 竞品关键词：竞争对手品牌词`,

      requiredFields: ['productType', 'mainFeature'],
      
      llmService: claudeService,
      
      questionTemplates: {
        productType: {
          text: '这是什么类型的产品？',
          options: [],
        },
        mainFeature: {
          text: '产品的主要功能/特点是什么？',
          options: [],
        },
        targetMarket: {
          text: '主要目标市场是哪个国家/地区？',
          options: ['美国', '欧洲', '日本', '全球'],
        },
        competitors: {
          text: '主要竞争对手有哪些品牌？（可选）',
          options: [],
        },
      },
    });
  }

  /**
   * 创建执行计划
   */
  async createExecutionPlan(message, context) {
    return {
      steps: [
        {
          type: 'transform',
          description: '分析关键词需求',
          fn: async () => ({
            productInfo: {
              type: context.productType,
              feature: context.mainFeature,
              market: context.targetMarket || '美国',
              competitors: context.competitors || '',
            }
          }),
        },
        {
          type: 'transform',
          description: '生成关键词方案',
          fn: async (input, ctx) => {
            const keywords = await this.generateKeywords(input.productInfo);
            ctx.keywords = keywords;
            return input;
          },
        },
      ],
      expectedOutput: '完整的关键词优化方案',
    };
  }

  /**
   * 生成关键词
   */
  async generateKeywords(productInfo) {
    const prompt = `
作为亚马逊SEO专家，为以下产品生成关键词方案：

产品类型：${productInfo.type}
主要功能：${productInfo.feature}
目标市场：${productInfo.market}
竞争对手：${productInfo.competitors || '无'}

请返回 JSON 格式：
{
  "coreKeywords": ["核心关键词1", "核心关键词2"],
  "longTailKeywords": ["长尾词1", "长尾词2"],
  "brandKeywords": ["品牌词1", "品牌词2"],
  "backendKeywords": "后台搜索词（250字符以内）",
  "titleSuggestion": "建议的产品标题",
  "bulletPoints": ["五点描述要点1", "要点2", "要点3", "要点4", "要点5"],
  "optimizationTips": ["优化建议1", "优化建议2"]
}`;

    return await claudeService.generateJSON(prompt);
  }

  /**
   * 格式化结果
   */
  formatResult(result) {
    const kw = result.keywords;
    return {
      type: 'keyword-research',
      summary: `已生成 ${kw.coreKeywords.length} 个核心词，${kw.longTailKeywords.length} 个长尾词`,
      keywords: kw,
      usage: {
        title: kw.titleSuggestion,
        bullets: kw.bulletPoints,
        backend: kw.backendKeywords,
      },
      tips: kw.optimizationTips,
    };
  }
}

export default KeywordMaster;
