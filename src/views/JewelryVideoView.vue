<template>
  <div class="jewelry-page">

    <header class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">首饰视频工坊</h1>
      <span class="page-sub">模特 · 首饰 · 场景 → 专业展示视频</span>
    </header>

    <div class="page-body">

      <!-- 左侧上传区 -->
      <div class="upload-col">

        <!-- 01 模特图 -->
        <div class="section">
          <div class="section-label">
            <span class="num">01</span>
            <span class="title">模特图片</span>
            <span class="hint">必填</span>
          </div>
          <div
            class="drop-zone"
            :class="{ filled: modelImage }"
            @click="!modelImage && modelRef?.click()"
            @dragover.prevent
            @drop.prevent="e => onDrop(e, 'model')"
          >
            <img v-if="modelImage" :src="modelImage" class="preview" />
            <div v-if="modelImage" class="overlay">
              <button class="ov-btn del" @click.stop="modelImage = null">✕</button>
              <button class="ov-btn rep" @click.stop="modelRef?.click()">↺</button>
            </div>
            <div v-else class="placeholder">
              <span class="ph-icon">👤</span>
              <span class="ph-text">点击上传或拖拽</span>
              <span class="ph-sub">建议正面 / 半身照</span>
            </div>
          </div>
          <input ref="modelRef" type="file" accept="image/*" class="hidden" @change="e => onFile(e, 'model')" />
        </div>

        <!-- 02 首饰图（素材库 + 点击选中） -->
        <div class="section">
          <div class="section-label">
            <span class="num">02</span>
            <span class="title">首饰图片</span>
            <span class="hint">上传即默认选中（最多2件）</span>
          </div>
          <div class="jewelry-grid">
            <div
              v-for="(item, i) in jewelryImages"
              :key="i"
              class="jewelry-thumb"
              :class="{ selected: item.selected }"
              @click="toggleJewelry(i)"
            >
              <img :src="item.url" class="thumb-img" />
              <div v-if="item.selected" class="thumb-check">✓</div>
              <button class="thumb-del" @click.stop="removeJewelry(i)">✕</button>
            </div>
            <div
              class="jewelry-add"
              @click="jewelryInputRef?.click()"
              @dragover.prevent
              @drop.prevent="onDropJewelry"
            >
              <span class="add-icon">+</span>
              <span class="add-text">添加首饰</span>
            </div>
          </div>
          <div v-if="jewelryImages.length > 0" class="jewelry-tip">
            已选 {{ selectedJewelry.length || 1 }} 件首饰参与生成（未手动勾选时默认使用第 1 件）
          </div>
          <input
            ref="jewelryInputRef"
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            @change="onJewelryFiles"
          />
        </div>

        <!-- 03 场景图 -->
        <div class="section">
          <div class="section-label">
            <span class="num">03</span>
            <span class="title">场景图片</span>
            <span class="hint">可选</span>
          </div>
          <div
            class="drop-zone small"
            :class="{ filled: sceneImage }"
            @click="!sceneImage && sceneRef?.click()"
            @dragover.prevent
            @drop.prevent="e => onDrop(e, 'scene')"
          >
            <img v-if="sceneImage" :src="sceneImage" class="preview" />
            <div v-if="sceneImage" class="overlay">
              <button class="ov-btn del" @click.stop="sceneImage = null">✕</button>
              <button class="ov-btn rep" @click.stop="sceneRef?.click()">↺</button>
            </div>
            <div v-else class="placeholder">
              <span class="ph-icon">🏙️</span>
              <span class="ph-text">上传场景 / 背景参考图</span>
            </div>
          </div>
          <input ref="sceneRef" type="file" accept="image/*" class="hidden" @change="e => onFile(e, 'scene')" />
        </div>

        <!-- 04 额外要求 -->
        <div class="section">
          <div class="section-label">
            <span class="num">04</span>
            <span class="title">额外要求</span>
            <span class="hint">可选</span>
          </div>
          <textarea
            v-model="extraPrompt"
            class="extra-input"
            placeholder="例如：突出闪光效果、慢镜头特写、暖光氛围..."
            rows="2"
          />
        </div>

        <button
          class="generate-btn"
          :class="{ loading: isGenerating }"
          :disabled="!modelImage || jewelryImages.length === 0 || isGenerating"
          @click="generate"
        >
          <span v-if="!isGenerating">生成视频</span>
          <span v-else class="btn-loading">
            <span class="spin-dot"></span>{{ statusText }}
          </span>
        </button>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      </div>

      <!-- 右侧结果 -->
      <div class="result-col">
        <div class="frame-preview">
          <div class="frame-preview-title">关键帧预览（Gemini 先生成）</div>
          <div class="frame-grid">
            <div class="frame-item">
              <div class="frame-label">首帧（正面特写）</div>
              <div class="frame-box">
                <img v-if="firstFrameImage" :src="firstFrameImage" class="frame-img" />
                <div v-else class="frame-empty">{{ isGenerating ? '生成中...' : '待生成' }}</div>
              </div>
            </div>
            <div class="frame-item">
              <div class="frame-label">尾帧（侧面特写）</div>
              <div class="frame-box">
                <img v-if="lastFrameImage" :src="lastFrameImage" class="frame-img" />
                <div v-else class="frame-empty">{{ isGenerating ? '生成中...' : '待生成' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="result-stage">
          <template v-if="!videoUrl && !isGenerating">
            <div class="result-empty">
              <div class="empty-icon">🎬</div>
              <div class="empty-text">生成的视频将在这里播放</div>
              <div class="empty-sub">先生成首帧与尾帧，再自动合成视频</div>
            </div>
          </template>

          <template v-else-if="isGenerating && !videoUrl">
            <div class="result-loading">
              <div class="spinner"></div>
              <div class="loading-text">{{ statusText }}</div>
              <div class="loading-sub">可灵生成约需 2–5 分钟，请耐心等待</div>
            </div>
          </template>

          <template v-else-if="videoUrl">
            <div class="result-video">
              <video :src="videoUrl" controls autoplay loop class="video-player" />
              <div class="result-actions">
                <a :href="videoUrl" download="jewelry-video.mp4" class="action-btn">下载视频</a>
                <button class="action-btn outline" @click="generate" :disabled="isGenerating">重新生成</button>
              </div>
            </div>
          </template>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { klingService } from '@/services/kling.service';
import { AI_CONFIG } from '@/config/ai.config';

const modelRef = ref<HTMLInputElement | null>(null);
const sceneRef = ref<HTMLInputElement | null>(null);
const jewelryInputRef = ref<HTMLInputElement | null>(null);

const modelImage = ref<string | null>(null);
const sceneImage = ref<string | null>(null);
const jewelryImages = ref<{ url: string; selected: boolean }[]>([]);

const extraPrompt = ref('');
const isGenerating = ref(false);
const statusText = ref('');
const videoUrl = ref<string | null>(null);
const firstFrameImage = ref<string | null>(null);
const lastFrameImage = ref<string | null>(null);
const errorMsg = ref('');
const geminiVisionCapability = ref<'unknown' | 'ok' | 'blocked'>('unknown');

// ── 文件处理 ──────────────────────────────────────────────────────────────────

async function toDataUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith('data:')) return imageUrl;
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function compressForGemini(
  imageUrl: string,
  options?: { maxSide?: number; quality?: number }
): Promise<string> {
  const dataUrl = await toDataUrl(imageUrl);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX_SIDE = options?.maxSide ?? 1536;
      const JPEG_QUALITY = options?.quality ?? 0.88;
      let width = img.width;
      let height = img.height;
      if (width > MAX_SIDE || height > MAX_SIDE) {
        if (width >= height) {
          height = Math.round((height * MAX_SIDE) / width);
          width = MAX_SIDE;
        } else {
          width = Math.round((width * MAX_SIDE) / height);
          height = MAX_SIDE;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('图像处理失败：无法创建画布'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => reject(new Error('图像处理失败：图片不可读取'));
    img.src = dataUrl;
  });
}

function isFetchLikeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return /failed to fetch|networkerror|sending request|load failed/i.test(message);
}

function isGatewayLikeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return /502|503|504|bad gateway|gateway timeout|gemini 代理请求失败/i.test(message);
}

