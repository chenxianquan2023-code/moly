<template>
  <div class="listing-entry">
    <header class="tool-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <span>一键生成 Listing</span>
        </div>
        <div class="header-right">
          <span class="points"><ThunderboltFilled /> {{ auth.points }} 积分</span>
          <router-link to="/recharge" class="recharge-link">充值</router-link>
        </div>
      </div>
    </header>

    <main class="entry-main">
      <div class="entry-hero">
        <h1 class="hero-title">Amazon Listing AI 一键生成</h1>
        <p class="hero-desc">选择模式，让 AI 帮你快速创建或优化商品 Listing</p>
      </div>

      <div class="mode-cards">
        <div class="mode-card" @click="goCreate">
          <div class="card-icon create-icon">
            <FileAddOutlined />
          </div>
          <div class="card-body">
            <h2 class="card-title">首次创作</h2>
            <p class="card-desc">
              从零开始，上传商品图片和基本信息，AI 自动生成完整 Listing（标题、五点描述、产品描述、搜索关键词、主图）
            </p>
            <ul class="card-features">
              <li><CheckCircleFilled class="feat-icon" /> 上传图片即可开始</li>
              <li><CheckCircleFilled class="feat-icon" /> 支持竞品分析辅助</li>
              <li><CheckCircleFilled class="feat-icon" /> 一键生成全套素材</li>
            </ul>
          </div>
          <div class="card-action">
            <span class="action-text">开始创作</span>
            <ArrowRightOutlined />
          </div>
        </div>

        <div class="mode-card" @click="goOptimize">
          <div class="card-icon optimize-icon">
            <RocketOutlined />
          </div>
          <div class="card-body">
            <h2 class="card-title">Listing 优化</h2>
            <p class="card-desc">
              输入商品 ASIN 或链接，AI 深度分析现有 Listing 的亮点与不足，自动生成优化方案并重写文案和图片
            </p>
            <ul class="card-features">
              <li><CheckCircleFilled class="feat-icon" /> 输入 ASIN 一键分析</li>
              <li><CheckCircleFilled class="feat-icon" /> AI 亮点/缺点诊断</li>
              <li><CheckCircleFilled class="feat-icon" /> 自动生成优化版本</li>
            </ul>
          </div>
          <div class="card-action">
            <span class="action-text">开始优化</span>
            <ArrowRightOutlined />
          </div>
        </div>
      </div>

      <div class="entry-stats">
        <div class="stat-item">
          <span class="stat-number">10 分钟</span>
          <span class="stat-label">平均生成时间</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-number">SEO 优化</span>
          <span class="stat-label">关键词智能匹配</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-number">多语言</span>
          <span class="stat-label">支持英/中/日/德</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  RightOutlined,
  ThunderboltFilled,
  FileAddOutlined,
  RocketOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useListingStore } from '@/stores/listing'

const router = useRouter()
const auth = useAuthStore()
const listing = useListingStore()

function goCreate() {
  listing.setMode('create')
  router.push({ name: 'tools-listing-create' })
}

function goOptimize() {
  listing.setMode('optimize')
  router.push({ name: 'tools-listing-optimize' })
}
</script>

<style scoped lang="scss">
.listing-entry {
  min-height: 100vh;
  background: #ffffff;
}

.tool-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 20px;

  .header-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .breadcrumb {
    font-size: 14px;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 8px;
    a { color: #2563eb; text-decoration: none; &:hover { text-decoration: underline; } }
    .crumb-icon { font-size: 10px; }
  }

  .header-right { display: flex; align-items: center; gap: 16px; font-size: 14px; }
  .points { color: #6b7280; }
  .recharge-link { color: #2563eb; text-decoration: none; &:hover { text-decoration: underline; } }
}

.entry-main {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.entry-hero {
  text-align: center;
  margin-bottom: 48px;

  .hero-title {
    font-size: 32px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 12px;
  }

  .hero-desc {
    font-size: 16px;
    color: #6b7280;
    margin: 0;
  }
}

.mode-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 48px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.mode-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px 28px 24px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  gap: 20px;

  &:hover {
    border-color: #2563eb;
    box-shadow: 0 8px 30px rgba(37, 99, 235, 0.12);
    transform: translateY(-2px);
  }

  .card-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;

    &.create-icon {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      color: #2563eb;
    }

    &.optimize-icon {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #d97706;
    }
  }

  .card-body {
    flex: 1;
  }

  .card-title {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px;
  }

  .card-desc {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.6;
    margin: 0 0 16px;
  }

  .card-features {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;

    li {
      font-size: 13px;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .feat-icon {
      color: #10b981;
      font-size: 14px;
    }
  }

  .card-action {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: #2563eb;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;
  }
}

.entry-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 24px;
  background: #f9fafb;
  border-radius: 12px;

  .stat-item {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-number {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }

  .stat-label {
    font-size: 13px;
    color: #6b7280;
  }

  .stat-divider {
    width: 1px;
    height: 40px;
    background: #d1d5db;
  }
}
</style>
