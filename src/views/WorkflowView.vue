<template>
  <div class="workflow-page">
    <!-- Header -->
    <header class="workflow-header">
      <div class="header-left">
        <div class="breadcrumb">
          <router-link to="/workbench" class="crumb-parent">工作流</router-link>
          <RightOutlined class="crumb-icon" />
          <span class="crumb-current">AI 电商虚拟试穿</span>
        </div>
      </div>
      <div class="header-right">
        <div class="points-wrap">
          <ThunderboltFilled class="points-icon" />
          <span class="points-value">{{ auth.points }}</span>
          <span class="points-label">积分</span>
          <router-link to="/recharge" class="recharge-link">充值</router-link>
        </div>
        <div class="status-badge">
          <span class="status-dot"></span>
          节点引擎就绪
        </div>
        <div class="user-wrap">
          <span class="user-name">{{ auth.displayName }}</span>
          <button class="logout-btn" @click="handleLogout">退出</button>
        </div>
      </div>
    </header>

    <!-- 上传图片弹窗（参考 Pic Copilot） -->
    <UploadImageModal
      v-if="showUploadModal"
      :upload-type="uploadModalType"
      @close="showUploadModal = false"
      @confirm="onUploadConfirm"
    />

    <!-- Main Content -->
    <div class="workflow-body">
      <!-- Left Panel: Input -->
      <aside class="input-panel">
        <!-- Model Upload -->
        <div class="input-section">
          <div class="section-header">
            <span class="section-title">1. 模特图输入</span>
          </div>
          <div 
            class="upload-area" 
            :class="{ 'has-image': inputs.model }"
            @click="!inputs.model && openUploadModal('model')"
          >
            <img v-if="inputs.model" :src="inputs.model" class="preview-img" />
            <div v-if="inputs.model" class="image-overlay">
              <button class="delete-btn" @click.stop="clearImage('model')" title="删除图片">
                <CloseOutlined />
              </button>
              <button class="replace-btn" @click.stop="openUploadModal('model')" title="更换图片">
                <ReloadOutlined />
              </button>
            </div>
            <div v-else class="upload-placeholder">
              <PlusOutlined class="upload-icon" />
              <span class="upload-text">点击上传模特</span>
            </div>
          </div>
          <input 
            type="file" 
            ref="modelInputRef" 
            class="hidden-input" 
            accept="image/*"
            @change="(e) => handleFileChange(e, 'model')"
          />
          <div class="panel-actions">
            <button class="demo-btn" @click="useDemoImage('model')">使用示例图片</button>
            <button class="demo-btn" @click="modelInputRef?.click()">本地上传</button>
          </div>
        </div>

        <!-- Garment Upload -->
        <div class="input-section">
          <div class="section-header">
            <span class="section-title">2. 服装图输入</span>
          </div>
          <div 
            class="upload-area" 
            :class="{ 'has-image': inputs.garment }"
            @click="!inputs.garment && openUploadModal('garment')"
          >
            <img v-if="inputs.garment" :src="inputs.garment" class="preview-img garment" />
            <div v-if="inputs.garment" class="image-overlay">
              <button class="delete-btn" @click.stop="clearImage('garment')" title="删除图片">
                <CloseOutlined />
              </button>
              <button class="replace-btn" @click.stop="openUploadModal('garment')" title="更换图片">
                <ReloadOutlined />
              </button>
            </div>
            <div v-else class="upload-placeholder">
              <SkinOutlined class="upload-icon" />
              <span class="upload-text">点击上传服装</span>
            </div>
          </div>
          <input 
            type="file" 
            ref="garmentInputRef" 
            class="hidden-input" 
            accept="image/*"
            @change="(e) => handleFileChange(e, 'garment')"
          />
          <div class="panel-actions">
            <button class="demo-btn" @click="useDemoImage('garment')">使用示例图片</button>
            <button class="demo-btn" @click="garmentInputRef?.click()">本地上传</button>
          </div>
        </div>
      </aside>

      <!-- Center: Canvas (Vue Flow) -->
      <main class="canvas-area">
        <!-- Zoom Controls -->
        <div class="zoom-controls">
          <button class="zoom-btn" @click="fitView" title="适应屏幕">
            <ExpandOutlined />
          </button>
          <div class="zoom-divider"></div>
          <button class="zoom-btn" @click="() => zoomOut()">
            <MinusOutlined />
          </button>
          <span class="zoom-level">{{ Math.round(viewport.zoom * 100) }}%</span>
          <button class="zoom-btn" @click="() => zoomIn()">
            <PlusOutlined />
          </button>
        </div>

        <VueFlow
          :nodes="nodes"
          :edges="edges"
          :default-viewport="{ x: 0, y: 0, zoom: 1 }"
          :min-zoom="0.2"
          :max-zoom="3"
          :snap-to-grid="false"
          :snap-grid="[24, 24]"
          :nodes-draggable="true"
          :pan-on-drag="true"
          :zoom-on-scroll="true"
          class="workflow-flow"
          @viewport-change="onViewportChange"
        >
          <!-- 自定义节点 -->
          <template #node-image="nodeProps">
            <ImageNode v-bind="nodeProps" />
          </template>
          <template #node-text="nodeProps">
            <TextNode v-bind="nodeProps" @content-change="onTextNodeContentChange" />
          </template>

          <!-- 背景网格 -->
          <Background :gap="24" :size="1" pattern-color="#D1D5DB" />
        </VueFlow>
      </main>

      <!-- Right Panel: Config -->
      <aside class="config-panel">
        <div class="config-header">
          <h2 class="config-title">生成配置</h2>
          <p class="config-subtitle">配置 Moly 融合参数</p>
        </div>

        <div class="config-body">
          <!-- 动作描述 -->
          <div class="config-field">
            <label class="field-label">模特动作描述</label>
            <textarea 
              v-model="configActionText" 
              @input="onActionTextChange"
              class="config-textarea"
              placeholder="描述您希望的模特动作，如：潇洒自信，眼神凝视镜头"
              rows="2"
            ></textarea>
          </div>

          <!-- 分组：图片设置 -->
          <div class="config-group">
            <div class="group-title">图片设置</div>
            
            <!-- 图片比例 -->
            <div class="config-field">
              <label class="field-label">图片比例</label>
              <div class="select-wrapper">
                <select v-model="configAspectRatio" class="config-select">
                  <option value="1:1">1:1 正方形</option>
                  <option value="3:4">3:4 竖版</option>
                  <option value="4:3">4:3 横版</option>
                  <option value="16:9">16:9 宽屏</option>
                  <option value="9:16">9:16 手机竖屏</option>
                </select>
              </div>
            </div>

            <!-- 图片质量 -->
            <div class="config-field">
              <label class="field-label">图片质量</label>
              <div class="select-wrapper">
                <select v-model="configImageSize" class="config-select">
                  <option value="1K">1K 标准</option>
                  <option value="2K">2K 高清</option>
                  <option value="4K">4K 超清</option>
                </select>
              </div>
            </div>

            <!-- 创意程度滑块 -->
            <div class="config-field">
              <label class="field-label">创意程度: {{ configTemperature.toFixed(1) }}</label>
              <input 
                type="range" 
                v-model.number="configTemperature" 
                min="0.1" 
                max="1.5" 
                step="0.1" 
                class="config-slider"
              />
              <div class="slider-labels">
                <span>稳定</span>
                <span>创意</span>
              </div>
            </div>
          </div>

          <!-- 分组：摄影风格 -->
          <div class="config-group">
            <div class="group-title">摄影风格</div>
            
            <!-- 摄影风格 -->
            <div class="config-field">
              <label class="field-label">风格类型</label>
              <div class="select-wrapper">
                <select v-model="configPhotoStyle" @change="updateGeneratedPrompt" class="config-select">
                  <option value="realistic">写实摄影</option>
                  <option value="fashion">时尚大片</option>
                  <option value="street">街拍风格</option>
                  <option value="commercial">商业广告风</option>
                </select>
              </div>
            </div>

            <!-- 镜头视角 -->
            <div class="config-field">
              <label class="field-label">镜头视角</label>
              <div class="select-wrapper">
                <select v-model="configLensView" @change="updateGeneratedPrompt" class="config-select">
                  <option value="closeup">特写</option>
                  <option value="half">半身</option>
                  <option value="full">全身</option>
                  <option value="distant">远景</option>
                </select>
              </div>
            </div>

            <!-- 拍摄角度 -->
            <div class="config-field">
              <label class="field-label">拍摄角度</label>
              <div class="select-wrapper">
                <select v-model="configCameraAngle" @change="updateGeneratedPrompt" class="config-select">
                  <option value="eye">平视</option>
                  <option value="high">俯拍</option>
                  <option value="low">仰拍</option>
                  <option value="45deg">45度角</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 分组：背景设置 -->
          <div class="config-group">
            <div class="group-title">背景设置</div>
            
            <!-- 背景类型 -->
            <div class="config-field">
              <label class="field-label">背景类型</label>
              <div class="select-wrapper">
                <select v-model="configBgType" @change="updateGeneratedPrompt" class="config-select">
                  <option value="original">保持原背景</option>
                  <option value="solid">纯色背景</option>
                  <option value="indoor">室内场景</option>
                  <option value="outdoor">户外街道</option>
                  <option value="nature">自然风景</option>
                </select>
              </div>
            </div>

            <!-- 背景模糊 -->
            <div class="config-field">
              <label class="field-label">背景模糊</label>
              <div class="select-wrapper">
                <select v-model="configBgBlur" @change="updateGeneratedPrompt" class="config-select">
                  <option value="none">清晰背景</option>
                  <option value="light">轻微虚化</option>
                  <option value="heavy">大光圈虚化</option>
                </select>
              </div>
            </div>



            <!-- 光影增强开关 -->
            <div class="config-toggle" @click="toggleConfig('lighting')">
              <div class="toggle-info">
                <span class="toggle-label">光影增强</span>
                <span class="toggle-desc">Lighting Match</span>
              </div>
              <div class="toggle-switch" :class="{ active: configLighting }">
                <div class="toggle-knob"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="config-footer">
          <div class="cost-info">
            <span>预估消耗</span>
            <span class="cost-value">
              <ThunderboltFilled class="cost-icon" /> {{ GENERATION_COST }} 积分
            </span>
          </div>
          <button 
            class="generate-btn" 
            :class="{ disabled: isGenerating || !inputs.model || !inputs.garment || !isGeneratedReady }"
            :disabled="isGenerating || !inputs.model || !inputs.garment || !isGeneratedReady"
            @click="startGeneration"
          >
            <template v-if="!isGenerating">
              <ExperimentOutlined class="btn-icon" />
              <span>生成虚拟试穿</span>
            </template>
            <template v-else>
              <LoadingOutlined class="btn-icon spinning" />
              <span>正在融合...</span>
            </template>
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { 
  RightOutlined, 
  PlusOutlined, 
  SkinOutlined, 
  ExpandOutlined, 
  MinusOutlined,
  ThunderboltFilled,
  ExperimentOutlined,
  LoadingOutlined,
  CloseOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import type { Node, Edge } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

import ImageNode from '@/components/workflow/nodes/ImageNode.vue';
import TextNode from '@/components/workflow/nodes/TextNode.vue';
import UploadImageModal from '@/components/upload/UploadImageModal.vue';
import { tryOnService } from '@/services/tryOn.service';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';

// Vue Flow
const { fitView: vueFlowFitView, zoomIn, zoomOut, updateNodeData, findNode } = useVueFlow();
const viewport = ref({ x: 0, y: 0, zoom: 1 });

const onViewportChange = (vp: { x: number; y: number; zoom: number }) => {
  viewport.value = vp;
};

const fitView = () => {
  vueFlowFitView({ padding: 0.2 });
};

const auth = useAuthStore();

// Refs
const modelInputRef = ref<HTMLInputElement | null>(null);
const garmentInputRef = ref<HTMLInputElement | null>(null);

// 上传弹窗（参考 Pic Copilot：本地上传 + 扫码上传 + 样片）
const showUploadModal = ref(false);
const uploadModalType = ref<'model' | 'garment'>('model');
function openUploadModal(type: 'model' | 'garment') {
  uploadModalType.value = type;
  showUploadModal.value = true;
}
async function onUploadConfirm(imageUrl: string) {
  const type = uploadModalType.value;
  inputs[type] = imageUrl;
  updateNodeImage(type, imageUrl);
  await triggerAnalysisIfReady();
}
function handleLogout() {
  auth.logout();
  window.location.href = '/';
}

// State
const inputs = reactive({ model: null as string | null, garment: null as string | null });
const isGenerating = ref(false);
const generationStatus = ref('');

// Analysis State - auto-populated by AI
const modelDesc = ref('');
const garmentDesc = ref('');
const isAnalyzing = ref(false);          // Loading state for generated node
const isGeneratedReady = ref(false);     // True when prompt is ready

// Config - 动作描述
const configActionText = ref('潇洒自信，眼神凝视镜头');
const configLighting = ref(false);

// Config - API 参数
const configAspectRatio = ref('3:4');
const configImageSize = ref('2K');
const configTemperature = ref(0.7);

// Config - 提示词参数
const configPhotoStyle = ref('realistic');      // 摄影风格
const configLensView = ref('half');             // 镜头视角
const configCameraAngle = ref('eye');           // 拍摄角度
const configBgType = ref('original');           // 背景类型
const configBgBlur = ref('none');               // 背景模糊

// Toggle config
const toggleConfig = (key: string) => {
  if (key === 'lighting') configLighting.value = !configLighting.value;
  updateConfigNode();
};

// Config text for display
const getConfigText = () => {
  const lighting = configLighting.value ? 'YES' : 'NO';
  return `配置参数:\n• 光影增强: ${lighting}\n• 权重: 1.0`;
};

// 配置选项映射表
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

// Construct the generated prompt template
const updateGeneratedPrompt = () => {
  const actionText = configActionText.value.trim() || '自然站立';
  
  const mDesc = modelDesc.value || '等待上传模特图...';
  const gDesc = garmentDesc.value || '等待上传服装图...';
  
  // 构建风格描述
  const styleDesc = styleLabels[configPhotoStyle.value] || '写实摄影风格';
  const lensDesc = lensLabels[configLensView.value] || '半身照';
  const angleDesc = angleLabels[configCameraAngle.value] || '平视角度';
  const bgDesc = bgTypeLabels[configBgType.value] || '保持原背景';
  const blurDesc = configBgBlur.value !== 'none' ? `，${bgBlurLabels[configBgBlur.value]}` : '';
  const lightingDesc = configLighting.value ? '，光影增强' : '';
  
  const prompt = `请生成一张${styleDesc}的虚拟试穿效果图：

【任务】让人物A（${mDesc}）以动作C（${actionText}）穿上衣服B（${gDesc}）

【要求】
1. 保证衣服B和原图100%一致
2. 保持人物外貌特征不变
3. ${bgDesc}${blurDesc}

【拍摄参数】${lensDesc}，${angleDesc}${lightingDesc}`;
  
  updateNodeData('generated', { content: prompt });
};

// Handle action text change in config panel - update generated prompt in real-time
const onActionTextChange = () => {
  updateGeneratedPrompt();
};

// Handle text node content change (legacy, keeping for potential future use)
const onTextNodeContentChange = (_nodeId: string, _content: string) => {
  // No longer needed since action is in config panel
};

// Nodes
const nodes = ref<Node[]>([
  {
    id: 'model',
    type: 'image',
    position: { x: 50, y: 220 },
    data: { title: '上传模特图', imageUrl: null }
  },
  {
    id: 'garment',
    type: 'image',
    position: { x: 50, y: 580 },
    data: { title: '上传衣服图（只有衣服）', imageUrl: null }
  },
  {
    id: 'generated',
    type: 'text',
    position: { x: 380, y: 20 },
    data: {
      title: '已设定好',
      content: '请上传模特图和服装图...',
      editable: false,
      tall: true
    }
  },
  {
    id: 'result',
    type: 'image',
    position: { x: 700, y: 380 },
    data: { title: '成果图', imageUrl: null }
  }
]);

// Edges - matching reference layout
const edges = ref<Edge[]>([

  { id: 'e2', source: 'model', target: 'generated', style: { stroke: '#93C5FD', strokeWidth: 3 }, type: 'default' },
  { id: 'e3', source: 'model', target: 'result', style: { stroke: '#93C5FD', strokeWidth: 3 }, type: 'default' },
  { id: 'e4', source: 'garment', target: 'generated', style: { stroke: '#93C5FD', strokeWidth: 3 }, type: 'default' },
  { id: 'e5', source: 'garment', target: 'result', style: { stroke: '#93C5FD', strokeWidth: 3 }, type: 'default' },
  { id: 'e6', source: 'generated', target: 'result', style: { stroke: '#93C5FD', strokeWidth: 3 }, type: 'default' }
]);

// File upload handlers（保留隐藏 input 以兼容直接选择文件）
const handleFileChange = async (e: Event, type: string) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  inputs[type as keyof typeof inputs] = url;
  updateNodeImage(type, url);
  
  // Check if both images are now uploaded, then trigger combined analysis
  await triggerAnalysisIfReady();
};

