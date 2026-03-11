<template>
  <div class="history-view">
    <header class="history-header">
      <div class="header-inner">
        <h1 class="page-title">历史记录</h1>
        <div class="header-right">
          <template v-if="selectionMode">
            <span class="selected-count">已经选择 {{ selectedIds.size }} 张</span>
            <button class="action-btn" @click="handleDownload">
              <DownloadOutlined /> 下载
            </button>
            <button class="action-btn" @click="showQrModal = true">
              <MobileOutlined /> 下载到手机
            </button>
            <button class="action-btn danger" @click="handleDelete">
              <DeleteOutlined /> 删除
            </button>
            <button class="action-btn" @click="exitSelectionMode">取消</button>
          </template>
          <template v-else>
            <button class="batch-btn" @click="enterSelectionMode">
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
        <div class="category-header">服饰模特</div>
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
        <div class="history-grid">
          <div
            v-for="h in filteredHistory"
            :key="h.id"
            class="history-card"
            :class="{ selectable: selectionMode }"
            @click="selectionMode ? toggleSelect(h.id) : openDetail(h)"
          >
            <div v-if="selectionMode" class="card-checkbox">
              <a-checkbox
                :checked="selectedIds.has(h.id)"
                @change.stop="toggleSelect(h.id)"
              />
            </div>
            <div class="card-thumb">
              <img :src="h.resultUrl" :alt="h.toolName" />
            </div>
            <div class="card-info">
              <span class="card-tool">{{ h.toolName }}</span>
              <span class="card-date">{{ h.createdAt }}</span>
            </div>
          </div>
        </div>
        <p v-if="!filteredHistory.length" class="empty-hint">暂无历史记录</p>
      </main>
    </div>

    <!-- 下载到手机 QR 码弹窗 -->
    <div v-if="showQrModal" class="modal-mask" @click.self="showQrModal = false">
      <div class="modal-card qr-modal">
        <button class="close-btn" aria-label="关闭" @click="showQrModal = false">
          <CloseOutlined />
        </button>
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
import { ref, computed, onMounted } from 'vue';
import {
  ThunderboltFilled,
  DownloadOutlined,
  DeleteOutlined,
  MobileOutlined,
  UnorderedListOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';
import QRCode from 'qrcode';

const auth = useAuthStore();

interface HistoryItem {
  id: string;
  toolName: string;
  toolId: string;
  resultUrl: string;
  createdAt: string;
}

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
];

const mockHistory: HistoryItem[] = [
  {
    id: '1',
    toolName: 'AI 模特试穿',
    toolId: 'virtual-try-on',
    resultUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=200&auto=format&fit=crop',
    createdAt: '2025-03-07 14:30',
  },
  {
    id: '2',
    toolName: 'AI 商品场景图',
    toolId: 'scene-generation',
    resultUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=200&auto=format&fit=crop',
    createdAt: '2025-03-07 12:15',
  },
  {
    id: '3',
    toolName: 'AI 细节增强',
    toolId: 'detail-enhance',
    resultUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=90&w=200&auto=format&fit=crop',
    createdAt: '2025-03-06 18:00',
  },
  {
    id: '4',
    toolName: 'AI 背景替换',
    toolId: 'background-replace',
    resultUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=200&auto=format&fit=crop',
    createdAt: '2025-03-06 10:20',
  },
  {
    id: '5',
    toolName: 'AI 模特换脸',
    toolId: 'face-swap',
    resultUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=200&auto=format&fit=crop',
    createdAt: '2025-03-05 16:45',
  },
  {
    id: '6',
    toolName: 'AI 模特试穿',
    toolId: 'virtual-try-on',
    resultUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=200&auto=format&fit=crop',
    createdAt: '2025-03-05 11:00',
  },
  {
    id: '7',
    toolName: 'AI 试鞋',
    toolId: 'shoe-try-on',
    resultUrl: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=200&auto=format&fit=crop',
    createdAt: '2025-03-04 20:30',
  },
  {
    id: '8',
    toolName: '手持商品图',
    toolId: 'hand-product',
    resultUrl: 'https://images.unsplash.com/photo-1583391730485-32a294f2a441?q=80&w=200&auto=format&fit=crop',
    createdAt: '2025-03-04 14:15',
  },
  {
    id: '9',
    toolName: '模特换背景',
    toolId: 'model-bg-replace',
    resultUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=200&auto=format&fit=crop',
    createdAt: '2025-03-03 09:00',
  },
];

const activeToolId = ref('');
const selectionMode = ref(false);
const selectedIds = ref<Set<string>>(new Set());
const showQrModal = ref(false);
const qrDataUrl = ref('');

const filteredHistory = computed(() => {
  if (!activeToolId.value) return mockHistory;
  return mockHistory.filter((h) => h.toolId === activeToolId.value);
});

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

function handleDownload() {
  message.success(`已下载 ${selectedIds.value.size} 张图片`);
}

function handleDelete() {
  message.success('已删除选中项');
  exitSelectionMode();
}

function openDetail(_h: HistoryItem) {
  message.info('详情功能即将开放');
}

onMounted(() => {
  const downloadUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname || ''}#/history?batch=${Date.now()}`
    : 'https://moly.ai';
  QRCode.toDataURL(downloadUrl, { width: 180, margin: 2 }).then((url) => {
    qrDataUrl.value = url;
  }).catch(() => {});
});
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
    .icon {
      color: #f59e0b;
    }
  }

  .recharge-link,
  .login-link {
    color: #2563eb;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
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
    &:hover {
      background: #1d4ed8;
    }
  }

  .action-btn {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #e5e7eb;
    &:hover {
      background: #e5e7eb;
    }
    &.danger {
      color: #dc2626;
      border-color: #fecaca;
      &:hover {
        background: #fee2e2;
      }
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

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  &.selectable {
    cursor: default;
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

.empty-hint {
  color: #9ca3af;
  font-size: 14px;
  text-align: center;
  padding: 48px 16px;
}

/* QR Modal */
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

.modal-card.qr-modal {
  position: relative;
  width: 100%;
  max-width: 340px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 28px;
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
