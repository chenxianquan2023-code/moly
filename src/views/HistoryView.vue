<template>
  <div class="history">
    <header class="hh">
      <h1>历史记录</h1>
      <p>你做过的复刻视频都在这里 —— 可回看、下载、再做一条。</p>
    </header>

    <!-- 未登录 -->
    <div v-if="!auth.isLoggedIn" class="empty">
      <p>登录后查看你的复刻历史</p>
      <router-link to="/login" class="btn">登录 / 注册</router-link>
    </div>

    <div v-else-if="loading" class="hint">加载中…</div>

    <!-- 空态 -->
    <div v-else-if="!tasks.length" class="empty">
      <p>还没有复刻记录</p>
      <router-link to="/studio" class="btn">去工作台做第一条 →</router-link>
    </div>

    <!-- 列表 -->
    <div v-else class="grid">
      <div v-for="t in tasks" :key="t.id" class="card">
        <div class="thumb" :class="cls(t)" @click="canPlay(t) && play(t)">
          <img v-if="cover(t)" :src="cover(t)" :alt="title(t)" loading="lazy" />
          <span v-else class="ph">{{ statusText(t) }}</span>
          <span v-if="canPlay(t)" class="play"><span class="tri" /></span>
          <span v-if="t.status !== 'succeeded'" class="badge" :class="cls(t)">{{ statusText(t) }}</span>
        </div>
        <p class="title" :title="title(t)">{{ title(t) }}</p>
        <span class="meta">{{ langLabel(t) }} · {{ time(t) }}</span>
        <div class="acts">
          <template v-if="canPlay(t)">
            <button class="dl" :disabled="busy === t.id" @click="download(t)">{{ busy === t.id ? '…' : '下载' }}</button>
            <button class="use" @click="remake(t)">再做一条 →</button>
          </template>
          <router-link v-else-if="t.status === 'running' || t.status === 'queued'" class="use full" to="/studio">查看工作台 →</router-link>
          <button v-else class="use full" @click="remake(t)">重新尝试 →</button>
        </div>
      </div>
    </div>

    <!-- 播放弹层 -->
    <div v-if="playing" class="vmask" @click.self="playing = null">
      <div class="vbox">
        <button type="button" class="vx" @click="playing = null">×</button>
        <video :src="playing.output_json.videoUrl" controls autoplay playsinline class="vframe"></video>
        <div class="vmeta">
          <p class="vtitle">{{ title(playing) }}</p>
          <p class="vsub">{{ langLabel(playing) }} · {{ time(playing) }}</p>
          <button class="dl big" :disabled="busy === playing.id || regenning" @click="download(playing)">{{ busy === playing.id ? '下载中…' : '下载视频' }}</button>

          <div v-if="canRegen(playing)" class="vscenes">
            <p class="vscenes-h">📝 分镜 · 哪一镜不满意，点 🔄 单独重出（约 {{ REGEN_COST }} 积分，其余镜不变）</p>
            <ul class="vscene-list">
              <li v-for="(s, i) in playing.output_json.shots" :key="i" class="vscene">
                <img v-if="playing.output_json.sceneImages && playing.output_json.sceneImages[i]" :src="playing.output_json.sceneImages[i]" class="vscene-thumb" alt="" loading="lazy" />
                <span class="vscene-text"><em>{{ s.type }}</em>{{ s.text }}</span>
                <button type="button" class="vscene-regen" :disabled="regenning" @click="regenScene(playing, i)" :title="`只重出第 ${i + 1} 镜（约 ${REGEN_COST} 积分）`">🔄</button>
              </li>
            </ul>
            <p v-if="regenning" class="vscene-prog">⏳ 第 {{ regenSceneIdx + 1 }} 镜重出中… 约 1–2 分钟，请勿关闭弹窗</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const tasks = ref<any[]>([]);
const loading = ref(false);
const busy = ref('');
const playing = ref<any>(null);

const LANGS: Record<string, string> = { 'zh-CN': '中文', 'en-US': '英文', 'ja-JP': '日语', 'es-ES': '西语' };
const STATUS: Record<string, string> = { succeeded: '已完成', running: '生成中', queued: '排队中', failed: '失败', cancelled: '已取消' };

