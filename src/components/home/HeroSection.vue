<template>
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-text">
        <h1 class="hero-title"><span class="hero-title-brand">Moly</span>: 重塑电商视觉生产力</h1>
        <p class="hero-subtitle">AI 驱动的一站式电商设计解决方案</p>
        <div class="hero-cta">
          <router-link to="/tools" class="btn-primary">开始创作</router-link>
          <a href="#showcase" class="btn-outline">观看演示</a>
        </div>
      </div>
      <div class="hero-preview">
        <div class="carousel-container">
          <div class="carousel-track">
            <div
              v-for="(img, index) in heroImages"
              :key="index"
              class="carousel-card"
              :style="getCardStyle(index)"
              @click="setActive(index)"
            >
              <img :src="img.url" :alt="img.alt" class="carousel-card-img" />
            </div>
          </div>
          <div class="carousel-dots">
            <button
              v-for="(_, i) in heroImages"
              :key="i"
              type="button"
              class="dot"
              :class="{ active: i === currentIndex }"
              :aria-label="`第 ${i + 1} 张`"
              @click="setActive(i)"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// 仅最前面一张卡片随鼠标倾斜
const tilt = ref({ x: 2, y: -6 });

const heroImages = [
  { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop', alt: '产品预览' },
  { url: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=800&auto=format&fit=crop', alt: '童装' },
  { url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop', alt: '人像' },
];
const currentIndex = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

function getCardStyle(index: number): Record<string, string | number> {
  const total = heroImages.length;
  let offset = index - currentIndex.value;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;

  // 当前张：最前、居中、完整展示，且唯一随鼠标倾斜
  if (offset === 0) {
    return {
      transform: `translateX(0) translateZ(0) scale(1) rotateY(${tilt.value.y}deg) rotateX(${tilt.value.x}deg)`,
      zIndex: 10,
      opacity: 1,
      filter: 'blur(0)',
    };
  }
  // 下一张：在右侧，但在当前张后面，露出约一半（不随鼠标）
  if (offset === 1) {
    return {
      transform: 'translateX(160px) translateZ(-56px) scale(0.9) rotateY(-8deg)',
      zIndex: 5,
      opacity: 1,
      filter: 'brightness(0.96)',
    };
  }
  // 上一张：在左侧，但在当前张后面，露出约一半（不随鼠标）
  if (offset === -1) {
    return {
      transform: 'translateX(-160px) translateZ(-56px) scale(0.9) rotateY(8deg)',
      zIndex: 5,
      opacity: 1,
      filter: 'brightness(0.96)',
    };
  }
  return {
    transform: 'translateZ(-120px) scale(0.6)',
    zIndex: 0,
    opacity: 0,
    pointerEvents: 'none',
  };
}

function setActive(index: number) {
  currentIndex.value = index;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % heroImages.length;
  }, 4000);
}

function onMove(e: MouseEvent) {
  const x = (e.clientX / window.innerWidth - 0.5) * 36;
  const y = (e.clientY / window.innerHeight - 0.5) * 22;
  tilt.value = { x: 2 - y, y: -6 + x };
}

onMounted(() => {
  window.addEventListener('mousemove', onMove);
  timer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % heroImages.length;
  }, 4000);
});
onUnmounted(() => {
  window.removeEventListener('mousemove', onMove);
  if (timer) clearInterval(timer);
});
</script>

<style scoped lang="scss">
.hero {
  padding: 96px 24px 80px;
  min-height: 90vh;
  display: flex;
  align-items: center;
}

.hero-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  align-items: center;
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
}

.hero-text {
  .hero-title {
    font-family: 'PingFang SC', 'Inter', -apple-system, sans-serif;
    font-size: clamp(32px, 5vw, 56px);
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #1f2937;
    line-height: 1.15;
    margin: 0 0 20px 0;
  }

  .hero-title-brand {
    font-family: 'Nunito', 'PingFang SC', 'Inter', sans-serif;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .hero-subtitle {
    font-size: 18px;
    color: #6b7280;
    line-height: 1.6;
    margin: 0 0 32px 0;
    max-width: 480px;
  }

  .hero-cta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 48px;
    padding: 0 28px;
    background: #10b981;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    border-radius: 8px;
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
    transition: all 0.2s ease;
    &:hover {
      background: #059669;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
    }
  }

  .btn-outline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 48px;
    padding: 0 28px;
    background: transparent;
    color: #2563eb;
    font-size: 16px;
    font-weight: 600;
    border: 2px solid #2563eb;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s ease;
    &:hover {
      background: #eff6ff;
      transform: translateY(-2px);
    }
  }
}

.hero-preview {
  display: flex;
  justify-content: center;
  align-items: center;
}

.carousel-container {
  position: relative;
  width: 100%;
  max-width: 640px;
  height: 520px;
  perspective: 900px;
  overflow: visible;
}

.carousel-track {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  perspective-origin: 50% 50%;
}

.carousel-card {
  position: absolute;
  top: 0;
  left: 50%;
  width: 320px;
  height: 100%;
  margin-left: -160px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.2);
  transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1),
    opacity 0.6s ease,
    filter 0.6s ease;
  cursor: pointer;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

.carousel-card-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.carousel-dots {
  position: absolute;
  bottom: -36px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  gap: 8px;
  z-index: 20;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: #cbd5e1;
  cursor: pointer;
  transition: all 0.3s ease;
}
.dot:hover {
  background: #94a3b8;
}
.dot.active {
  background: #2563eb;
  width: 24px;
  border-radius: 4px;
}
</style>
