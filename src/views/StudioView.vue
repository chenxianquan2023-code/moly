<template>
  <div class="studio">
    <div class="studio-aurora" aria-hidden="true"></div>

    <!-- 顶栏已移至全局侧边栏（AppSidebar），此处不再重复 -->


    <main class="canvas">
      <section class="hero">
        <span class="hero-badge"><span class="badge-dot" /> 爆款视频复刻引擎</span>
        <h1>爆款视频，<span class="grad">一键复刻</span>成你的带货视频</h1>
        <p>上传商品素材，AI 自动写文案、配音、生成画面，产出 9:16 带货短视频。</p>
        <div class="hero-limits">
          <span>参考视频：建议 5–60 秒，只拆解前 60 秒</span>
          <span>输出成片：通常 8–30 秒，最长约 45 秒</span>
        </div>
      </section>

      <section v-if="!auth.isLoggedIn" class="login-panel">
        <input v-model="loginEmail" class="login-field" placeholder="邮箱" />
        <input v-model="loginPassword" type="password" class="login-field" placeholder="密码" @keyup.enter="doLogin" />
        <button class="login-btn" :disabled="loggingIn" @click="doLogin">{{ loggingIn ? '登录中…' : '登录' }}</button>
        <span v-if="loginError" class="login-err">{{ loginError }}</span>
        <span v-else class="login-hint">演示账号已预填，直接点登录</span>
      </section>

      <div class="workspace">
        <!-- 左：配置 -->
        <div class="config">
          <!-- 1 素材 -->
          <div class="card">
            <div class="card-title"><span class="num">1</span>上传素材</div>
            <div class="uploads">
              <label class="upload" :class="{ filled: productAsset, busy: uploading==='product' }">
                <input type="file" accept="image/*" hidden @change="e => onFile(e, 'product_image', 'product')" />
                <img v-if="productAsset" :src="productAsset.file_url" />
                <template v-else>
                  <span class="upload-plus">＋</span>
                  <span class="upload-label">商品图<em>必填</em></span>
                </template>
                <button v-if="productAsset" type="button" class="upload-del" title="删除" @click.stop.prevent="clearAsset('product')">×</button>
                <span v-if="uploading==='product'" class="upload-spin" />
              </label>

              <label class="upload" :class="{ filled: modelAsset, busy: uploading==='model' }">
                <input type="file" accept="image/*" hidden @change="e => onFile(e, 'model_image', 'model')" />
                <img v-if="modelAsset" :src="modelAsset.file_url" />
                <template v-else>
                  <span class="upload-plus">＋</span>
                  <span class="upload-label">模特图<em>选填</em></span>
                </template>
                <button v-if="modelAsset" type="button" class="upload-del" title="删除" @click.stop.prevent="clearAsset('model')">×</button>
                <span v-if="uploading==='model'" class="upload-spin" />
              </label>

              <label class="upload" :class="{ filled: sourceVideoAsset || refInspiration, busy: uploading==='source' }">
                <input type="file" accept="video/*" hidden @change="e => onFile(e, 'source_video', 'source')" />
                <template v-if="refInspiration">
                  <img v-if="refInspiration.cover" :src="refInspiration.cover" class="upload-img" />
                  <span v-else class="upload-plus">＋</span>
                  <span class="upload-vtag">爆款参考</span>
                  <button type="button" class="upload-del" title="删除" @click.stop.prevent="clearAsset('inspiration')">×</button>
                </template>
                <template v-else-if="sourceVideoAsset">
                  <video :src="`${sourceVideoAsset.file_url}#t=0.5`" preload="metadata" muted playsinline class="upload-video"></video>
                  <span class="upload-vtag">参考视频</span>
                  <button type="button" class="upload-play" title="播放" @click.stop.prevent="previewVideo = sourceVideoAsset.file_url"><span class="tri" /></button>
                  <button type="button" class="upload-del" title="删除" @click.stop.prevent="clearAsset('source')">×</button>
                </template>
                <template v-else>
                  <span class="upload-plus">＋</span>
                  <span class="upload-label">爆款参考视频<em>选填 · ≤60秒</em></span>
                </template>
                <span v-if="uploading==='source'" class="upload-spin" />
              </label>
            </div>
            <p class="upload-note">爆款参考视频用于拆解拍法、分镜和节奏；本地上传最多 60 秒。从「找爆款」带入的视频也只参考前 60 秒。</p>
            <div class="samples">
              <span class="samples-label">没有素材？点一个示例商品直接用</span>
              <div class="samples-row">
                <button v-for="s in SAMPLES" :key="s.id" type="button" class="sample" @click="useSample(s)">
                  <img :src="s.url" alt="" /><span>{{ s.name }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 2 商品信息 -->
          <div class="card">
            <div class="card-title"><span class="num">2</span>商品信息</div>
            <input class="field" v-model="productName" placeholder="商品名称，如：多功能切菜神器" />
            <input class="field" v-model="sellingPoints" placeholder="卖点（逗号分隔）：省时, 锋利, 安全" />
          </div>

          <!-- 3 复刻方式 -->
          <div class="card">
            <div class="card-title"><span class="num">3</span>复刻设置</div>
            <div class="model-opts" v-if="pricing">
              <div class="model-row">
                <span class="model-label">画面质量</span>
                <div class="seg">
                  <button v-for="im in pricing.image" :key="im.id" type="button"
                    :class="{ active: imageModel === im.id }" @click="imageModel = im.id" :title="im.desc">
                    {{ im.label }}<em>{{ im.price ? '+' + im.price : '含' }}</em>
                  </button>
                </div>
              </div>
            </div>
            <div class="model-row lang-row">
              <span class="model-label">语言<em class="ml-note">口播 + 字幕都用此语言</em></span>
              <div class="seg">
                <button v-for="l in LANGS" :key="l.code" type="button" :class="{ active: language === l.code }" @click="language = l.code">{{ l.label }}</button>
              </div>
            </div>
            <div class="switches">
              <label class="switch"><input type="checkbox" v-model="generateVoice" /><span />AI 配音</label>
              <label class="switch"><input type="checkbox" v-model="generateSubtitle" /><span />字幕</label>
              <label class="switch"><input type="checkbox" v-model="generateMusic" /><span />背景音乐</label>
            </div>
            <p v-if="generateMusic" class="voice-hint">背景音乐取自你的爆款参考视频（需有参考视频）{{ generateVoice ? '，作配音的轻背景乐' : '，无配音' }}。</p>
            <p v-else-if="!generateVoice" class="voice-hint">已关 AI 配音、无背景乐：成片无声，保留字幕脚本，可自己后期配。</p>
            <div v-if="generateVoice && voices.length" class="voice-pick">
              <span class="model-label">配音音色</span>
              <button type="button" class="voice-trigger" @click="openVoicePicker">
                <span class="vt-dot" :class="currentVoice?.gender === '男' ? 'm' : 'f'"></span>
                <span class="vt-name">{{ currentVoice?.label || '选择音色' }}</span>
                <span v-if="currentVoice?.desc" class="vt-desc">{{ currentVoice.desc }}</span>
                <span class="vt-play" title="试听当前音色" @click.stop="currentVoice && auditionVoice(currentVoice)">▶</span>
                <span class="vt-more">换音色 ▾</span>
              </button>
            </div>
          </div>

          <button class="generate" :disabled="!canGenerate" @click="generate">
            <span v-if="generating" class="gen-spin" />
            {{ generating ? '生成中…' : `一键生成 · 约 ${estimatedCredits} 积分` }}
          </button>
          <p class="duration-note">成片按 9:16 输出，通常 8–30 秒；参考视频较长时会控制在 45 秒以内。</p>
          <p v-if="!auth.isLoggedIn" class="hint">请先<router-link to="/login">登录</router-link>后生成</p>
        </div>

        <!-- 右：进度 / 结果 -->
        <div class="preview">
          <div v-if="!generating && !task && !result" class="preview-empty">
            <div class="phone">
              <span>9:16</span>
            </div>
            <p>成片将在这里预览</p>
          </div>

          <div v-else-if="result" class="preview-done">
            <video :src="result.videoUrl" controls playsinline class="result-video" />
            <div class="result-actions">
              <button type="button" class="btn-download" :disabled="downloading" @click="downloadVideo">{{ downloading ? '下载中…' : '下载视频' }}</button>
              <button class="btn-again" @click="reset">再做一条</button>
            </div>
            <div v-if="result.shots?.length" class="script">
              <div class="script-head">📝 文案脚本<span v-if="!result.ttsOk"> · 无 AI 配音，照此自己配</span></div>
              <ol><li v-for="(s, i) in result.shots" :key="i"><em>{{ s.type }}</em>{{ s.text }}</li></ol>
            </div>
            <p v-if="genNote" class="result-notes">{{ genNote }}</p>
          </div>

          <div v-else class="preview-progress">
            <div class="gen-head">
              <b>AI 正在为你复刻成片</b>
              <span class="gen-eta">预计 2–5 分钟 · 已用时 {{ elapsedText }}</span>
            </div>
            <div class="progress-ring" :class="{ running: task?.status !== 'failed' }" :style="{ '--p': (task?.progress || 0) + '%' }">
              <span>{{ task?.progress || 0 }}%</span>
            </div>
            <p v-if="task?.status !== 'failed'" class="gen-tip"><span class="gen-tip-ic">💡</span>{{ currentTip }}</p>
            <ul class="steps">
              <li v-for="s in (task?.steps || [])" :key="s.capability" :class="s.status">
                <span class="dot" />{{ s.label }}
                <em v-if="s.note">{{ s.note }}</em>
              </li>
            </ul>
            <p v-if="task?.status !== 'failed'" class="gen-hint">⏳ 生成期间可以放心去忙别的，完成后这里会自动出现成片，请不要关闭页面。</p>
            <p v-if="task?.status === 'failed'" class="fail">生成失败：{{ task.error_message }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- 音色选择器（搜索 + 分类 + 试听，可扩展到上百个） -->
    <div v-if="showVoicePicker" class="vp-mask" @click.self="showVoicePicker = false">
      <div class="vp-modal">
        <div class="vp-head"><b>选择配音音色</b><button type="button" class="vp-x" @click="showVoicePicker = false">×</button></div>
        <input class="vp-search" v-model="voiceSearch" placeholder="搜索音色名称，如 元气 / 北京 / 猴哥…" />
        <div class="vp-tabs">
          <button v-for="t in voiceFilters" :key="t.key" type="button" :class="{ active: voiceFilter === t.key }" @click="voiceFilter = t.key">{{ t.label }}</button>
        </div>
        <div class="vp-grid">
          <button v-for="v in filteredVoices" :key="v.id" type="button" class="vp-card" :class="{ active: voice === v.id }" @click="selectVoice(v)" :title="v.desc">
            <span class="vp-card-top">
              <span class="vp-gender" :class="v.gender === '男' ? 'm' : 'f'">{{ v.gender || '·' }}</span>
              <span class="vp-play" title="试听" @click.stop="auditionVoice(v)">▶</span>
            </span>
            <span class="vp-card-name">{{ v.label }}</span>
            <span class="vp-card-desc">{{ v.desc }}</span>
          </button>
          <p v-if="!filteredVoices.length" class="vp-empty">没找到匹配的音色，换个关键词试试</p>
        </div>
        <div class="vp-foot">
          <span>{{ langLabel }} · 共 {{ filteredVoices.length }} 个 · 点卡片选用，点 ▶ 试听</span>
          <button type="button" class="vp-done" @click="showVoicePicker = false">完成</button>
        </div>
      </div>
    </div>

    <!-- 充值弹窗 -->
    <div v-if="showRecharge" class="modal-mask" @click.self="showRecharge = false">
      <div class="modal">
        <div class="modal-head"><b>{{ auth.isTester ? '积分充值' : '内测体验额度' }}</b><button type="button" class="modal-x" @click="showRecharge = false">×</button></div>
        <p v-if="rechargeMsg" class="modal-msg">{{ rechargeMsg }}</p>
        <template v-if="auth.isTester">
          <div class="pkgs">
            <button v-for="p in packages" :key="p.id" type="button" class="pkg" :disabled="!!recharging" @click="recharge(p)">
              <span class="pkg-credits">{{ p.credits + p.bonus }}<em>积分</em></span>
              <span v-if="p.bonus" class="pkg-bonus">含赠 {{ p.bonus }}</span>
              <span class="pkg-price">¥{{ p.priceYuan }}</span>
              <span v-if="recharging === p.id" class="pkg-spin" />
            </button>
          </div>
          <p class="modal-foot">当前余额 {{ auth.points }} 积分 · 测试账号可无限充值</p>
        </template>
        <p v-else class="modal-tip">内测期间每位用户固定 <b>320 积分</b> 体验额度，暂不支持充值。<br>当前余额 <b>{{ auth.points }}</b> 积分。<br>正式上线后将开放充值，敬请期待 🙌</p>
      </div>
    </div>

    <!-- 参考视频播放弹层 -->
    <div v-if="previewVideo" class="pv-mask" @click.self="previewVideo = ''">
      <div class="pv-box">
        <button type="button" class="pv-x" @click="previewVideo = ''">×</button>
        <video :src="previewVideo" controls autoplay playsinline class="pv-video"></video>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const MAX_SOURCE_VIDEO_SECONDS = 60;

// 默认定价兜底：拉不到 /pricing 时也能渲染选项（服务端生成时仍权威校验价格）
const DEFAULT_PRICING = {
  base: 20,
  video: [
    { id: 'kling', label: '可灵', price: 50, desc: '支持完整真人脸，模特动作自然灵动' },
  ],
  image: [
    { id: 'gemini', label: '标准 · Gemini', price: 0, desc: '出图快，质感好' },
    { id: 'openai', label: '高清 · GPT Image', price: 10, desc: '更精细的细节与质感(略慢)' },
  ],
};
const DEFAULT_PACKAGES = [
  { id: 'starter', label: '体验包', credits: 100, bonus: 0, priceYuan: 9.9 },
  { id: 'basic', label: '基础包', credits: 500, bonus: 50, priceYuan: 49 },
  { id: 'pro', label: '专业包', credits: 1500, bonus: 300, priceYuan: 99 },
];
const pricing = ref<any>(DEFAULT_PRICING);
const packages = ref<any[]>(DEFAULT_PACKAGES);
const videoModel = ref('kling'); // 视频引擎固定为可灵（Seedance 已下线）
const imageModel = ref('gemini');
const showRecharge = ref(false);
const rechargeMsg = ref('');
const recharging = ref('');

const productAsset = ref<any>(null);
const modelAsset = ref<any>(null);
const sourceVideoAsset = ref<any>(null);
const refInspiration = ref<any>(null); // 找爆款「用它复刻」带入的封面+文案参考（不下载原视频）
const previewVideo = ref<string>(''); // 点击参考视频缩略图 → 弹层播放
const uploading = ref('');

// 删除/清空某个素材槽
function clearAsset(slot: string) {
  if (slot === 'product') productAsset.value = null;
  else if (slot === 'model') modelAsset.value = null;
  else if (slot === 'source') sourceVideoAsset.value = null;
  else if (slot === 'inspiration') refInspiration.value = null;
}

const productName = ref('');
const sellingPoints = ref('');

const generateVoice = ref(true);
const generateSubtitle = ref(true);
const generateMusic = ref(true); // 没配音时用源爆款视频的音乐当背景乐
const language = ref('zh-CN');
const LANGS = [{ code: 'zh-CN', label: '中文' }, { code: 'en-US', label: '英文' }, { code: 'ja-JP', label: '日语' }, { code: 'es-ES', label: '西语' }];
const VS = 'https://ycivzfqijxngognpoeil.supabase.co/storage/v1/object/public/moly-media/voices/samples/';
const DEFAULT_VOICES = [
  { id: 'volc-yuanqinvyou', label: '元气女友', desc: '元气活泼、甜美亲和', gender: '女', category: '通用', langs: ['zh-CN'], sample: VS + 'volc-yuanqinvyou.mp3' },
];
const voices = ref<any[]>(DEFAULT_VOICES);
const voice = ref('volc-yuanqinvyou');
let voiceAudio: HTMLAudioElement | null = null;

// 音色选择器（弹层 + 搜索 + 分类 + 试听）—— 扛得住上百个音色
const showVoicePicker = ref(false);
const voiceSearch = ref('');
const voiceFilter = ref('all');
// 按当前语言筛选：只保留 langs 包含所选语言的音色（无 langs 视为通用，兼容兜底列表）
const langVoices = computed(() => voices.value.filter((v: any) => !v.langs || v.langs.includes(language.value)));
const langLabel = computed(() => { const m: Record<string, string> = { 'en-US': '英语', 'zh-CN': '中文', 'ja-JP': '日语', 'es-ES': '西语' }; return m[language.value] || language.value; });
const currentVoice = computed(() => langVoices.value.find((v: any) => v.id === voice.value) || langVoices.value[0] || null);
const voiceFilters = computed(() => {
  const f: { key: string; label: string }[] = [{ key: 'all', label: '全部' }];
  if (langVoices.value.some((v: any) => v.gender === '女')) f.push({ key: 'female', label: '女声' });
  if (langVoices.value.some((v: any) => v.gender === '男')) f.push({ key: 'male', label: '男声' });
  if (langVoices.value.some((v: any) => v.category === '角色')) f.push({ key: '角色', label: '角色音' });
  if (langVoices.value.some((v: any) => v.category === '方言')) f.push({ key: '方言', label: '方言' });
  return f;
});
const filteredVoices = computed(() => {
  const q = voiceSearch.value.trim().toLowerCase();
  const f = voiceFilter.value;
  return langVoices.value.filter((v: any) => {
    const okF = f === 'all' || (f === 'female' && v.gender === '女') || (f === 'male' && v.gender === '男') || v.category === f;
    const okQ = !q || (v.label || '').toLowerCase().includes(q) || (v.desc || '').toLowerCase().includes(q);
    return okF && okQ;
  });
});
// 切换语言后，若当前音色不支持该语言，自动切到第一个支持的，杜绝「中文音色配英文」
watch(language, () => {
  if (voice.value && !langVoices.value.some((v: any) => v.id === voice.value)) {
    voice.value = langVoices.value[0]?.id || '';
  }
});
function openVoicePicker() { voiceSearch.value = ''; voiceFilter.value = 'all'; showVoicePicker.value = true; }

const task = ref<any>(null);
const result = ref<any>(null);
const generating = ref(false);
let pollTimer: ReturnType<typeof setTimeout> | null = null;

// —— 生成进度的友好提示：耗时预期 + 计时 + 轮播文案（生成较久，给用户心理预期）——
const elapsed = ref(0); // 已用秒数
let elapsedTimer: ReturnType<typeof setInterval> | null = null;
const GEN_TIPS = [
  '正在拆解爆款的脚本结构与分镜节奏…',
  '正在逐个镜头生成画面，这一步最耗时，请耐心等待…',
  '正在为每个镜头做图生视频运镜…',
  '正在合成 AI 配音与字幕…',
  '正在把镜头拼接、渲染成 9:16 成片…',
  '快好了，正在做最后的打包与上传…',
];
const tipIndex = ref(0);
let tipTimer: ReturnType<typeof setInterval> | null = null;
const currentTip = computed(() => GEN_TIPS[tipIndex.value % GEN_TIPS.length]);
const elapsedText = computed(() => {
  const m = Math.floor(elapsed.value / 60);
  const s = elapsed.value % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
});
function startProgressUx() {
  stopProgressUx();
  elapsed.value = 0;
  tipIndex.value = 0;
  elapsedTimer = setInterval(() => { elapsed.value += 1; }, 1000);
  tipTimer = setInterval(() => { tipIndex.value += 1; }, 5000);
}
function stopProgressUx() {
  if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
  if (tipTimer) { clearInterval(tipTimer); tipTimer = null; }
}

const estimatedCredits = computed(() => {
  if (!pricing.value) return 50;
  const v = pricing.value.video.find((x: any) => x.id === videoModel.value)?.price || 0;
  const im = pricing.value.image.find((x: any) => x.id === imageModel.value)?.price || 0;
  return (pricing.value.base || 0) + v + im;
});
const canGenerate = computed(() => auth.isLoggedIn && !!productAsset.value && !generating.value);

// 把内部降级/报错 notes 转成对用户友好的一句提示（绝不暴露原始 API 报错码）
const genNote = computed(() => {
  const notes = result.value?.notes || [];
  if (!notes.length) return '';
  const txt = notes.join(' ');
  if (/配音降级|无配音|无声|TTS/i.test(txt)) return '提示：本条未生成 AI 配音，已附文案脚本，可自行后期配音。';
  if (/失败|降级|limit|Detected|over|敏感|sensitive/i.test(txt)) return '提示：个别镜头的视频引擎临时受限，已自动用静态运镜兜底，成片可正常使用；想要更佳动态效果可点「再做一条」重试。';
  return '';
});

async function uploadAsset(file: File, assetType: string) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('assetType', assetType);
  fd.append('userEmail', auth.email || '');
  const r = await fetch('/api/assets/upload', { method: 'POST', body: fd });
  const j = await r.json();
  if (!j.success) throw new Error(j.message || '上传失败');
  return j.asset;
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    const cleanup = () => URL.revokeObjectURL(url);
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = Number(video.duration) || 0;
      cleanup();
      resolve(duration);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('无法读取视频时长，请换一个视频文件'));
    };
    video.src = url;
  });
}

