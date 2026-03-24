<template>
  <section id="showcase" class="showcase">
    <div class="showcase-inner">
      <h2 class="section-title">看看 Moly 能做什么</h2>
      <div class="tags">
        <span v-for="t in tags" :key="t" class="tag">{{ t }}</span>
      </div>
      <div class="grid">
        <div v-for="(img, i) in images" :key="i" class="grid-item">
          <img
            :src="img.url"
            :alt="img.alt"
            class="grid-img"
            loading="lazy"
            @error="onImgError($event, i)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const tags = ['虚拟试穿', '场景渲染', '商品图', '营销海报'];

import imgMeizhuang from '@/assets/showcase-meizhuang.png';

const images = [
  { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop', alt: '模特展示' },
  { url: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=600&auto=format&fit=crop', alt: '场景渲染' },
  { url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop', alt: '人像' },
  { url: imgMeizhuang, alt: '美妆' },
  { url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600&auto=format&fit=crop', alt: '店铺' },
  { url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600&auto=format&fit=crop', alt: '男装' },
];

function onImgError(e: Event, index: number) {
  const el = e.target as HTMLImageElement;
  if (!el || el.dataset.fallback === '1') return;
  if (index === 3) {
    el.src = 'https://images.unsplash.com/photo-1591132352323-d78964d2f0b4?q=80&w=600&auto=format&fit=crop';
    el.dataset.fallback = '1';
  }
}
</script>

<style scoped lang="scss">
.showcase {
  padding: 80px 24px;
  background: transparent;
}

.showcase-inner {
  max-width: 1280px;
  margin: 0 auto;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 24px 0;
  text-align: center;
  letter-spacing: -0.02em;
}

.tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 40px;
}

.tag {
  padding: 8px 16px;
  background: #EFF6FF;
  color: #2563EB;
  font-size: 14px;
  border-radius: 9999px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

.grid-item {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  aspect-ratio: 4/3;
  transition: box-shadow 0.2s;
  background: #f5f5f5;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.grid-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
