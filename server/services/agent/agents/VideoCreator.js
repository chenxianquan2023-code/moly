/**
 * VideoCreator.js - 短视频摄影师 Agent
 * 专业的产品短视频制作专家
 */

import { BaseAgent } from '../core/BaseAgent.js';
import { claudeService } from '../../../services/llm/ClaudeService.js';

export class VideoCreator extends BaseAgent {
  constructor() {
    super({
      id: 'video-creator',
      name: '短视频摄影师',
      description: '专业的产品短视频制作专家，擅长电商产品展示视频',
      avatar: '🎬',
      
      systemPrompt: `你是专业的产品短视频摄影师，擅长制作高转化的电商产品视频。

你的职责：
1. 分析产品特点和目标受众
2. 规划视频脚本和分镜
3. 设计视频风格和节奏
4. 提供视频制作需求清单

视频类型：
- 产品展示：突出外观和功能
- 使用场景：展示实际使用
- 对比测评：与竞品对比
- 开箱体验：开箱+第一印象`,

      requiredFields: ['productType', 'videoPurpose'],
      
      llmService: claudeService,
      
      questionTemplates: {
        productType: {
          text: '这是什么类型的产品？',
          options: [],
        },
        videoPurpose: {
          text: '视频的主要用途是什么？',
          options: ['亚马逊主图视频', '社交媒体推广', '广告投放', '品牌宣传'],
        },
        videoStyle: {
          text: '希望什么风格？',
          options: ['简约干净', '活力动感', '高端大气', '温馨生活', '科技感'],
        },
        duration: {
          text: '视频时长要求？',
          options: ['15秒', '30秒', '60秒', '自定义'],
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
          description: '规划视频方案',
          fn: async () => {
            const script = await this.createScript(context);
            return { script };
          },
        },
        {
          type: 'transform',
          description: '生成分镜脚本',
          fn: async (input, ctx) => {
            const storyboard = await this.createStoryboard(input.script);
            ctx.storyboard = storyboard;
            return input;
          },
        },
      ],
      expectedOutput: '完整的视频制作方案',
    };
  }

  /**
   * 创建视频脚本
   */
  async createScript(context) {
    const prompt = `
为以下产品创建短视频脚本：
产品类型：${context.productType}
视频用途：${context.videoPurpose}
视频风格：${context.videoStyle || '简约干净'}
时长：${context.duration || '30秒'}

请返回 JSON 格式：
{
  "title": "视频标题",
  "duration": "总时长",
  "hook": "开场钩子（前3秒）",
  "scenes": [
    {
      "time": "0-5s",
      "content": "画面内容",
      "shot": "镜头类型",
      "text": "字幕/文案"
    }
  ],
  "music": "音乐风格建议",
  "cta": "结尾行动号召"
}`;

    return await claudeService.generateJSON(prompt);
  }

  /**
   * 创建分镜
   */
  async createStoryboard(script) {
    const shots = script.scenes.map((scene, index) => ({
      shotNumber: index + 1,
      time: scene.time,
      description: scene.content,
      camera: scene.shot,
      text: scene.text,
    }));

    return {
      totalShots: shots.length,
      estimatedDuration: script.duration,
      shots,
    };
  }

  /**
   * 格式化结果
   */
  formatResult(result) {
    return {
      type: 'video-script',
      summary: `已创建 ${result.script.scenes.length} 个镜头的视频脚本`,
      script: result.script,
      storyboard: result.storyboard,
      nextSteps: [
        '根据分镜准备拍摄/生成素材',
        '按时间线剪辑视频',
        '添加字幕和背景音乐',
      ],
    };
  }
}

export default VideoCreator;
