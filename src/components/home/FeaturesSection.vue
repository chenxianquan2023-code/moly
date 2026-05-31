<template>
  <section class="features">
    <div class="features-inner">
      <div class="section-head" v-reveal>
        <span class="eyebrow">核心能力</span>
        <h2 class="section-title">复刻一条爆款，<span class="grad">AI 全包了</span></h2>
        <p class="section-subtitle">从拆解到成片，每一步自动完成——你只管挑商品。</p>
      </div>
      <div class="cards">
        <div
          v-for="(c, i) in cards"
          :key="c.title"
          class="card"
          v-reveal="i * 90"
        >
          <div class="card-icon" :style="{ background: c.bg }">{{ c.icon }}</div>
          <h3 class="card-title">{{ c.title }}</h3>
          <p class="card-desc">{{ c.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const cards = [
  { icon: '🎬', title: '智能拆解爆款', desc: '上传商品或参考爆款，AI 自动还原脚本结构、节奏与卖点。', bg: 'linear-gradient(135deg,#3b82f6,#6366f1)' },
  { icon: '🎙️', title: '多音色 AI 配音', desc: '14+ 真人级音色（元气女友 / 北京小爷 / 猴哥…），带货口播一键生成。', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { icon: '🎞️', title: '自动分镜运镜', desc: '镜头脚本到画面一气呵成，产品镜 + 真人镜智能编排。', bg: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
  { icon: '📐', title: '多平台导出', desc: '9:16 / 16:9 自适配，直出抖音、TikTok、视频号。', bg: 'linear-gradient(135deg,#2563eb,#06b6d4)' },
];
</script>

<style scoped lang="scss">
.features {
  padding: 88px 24px;
}
.features-inner {
  max-width: 1280px;
  margin: 0 auto;
}
.section-head {
  text-align: center;
  margin-bottom: 56px;
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
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
  .grad {
    background: linear-gradient(110deg, #2563eb, #6366f1 55%, #06b6d4);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
.section-subtitle {
  font-size: 17px;
  color: #64748b;
  margin: 0 auto;
  max-width: 540px;
}
.cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 22px;
  @media (min-width: 640px) { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1024px) { grid-template-columns: repeat(4, 1fr); }
}
.card {
  padding: 30px 26px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid #eef2f7;
  border-radius: 20px;
  box-shadow: 0 8px 30px -16px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(8px);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  &:hover {
    transform: translateY(-6px);
    border-color: #c7d2fe;
    box-shadow: 0 22px 44px -18px rgba(37, 99, 235, 0.4);
  }
}
.card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 18px;
  box-shadow: 0 8px 18px -6px rgba(37, 99, 235, 0.5);
}
.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}
.card-desc {
  font-size: 14px;
  line-height: 1.65;
  color: #64748b;
  margin: 0;
}
</style>
