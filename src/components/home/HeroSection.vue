<template>
  <section class="hero">
    <!-- 极光渐变背景（守住白/蓝，仅做光感，不改色系） -->
    <div class="hero-aurora" aria-hidden="true">
      <span class="blob blob-1"></span>
      <span class="blob blob-2"></span>
      <span class="blob blob-3"></span>
      <span class="grid-overlay"></span>
    </div>

    <div class="hero-inner">
      <div class="hero-text">
        <div class="hero-badge">
          <span class="badge-dot"></span> AI 爆款视频复刻引擎
        </div>
        <h1 class="hero-title">
          把<span class="grad">爆款短视频</span><br />
          一键复刻成你的带货片
        </h1>
        <p class="hero-subtitle">
          上传商品，AI 自动拆解爆款的脚本 · 分镜 · 运镜 · 配音，
          几分钟产出可直接发布的带货短视频。
        </p>
        <div class="hero-cta">
          <button class="btn-primary btn-glow" @click="startReplica">
            免费开始复刻 <span class="arrow">→</span>
          </button>
          <a href="#showcase" class="btn-ghost"><span class="tri-sm"></span> 看演示</a>
        </div>
        <ul class="hero-stats">
          <li><strong>~3 分钟</strong><span>复刻一条成片</span></li>
          <li><strong>14+ 音色</strong><span>多风格 AI 配音</span></li>
          <li><strong>9:16 / 16:9</strong><span>多平台比例</span></li>
        </ul>
      </div>

      <div class="hero-preview">
        <!-- 竖屏成片 mockup -->
        <div class="phone">
          <div class="phone-notch"></div>
          <div class="phone-screen">
            <transition name="fade-frame" mode="out-in">
              <img :key="frame" :src="frames[frame]" alt="复刻成片预览" class="phone-video" />
            </transition>
            <div class="phone-shade"></div>
            <div class="play"><span class="tri"></span></div>
            <div class="phone-caption">🔥 这款真的绝了，手慢就没～</div>
            <div class="phone-progress"><span></span></div>
          </div>
        </div>
        <!-- 浮动玻璃步骤卡 -->
        <div class="chip chip-script"><span class="ic">📝</span> 脚本已生成</div>
        <div class="chip chip-voice"><span class="ic">🎙️</span> 配音 · 元气女友</div>
        <div class="chip chip-done"><span class="ic">✨</span> 成片就绪</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 复用既有图片资源，循环切换以模拟"成片在播"
const frames = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop',
];
const frame = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

function startReplica() {
  router.push('/studio');
}

onMounted(() => {
  timer = setInterval(() => {
    frame.value = (frame.value + 1) % frames.length;
  }, 2600);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped lang="scss">
.hero {
  position: relative;
  padding: 120px 24px 88px;
  min-height: 92vh;
  display: flex;
  align-items: center;
  overflow: hidden;
}

/* ───── 极光背景 ───── */
.hero-aurora {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;

  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.55;
    will-change: transform;
  }
  .blob-1 {
    width: 520px; height: 520px;
    top: -120px; left: -80px;
    background: radial-gradient(circle, #3b82f6, transparent 70%);
    animation: float1 14s ease-in-out infinite;
  }
  .blob-2 {
    width: 460px; height: 460px;
    top: 40px; right: -100px;
    background: radial-gradient(circle, #6366f1, transparent 70%);
    animation: float2 18s ease-in-out infinite;
  }
  .blob-3 {
    width: 420px; height: 420px;
    bottom: -160px; left: 38%;
    background: radial-gradient(circle, #06b6d4, transparent 70%);
    opacity: 0.4;
    animation: float1 16s ease-in-out infinite reverse;
  }
  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(37, 99, 235, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(37, 99, 235, 0.05) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 75%);
  }
}

@keyframes float1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -30px) scale(1.08); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-50px, 30px) scale(1.1); }
}

.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 56px;
  align-items: center;
  @media (min-width: 1024px) {
    grid-template-columns: 1.05fr 0.95fr;
  }
}

/* ───── 文案 ───── */
.hero-text {
  > * {
    opacity: 0;
    animation: fadeUp 0.7s ease forwards;
  }
  .hero-badge { animation-delay: 0.05s; }
  .hero-title { animation-delay: 0.15s; }
  .hero-subtitle { animation-delay: 0.28s; }
  .hero-cta { animation-delay: 0.4s; }
  .hero-stats { animation-delay: 0.52s; }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  margin-bottom: 22px;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 9999px;
  backdrop-filter: blur(6px);

  .badge-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #2563eb;
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.5);
    animation: pulseDot 2s infinite;
  }
}
@keyframes pulseDot {
  0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.5); }
  70% { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0); }
  100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
}