function cover(t: any) { return t.output_json?.coverUrl || t.input_json?.previewUrl || ''; }
function title(t: any) { return t.input_json?.product?.name || '未命名复刻'; }
function langLabel(t: any) { return LANGS[t.options_json?.language] || '中文'; }
function statusText(t: any) { return STATUS[t.status] || t.status; }
function cls(t: any) { return t.status; }
function canPlay(t: any) { return t.status === 'succeeded' && !!t.output_json?.videoUrl; }
function time(t: any) {
  try { return new Date(t.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function play(t: any) { playing.value = t; }

// ── 换单镜（历史页）：弹窗内对某一镜点 🔄 单独重出，其余镜复用缓存 ──
const REGEN_COST = 15; // 与后端 REGEN_SCENE_COST 一致
const regenning = ref(false);
const regenSceneIdx = ref(-1);
let regenTimer: any = null;
// 能否换单镜：成片带完整分镜缓存(底图+动画片)
function canRegen(t: any) {
  const o = t?.output_json;
  return !!(o && Array.isArray(o.sceneClips) && o.sceneClips.length && Array.isArray(o.shots) && o.sceneClips.length === o.shots.length);
}
async function regenScene(t: any, i: number) {
  if (regenning.value) return;
  if (!confirm(`只重出第 ${i + 1} 个镜头（其余镜头保持不变），需扣约 ${REGEN_COST} 积分。继续？`)) return;
  regenning.value = true; regenSceneIdx.value = i;
  try {
    const r = await fetch('/api/replica/regenerate-scene', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: auth.email, taskId: t.id, sceneIndex: i }),
    });
    const j = await r.json();
    if (!j.success) { regenning.value = false; regenSceneIdx.value = -1; alert(j.message || '换单镜失败'); return; }
    if (auth.email) (auth as any).fetchPointsFromServer?.(auth.email);
    pollRegen(j.taskId);
  } catch (e: any) { regenning.value = false; regenSceneIdx.value = -1; alert(e.message); }
}
function pollRegen(taskId: string) {
  const tick = async () => {
    try {
      const r = await fetch('/api/generation-tasks/' + taskId);
      const j = await r.json();
      if (j.success) {
        if (j.task.status === 'succeeded') {
          regenning.value = false; regenSceneIdx.value = -1;
          if (playing.value) playing.value = j.task; // 弹窗还开着才切到新成片（含换好的那一镜）
          if (auth.email) (auth as any).fetchPointsFromServer?.(auth.email);
          load(); // 刷新列表
          return;
        }
        if (j.task.status === 'failed') {
          regenning.value = false; regenSceneIdx.value = -1;
          alert(j.task.error_message || '换单镜失败，已自动退款');
          if (auth.email) (auth as any).fetchPointsFromServer?.(auth.email);
          return;
        }
      }
    } catch { /* 网络抖动，继续轮询 */ }
    regenTimer = setTimeout(tick, 3000);
  };
  tick();
}

async function load() {
  if (!auth.isLoggedIn || !auth.email) return;
  loading.value = true;
  try {
    const r = await fetch('/api/generation-tasks?userEmail=' + encodeURIComponent(auth.email));
    const j = await r.json();
    if (j.success) tasks.value = j.tasks || [];
  } catch { /* 忽略，显示空态 */ }
  finally { loading.value = false; }
}

function remake(t: any) {
  const p = t.input_json?.product || {};
  sessionStorage.setItem('moly_prefill', JSON.stringify({
    kind: 'redo',
    product: { name: p.name || '', sellingPoints: p.sellingPoints || [] },
    language: t.options_json?.language || 'zh-CN',
  }));
  router.push('/studio');
}

async function download(t: any) {
  const url = t.output_json?.videoUrl;
  if (!url || busy.value) return;
  busy.value = t.id;
  try {
    const resp = await fetch(url); const blob = await resp.blob();
    const u = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = u; a.download = 'moly-' + t.id.slice(0, 8) + '.mp4'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 5000);
  } catch { window.open(url, '_blank'); }
  finally { busy.value = ''; }
}

onMounted(load);
onUnmounted(() => { if (regenTimer) clearTimeout(regenTimer); });
</script>

