<template>
  <section id="showcase" class="showcase">
    <div class="showcase-inner">
      <div class="section-head" v-reveal>
        <span class="eyebrow">成片案例</span>
        <h2 class="section-title">各行各业，<span class="grad">都能复刻爆款</span></h2>
        <div class="tags">
          <span v-for="t in tags" :key="t" class="tag">{{ t }}</span>
        </div>
      </div>
      <div class="grid">
        <div
          v-for="(item, i) in items"
          :key="i"
          class="card"
          v-reveal="(i % 3) * 90"
        >
          <img :src="item.url" :alt="item.cat" class="card-img" loading="lazy" @error="onImgError($event, i)" />
          <div class="card-shade"></div>
          <span class="card-cat">{{ item.cat }}</span>
          <span class="card-dur">0:15</span>
          <div class="card-play"><span class="tri"></span></div>
          <p class="card-cap">{{ item.cap }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import imgMeizhuang from '@/assets/showcase-meizhuang.png';

const tags = ['服饰穿搭', '母婴童装', '美妆个护', '家居好物', '3C 数码', '食品生鲜'];

const items = [
  { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop', cat: '服饰穿搭', cap: '这件穿上直接显瘦 10 斤！' },
  { url: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=600&auto=format&fit=crop', cat: '母婴童装', cap: '宝妈闭眼入，软到犯规～' },
  { url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop', cat: '美妆个护', cap: '素颜救星，一抹就提亮' },
  { url: imgMeizhuang, cat: '美妆个护', cap: '这支粉底液也太绝了吧' },
  { url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600&auto=format&fit=crop', cat: '家居好物', cap: '出租屋改造，氛围感拉满' },
  { url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600&auto=format&fit=crop', cat: '3C 数码', cap: '男生收到这个会爱死' },
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
  padding: 88px 24px;
}
.showcase-inner {
  max-width: 1180px;
  margin: 0 auto;
}
.section-head {
  text-align: center;
  margin-bottom: 48px;
}
.eyebrow {
  display: inline-block;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
  margin-bottom: 14px;
}
.section-title {
  font-size: clamp(26px, 3.4vw, 38px);
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 22px 0;
  letter-spacing: -0.02em;
  .grad {
    background: linear-gradient(110deg, #2563eb, #6366f1 55%, #06b6d4);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
.tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}
.tag {
  padding: 7px 16px;
  background: rgba(37, 99, 235, 0.07);
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(37, 99, 235, 0.14);
  border-radius: 9999px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  @media (min-width: 768px) { grid-template-columns: repeat(3, 1fr); gap: 22px; }
  @media (min-width: 1024px) { grid-template-columns: repeat(6, 1fr); }
}
.card {
  position: relative;
  aspect-ratio: 9 / 16;
  border-radius: 16px;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 14px 34px -16px rgba(15, 23, 42, 0.4);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 26px 48px -18px rgba(37, 99, 235, 0.45);
    .card-play { transform: translate(-50%, -50%) scale(1.1); background: rgba(255, 255, 255, 0.34); }
    .card-img { transform: scale(1.06); }
  }
}
.card-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.card-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 42%);
}
.card-cat {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  backdrop-filter: blur(6px);
}
.card-dur {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 6px;
}
.card-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.24);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease, background 0.3s ease;
  .tri {
    width: 0; height: 0;
    margin-left: 3px;
    border-left: 13px solid #fff;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
  }
}
.card-cap {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  line-height: 1.4;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}
</style>
