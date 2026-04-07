<template>
  <div class="tool-page">
    <header class="tool-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <span>营销海报生成</span>
        </div>
        <div class="header-right">
          <span class="points"><ThunderboltFilled /> {{ auth.points }} 积分</span>
          <router-link to="/tools/recharge" class="recharge-link">充值</router-link>
        </div>
      </div>
    </header>

    <main class="tool-main">
      <!-- 左侧：上传区 -->
      <aside class="upload-panel">
        <!-- 类型选择 -->
        <div class="type-tabs">
          <button
            v-for="t in types"
            :key="t.key"
            class="type-tab"
            :class="{ active: activeType === t.key }"
            @click="switchType(t.key)"
          >
            <span class="type-emoji">{{ t.emoji }}</span>
            <span>{{ t.label }}</span>
          </button>
        </div>

        <!-- 引导提示 -->
        <div class="guide-box">
          <div class="guide-title">📌 {{ currentType.guide.title }}</div>
          <ul class="guide-list">
            <li v-for="tip in currentType.guide.tips" :key="tip">{{ tip }}</li>
          </ul>
        </div>

        <!-- 上传区 -->
        <div class="upload-section">
          <div class="section-label">{{ currentType.uploadLabel }}</div>
          <div
            class="upload-area large"
            :class="{ hasImage: inputImage }"
            @click="!inputImage && fileRef?.click()"
            @dragover.prevent
            @drop.prevent="onDrop"
          >
            <img v-if="inputImage" :src="inputImage" class="preview-img" />
            <div v-if="inputImage" class="image-overlay">
              <button class="overlay-btn" @click.stop="clearImage">删除</button>
              <button class="overlay-btn" @click.stop="fileRef?.click()">更换</button>
            </div>
            <div v-else class="upload-placeholder">
              <PictureOutlined class="upload-icon" />
              <span>{{ currentType.uploadHint }}</span>
            </div>
          </div>
          <input ref="fileRef" type="file" class="hidden-input" accept="image/*" @change="onFileChange" />
          <!-- 示例图 -->
          <div class="example-row">
            <span class="example-label">示例：</span>
            <button
              v-for="(url, i) in currentType.examples"
              :key="i"
              class="example-thumb"
              @click="inputImage = url"
              title="点击使用此示例"
            >
              <img :src="url" :alt="`示例${i+1}`" />
            </button>
          </div>
        </div>
      </aside>

      <!-- 右侧：参数 + 预览 -->
      <div class="right-panel">
        <!-- 标题文字 -->
        <div class="field-group">
          <label class="field-label">海报主标题</label>
          <input v-model="titleText" class="field-input" :placeholder="currentType.titlePlaceholder" />
        </div>

        <!-- 副标题/口号 -->
        <div class="field-group">
          <label class="field-label">副标题 / 口号（可选）</label>
          <input v-model="subtitleText" class="field-input" :placeholder="currentType.subtitlePlaceholder" />
        </div>

        <!-- 产品图专属字段 -->
        <template v-if="activeType === 'product'">
          <div class="field-group">
            <label class="field-label">价格 / 优惠信息</label>
            <input v-model="priceText" class="field-input" placeholder="如：¥199 限时特惠，满500减100" />
          </div>
          <div class="field-group">
            <label class="field-label">海报风格</label>
            <div class="style-options">
              <button
                v-for="s in productStyles"
                :key="s.key"
                class="style-btn"
                :class="{ active: productStyle === s.key }"
                @click="productStyle = s.key"
              >{{ s.label }}</button>
            </div>
          </div>
        </template>

        <!-- 输出比例 -->
        <div class="field-group">
          <label class="field-label">输出比例</label>
          <div class="style-options">
            <button
              v-for="r in ratios"
              :key="r.value"
              class="style-btn"
              :class="{ active: aspectRatio === r.value }"
              @click="aspectRatio = r.value"
            >{{ r.label }}</button>
          </div>
        </div>

        <!-- 预览区 -->
        <div class="preview-area">
          <div v-if="!resultImage && !isGenerating" class="preview-empty">
            上传图片后点击生成
          </div>
          <div v-else-if="isGenerating" class="preview-loading">
            <LoadingOutlined class="spin" />
            <span>AI 创作中，约需 20-40 秒...</span>
          </div>
          <template v-else-if="resultImage">
            <img :src="resultImage" class="preview-result" />
            <a :href="resultImage" download="moly-poster.png" class="download-btn">下载海报</a>
          </template>
        </div>

        <div class="cost-row">预估消耗 <ThunderboltFilled class="icon" /> 10 积分</div>
        <button
          class="generate-btn"
          :class="{ disabled: isGenerating || !inputImage }"
          :disabled="isGenerating || !inputImage"
          @click="generate"
        >
          <ExperimentOutlined v-if="!isGenerating" />
          <LoadingOutlined v-else class="spin" />
          {{ isGenerating ? '生成中...' : '生成海报' }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { RightOutlined, ThunderboltFilled, PictureOutlined, ExperimentOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { geminiService } from '@/services/gemini.service';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';

const auth = useAuthStore();
const fileRef = ref<HTMLInputElement | null>(null);
const inputImage = ref<string | null>(null);
const resultImage = ref<string | null>(null);
const isGenerating = ref(false);

const activeType = ref<'referral' | 'team' | 'product'>('referral');
const titleText = ref('');
const subtitleText = ref('');
const priceText = ref('');
const productStyle = ref<'hard' | 'soft'>('hard');
const aspectRatio = ref('9:16');

const types = [
  {
    key: 'referral' as const, emoji: '🔁', label: '晒转介绍',
    uploadLabel: '微信聊天截图', uploadHint: '点击上传微信转介绍聊天记录截图',
    guide: {
      title: '晒转介绍海报怎么做？',
      tips: [
        '截取微信中客户主动帮你转介绍的聊天记录',
        '画面要能看到"推荐/介绍/加了/正在聊"等关键词',
        '主标题填：转介绍+N（N是新成交人数）',
        '副标题填你的品牌口号或个人宣言'
      ]
    },
    titlePlaceholder: '转介绍 +2',
    subtitlePlaceholder: '口碑裂变，靠的就是转介绍！',
    examples: [
      '/examples/poster/referral-1.jpg',
      '/examples/poster/referral-2.jpg',
      '/examples/poster/referral-3.jpg',
    ]
  },
  {
    key: 'team' as const, emoji: '👥', label: '晒团队',
    uploadLabel: '团队聊天或人物照片', uploadHint: '点击上传团队聊天截图或团队合照',
    guide: {
      title: '晒团队海报怎么做？',
      tips: [
        '截取团队群里帮扶、鼓励、成交的精彩聊天记录',
        '或者上传你们的团队合照、活动照片',
        '主标题填你们团队的核心定位',
        '副标题填团队口号，如"一个人走得快，一群人走得远"'
      ]
    },
    titlePlaceholder: '团队帮扶带',
    subtitlePlaceholder: '一对一针对性赋能，专业团队互帮互助',
    examples: [
      '/examples/poster/team-1.jpg',
      '/examples/poster/team-2.jpg',
      '/examples/poster/team-3.jpg',
    ]
  },
  {
    key: 'product' as const, emoji: '🛍️', label: '晒产品',
    uploadLabel: '产品图片', uploadHint: '点击上传产品图（白底图效果最佳）',
    guide: {
      title: '晒产品海报怎么做？',
      tips: [
        '上传清晰的产品图片（白底图效果最佳）',
        '主标题填产品名或核心卖点',
        '填入真实的价格和优惠信息',
        '选择"硬广"突出折扣力度，"软广"更有生活感'
      ]
    },
    titlePlaceholder: '本季热销 限时直降',
    subtitlePlaceholder: '助梦智能空调 月销10000+',
    examples: [
      '/examples/poster/product-1.jpg',
      '/examples/poster/product-2.jpg',
      '/examples/poster/product-3.jpg',
    ]
  },
];

const productStyles = [
  { key: 'hard', label: '硬广（促销风）' },
  { key: 'soft', label: '软广（生活风）' },
];

const ratios = [
  { value: '9:16', label: '9:16 竖版' },
  { value: '1:1', label: '1:1 方形' },
  { value: '3:4', label: '3:4 竖版' },
];

const currentType = computed(() => types.find(t => t.key === activeType.value)!);

function switchType(key: typeof activeType.value) {
  activeType.value = key;
  titleText.value = '';
  subtitleText.value = '';
  priceText.value = '';
  resultImage.value = null;
  clearImage();
}

function clearImage() {
  inputImage.value = null;
  resultImage.value = null;
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  inputImage.value = URL.createObjectURL(file);
  (e.target as HTMLInputElement).value = '';
}

function onDrop(e: DragEvent) {
  const f = e.dataTransfer?.files?.[0];
  if (f?.type.startsWith('image/')) inputImage.value = URL.createObjectURL(f);
}

function buildPrompt(): string {
  const title = titleText.value.trim() || currentType.value.titlePlaceholder;
  const subtitle = subtitleText.value.trim();

  // 文案严格性说明（所有类型通用）
  const textRule = `
⚠️ 文字规则（必须严格遵守）：
- 主标题必须一字不差显示为：「${title}」，绝对不能修改、不能翻译、不能替换任何字
- 副标题必须一字不差显示为：「${subtitle || '（无副标题）'}」
- 禁止在海报上添加任何用户未填写的额外文字
- 禁止对用户提供的文字进行任何形式的改写或联想替换`;

  if (activeType.value === 'referral') {
    return `请根据提供的微信聊天截图生成一张朋友圈营销海报。

【视觉风格】暗调艺术感背景（暗金/深棕/黑色渐变），聊天截图放在画面中部（加白框或手机边框装饰），文字大气醒目
【排版】主标题放画面下方大字，副标题在其下方小字
【整体感觉】温暖有力量感，适合朋友圈传播，参考小红书营销海报风格
${textRule}`;
  }

  if (activeType.value === 'team') {
    return `请根据提供的图片生成一张团队展示营销海报。

【视觉风格】温暖大地色调（暖棕/深金/墨绿），聊天截图或团队照片作为主体，背景可用自然风光虚化，有行楷或手写感英文装饰字
【整体感觉】充满团队凝聚力，励志氛围，适合吸引创业/副业人群
${textRule}`;
  }

  // product
  const price = priceText.value.trim();
  const styleDesc = productStyle.value === 'hard'
    ? '硬广风格：大字标题、撞色背景（蓝/绿/红）、价格标签突出、促销感强烈'
    : '软广风格：干净浅色背景、产品精致陈列、文字优雅、生活质感';
  return `请根据提供的产品图生成一张朋友圈营销海报。

【视觉风格】${styleDesc}
【价格信息】${price ? `用色块/标签突出显示：「${price}」` : '无价格信息'}
【整体感觉】产品图保持清晰完整，构图专业，适合朋友圈/社群分享
${textRule}`;
}

async function generate() {
  if (!inputImage.value) return;
  const cost = 10;
  if (auth.points < cost) {
    message.warning(`积分不足，当前剩余 ${auth.points} 积分`);
    return;
  }
  if (!auth.deductPoints(cost, `营销海报生成·${currentType.value.label}`)) return;

  isGenerating.value = true;
  resultImage.value = null;

  try {
    const prompt = buildPrompt();
    const res = await geminiService.generateImage(prompt, [inputImage.value], { aspectRatio: aspectRatio.value });
    if (res.startsWith('data:image')) {
      resultImage.value = res;
      message.success('海报生成成功！');
    } else {
      auth.refundPoints(cost, '生成失败退款', Date.now().toString());
      message.error('生成失败，积分已退还，请重试');
    }
  } catch (e) {
    auth.refundPoints(cost, '生成失败退款', Date.now().toString());
    message.error('生成失败，积分已退还，请稍后重试');
  } finally {
    isGenerating.value = false;
  }
}
</script>

<style scoped lang="scss">
@import './tool-page-common.scss';

.type-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.type-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #6b7280;
  transition: all 0.2s;

  .type-emoji { font-size: 20px; }

  &.active {
    border-color: #2563eb;
    background: #eff6ff;
    color: #2563eb;
    font-weight: 600;
  }

  &:hover:not(.active) { border-color: #93c5fd; background: #f9fafb; }
}

.guide-box {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 14px 16px;

  .guide-title {
    font-size: 13px;
    font-weight: 600;
    color: #92400e;
    margin-bottom: 8px;
  }

  .guide-list {
    margin: 0;
    padding-left: 16px;
    li {
      font-size: 13px;
      color: #78350f;
      line-height: 1.8;
    }
  }
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .field-label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  }

  .field-input {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
    &:focus { border-color: #2563eb; }
  }
}

.style-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .style-btn {
    padding: 7px 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #fff;
    font-size: 13px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;

    &.active {
      border-color: #2563eb;
      background: #eff6ff;
      color: #2563eb;
      font-weight: 500;
    }

    &:hover:not(.active) { background: #f3f4f6; }
  }
}

.download-btn {
  display: inline-flex;
  align-items: center;
  margin-top: 12px;
  padding: 8px 20px;
  background: #10b981;
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
  text-decoration: none;
  &:hover { background: #059669; }
}
</style>