async function onFile(e: Event, assetType: string, slot: string) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    if (assetType === 'source_video') {
      const duration = await readVideoDuration(file);
      if (duration > MAX_SOURCE_VIDEO_SECONDS + 0.5) {
        alert(`爆款参考视频最多支持 ${MAX_SOURCE_VIDEO_SECONDS} 秒。当前视频约 ${Math.round(duration)} 秒，请先裁剪后再上传。`);
        input.value = '';
        return;
      }
    }
    uploading.value = slot;
    const asset = await uploadAsset(file, assetType);
      if (slot === 'product') productAsset.value = asset;
      else if (slot === 'model') modelAsset.value = asset;
      else sourceVideoAsset.value = asset;
  } catch (err: any) {
    alert(err.message || '上传失败');
  } finally {
    uploading.value = '';
    input.value = '';
  }
}

async function generate() {
  if (!canGenerate.value) return;
  generating.value = true;
  result.value = null;
  task.value = null;
  startProgressUx();
  try {
    let sourceVideoId = null;
    if (sourceVideoAsset.value) {
      const r = await fetch('/api/source-videos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: auth.email, assetId: sourceVideoAsset.value.id }),
      });
      const j = await r.json();
      if (j.success) sourceVideoId = j.sourceVideo.id;
    }
    const r = await fetch('/api/replica/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: auth.email, sourceVideoId,
        assets: { product_image_id: productAsset.value?.id, model_image_id: modelAsset.value?.id || null },
        product: { name: productName.value || '本商品', sellingPoints: sellingPoints.value.split(/[,，]/).map(s => s.trim()).filter(Boolean) },
        options: { generate_voice: generateVoice.value, generate_subtitle: generateSubtitle.value, ttsVoice: voice.value, generate_music: generateMusic.value },
        models: { video: videoModel.value, image: imageModel.value },
        language: language.value, aspectRatio: '9:16',
      }),
    });
    const j = await r.json();
    if (!j.success) {
      if (j.code === 'INSUFFICIENT') { generating.value = false; stopProgressUx(); openRecharge(`积分不足：本次需 ${j.need}，当前 ${j.points}`); return; }
      throw new Error(j.message || '生成失败');
    }
    if (auth.email) auth.fetchPointsFromServer(auth.email); // 扣费后刷新余额
    pollTask(j.taskId);
  } catch (err: any) {
    alert(err.message);
    generating.value = false;
    stopProgressUx();
  }
}

