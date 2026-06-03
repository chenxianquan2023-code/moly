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
        <button
          v-for="(item, i) in items"
          :key="item.product"
          type="button"
          class="card"
          v-reveal="(i % 3) * 90"
          @click="openPreview(item)"
        >
          <img :src="item.url" :alt="item.product" class="card-img" loading="lazy" @error="onImgError" />
          <div class="card-shade"></div>
          <span class="card-cat">{{ item.cat }}</span>
          <span class="card-dur">0:15</span>
          <div class="card-play"><span class="tri"></span></div>
          <p class="card-cap">{{ item.cap }}</p>
        </button>
      </div>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="activeItem" class="preview-mask" @click.self="closePreview">
      <div class="preview-dialog" role="dialog" aria-modal="true" aria-label="成片案例预览">
        <button type="button" class="preview-close" aria-label="关闭预览" @click="closePreview">×</button>
        <div class="preview-cover">
          <img :src="activeItem.url" :alt="activeItem.product" />
          <div class="preview-shade"></div>
          <div class="preview-play"><span class="tri"></span></div>
          <span class="preview-cat">{{ activeItem.cat }}</span>
          <p>{{ activeItem.cap }}</p>
        </div>
        <div class="preview-copy">
          <span class="eyebrow mini">案例预览</span>
          <h3>{{ activeItem.product }}</h3>
          <p>{{ activeItem.pitch }}</p>
          <div class="preview-points">
            <span v-for="point in activeItem.points" :key="point">{{ point }}</span>
          </div>
          <div class="preview-actions">
            <button type="button" class="use-btn" @click="useForReplica(activeItem)">用它复刻 →</button>
            <button type="button" class="ghost-btn" @click="closePreview">再看看其他案例</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import thermosImg from '@/assets/img/thermos-temp-display.jpg';
import earbudsImg from '@/assets/img/erji.png';
import phoneImg from '@/assets/img/iphone.png';
import phoneAltImg from '@/assets/img/iphone-2.png';
import imgMeizhuang from '@/assets/showcase-meizhuang.png';

type ShowcaseItem = {
  url: string;
  cat: string;
  product: string;
  cap: string;
  pitch: string;
  points: string[];
};

const router = useRouter();
const activeItem = ref<ShowcaseItem | null>(null);

const tags = ['家居好物', '数码 3C', '美妆个护', '手机配件', '食品生鲜', '桌搭好物'];

const items: ShowcaseItem[] = [
  {
    url: thermosImg,
    cat: '家居好物',
    product: '智能温显保温杯',
    cap: '通勤保温杯，早八人的热水自由',
    pitch: '用办公室、车载和户外三个镜头拆解卖点，突出温显、防漏、保温时长。',
    points: ['场景开头', '温显特写', '防漏测试'],
  },
  {
    url: earbudsImg,
    cat: '数码 3C',
    product: '透明仓无线耳机',
    cap: '开盖这一秒，桌搭氛围直接拉满',
    pitch: '从开箱手感切入，接降噪对比和通勤佩戴镜头，适合快节奏种草。',
    points: ['开箱镜头', '降噪对比', '通勤佩戴'],
  },
  {
    url: '/examples/poster/product-3.jpg',
    cat: '美妆个护',
    product: '夏日补水精华液',
    cap: '夏天妆前补水，一瓶拍出清透感',
    pitch: '用肤感、质地和上妆前后对比做短视频，强化清爽、保湿和不黏腻。',
    points: ['质地展示', '妆前对比', '价格钩子'],
  },
  {
    url: phoneImg,
    cat: '手机配件',
    product: '磁吸手机支架',
    cap: '桌面少一根线，拍摄角度多三档',
    pitch: '围绕桌搭、直播补光和随手拍三个场景，讲清支架的使用价值。',
    points: ['桌搭改造', '磁吸特写', '角度切换'],
  },
  {
    url: '/examples/poster/product-1.jpg',
    cat: '食品生鲜',
    product: '麻辣小龙虾尾',
    cap: '夜宵镜头一出，食欲感马上起来',
    pitch: '用开袋、加热和成品装盘三个镜头制造食欲感，适合直播间切片。',
    points: ['开袋特写', '加热过程', '装盘收尾'],
  },
  {
    url: phoneAltImg,
    cat: '桌搭好物',
    product: '手机桌面收纳套装',
    cap: '桌面干净了，拍摄画面也高级了',
    pitch: '从凌乱桌面到成品桌搭，制造强对比，适合配合带货口播。',
    points: ['前后对比', '收纳卖点', '成片桌搭'],
  },
];

function openPreview(item: ShowcaseItem) {
  activeItem.value = item;
}

function closePreview() {
  activeItem.value = null;
}

function useForReplica(item: ShowcaseItem) {
  sessionStorage.setItem('moly_prefill', JSON.stringify({
    kind: 'inspiration',
    cover: item.url,
    desc: `${item.product}：${item.cap}。${item.pitch}`,
  }));
  closePreview();
  router.push('/studio');
}

function onImgError(e: Event) {
  const el = e.target as HTMLImageElement;
  if (!el || el.dataset.fallback === '1') return;
  el.src = imgMeizhuang;
  el.dataset.fallback = '1';
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
  padding: 0;
  border: 0;
  border-radius: 16px;
  overflow: hidden;
  background: #0f172a;
  box-shadow: 0 14px 34px -16px rgba(15, 23, 42, 0.4);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 26px 48px -18px rgba(37, 99, 235, 0.45);
    .card-play { transform: translate(-50%, -50%) scale(1.1); background: rgba(255, 255, 255, 0.34); }
    .card-img { transform: scale(1.06); }
  }
  &:focus-visible {
    outline: 3px solid rgba(37, 99, 235, 0.35);
    outline-offset: 3px;
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

.preview-mask {
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

.preview-dialog {
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

.preview-close {
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
  z-index: 3;

  &:hover { color: #0f172a; border-color: #cbd5e1; }
}

.preview-cover {
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

.preview-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent 50%),
    radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.14), transparent 34%);
}

.preview-play {
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

.preview-cat {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;
  padding: 5px 11px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(8px);
}

.preview-copy {
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
}

.mini {
  margin-bottom: 0;
  letter-spacing: 0.04em;
}

.preview-points {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;

  span {
    padding: 7px 11px;
    border-radius: 9999px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #475569;
    font-size: 13px;
    font-weight: 700;
  }
}

.preview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.use-btn,
.ghost-btn {
  height: 48px;
  padding: 0 22px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.use-btn {
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.32);

  &:hover { transform: translateY(-1px); }
}

.ghost-btn {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;

  &:hover { border-color: #cbd5e1; color: #0f172a; }
}

@media (max-width: 720px) {
  .preview-dialog {
    grid-template-columns: 1fr;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    padding: 18px;
    border-radius: 18px;
  }

  .preview-cover {
    width: min(260px, 100%);
    margin: 0 auto;
  }

  .preview-copy {
    padding: 0;
  }
}
</style>
