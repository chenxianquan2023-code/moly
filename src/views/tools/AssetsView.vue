<template>
  <div class="assets-view">
    <header class="assets-header">
      <div class="header-inner">
        <div class="header-left">
          <h1 class="page-title">资产库</h1>
        </div>
        <div class="header-right">
          <span class="points"><ThunderboltFilled class="icon" /> {{ auth.points }} 积分</span>
          <router-link v-if="auth.isLoggedIn" to="/recharge" class="recharge-link">充值</router-link>
          <router-link v-else to="/login" class="login-link">登录</router-link>
          <button class="action-btn mobile" @click="showMobileUploadTip">
            <MobileOutlined /> 手机上传
          </button>
          <button class="action-btn primary" @click="showUploadModal = true">
            <CloudUploadOutlined /> 上传
          </button>
        </div>
      </div>
    </header>

    <div class="assets-layout">
      <!-- 左侧目录树 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">自建目录</span>
          <button class="new-folder-btn" @click="addNewFolder">
            <PlusOutlined /> 新建
          </button>
        </div>
        <ul class="folder-tree">
          <li
            v-for="folder in folders"
            :key="folder.id"
            class="folder-item"
            :class="{ active: activeFolderId === folder.id }"
            @click="selectFolder(folder.id)"
          >
            <FolderOutlined class="folder-icon" />
            <span class="folder-name">{{ folder.name }}</span>
            <span class="folder-count">{{ folderCount(folder.id) }}</span>
          </li>
        </ul>
      </aside>

      <!-- 主内容区 -->
      <main class="assets-main">
        <p class="section-intro">管理您的图片与素材</p>

        <div
          class="upload-placeholder-area"
          :class="{ dragging: globalDragging }"
          @click="showUploadModal = true"
          @drop.prevent="onGlobalDrop"
          @dragover.prevent="globalDragging = true"
          @dragleave="globalDragging = false"
        >
          <CloudUploadOutlined class="placeholder-icon" />
          <p>点击或拖拽上传图片到资产库</p>
          <span class="hint">支持 JPG、PNG、WebP</span>
        </div>

        <div v-if="displayAssets.length" class="assets-grid">
          <div
            v-for="a in displayAssets"
            :key="a.id"
            class="asset-card"
            @mouseenter="hoveredId = a.id"
            @mouseleave="hoveredId = ''"
          >
            <div class="asset-thumb">
              <img :src="a.url" :alt="a.name" loading="lazy" />
              <div v-if="hoveredId === a.id" class="asset-actions">
                <button class="asset-action-btn" title="删除" @click.stop="removeAsset(a.id)">
                  <DeleteOutlined />
                </button>
                <a class="asset-action-btn" :href="a.url" :download="a.name" title="下载">
                  <DownloadOutlined />
                </a>
              </div>
            </div>
            <div class="asset-info">
              <span class="asset-name">{{ a.name }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon"><PictureOutlined /></div>
          <p class="empty-title">该目录暂无资产</p>
          <p class="empty-desc">点击上方区域或「上传」按钮添加图片</p>
        </div>
      </main>
    </div>

    <!-- 上传弹窗 -->
    <div v-if="showUploadModal" class="modal-mask" @click.self="closeUploadModal">
      <div class="modal-card">
        <button class="close-btn" @click="closeUploadModal"><CloseOutlined /></button>
        <h2 class="modal-title">上传资产</h2>

        <div
          class="drop-zone"
          :class="{ 'has-image': pendingPreviewUrl, dragging }"
          @click="!pendingPreviewUrl && fileInput?.click()"
          @drop.prevent="onDrop"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
        >
          <img v-if="pendingPreviewUrl" :src="pendingPreviewUrl" class="preview-img" alt="预览" />
          <template v-else>
            <CloudUploadOutlined class="drop-icon" />
            <p class="drop-text">拖拽图片到此处，或</p>
            <button type="button" class="btn-local" @click.stop="fileInput?.click()">
              <FolderOutlined /> 本地上传
            </button>
          </template>
        </div>
        <input ref="fileInput" type="file" accept="image/*" class="hidden-input" @change="onFileChange" />

        <div class="samples">
          <p class="samples-title">或试试样片</p>
          <div class="samples-list">
            <button
              v-for="(s, i) in sampleThumbnails"
              :key="i"
              class="sample-item"
              :class="{ active: pendingPreviewUrl === s.url }"
              @click="useSample(s.url)"
            >
              <img :src="s.url" :alt="s.label" class="sample-img" />
              <span class="sample-label">{{ s.label }}</span>
            </button>
          </div>
        </div>

        <div v-if="pendingPreviewUrl" class="save-section">
          <label class="save-label">保存到目录</label>
          <select v-model="saveToFolderId" class="save-select">
            <option v-for="f in folders" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="closeUploadModal">取消</button>
          <button
            type="button"
            class="btn-confirm"
            :disabled="!pendingPreviewUrl || uploading"
            @click="confirmUpload"
          >
            {{ uploading ? '上传中...' : '确认上传' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  ThunderboltFilled,
  CloudUploadOutlined,
  MobileOutlined,
  PlusOutlined,
  FolderOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PictureOutlined,
} from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { useAssetStore } from '@/stores/asset';
import { message } from 'ant-design-vue';

const auth = useAuthStore();
const assetStore = useAssetStore();

// 目录（localStorage 持久化）
const FOLDERS_KEY = 'moly_asset_folders';

interface Folder {
  id: string;
  name: string;
}

const defaultFolders: Folder[] = [
  { id: 'default', name: '默认目录' },
  { id: 'product', name: '商品图' },
  { id: 'model', name: '模特图' },
];

function loadFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    return raw ? JSON.parse(raw) : [...defaultFolders];
  } catch {
    return [...defaultFolders];
  }
}

