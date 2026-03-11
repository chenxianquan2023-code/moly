<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal-card">
      <button class="close-btn" aria-label="关闭" @click="$emit('close')">
        <CloseOutlined />
      </button>
      <h2 class="modal-title">上传{{ uploadLabel }}</h2>

      <div class="tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'product' }"
          @click="activeTab = 'product'"
        >
          上传商品图
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'model' }"
          @click="activeTab = 'model'"
        >
          上传模特图
        </button>
      </div>

      <div
        class="drop-zone"
        :class="{ 'has-image': previewUrl, dragging }"
        @click="!previewUrl && fileInput?.click()"
        @drop.prevent="onDrop"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
      >
        <button
          type="button"
          class="qr-trigger-btn"
          title="手机扫码上传"
          @click.stop="openQrModal"
        >
          <QrcodeOutlined class="qr-icon" />
          <span class="qr-trigger-text">扫码上传</span>
          <span class="new-badge">New</span>
        </button>
        <img v-if="previewUrl" :src="previewUrl" class="preview-img" alt="预览" />
        <template v-else>
          <p class="drop-text">可拖拽图片到这里，或点击上传</p>
        </template>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden-input"
        @change="onFileChange"
      />

      <div class="upload-actions">
        <button type="button" class="btn-local" @click="fileInput?.click()">
          <FolderOutlined />
          本地上传
        </button>
      </div>

      <!-- 扫码上传弹窗 -->
      <div v-if="showQrModal" class="qr-modal-mask" @click.self="closeQrModal">
        <div class="qr-modal">
          <button class="qr-modal-close" aria-label="关闭" @click="closeQrModal">
            <CloseOutlined />
          </button>
          <h3 class="qr-modal-title">手机扫码上传</h3>
          <p class="qr-modal-hint">使用手机相机扫描二维码，选择图片后自动同步</p>
          <div class="qr-modal-canvas">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="扫码" class="qr-modal-img" />
          </div>
        </div>
      </div>

      <div class="samples">
        <p class="samples-title">或试试样片</p>
        <div class="samples-list">
          <button
            v-for="(s, i) in sampleList"
            :key="i"
            class="sample-item"
            @click="useSample(s.url)"
          >
            <img :src="s.url" :alt="s.label" class="sample-img" />
            <span class="sample-label">示例图</span>
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancel" @click="$emit('close')">取消</button>
        <button
          type="button"
          class="btn-confirm"
          :disabled="!previewUrl"
          @click="confirm"
        >
          确定
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { CloseOutlined, FolderOutlined, QrcodeOutlined } from '@ant-design/icons-vue';
import QRCode from 'qrcode';

const props = withDefaults(
  defineProps<{
    /** 当前上传类型，用于决定默认 tab 和样片 */
    uploadType?: 'model' | 'garment';
  }>(),
  { uploadType: 'garment' }
);

const emit = defineEmits<{
  close: [];
  confirm: [imageUrl: string];
}>();

const activeTab = ref<'product' | 'model'>(props.uploadType === 'model' ? 'model' : 'product');
const previewUrl = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const showQrModal = ref(false);
const qrDataUrl = ref('');
let ws: WebSocket | null = null;

const uploadLabel = computed(() => (activeTab.value === 'model' ? '模特图' : '商品图'));

const sampleList = computed(() => {
  if (activeTab.value === 'model') {
    return [
      {
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
        label: '示例模特',
      },
    ];
  }
  return [
    {
      url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=400&auto=format&fit=crop',
      label: '示例服装',
    },
    {
      url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=400&auto=format&fit=crop',
      label: '示例包',
    },
    {
      url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=400&auto=format&fit=crop',
      label: '示例椅',
    },
  ];
});

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file && file.type.startsWith('image/')) {
    previewUrl.value = URL.createObjectURL(file);
  }
  input.value = '';
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    previewUrl.value = URL.createObjectURL(file);
  }
}

function useSample(url: string) {
  previewUrl.value = url;
}

function confirm() {
  if (previewUrl.value) {
    emit('confirm', previewUrl.value);
    emit('close');
  }
}

watch(activeTab, () => {
  previewUrl.value = '';
});