type GeminiPart = { text?: string; inlineData?: { data?: string; mimeType?: string } };

async function ensureGeminiVisionCapability(): Promise<void> {
  if (geminiVisionCapability.value === 'ok') return;
  if (geminiVisionCapability.value === 'blocked') {
    throw new Error('当前 Gemini Key/通道不支持“图片参考输入”，请更换可用 key 或供应商通道。');
  }

  const tinyPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAM0lEQVR4Ae3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4G4M2AAH1nYgNAAAAAElFTkSuQmCC';

  const response = await fetch(`/api/gemini/v1beta/models/${encodeURIComponent(AI_CONFIG.imageModel)}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: 'Describe the image in one short sentence.' },
          { inlineData: { mimeType: 'image/png', data: tinyPngBase64 } },
        ],
      }],
    }),
  });

  if (!response.ok) {
    geminiVisionCapability.value = 'blocked';
    throw new Error('当前 Gemini Key/通道不支持“图片参考输入”，请更换可用 key 或供应商通道。');
  }

  geminiVisionCapability.value = 'ok';
}

async function generateImageViaProxy(prompt: string, refs: string[]): Promise<string> {
  const parts: GeminiPart[] = [{ text: prompt }];
  for (const dataUrl of refs) {
    const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (!match) continue;
    parts.push({
      inlineData: {
        mimeType: match[1] || 'image/jpeg',
        data: match[2] || '',
      },
    });
  }

  const modelName = encodeURIComponent(AI_CONFIG.imageModel || 'gemini-3.1-flash-image-preview');
  const response = await fetch(`/api/gemini/v1beta/models/${modelName}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: '9:16', imageSize: '1K' },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    const compactErr = errText
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);
    throw new Error(`Gemini 代理请求失败: ${response.status} ${compactErr}`.trim());
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const responseParts: GeminiPart[] = candidate?.content?.parts || [];
  const imagePart = responseParts.find((part) => part?.inlineData?.data);
  if (imagePart?.inlineData?.data) {
    const mime = imagePart.inlineData.mimeType || 'image/png';
    return `data:${mime};base64,${imagePart.inlineData.data}`;
  }
  const textPart = responseParts.find((part) => part?.text);
  if (textPart?.text) return textPart.text;
  throw new Error('Gemini 未返回可用图片');
}