// Clear image handler
const clearImage = (type: string) => {
  inputs[type as keyof typeof inputs] = null;
  updateNodeImage(type, '');
  // Reset analysis state if image is cleared
  isGeneratedReady.value = false;
  if (type === 'model') {
    modelDesc.value = '';
  } else {
    garmentDesc.value = '';
  }
  updateGeneratedPrompt();
};

const useDemoImage = async (type: string) => {
  const url = type === 'model'
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop'
    : 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop';
  inputs[type as keyof typeof inputs] = url;
  updateNodeImage(type, url);
  
  // Check if both images are now uploaded, then trigger combined analysis
  await triggerAnalysisIfReady();
};

// Combined analysis - only triggered when both images are present
const triggerAnalysisIfReady = async () => {
  // Only proceed if both images are uploaded
  if (!inputs.model || !inputs.garment) {
    updateGeneratedPrompt();
    return;
  }
  
  // Reset state and show loading
  isGeneratedReady.value = false;
  isAnalyzing.value = true;
  updateNodeData('generated', { loading: true });
  updateGeneratedPrompt();
  
  try {
    // 单次 API 调用同时分析两张图片
    const analysisResult = await tryOnService.analyzeBothImages(inputs.model, inputs.garment);
    
    // 解析结果（格式："图1...；图2..."）
    const parts = analysisResult.split('；');
    if (parts.length >= 2) {
      modelDesc.value = parts[0]?.trim() || '';
      garmentDesc.value = parts[1]?.trim() || '';
    } else {
      // 如果格式不符合预期，直接使用整个结果
      modelDesc.value = analysisResult.trim();
      garmentDesc.value = '';
    }
  } catch (err) {
    console.error('Analysis failed:', err);
    modelDesc.value = '图1人物';
    garmentDesc.value = '图2服装';
  } finally {
    isAnalyzing.value = false;
    updateNodeData('generated', { loading: false });
    updateGeneratedPrompt();
    isGeneratedReady.value = true;
  }
};