<style scoped lang="scss">
.history { max-width: 1180px; margin: 0 auto; padding: 36px 28px 64px; }
.hh { margin-bottom: 24px; h1 { font-size: 28px; font-weight: 800; color:#0f172a; margin:0 0 6px; letter-spacing:-.02em; } p { color: var(--color-text-secondary); font-size: 15px; margin:0; } }

.hint { margin: 40px 0; text-align:center; color: var(--color-text-secondary); }
.empty { margin: 60px 0; text-align:center; display:flex; flex-direction:column; align-items:center; gap:16px; p { color: var(--color-text-tertiary); font-size:15px; margin:0; } }
.btn { display:inline-block; padding:11px 24px; border-radius: var(--radius-md); background: linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-weight:600; font-size:14px; text-decoration:none; box-shadow:0 8px 22px -8px rgba(37,99,235,.5); }

.grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; @media (min-width:680px){ grid-template-columns: repeat(3,1fr); } @media (min-width:1000px){ grid-template-columns: repeat(4,1fr); } }
.card { min-width:0; display:flex; flex-direction:column; gap:6px; background: rgba(255,255,255,.8); border:1px solid #eef2f7; border-radius: var(--radius-lg); padding: 10px; box-shadow:0 8px 24px -16px rgba(15,23,42,.2); transition: transform .25s ease, box-shadow .25s ease; &:hover { transform: translateY(-4px); box-shadow:0 18px 36px -18px rgba(37,99,235,.35); } }
.thumb { position:relative; aspect-ratio: 9/16; border-radius: var(--radius-md); overflow:hidden; background:#0f172a; display:flex; align-items:center; justify-content:center;
  img { width:100%; height:100%; object-fit:cover; }
  .ph { color:#cbd5e1; font-size:13px; font-weight:600; }
  &.succeeded { cursor:pointer; }
  &.failed { background:#1f2937; }
  .play { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:42px; height:42px; border-radius:50%; background:rgba(255,255,255,.25); border:1.5px solid rgba(255,255,255,.6); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center;
    .tri { width:0; height:0; margin-left:3px; border-left:13px solid #fff; border-top:8px solid transparent; border-bottom:8px solid transparent; } }
  .badge { position:absolute; top:6px; left:6px; font-size:11px; font-weight:700; color:#fff; padding:2px 8px; border-radius:6px; background:rgba(0,0,0,.5);
    &.running, &.queued { background:#f59e0b; }
    &.failed { background:#ef4444; }
  }
}
.title { font-size:13px; font-weight:600; color: var(--color-text-primary); line-height:1.4; margin:2px 0 0; display:-webkit-box; -webkit-line-clamp:1; line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
.meta { font-size:11px; color: var(--color-text-tertiary); }
.acts { display:flex; gap:8px; margin-top:6px; }
.dl, .use { flex:1; padding:8px; border-radius: var(--radius-md); font-size:12px; font-weight:600; cursor:pointer; border:1px solid var(--color-border); background:#fff; color: var(--color-text-primary); transition:all var(--transition-fast); text-align:center; text-decoration:none; &:disabled { opacity:.5; } &:hover:not(:disabled) { border-color: var(--color-primary); } }
.use { background: linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; border:none; &.full { flex:1; } }

/* 播放弹层 */
.vmask { position:fixed; inset:0; background:rgba(15,23,42,.62); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:200; padding:20px; }
.vbox { position:relative; width:100%; max-width:760px; background:#fff; border-radius: var(--radius-2xl); overflow:hidden; box-shadow: var(--shadow-xl); display:flex; flex-direction:column; max-height:92vh;
  @media (min-width:720px){ flex-direction:row; width:auto; align-items:stretch; } }
.vx { position:absolute; top:10px; right:12px; z-index:3; width:32px; height:32px; border:none; border-radius:50%; background:rgba(15,23,42,.55); color:#fff; font-size:20px; line-height:1; cursor:pointer; }
/* 竖版 9:16 视频：按高度自适应、宽度随比例，object-fit 兜底，绝不超出弹层被裁切 */
.vframe { display:block; flex:none; margin:0 auto; background:#000; object-fit:contain; width:auto; max-width:100%; max-height:68vh;
  @media (min-width:720px){ max-height:86vh; max-width:50vh; margin:0; } }
.vmeta { padding:18px; display:flex; flex-direction:column; gap:10px; @media (min-width:720px){ width:280px; flex-shrink:0; justify-content:center; } }
.vtitle { margin:0; font-size:16px; font-weight:700; color: var(--color-text-primary); }
.vsub { margin:0; font-size:12px; color: var(--color-text-tertiary); }
.dl.big { flex:none; padding:12px; font-size:14px; background: linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; border:none; }

/* 历史页·换单镜分镜条 */
.vscenes { margin-top:4px; border-top:1px solid var(--color-border-light); padding-top:12px; }
.vscenes-h { margin:0 0 8px; font-size:11.5px; font-weight:600; color: var(--color-text-tertiary); line-height:1.5; }
.vscene-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; max-height:240px; overflow-y:auto; @media (min-width:720px){ max-height:42vh; } }
.vscene { display:flex; align-items:center; gap:9px; }
.vscene-thumb { width:30px; height:53px; object-fit:cover; border-radius:5px; flex-shrink:0; background:#e2e8f0; border:1px solid var(--color-border-light); }
.vscene-text { flex:1; min-width:0; font-size:12.5px; color: var(--color-text-primary); line-height:1.35;
  em { font-style:normal; font-size:10px; font-weight:700; color: var(--color-primary); margin-right:5px; text-transform:uppercase; } }
.vscene-regen { flex-shrink:0; width:32px; height:32px; border:1px solid var(--color-border); border-radius:8px; background:#fff; cursor:pointer; font-size:14px; line-height:1; display:flex; align-items:center; justify-content:center; transition:all var(--transition-fast);
  &:hover:not(:disabled) { border-color: var(--color-primary); background: var(--color-primary-light,#eef2ff); transform:rotate(-30deg); }
  &:disabled { opacity:.4; cursor:default; } }
.vscene-prog { margin:10px 0 0; font-size:12px; font-weight:600; color: var(--color-primary); line-height:1.5; }

@media (max-width: 640px) {
  .history { padding: 22px 14px 48px; }
  .hh { margin-bottom:18px; h1 { font-size:24px; } p { font-size:14px; } }
  .acts { gap:6px; }
  .dl, .use { padding:9px 4px; font-size:11px; white-space:nowrap; }
  .vbox { flex-direction:column; }
  .vmeta { width:100%; }
}
</style>
