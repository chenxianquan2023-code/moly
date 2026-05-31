<template>
  <section class="how">
    <div class="how-inner">
      <div class="section-head" v-reveal>
        <span class="eyebrow">三步搞定</span>
        <h2 class="section-title">从商品到爆款成片，<span class="grad">最快 3 分钟</span></h2>
        <p class="section-subtitle">不用懂剪辑、不用写脚本，全程自动。</p>
      </div>

      <div class="steps">
        <div class="step-line" aria-hidden="true"></div>
        <div
          v-for="(s, i) in steps"
          :key="s.title"
          class="step"
          v-reveal="i * 120"
        >
          <div class="step-num">{{ i + 1 }}</div>
          <div class="step-card">
            <div class="step-emoji">{{ s.emoji }}</div>
            <h3 class="step-title">{{ s.title }}</h3>
            <p class="step-desc">{{ s.desc }}</p>
          </div>
        </div>
      </div>

      <div class="how-cta" v-reveal>
        <button class="btn-primary btn-glow" @click="$router.push('/studio')">
          免费开始复刻 <span class="arrow">→</span>
        </button>
        <span class="cta-hint">新用户赠送体验积分，无需信用卡</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = [
  { emoji: '🛍️', title: '上传商品', desc: '一张商品图，或贴一个参考爆款链接，即可开始。' },
  { emoji: '🤖', title: 'AI 自动复刻', desc: '拆脚本 → 配音 → 分镜 → 渲染，一条龙生成带货成片。' },
  { emoji: '🚀', title: '导出发布', desc: '多比例成片一键导出，直接发抖音 / TikTok / 视频号。' },
];
</script>

<style scoped lang="scss">
.how {
  padding: 88px 24px;
  position: relative;
  background:
    radial-gradient(60% 50% at 50% 0%, rgba(37, 99, 235, 0.06), transparent 70%);
}
.how-inner {
  max-width: 1080px;
  margin: 0 auto;
}
.section-head {
  text-align: center;
  margin-bottom: 60px;
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
  margin: 0;
}

.steps {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  @media (min-width: 860px) { grid-template-columns: repeat(3, 1fr); gap: 24px; }
}
.step-line {
  display: none;
  @media (min-width: 860px) {
    display: block;
    position: absolute;
    top: 26px;
    left: 16%;
    right: 16%;
    height: 2px;
    background: linear-gradient(90deg, #3b82f6, #6366f1, #06b6d4);
    opacity: 0.35;
  }
}
.step {
  position: relative;
  text-align: center;
}
.step-num {
  width: 52px;
  height: 52px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  font-size: 22px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px -8px rgba(37, 99, 235, 0.6);
  position: relative;
  z-index: 1;
}
.step-card {
  padding: 26px 22px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #eef2f7;
  border-radius: 18px;
  box-shadow: 0 10px 34px -18px rgba(15, 23, 42, 0.2);
  backdrop-filter: blur(8px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 22px 44px -20px rgba(37, 99, 235, 0.4);
  }
}
.step-emoji { font-size: 30px; margin-bottom: 12px; }
.step-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
.step-desc { font-size: 14px; line-height: 1.65; color: #64748b; margin: 0; }

.how-cta {
  margin-top: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 32px;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.38);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
  .arrow { transition: transform 0.25s ease; }
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(37, 99, 235, 0.46);
    .arrow { transform: translateX(4px); }
  }
}
.btn-glow::after {
  content: '';
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.28) 0%, transparent 60%);
  opacity: 0;
  transform: scale(0.5);
  transition: opacity 0.3s, transform 0.3s;
}
.btn-glow:hover::after { opacity: 1; transform: scale(1); }
.cta-hint { font-size: 13px; color: #94a3b8; }
</style>
