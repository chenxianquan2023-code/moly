/**
 * Sora 视频生成服务
 * 封装 OpenAI Sora API 调用
 */

import { AI_CONFIG } from '@/config/ai.config';

interface SoraVideoResponse {
    id: string;
    object: string;
    url: string;
    status: string;
}

class SoraService {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = AI_CONFIG.apiKey;
        this.baseUrl = AI_CONFIG.baseUrl; // 使用相同的代理地址
    }

    /**
     * 生成视频（两步流程 + 轮询等待）
     * @param prompt 视频生成提示词
     * @param options 生成选项
     * @returns 视频 Blob URL（可直接用于 <video> 播放）
     */
    async generateVideo(
        prompt: string,
        options?: {
            model?: string;
            maxPollingTime?: number; // 最大轮询时间（毫秒）
            pollingInterval?: number; // 轮询间隔（毫秒）
            images?: string[]; // 图片 URL 数组（支持图生视频）
            aspectRatio?: string; // 视频比例（如 16:9, 9:16 等）
            temperature?: number; // 创意程度（0-1）
        }
    ): Promise<string> {
        try {
            const model = options?.model || 'sora-2';
            const maxPollingTime = options?.maxPollingTime || 180000; // 默认3分钟
            const pollingInterval = options?.pollingInterval || 5000; // 默认5秒
            const images = options?.images || [];

            // Step 1: 创建视频任务
            console.log('[SoraService] Step 1: Creating video task with prompt:', prompt);
            console.log('[SoraService] Image count:', images.length);

            // 构建 JSON 请求体（仅包含基础参数）
            const requestBody: any = {
                model: model,
                prompt: prompt
            };

            // 注意：size, width, height, seconds 等参数会导致错误
            // 仅使用最基本的 model 和 prompt 参数

            // 注意：经测试，该 API 不支持 image 参数
            // 只支持文生视频（text-to-video），不支持图生视频
            if (images.length > 0) {
                console.warn('[SoraService] API does not support image input. Use detailed text descriptions in prompt instead.');
            }

            console.log('[SoraService] Request body:', JSON.stringify(requestBody, null, 2));

            const createResponse = await fetch(`${this.baseUrl}/v1/videos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                throw new Error(`Sora 创建任务失败: ${createResponse.status} - ${errorText}`);
            }

            const taskData: SoraVideoResponse = await createResponse.json();
            console.log('[SoraService] Task created:', taskData);

            if (!taskData.id) {
                throw new Error('创建任务成功，但未返回 task_id');
            }

            const taskId = taskData.id;

            // Step 2: 轮询等待任务完成
            console.log('[SoraService] Step 2: Polling task status...');

            const startTime = Date.now();
            let isCompleted = false;
            let currentStatus = taskData.status || 'NOT_START';

            while (!isCompleted) {
                // 检查是否超时
                if (Date.now() - startTime > maxPollingTime) {
                    throw new Error(`视频生成超时（超过 ${maxPollingTime / 1000} 秒），当前状态: ${currentStatus}`);
                }

                // 查询任务状态（假设可以通过 GET /v1/videos/{taskId} 获取状态）
                const statusResponse = await fetch(`${this.baseUrl}/v1/videos/${taskId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                });

                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    currentStatus = statusData.status;
                    console.log(`[SoraService] Task status: ${currentStatus}`);

                    if (currentStatus === 'completed') {
                        isCompleted = true;
                        break;
                    } else if (currentStatus === 'failed' || currentStatus === 'error') {
                        throw new Error(`视频生成失败，状态: ${currentStatus}`);
                    }
                }

                // 等待一段时间后再次轮询
                await new Promise(resolve => setTimeout(resolve, pollingInterval));
            }

            // Step 3: 获取视频内容
            console.log('[SoraService] Step 3: Fetching video content for completed task:', taskId);

            const videoResponse = await fetch(`${this.baseUrl}/v1/videos/${taskId}/content`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'video/mp4, video/*, */*'
                },
                mode: 'cors',
                credentials: 'omit'
            });

            if (!videoResponse.ok) {
                const errorText = await videoResponse.text();
                throw new Error(`Sora 获取视频失败: ${videoResponse.status} - ${errorText}`);
            }

            // 检查响应类型
            const contentType = videoResponse.headers.get('content-type');
            console.log('[SoraService] Response content-type:', contentType);

            // 获取视频 Blob
            const videoBlob = await videoResponse.blob();
            console.log('[SoraService] Video blob received, size:', videoBlob.size, 'type:', videoBlob.type);

            if (videoBlob.size === 0) {
                throw new Error('获取的视频文件为空');
            }

            // 创建 Blob URL 供浏览器播放
            const videoBlobUrl = URL.createObjectURL(videoBlob);
            console.log('[SoraService] Video Blob URL created:', videoBlobUrl);

            return videoBlobUrl;

        } catch (error) {
            console.error('[SoraService] generateVideo error:', error);
            throw error;
        }
    }

    /**
     * 更新配置
     */
    updateConfig(config: { apiKey?: string; baseUrl?: string }) {
        if (config.apiKey) this.apiKey = config.apiKey;
        if (config.baseUrl) this.baseUrl = config.baseUrl;
    }


}

// 导出单例
export const soraService = new SoraService();
export default SoraService;
