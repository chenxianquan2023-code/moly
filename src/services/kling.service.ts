/**
 * 可灵 AI 视频生成服务
 * 支持图生视频（image2video），直接传图，准确度远高于文生视频
 *
 * 鉴权方式：Access Key + Secret Key → JWT (HS256)
 * 文档：https://app.klingai.com/global/dev/api-doc
 */

// 走本地 Express 代理，避免浏览器 CORS 限制
const KLING_BASE_URL = '/api/kling';
const KLING_ACCESS_KEY = import.meta.env.VITE_KLING_ACCESS_KEY || '';
const KLING_SECRET_KEY = import.meta.env.VITE_KLING_SECRET_KEY || '';

// ─── JWT 生成（Web Crypto API，浏览器原生，无需第三方库）───────────────────

async function generateJWT(accessKey: string, secretKey: string): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: accessKey,
        exp: now + 1800, // 30 分钟有效
        nbf: now - 5,
    };

    const encode = (obj: object) =>
        btoa(JSON.stringify(obj))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

    const headerB64 = encode(header);
    const payloadB64 = encode(payload);
    const signingInput = `${headerB64}.${payloadB64}`;

    const keyData = new TextEncoder().encode(secretKey);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        new TextEncoder().encode(signingInput)
    );

    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${headerB64}.${payloadB64}.${sigB64}`;
}

// ─── 图片压缩 + 转纯 base64（可灵要求纯 base64，图片限制 ≤5MB JPEG）──────────

const KLING_MAX_SIZE = 1280; // 长边最大像素
const KLING_JPEG_QUALITY = 0.85;

async function compressToJpegBase64(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            if (width > KLING_MAX_SIZE || height > KLING_MAX_SIZE) {
                if (width > height) {
                    height = Math.round(height * KLING_MAX_SIZE / width);
                    width = KLING_MAX_SIZE;
                } else {
                    width = Math.round(width * KLING_MAX_SIZE / height);
                    height = KLING_MAX_SIZE;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', KLING_JPEG_QUALITY);
            resolve(compressed.split(',')[1] || '');
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

async function imageToBase64(imageUrl: string): Promise<string> {
    let dataUrl: string;

    if (imageUrl.startsWith('data:')) {
        dataUrl = imageUrl;
    } else {
        // Blob URL 或网络 URL，先 fetch 成 dataUrl
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // 统一压缩为 JPEG，控制大小
    return compressToJpegBase64(dataUrl);
}

// ─── 主服务类 ────────────────────────────────────────────────────────────────

export interface KlingVideoOptions {
    model?: 'kling-v1' | 'kling-v1-6' | 'kling-v2';
    duration?: '5' | '10';
    mode?: 'std' | 'pro';
    cfgScale?: number;       // 提示词相关性 0-1，默认 0.5
    maxPollingTime?: number; // 最大等待时间（毫秒），默认 300000 (5分钟)
    pollingInterval?: number;
}

class KlingService {
    private async getAuthHeaders(): Promise<HeadersInit> {
        const token = await generateJWT(KLING_ACCESS_KEY, KLING_SECRET_KEY);
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * 图生视频
     * @param imageUrl  主图（商品图），支持 http/https URL、data URL、blob URL
     * @param prompt    视频描述提示词（可选，不传也能生成）
     * @param options   生成参数
     * @returns 视频直链 URL
     */
    async imageToVideo(
        imageUrl: string,
        prompt: string = '',
        options: KlingVideoOptions = {}
    ): Promise<string> {
        const model = options.model || 'kling-v1-6';
        const duration = options.duration || '5';
        const mode = options.mode || 'std';
        const cfgScale = options.cfgScale ?? 0.5;
        const maxPollingTime = options.maxPollingTime ?? 300000;
        const pollingInterval = options.pollingInterval ?? 5000;

        // Step 1: 图片转纯 base64
        console.log('[KlingService] Converting image to base64...');
        const resolvedImage = await imageToBase64(imageUrl);

        // Step 2: 创建任务
        console.log('[KlingService] Creating image2video task...');
        const headers = await this.getAuthHeaders();

        const body: Record<string, any> = {
            model_name: model,
            image: resolvedImage,
            duration,
            mode,
            cfg_scale: cfgScale,
        };
        if (prompt) body.prompt = prompt;

        const createResp = await fetch(`${KLING_BASE_URL}/v1/videos/image2video`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!createResp.ok) {
            const errText = await createResp.text();
            throw new Error(`可灵创建任务失败: ${createResp.status} - ${errText}`);
        }

        const createData = await createResp.json();
        console.log('[KlingService] Task created:', createData);

        if (createData.code !== 0) {
            throw new Error(`可灵接口错误: ${createData.message || JSON.stringify(createData)}`);
        }

        const taskId: string = createData.data?.task_id;
        if (!taskId) throw new Error('未返回 task_id');

        // Step 3: 轮询状态
        console.log('[KlingService] Polling task:', taskId);
        const startTime = Date.now();

        while (true) {
            if (Date.now() - startTime > maxPollingTime) {
                throw new Error(`视频生成超时（${maxPollingTime / 1000}秒），task_id: ${taskId}`);
            }

            await new Promise(r => setTimeout(r, pollingInterval));

            const freshHeaders = await this.getAuthHeaders(); // JWT 可能过期，每次重新生成
            const statusResp = await fetch(`${KLING_BASE_URL}/v1/videos/image2video/${taskId}`, {
                headers: freshHeaders,
            });

            if (!statusResp.ok) {
                console.warn('[KlingService] Status check failed, retrying...');
                continue;
            }

            const statusData = await statusResp.json();
            const taskStatus: string = statusData.data?.task_status;
            console.log('[KlingService] Task status:', taskStatus);

            if (taskStatus === 'succeed') {
                const videoUrl: string = statusData.data?.task_result?.videos?.[0]?.url;
                if (!videoUrl) throw new Error('任务成功但未返回视频 URL');
                console.log('[KlingService] Video URL:', videoUrl);
                return videoUrl;
            }

            if (taskStatus === 'failed') {
                const reason = statusData.data?.task_status_msg || '未知原因';
                throw new Error(`视频生成失败: ${reason}`);
            }

            // processing / submitted 状态继续等待
        }
    }
}

export const klingService = new KlingService();
export default KlingService;