function saveFolders(list: Folder[]) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(list));
}

const folders = ref<Folder[]>(loadFolders());
const activeFolderId = ref<string>(folders.value[0]?.id ?? 'default');

function folderCount(folderId: string): number {
  return assetStore.assets.filter((a) => a.category === folderId).length;
}

const displayAssets = computed(() => {
  if (activeFolderId.value === 'all') return assetStore.assets;
  return assetStore.assets.filter((a) => a.category === activeFolderId.value);
});

function selectFolder(id: string) {
  activeFolderId.value = id;
}

function addNewFolder() {
  const name = prompt('输入新目录名称');
  if (!name?.trim()) return;
  const id = `folder-${Date.now()}`;
  folders.value.push({ id, name: name.trim() });
  saveFolders(folders.value);
}

function removeAsset(id: string) {
  assetStore.removeAsset(id);
  message.success('已删除');
}

function showMobileUploadTip() {
  message.info('手机扫码上传功能即将开放');
}

// 上传弹窗
const showUploadModal = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const pendingPreviewUrl = ref('');
const pendingFile = ref<File | null>(null);
const saveToFolderId = ref(activeFolderId.value);
const dragging = ref(false);
const globalDragging = ref(false);
const uploading = ref(false);
const hoveredId = ref('');

const sampleThumbnails = [
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

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file && file.type.startsWith('image/')) {
    pendingFile.value = file;
    pendingPreviewUrl.value = URL.createObjectURL(file);
  }
  input.value = '';
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    pendingFile.value = file;
    pendingPreviewUrl.value = URL.createObjectURL(file);
  }
}

function onGlobalDrop(e: DragEvent) {
  globalDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    pendingFile.value = file;
    pendingPreviewUrl.value = URL.createObjectURL(file);
    saveToFolderId.value = activeFolderId.value;
    showUploadModal.value = true;
  }
}

function useSample(url: string) {
  pendingPreviewUrl.value = url;
  pendingFile.value = null;
}

function closeUploadModal() {
  if (pendingPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(pendingPreviewUrl.value);
  }
  pendingPreviewUrl.value = '';
  pendingFile.value = null;
  dragging.value = false;
  showUploadModal.value = false;
}

async function confirmUpload() {
  if (!pendingPreviewUrl.value || uploading.value) return;
  uploading.value = true;
  try {
    const folderId = saveToFolderId.value || 'default';
    if (pendingFile.value) {
      await assetStore.addAsset(pendingFile.value, 'generic', {
        name: pendingFile.value.name,
        category: folderId,
      });
    } else {
      // 样片 URL
      const label = sampleThumbnails.find((s) => s.url === pendingPreviewUrl.value)?.label || '样片';
      assetStore.addAssetFromUrl(pendingPreviewUrl.value, label, folderId);
    }
    activeFolderId.value = folderId;
    message.success('上传成功');
    closeUploadModal();
  } catch {
    message.error('上传失败，请重试');
  } finally {
    uploading.value = false;
  }
}

