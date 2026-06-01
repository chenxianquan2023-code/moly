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
      <div class="hot">
        <span class="hot-label">热门搜索</span>
        <div class="hot-chips">
          <button v-for="k in HOT" :key="k" type="button" class="chip" @click="quick(k)">{{ k }}</button>
        </div>
      </div>
      <div class="cats">
        <button v-for="c in CATS" :key="c.kw" type="button" class="cat" @click="quick(c.kw)">
          <span class="cat-ic" v-html="c.icon" /><span class="cat-name">{{ c.name }}</span>
        </button>
      </div>
      <div class="how">
        <div class="how-step"><b>1</b><span>搜索爆款，在线预览点赞 / 浏览数据</span></div>
        <div class="how-step"><b>2</b><span>「用它复刻」秒级带入封面 + 文案做参考</span></div>
        <div class="how-step"><b>3</b><span>回工作台一键生成你的同款带货视频</span></div>
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
              <button class="use" :disabled="busy.has(v.sourceUrl)" @click="useForReplica(v)">{{ busy.has(v.sourceUrl) ? '处理中…' : '用它复刻 →' }}</button>
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
            <button class="use" :disabled="busy.has(playing.sourceUrl)" @click="useForReplica(playing)">{{ busy.has(playing.sourceUrl) ? '处理中…' : '用它复刻 →' }}</button>
            <button class="dl" :disabled="busy.has(playing.sourceUrl)" @click="download(playing)">{{ busy.has(playing.sourceUrl) ? '…' : '下载 5积分' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';

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
// 用极简线性图标替代 emoji，去掉「AI 模板感」
const SVG = (inner: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const CATS = [
  { name: '家居好物', kw: 'home gadget', icon: SVG('<path d="M4 11 12 4l8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>') },
  { name: '美妆个护', kw: 'beauty', icon: SVG('<path d="M12 3.5c2.8 3.2 5.5 6.3 5.5 9.5a5.5 5.5 0 0 1-11 0c0-3.2 2.7-6.3 5.5-9.5Z"/>') },
  { name: '数码 3C', kw: 'cool gadget', icon: SVG('<path d="M5 13v-1a7 7 0 0 1 14 0v1"/><rect x="3.5" y="13" width="4" height="7" rx="1.6"/><rect x="16.5" y="13" width="4" height="7" rx="1.6"/>') },
  { name: '宠物用品', kw: 'pet supplies', icon: SVG('<circle cx="6.5" cy="12" r="1.5"/><circle cx="9.8" cy="8" r="1.5"/><circle cx="14.2" cy="8" r="1.5"/><circle cx="17.5" cy="12" r="1.5"/><path d="M8.5 16.5c0-2 1.6-3.3 3.5-3.3s3.5 1.3 3.5 3.3-1.6 3-3.5 3-3.5-1-3.5-3Z"/>') },
  { name: '运动健身', kw: 'fitness gear', icon: SVG('<path d="M7 9v6M17 9v6M4.5 10.5v3M19.5 10.5v3M7 12h10"/>') },
  { name: '厨房神器', kw: 'kitchen gadget', icon: SVG('<path d="M6.5 13.2a3.5 3.5 0 0 1-.3-6.7 3.7 3.7 0 0 1 6.3-1.6 3.7 3.7 0 0 1 6.3 1.6 3.5 3.5 0 0 1-.3 6.7Z"/><path d="M8 13.2V19h8v-5.8"/>') },
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
    const r = await fetch('/api/discover/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword: kw, platforms }) });
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

async function useForReplica(item: any) {
  if (!requireLogin() || busy.has(item.sourceUrl)) return;
  busy.add(item.sourceUrl);
  try {
    const r = await fetch('/api/discover/to-asset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userEmail: auth.email, item }) });
    const j = await r.json();
    if (j.code === 'INSUFFICIENT') { ui.openRecharge(`积分不足：导入需 ${j.need}，当前 ${j.points}`); return; }
    if (!j.success) { alert(j.message || '处理失败'); return; }
    if (auth.email) auth.fetchPointsFromServer(auth.email);
    const payload = j.kind === 'inspiration'
      ? { kind: 'inspiration', cover: j.cover, desc: j.desc }
      : { kind: j.kind, asset: j.asset };
    sessionStorage.setItem('moly_prefill', JSON.stringify(payload));
    playing.value = null;
    router.push('/studio');
  } catch { alert('网络错误，请重试'); }
  finally { busy.delete(item.sourceUrl); }
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
.intro { margin-top: 26px; display:flex; flex-direction:column; gap:24px; }
.hot { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.hot-label { display:inline-flex; align-items:center; gap:8px; font-size:14px; font-weight:700; color:#0f172a; flex-shrink:0; &::before { content:''; width:3px; height:14px; border-radius:2px; background: linear-gradient(180deg,#2563eb,#4f46e5); } }
.hot-chips { display:flex; gap:9px; flex-wrap:wrap; }
.chip { padding:7px 15px; border-radius:999px; border:1px solid var(--color-border); background:rgba(255,255,255,.8); font-size:13px; font-weight:600; color: var(--color-text-secondary); cursor:pointer; transition:all var(--transition-fast);
  &:hover { border-color: var(--color-primary); color: var(--color-primary); background:#fff; transform:translateY(-1px); } }
.cats { display:grid; grid-template-columns: repeat(2,1fr); gap:12px; @media (min-width:680px){ grid-template-columns: repeat(3,1fr); } @media (min-width:1000px){ grid-template-columns: repeat(6,1fr); } }
.cat { display:flex; flex-direction:column; align-items:center; gap:10px; padding:20px 10px; border-radius: var(--radius-lg); border:1px solid #eef2f7; background: rgba(255,255,255,.8); cursor:pointer; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  &:hover { transform: translateY(-3px); border-color:#c7d2fe; box-shadow:0 14px 28px -18px rgba(37,99,235,.4); .cat-ic { color: var(--color-primary); } }
  .cat-ic { width:28px; height:28px; color:#64748b; transition: color .2s ease; :deep(svg) { width:100%; height:100%; display:block; } }
  .cat-name { font-size:13px; font-weight:600; color: var(--color-text-primary); }
}
.how { display:flex; flex-wrap:wrap; gap:12px; padding:18px; border-radius: var(--radius-lg); background: linear-gradient(135deg, rgba(37,99,235,.05), rgba(79,70,229,.05)); border:1px solid rgba(37,99,235,.1); }
.how-step { display:flex; align-items:center; gap:10px; flex:1; min-width:220px; font-size:13px; color: var(--color-text-secondary);
  b { width:24px; height:24px; flex-shrink:0; border-radius:50%; background: linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-size:13px; display:flex; align-items:center; justify-content:center; }
}

.block { margin-top: 30px; }
.bt { font-size: 17px; font-weight: 800; color:#0f172a; margin: 0 0 14px; em { font-style:normal; font-size:13px; font-weight:600; color: var(--color-text-tertiary); margin-left:4px; } }
.grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; @media (min-width:680px){ grid-template-columns: repeat(3,1fr); } @media (min-width:1000px){ grid-template-columns: repeat(4,1fr); } }
.card { display:flex; flex-direction:column; gap:6px; background: rgba(255,255,255,.8); border:1px solid #eef2f7; border-radius: var(--radius-lg); padding: 10px; box-shadow:0 8px 24px -16px rgba(15,23,42,.2); transition: transform .25s ease, box-shadow .25s ease; &:hover { transform: translateY(-4px); box-shadow:0 18px 36px -18px rgba(37,99,235,.35); } }
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

@keyframes spin { to { transform: rotate(360deg); } }
</style>