// Update node image
const updateNodeImage = (nodeId: string, imageUrl: string) => {
  updateNodeData(nodeId, { imageUrl });
};

// Update config node
const updateConfigNode = () => {
  updateNodeData('process', { content: getConfigText() });
  updateGeneratedPrompt(); // Also refresh generated prompt when action changes
};

// 单次生成消耗积分
const GENERATION_COST = 3;

// Generate - use the generated prompt node content，消耗积分
const startGeneration = async () => {
  if (!inputs.model || !inputs.garment) return;
  if (auth.points < GENERATION_COST) {
    message.warning(`积分不足，当前剩余 ${auth.points} 积分，生成需消耗 ${GENERATION_COST} 积分`);
    return;
  }
  if (!auth.deductPoints(GENERATION_COST)) {
    message.warning('积分不足，请先充值');
    return;
  }
  
  isGenerating.value = true;
  generationStatus.value = '准备中...';
  
  // Show loading animation on result node
  updateNodeData('result', { loading: true, imageUrl: null });

  // Get the final prompt from the generated node
  const generatedNode = findNode('generated');
  const finalPrompt = generatedNode?.data.content || '';

  try {
    const resultImage = await tryOnService.generateByCustomPrompt(
      finalPrompt,
      inputs.model,
      inputs.garment,
      {
        aspectRatio: configAspectRatio.value,
        imageSize: configImageSize.value,
        temperature: configTemperature.value,
      }
    );

    if (resultImage.startsWith('data:image')) {
      updateNodeData('result', { imageUrl: resultImage, loading: false });
      message.success('虚拟试穿图生成成功！');
    } else {
      updateNodeData('result', { loading: false });
      message.error('模型未返回图片');
      console.error('[Generation] Text response:', resultImage);
    }
  } catch (error) {
    console.error('[Generation] Error:', error);
    updateNodeData('result', { loading: false });
    message.error('生成过程中出现错误，请稍后重试');
  } finally {
    isGenerating.value = false;
    generationStatus.value = '';
  }
};
</script>

