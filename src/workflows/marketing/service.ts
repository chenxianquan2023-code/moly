/**
 * 商品营销物料工作流服务
 * 对接 Gemini API 生成营销素材
 */

import { WorkflowService } from '../base/WorkflowService';
import type {
    WorkflowExecutionContext,
    WorkflowExecutionResult
} from '../types/service';
import { geminiService } from '@/services/gemini.service';
import { klingService } from '@/services/kling.service';

export class MarketingWorkflowService extends WorkflowService {

    /**
     * 验证输入 
     * 逻辑更新：
     * - 模式 1 (decompose) & 2 (creative): 两张图必填
     * - 模式 3 (promotion): 仅商品图必填，设计素材可选
     */
    async validate(context: WorkflowExecutionContext): Promise<boolean> {
        const { inputData, configData } = context;
        const mode = configData.mode || 'decompose';

        // 1. 商品图永远必填
        if (!inputData.product) {
            throw new Error('请上传主商品图片 (Image 1)');
        }

        // 2. 场景/参考图根据模式判断
        if (mode !== 'promotion') {
            if (!inputData.scene) {
                throw new Error('当前模式需要上传参考图片 (Image 2)');
            }
        }

        return true;
    }

    /**
     * 构建提示词 - 核心逻辑重构 (中文版)
     * 采用 Explicit Reference (显式引用) 策略，利用图片顺序固定角色
     */
    private buildPrompt(mode: string, userPrompt: string, hasRefImage: boolean): string {

        // 通用前缀：定义图片角色
        let roleDefinition = `[图片角色定义]
- 图1 (第一张图): 核心产品 / 主体对象 (需要被处理的物体)
- 图2 (第二张图): ${hasRefImage ? '参考素材 / 风格纹理 / 结构指引 (提供样式的素材)' : '(未提供，请自动生成背景)'}`;

        // 模式特定指令
        const modeInstructions: Record<string, string> = {
            // 模式 1: 全能分解
            'decompose': `
[任务目标: 产品全能分解视图]
请生成图1中产品的高级爆炸图(Exploded View)或拆解视图。

[执行指令]
1. 分析图1中产品的内部结构和组件。
2. 将产品拆解为各个零部件。
3. ${hasRefImage ? '参考图2中的结构布局和拆解视角，模仿其构图方式。' : '使用专业的工业设计拆解视角。'}
4. 关键要求：保持图1产品的原有材质、质感和颜色细节。
5. 背景应当像工业设计图纸一样干净，或者符合参考图的风格。`,

            // 模式 2: 文创周边 (您的示例需求)
            'creative': `
[任务目标: 文创周边创意设计]
请将图2的视觉元素(纹理/图案/画作)应用到图1的物体上，设计一款文创产品。

[执行指令]
1. 识别图1中的物体类别 (如: 手表、马克杯、抱枕、T恤等)，将其作为"3D画布"。
2. 提取图2中的艺术纹理、图案或设计元素，将其作为"材质贴图"。
3. 将图2的材质自然地"印刷"或"覆盖"在图1物体的合理表面上 (例如: 手表的表带/表盘，马克杯的杯身)。
4. 关键要求：必须完美保留图1物体的3D光影、透视和立体感。不要压扁物体，要让它看起来像真实的实物照片。
5. 融合要自然，边缘处理要符合物理规律。`,

            // 模式 3: 促销海报
            'promotion': `
[任务目标: 爆款促销海报设计]
请为图1中的产品设计一张极具视觉冲击力的商业促销海报。

[执行指令]
1. 将图1的产品作为画面的视觉中心。
2. ${hasRefImage
                    ? '使用图2作为排版布局和配色参考。提取图2的设计风格，但将其中的主体替换为图1的产品。'
                    : '自动生成一个充满活力的促销背景，使用放射线、鲜艳色彩等元素，营造"热卖"或"限时折扣"的氛围。'}
3. 可以在画面中自然融入一些留白或装饰性文字区域，体现"高品质"或"最佳销量"的感觉。
4. 保证产品主体清晰、突出，吸引眼球。`
        };

        const specificInstruction = modeInstructions[mode] || modeInstructions['decompose'];

        // 用户自定义需求
        const customRequirement = userPrompt
            ? `\n\n[用户自定义需求]\n用户提供了补充要求，请优先满足：\n"${userPrompt}"`
            : '';

        // 组合最终提示词
        return `${roleDefinition}\n${specificInstruction}${customRequirement}\n\n[最终输出要求]\n只生成一张高质量的结果图片，不要包含多余的解释文字。`;
    }

