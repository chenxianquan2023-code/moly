<template>
  <div class="history-view">
    <header class="history-header">
      <div class="header-inner">
        <h1 class="page-title">历史记录</h1>
        <div class="header-right">
          <template v-if="selectionMode">
            <span class="selected-count">已选择 {{ selectedIds.size }} 张</span>
            <button class="action-btn" @click="handleDownload">
              <DownloadOutlined /> 下载
            </button>
            <button class="action-btn" @click="openQrModal">
              <MobileOutlined /> 下载到手机
            </button>
            <button class="action-btn danger" @click="handleDelete">
              <DeleteOutlined /> 删除
            </button>
            <button class="action-btn" @click="exitSelectionMode">取消</button>
          </template>
          <template v-else>
            <button class="batch-btn" :disabled="!filteredHistory.length" @click="enterSelectionMode">
              <UnorderedListOutlined /> 批量处理
            </button>
            <span class="points"><ThunderboltFilled class="icon" /> {{ auth.points }} 积分</span>
            <router-link v-if="auth.isLoggedIn" to="/recharge" class="recharge-link">充值</router-link>
            <router-link v-else to="/login" class="login-link">登录</router-link>
          </template>
        </div>
      </div>
    </header>

    <div class="history-body">
      <aside class="sub-sidebar">
        <div class="category-header">工具分类</div>
        <nav class="sub-nav">
          <button
            v-for="t in toolFilters"
            :key="t.id + '-' + t.name"
            class="sub-nav-item"
            :class="{ active: activeToolId === t.id }"
            @click="activeToolId = t.id"
          >
            {{ t.name }}
          </button>
        </nav>
      </aside>

      <main class="history-main">
        <div v-if="filteredHistory.length" class="history-grid">
          <div
            v-for="h in filteredHistory"
            :key="h.id"
            class="history-card"
            :class="{ selectable: selectionMode, selected: selectedIds.has(h.id) }"
            @click="selectionMode ? toggleSelect(h.id) : openDetail(h)"
          >
            <div v-if="selectionMode" class="card-checkbox">
              <a-checkbox :checked="selectedIds.has(h.id)" @change.stop="toggleSelect(h.id)" />
            </div>
            <div class="card-thumb">
              <img :src="h.resultUrl" :alt="h.toolName" loading="lazy" />
            </div>
            <div class="card-info">
              <span class="card-tool">{{ h.toolName }}</span>
              <span class="card-date">{{ formatDate(h.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <HistoryOutlined />
          </div>
          <p class="empty-title">暂无历史记录</p>
          <p class="empty-desc">使用工具生成图片后，结果会保存在这里</p>
          <router-link to="/tools" class="empty-link">去使用工具</router-link>
        </div>
      </main>
    </div>

    <!-- 图片详情弹窗 -->
    <div v-if="detailItem" class="modal-mask" @click.self="detailItem = null">
      <div class="modal-card detail-modal">
        <button class="close-btn" @click="detailItem = null"><CloseOutlined /></button>
        <div class="detail-preview">
          <img :src="detailItem.resultUrl" :alt="detailItem.toolName" />
        </div>
        <div class="detail-footer">
          <span class="detail-tool">{{ detailItem.toolName }}</span>
          <span class="detail-date">{{ formatDate(detailItem.createdAt) }}</span>
          <button class="dl-btn" @click="downloadOne(detailItem)"><DownloadOutlined /> 下载</button>
        </div>
      </div>
    </div>

    <!-- 下载到手机 QR 码弹窗 -->
    <div v-if="showQrModal" class="modal-mask" @click.self="showQrModal = false">
      <div class="modal-card qr-modal">
        <button class="close-btn" @click="showQrModal = false"><CloseOutlined /></button>
        <h2 class="modal-title">下载到手机</h2>
        <p class="qr-desc">扫码在手机上查看并保存图片</p>
        <div class="qr-wrap">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="扫码下载" class="qr-img" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  ThunderboltFilled,
  DownloadOutlined,
  DeleteOutlined,
  MobileOutlined,
  UnorderedListOutlined,
  CloseOutlined,
  HistoryOutlined,
} from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { useHistoryStore, type HistoryRecord } from '@/stores/history';
import { message } from 'ant-design-vue';
import QRCode from 'qrcode';

const auth = useAuthStore();
const historyStore = useHistoryStore();

const toolFilters = [
  { id: '', name: '全部' },
  { id: 'virtual-try-on', name: 'AI模特试穿' },
  { id: 'scene-generation', name: 'AI商品场景图' },
  { id: 'face-swap', name: 'AI模特换脸' },
  { id: 'shoe-try-on', name: 'AI试鞋' },
  { id: 'hand-product', name: '手持商品图' },
  { id: 'model-bg-replace', name: '模特换背景' },
  { id: 'detail-enhance', name: 'AI细节增强' },
  { id: 'background-replace', name: 'AI背景替换' },
  { id: 'cutout-white-bg', name: '抠图白底图' },
  { id: 'upscale', name: '高清放大' },
  { id: 'ai-shadow', name: 'AI阴影生成' },
  { id: 'omni-model', name: '全能模特' },
];

const activeToolId = ref('');
const selectionMode = ref(false);
const selectedIds = ref<Set<string>>(new Set());
const showQrModal = ref(false);
const qrDataUrl = ref('');
const detailItem = ref<HistoryRecord | null>(null);

const filteredHistory = computed(() => {
  if (!activeToolId.value) return historyStore.sortedRecords;
  return historyStore.sortedRecords.filter((h) => h.toolId === activeToolId.value);
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function enterSelectionMode() {
  selectionMode.value = true;
  selectedIds.value = new Set();
}

function exitSelectionMode() {
  selectionMode.value = false;
  selectedIds.value = new Set();
}

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}

async function downloadOne(item: HistoryRecord) {
  await downloadImage(item.resultUrl, `${item.toolName}-${item.id.slice(-6)}.jpg`);
}

async function handleDownload() {
  const items = filteredHistory.value.filter((h) => selectedIds.value.has(h.id));
  for (const item of items) {
    await downloadImage(item.resultUrl, `${item.toolName}-${item.id.slice(-6)}.jpg`);
  }
  message.success(`已下载 ${items.length} 张图片`);
}

async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, '_blank');
  }
}

