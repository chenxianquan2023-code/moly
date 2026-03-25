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

    <!-- Agent 卡片区 -->
    <section class="agents-section">
      <div class="agents-grid">
        <!-- 全能模特 Agent -->
        <div class="agent-card" @click="handleModelAgent">
          <div class="agent-visual visual-model">
            <div class="visual-circles">
              <span class="circle c1"></span>
              <span class="circle c2"></span>
              <span class="circle c3"></span>
            </div>
          </div>
          <div class="agent-body">
            <div class="agent-header">
              <h3 class="agent-title">全能模特</h3>
              <span class="agent-badge">即将开放</span>
            </div>
            <p class="agent-desc">多人种、多场景的虚拟模特换装与商品展示，覆盖全品类电商视觉需求</p>
          </div>
        </div>

        <!-- 亚马逊 Agent -->
        <div class="agent-card">
          <div class="agent-visual visual-amazon">
            <div class="visual-bars">
              <span class="bar b1"></span>
              <span class="bar b2"></span>
              <span class="bar b3"></span>
              <span class="bar b4"></span>
            </div>
          </div>
          <div class="agent-body">
            <h3 class="agent-title">亚马逊营销</h3>
            <p class="agent-desc">从 Listing 文案到 A+ 页面，一站式打造高转化商品详情</p>
            <div class="agent-entries">
              <button class="entry-item" @click.stop="router.push('/tools/listing')">
                <span class="entry-label">Listing 营销大师</span>
                <span class="entry-arrow">&rarr;</span>
              </button>
              <button class="entry-item" @click.stop="router.push('/tools/aplus-wizard')">
                <span class="entry-label">A+ 设计师</span>
                <span class="entry-arrow">&rarr;</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 短视频 Agent -->
        <div class="agent-card">
          <div class="agent-visual visual-video">
            <div class="visual-frames">
              <span class="frame f1"></span>
              <span class="frame f2"></span>
              <span class="frame f3"></span>
            </div>
          </div>
          <div class="agent-body">
            <h3 class="agent-title">短视频工坊</h3>
            <p class="agent-desc">为首饰与服饰品类定制的短视频生成方案，适配主流社交平台</p>
            <div class="agent-entries">
              <button class="entry-item" @click.stop="handleVideoEntry('jewelry')">
                <span class="entry-label">首饰摄影师</span>
                <span class="entry-arrow">&rarr;</span>
              </button>
              <button class="entry-item" @click.stop="handleVideoEntry('fashion')">
                <span class="entry-label">服饰摄影师</span>
                <span class="entry-arrow">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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

onMounted(() => {
  bannerTimer = setInterval(() => {
    currentBanner.value = (currentBanner.value + 1) % banners.value.length
  }, 8000)
})

onUnmounted(() => {
  clearInterval(bannerTimer)
})

function goToBanner(index: number) {
  currentBanner.value = index
}

function handleBannerClick(banner: any) {
  router.push(banner.link)
}

function handleModelAgent() {
  // 入口待定
}

function handleVideoEntry(type: string) {
  router.push({ path: '/tools/templates', query: { category: type } })
}
</script>

<style scoped lang="scss">
.tools-view {
  padding-bottom: 40px;
}

// Banner 区域
.banner-section {
  margin-bottom: 40px;
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

// Agent 卡片区
.agents-section {
  margin-bottom: 40px;
}

.agents-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.agent-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  cursor: default;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: #d1d5db;
  }
}

.agent-visual {
  height: 180px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.visual-model {
  background: linear-gradient(145deg, #faf5ff, #f3e8ff, #ede9fe);

  .visual-circles {
    display: flex;
    align-items: flex-end;
    gap: 12px;

    .circle {
      border-radius: 50%;
      background: rgba(168, 85, 247, 0.12);
      border: 1px solid rgba(168, 85, 247, 0.15);
      transition: transform 0.4s ease;
    }

    .c1 { width: 44px; height: 44px; }
    .c2 { width: 68px; height: 68px; background: rgba(168, 85, 247, 0.18); }
    .c3 { width: 52px; height: 52px; }
  }

  &:hover .circle {
    transform: translateY(-4px);
  }
}

.visual-amazon {
  background: linear-gradient(145deg, #fffbeb, #fef3c7, #fde68a33);

  .visual-bars {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    height: 80px;

    .bar {
      width: 20px;
      border-radius: 4px 4px 0 0;
      background: rgba(245, 158, 11, 0.2);
      border: 1px solid rgba(245, 158, 11, 0.15);
      transition: height 0.4s ease;
    }

    .b1 { height: 32px; }
    .b2 { height: 56px; background: rgba(245, 158, 11, 0.3); }
    .b3 { height: 44px; }
    .b4 { height: 68px; background: rgba(245, 158, 11, 0.25); }
  }

  &:hover .bar {
    &.b1 { height: 40px; }
    &.b2 { height: 64px; }
    &.b3 { height: 52px; }
    &.b4 { height: 76px; }
  }
}

.visual-video {
  background: linear-gradient(145deg, #eff6ff, #dbeafe, #bfdbfe33);

  .visual-frames {
    display: flex;
    gap: 8px;
    perspective: 600px;

    .frame {
      width: 44px;
      height: 60px;
      border-radius: 6px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.15);
      transition: transform 0.4s ease;
    }

    .f1 { transform: rotateY(8deg); }
    .f2 {
      width: 52px;
      height: 68px;
      background: rgba(59, 130, 246, 0.2);
      transform: translateY(-4px);
    }
    .f3 { transform: rotateY(-8deg); }
  }

  &:hover .frame {
    &.f1 { transform: rotateY(12deg) translateY(-4px); }
    &.f2 { transform: translateY(-8px); }
    &.f3 { transform: rotateY(-12deg) translateY(-4px); }
  }
}

.agent-body {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.agent-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: -0.01em;
}

.agent-badge {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.agent-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 12px 0 0 0;
}

.agent-entries {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-border-light);
  padding-top: 4px;
}

.entry-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 4px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    padding-left: 8px;

    .entry-arrow {
      opacity: 1;
      transform: translateX(0);
      color: var(--color-primary);
    }

    .entry-label {
      color: var(--color-text-primary);
    }
  }
}

.entry-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: color 0.2s;
}

.entry-arrow {
  font-size: 14px;
  color: var(--color-text-tertiary);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s ease;
}

// 响应式
@media (max-width: 768px) {
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
}
</style>
