<template>
  <section class="product-showcase">
    <h2 class="section-title">AI 爆款商品设计</h2>
    <p class="section-subtitle">使用 Moly AI，轻松打造爆款产品图片，实测可帮助您的点击率提升 54.7%</p>

    <div class="showcase-layout">
      <!-- 左侧：6个产品仅展示3个（上一个/当前/下一个），当前居中放大 -->
      <div class="product-selector">
        <div class="thumb-carousel">
          <button
            v-for="slot in visibleSlots"
            :key="slot.product.id"
            type="button"
            class="thumb-slot"
            :class="{ active: slot.role === 'current' }"
            @click="selectProduct(slot.product.id)"
          >
            <img :src="slot.product.thumbnail" :alt="slot.product.name" class="thumb-img" />
          </button>
        </div>
        <div class="arrow-hint">→ → →</div>
      </div>

      <!-- 右侧：产品展示结果区 -->
      <div class="product-display">
        <div class="result-grid">
          <div
            v-for="(img, i) in (selectedProduct?.resultImages ?? [])"
            :key="i"
            class="result-item"
          >
            <transition name="img-fade" mode="out-in">
              <img
                :key="`${selectedId}-${i}`"
                :src="img"
                :alt="`${selectedProduct?.name ?? ''} 搭配 ${i + 1}`"
                class="result-img"
              />
            </transition>
          </div>
        </div>
      </div>
    </div>

    <router-link to="/tools" class="cta-btn">开始免费创建</router-link>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Product {
  id: string;
  name: string;
  thumbnail: string;
  resultImages: string[];
}

const products: Product[] = [
  {
    id: '1',
    name: '白色运动鞋',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop',
    resultImages: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=400&auto=format&fit=crop',
    ],
  },
  {
    id: '2',
    name: '深色西装外套',
    thumbnail: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=200&auto=format&fit=crop',
    resultImages: [
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
    ],
  },
  {
    id: '3',
    name: '灰色针织衫',
    thumbnail: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=200&auto=format&fit=crop',
    resultImages: [
      'https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=400&auto=format&fit=crop',
    ],
  },
  {
    id: '4',
    name: '米色风衣',
    thumbnail: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=200&auto=format&fit=crop',
    resultImages: [
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=400&auto=format&fit=crop',
    ],
  },
  {
    id: '5',
    name: '黑色牛仔夹克',
    thumbnail: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=200&auto=format&fit=crop',
    resultImages: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
    ],
  },
  {
    id: '6',
    name: '棕色帆布包',
    thumbnail: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=200&auto=format&fit=crop',
    resultImages: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=400&auto=format&fit=crop',
    ],
  },
];

const AUTO_SWITCH_INTERVAL = 4000; // 4秒自动切换

const selectedId = ref(products[0]!.id);
let autoSwitchTimer: ReturnType<typeof setInterval> | null = null;

const selectedProduct = computed(() =>
  products.find((p) => p.id === selectedId.value) ?? products[0]!
);

const selectedIndex = computed(() =>
  products.findIndex((p) => p.id === selectedId.value)
);

const visibleSlots = computed(() => {
  const i = Math.max(0, selectedIndex.value);
  const n = products.length;
  const prev = products[(i - 1 + n) % n]!;
  const curr = products[i]!;
  const next = products[(i + 1) % n]!;
  return [
    { product: prev, role: 'prev' as const },
    { product: curr, role: 'current' as const },
    { product: next, role: 'next' as const },
  ];
});

function selectProduct(id: string) {
  selectedId.value = id;
  resetAutoSwitch();
}

function goToNext() {
  const idx = (selectedIndex.value + 1 + products.length) % products.length;
  selectedId.value = products[idx]!.id;
}

function resetAutoSwitch() {
  if (autoSwitchTimer) {
    clearInterval(autoSwitchTimer);
  }
  autoSwitchTimer = setInterval(goToNext, AUTO_SWITCH_INTERVAL);
}

onMounted(() => {
  autoSwitchTimer = setInterval(goToNext, AUTO_SWITCH_INTERVAL);
});

onUnmounted(() => {
  if (autoSwitchTimer) clearInterval(autoSwitchTimer);
});
</script>

<style scoped lang="scss">
.product-showcase {
  padding: 80px 24px;
  max-width: 1100px;
  margin: 0 auto;
  background: transparent;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
  text-align: center;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 16px;
  color: #6b7280;
  text-align: center;
  margin: 0 0 32px 0;
  line-height: 1.5;
}

.showcase-layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

/* 左侧产品选择区：3 个可见，当前居中放大突出，上下两个缩在后方 */
.product-selector {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: row;
    justify-content: center;
  }
}

.thumb-carousel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  height: 320px;
  padding: 12px 0;

  @media (max-width: 768px) {
    flex-direction: row;
    height: auto;
    width: 320px;
  }
}

.thumb-slot {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  padding: 0;
  border: 2px solid transparent;
  border-radius: 12px;
  overflow: visible;
  cursor: pointer;
  transition: all 0.35s ease;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 0;

  /* 默认（上下两格）较小、偏透明、在后方 */
  width: 72px;
  height: 72px;
  opacity: 0.6;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &:nth-child(1) {
    top: 24px;
  }
  &:nth-child(2) {
    top: 50%;
    transform: translate(-50%, -50%);
  }
  &:nth-child(3) {
    top: auto;
    bottom: 24px;
  }

  &:hover {
    opacity: 0.85;
  }

  &.active {
    width: 110px;
    height: 110px;
    opacity: 1;
    z-index: 3;
    border-color: #1f2937;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  &.active:nth-child(2) {
    transform: translate(-50%, -50%);
    top: 50%;
    bottom: auto;
  }

  @media (max-width: 768px) {
    top: 50%;
    left: auto;
    transform: translateY(-50%);

    &:nth-child(1) {
      left: 24px;
      bottom: auto;
    }
    &:nth-child(2) {
      left: 50%;
      transform: translate(-50%, -50%);
      bottom: auto;
    }
    &:nth-child(3) {
      left: auto;
      right: 24px;
      bottom: auto;
    }

    &.active:nth-child(2) {
      transform: translate(-50%, -50%);
    }
  }
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 10px;
}

.arrow-hint {
  margin-top: 12px;
  font-size: 13px;
  color: #9ca3af;
  letter-spacing: 4px;
  text-align: center;
}

/* 右侧产品展示区 */
.product-display {
  flex: 1;
  min-width: 0;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

.result-item {
  position: relative;
  aspect-ratio: 3/4;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.result-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 图片淡入淡出，格子尺寸固定不跳动 */
.img-fade-enter-active,
.img-fade-leave-active {
  transition: opacity 0.3s ease;
  position: absolute;
  inset: 0;
}
.img-fade-enter-from,
.img-fade-leave-to {
  opacity: 0;
}

.cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
  padding: 14px 28px;
  background: #2563EB;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);

  &:hover {
    background: #1D4ED8;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
  }
}
</style>