function pollTask(taskId: string) {
  const tick = async () => {
    try {
      const r = await fetch('/api/generation-tasks/' + taskId);
      const j = await r.json();
      if (j.success) {
        task.value = j.task;
        if (j.task.status === 'succeeded') {
          result.value = j.task.output_json;
          generating.value = false;
          stopProgressUx();
          if (auth.email) auth.fetchPointsFromServer(auth.email);
          return;
        }
        if (j.task.status === 'failed') { generating.value = false; stopProgressUx(); return; }
      }
    } catch { /* 网络抖动，继续轮询 */ }
    pollTimer = setTimeout(tick, 3000);
  };
  tick();
}

function reset() { task.value = null; result.value = null; stopProgressUx(); }

// 直接下载成片：浏览器拉 blob 触发下载，停留在当前页（不再整页跳到视频直链）
const downloading = ref(false);
async function downloadVideo() {
  const url = result.value?.videoUrl;
  if (!url || downloading.value) return;
  downloading.value = true;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('fetch failed');
    const blob = await resp.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = `moly-${result.value.generatedVideoId || 'video'}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
  } catch {
    window.open(url, '_blank'); // 兜底：新标签打开，至少不跳走当前页
  } finally {
    downloading.value = false;
  }
}

onMounted(async () => {
  // 找爆款「用它复刻」带入的素材（DiscoverView 写入 sessionStorage）
  try {
    const raw = sessionStorage.getItem('moly_prefill');
    if (raw) {
      sessionStorage.removeItem('moly_prefill');
      const p = JSON.parse(raw);
      if (p.kind === 'productImage' && p.asset) productAsset.value = p.asset;
      else if (p.kind === 'sourceVideo' && p.asset) sourceVideoAsset.value = p.asset; // 兼容旧逻辑
      else if (p.kind === 'inspiration') {
        refInspiration.value = { cover: p.cover || '', desc: p.desc || '' };
        // 把爆款文案作为卖点种子带入（去掉话题标签/多余空白），用户可再改
        if (!sellingPoints.value && p.desc) {
          sellingPoints.value = String(p.desc).replace(/#[^\s#]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
        }
      }
      else if (p.kind === 'redo') {
        // 历史「再做一条」：带入商品名/卖点/语言（图片需重新选）
        if (p.product?.name) productName.value = p.product.name;
        if (Array.isArray(p.product?.sellingPoints) && p.product.sellingPoints.length) sellingPoints.value = p.product.sellingPoints.join('，');
        if (p.language) language.value = p.language;
      }
    }
  } catch { /* 忽略 */ }
  try {
    const j = await (await fetch('/api/replica/pricing')).json();
    if (j.success) { pricing.value = j.pricing; packages.value = j.packages; }
  } catch { /* 拉不到就用默认价 */ }
  try {
    const jv = await (await fetch('/api/replica/voices')).json();
    if (jv.success) { voices.value = jv.voices; voice.value = jv.defaultVoice || voice.value; }
  } catch { /* 忽略 */ }
  if (auth.isLoggedIn && auth.email) auth.fetchPointsFromServer(auth.email);
});

function selectVoice(v: any) {
  voice.value = v.id; // 仅选用，不自动播放
}
function auditionVoice(v: any) {
  // 仅试听（不改变选择）：所选语言==样本语言→用静态样本(秒开)；否则按所选语言实时合成，避免“选西语却放日语”
  const lang = language.value;
  const sampleLang = (v.langs && v.langs[0]) || 'zh-CN';
  const src = (lang === sampleLang && v.sample)
    ? v.sample
    : `/api/replica/voice-sample?id=${encodeURIComponent(v.id)}&lang=${encodeURIComponent(lang)}`;
  try { if (voiceAudio) voiceAudio.pause(); voiceAudio = new Audio(src); voiceAudio.play(); } catch { /* 忽略 */ }
}

function openRecharge(msg = '') { rechargeMsg.value = msg; showRecharge.value = true; }
async function recharge(pkg: any) {
  recharging.value = pkg.id;
  try {
    const r = await fetch('/api/replica/recharge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userEmail: auth.email, packageId: pkg.id }) });
    const j = await r.json();
    if (j.success) {
      if (auth.email) await auth.fetchPointsFromServer(auth.email);
      rechargeMsg.value = `充值成功，已到账 ${j.added} 积分`;
      setTimeout(() => { showRecharge.value = false; rechargeMsg.value = ''; }, 1200);
    } else { rechargeMsg.value = j.message || '充值失败'; }
  } catch { rechargeMsg.value = '网络错误，请重试'; }
  finally { recharging.value = ''; }
}

// 内联登录（绕开旧登录页的地区检测/手机号流程，演示账号已预填）
const loginEmail = ref('demo@moly.test');
const loginPassword = ref('moly1234');
const loginError = ref('');
const loggingIn = ref(false);
async function doLogin() {
  loginError.value = '';
  loggingIn.value = true;
  try {
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ account: loginEmail.value.trim(), password: loginPassword.value }) });
    const j = await r.json();
    if (j.success && j.user) auth.login({ email: j.user.email, points: j.user.points });
    else loginError.value = j.message || '登录失败';
  } catch {
    loginError.value = '网络错误：连不上后端，请确认后端已启动（npm run dev:server）';
  } finally {
    loggingIn.value = false;
  }
}

// 示例商品（没素材也能直接试）
const SB = 'https://ycivzfqijxngognpoeil.supabase.co/storage/v1/object/public/moly-media/samples/';
const SAMPLES = [
  { id: 'bottle', name: 'Insulated Travel Tumbler', points: '保温12小时, 防漏, 一手掌握', url: SB + 'case_bottle.png' },
  { id: 'earbuds', name: '无线降噪蓝牙耳机', points: '降噪, 超长续航, 触控操作', url: SB + 'case_earbuds.png' },
  { id: 'serum', name: 'Glow Repair Serum', points: '提亮, 保湿, 敏感肌可用', url: SB + 'case_serum.png' },
];
async function useSample(s: { id: string; name: string; points: string; url: string }) {
  uploading.value = 'product';
  try {
    const resp = await fetch(s.url);
    const blob = await resp.blob();
    const file = new File([blob], s.id + '.png', { type: blob.type || 'image/png' });
    productAsset.value = await uploadAsset(file, 'product_image');
    productName.value = s.name;
    sellingPoints.value = s.points;
  } catch (e: any) { alert('加载示例失败：' + e.message); }
  finally { uploading.value = ''; }
}

onUnmounted(() => { if (pollTimer) clearTimeout(pollTimer); stopProgressUx(); });
</script>

<style scoped lang="scss">
.studio { position: relative; min-height: 100vh; background: var(--color-bg-subtle); display: flex; flex-direction: column; }
.studio-aurora {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(46% 38% at 16% 0%, rgba(59,130,246,.16), transparent 70%),
    radial-gradient(42% 34% at 92% 6%, rgba(99,102,241,.14), transparent 70%),
    radial-gradient(38% 30% at 60% 0%, rgba(6,182,212,.08), transparent 72%);
}
.topbar, .canvas { position: relative; z-index: 1; }

.topbar {
  height: 60px; padding: 0 28px; display: flex; align-items: center; justify-content: space-between;
  background: rgba(255,255,255,.72); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(255,255,255,.6);
  box-shadow: 0 1px 0 rgba(37,99,235,.06); position: sticky; top: 0; z-index: 20;
  .brand { display: flex; align-items: center; gap: 9px; text-decoration: none; }
  .brand-mark { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg,#3B82F6,#6366F1); color:#fff; font-weight:800; display:flex; align-items:center; justify-content:center; font-size:15px; box-shadow: 0 6px 14px -4px rgba(37,99,235,.6); }
  .brand-name { font-size: 19px; font-weight: 800; letter-spacing: -.02em; color: var(--color-text-primary); }
  .brand-tag { font-size: 12px; font-weight: 600; color: #2563eb; background: rgba(37,99,235,.09); padding: 3px 9px; border-radius: 999px; margin-left: 4px; }
  .credits { display:flex; align-items:center; gap:7px; padding:7px 14px; background:rgba(255,255,255,.9); border:1px solid var(--color-border); border-radius:999px; font-size:13px; font-weight:600; color:var(--color-text-primary); cursor:pointer; transition: all .2s ease; &:hover { border-color:#c7d2fe; box-shadow: 0 4px 12px -4px rgba(37,99,235,.3); } }
  .credits-dot { width:7px; height:7px; border-radius:50%; background:#10b981; box-shadow: 0 0 0 0 rgba(16,185,129,.5); animation: pulse 2s infinite; }
  .login-link { font-weight:600; color:#2563eb; }
}

.canvas { flex:1; width:100%; max-width: 1080px; margin: 0 auto; padding: 44px 28px 64px; }

.hero { text-align:center; margin-bottom: 32px; animation: fadeUp .6s ease both;
  .hero-badge { display:inline-flex; align-items:center; gap:7px; padding:5px 13px; margin-bottom:16px; font-size:12px; font-weight:600; color:#2563eb; background:rgba(37,99,235,.08); border:1px solid rgba(37,99,235,.18); border-radius:999px;
    .badge-dot { width:6px; height:6px; border-radius:50%; background:#2563eb; animation:pulse 2s infinite; } }
  h1 { font-size: clamp(24px, 3.2vw, 34px); font-weight: 800; letter-spacing:-.02em; margin:0 0 10px; color:#0f172a;
    .grad { background: linear-gradient(110deg,#2563eb,#6366f1 55%,#06b6d4); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; } }
  p { color: var(--color-text-secondary); font-size: 15px; margin:0; }
}
.hero-limits { display:flex; justify-content:center; flex-wrap:wrap; gap:8px; margin-top:14px;
  span { padding:6px 11px; border-radius:999px; background:rgba(255,255,255,.74); border:1px solid rgba(148,163,184,.24); color:#64748b; font-size:12px; font-weight:600; }
}

.workspace { display:grid; grid-template-columns: 1fr 380px; gap: 24px; align-items:start; }

.card { background:rgba(255,255,255,.72); border:1px solid rgba(255,255,255,.7); border-radius: var(--radius-2xl); padding: 22px; margin-bottom:18px; box-shadow: 0 10px 34px -20px rgba(15,23,42,.28); backdrop-filter: blur(10px); transition: box-shadow .3s ease;
  &:hover { box-shadow: 0 16px 40px -22px rgba(37,99,235,.34); } }
.card-title { display:flex; align-items:center; gap:10px; font-weight:700; font-size:15px; margin-bottom:18px; color:#0f172a;
  .num { width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-size:13px; display:flex; align-items:center; justify-content:center; font-weight:800; box-shadow:0 6px 14px -5px rgba(37,99,235,.6); }
}

.uploads { display:grid; grid-template-columns: repeat(3,1fr); gap:12px; }
.upload {
  position:relative; aspect-ratio: 3/4; border:1.5px dashed var(--color-border-muted); border-radius: var(--radius-lg);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; cursor:pointer;
  background: rgba(248,250,252,.7); transition: all var(--transition-fast); overflow:hidden;
  &:hover { border-color: var(--color-primary); background: var(--color-primary-light); transform: translateY(-2px); }
  &.filled { border-style:solid; border-color: #c7d2fe; }
  img, .upload-video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .upload-vtag { position:absolute; bottom:6px; left:6px; padding:2px 7px; font-size:10px; font-weight:600; color:#fff; background:rgba(0,0,0,.55); border-radius:6px; backdrop-filter:blur(4px); z-index:1; }
  .upload-plus { font-size:22px; color: var(--color-text-tertiary); }
  .upload-label { font-size:12px; color: var(--color-text-secondary); text-align:center; em { display:block; font-style:normal; font-size:11px; color: var(--color-text-tertiary); margin-top:2px; } }
  .upload-spin { position:absolute; inset:0; background:rgba(255,255,255,.7); &::after { content:''; position:absolute; top:50%; left:50%; width:20px; height:20px; margin:-10px; border:2px solid var(--color-border); border-top-color: var(--color-primary); border-radius:50%; animation: spin .8s linear infinite; } }
  .upload-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .upload-del { position:absolute; top:5px; right:5px; z-index:3; width:22px; height:22px; padding:0; border:none; border-radius:50%; background:rgba(15,23,42,.6); color:#fff; font-size:15px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity .15s, background .15s; &:hover { background:rgba(220,38,38,.92); } }
  &:hover .upload-del { opacity:1; }
  .upload-play { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:2; width:40px; height:40px; padding:0; border:1.5px solid rgba(255,255,255,.7); border-radius:50%; background:rgba(15,23,42,.42); backdrop-filter:blur(4px); cursor:pointer; display:flex; align-items:center; justify-content:center;
    .tri { width:0; height:0; margin-left:3px; border-left:12px solid #fff; border-top:7px solid transparent; border-bottom:7px solid transparent; }
    &:hover { background:rgba(37,99,235,.7); } }
}
.upload-note { margin:12px 0 0; color:#64748b; font-size:12px; line-height:1.7; }

.field { width:100%; padding:11px 14px; border:1px solid var(--color-border); border-radius: var(--radius-md); font-size:14px; margin-bottom:10px; background:rgba(255,255,255,.8); transition: all var(--transition-fast); &:last-child{margin-bottom:0;} &:focus{ border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); outline:none; } }

.switches { display:flex; align-items:center; gap:18px; }
.switch { display:flex; align-items:center; gap:7px; font-size:13px; cursor:pointer; user-select:none;
  input { display:none; }
  span { width:36px; height:20px; border-radius:999px; background: var(--color-border-muted); position:relative; transition: background var(--transition-fast); flex-shrink:0;
    &::after { content:''; position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition: transform var(--transition-fast); box-shadow:0 1px 3px rgba(0,0,0,.2); } }
  input:checked + span { background: linear-gradient(135deg,#2563eb,#4f46e5); &::after { transform: translateX(16px); } }
}
.lang { margin-left:auto; padding:7px 10px; border:1px solid var(--color-border); border-radius: var(--radius-md); font-size:13px; background:#fff; cursor:pointer; }

.generate { position:relative; overflow:hidden; width:100%; padding:16px; border:none; border-radius: var(--radius-lg); background: linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-size:15px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:9px; box-shadow: 0 10px 26px -8px rgba(37,99,235,.55); cursor:pointer; transition: transform .2s ease, box-shadow .2s ease;
  &:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 14px 32px -8px rgba(37,99,235,.62); }
  &::after { content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%; background: radial-gradient(circle, rgba(255,255,255,.28) 0%, transparent 60%); opacity:0; transform:scale(.5); transition: opacity .3s, transform .3s; }
  &:not(:disabled):hover::after { opacity:1; transform:scale(1); }
  &:disabled { opacity:.45; box-shadow:none; cursor:not-allowed; }
}
.gen-spin { width:16px; height:16px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation: spin .8s linear infinite; }
.duration-note { text-align:center; font-size:12px; line-height:1.6; color:#64748b; margin:10px 0 0; }
.hint { text-align:center; font-size:13px; color: var(--color-text-tertiary); margin:12px 0 0; }

.preview { position:sticky; top:88px; background:rgba(255,255,255,.78); border:1px solid rgba(255,255,255,.7); border-radius: var(--radius-2xl); padding:20px; box-shadow: 0 18px 44px -22px rgba(15,23,42,.32); backdrop-filter: blur(12px); min-height: 540px; display:flex; flex-direction:column; }
.preview-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; color: var(--color-text-tertiary);
  .phone { width:150px; aspect-ratio:9/16; border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#fff; background: linear-gradient(160deg,#1e293b,#0f172a); box-shadow: 0 20px 44px -16px rgba(37,99,235,.4); position:relative;
    &::before { content:''; position:absolute; inset:6px; border-radius:15px; border:1.5px dashed rgba(255,255,255,.22); }
    span { position:relative; opacity:.85; } }
  p { font-size:13px; margin:0; }
}
.preview-done { flex:1; display:flex; flex-direction:column; gap:14px;
  .result-video { width:100%; border-radius: var(--radius-lg); background:#000; aspect-ratio:9/16; object-fit:contain; box-shadow: 0 16px 36px -18px rgba(15,23,42,.5); }
  .result-actions { display:flex; gap:10px; }
  .btn-download { flex:1; text-align:center; padding:12px; background: linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; border:none; border-radius: var(--radius-md); font-weight:600; font-size:14px; text-decoration:none; cursor:pointer; box-shadow:0 8px 20px -8px rgba(37,99,235,.55); &:disabled { opacity:.6; cursor:default; } }
  .btn-again { flex:1; padding:12px; background:#fff; border:1px solid var(--color-border); border-radius: var(--radius-md); font-weight:600; font-size:14px; color: var(--color-text-primary); cursor:pointer; }
  .result-notes { font-size:12px; color: var(--color-text-tertiary); margin:0; line-height:1.5; }
}
.preview-progress { flex:1; display:flex; flex-direction:column; align-items:center; padding-top:24px; gap:18px;
  .gen-head { text-align:center; display:flex; flex-direction:column; gap:6px;
    b { font-size:17px; font-weight:800; color:#0f172a; }
    .gen-eta { font-size:12px; color: var(--color-text-tertiary); }
  }
  .gen-tip { display:flex; align-items:flex-start; gap:8px; max-width:330px; margin:0; font-size:13px; line-height:1.5; color: var(--color-text-secondary);
    background: rgba(37,99,235,.06); border:1px solid rgba(37,99,235,.12); padding:10px 14px; border-radius:12px;
    .gen-tip-ic { flex-shrink:0; }
  }
  .gen-hint { max-width:330px; margin:0; font-size:12px; line-height:1.5; color: var(--color-text-tertiary); text-align:center; }
  .progress-ring { width:104px; height:104px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px; color:#0f172a;
    background: conic-gradient(#2563eb var(--p), #e8edf5 0); position:relative;
    &::before { content:''; position:absolute; inset:9px; background:#fff; border-radius:50%; }
    &.running { box-shadow: 0 0 0 6px rgba(37,99,235,.08); animation: ringGlow 2s ease-in-out infinite; }
    span { position:relative; z-index:1; }
  }
  .steps { list-style:none; padding:0; margin:0; width:100%; display:flex; flex-direction:column; gap:12px;
    li { display:flex; align-items:center; gap:10px; font-size:14px; color: var(--color-text-tertiary);
      .dot { width:8px; height:8px; border-radius:50%; background: var(--color-border-muted); flex-shrink:0; }
      em { font-style:normal; font-size:11px; color: var(--color-text-tertiary); margin-left:auto; }
      &.running { color: var(--color-text-primary); font-weight:600; .dot { background: var(--color-primary); box-shadow:0 0 0 4px rgba(37,99,235,.15); animation: pulse 1.2s infinite; } }
      &.succeeded { color: var(--color-text-primary); .dot { background: var(--color-success); } }
      &.failed { color: var(--color-error); .dot { background: var(--color-error); } }
      &.skipped { .dot { background: var(--color-warning-icon); } }
    }
  }
  .fail { color: var(--color-error); font-size:13px; text-align:center; }
}

.login-panel { display:flex; align-items:center; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:28px; padding:18px; background:rgba(255,255,255,.6); border:1px solid rgba(37,99,235,.14); border-radius:var(--radius-xl); backdrop-filter: blur(10px); box-shadow: 0 10px 30px -18px rgba(37,99,235,.3); }
.login-field { padding:10px 14px; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:14px; width:180px; background:#fff; &:focus{ border-color:var(--color-primary); outline:none; box-shadow:0 0 0 3px rgba(37,99,235,.12); } }
.login-btn { padding:10px 24px; border:none; border-radius:var(--radius-md); background:linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-weight:600; font-size:14px; cursor:pointer; box-shadow:0 8px 18px -8px rgba(37,99,235,.5); }
.login-btn:disabled { opacity:.5; }
.login-err { font-size:13px; color:var(--color-error); width:100%; text-align:center; }
.login-hint { font-size:13px; color:var(--color-text-secondary); }

.samples { margin-top:16px; padding-top:16px; border-top:1px dashed var(--color-border-light); }
.samples-label { font-size:13px; color:var(--color-text-secondary); }
.samples-row { display:flex; gap:10px; margin-top:10px; }
.sample { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; padding:8px; border:1px solid var(--color-border); border-radius:var(--radius-md); background:rgba(255,255,255,.8); cursor:pointer; transition:all var(--transition-fast); }
.sample:hover { border-color:var(--color-primary); background:var(--color-primary-light); transform: translateY(-2px); }
.sample img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:var(--radius-sm); }
.sample span { font-size:11px; color:var(--color-text-secondary); text-align:center; line-height:1.3; }

.credits-plus { margin-left:7px; padding-left:8px; border-left:1px solid var(--color-border-light); color:var(--color-primary); font-weight:700; }

.model-opts { display:flex; flex-direction:column; gap:14px; margin-bottom:16px; }
.model-row { display:flex; flex-direction:column; gap:8px; }
.model-label { font-size:13px; font-weight:600; color:var(--color-text-secondary); }
.model-hint { margin:-2px 0 0; font-size:12px; line-height:1.5; color:#b45309; background:rgba(245,158,11,.1); border:1px solid rgba(245,158,11,.25); padding:7px 10px; border-radius:8px;
  &.ok { color:#047857; background:rgba(16,185,129,.1); border-color:rgba(16,185,129,.25); } }
.ml-note { font-style:normal; font-weight:400; font-size:11px; color:var(--color-text-tertiary); margin-left:6px; }
.lang-row { margin-bottom:20px; }
.switches { margin-bottom:4px; }
.seg { display:flex; gap:8px; }
.seg button { flex:1; padding:11px 12px; border:1px solid var(--color-border); border-radius:var(--radius-md); background:rgba(255,255,255,.8); font-size:13px; font-weight:600; color:var(--color-text-secondary); cursor:pointer; transition:all var(--transition-fast); display:flex; flex-direction:column; align-items:center; gap:3px; line-height:1.2;
  em { font-style:normal; font-size:11px; font-weight:500; color:var(--color-text-tertiary); }
  &:hover { border-color:var(--color-primary); transform: translateY(-1px); }
  &.active { border-color:var(--color-primary); background:var(--color-primary-light); color:var(--color-primary); box-shadow:0 6px 16px -8px rgba(37,99,235,.4); em { color:var(--color-primary); } }
}

.modal-mask { position:fixed; inset:0; background:rgba(15,23,42,.5); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal { width:100%; max-width:420px; background:#fff; border-radius:var(--radius-2xl); padding:24px; box-shadow:var(--shadow-xl); }
.modal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; b { font-size:18px; font-weight:800; } }
.modal-x { width:30px; height:30px; border:none; background:var(--color-bg-subtle); border-radius:50%; font-size:18px; color:var(--color-text-secondary); cursor:pointer; line-height:1; }
.modal-msg { font-size:13px; color:var(--color-primary); background:var(--color-primary-light); padding:10px 12px; border-radius:var(--radius-md); margin:0 0 14px; }
.pkgs { display:flex; flex-direction:column; gap:10px; }
.pkg { position:relative; display:flex; align-items:center; gap:12px; padding:16px; border:1px solid var(--color-border); border-radius:var(--radius-lg); background:#fff; cursor:pointer; transition:all var(--transition-fast);
  &:hover:not(:disabled) { border-color:var(--color-primary); background:var(--color-primary-light); transform: translateY(-1px); }
  &:disabled { opacity:.6; cursor:default; }
}
.pkg-credits { font-size:20px; font-weight:800; color:var(--color-text-primary); em { font-style:normal; font-size:12px; font-weight:500; color:var(--color-text-tertiary); margin-left:3px; } }
.pkg-bonus { font-size:11px; font-weight:600; color:#f59e0b; background:#fef3c7; padding:2px 8px; border-radius:999px; }
.pkg-price { margin-left:auto; font-size:17px; font-weight:800; color:var(--color-primary); }
.pkg-spin { position:absolute; right:16px; width:16px; height:16px; border:2px solid var(--color-border); border-top-color:var(--color-primary); border-radius:50%; animation:spin .8s linear infinite; }
.modal-foot { font-size:11px; color:var(--color-text-tertiary); text-align:center; margin:14px 0 0; }
.modal-tip { font-size:14px; line-height:1.75; color: var(--color-text-secondary); text-align:center; padding:6px 4px 2px; b { color: var(--color-primary); font-weight:700; } }

.voice-hint { font-size:12px; color:var(--color-text-tertiary); margin:10px 0 0; line-height:1.5; }
.script { background:rgba(248,250,252,.8); border:1px solid var(--color-border-light); border-radius:var(--radius-md); padding:12px 14px;
  .script-head { font-size:13px; font-weight:700; margin-bottom:8px; }
  ol { margin:0; padding-left:18px; display:flex; flex-direction:column; gap:6px; }
  li { font-size:13px; color:var(--color-text-primary); line-height:1.4; em { font-style:normal; font-size:11px; font-weight:600; color:var(--color-primary); margin-right:6px; text-transform:uppercase; } }
}

.voice-pick { margin-top:14px; display:flex; flex-direction:column; gap:8px; }
.voice-trigger {
  display:flex; align-items:center; gap:10px; width:100%; padding:11px 14px; text-align:left;
  border:1px solid var(--color-border); border-radius:var(--radius-md); background:rgba(255,255,255,.85);
  cursor:pointer; transition:all var(--transition-fast);
  &:hover { border-color:var(--color-primary); box-shadow:0 4px 12px -6px rgba(37,99,235,.35); }
  .vt-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; &.f{ background:#db2777; } &.m{ background:#2563eb; } }
  .vt-name { font-size:14px; font-weight:700; color:var(--color-text-primary); flex-shrink:0; }
  .vt-desc { font-size:12px; color:var(--color-text-tertiary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .vt-play { margin-left:auto; width:24px; height:24px; flex-shrink:0; border-radius:50%; background:var(--color-primary-light); color:var(--color-primary); font-size:9px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all var(--transition-fast); &:hover { background:var(--color-primary); color:#fff; } }
  .vt-more { font-size:12px; font-weight:600; color:var(--color-primary); flex-shrink:0; }
}

.vp-mask { position:fixed; inset:0; background:rgba(15,23,42,.5); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:120; padding:20px; }
.vp-modal { width:100%; max-width:560px; max-height:82vh; display:flex; flex-direction:column; background:#fff; border-radius:var(--radius-2xl); box-shadow:var(--shadow-xl); overflow:hidden; }
.vp-head { display:flex; align-items:center; justify-content:space-between; padding:18px 20px 12px; b{ font-size:17px; font-weight:800; } }
.vp-x { width:30px; height:30px; border:none; background:var(--color-bg-subtle); border-radius:50%; font-size:18px; color:var(--color-text-secondary); cursor:pointer; line-height:1; }
.vp-search { margin:0 20px; padding:11px 14px; border:1px solid var(--color-border); border-radius:var(--radius-md); font-size:14px; background:var(--color-bg-subtle); &:focus{ outline:none; border-color:var(--color-primary); box-shadow:0 0 0 3px rgba(37,99,235,.12); background:#fff; } }
.vp-tabs { display:flex; flex-wrap:wrap; gap:8px; padding:14px 20px 6px;
  button { padding:6px 14px; border:1px solid var(--color-border); border-radius:999px; background:#fff; font-size:13px; font-weight:600; color:var(--color-text-secondary); cursor:pointer; transition:all var(--transition-fast);
    &:hover { border-color:var(--color-primary); }
    &.active { background:linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; border-color:transparent; box-shadow:0 6px 14px -6px rgba(37,99,235,.5); } }
}
.vp-grid { flex:1; overflow-y:auto; display:grid; grid-template-columns:repeat(2,1fr); gap:10px; padding:12px 20px;
  @media (min-width:480px){ grid-template-columns:repeat(3,1fr); }
}
.vp-card { position:relative; display:flex; flex-direction:column; gap:5px; padding:13px; border:1px solid var(--color-border); border-radius:var(--radius-lg); background:#fff; cursor:pointer; text-align:left; transition:all var(--transition-fast);
  &:hover { border-color:var(--color-primary); transform:translateY(-2px); box-shadow:0 10px 20px -10px rgba(37,99,235,.4); }
  &.active { border-color:var(--color-primary); background:var(--color-primary-light); box-shadow:0 10px 20px -10px rgba(37,99,235,.5);
    .vp-card-name{ color:var(--color-primary); } }
  .vp-card-top { display:flex; align-items:center; justify-content:space-between; }
  .vp-gender { min-width:18px; text-align:center; font-size:10px; font-weight:700; padding:1px 6px; border-radius:999px; &.f{ color:#db2777; background:rgba(219,39,119,.1); } &.m{ color:#2563eb; background:rgba(37,99,235,.1); } }
  .vp-play { width:22px; height:22px; border-radius:50%; background:var(--color-primary-light); color:var(--color-primary); font-size:9px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all var(--transition-fast); &:hover { background:var(--color-primary); color:#fff; transform:scale(1.1); } }
  .vp-card-name { font-size:14px; font-weight:700; color:var(--color-text-primary); }
  .vp-card-desc { font-size:11px; color:var(--color-text-tertiary); line-height:1.4; }
}
.vp-empty { grid-column:1/-1; text-align:center; color:var(--color-text-tertiary); font-size:13px; padding:28px 0; }
.vp-foot { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 20px 16px; border-top:1px solid var(--color-border-light); font-size:12px; color:var(--color-text-tertiary);
  .vp-done { padding:9px 24px; border:none; border-radius:var(--radius-md); background:linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 6px 14px -6px rgba(37,99,235,.5); flex-shrink:0; }
}

@keyframes ringGlow { 0%,100% { box-shadow: 0 0 0 6px rgba(37,99,235,.08); } 50% { box-shadow: 0 0 0 10px rgba(37,99,235,.04); } }
@keyframes fadeUp { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: none; } }

@media (max-width: 880px) {
  .workspace { grid-template-columns: 1fr; }
  .preview { position:relative; top:0; }
}
/* 手机端：减小内边距、防溢出 */
@media (max-width: 640px) {
  .canvas { padding: 24px 16px 48px; }
  .card { padding: 18px 16px; }
  .uploads { gap:10px; }
  .upload { min-width:0; }
  .hero { margin-bottom: 24px; h1 { font-size: clamp(22px, 6vw, 30px); } p { font-size: 14px; } }
}
/* 参考视频播放弹层 */
.pv-mask { position:fixed; inset:0; background:rgba(15,23,42,.62); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:220; padding:20px; }
.pv-box { position:relative; background:#000; border-radius:var(--radius-2xl); overflow:hidden; box-shadow:var(--shadow-xl); max-width:min(92vw, 460px); }
.pv-x { position:absolute; top:8px; right:10px; z-index:3; width:32px; height:32px; border:none; border-radius:50%; background:rgba(15,23,42,.55); color:#fff; font-size:20px; line-height:1; cursor:pointer; }
.pv-video { display:block; width:100%; max-height:86vh; object-fit:contain; background:#000; }
</style>
