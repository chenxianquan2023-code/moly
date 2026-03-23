<template>
  <div class="tools-view">
    <!-- Banner 轮播 -->
    <div class="banner-section">
      <div class="banner-slider" :style="bannerStyle">
        <div 
          v-for="(banner, index) in banners" 
          :key="index"
          class="banner-item"
          :class="{ active: currentBanner === index }"
          @click="handleBannerClick(banner)"
        >
          <div class="banner-content">
            <span class="banner-tag">{{ banner.tag }}</span>
            <h3 class="banner-title">{{ banner.title }}</h3>
            <p class="banner-desc">{{ banner.description }}</p>
            <button class="banner-btn" @click.stop="handleBannerClick(banner)">
              {{ banner.buttonText }}
              <span class="arrow">→</span>
            </button>
          </div>
          <div class="banner-images">
            <img v-for="(img, i) in banner.images" :key="i" :src="img" alt="" />
          </div>
        </div>
      </div>
      <div class="banner-dots">
        <span 
          v-for="(_, index) in banners" 
          :key="index"
          class="banner-dot"
          :class="{ active: currentBanner === index }"
          @click.stop="goToBanner(index)"
        />
      </div>
    </div>

    <!-- 主工具网格 - 放在 Banner 下面 -->
    <section class="section main-tools">
      <h2 class="section-title">选择场景，快速生成专业图片</h2>
      <div class="tools-grid">
        <div 
          v-for="tool in mainTools" 
          :key="tool.id"
          class="tool-card"
          @click="handleToolClick(tool)"
        >
          <div class="tool-preview">
            <div class="preview-images">
              <img :src="tool.exampleImages?.before || ''" alt="before" class="before-img" @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400&auto=format&fit=crop'" />
              <img :src="tool.exampleImages?.after || ''" alt="after" class="after-img" @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=90&w=400&auto=format&fit=crop'" />
              <div class="compare-badge">
                <span class="arrow">→</span>
              </div>
            </div>
          </div>
          <div class="tool-info">
            <div class="tool-icon">{{ tool.icon }}</div>
            <h3 class="tool-name">{{ tool.name }}</h3>
            <p class="tool-desc">{{ tool.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 文案与 Listing 入口 -->
    <section class="section listing-tools">
      <h2 class="section-title">文案与 Listing</h2>
      <div class="listing-tools-grid">
        <div class="tool-card listing-card" @click="router.push('/tools/listing')">
          <div class="tool-preview listing-preview">
            <span class="listing-icon">📝</span>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">一键生成 Listing</h3>
            <p class="tool-desc">基于商品信息与竞品分析，自动生成标题、五点、描述与主图建议，支持初创与优化模式。</p>
          </div>
        </div>
        <div class="tool-card listing-card" @click="router.push('/tools/aplus-wizard')">
          <div class="tool-preview listing-preview">
            <span class="listing-icon">✨</span>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">A+ 内容生成</h3>
            <p class="tool-desc">基于已生成 Listing 与策略，生成 Amazon A+ 模块化文案与配图，支持编辑、锁定与导出交付包。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 爆款视频复刻 - 横向滚动 -->
    <section class="section">
      <div class="section-header-row">
        <h2 class="section-title">爆款视频复刻</h2>
        <button class="view-all-btn" @click="handleViewAll('video-replica')">
          查看全部 <span class="arrow">→</span>
        </button>
      </div>
      <div class="horizontal-scroll">
        <div 
          v-for="item in videoReplicas" 
          :key="item.id"
          class="scroll-card video-card"
          @click.stop="handleCardClick(item)"
        >
          <img :src="item.cover" alt="" />
          <div class="play-overlay">
            <span class="play-icon">▶</span>
          </div>
        </div>
      </div>
    </section>

    <!-- AI模特视频 - 带数据统计 -->
    <section class="section">
      <div class="section-header-with-stats">
        <div>
          <h2 class="section-title">AI模特视频</h2>
          <p class="section-stats">
            数据显示，「视频广告」相较图片广告可实现
            <span class="highlight">37.4%的收入增量</span>
          </p>
        </div>
        <button class="view-all-btn" @click="handleViewAll('model-video')">
          查看全部 <span class="arrow">→</span>
        </button>
      </div>
      <div class="horizontal-scroll">
        <div 
          v-for="item in modelVideos" 
          :key="item.id"
          class="scroll-card model-card"
          @click.stop="handleCardClick(item)"
        >
          <img :src="item.cover" alt="" />
          <div class="model-info">
            <span class="model-tag">{{ item.tag }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 模板区 -->
    <section class="section templates-section">
      <div class="section-header-row">
        <h2 class="section-title">模板</h2>
        <div class="filter-tabs">
          <button 
            v-for="tab in templateTabs" 
            :key="tab.id"
            class="filter-tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.name }}
          </button>
        </div>
        <div class="sort-options">
          <button 
            v-for="opt in sortOptions" 
            :key="opt.id"
            class="sort-btn"
            :class="{ active: activeSort === opt.id }"
            @click="activeSort = opt.id"
          >
            {{ opt.name }}
          </button>
        </div>
      </div>
      <div class="templates-grid">
        <div 
          v-for="template in templates" 
          :key="template.id"
          class="template-card"
          @click="handleTemplateClick(template)"
        >
          <img :src="template.cover" alt="" @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400&auto=format&fit=crop'" />
          <div class="template-overlay">
            <span class="template-category">{{ template.category }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToolStore } from '@/stores'

const router = useRouter()
const toolStore = useToolStore()

// Banner 数据
const banners = ref([
  {
    tag: 'NEW',
    title: '对话改图框选模式上线！',
    description: '独家框选工具，专为「全能图像模型2」定制！',
    buttonText: '立即体验',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=400&auto=format&fit=crop'
    ],
    link: '/tools/face-swap'
  },
  {
    tag: '热门',
    title: 'AI 试鞋视频震撼上线',
    description: '鞋类专属：一张图，秒变模特上脚视频！',
    buttonText: '立即使用',
    images: [
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop'
    ],
    link: '/tools/shoe-try-on'
  },
  {
    tag: '推荐',
    title: 'AI 口播数字人已上线',
    description: '让UGC风格的数字人来介绍您的商品卖点吧！',
    buttonText: '立即体验',
    images: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop'
    ],
    link: '/tools/digital-human'
  }
])

const currentBanner = ref(0)
let bannerTimer: ReturnType<typeof setInterval>

const bannerStyle = computed(() => ({
  transform: `translateX(-${currentBanner.value * 100}%)`
}))

// 爆款视频复刻 - 每项带跳转路由
const videoReplicas = ref([
  { id: 1, cover: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop', route: '/tools/virtual-try-on' },
  { id: 2, cover: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=400&auto=format&fit=crop', route: '/tools/scene-generation' },
  { id: 3, cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop', route: '/tools/face-swap' },
  { id: 4, cover: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=400&auto=format&fit=crop', route: '/tools/shoe-try-on' },
  { id: 5, cover: 'https://images.unsplash.com/photo-1583391730485-32a294f2a441?q=80&w=400&auto=format&fit=crop', route: '/tools/hand-product' },
  { id: 6, cover: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop', route: '/tools/model-bg-replace' }
])

// AI模特视频 - 带跳转
const modelVideos = ref([
  { id: 1, cover: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=360&auto=format&fit=crop', tag: '热门', route: '/tools/virtual-try-on' },
  { id: 2, cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=360&auto=format&fit=crop', tag: '新品', route: '/tools/face-swap' },
  { id: 3, cover: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=360&auto=format&fit=crop', tag: '推荐', route: '/tools/virtual-try-on' },
  { id: 4, cover: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=360&auto=format&fit=crop', tag: '热门', route: '/tools/model-bg-replace' },
  { id: 5, cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=360&auto=format&fit=crop', tag: '新品', route: '/tools/face-swap' },
  { id: 6, cover: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=360&auto=format&fit=crop', tag: '推荐', route: '/tools/virtual-try-on' }
])

// 主工具 - 用 computed 保证与 store 同步，图片与功能一一对应
const mainTools = computed(() => toolStore.tryOnTools.concat(toolStore.sceneTools).slice(0, 8))

// 模板筛选 - tab id 与模板 category 对应
const templateTabs = ref([
  { id: 'all', name: '全部', category: '' },
  { id: 'promo', name: '大促节点', category: '促销' },
  { id: 'instagram', name: 'instagram', category: 'instagram' },
  { id: 'general', name: '通用', category: '通用' },
  { id: 'fashion', name: '时尚', category: '时尚' },
  { id: 'electronics', name: '消费电子', category: '消费电子' }
])

const sortOptions = ref([
  { id: 'hot', name: '最热' },
  { id: 'new', name: '最新' }
])

const activeTab = ref('all')
const activeSort = ref('hot')

// 模板数据 - 带 category 与 sortId 用于筛选和排序
const templatesRaw = ref([
  { id: 1, cover: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop', category: '时尚', sortId: 10 },
  { id: 2, cover: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=400&auto=format&fit=crop', category: '促销', sortId: 9 },
  { id: 3, cover: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop', category: '通用', sortId: 8 },
  { id: 4, cover: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=400&auto=format&fit=crop', category: '时尚', sortId: 7 },
  { id: 5, cover: 'https://images.unsplash.com/photo-1583391730485-32a294f2a441?q=80&w=400&auto=format&fit=crop', category: '促销', sortId: 6 },
  { id: 6, cover: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop', category: '通用', sortId: 5 },
  { id: 7, cover: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=400&auto=format&fit=crop', category: '时尚', sortId: 4 },
  { id: 8, cover: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop', category: '促销', sortId: 3 }
])

// 根据当前筛选和排序得到模板列表
const templates = computed(() => {
  const tab = templateTabs.value.find(t => t.id === activeTab.value)
  const category = tab?.category ?? ''
  let list = templatesRaw.value
  if (category) {
    list = list.filter(t => t.category === category)
  }
  if (activeSort.value === 'new') {
    list = [...list].sort((a, b) => b.sortId - a.sortId)
  } else {
    list = [...list].sort((a, b) => a.sortId - b.sortId)
  }
  return list
})

// Banner 自动轮播 - 8 秒一页，避免频繁乱动
onMounted(() => {
  bannerTimer = setInterval(() => {
    currentBanner.value = (currentBanner.value + 1) % banners.value.length
  }, 8000)
})

onUnmounted(() => {
  clearInterval(bannerTimer)
})

// 方法
function goToBanner(index: number) {
  currentBanner.value = index
}

function handleBannerClick(banner: any) {
  router.push(banner.link)
}

function handleToolClick(tool: any) {
  router.push(`/tools/${tool.id}`)
}

function handleCardClick(item: { route?: string; id?: number }) {
  if (item?.route) {
    router.push(item.route)
  }
}

function handleViewAll(type: string) {
  const routes: Record<string, string> = {
    'video-replica': '/tools/templates',
    'model-video': '/tools/virtual-try-on',
    'virtual-tryon': '/tools/virtual-try-on'
  }
  router.push(routes[type] || '/tools')
}

function handleTemplateClick(template: { id: number }) {
  router.push({ path: '/tools/templates', query: { id: String(template.id) } })
}
</script>

<style scoped lang="scss">
.tools-view {
  padding-bottom: 40px;
}

// Banner 区域
.banner-section {
  margin-bottom: 32px;
  overflow: hidden;
  border-radius: var(--radius-xl);
}

.banner-slider {
  display: flex;
  transition: transform 0.5s ease;
}

.banner-item {
  flex: 0 0 100%;
  min-width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: var(--radius-xl);
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.banner-content {
  color: white;
  flex: 1;
}

.banner-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
}

.banner-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
}

.banner-desc {
  font-size: 14px;
  opacity: 0.9;
  margin: 0 0 20px;
}

.banner-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.02);
  }
}

.banner-images {
  display: flex;
  gap: 12px;
  
  img {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: var(--radius-md);
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
}

.banner-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;

  .banner-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-border);
    cursor: pointer;
    transition: background 0.3s;

    &.active {
      background: var(--color-primary);
    }
  }
}

// 区块通用样式
.section {
  margin-bottom: 40px;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-header-with-stats {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.section-stats {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 8px 0 0;
  
  .highlight {
    color: #f59e0b;
    font-weight: 600;
  }
}

.view-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--color-primary);
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;

  .arrow {
    font-size: 12px;
    opacity: 0.9;
  }

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    color: var(--color-primary-hover);
  }
}

// 横向滚动
.horizontal-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
  }
}

.scroll-card {
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.3s;
  
  &:hover {
    transform: translateY(-4px);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-lg);
  }
}

.video-card {
  width: 200px;
  height: 280px;
  position: relative;
  
  .play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border-radius: var(--radius-lg);
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  &:hover .play-overlay {
    opacity: 1;
  }
  
  .play-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: var(--color-text-primary);
  }
}

.model-card {
  width: 180px;
  height: 240px;
  position: relative;
  
  .model-info {
    position: absolute;
    top: 12px;
    left: 12px;
  }
  
  .model-tag {
    background: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
  }
}

// 主工具网格
.main-tools {
  .tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

.tool-card {
  background: white;
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--color-border);
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-primary);
    
    .after-img {
      opacity: 1;
    }
  }
}

.tool-preview {
  position: relative;
  aspect-ratio: 16/10;
  background: var(--color-bg);
}

.preview-images {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  
  img {
    width: 50%;
    height: 100%;
    object-fit: cover;
  }
  
  .before-img {
    border-radius: var(--radius-xl) 0 0 0;
  }
  
  .after-img {
    border-radius: 0 var(--radius-xl) 0 0;
    opacity: 0.9;
    transition: opacity 0.3s;
  }
}

.compare-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
}

.tool-info {
  padding: 16px;
}

.tool-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.tool-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 4px;
}

.tool-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}

// 文案与 Listing 入口
.listing-tools {
  .listing-tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }
}

.listing-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;

  .listing-preview {
    aspect-ratio: 16/8;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  }

  .listing-icon {
    font-size: 48px;
  }

  &:hover {
    .listing-preview {
      background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
    }
  }
}

// 模板区
.templates-section {
  .section-header-row {
    flex-wrap: wrap;
    gap: 16px;
  }
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 8px 16px;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--color-text-tertiary);
  }
  
  &.active {
    background: #bef264;
    border-color: #bef264;
    color: var(--color-text-primary);
    font-weight: 500;
  }
}

.sort-options {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.sort-btn {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &.active {
    border-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: 500;
    background: var(--color-primary-light);
  }
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.template-card {
  aspect-ratio: 3/4;
  cursor: pointer;
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.3s;
  
  &:hover {
    transform: translateY(-4px);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.template-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.template-category {
  color: white;
  font-size: 13px;
}

// 响应式
@media (max-width: 768px) {
  .quick-tools-bar {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .banner-item {
    flex-direction: column;
    padding: 20px;
  }
  
  .banner-images {
    margin-top: 20px;
    
    img {
      width: 80px;
      height: 80px;
    }
  }
  
  .video-card {
    width: 160px;
    height: 220px;
  }
  
  .model-card {
    width: 140px;
    height: 190px;
  }
  
  .main-tools .tools-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .listing-tools .listing-tools-grid {
    grid-template-columns: 1fr;
  }

  .templates-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
