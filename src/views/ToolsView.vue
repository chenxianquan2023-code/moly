<template>
  <div class="tools-view">

    <!-- Hero Banner -->
    <div class="banner">
      <div class="banner-inner">
        <div class="banner-content">
          <span class="banner-badge">
            <svg class="badge-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI 智能创作
          </span>
          <h2 class="banner-title">全能 AI 视觉创作平台</h2>
          <p class="banner-desc">模特试穿 · 首饰视频 · Listing 文案 · A+ 设计，一站式搞定电商视觉</p>
          <button class="banner-btn" @click="handleModelAgent">立即体验全能模特</button>
        </div>
        <div class="banner-deco">
          <div class="deco-card">
            <svg class="deco-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        </div>
      </div>
      <!-- 装饰圆 -->
      <div class="deco-circle deco-circle-1"></div>
      <div class="deco-circle deco-circle-2"></div>
    </div>

    <!-- 全能模特 -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">全能模特</h2>
        <span class="section-sub">多人种、多场景虚拟模特换装与商品展示</span>
      </div>
      <div class="scene-grid">
        <div class="scene-card" @click="handleModelAgent">
          <div class="scene-icon" style="background:#EFF6FF">
            <svg fill="none" stroke="#2563EB" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div class="scene-text">
            <h3>进入全能模特工作台</h3>
            <p>覆盖服饰、配饰、鞋履全品类电商视觉需求</p>
          </div>
          <svg class="scene-arrow" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </section>

    <!-- 亚马逊营销 -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">亚马逊营销</h2>
        <span class="section-sub">从 Listing 文案到 A+ 页面，一站式打造高转化详情</span>
      </div>
      <div class="listing-grid">
        <div class="listing-card" @click="router.push('/tools/listing')">
          <div class="listing-icon" style="background:#EFF6FF">
            <svg fill="none" stroke="#2563EB" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <div class="listing-text">
            <h3>Listing 营销大师</h3>
            <p>基于商品信息与竞品分析，自动生成标题、五点、描述</p>
          </div>
          <svg class="scene-arrow" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <div class="listing-card" @click="router.push('/tools/aplus-wizard')">
          <div class="listing-icon" style="background:#F5F3FF">
            <svg fill="none" stroke="#7C3AED" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <div class="listing-text">
            <h3>A+ 设计师</h3>
            <p>基于 Listing 与策略，生成 Amazon A+ 模块化文案与配图</p>
          </div>
          <svg class="scene-arrow" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </section>

    <!-- 营销海报 -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">营销海报</h2>
        <span class="section-sub">上传图片一键生成朋友圈爆款海报，晒转介绍、晒团队、晒产品</span>
      </div>
      <div class="scene-grid">
        <div class="scene-card" @click="router.push('/tools/marketing-poster')">
          <div class="scene-icon" style="background:#FFF7ED">
            <svg fill="none" stroke="#EA580C" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <div class="scene-text">
            <h3>营销海报生成器</h3>
            <p>晒转介绍 / 晒团队 / 晒产品，3 种海报风格，上传截图即可生成</p>
          </div>
          <svg class="scene-arrow" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </section>

    <!-- 短视频工坊 -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">短视频工坊</h2>
        <span class="section-sub">为首饰与服饰品类定制的短视频生成方案，适配主流社交平台</span>
      </div>
      <div class="tool-grid">
        <div class="tool-card" @click="handleVideoEntry('jewelry')">
          <div class="tool-icon" style="background:#FFF7ED">
            <svg fill="none" stroke="#EA580C" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
            </svg>
          </div>
          <h3 class="tool-name">首饰摄影师</h3>
          <p class="tool-desc">模特 + 首饰 → 专业展示视频</p>
        </div>

        <div class="tool-card" @click="handleVideoEntry('fashion')">
          <div class="tool-icon" style="background:#F0FDF4">
            <svg fill="none" stroke="#16A34A" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
            </svg>
          </div>
          <h3 class="tool-name">服饰摄影师</h3>
          <p class="tool-desc">服装上身效果一键生成视频</p>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function handleModelAgent() {
  router.push('/tools/omni-model')
}

function handleVideoEntry(type: string) {
  router.push('/workflow/jewelry')
}
</script>

<style scoped lang="scss">
.tools-view {
  max-width: 960px;
  margin: 0 auto;
  padding-bottom: 48px;
}

// ── Banner ────────────────────────────────────────────────────────────────────
.banner {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 45%, #3b82f6 75%, #60a5fa 100%);
  border-radius: 20px;
  padding: 40px 40px;
  margin-bottom: 36px;
}

.banner-inner {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.banner-content {
  max-width: 480px;
}

.banner-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  border-radius: 999px;
  font-size: 13px;
  color: #fff;
  margin-bottom: 16px;

  .badge-icon {
    width: 14px;
    height: 14px;
  }
}

.banner-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 10px;
  line-height: 1.3;
}

.banner-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin: 0 0 24px;
}

.banner-btn {
  display: inline-flex;
  align-items: center;
  padding: 11px 24px;
  background: #fff;
  color: #2563eb;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.92);
    transform: translateY(-1px);
  }
}

.banner-deco {
  display: none;
  @media (min-width: 640px) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 140px;
    height: 140px;
  }
}

.deco-card {
  width: 100px;
  height: 100px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;

  .deco-icon {
    width: 52px;
    height: 52px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  pointer-events: none;
}

.deco-circle-1 {
  width: 220px;
  height: 220px;
  top: -80px;
  right: -40px;
}

.deco-circle-2 {
  width: 160px;
  height: 160px;
  bottom: -60px;
  left: 40%;
}

// ── Section ───────────────────────────────────────────────────────────────────
.section {
  margin-bottom: 36px;
}

.section-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.section-sub {
  font-size: 13px;
  color: #9CA3AF;
}

// ── Scene cards ───────────────────────────────────────────────────────────────
.scene-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scene-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #F3F4F6;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
    transform: translateY(-1px);

    .scene-arrow {
      color: #3B82F6;
      transform: translateX(2px);
    }
  }
}

.scene-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 22px;
    height: 22px;
  }
}

.scene-text {
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 4px;
  }

  p {
    font-size: 13px;
    color: #9CA3AF;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.scene-arrow {
  width: 18px;
  height: 18px;
  color: #D1D5DB;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

// ── Listing cards ─────────────────────────────────────────────────────────────
.listing-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.listing-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 20px;
  background: #fff;
  border: 1px solid #F3F4F6;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
    transform: translateY(-1px);

    .scene-arrow {
      color: #3B82F6;
      transform: translateX(2px);
    }
  }
}

.listing-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 26px;
    height: 26px;
  }
}

.listing-text {
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 5px;
  }

  p {
    font-size: 13px;
    color: #9CA3AF;
    margin: 0;
    line-height: 1.5;
  }
}

// ── Tool cards ────────────────────────────────────────────────────────────────
.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.tool-card {
  background: #fff;
  border: 1px solid #F3F4F6;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #BFDBFE;
    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
    transform: translateY(-1px);
  }
}

.tool-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;

  svg {
    width: 22px;
    height: 22px;
  }
}

.tool-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 6px;
}

.tool-desc {
  font-size: 12px;
  color: #9CA3AF;
  margin: 0;
  line-height: 1.5;
}
</style>