onMounted(() => {
  saveToFolderId.value = activeFolderId.value;
});
</script>

<style scoped lang="scss">
.assets-view {
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

.assets-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 24px;

  .header-inner {
    width: 100%;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .page-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
  }

  .points {
    color: #6b7280;
    .icon { color: #f59e0b; }
  }

  .recharge-link,
  .login-link {
    color: #2563eb;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    font-size: 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &.primary {
      background: #2563eb;
      color: #fff;
      border: none;
      &:hover { background: #1d4ed8; }
    }

    &.mobile {
      background: #fff;
      color: #374151;
      border: 1px solid #d1d5db;
      &:hover { background: #f9fafb; border-color: #9ca3af; }
    }
  }
}

.assets-layout {
  display: flex;
  width: 100%;
  min-height: calc(100vh - 65px);
}

.sidebar {
  width: 180px;
  flex-shrink: 0;
  padding: 24px 16px;
  background: #fff;
  border-right: 1px solid #e5e7eb;

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .sidebar-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .new-folder-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 500;
    color: #2563eb;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: #eff6ff; border-color: #93c5fd; }
  }

  .folder-tree {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .folder-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover { background: #f3f4f6; }

    &.active {
      background: #eff6ff;
      color: #2563eb;
      font-weight: 500;
    }

    .folder-icon {
      font-size: 15px;
      flex-shrink: 0;
    }

    .folder-name {
      font-size: 13px;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .folder-count {
      font-size: 11px;
      color: #9ca3af;
      flex-shrink: 0;
    }
  }
}

.assets-main {
  flex: 1;
  padding: 32px 24px 80px 20px;
  min-width: 0;
}

.section-intro {
  font-size: 15px;
  color: #6b7280;
  margin-bottom: 24px;
}

.upload-placeholder-area {
  min-height: 160px;
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  margin-bottom: 24px;

  &:hover,
  &.dragging {
    border-color: #2563eb;
    background: #eff6ff;
  }

  .placeholder-icon {
    font-size: 40px;
    color: #9ca3af;
  }

  p {
    font-size: 15px;
    color: #6b7280;
    margin: 0;
  }

  .hint {
    font-size: 13px;
    color: #9ca3af;
  }
}

.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.asset-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  .asset-thumb {
    aspect-ratio: 1;
    overflow: hidden;
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .asset-actions {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .asset-action-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.9);
      color: #374151;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      text-decoration: none;
      transition: background 0.2s;

      &:hover {
        background: #fff;
        color: #2563eb;
      }
    }
  }

  .asset-info {
    padding: 8px 12px;

    .asset-name {
      font-size: 13px;
      color: #374151;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.empty-state {
  padding: 60px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  .empty-icon {
    font-size: 48px;
    color: #d1d5db;
  }

  .empty-title {
    font-size: 15px;
    font-weight: 600;
    color: #6b7280;
    margin: 0;
  }

  .empty-desc {
    font-size: 13px;
    color: #9ca3af;
    margin: 0;
  }
}

/* 上传弹窗 */
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
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
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
  &:hover { background: #f5f5f5; color: #1a1a1a; }
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 20px 0;
}

.drop-zone {
  min-height: 180px;
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  margin-bottom: 20px;
  overflow: hidden;
  transition: border-color 0.2s, background 0.2s;

  &.dragging,
  &:hover:not(.has-image) {
    border-color: #2563eb;
    background: #eff6ff;
  }

  &.has-image {
    border-style: solid;
    border-color: #e5e5e5;
    padding: 16px;
  }

  .drop-icon {
    font-size: 40px;
    color: #9ca3af;
  }

  .drop-text {
    margin: 0;
    font-size: 14px;
    color: #666;
  }

  .btn-local {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 20px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    &:hover { opacity: 0.9; }
  }

  .preview-img {
    max-width: 100%;
    max-height: 200px;
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

.samples {
  margin-bottom: 20px;

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
    border: 2px solid #eee;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:hover,
    &.active {
      border-color: #2563eb;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
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

.save-section {
  margin-bottom: 20px;

  .save-label {
    display: block;
    font-size: 13px;
    color: #374151;
    margin-bottom: 8px;
  }

  .save-select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    background: #fff;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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
    &:hover { border-color: #2563eb; color: #2563eb; }
  }

  .btn-confirm {
    height: 36px;
    padding: 0 20px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    &:hover:not(:disabled) { background: #1d4ed8; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}
</style>
