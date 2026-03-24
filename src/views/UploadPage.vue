<template>
  <div class="upload-page">
    <div class="upload-card">
      <h1 class="title">手机扫码上传</h1>
      <p v-if="uploadToken" class="hint">选择图片后，将同步到电脑端</p>
      <p v-else class="hint">请从电脑端扫码进入此页面</p>
      <div class="drop-zone" @click="!uploading && fileInput?.click()" @drop.prevent="onDrop" @dragover.prevent>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden-input"
          @change="onFileChange"
        />
        <template v-if="uploading">
          <LoadingOutlined class="icon spin" />
          <span>上传中...</span>
        </template>
        <template v-else-if="!previewUrl">
          <PlusOutlined class="icon" />
          <span>点击或拖拽上传图片</span>
        </template>
        <template v-else>
          <img :src="previewUrl" class="preview" alt="预览" />
          <p class="success-tip">已同步到电脑端</p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons-vue';

const route = useRoute();
const uploadToken = computed(() => (route.query.token as string) || '');

const fileInput = ref<HTMLInputElement | null>(null);
const previewUrl = ref('');
const uploading = ref(false);

const apiBase = typeof window !== 'undefined' ? '' : '';

async function uploadFile(file: File) {
  if (!uploadToken.value) {
    previewUrl.value = URL.createObjectURL(file);
    return;
  }
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append('token', uploadToken.value);
    fd.append('file', file);
    const res = await fetch(`${apiBase}/api/upload`, {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    if (data.success && data.url) {
      previewUrl.value = `${window.location.origin}${apiBase}${data.url}`;
    } else {
      throw new Error(data.message || '上传失败');
    }
  } catch (e) {
    previewUrl.value = URL.createObjectURL(file);
    console.error('Upload error:', e);
  } finally {
    uploading.value = false;
  }
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file && file.type.startsWith('image/')) {
    uploadFile(file);
  }
  (e.target as HTMLInputElement).value = '';
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    uploadFile(file);
  }
}
</script>

<style scoped lang="scss">
.upload-page {
  min-height: 100vh;
  padding: 24px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  .title {
    font-size: 18px;
    margin: 0 0 8px 0;
    color: #111827;
  }

  .hint {
    font-size: 13px;
    color: #666;
    margin: 0 0 20px 0;
  }

  .drop-zone {
    min-height: 200px;
    border: 2px dashed #d9d9d9;
    border-radius: 12px;
    background: #fafafa;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    color: #666;
    font-size: 14px;

    .icon {
      font-size: 32px;

      &.spin {
        animation: spin 0.8s linear infinite;
      }
    }

    .preview {
      max-width: 100%;
      max-height: 240px;
      object-fit: contain;
    }

    .success-tip {
      margin: 0;
      font-size: 13px;
      color: #52c41a;
    }
  }

  .hidden-input {
    display: none;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
