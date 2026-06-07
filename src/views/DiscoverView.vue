<template>
  <div class="discover">
    <header class="dh">
      <h1>找爆款</h1>
      <p>输入商品关键词，从 TikTok / Amazon 搜罗爆款 —— 可在线预览、付费下载，或一键带入复刻。</p>
    </header>

    <!-- 搜索区 -->
    <div class="search">
      <input v-model="keyword" class="kw" placeholder="商品关键词，如：保温杯 / wireless earbuds" @keyup.enter="search" />
      <div class="plats">
        <label class="plat"><input type="checkbox" v-model="plat.tiktok" /><span />TikTok</label>
        <label class="plat"><input type="checkbox" v-model="plat.amazon" /><span />Amazon</label>
      </div>
      <button class="go" :disabled="searching || !keyword.trim()" @click="search">
        <span v-if="searching" class="spin" />{{ searching ? '搜罗中…' : '搜索' }}
      </button>
    </div>

    <!-- 抓取中 -->
    <div v-if="searching" class="hint">⏳ 正在全网搜罗爆款，约 10–30 秒，请稍候…</div>

    <!-- 初始态：热门词 + 分类 + 玩法引导（搜索前展示，不再空荡荡） -->
    <div v-if="!searched && !searching" class="intro">
      <div class="market-strip">
        <div v-for="m in MARKET_METRICS" :key="m.label" class="market-metric">
          <strong>{{ m.value }}</strong>
          <span>{{ m.label }}</span>
        </div>
      </div>

      <section class="hot-row">
        <div class="section-title">
          <span class="title-mark" />
          <h2>热门搜索</h2>
        </div>
        <div class="hot-chips">
          <button v-for="k in HOT" :key="k" type="button" class="chip" @click="quick(k)">{{ k }}</button>
        </div>
      </section>

      <section class="trend-section">
        <div class="section-title">
          <span class="title-mark hot-mark" />
          <h2>今日趋势商品</h2>
          <em>按热度、平台和复刻价值预选</em>
        </div>
        <div class="trend-grid">
          <button v-for="item in TREND_ITEMS" :key="item.rank" type="button" class="trend-card" @click="quick(item.kw)">
            <span class="trend-cover">
              <img :src="item.image" :alt="item.title" loading="lazy" />
              <b>趋势 #{{ item.rank }}</b>
              <i>{{ item.market }}</i>
            </span>
            <span class="trend-body">
              <span class="trend-cat">{{ item.category }}</span>
              <strong>{{ item.title }}</strong>
              <span class="trend-stats">
                <span v-for="metric in item.metrics" :key="metric.label" class="trend-stat">
                  <b>{{ metric.value }}</b>
                  <small>{{ metric.label }}</small>
                </span>
              </span>
              <span class="trend-foot">
                <em>{{ item.signal }}</em>
                <span>搜同款</span>
              </span>
            </span>
          </button>
        </div>
      </section>

      <section class="category-section">
        <div class="section-title">
          <span class="title-mark" />
          <h2>按类目逛趋势</h2>
        </div>
        <div class="cats">
          <button v-for="c in CATS" :key="c.kw" type="button" class="cat" @click="quick(c.kw)">
            <img :src="c.image" :alt="c.name" loading="lazy" />
            <span class="cat-content">
              <strong>{{ c.name }}</strong>
              <small>{{ c.desc }}</small>
            </span>
          </button>
        </div>
      </section>

      <div class="how">
        <div v-for="step in HOW_STEPS" :key="step.no" class="how-step">
          <b>{{ step.no }}</b>
          <span>{{ step.text }}</span>
        </div>
      </div>
    </div>

    <!-- 结果 -->
    <template v-if="searched && !searching">
      <p v-if="notes.length" class="warn">{{ notes.join('；') }}</p>

      <section v-if="res.tiktok?.length" class="block">
        <h2 class="bt">TikTok 爆款视频 <em>{{ res.tiktok.length }}</em></h2>
        <div class="grid">
          <div v-for="v in res.tiktok" :key="v.sourceUrl" class="card">
            <div class="cover" @click="playVideo(v)">
              <img :src="v.cover" :alt="v.desc" loading="lazy" />
              <span class="play"><span class="tri" /></span>
              <span class="stat">
                <span><svg class="si" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.3 4.7 13a4.3 4.3 0 0 1 6-6.1l1.3 1.2 1.3-1.2a4.3 4.3 0 0 1 6 6.1Z"/></svg>{{ fmt(v.likes) }}</span>
                <span><svg class="si" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7Z"/></svg>{{ fmt(v.views) }}</span>
              </span>
            </div>
            <p class="desc" :title="v.desc">{{ v.desc || '(无描述)' }}</p>
            <span class="author">@{{ v.author }}</span>
            <div class="acts">
              <button class="dl" :disabled="busy.has(v.sourceUrl)" @click="download(v)">
                {{ busy.has(v.sourceUrl) ? '…' : '下载 5积分' }}
              </button>
              <button class="use" :disabled="busy.has(v.sourceUrl)" @click="openReplicaChoice(v)">{{ busy.has(v.sourceUrl) ? '处理中…' : '用它复刻 →' }}</button>
            </div>
          </div>
        </div>
      </section>

      <section v-if="res.amazon?.length" class="block">
        <h2 class="bt">Amazon 爆款产品 <em>{{ res.amazon.length }}</em></h2>
        <div class="grid">
          <div v-for="p in res.amazon" :key="p.sourceUrl" class="card">
            <a class="cover prod" :href="p.sourceUrl" target="_blank" rel="noopener"><img :src="p.image" :alt="p.title" loading="lazy" /></a>
            <p class="desc" :title="p.title">{{ p.title }}</p>
            <span class="author">{{ p.price }} <em v-if="p.rating">· ⭐ {{ p.rating }}</em></span>
            <div class="acts">
              <button class="use full" :disabled="busy.has(p.sourceUrl)" @click="useForReplica(p)">{{ busy.has(p.sourceUrl) ? '处理中…' : '用此商品图复刻 →' }}</button>
            </div>
          </div>
        </div>
      </section>

      <div v-if="!res.tiktok?.length && !res.amazon?.length" class="empty">没搜到爆款，换个关键词或多选个平台试试～</div>
    </template>

    <!-- 视频播放弹层：TikTok 官方内嵌播放器（免费、秒开、不下载） -->
    <div v-if="playing" class="vmask" @click.self="playing = null">
      <div class="vbox">
        <button type="button" class="vx" @click="playing = null">×</button>
        <div class="vstage">
          <iframe v-if="playing.videoId" :src="`https://www.tiktok.com/embed/v2/${playing.videoId}`"
            frameborder="0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen class="vframe"></iframe>
          <div v-else class="vfallback">该视频暂不支持内嵌，<a :href="playing.sourceUrl" target="_blank" rel="noopener">在 TikTok 打开 →</a></div>
        </div>
        <div class="vmeta">
          <p class="vdesc" :title="playing.desc">{{ playing.desc || '(无描述)' }}</p>
          <p class="vstat">
            <span><svg class="si2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.3 4.7 13a4.3 4.3 0 0 1 6-6.1l1.3 1.2 1.3-1.2a4.3 4.3 0 0 1 6 6.1Z"/></svg>{{ fmt(playing.likes) }}</span>
            <span><svg class="si2" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7Z"/></svg>{{ fmt(playing.views) }}</span>
            <span>@{{ playing.author }}</span>
          </p>
          <div class="vacts">
            <button class="use" :disabled="busy.has(playing.sourceUrl)" @click="openReplicaChoice(playing)">{{ busy.has(playing.sourceUrl) ? '处理中…' : '用它复刻 →' }}</button>
            <button class="dl" :disabled="busy.has(playing.sourceUrl)" @click="download(playing)">{{ busy.has(playing.sourceUrl) ? '…' : '下载 5积分' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 用它复刻：深度 / 轻量 选择 -->
    <div v-if="replicaChoice" class="vmask" @click.self="choosing ? null : (replicaChoice = null)">
      <div class="choice">
        <h3 class="choice-h">怎么复刻这条爆款？</h3>
        <button type="button" class="opt" :class="{ on: choosing === 'deep' }" :disabled="!!choosing" @click="useForReplica(replicaChoice, 'deep')">
          <b>深度复刻 <i>最像原片</i></b>
          <span>下载原视频 + AI 拆解它的拍法/分镜/节奏，照着拍</span>
          <em v-if="choosing === 'deep'" class="opt-load"><span class="spin" />正在下载并拆解原视频，约 30–60 秒…</em>
          <em v-else>约 30–60 秒 · 个别视频可能抓不到（会自动回退轻量）</em>
        </button>
        <button type="button" class="opt" :class="{ on: choosing === 'light' }" :disabled="!!choosing" @click="useForReplica(replicaChoice, 'light')">
          <b>轻量参考</b>
          <span>只带封面 + 文案找灵感，画面我们自己出</span>
          <em v-if="choosing === 'light'" class="opt-load"><span class="spin" />带入中…</em>
          <em v-else>秒级 · 稳定</em>
        </button>
        <button type="button" class="choice-cancel" :disabled="!!choosing" @click="replicaChoice = null">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import thermosImg from '@/assets/img/thermos-temp-display.jpg';
import earbudsImg from '@/assets/img/erji.png';
import phoneImg from '@/assets/img/iphone.png';
import phoneAltImg from '@/assets/img/iphone-2.png';
import beautyImg from '@/assets/showcase-meizhuang.png';

const router = useRouter();
const auth = useAuthStore();
const ui = useUiStore();

const keyword = ref('');
const plat = reactive({ tiktok: true, amazon: true });
const searching = ref(false);
const searched = ref(false);
const res = reactive<{ tiktok: any[]; amazon: any[] }>({ tiktok: [], amazon: [] });
const notes = ref<string[]>([]);
// 按卡片粒度的忙碌集合：某张卡在下载/复刻时只禁用它自己，不冻结整页
const busy = reactive(new Set<string>());
const playing = ref<any>(null);

const HOT = ['保温杯', 'wireless earbuds', '化妆刷', 'yoga mat', '猫咪用品', 'led 灯带', '便携风扇', 'skincare'];
const MARKET_METRICS = [
  { value: '1.8k+', label: '今日趋势素材' },
  { value: '24h', label: '热度变化追踪' },
  { value: '2 平台', label: 'TikTok / Amazon' },
];
const TREND_ITEMS = [
  {
    rank: 1,
    category: '家居好物',
    title: '带温显的便携保温杯，办公室和车载场景高频出现',
    kw: '保温杯',
    image: thermosImg,
    market: 'Amazon',
    signal: '可复刻',
    metrics: [
      { value: '4.7', label: '评分' },
      { value: '12k', label: '浏览' },
      { value: '+36%', label: '热度' },
    ],
  },
  {
    rank: 2,
    category: '数码 3C',
    title: '透明仓无线耳机，开箱镜头和降噪对比视频转化高',
    kw: 'wireless earbuds',
    image: earbudsImg,
    market: 'TikTok',
    signal: '高互动',
    metrics: [
      { value: '8.3万', label: '点赞' },
      { value: '42万', label: '播放' },
      { value: '+21%', label: '热度' },
    ],
  },
  {
    rank: 3,
    category: '美妆个护',
    title: '通勤妆前急救套装，前后对比和手部试色容易出片',
    kw: 'skincare',
    image: beautyImg,
    market: 'TikTok',
    signal: '适合短视频',
    metrics: [
      { value: '6.1万', label: '点赞' },
      { value: '18万', label: '播放' },
      { value: '+18%', label: '热度' },
    ],
  },
  {
    rank: 4,
    category: '手机配件',
    title: '磁吸支架和桌搭配件，适合做场景化卖点拆解',
    kw: 'phone accessories',
    image: phoneImg,
    market: 'Amazon',
    signal: '货架友好',
    metrics: [
      { value: '4.6', label: '评分' },
      { value: '9k', label: '浏览' },
      { value: '+14%', label: '热度' },
    ],
  },
];
const CATS = [
  { name: '家居好物', kw: 'home gadget', image: thermosImg, desc: '收纳、杯壶、氛围灯' },
  { name: '美妆个护', kw: 'beauty', image: beautyImg, desc: '试色、妆前、护肤套装' },
  { name: '数码 3C', kw: 'cool gadget', image: earbudsImg, desc: '耳机、支架、桌搭设备' },
  { name: '手机配件', kw: 'phone accessories', image: phoneAltImg, desc: '磁吸、保护壳、快充' },
  { name: '服饰穿搭', kw: 'fashion outfit', image: '/omni-model-assets/female_outfits/female_outfit_1.png', desc: '试穿、搭配、同款复刻' },
  { name: '厨房神器', kw: 'kitchen gadget', image: '/examples/poster/product-1.jpg', desc: '小家电、清洁、备餐工具' },
];
const HOW_STEPS = [
  { no: 1, text: '搜索爆款，先看平台热度和卖点' },
  { no: 2, text: '用它复刻，带入封面和文案参考' },
  { no: 3, text: '回工作台生成你的同款带货视频' },
];

function fmt(n: number) { return n >= 10000 ? (n / 10000).toFixed(1) + '万' : String(n || 0); }
function parseVid(url: string) { return (String(url || '').match(/video\/(\d+)/) || [])[1] || ''; }
function playVideo(v: any) { playing.value = { ...v, videoId: v.videoId || parseVid(v.sourceUrl) }; }
function quick(k: string) { keyword.value = k; search(); }

async function search() {
  const kw = keyword.value.trim();
  const platforms = Object.entries(plat).filter(([, on]) => on).map(([k]) => k);
  if (!kw || !platforms.length || searching.value) return;
  searching.value = true; searched.value = false; notes.value = [];
  res.tiktok = []; res.amazon = [];
  try {
    const r = await fetch('/api/discover/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userEmail: auth.email, keyword: kw, platforms }) });
    const j = await r.json();
    if (j.success) { res.tiktok = j.results.tiktok || []; res.amazon = j.results.amazon || []; notes.value = j.notes || []; }
    else notes.value = [j.message || '搜索失败'];
  } catch { notes.value = ['网络错误，请重试']; }
  finally { searching.value = false; searched.value = true; }
}

function requireLogin() {
  if (!auth.isLoggedIn) { router.push({ path: '/login', query: { redirect: '/discover' } }); return false; }
  return true;
}

async function download(v: any) {
  if (!requireLogin() || busy.has(v.sourceUrl)) return;
  busy.add(v.sourceUrl);
  try {
    const r = await fetch('/api/discover/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userEmail: auth.email, sourceUrl: v.sourceUrl }) });
    const j = await r.json();
    if (j.code === 'INSUFFICIENT') { ui.openRecharge(`积分不足：下载需 ${j.need}，当前 ${j.points}`); return; }
    if (!j.success) { alert(j.message || '下载失败'); return; }
    if (auth.email) auth.fetchPointsFromServer(auth.email);
    await blobDownload(j.videoUrl, 'tiktok-' + Date.now() + '.mp4');
  } catch { alert('网络错误，请重试'); }
  finally { busy.delete(v.sourceUrl); }
}

// 用它复刻：TikTok 先弹「深度/轻量」选择；Amazon 直接走轻量
const replicaChoice = ref<any>(null);
const choosing = ref<'deep' | 'light' | ''>('');
function openReplicaChoice(item: any) {
  if (!requireLogin()) return;
  playing.value = null;
  choosing.value = '';
  replicaChoice.value = item;
}

async function useForReplica(item: any, mode: 'deep' | 'light' = 'light') {
  if (!item || !requireLogin() || busy.has(item.sourceUrl)) return;
  choosing.value = mode;
  busy.add(item.sourceUrl);
  try {
    const r = await fetch('/api/discover/to-asset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userEmail: auth.email, item, mode }) });
    const j = await r.json();
    if (j.code === 'INSUFFICIENT') { ui.openRecharge(`积分不足：导入需 ${j.need}，当前 ${j.points}`); return; }
    if (!j.success) { alert(j.message || '处理失败'); return; }
    if (auth.email) auth.fetchPointsFromServer(auth.email);
    if (j.deepFailed) alert(j.note || '原视频没抓到，已用轻量模式继续');
    const payload = j.kind === 'inspiration'
      ? { kind: 'inspiration', cover: j.cover, desc: j.desc }
      : { kind: j.kind, asset: j.asset };
    sessionStorage.setItem('moly_prefill', JSON.stringify(payload));
    replicaChoice.value = null; playing.value = null;
    router.push('/studio');
  } catch { alert('网络错误，请重试'); }
  finally { busy.delete(item.sourceUrl); choosing.value = ''; }
}

async function blobDownload(url: string, name: string) {
  try {
    const resp = await fetch(url); const blob = await resp.blob();
    const u = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 5000);
  } catch { window.open(url, '_blank'); }
}
</script>

<style scoped lang="scss">
.discover { max-width: 1180px; margin: 0 auto; padding: 36px 28px 64px; }
.dh { margin-bottom: 24px; h1 { font-size: 28px; font-weight: 800; color:#0f172a; margin:0 0 6px; letter-spacing:-.02em; } p { color: var(--color-text-secondary); font-size: 15px; margin:0; } }

.search { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; background: rgba(255,255,255,.7); border:1px solid rgba(255,255,255,.7); padding: 14px; border-radius: var(--radius-xl); box-shadow: 0 10px 30px -18px rgba(15,23,42,.25); backdrop-filter: blur(8px); }
.kw { flex: 1; min-width: 220px; padding: 12px 16px; border:1px solid var(--color-border); border-radius: var(--radius-md); font-size: 15px; background:#fff; &:focus { outline:none; border-color: var(--color-primary); box-shadow:0 0 0 3px rgba(37,99,235,.12); } }
.plats { display: flex; gap: 14px; }
.plat { display:flex; align-items:center; gap:7px; font-size:14px; font-weight:600; color: var(--color-text-secondary); cursor:pointer; user-select:none;
  input { display:none; }
  span { width:18px; height:18px; border-radius:6px; border:1.5px solid var(--color-border-muted); position:relative; transition:all var(--transition-fast); }
  input:checked + span { background: linear-gradient(135deg,#2563eb,#4f46e5); border-color:transparent; &::after { content:'✓'; position:absolute; inset:0; color:#fff; font-size:12px; display:flex; align-items:center; justify-content:center; } }
}
.go { display:flex; align-items:center; gap:8px; height:46px; padding:0 28px; border:none; border-radius:var(--radius-md); background: linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-size:15px; font-weight:700; cursor:pointer; box-shadow:0 8px 22px -8px rgba(37,99,235,.5); &:disabled { opacity:.5; cursor:default; } }
.spin { width:15px; height:15px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .8s linear infinite; }

.hint { margin: 28px 0; text-align:center; color: var(--color-text-secondary); font-size:15px; }
.warn { margin: 16px 0 0; font-size: 13px; color: var(--color-warning); }
.empty { margin: 48px 0; text-align:center; color: var(--color-text-tertiary); }

/* 初始态 */
.intro { margin-top: 22px; display:flex; flex-direction:column; gap:22px; }
.market-strip { display:grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap:10px; }
.market-metric { padding:14px 16px; border:1px solid #e5e8ef; border-radius:12px; background:rgba(255,255,255,.82);
  strong { display:block; margin-bottom:3px; font-size:18px; color:#111827; }
  span { font-size:12px; font-weight:700; color:#697386; }
}
.hot-row { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.section-title { display:flex; align-items:center; gap:9px; min-width:0;
  h2 { margin:0; font-size:17px; font-weight:800; color:#111827; }
  em { font-style:normal; font-size:12px; font-weight:700; color:#7a8495; }
}
.title-mark { width:3px; height:15px; border-radius:999px; background:#3158e8; flex:none; }
.hot-mark { background:#d9487f; }
.hot-chips { display:flex; gap:9px; flex-wrap:wrap; }
.chip { padding:7px 15px; border-radius:999px; border:1px solid #dde3ee; background:#fff; font-size:13px; font-weight:700; color:#596273; cursor:pointer; transition:all var(--transition-fast);
  &:hover { border-color:#3158e8; color:#3158e8; transform:translateY(-1px); box-shadow:0 8px 18px -14px rgba(49,88,232,.75); } }
.trend-section, .category-section { display:flex; flex-direction:column; gap:14px; }
.trend-grid { display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:14px;
  @media (min-width:1080px){ grid-template-columns: repeat(4,minmax(0,1fr)); } }
.trend-card { min-width:0; overflow:hidden; padding:0; border:1px solid #e8edf5; border-radius:16px; background:#fff; text-align:left; cursor:pointer; box-shadow:0 10px 30px -24px rgba(15,23,42,.45); transition:transform .22s ease, box-shadow .22s ease, border-color .22s ease;
  &:hover { transform:translateY(-3px); border-color:#cbd7ff; box-shadow:0 18px 36px -24px rgba(49,88,232,.55); }
}
.trend-cover { position:relative; display:block; height:146px; overflow:hidden; background:#eef2f7;
  img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .28s ease; }
  b, i { position:absolute; z-index:1; font-style:normal; font-size:12px; font-weight:800; }
  b { top:10px; left:10px; padding:5px 9px; border-radius:999px; background:rgba(17,24,39,.82); color:#fff; }
  i { right:10px; bottom:10px; padding:6px 9px; border-radius:9px; background:rgba(255,255,255,.92); color:#111827; }
}
.trend-card:hover .trend-cover img { transform:scale(1.04); }
.trend-body { display:flex; flex-direction:column; gap:10px; padding:14px; }
.trend-cat { font-size:12px; font-weight:800; color:#697386; }
.trend-body > strong { min-height:42px; font-size:14px; line-height:1.45; color:#111827; }
.trend-stats { display:grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap:7px; }
.trend-stat { padding:8px 6px; border-radius:10px; background:#f7f8fb; text-align:center;
  b { display:block; margin-bottom:2px; font-size:13px; color:#111827; }
  small { display:block; font-size:11px; font-weight:700; color:#7a8495; }
}
.trend-foot { display:flex; align-items:center; justify-content:space-between; gap:8px;
  em { padding:6px 9px; border-radius:999px; background:#eefbf5; color:#10a56b; font-size:12px; font-style:normal; font-weight:800; }
  span { padding:7px 10px; border:1px solid #dfe4ee; border-radius:10px; color:#25324a; font-size:12px; font-weight:800; }
}
.cats { display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:12px;
  @media (min-width:760px){ grid-template-columns: repeat(3,minmax(0,1fr)); }
  @media (min-width:1080px){ grid-template-columns: repeat(6,minmax(0,1fr)); } }
.cat { position:relative; min-height:132px; overflow:hidden; border:1px solid #e7ebf3; border-radius:14px; background:#fff; padding:12px; cursor:pointer; text-align:left; transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.3; }
  &::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.96)); }
  &:hover { transform:translateY(-3px); border-color:#cbd7ff; box-shadow:0 14px 28px -20px rgba(49,88,232,.45); }
}
.cat-content { position:relative; z-index:1; min-height:108px; display:flex; flex-direction:column; justify-content:flex-end;
  strong { margin-bottom:7px; font-size:15px; font-weight:850; color:#111827; }
  small { color:#657084; font-size:12px; line-height:1.4; font-weight:700; }
}
.how { display:flex; flex-wrap:wrap; gap:10px; padding:14px; border-radius:14px; background:#fff; border:1px solid #e6ebf4; }
.how-step { display:flex; align-items:center; gap:9px; flex:1; min-width:210px; font-size:13px; color:#697386; font-weight:700;
  b { width:24px; height:24px; flex:none; border-radius:50%; background:#3158e8; color:#fff; font-size:13px; display:flex; align-items:center; justify-content:center; }
}

.block { margin-top: 30px; }
.bt { font-size: 17px; font-weight: 800; color:#0f172a; margin: 0 0 14px; em { font-style:normal; font-size:13px; font-weight:600; color: var(--color-text-tertiary); margin-left:4px; } }
.grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; @media (min-width:680px){ grid-template-columns: repeat(3,1fr); } @media (min-width:1000px){ grid-template-columns: repeat(4,1fr); } }
.card { min-width:0; display:flex; flex-direction:column; gap:6px; background: rgba(255,255,255,.8); border:1px solid #eef2f7; border-radius: var(--radius-lg); padding: 10px; box-shadow:0 8px 24px -16px rgba(15,23,42,.2); transition: transform .25s ease, box-shadow .25s ease; &:hover { transform: translateY(-4px); box-shadow:0 18px 36px -18px rgba(37,99,235,.35); } }
.cover { position:relative; display:block; aspect-ratio: 9/16; border-radius: var(--radius-md); overflow:hidden; background:#0f172a; cursor:pointer;
  &.prod { aspect-ratio: 1/1; background:#f5f7fa; }
  img { width:100%; height:100%; object-fit:cover; }
  .play { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,.25); border:1.5px solid rgba(255,255,255,.6); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center;
    .tri { width:0; height:0; margin-left:3px; border-left:12px solid #fff; border-top:7px solid transparent; border-bottom:7px solid transparent; } }
  .stat { position:absolute; left:6px; bottom:6px; display:flex; align-items:center; gap:8px; font-size:11px; font-weight:600; color:#fff; background:rgba(0,0,0,.5); padding:3px 8px; border-radius:6px;
    span { display:inline-flex; align-items:center; gap:3px; }
    .si { width:11px; height:11px; }
  }
}
.desc { font-size:13px; color: var(--color-text-primary); line-height:1.4; margin:2px 0 0; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.author { font-size:11px; color: var(--color-text-tertiary); em { font-style:normal; color:#f59e0b; } }
.acts { display:flex; gap:8px; margin-top:6px; }
.dl, .use { flex:1; padding:8px; border-radius: var(--radius-md); font-size:12px; font-weight:600; cursor:pointer; border:1px solid var(--color-border); background:#fff; color: var(--color-text-primary); transition:all var(--transition-fast); &:disabled { opacity:.5; } &:hover:not(:disabled) { border-color: var(--color-primary); } }
.use { background: linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; border:none; &.full { flex:1; } }

/* 播放弹层 */
.vmask { position:fixed; inset:0; background:rgba(15,23,42,.62); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:200; padding:20px; }
.vbox { position:relative; width:100%; max-width:760px; background:#fff; border-radius: var(--radius-2xl); overflow:hidden; box-shadow: var(--shadow-xl); display:flex; flex-direction:column; max-height:92vh;
  @media (min-width:720px){ flex-direction:row; } }
.vx { position:absolute; top:10px; right:12px; z-index:3; width:32px; height:32px; border:none; border-radius:50%; background:rgba(15,23,42,.55); color:#fff; font-size:20px; line-height:1; cursor:pointer; }
.vstage { flex:1; background:#000; min-height:420px; display:flex; align-items:center; justify-content:center;
  @media (min-width:720px){ width:340px; flex:none; } }
.vframe { width:100%; height:100%; min-height:540px; border:0; }
.vfallback { color:#cbd5e1; font-size:14px; padding:30px; text-align:center; a { color:#93c5fd; } }
.vmeta { padding:18px; display:flex; flex-direction:column; gap:10px; @media (min-width:720px){ width:300px; flex-shrink:0; justify-content:center; } }
.vdesc { margin:0; font-size:14px; line-height:1.55; color: var(--color-text-primary); display:-webkit-box; -webkit-line-clamp:5; line-clamp:5; -webkit-box-orient:vertical; overflow:hidden; }
.vstat { margin:0; display:flex; flex-wrap:wrap; align-items:center; gap:10px; font-size:12px; color: var(--color-text-tertiary);
  span { display:inline-flex; align-items:center; gap:4px; }
  .si2 { width:13px; height:13px; }
}
.vacts { display:flex; gap:10px; margin-top:6px; .use, .dl { padding:11px; font-size:13px; } }

/* 手机端：减小内边距、按钮文字不换行、弹层适配 */
@media (max-width: 640px) {
  .discover { padding: 22px 14px 48px; }
  .dh { margin-bottom:18px; h1 { font-size:24px; } p { font-size:14px; } }
  .search { padding:12px; gap:10px; }
  .market-strip { grid-template-columns: 1fr; }
  .hot-row { align-items:flex-start; }
  .section-title { flex-wrap:wrap; em { width:100%; padding-left:12px; } }
  .trend-grid { grid-template-columns: 1fr; }
  .cats { grid-template-columns: repeat(2,1fr); }
  .acts { gap:6px; }
  .dl, .use { padding:9px 4px; font-size:11px; white-space:nowrap; }
  .vbox { flex-direction:column; max-height:90vh; }
  .vstage { width:100%; min-height:0; aspect-ratio:9/16; max-height:62vh; }
  .vframe { min-height:0; height:100%; }
  .vmeta { width:100%; }
}

/* 用它复刻：深度/轻量 选择弹层 */
.choice { width:100%; max-width:420px; background:#fff; border-radius: var(--radius-2xl); box-shadow: var(--shadow-xl); padding:22px; display:flex; flex-direction:column; gap:12px; }
.choice-h { margin:0 0 4px; font-size:18px; font-weight:800; color:#0f172a; text-align:center; }
.opt { text-align:left; display:flex; flex-direction:column; gap:4px; padding:14px 16px; border:1.5px solid var(--color-border); border-radius: var(--radius-lg); background:#fff; cursor:pointer; transition:all var(--transition-fast);
  b { font-size:15px; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:8px; i { font-style:normal; font-size:11px; font-weight:700; color:#fff; background:linear-gradient(135deg,#2563eb,#4f46e5); padding:2px 8px; border-radius:999px; } }
  span { font-size:13px; color: var(--color-text-secondary); line-height:1.5; }
  em { font-style:normal; font-size:12px; color: var(--color-text-tertiary); }
  &:hover:not(:disabled) { border-color: var(--color-primary); background: rgba(37,99,235,.04); transform: translateY(-1px); }
  &.on { border-color: var(--color-primary); background: rgba(37,99,235,.06); }
  &:disabled { opacity:.7; cursor:default; }
}
.opt-load { display:inline-flex; align-items:center; gap:7px; color: var(--color-primary) !important; font-weight:600;
  .spin { width:13px; height:13px; border:2px solid rgba(37,99,235,.3); border-top-color: var(--color-primary); border-radius:50%; animation: spin .8s linear infinite; } }
.choice-cancel { margin-top:2px; padding:10px; border:none; background:none; font-size:13px; color: var(--color-text-tertiary); cursor:pointer; &:hover:not(:disabled){ color: var(--color-text-secondary); } &:disabled{ opacity:.5; } }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
