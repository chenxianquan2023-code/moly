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
          <button type="button" class="btn-ghost" @click="openDemo"><span class="tri-sm"></span> 看演示</button>
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
              <img :key="currentFrame.src" :src="currentFrame.src" :alt="currentFrame.product" class="phone-video" />
            </transition>
            <div class="phone-shade"></div>
            <button type="button" class="play" aria-label="播放商品短视频演示" @click="openDemo"><span class="tri"></span></button>
            <div class="phone-caption">{{ currentFrame.caption }}</div>
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

  <Teleport to="body">
    <div v-if="demoOpen" class="demo-mask" @click.self="closeDemo">
      <div class="demo-dialog" role="dialog" aria-modal="true" aria-label="商品短视频演示预览">
        <button type="button" class="demo-close" aria-label="关闭演示" @click="closeDemo">×</button>
        <div class="demo-phone">
          <img :src="currentFrame.src" :alt="currentFrame.product" />
          <div class="demo-shade"></div>
          <div class="demo-play"><span class="tri"></span></div>
          <p>{{ currentFrame.caption }}</p>
        </div>
        <div class="demo-copy">
          <span class="demo-kicker">{{ currentFrame.category }}</span>
          <h3>{{ currentFrame.product }}</h3>
          <p>{{ currentFrame.hook }}</p>
          <ul>
            <li>自动拆解参考视频的钩子、分镜和口播节奏</li>
            <li>把商品卖点带入脚本，生成可发布的带货短视频</li>
            <li>支持 9:16 / 16:9 多比例导出</li>
          </ul>
          <div class="demo-actions">
            <button type="button" class="btn-primary" @click="useDemoForReplica">
              用它复刻 <span class="arrow">→</span>
            </button>
            <button type="button" class="demo-secondary" @click="closeDemo">继续看页面</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import thermosImg from '@/assets/img/thermos-temp-display.jpg';
import earbudsImg from '@/assets/img/erji.png';
import phoneImg from '@/assets/img/iphone.png';
import beautyImg from '@/assets/showcase-meizhuang.png';

const router = useRouter();

type DemoFrame = {
  src: string;
  product: string;
  category: string;
  caption: string;
  hook: string;
};

const frames: [DemoFrame, ...DemoFrame[]] = [
  {
    src: thermosImg,
    product: '智能温显保温杯',
    category: '家居好物',
    caption: '通勤保温杯，早八人的热水自由',
    hook: '用办公室、车载和户外三个场景拆卖点，突出温显、防漏和便携。',
  },
  {
    src: earbudsImg,
    product: '透明仓无线耳机',
    category: '数码 3C',
    caption: '开盖这一秒，桌搭氛围直接拉满',
    hook: '围绕开箱、降噪对比和通勤佩戴做快节奏短视频。',
  },
  {
    src: beautyImg,
    product: '通勤妆前急救套装',
    category: '美妆个护',
    caption: '底妆服帖，镜头前也不怕卡粉',
    hook: '前后对比、手部试色和通勤补妆镜头都适合快速复刻。',
  },
  {
    src: phoneImg,
    product: '磁吸手机支架',
    category: '手机配件',
    caption: '桌面少一根线，拍摄角度多三档',
    hook: '用桌搭、直播补光和随手拍三个场景讲清支架价值。',
  },
];
const frame = ref(0);
const demoOpen = ref(false);
const currentFrame = computed<DemoFrame>(() => frames[frame.value] ?? frames[0]);
let timer: ReturnType<typeof setInterval> | null = null;

function startReplica() {
  router.push('/studio');
}

function openDemo() {
  demoOpen.value = true;
}

function closeDemo() {
  demoOpen.value = false;
}

function useDemoForReplica() {
  const item = currentFrame.value;
  sessionStorage.setItem('moly_prefill', JSON.stringify({
    kind: 'inspiration',
    cover: item.src,
    desc: `${item.product}：${item.caption}。${item.hook}`,
  }));
  closeDemo();
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
  font-family: inherit;
  cursor: pointer;
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
  padding: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  cursor: pointer;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulsePlay 2.4s ease-in-out infinite;
  transition: transform 0.25s ease, background 0.25s ease;

  &:hover,
  &:focus-visible {
    background: rgba(255, 255, 255, 0.34);
    transform: translate(-50%, -50%) scale(1.08);
    outline: none;
  }

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

.demo-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(10px);
}

.demo-dialog {
  position: relative;
  width: min(880px, 100%);
  display: grid;
  grid-template-columns: minmax(220px, 320px) 1fr;
  gap: 28px;
  padding: 24px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 30px 80px -30px rgba(15, 23, 42, 0.55);
}

.demo-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  background: #fff;
  color: #64748b;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  z-index: 2;

  &:hover { color: #0f172a; border-color: #cbd5e1; }
}

.demo-phone {
  position: relative;
  aspect-ratio: 9 / 16;
  overflow: hidden;
  border-radius: 26px;
  background: #0f172a;
  box-shadow: 0 18px 48px -22px rgba(15, 23, 42, 0.8);

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  p {
    position: absolute;
    left: 18px;
    right: 18px;
    bottom: 20px;
    margin: 0;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.45;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
    z-index: 2;
  }
}

.demo-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, rgba(0, 0, 0, 0.68), transparent 50%),
    radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.14), transparent 34%);
}

.demo-play {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 64px;
  height: 64px;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1.5px solid rgba(255, 255, 255, 0.68);
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);

  .tri {
    width: 0;
    height: 0;
    margin-left: 4px;
    border-left: 18px solid #fff;
    border-top: 11px solid transparent;
    border-bottom: 11px solid transparent;
  }
}

.demo-copy {
  align-self: center;
  padding-right: 16px;

  h3 {
    margin: 10px 0 12px;
    color: #0f172a;
    font-size: clamp(24px, 3vw, 34px);
    line-height: 1.15;
  }

  p {
    margin: 0 0 18px;
    color: #475569;
    font-size: 16px;
    line-height: 1.7;
  }

  ul {
    display: grid;
    gap: 10px;
    margin: 0 0 24px;
    padding: 0;
    list-style: none;
  }

  li {
    position: relative;
    padding-left: 18px;
    color: #64748b;
    font-size: 14px;
    line-height: 1.55;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.7em;
      width: 6px;
      height: 6px;
      border-radius: 9999px;
      background: #2563eb;
    }
  }
}

.demo-kicker {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 9999px;
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}

.demo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.demo-secondary {
  height: 52px;
  padding: 0 22px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  color: #475569;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:hover { border-color: #cbd5e1; color: #0f172a; }
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

@media (max-width: 720px) {
  .demo-dialog {
    grid-template-columns: 1fr;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    padding: 18px;
    border-radius: 18px;
  }

  .demo-phone {
    width: min(260px, 100%);
    margin: 0 auto;
  }

  .demo-copy {
    padding: 0;
  }
}
</style>
