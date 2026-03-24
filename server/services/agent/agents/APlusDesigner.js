/**
 * APlusDesigner.js - A+设计师 Agent
 * 专业的亚马逊A+页面设计师
 */

import { BaseAgent } from '../core/BaseAgent.js';
import { claudeService } from '../../../services/llm/ClaudeService.js';

export class APlusDesigner extends BaseAgent {
  constructor() {
    super({
      id: 'a-plus-designer',
      name: 'A+设计师',
      description: '专业的亚马逊A+页面设计师，擅长视觉排版和转化优化',
      avatar: 'A+',
      
      systemPrompt: `你是专业的亚马逊A+页面设计师，拥有丰富的电商设计经验。

你的职责：
1. 分析产品卖点和目标受众
2. 规划A+页面结构（主图、场景图、信息图、对比图等）
3. 协调其他Agent完成图片和文案
4. 输出完整的A+页面方案

设计原则：
- 突出产品核心卖点
- 视觉层次清晰
- 符合亚马逊A+页面规范
- 提高转化率`,

      requiredFields: ['productType', 'sellingPoints'],
      
      llmService: claudeService,
      
      questionTemplates: {
        productType: {
          text: '这是什么类型的产品？',
          options: ['数码电子', '家居用品', '服装配饰', '美妆护肤', '户外运动', '其他'],
        },
        sellingPoints: {
          text: '产品的核心卖点是什么？（可多选）',
          options: ['高品质', '性价比', '创新设计', '便携', '耐用', '多功能', '环保', '其他'],
        },
        targetAudience: {
          text: '目标受众是谁？',
          options: ['商务人士', '学生', '家庭主妇', '户外爱好者', '科技爱好者', '其他'],
        },
        brandStyle: {
          text: '希望呈现什么样的品牌风格？',
          options: ['简约现代', '高端奢华', '活力年轻', '专业可靠', '温馨亲切', '其他'],
        },
      },
    });
  }

  /**
   * 创建执行计划（覆盖父类）
   */
  async createExecutionPlan(message, context) {
    // 根据收集的信息，直接构建执行计划
    // 不需要每次都问 LLM，提高效率
    
    const steps = [];

    // 步骤1：分析产品
    steps.push({
      type: 'transform',
      description: '分析产品信息',
      fn: async () => {
        return {
          analysis: {
            productType: context.productType,
            sellingPoints: context.sellingPoints,
            targetAudience: context.targetAudience || '通用受众',
            brandStyle: context.brandStyle || '简约现代',
          }
        };
      },
    });

    // 步骤2：规划页面结构
    steps.push({
      type: 'transform',
      description: '规划A+页面结构',
      fn: async (input, ctx) => {
        const layout = await this.planLayout(input.analysis);
        ctx.layout = layout;
        return input;
      },
    });

    // 步骤3：生成文案（调用文案工具）
    steps.push({
      type: 'tool',
      tool: 'textGeneration',
      params: {
        type: 'a-plus-copy',
        productInfo: context,
      },
      description: '生成A+页面文案',
    });

    // 步骤4：生成图片需求
    steps.push({
      type: 'transform',
      description: '生成图片需求列表',
      fn: async (input, ctx) => {
        const imageRequirements = await this.generateImageRequirements(ctx.layout, context);
        ctx.imageRequirements = imageRequirements;
        return input;
      },
    });

    return {
      steps,
      expectedOutput: '完整的A+页面设计方案，包括文案和图片需求',
    };
  }

  /**
   * 规划页面布局
   */
  async planLayout(analysis) {
    const prompt = `
基于以下产品信息，规划亚马逊A+页面结构：
产品类型：${analysis.productType}
核心卖点：${analysis.sellingPoints}
目标受众：${analysis.targetAudience}
品牌风格：${analysis.brandStyle}

请返回 JSON 格式的页面结构：
{
  "sections": [
    {
      "type": "hero|lifestyle|infographic|comparison|specs",
      "title": "区块标题",
      "description": "区块描述",
      "images": [{ "type": "主图|场景图|信息图", "description": "图片描述" }],
      "copy": "文案要点"
    }
  ]
}`;

    return await claudeService.generateJSON(prompt);
  }

  /**
   * 生成图片需求
   */
  async generateImageRequirements(layout, context) {
    const images = [];
    
    for (const section of layout.sections) {
      if (section.images) {
        for (const img of section.images) {
          images.push({
            section: section.type,
            type: img.type,
            description: img.description,
            style: context.brandStyle,
          });
        }
      }
    }
    
    return images;
  }

  /**
   * 格式化结果
   */
  formatResult(result) {
    return {
      type: 'a-plus-design',
      layout: result.layout,
      copy: result.copy,
      imageRequirements: result.imageRequirements,
      summary: `已为您规划 ${result.layout.sections.length} 个区块的A+页面方案`,
    };
  }
}

export default APlusDesigner;