.hero-title {
  font-family: 'PingFang SC', 'Inter', -apple-system, sans-serif;
  font-size: clamp(34px, 5.2vw, 60px);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
  line-height: 1.14;
  margin: 0 0 22px 0;

  .grad {
    background: linear-gradient(110deg, #2563eb 10%, #6366f1 45%, #06b6d4 90%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shine 5s linear infinite;
  }
}
@keyframes shine {
  to { background-position: 200% center; }
}

.hero-subtitle {
  font-size: 18px;
  color: #64748b;
  line-height: 1.7;
  margin: 0 0 32px 0;
  max-width: 500px;
}

.hero-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 30px;
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

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 52px;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.7);
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-decoration: none;
  backdrop-filter: blur(6px);
  transition: all 0.25s ease;
  &:hover { border-color: #c7d2fe; background: #fff; transform: translateY(-2px); }

  .tri-sm {
    width: 0; height: 0;
    border-left: 9px solid #2563eb;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
  }
}

.hero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  margin: 40px 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    flex-direction: column;
    strong {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.01em;
    }
    span { font-size: 13px; color: #94a3b8; margin-top: 2px; }
  }
}

/* ───── 右侧成片 mockup ───── */
.hero-preview {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 540px;
  animation: fadeUp 0.8s ease 0.3s forwards;
  opacity: 0;
}

.phone {
  position: relative;
  width: 280px;
  height: 540px;
  border-radius: 40px;
  padding: 10px;
  background: linear-gradient(160deg, #1e293b, #0f172a);
  box-shadow:
    0 40px 80px -20px rgba(37, 99, 235, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  animation: floatPhone 6s ease-in-out infinite;
}
@keyframes floatPhone {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-14px) rotate(-1deg); }
}

.phone-notch {
  position: absolute;
  top: 10px; left: 50%;
  transform: translateX(-50%);
  width: 110px; height: 22px;
  background: #0f172a;
  border-radius: 0 0 14px 14px;
  z-index: 3;
}

.phone-screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 30px;
  overflow: hidden;
  background: #000;
}

.phone-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fade-frame-enter-active, .fade-frame-leave-active { transition: opacity 0.6s ease; }
.fade-frame-enter-from, .fade-frame-leave-to { opacity: 0; }

.phone-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 38%);
}

.play {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 60px; height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulsePlay 2.4s ease-in-out infinite;

  .tri {
    width: 0; height: 0;
    margin-left: 4px;
    border-left: 18px solid #fff;
    border-top: 11px solid transparent;
    border-bottom: 11px solid transparent;
  }
}
@keyframes pulsePlay {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
  50% { box-shadow: 0 0 0 14px rgba(255,255,255,0); }
}

.phone-caption {
  position: absolute;
  left: 16px; right: 16px; bottom: 30px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
  z-index: 2;
}
.phone-progress {
  position: absolute;
  left: 16px; right: 16px; bottom: 18px;
  height: 3px;
  border-radius: 2px;
  background: rgba(255,255,255,0.3);
  overflow: hidden;
  z-index: 2;
  span {
    display: block;
    height: 100%;
    width: 40%;
    border-radius: 2px;
    background: #fff;
    animation: progress 2.6s linear infinite;
  }
}
@keyframes progress {
  0% { width: 8%; }
  100% { width: 96%; }
}

/* 浮动玻璃步骤卡 */
.chip {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 15px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  box-shadow: 0 12px 30px -8px rgba(37, 99, 235, 0.28);
  backdrop-filter: blur(12px);
  z-index: 4;
  .ic { font-size: 15px; }
}
.chip-script {
  top: 64px; left: -8px;
  animation: floatChip 5s ease-in-out infinite;
}
.chip-voice {
  top: 50%; right: -24px;
  animation: floatChip 5.6s ease-in-out 0.4s infinite;
}
.chip-done {
  bottom: 70px; left: -16px;
  color: #2563eb;
  animation: floatChip 5.2s ease-in-out 0.8s infinite;
}
@keyframes floatChip {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
  .hero-text > *, .hero-preview { opacity: 1 !important; }
}

@media (max-width: 1023px) {
  .hero { padding-top: 116px; min-height: auto; }
  .hero-preview { min-height: 480px; margin-top: 8px; }
  .chip-voice { right: 0; }
}
</style>
