<template>
  <div class="workbench-view">
    <!-- Top Header -->
    <header class="workbench-header">
      <div class="left-section">
        <nav class="breadcrumb">
          <router-link to="/dashboard" class="breadcrumb-link">首页</router-link>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-current">工作台</span>
        </nav>
      </div>
      <div class="right-section">
        <div class="search-wrapper">
          <SearchOutlined class="search-icon" />
          <input type="text" placeholder="搜索工作流..." class="search-input" />
        </div>
        <div class="notification-icon">
          <BellOutlined />
          <span class="notification-dot"></span>
        </div>
        <div class="credits-box">
          <span class="credits-label">剩余额度</span>
          <span class="credits-value">2,500</span>
          <PlusCircleOutlined class="credits-add" />
        </div>
      </div>
    </header>

    <!-- Sub Navigation Tabs -->
    <div class="tab-nav-wrapper">
      <div class="tab-nav-container">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
        >
          {{ tab.name }}
          <span v-if="activeTab === tab.id" class="tab-indicator"></span>
        </button>
      </div>
    </div>

    <!-- Feature Cards Grid -->
    <div class="cards-container">
      <div class="cards-grid">
        <!-- Dynamic Cards based on active tab -->
        <template v-for="(cardId, index) in filteredCards" :key="cardId.id">

          <!-- Card 1: AI 模特换装 -->
          <div v-if="cardId.id === 1" class="feature-card">
            <div class="card-number">{{ index + 1 }}.</div>
            <div class="card-layout">
              <div class="card-content">
                <div class="card-header">
                  <h3 class="card-title">电商视觉生产</h3>
                  <p class="card-subtitle">(全球版)</p>
                </div>
                <button class="card-cta active" @click="$router.push('/workflow')">立即生成</button>
              </div>
              <div class="card-preview hoverable">
                <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop" alt="Model" class="preview-img" />
                <div class="preview-overlay">
                  <div class="swap-icon">
                    <SwapOutlined />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 2: IP 周边商品生成 -->
          <div v-if="cardId.id === 2" class="feature-card">
            <div class="card-number">{{ index + 1 }}.</div>
            <div class="card-layout">
              <div class="card-content">
                <div class="card-header">
                  <h3 class="card-title">全领域视频营销</h3>
                  <p class="card-subtitle">短视频/长视频</p>
                </div>
                <button class="card-cta active">立即生成</button>
              </div>
              <div class="card-preview mockup">
                <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop" alt="T-shirt" class="mockup-img" />
              </div>
            </div>
          </div>

          <!-- Card 4: 亚马逊 A+ 布局 -->
          <div v-if="cardId.id === 4" class="feature-card">
            <div class="card-number">{{ index + 1 }}.</div>
            <div class="card-layout">
              <div class="card-content">
                <div class="card-header">
                  <h3 class="card-title">商品营销物料工厂</h3>
                  <p class="card-subtitle">AI生成营销素材</p>
                </div>
                <button class="card-cta active" @click="$router.push('/workflow/marketing')">立即生成</button>
              </div>
              <div class="card-preview wireframe">
                <div class="wireframe-layout">
                  <div class="wireframe-sidebar">
                    <div class="wireframe-block"></div>
                    <div class="wireframe-block"></div>
                    <div class="wireframe-block"></div>
                  </div>
                  <div class="wireframe-main">
                    <div class="wireframe-header">
                      <div class="wireframe-header-left"></div>
                      <div class="wireframe-header-right">
                        <AppstoreOutlined />
                      </div>
                    </div>
                    <div class="wireframe-content">
                      <div class="wireframe-grid-item"></div>
                      <div class="wireframe-grid-item"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </template>
      </div>
    </div>

    <!-- Footer -->
    <footer class="workbench-footer">
      <p>Moly AI v1 @2026</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { SwapOutlined, AppstoreOutlined, SearchOutlined, BellOutlined, PlusCircleOutlined } from '@ant-design/icons-vue';

const activeTab = ref('all');
const tabs = [
  { id: 'all', name: '全部' },
  { id: 'model', name: '电商模特' },
  { id: 'aplus', name: 'A+ 页面' },
  { id: 'video', name: '视频工具' }
];

// Card data with categories
const allCards = [
  { id: 1, category: 'model' },
  { id: 2, category: 'model' },
  { id: 3, category: 'video' },
  { id: 4, category: 'aplus' }
];

// Filter cards based on active tab
const filteredCards = computed(() => {
  if (activeTab.value === 'all') {
    return allCards;
  }
  return allCards.filter(card => card.category === activeTab.value);
});

</script>

<style scoped lang="scss">
.workbench-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #F9FAFB;
  color: #111827;
}

