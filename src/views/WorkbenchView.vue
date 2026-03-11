<template>
  <div class="workbench-view">
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

          <!-- Card 3: 图片放大 (with slider) -->
          <!-- <div v-if="cardId.id === 3" class="feature-card">
            <div class="card-number">{{ index + 1 }}.</div>
            <div class="card-layout">
              <div class="card-content">
                <div class="card-header">
                  <h3 class="card-title">图片放大</h3>
                  <p class="card-subtitle">(测试中)</p>
                </div>
                <button class="card-cta disabled">未开放</button>
              </div>
              <div class="card-preview slider-preview" 
                   @mousemove="handleSliderMove($event, cardId.id)"
                   @touchmove="handleSliderMove($event, cardId.id)">
                <div class="preview-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); z-index: 10;"></div>
                <img 
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600" 
                  class="slider-img after" 
                  alt="After"
                />
                
                <div class="slider-before" :style="{ width: (sliderPositions[cardId.id] || 50) + '%' }">
                  <img 
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=10&w=600&blur=5" 
                    class="slider-img before"
                    :style="{ width: (sliderWidths[cardId.id] || 0) + 'px' }"
                    alt="Before"
                  />
                  <div class="slider-label original">ORIGINAL</div>
                </div>

                <div class="slider-label upscaled">4K UPSCALED</div>

                <div class="slider-handle" :style="{ left: (sliderPositions[cardId.id] || 50) + '%' }">
                  <div class="handle-circle"></div>
                </div>
              </div>
            </div>
          </div> -->

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
import { SwapOutlined, AppstoreOutlined } from '@ant-design/icons-vue';

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
  background: #050505;
  color: #fff;
}

// Sub Navigation Tabs
.tab-nav-wrapper {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;

  &:hover {
    color: #d1d5db;
  }

  &.active {
    color: #fff;
  }

  .tab-indicator {
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background: #3b82f6;
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
  background: #0f0f10;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.1);
  }

  .card-number {
    position: absolute;
    top: -20px;
    left: 0;
    font-size: 8rem;
    line-height: 1;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.03);
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
    width: 33.333%; // 1/3
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 8px 0;

    .card-header {
      .card-title {
        font-size: 20px;
        font-weight: 700;
        color: #fff;
        margin: 0 0 4px 0;
      }

      .card-subtitle {
        font-size: 12px;
        color: #9ca3af;
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
        background: #2563eb;
        color: #fff;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);

        &:hover {
          background: #3b82f6;
        }
      }

      &.disabled {
        background: transparent;
        color: #6b7280;
        border: 1px solid rgba(255, 255, 255, 0.1);
        cursor: not-allowed;
      }
    }
  }

  .card-preview {
    width: 66.666%; // 2/3
    height: 100%;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
    position: relative;

    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.8;
      transition: opacity 0.5s;
    }

    // Hover effect for AI model swap card
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
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 12px;
      }
    }

    &.mockup {
      background: rgba(188, 170, 164, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;

      .mockup-img {
        max-height: 100%;
        object-fit: contain;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      }
    }

    &.slider-preview {
      cursor: col-resize;
      background: #000;

      .slider-img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;

        &.before {
          max-width: none;
        }
      }

      .slider-before {
        position: absolute;
        inset: 0;
        overflow: hidden;
        border-right: 1px solid rgba(255, 255, 255, 0.5);
      }

      .slider-label {
        position: absolute;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 4px;
        border-radius: 2px;

        &.original {
          bottom: 8px;
          left: 8px;
          color: rgba(255, 255, 255, 0.5);
          background: rgba(0, 0, 0, 0.3);
        }

        &.upscaled {
          bottom: 8px;
          right: 8px;
          color: #fff;
          background: rgba(37, 99, 235, 0.8);
        }
      }

      .slider-handle {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #fff;
        cursor: col-resize;
        display: flex;
        align-items: center;
        justify-content: center;

        .handle-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          // No icon inside - just empty white circle
        }
      }
    }

    &.wireframe {
      background: #1a1a1c;
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
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.05);
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
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.05);
              border-radius: 6px;
            }

            .wireframe-header-right {
              flex: 1;
              background: rgba(59, 130, 246, 0.1);
              border: 1px solid rgba(59, 130, 246, 0.2);
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: rgba(59, 130, 246, 0.5);
              font-size: 20px;
            }
          }

          .wireframe-content {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            padding: 8px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;

            .wireframe-grid-item {
              background: rgba(255, 255, 255, 0.05);
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
    color: #4b5563;
    margin: 0;
  }
}
</style>