<style scoped lang="scss">
.workflow-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F9FAFB;
  color: #111827;
  overflow: hidden;
  user-select: none;
}

// Header - 浅色
.workflow-header {
  height: 56px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  z-index: 50;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .logo {
      display: flex;
      align-items: center;
      height: 100%;
    }

    .logo-img {
      height: 32px;
      width: auto;
      max-width: 100px;
      object-fit: contain;
    }

    .divider {
      width: 1px;
      height: 16px;
      background: #e5e7eb;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;

      .crumb-parent { color: #6b7280; text-decoration: none; &:hover { color: #374151; } }
      .crumb-icon { font-size: 10px; color: #6b7280; }
      .crumb-current { color: #111827; }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;

    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #6b7280;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      padding: 6px 12px;
      border-radius: 9999px;

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #22c55e;
        animation: pulse 2s infinite;
      }
    }

    .points-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #374151;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 6px 12px;
      border-radius: 8px;
      .points-icon { color: #f59e0b; font-size: 14px; }
      .points-value { font-weight: 600; }
      .points-label { color: #6b7280; }
      .recharge-link { margin-left: 6px; color: #2563eb; text-decoration: none; font-size: 12px; }
      .recharge-link:hover { text-decoration: underline; }
    }
    .user-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      .user-name { font-size: 13px; color: #6b7280; max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
      .logout-btn {
        font-size: 12px; color: #6b7280; background: transparent; border: 1px solid #d1d5db;
        padding: 4px 10px; border-radius: 6px; cursor: pointer;
      }
      .logout-btn:hover { color: #111827; border-color: #9ca3af; }
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// Body
.workflow-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// Left Panel - 浅色
.input-panel {
  width: 320px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  flex-shrink: 0;
  z-index: 20;

  .input-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .section-title {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }

  .upload-area {
    height: 192px;
    border-radius: 12px;
    border: 1px dashed #d1d5db;
    background: #f9fafb;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.2s;
    position: relative;

    &:hover {
      border-color: #2563eb;
      background: #eff6ff;
    }

    &.has-image {
      border-style: solid;
      border-color: #e5e7eb;
    }

    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;

      &.garment {
        object-fit: contain;
        padding: 8px;
      }
    }

    // 悬停遮罩层
    .image-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .image-overlay {
      opacity: 1;
    }

    .delete-btn, .replace-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all 0.2s;
    }

    .delete-btn {
      background: rgba(239, 68, 68, 0.9);
      color: #fff;

      &:hover {
        background: #ef4444;
        transform: scale(1.1);
      }
    }

    .replace-btn {
      background: rgba(59, 130, 246, 0.9);
      color: #fff;

      &:hover {
        background: #3b82f6;
        transform: scale(1.1);
      }
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: #6b7280;

      .upload-icon {
        font-size: 24px;
        transition: color 0.2s;
      }

      .upload-text {
        font-size: 12px;
      }
    }

    &:hover .upload-icon {
      color: #60a5fa;
    }
  }

  .hidden-input {
    display: none;
  }

  .panel-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .demo-btn {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    color: #4b5563;
    font-size: 12px;
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;

    &:hover {
      color: #111827;
      border-color: #2563eb;
    }
  }
}

// Canvas
.canvas-area {
  flex: 1;
  position: relative;
  background: #F3F4F6;
  overflow: hidden;

  .workflow-flow {
    width: 100%;
    height: 100%;
    background: #F9FAFB;
  }

  .zoom-controls {
    position: absolute;
    bottom: 24px;
    left: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px;
    z-index: 30;

    .zoom-btn {
      padding: 8px;
      background: transparent;
      border: none;
      color: #6b7280;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: #f3f4f6;
        color: #111827;
      }
    }

    .zoom-divider {
      width: 1px;
      height: 16px;
      background: #e5e7eb;
    }

    .zoom-level {
      font-size: 12px;
      font-family: monospace;
      color: #6b7280;
      width: 40px;
      text-align: center;
    }
  }
}

// Config Panel - 浅色
.config-panel {
  width: 320px;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 20;

  .config-header {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;

    .config-title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4px 0;
    }

    .config-subtitle {
      font-size: 12px;
      color: #6b7280;
      margin: 0;
    }
  }

  .config-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
    scrollbar-width: thin;
    scrollbar-color: #d1d5db transparent;
  }

  .config-group {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .group-title {
      font-size: 12px;
      font-weight: 600;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
  }

  .config-field {
    .slider-container {
      position: relative;
      padding: 8px 0;
    }

    .config-slider {
      width: 100%;
      height: 8px;
      appearance: none;
      background: #E5E7EB;
      border-radius: 4px;
      outline: none;
      cursor: pointer;
      position: relative;
      border: 1px solid #D1D5DB;

      // 轨道背景渐变效果
      &::-webkit-slider-runnable-track {
        width: 100%;
        height: 8px;
        background: linear-gradient(
          to right,
          #3b82f6 0%,
          #8b5cf6 50%,
          #ec4899 100%
        );
        border-radius: 4px;
        opacity: 0.3;
      }

      // 滑块按钮
      &::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #60a5fa, #a78bfa);
        border-radius: 50%;
        border: 3px solid #fff;
        box-shadow: 
          0 2px 8px rgba(96, 165, 250, 0.5),
          0 0 0 4px rgba(96, 165, 250, 0.2);
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: -6px;

        &:hover {
          transform: scale(1.15);
          box-shadow: 
            0 4px 12px rgba(96, 165, 250, 0.6),
            0 0 0 6px rgba(96, 165, 250, 0.25);
        }
      }

      &::-moz-range-track {
        width: 100%;
        height: 8px;
        background: linear-gradient(
          to right,
          #3b82f6 0%,
          #8b5cf6 50%,
          #ec4899 100%
        );
        border-radius: 4px;
        opacity: 0.3;
      }

      &::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #60a5fa, #a78bfa);
        border-radius: 50%;
        border: 3px solid #fff;
        cursor: pointer;
        box-shadow: 
          0 2px 8px rgba(96, 165, 250, 0.5),
          0 0 0 4px rgba(96, 165, 250, 0.2);
      }

      // 激活状态
      &:active::-webkit-slider-thumb {
        transform: scale(1.2);
        box-shadow: 
          0 4px 16px rgba(96, 165, 250, 0.7),
          0 0 0 8px rgba(96, 165, 250, 0.3);
      }
    }

    .slider-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #6b7280;
      margin-top: 8px;
      padding: 0 2px;

      span {
        transition: color 0.2s;
        
        &:first-child {
          color: #3b82f6;
        }
        
        &:last-child {
          color: #ec4899;
        }
      }
    }

    .slider-value {
      position: absolute;
      top: -28px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: #fff;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    }

    &:hover .slider-value {
      opacity: 1;
    }
  }

  .config-field {
    .field-label {
      display: block;
      font-size: 12px;
      color: #374151;
      margin-bottom: 8px;
    }

    .config-textarea {
      width: 100%;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      color: #111827;
      resize: none;
      outline: none;
      line-height: 1.5;
      font-family: 'Inter', sans-serif;
      transition: border-color 0.2s;

      &::placeholder {
        color: #9ca3af;
      }

      &:hover, &:focus {
        border-color: #2563eb;
      }
    }

    .select-wrapper {
      position: relative;

      .config-select {
        width: 100%;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        color: #111827;
        appearance: none;
        cursor: pointer;
        outline: none;
        transition: border-color 0.2s;

        &:hover, &:focus {
          border-color: #2563eb;
        }
      }

      .select-arrow {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #6b7280;
        pointer-events: none;
      }
    }
  }

  .config-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    padding: 4px 0;

    .toggle-info {
      display: flex;
      flex-direction: column;

      .toggle-label {
        font-size: 14px;
        color: #374151;
        transition: color 0.2s;
      }

      .toggle-desc {
        font-size: 10px;
        color: #6b7280;
      }
    }

    &:hover .toggle-label {
      color: #111827;
    }

    .toggle-switch {
      width: 40px;
      height: 20px;
      border-radius: 9999px;
      background: #d1d5db;
      position: relative;
      transition: background 0.2s;

      &.active {
        background: #2563eb;
      }

      .toggle-knob {
        width: 12px;
        height: 12px;
        background: #fff;
        border-radius: 50%;
        position: absolute;
        top: 4px;
        left: 4px;
        transition: left 0.2s;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      &.active .toggle-knob {
        left: 24px;
      }
    }
  }

  .config-footer {
    padding: 20px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;

    .cost-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 12px;

      .cost-value {
        color: #b45309;
        display: flex;
        align-items: center;
        gap: 4px;

        .cost-icon {
          font-size: 14px;
        }
      }
    }

    .generate-btn {
      width: 100%;
      background: #2563eb;
      color: #fff;
      font-weight: 500;
      padding: 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);

      &:hover:not(.disabled) {
        background: #1d4ed8;
      }

      &.disabled {
        background: #e5e7eb;
        color: #9ca3af;
        cursor: not-allowed;
        box-shadow: none;
      }

      .btn-icon {
        font-size: 16px;
        transition: transform 0.2s;
      }

      &:hover:not(.disabled) .btn-icon {
        transform: scale(1.1);
      }

      .spinning {
        animation: spin 1s linear infinite;
      }
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Vue Flow 全局样式覆盖
:deep(.vue-flow__edge-path) {
  stroke: #93C5FD;
  stroke-width: 2;
}

:deep(.vue-flow__background) {
  background-color: #f9fafb;
}

// Global Node Selection Styles
:deep(.vue-flow__node.selected) {
  .image-node,
  .text-node,
  .config-node {
    border-color: #0066FF !important;
    box-shadow: 0 0 0 1px #0066FF;
  }
}
</style>