// Top Header
.workbench-header {
  height: 64px;
  border-bottom: 1px solid #E5E7EB;
  background-color: #ffffff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .left-section {
    display: flex;
    align-items: center;

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;

      .breadcrumb-link {
        color: #2563EB;
        font-size: 14px;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      .breadcrumb-separator {
        color: #D1D5DB;
        font-size: 12px;
      }

      .breadcrumb-current {
        color: #6B7280;
        font-size: 14px;
      }
    }
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 24px;

    .search-wrapper {
      position: relative;

      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #9CA3AF;
        font-size: 14px;
      }

      .search-input {
        width: 256px;
        background: #F9FAFB;
        color: #111827;
        font-size: 14px;
        padding: 6px 16px 6px 36px;
        border-radius: 8px;
        border: 1px solid #E5E7EB;
        outline: none;

        &::placeholder {
          color: #9CA3AF;
        }

        &:focus {
          border-color: #2563EB;
          background: #ffffff;
        }
      }
    }

    .notification-icon {
      position: relative;
      color: #6B7280;
      font-size: 20px;
      cursor: pointer;

      .notification-dot {
        position: absolute;
        top: 0;
        right: 0;
        width: 8px;
        height: 8px;
        background-color: #2563EB;
        border-radius: 50%;
        border: 2px solid #ffffff;
      }
    }

    .credits-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #EFF6FF;
      padding: 6px 12px;
      border-radius: 9999px;
      border: 1px solid #DBEAFE;
      cursor: pointer;

      .credits-label {
        font-size: 12px;
        color: #6B7280;
      }

      .credits-value {
        font-size: 14px;
        font-weight: 700;
        color: #2563EB;
      }

      .credits-add {
        color: #2563EB;
        font-size: 16px;
      }
    }
  }
}

// Sub Navigation Tabs
.tab-nav-wrapper {
  border-bottom: 1px solid #E5E7EB;
  background: #ffffff;
  margin-bottom: 32px;
}

.tab-nav-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.tab-button {
  padding: 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;

  &:hover {
    color: #374151;
  }

  &.active {
    color: #2563EB;
  }

  .tab-indicator {
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background: #2563EB;
    border-radius: 2px 2px 0 0;
  }
}

// Cards Container
.cards-container {
  flex: 1;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px 32px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

// Feature Card
.feature-card {
  background: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  &:hover {
    border-color: #93C5FD;
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08);
  }

  .card-number {
    position: absolute;
    top: -20px;
    left: 0;
    font-size: 8rem;
    line-height: 1;
    font-weight: 800;
    color: rgba(37, 99, 235, 0.04);
    z-index: 0;
    user-select: none;
    pointer-events: none;
  }

  .card-layout {
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    gap: 24px;
    height: 256px;
  }

  .card-content {
    width: 33.333%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 8px 0;

    .card-header {
      .card-title {
        font-size: 20px;
        font-weight: 700;
        color: #111827;
        margin: 0 0 4px 0;
      }

      .card-subtitle {
        font-size: 12px;
        color: #6B7280;
        margin: 0 0 24px 0;
      }
    }

    .card-cta {
      padding: 8px 20px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      width: fit-content;

      &.active {
        background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
        color: #fff;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);

        &:hover {
          background: linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%);
        }
      }

      &.disabled {
        background: #F3F4F6;
        color: #6B7280;
        border: 1px solid #E5E7EB;
        cursor: not-allowed;
      }
    }
  }

  .card-preview {
    width: 66.666%;
    height: 100%;
    background: #F9FAFB;
    border-radius: 12px;
    border: 1px solid #E5E7EB;
    overflow: hidden;
    position: relative;

    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.9;
      transition: opacity 0.5s;
    }

    &.hoverable:hover {
      .preview-img {
        opacity: 1;
      }
    }

    .preview-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      .swap-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(4px);
        border: 1px solid #E5E7EB;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #2563EB;
        font-size: 12px;
      }
    }

    &.mockup {
      background: #F3F4F6;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;

      .mockup-img {
        max-height: 100%;
        object-fit: contain;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
      }
    }

    &.wireframe {
      background: #F3F4F6;
      padding: 12px;

      .wireframe-layout {
        display: flex;
        gap: 8px;
        height: 100%;

        .wireframe-sidebar {
          width: 25%;
          display: flex;
          flex-direction: column;
          gap: 8px;

          .wireframe-block {
            flex: 1;
            background: #E5E7EB;
            border: 1px solid #D1D5DB;
            border-radius: 6px;
          }
        }

        .wireframe-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;

          .wireframe-header {
            height: 25%;
            display: flex;
            gap: 8px;

            .wireframe-header-left {
              flex: 2;
              background: #E5E7EB;
              border: 1px solid #D1D5DB;
              border-radius: 6px;
            }

            .wireframe-header-right {
              flex: 1;
              background: #EFF6FF;
              border: 1px solid #DBEAFE;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #2563EB;
              font-size: 20px;
            }
          }

          .wireframe-content {
            flex: 1;
            background: #E5E7EB;
            border: 1px solid #D1D5DB;
            border-radius: 6px;
            padding: 8px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;

            .wireframe-grid-item {
              background: #F3F4F6;
              border-radius: 4px;
            }
          }
        }
      }
    }
  }
}

.workbench-footer {
  text-align: center;
  padding: 24px;

  p {
    font-size: 12px;
    color: #9CA3AF;
    margin: 0;
  }
}
</style>
