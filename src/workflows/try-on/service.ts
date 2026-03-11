/**
 * Try-On Workflow Service
 * Manages the business logic for virtual try-on generation
 */

import { WorkflowService } from '../base/WorkflowService';
import type {
    WorkflowExecutionContext,
    WorkflowExecutionResult
} from '../types/service';
import { tryOnService } from '@/services/tryOn.service';
import { geminiService } from '@/services/gemini.service';

export class TryOnWorkflowService extends WorkflowService {
    private modelDesc = '';
    private garmentDesc = '';

    /**
     * Validate inputs - both model and garment images must be uploaded
     */
    async validate(context: WorkflowExecutionContext): Promise<boolean> {
        const { inputData } = context;

        if (!inputData.model) {
            throw new Error('请上传模特图片');
        }

        if (!inputData.garment) {
            throw new Error('请上传服装图片');
        }

        return true;
    }

    /**
     * Analyze both images using AI
     */
    async analyzeBothImages(modelImage: string, garmentImage: string): Promise<{ modelDesc: string; garmentDesc: string }> {
        try {
            const analysisResult = await tryOnService.analyzeBothImages(modelImage, garmentImage);

            // Parse result (format: "图1...；图2...")
            const parts = analysisResult.split('；');
            if (parts.length >= 2) {
                this.modelDesc = parts[0]?.trim() || '';
                this.garmentDesc = parts[1]?.trim() || '';
            } else {
                this.modelDesc = analysisResult.trim();
                this.garmentDesc = '';
            }

            return {
                modelDesc: this.modelDesc,
                garmentDesc: this.garmentDesc
            };
        } catch (error) {
            console.error('Analysis failed:', error);
            // Fallback
            this.modelDesc = '图1人物';
            this.garmentDesc = '图2服装';
            return {
                modelDesc: this.modelDesc,
                garmentDesc: this.garmentDesc
            };
        }
    }

    /**
     * Generate prompt based on config and analysis
     */
    generatePrompt(configData: any): string {
        const actionText = configData.actionText?.trim() || '自然站立';
        const mDesc = this.modelDesc || '等待上传模特图...';
        const gDesc = this.garmentDesc || '等待上传服装图...';

        // Style mappings
        const styleLabels: Record<string, string> = {
            realistic: '写实摄影风格',
            fashion: '时尚大片风格',
            street: '街拍风格',
            commercial: '商业广告风'
        };

        const lensLabels: Record<string, string> = {
            closeup: '特写镜头',
            half: '半身照',
            full: '全身照',
            distant: '远景'
        };

        const angleLabels: Record<string, string> = {
            eye: '平视角度',
            high: '俯拍角度',
            low: '仰拍角度',
            '45deg': '45度角'
        };

        const bgTypeLabels: Record<string, string> = {
            original: '保持原背景',
            solid: '纯色背景',
            indoor: '室内场景',
            outdoor: '户外街道',
            nature: '自然风景'
        };

        const bgBlurLabels: Record<string, string> = {
            none: '清晰背景',
            light: '轻微虚化',
            heavy: '大光圈虚化'
        };

        const styleDesc = styleLabels[configData.photoStyle] || '写实摄影风格';
        const lensDesc = lensLabels[configData.lensView] || '半身照';
        const angleDesc = angleLabels[configData.cameraAngle] || '平视角度';
        const bgDesc = bgTypeLabels[configData.bgType] || '保持原背景';
        const blurDesc = configData.bgBlur !== 'none' ? `，${bgBlurLabels[configData.bgBlur]}` : '';
        const lightingDesc = configData.lighting ? '，光影增强' : '';

        const prompt = `请生成一张${styleDesc}的虚拟试穿效果图：

【任务】让人物A（${mDesc}）以动作C（${actionText}）穿上衣服B（${gDesc}）

【要求】
1. 保证衣服B和原图100%一致
2. 保持人物外貌特征不变
3. ${bgDesc}${blurDesc}

【拍摄参数】${lensDesc}，${angleDesc}${lightingDesc}`;

        return prompt;
    }

    /**
     * Execute try-on generation
     */
    async execute(context: WorkflowExecutionContext): Promise<WorkflowExecutionResult> {
        const startTime = Date.now();

        try {
            await this.onStart?.(context);

            const { inputData, configData } = context;

            // Step 1: Validate
            this.updateProgress(10, '验证输入...');
            await this.validate(context);

            // Step 2: Generate prompt
            this.updateProgress(20, '生成提示词...');
            const prompt = this.generatePrompt(configData);

            // Step 3: Execute try-on
            this.updateProgress(40, '正在生成虚拟试穿...');

            const result = await geminiService.generateImage(
                prompt,
                [inputData.model as string, inputData.garment as string],
                {
                    aspectRatio: configData.aspectRatio,
                    imageSize: configData.imageSize,
                    temperature: configData.temperature
                }
            );

            this.updateProgress(100, '完成！');

            const executionResult: WorkflowExecutionResult = {
                success: true,
                data: result,
                metadata: {
                    duration: Date.now() - startTime,
                    timestamp: Date.now()
                }
            };

            await this.onComplete?.(executionResult);
            return executionResult;

        } catch (error) {
            await this.onError?.(error as Error);
            return {
                success: false,
                error: error as Error,
                metadata: {
                    duration: Date.now() - startTime,
                    timestamp: Date.now()
                }
            };
        }
    }
}