async function generateFrameWithRetry(
  prompt: string,
  rawRefGroups: string[][],
  statusLabel: string
): Promise<string> {
  const attempts = [
    { maxSide: 1280, quality: 0.84, suffix: '' },
    { maxSide: 1024, quality: 0.8, suffix: '（精简重试）' },
    { maxSide: 896, quality: 0.76, suffix: '（最小参考图重试）' },
  ];

  for (let i = 0; i < attempts.length; i++) {
    const group = rawRefGroups[Math.min(i, rawRefGroups.length - 1)] || [];
    const attempt = attempts[i];
    try {
      statusText.value = `${statusLabel}${attempt.suffix}`;
      const refs: string[] = [];
      for (const imageUrl of group) {
        refs.push(await compressForGemini(imageUrl, { maxSide: attempt.maxSide, quality: attempt.quality }));
      }
      return await generateImageViaProxy(prompt, refs);
    } catch (error) {
      const retryable = isFetchLikeError(error) || isGatewayLikeError(error);
      if (retryable && i < attempts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        continue;
      }
      throw error;
    }
  }
  throw new Error('关键帧生成失败');
}

function onFile(e: Event, type: 'model' | 'scene') {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  if (type === 'model') modelImage.value = url;
  else sceneImage.value = url;
  (e.target as HTMLInputElement).value = '';
}

function onDrop(e: DragEvent, type: 'model' | 'scene') {
  const file = e.dataTransfer?.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  if (type === 'model') modelImage.value = url;
  else sceneImage.value = url;
}

const selectedJewelry = computed(() => jewelryImages.value.filter(j => j.selected));

function addJewelryImage(url: string) {
  const selectedCount = selectedJewelry.value.length;
  jewelryImages.value.push({ url, selected: selectedCount < 2 });
}

function onJewelryFiles(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files) return;
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue;
    addJewelryImage(URL.createObjectURL(file));
  }
  (e.target as HTMLInputElement).value = '';
}

