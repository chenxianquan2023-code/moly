<template>
  <div class="templates-view">
    <header class="templates-header">
      <div class="header-inner">
        <h1 class="page-title">模版中心</h1>
        <div class="header-right">
          <span class="points"><ThunderboltFilled class="icon" /> {{ auth.points }} 积分</span>
          <router-link v-if="auth.isLoggedIn" to="/recharge" class="recharge-link">充值</router-link>
          <router-link v-else to="/login" class="login-link">登录</router-link>
          <router-link to="/workflow/try-on" class="advanced-link">高级模式</router-link>
        </div>
      </div>
    </header>
    <main class="templates-main">
      <p class="section-intro">精选模版，一键套用</p>

      <!-- Filters -->
      <div class="filters-row">
        <div class="filter-group">
          <span class="filter-label">营销专题：</span>
          <div class="filter-chips">
            <button
              v-for="opt in topicOptions"
              :key="opt.value"
              class="filter-chip"
              :class="{ active: filterTopic === opt.value }"
              @click="filterTopic = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label">类目：</span>
          <div class="filter-chips">
            <button
              v-for="opt in categoryOptions"
              :key="opt.value"
              class="filter-chip"
              :class="{ active: filterCategory === opt.value }"
              @click="filterCategory = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div class="filter-group">
          <span class="filter-label">尺寸：</span>
          <div class="filter-chips">
            <button
              v-for="opt in sizeOptions"
              :key="opt.value"
              class="filter-chip"
              :class="{ active: filterSize === opt.value }"
              @click="filterSize = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Sort tabs -->
      <div class="sort-tabs">
        <button
          class="sort-tab"
          :class="{ active: sortOrder === 'hot' }"
          @click="sortOrder = 'hot'"
        >
          最热
        </button>
        <button
          class="sort-tab"
          :class="{ active: sortOrder === 'new' }"
          @click="sortOrder = 'new'"
        >
          最新
        </button>
      </div>

      <!-- Template grid -->
      <div class="template-grid">
        <div
          v-for="t in filteredTemplates"
          :key="t.id"
          class="template-card"
          @click="openDetailModal(t)"
        >
          <div class="card-cover">
            <img :src="t.cover" :alt="t.name" />
          </div>
          <div class="card-body">
            <h3>{{ t.name }}</h3>
            <p>{{ t.description }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Template detail modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="detailModalVisible" class="modal-overlay" @click.self="closeDetailModal">
          <div class="modal-container">
            <button class="modal-close" aria-label="关闭" @click="closeDetailModal">×</button>
            <div v-if="selectedTemplate" class="modal-body">
              <div class="modal-preview">
                <img :src="selectedTemplate.cover" :alt="selectedTemplate.name" />
              </div>
              <div class="modal-info">
                <h2 class="modal-title">{{ selectedTemplate.name }}</h2>
                <div class="info-row">
                  <span class="info-label">模板尺寸</span>
                  <span class="info-value">{{ selectedTemplate.size }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">适用类目</span>
                  <span class="info-value">{{ selectedTemplate.categoryLabel }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">语言类型</span>
                  <span class="info-value">{{ selectedTemplate.language }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">更新时间</span>
                  <span class="info-value">{{ selectedTemplate.updatedAt }}</span>
                </div>
                <button class="use-btn" @click="goToTool(selectedTemplate.route)">
                  立即使用
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ThunderboltFilled } from '@ant-design/icons-vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  cover: string;
  route: string;
  topic: string;
  category: string;
  categoryLabel: string;
  size: string;
  language: string;
  updatedAt: string;
  sortOrder: 'hot' | 'new';
}

const auth = useAuthStore();
const router = useRouter();

const filterTopic = ref('all');
const filterCategory = ref('all');
const filterSize = ref('all');
const sortOrder = ref<'hot' | 'new'>('hot');
const detailModalVisible = ref(false);
const selectedTemplate = ref<TemplateItem | null>(null);

const topicOptions = [
  { value: 'all', label: '全部' },
  { value: 'black-friday', label: 'Black Friday' },
  { value: '11.11', label: '11.11' },
  { value: 'thanksgiving', label: 'Thanksgiving' },
  { value: 'christmas', label: 'Christmas' },
  { value: 'new-year', label: 'New Year' },
];

const categoryOptions = [
  { value: 'all', label: '全部' },
  { value: 'instagram', label: 'instagram' },
  { value: 'general', label: '通用' },
  { value: 'fashion', label: '时尚' },
  { value: 'electronics', label: '消费电子' },
  { value: 'beauty', label: '美妆' },
];

const sizeOptions = [
  { value: 'all', label: '全部尺寸' },
  { value: '1080x1080', label: '1080x1080' },
  { value: '1080x1350', label: '1080x1350' },
  { value: '1200x628', label: '1200x628' },
  { value: '750x1000', label: '750x1000' },
];

const templates: TemplateItem[] = [
  {
    id: '1',
    name: '服装白底图',
    description: '适合电商主图',
    cover: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=400&auto=format&fit=crop',
    route: '/tools/virtual-try-on',
    topic: 'general',
    category: 'fashion',
    categoryLabel: '时尚',
    size: '1080x1080',
    language: '中文',
    updatedAt: '2024-03-01',
    sortOrder: 'hot',
  },
  {
    id: '2',
    name: '商品场景图',
    description: '白底转营销图',
    cover: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=400&auto=format&fit=crop',
    route: '/tools/scene-generation',
    topic: '11.11',
    category: 'general',
    categoryLabel: '通用',
    size: '1080x1350',
    language: '中文',
    updatedAt: '2024-03-05',
    sortOrder: 'hot',
  },
  {
    id: '3',
    name: '模特换脸',
    description: '保持姿势换面孔',
    cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop',
    route: '/tools/face-swap',
    topic: 'general',
    category: 'beauty',
    categoryLabel: '美妆',
    size: '750x1000',
    language: '中文',
    updatedAt: '2024-02-28',
    sortOrder: 'new',
  },
  {
    id: '4',
    name: '细节增强',
    description: '低清转高清',
    cover: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=90&w=400&auto=format&fit=crop',
    route: '/tools/detail-enhance',
    topic: 'black-friday',
    category: 'electronics',
    categoryLabel: '消费电子',
    size: '1200x628',
    language: '中英双语',
    updatedAt: '2024-03-06',
    sortOrder: 'new',
  },
  {
    id: '5',
    name: '背景替换',
    description: '一键换背景',
    cover: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop',
    route: '/tools/background-replace',
    topic: 'christmas',
    category: 'instagram',
    categoryLabel: 'instagram',
    size: '1080x1080',
    language: '中文',
    updatedAt: '2024-03-03',
    sortOrder: 'hot',
  },
  {
    id: '6',
    name: '手持商品图',
    description: '展示产品手持效果',
    cover: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop',
    route: '/tools/hand-product',
    topic: 'general',
    category: 'general',
    categoryLabel: '通用',
    size: '1080x1350',
    language: '中文',
    updatedAt: '2024-03-02',
    sortOrder: 'new',
  },
];

const filteredTemplates = computed(() => {
  let list = [...templates];

  if (filterTopic.value !== 'all') {
    list = list.filter((t) => t.topic === filterTopic.value);
  }
  if (filterCategory.value !== 'all') {
    list = list.filter((t) => t.category === filterCategory.value);
  }
  if (filterSize.value !== 'all') {
    list = list.filter((t) => t.size === filterSize.value);
  }

  list.sort((a, b) => {
    if (sortOrder.value === 'hot') {
      return a.sortOrder === 'hot' && b.sortOrder !== 'hot' ? -1 : a.sortOrder !== 'hot' && b.sortOrder === 'hot' ? 1 : 0;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return list;
});

function openDetailModal(t: TemplateItem) {
  selectedTemplate.value = t;
  detailModalVisible.value = true;
}

function closeDetailModal() {
  detailModalVisible.value = false;
  selectedTemplate.value = null;
}

function goToTool(route: string) {
  closeDetailModal();
  router.push(route);
}
</script>

<style scoped lang="scss">
.templates-view {
  min-height: 100vh;
}

.templates-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 24px;

  .header-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .page-title { font-size: 18px; font-weight: 600; color: #1f2937; margin: 0; }
  .header-right { display: flex; align-items: center; gap: 16px; font-size: 14px; }
  .points { color: #6b7280; .icon { color: #f59e0b; } }
  .recharge-link, .login-link { color: #2563eb; text-decoration: none; &:hover { text-decoration: underline; } }
  .advanced-link {
    color: #6b7280; text-decoration: none; font-size: 13px;
    padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 8px;
    &:hover { background: #f3f4f6; color: #111; }
  }
}

.templates-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

.section-intro {
  font-size: 15px;
  color: #6b7280;
  margin-bottom: 20px;
}

.filters-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;

  .filter-label {
    font-size: 14px;
    color: #374151;
    white-space: nowrap;
    padding-top: 8px;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.filter-chip {
  padding: 6px 14px;
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }

  &.active {
    background: #2563eb;
    color: #fff;
    border-color: #2563eb;
  }
}

.sort-tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.sort-tab {
  font-size: 15px;
  color: #6b7280;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;

  &:hover {
    color: #374151;
  }

  &.active {
    color: #2563eb;
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: -13px;
      height: 2px;
      background: #2563eb;
    }
  }
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
}

.template-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.25s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
    border-color: rgba(37, 99, 235, 0.3);
  }

  .card-cover {
    aspect-ratio: 1;
    overflow: hidden;
    img { width: 100%; height: 100%; object-fit: cover; }
  }

  .card-body {
    padding: 16px;
    h3 { font-size: 15px; font-weight: 600; margin: 0 0 6px 0; color: #1f2937; }
    p { font-size: 13px; color: #6b7280; margin: 0; }
  }
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-container {
  background: #fff;
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  font-size: 28px;
  line-height: 1;
  color: #6b7280;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #111;
  }
}

.modal-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 0;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.modal-preview {
  background: #f9fafb;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;

  img {
    max-width: 100%;
    max-height: 480px;
    object-fit: contain;
    border-radius: 8px;
  }
}

.modal-info {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .info-label {
    font-size: 13px;
    color: #6b7280;
  }

  .info-value {
    font-size: 15px;
    color: #1f2937;
    font-weight: 500;
  }
}

.use-btn {
  margin-top: auto;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #2563eb;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1d4ed8;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