    /**
     * 执行工作流
     */
    async execute(context: WorkflowExecutionContext): Promise<WorkflowExecutionResult> {
        const startTime = Date.now();

        try {
            await this.onStart?.(context);

            const { inputData, configData } = context;

            // Step 1: 验证输入
            this.updateProgress(10, '验证输入数据...');
            await this.validate(context);

            const mode = configData.mode || 'decompose';
            const userPrompt = configData.prompt || '';

            // 准备图片数组，确保顺序：[Product, Scene]
            const productUrl = inputData.product as string;
            const sceneUrl = inputData.scene as string;
            const imagesToProcess: string[] = [productUrl];

            if (sceneUrl) {
                imagesToProcess.push(sceneUrl);
            }

            // Step 2: 构建提示词
            this.updateProgress(30, '构建智能提示词...');
            // 传入是否有参考图，决定提示词逻辑
            const prompt = this.buildPrompt(mode, userPrompt, !!sceneUrl);

            console.log('[MarketingWorkflow] Generated Prompt:\n', prompt);

            // Step 3: 根据模式选择 API
            let imageUrl: string | null = null;
            let videoUrl: string | null = null;
            let description: string;

            if (mode === 'decompose') {
                // 全能分解模式：Gemini 分析图片 → Sora 生成视频
                this.updateProgress(20, '正在分析图片内容 (Gemini Vision)...');

                try {
                    // 直接传商品图给可灵，跳过 Gemini 分析（避免图片信息丢失）
                    this.updateProgress(30, '正在提交图生视频任务 (可灵)...');

                    // 构建视频提示词：用户输入 + 拆解动画指令
                    const videoPrompt = userPrompt
                        ? `${userPrompt}。产品爆炸图风格，展示产品各组件拆解过程，背景干净。`
                        : '产品爆炸图风格，展示产品各组件拆解过程，背景干净，工业设计风格。';

                    this.updateProgress(50, '正在生成视频 (可灵)，请稍候约1-3分钟...');

                    const generatedVideoUrl = await klingService.imageToVideo(
                        productUrl,
                        videoPrompt,
                        { model: 'kling-v1-6', duration: '5', mode: 'std' }
                    );

                    this.updateProgress(85, '视频生成完成，正在加载...');
                    videoUrl = generatedVideoUrl;
                    description = '产品分解动画已成功生成';
                } catch (error: any) {
                    console.error('[MarketingWorkflow] Video generation failed:', error);
                    description = `视频生成失败: ${error.message}`;
                    throw error;
                }

            } else {
                // 文创周边 & 促销海报模式：使用 Gemini 生成图片
                this.updateProgress(50, '正在生成营销物料 (Gemini Pro Vision)...');

                // 注意：geminiService.generateImage 接受 (prompt, images[], options)
                // images[] 的顺序将被保留传给模型，这对应了 prompt 中的 "图1", "图2"
                const resultImage = await geminiService.generateImage(
                    prompt,
                    imagesToProcess,
                    {
                        aspectRatio: configData.aspectRatio || '3:4',
                        imageSize: configData.imageSize || '2K',
                        temperature: configData.temperature !== undefined ? configData.temperature : 0.7
                    }
                );

                this.updateProgress(90, '处理生成结果...');

                if (resultImage.startsWith('data:image')) {
                    imageUrl = resultImage;
                    description = '营销物料已成功生成';
                } else {
                    // 如果返回的是文本（错误情况或拒绝生成）
                    imageUrl = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800';
                    description = `生成未返回图片数据。模型响应: ${resultImage.substring(0, 100)}...`;
                    console.warn('[MarketingWorkflow] Model returned text instead of image:', resultImage);
                }
            }

            const resultData = {
                imageUrl,
                videoUrl,
                prompt: prompt,
                mode: mode,
                description
            };

            this.updateProgress(100, '完成！');

            const executionResult: WorkflowExecutionResult = {
                success: true,
                data: resultData,
                metadata: {
                    duration: Date.now() - startTime,
                    timestamp: Date.now()
                }
            };

            await this.onComplete?.(executionResult);
            return executionResult;

        } catch (error: any) {
            console.error('[MarketingWorkflow] Execution failed:', error);
            await this.onError?.(error);

            return {
                success: false,
                error: error,
                metadata: {
                    duration: Date.now() - startTime,
                    timestamp: Date.now()
                }
            };
        }
    }
}