function onDropJewelry(e: DragEvent) {
  const files = e.dataTransfer?.files;
  if (!files) return;
  for (const file of Array.from(files)) {
    if (file.type.startsWith('image/')) {
      addJewelryImage(URL.createObjectURL(file));
    }
  }
}

function removeJewelry(i: number) {
  jewelryImages.value.splice(i, 1);
}

function toggleJewelry(i: number) {
  const item = jewelryImages.value[i];
  // 最多选2件
  if (!item.selected && selectedJewelry.value.length >= 2) return;
  item.selected = !item.selected;
}

// ── 生成逻辑 ──────────────────────────────────────────────────────────────────

async function generate() {
  if (!modelImage.value) return;
  if (jewelryImages.value.length === 0) {
    errorMsg.value = '请先上传至少 1 件首饰';
    return;
  }
  isGenerating.value = true;
  errorMsg.value = '';
  videoUrl.value = null;
  firstFrameImage.value = null;
  lastFrameImage.value = null;

  try {
    statusText.value = '正在检测 Gemini 图像能力...';
    await ensureGeminiVisionCapability();

    // Step 1: 组装参考图
    const selected = selectedJewelry.value.length > 0
      ? selectedJewelry.value
      : [jewelryImages.value[0]];
    const rawRefAll: string[] = [modelImage.value];
    for (const item of selected) rawRefAll.push(item.url);
    if (sceneImage.value) rawRefAll.push(sceneImage.value);
    const rawRefNoScene: string[] = [modelImage.value];
    for (const item of selected) rawRefNoScene.push(item.url);
    const rawRefCore: string[] = [modelImage.value, selected[0]?.url].filter(Boolean) as string[];
    const rawRefGroups = [rawRefAll, rawRefNoScene, rawRefCore];

    const jewelryCount = selected.length;
    const hasScene = !!sceneImage.value;
    const userExtra = extraPrompt.value.trim();
    const jewelryRangeText = jewelryCount > 1 ? `图2至图${jewelryCount + 1}` : '图2';
    const sceneText = hasScene ? `最后一张是场景参考图。` : '未提供场景图，请沿用图1原始背景。';

    // Step 2: Gemini 生成首帧（正面近景）
    const firstFramePrompt = [
      '你是高端珠宝广告视觉导演，请根据参考图生成用于视频的首帧。',
      `图1是模特图，${jewelryRangeText}是首饰参考图。${sceneText}`,
      '核心目标：首帧呈现模特佩戴首饰的正面视角，构图具备商业大片感，突出首饰质感与细节。',
      '硬性约束：首饰款式、颜色、材质、镶嵌细节必须与参考首饰图一致。',
      '硬性约束：模特脸部身份与体型保持一致，不改变人物身份。',
      hasScene ? '硬性约束：背景场景需贴近场景参考图氛围与色调。' : '硬性约束：背景沿用模特原图场景风格，不额外更换场景。',
      '镜头要求：中近景到近景，首饰清晰可见，光线高级，画面干净，适配 9:16 竖屏。',
      userExtra ? `用户补充要求：${userExtra}` : '',
    ].filter(Boolean).join('\n');

    const firstFrame = await generateFrameWithRetry(firstFramePrompt, rawRefGroups, 'Gemini 生成首帧（正面特写）...');
    if (!firstFrame.startsWith('data:image')) {
      throw new Error('首帧生成失败：模型未返回图片');
    }
    firstFrameImage.value = firstFrame;

    // Step 3: Gemini 生成尾帧（侧面特写）
    const lastFramePrompt = [
      '你是高端珠宝广告视觉导演，请根据同一组参考图生成视频尾帧。',
      `图1是模特图，${jewelryRangeText}是首饰参考图。${sceneText}`,
      '核心目标：尾帧呈现模特佩戴首饰的侧面或 3/4 侧角视角，形成与首帧明显不同的镜头角度变化。',
      '硬性约束：首饰款式、颜色、材质、镶嵌细节必须与参考首饰图一致。',
      '硬性约束：模特身份一致，不改变人物；保持整体穿搭和妆造风格一致。',
      hasScene ? '硬性约束：背景场景需贴近场景参考图氛围与色调。' : '硬性约束：背景沿用模特原图场景风格，不额外更换场景。',
      '镜头要求：重点突出首饰，强化金属/宝石高光与质感，画面具备电影级广告氛围，适配 9:16 竖屏。',
      userExtra ? `用户补充要求：${userExtra}` : '',
    ].filter(Boolean).join('\n');

    const lastFrame = await generateFrameWithRetry(lastFramePrompt, rawRefGroups, 'Gemini 生成尾帧（侧面特写）...');
    if (!lastFrame.startsWith('data:image')) {
      throw new Error('尾帧生成失败：模型未返回图片');
    }
    lastFrameImage.value = lastFrame;

    // Step 4: 可灵双帧生成视频（首帧+尾帧）
    statusText.value = '可灵双帧生成视频，约需 2–5 分钟...';
    const videoPrompt = [
      '高端首饰商业广告视频，首帧到尾帧平滑过渡，镜头运动自然。',
      '前段突出正面佩戴细节，后段过渡到侧面特写，强调首饰高光与材质。',
      '保持人物身份一致，风格统一，画面稳定流畅，大片感强。',
    ].join(' ');
    videoUrl.value = await klingService.imageToVideo(
      firstFrame,
      videoPrompt,
      {
        model: 'kling-v1-6',
        duration: '10',
        mode: 'pro',
        tailImageUrl: lastFrame,
        maxPollingTime: 600000,
      }
    );
  } catch (err: any) {
    const rawMessage = err?.message || '请重试';
    if (/不支持“图片参考输入”/.test(rawMessage)) {
      errorMsg.value = rawMessage;
      return;
    }
    if (isFetchLikeError(err) || isGatewayLikeError(err)) {
      errorMsg.value = '生成失败：Gemini 网关波动，已自动执行多轮降级重试（压缩/精简参考图）仍未成功，请稍后再试。';
    } else {
      errorMsg.value = `生成失败：${rawMessage}`;
    }
  } finally {
    isGenerating.value = false;
    statusText.value = '';
  }
}
</script>