function handleDelete() {
  const count = selectedIds.value.size;
  historyStore.removeRecords([...selectedIds.value]);
  message.success(`已删除 ${count} 张`);
  exitSelectionMode();
}

function openDetail(h: HistoryRecord) {
  detailItem.value = h;
}

async function openQrModal() {
  showQrModal.value = true;
  const urls = filteredHistory.value
    .filter((h) => selectedIds.value.has(h.id))
    .map((h) => h.resultUrl)
    .join('\n');
  const target = urls || window.location.href;
  QRCode.toDataURL(target, { width: 180, margin: 2 })
    .then((url) => { qrDataUrl.value = url; })
    .catch(() => {});
}
</script>

<style scoped lang="scss">
.history-view {
  min-height: 100vh;
  background: #ffffff;
}

.history-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 24px;

  .header-inner {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
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
    gap: 16px;
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

  .batch-btn,
  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    font-size: 14px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .batch-btn {
    background: #2563eb;
    color: #fff;
    border: none;
    &:hover:not(:disabled) { background: #1d4ed8; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }

  .action-btn {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #e5e7eb;
    &:hover { background: #e5e7eb; }
    &.danger {
      color: #dc2626;
      border-color: #fecaca;
      &:hover { background: #fee2e2; }
    }
  }

  .selected-count {
    color: #6b7280;
    font-size: 14px;
  }
}

.history-body {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 65px);
}

.sub-sidebar {
  width: 180px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  padding: 24px 16px;

  .category-header {
    font-size: 13px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
  }

  .sub-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sub-nav-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: 10px 12px;
    font-size: 14px;
    color: #6b7280;
    background: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: #1f2937;
      background: #f3f4f6;
    }

    &.active {
      color: #2563eb;
      font-weight: 600;
      background: #eff6ff;
    }
  }
}

.history-main {
  flex: 1;
  padding: 24px 32px 80px;
  min-width: 0;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.history-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border: 2px solid transparent;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  &.selectable { cursor: default; }

  &.selected {
    border-color: #2563eb;
    background: #eff6ff;
  }

  .card-checkbox {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 2;
  }

  .card-thumb {
    aspect-ratio: 1;
    overflow: hidden;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .card-info {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .card-tool {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .card-date {
      font-size: 12px;
      color: #9ca3af;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  gap: 12px;

  .empty-icon {
    font-size: 48px;
    color: #d1d5db;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 600;
    color: #6b7280;
    margin: 0;
  }

  .empty-desc {
    font-size: 14px;
    color: #9ca3af;
    margin: 0;
  }

  .empty-link {
    margin-top: 8px;
    padding: 10px 24px;
    background: #2563eb;
    color: #fff;
    border-radius: 8px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    &:hover { background: #1d4ed8; }
  }
}

/* Modals */
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
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
  z-index: 2;

  &:hover {
    background: #f5f5f5;
    color: #1a1a1a;
  }
}

.detail-modal {
  max-width: 600px;
  width: 100%;
  padding: 0;
  overflow: hidden;

  .detail-preview {
    background: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 360px;

    img {
      max-width: 100%;
      max-height: 480px;
      object-fit: contain;
    }
  }

  .detail-footer {
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-top: 1px solid #e5e7eb;

    .detail-tool {
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }

    .detail-date {
      font-size: 13px;
      color: #9ca3af;
      flex: 1;
    }

    .dl-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      &:hover { background: #1d4ed8; }
    }
  }
}

.qr-modal {
  width: 100%;
  max-width: 340px;
  padding: 28px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.qr-desc {
  font-size: 14px;
  color: #666;
  margin: 0 0 20px 0;
}

.qr-wrap {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}

.qr-img {
  width: 180px;
  height: 180px;
  display: block;
}
</style>