async function openQrModal() {
  showQrModal.value = true;
  qrDataUrl.value = '';
  try {
    const res = await fetch('/api/upload/create-token');
    const { token } = await res.json();
    if (!token) throw new Error('获取上传 token 失败');
    const mobileUrl = `${window.location.origin}/mobile-upload?token=${token}`;
    qrDataUrl.value = await QRCode.toDataURL(mobileUrl, { width: 200, margin: 2 });
    const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${wsProto}//${location.host}/api/ws/upload?token=${token}`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'upload_complete' && data.url) {
          const imgUrl = `${window.location.origin}${data.url}`;
          previewUrl.value = imgUrl;
          closeQrModal();
        }
      } catch (_) {}
    };
    ws.onerror = () => closeQrModal();
  } catch (e) {
    console.error('openQrModal:', e);
  }
}

function closeQrModal() {
  showQrModal.value = false;
  if (ws) {
    ws.close();
    ws = null;
  }
}

onUnmounted(closeQrModal);
</script>

<style scoped lang="scss">
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-card {
  position: relative;
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 24px 28px;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f5f5f5;
    color: #1a1a1a;
  }
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 20px 0;
}

.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;

  .tab {
    padding: 10px 16px;
    border: none;
    background: none;
    font-size: 14px;
    color: #666;
    cursor: pointer;

    &.active {
      color: #1677ff;
      font-weight: 600;
      border-bottom: 2px solid #1677ff;
      margin-bottom: -1px;
    }
  }
}

.drop-zone {
  position: relative;
  min-height: 200px;
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 16px;
  overflow: hidden;
  transition: border-color 0.2s, background 0.2s;

  .qr-trigger-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    font-size: 13px;
    color: #666;
    cursor: pointer;
    z-index: 2;
    transition: border-color 0.2s, color 0.2s;

    &:hover {
      border-color: #1677ff;
      color: #1677ff;
    }

    .qr-icon {
      font-size: 16px;
    }

    .qr-trigger-text {
      font-size: 12px;
    }

    .new-badge {
      padding: 1px 5px;
      background: #1677ff;
      color: #fff;
      font-size: 10px;
      font-weight: 600;
      border-radius: 4px;
    }
  }

  &.dragging,
  &:hover:not(.has-image) {
    border-color: #1677ff;
    background: #f0f7ff;
  }

  &.has-image {
    border-style: solid;
    border-color: #e5e5e5;
  }

  .drop-text {
    margin: 0;
    font-size: 14px;
    color: #666;
  }

  .preview-img {
    max-width: 100%;
    max-height: 280px;
    object-fit: contain;
  }
}

.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.upload-actions {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 20px;

  .btn-local {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 20px;
    background: #1a1a1a;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.9;
    }
  }

}

.qr-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.qr-modal {
  position: relative;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.qr-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f5f5f5;
  }
}

.qr-modal-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1a1a1a;
}

.qr-modal-hint {
  font-size: 13px;
  color: #666;
  margin: 0 0 20px 0;
}

.qr-modal-canvas {
  padding: 16px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  display: inline-block;
}

.qr-modal-img {
  display: block;
  width: 200px;
  height: 200px;
}

.samples {
  .samples-title {
    font-size: 13px;
    color: #666;
    margin: 0 0 10px 0;
  }

  .samples-list {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .sample-item {
    width: 80px;
    padding: 0;
    border: 1px solid #eee;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:hover {
      border-color: #1677ff;
      box-shadow: 0 2px 8px rgba(22, 119, 255, 0.2);
    }
  }

  .sample-img {
    display: block;
    width: 100%;
    height: 80px;
    object-fit: cover;
  }

  .sample-label {
    display: block;
    font-size: 11px;
    color: #999;
    text-align: center;
    padding: 4px 0;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;

  .btn-cancel {
    height: 36px;
    padding: 0 20px;
    border: 1px solid #d9d9d9;
    background: #fff;
    color: #666;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;

    &:hover {
      border-color: #1677ff;
      color: #1677ff;
    }
  }

  .btn-confirm {
    height: 36px;
    padding: 0 20px;
    background: #1a1a1a;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