<style scoped lang="scss">
.jewelry-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0f0f0f;
  color: #e5e7eb;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.back-btn {
  background: none; border: none; color: #6b7280;
  cursor: pointer; font-size: 14px; padding: 4px 8px; border-radius: 6px;
  &:hover { color: #fff; background: rgba(255,255,255,0.05); }
}
.page-title { font-size: 18px; font-weight: 600; margin: 0; }
.page-sub { font-size: 13px; color: #6b7280; }

.page-body { flex: 1; display: flex; overflow: hidden; }

// ── 左侧 ────────────────────────────────────────────
.upload-col {
  width: 340px;
  flex-shrink: 0;
  border-right: 1px solid rgba(255,255,255,0.08);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

.section { display: flex; flex-direction: column; gap: 7px; }

.section-label { display: flex; align-items: baseline; gap: 7px; }
.num { font-size: 11px; font-weight: 700; color: #3b82f6; letter-spacing: 1px; }
.title { font-size: 13px; font-weight: 500; color: #d1d5db; }
.hint { font-size: 11px; color: #4b5563; margin-left: auto; }

// 通用上传区
.drop-zone {
  height: 140px;
  border-radius: 10px;
  border: 1.5px dashed rgba(255,255,255,0.12);
  background: #161616;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s, background 0.2s;

  &:hover:not(.filled) { border-color: rgba(59,130,246,0.5); background: #1a1a1a; }
  &.filled { border-style: solid; border-color: rgba(59,130,246,0.25); cursor: default; }
  &.small { height: 100px; }
}

.preview { width: 100%; height: 100%; object-fit: contain; }

.overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center; gap: 10px;
  opacity: 0; transition: opacity 0.2s;
  .drop-zone:hover & { opacity: 1; }
}

.ov-btn {
  width: 32px; height: 32px; border-radius: 50%; border: none;
  font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  &.del { background: rgba(239,68,68,0.9); color: #fff; }
  &.rep { background: rgba(59,130,246,0.9); color: #fff; }
  &:hover { transform: scale(1.1); }
}

.placeholder {
  display: flex; flex-direction: column;
  align-items: center; gap: 5px; pointer-events: none;
}
.ph-icon { font-size: 26px; }
.ph-text { font-size: 12px; color: #6b7280; }
.ph-sub { font-size: 11px; color: #374151; }

// 首饰多图格子
.jewelry-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.jewelry-thumb {
  position: relative;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: border-color 0.15s;

  .thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; }

  &.selected {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }

  .thumb-check {
    position: absolute; top: 4px; left: 4px;
    width: 18px; height: 18px;
    background: #3b82f6; color: #fff;
    border-radius: 50%; font-size: 10px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }

  .thumb-del {
    position: absolute; top: 4px; right: 4px;
    width: 18px; height: 18px;
    background: rgba(0,0,0,0.75); color: #fff;
    border: none; border-radius: 50%; font-size: 9px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.15s;
  }

  &:hover .thumb-del { opacity: 1; }
}

.jewelry-add {
  height: 90px;
  border-radius: 8px;
  border: 1.5px dashed rgba(255,255,255,0.12);
  background: #161616;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover { border-color: rgba(59,130,246,0.5); background: #1a1a1a; }
}

.add-icon { font-size: 20px; color: #4b5563; }
.add-text { font-size: 10px; color: #4b5563; }

.jewelry-tip {
  font-size: 11px;
  color: #3b82f6;
  padding: 4px 8px;
  background: rgba(59,130,246,0.08);
  border-radius: 6px;
  text-align: center;
}

.hidden { display: none; }

.extra-input {
  width: 100%; box-sizing: border-box;
  background: #161616;
  border: 1.5px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: #d1d5db; font-size: 13px; font-family: inherit;
  padding: 10px 12px; resize: none; outline: none;
  &::placeholder { color: #374151; }
  &:focus { border-color: rgba(59,130,246,0.4); }
}

.generate-btn {
  width: 100%; padding: 12px;
  background: #2563eb; color: #fff;
  border: none; border-radius: 10px;
  font-size: 15px; font-weight: 600; cursor: pointer;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: #1d4ed8; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &.loading { background: #1e3a6e; }
}

.btn-loading {
  display: flex; align-items: center; justify-content: center; gap: 8px;
}

.spin-dot {
  width: 14px; height: 14px; flex-shrink: 0;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.error-msg {
  font-size: 12px; color: #f87171;
  padding: 8px 12px;
  background: rgba(239,68,68,0.08); border-radius: 8px;
}

// ── 右侧 ────────────────────────────────────────────
.result-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
  padding: 24px;
  overflow-y: auto;
}

.frame-preview {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  background: #121212;
  padding: 10px 12px;
}

.frame-preview-title {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.frame-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.frame-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.frame-label {
  font-size: 11px;
  color: #9ca3af;
}

.frame-box {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  background: #171717;
  height: 148px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.frame-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.frame-empty {
  font-size: 12px;
  color: #6b7280;
}

.result-stage {
  flex: 1;
  min-height: 420px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  background: #121212;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-empty {
  text-align: center; display: flex;
  flex-direction: column; align-items: center; gap: 10px;
}
.empty-icon { font-size: 52px; opacity: 0.25; }
.empty-text { font-size: 16px; color: #4b5563; }
.empty-sub { font-size: 13px; color: #374151; }

.result-loading {
  text-align: center; display: flex;
  flex-direction: column; align-items: center; gap: 16px;
}

.spinner {
  width: 44px; height: 44px;
  border: 3px solid rgba(255,255,255,0.08);
  border-top-color: #3b82f6; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.loading-text { font-size: 15px; color: #9ca3af; }
.loading-sub { font-size: 12px; color: #4b5563; }

.result-video {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 16px;
}

.video-player {
  max-width: 100%; max-height: calc(100% - 60px);
  border-radius: 12px; background: #000;
}

.result-actions { display: flex; gap: 12px; }

.action-btn {
  padding: 8px 20px; border-radius: 8px; font-size: 13px;
  text-decoration: none; cursor: pointer;
  background: rgba(255,255,255,0.06);
  color: #d1d5db; border: 1px solid rgba(255,255,255,0.1);
  &:hover { background: rgba(255,255,255,0.1); color: #fff; }
  &.outline {
    background: rgba(37,99,235,0.1); color: #60a5fa;
    border-color: rgba(37,99,235,0.3);
    &:hover:not(:disabled) { background: rgba(37,99,235,0.2); }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
}
</style>
