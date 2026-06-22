<template>
  <div class="shell">
    <!-- 左侧导航 -->
    <aside class="sidebar">
      <router-link to="/" class="brand">
        <span class="brand-mark">M</span>
        <span class="brand-name">Moly</span>
      </router-link>

      <nav class="nav">
        <router-link to="/studio" class="nav-item" :class="{ active: isActive('/studio') }">
          <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m10 9 5 3-5 3Z"/></svg></span><span class="lb">复刻工作台</span>
        </router-link>
        <router-link to="/discover" class="nav-item" :class="{ active: isActive('/discover') }">
          <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.8-3.8"/></svg></span><span class="lb">找爆款</span>
        </router-link>
        <router-link to="/history" class="nav-item" :class="{ active: isActive('/history') }">
          <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/></svg></span><span class="lb">历史</span>
        </router-link>
        <router-link v-if="isAdmin" to="/admin" class="nav-item" :class="{ active: isActive('/admin') }">
          <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v5c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6Z"/><path d="m9 12 2 2 4-4"/></svg></span><span class="lb">管理</span>
        </router-link>
      </nav>

      <!-- 我的：钉在左下角 -->
      <div class="me">
        <template v-if="auth.isLoggedIn">
          <div class="me-row">
            <span class="avatar">{{ initial }}</span>
            <div class="me-info">
              <span class="me-name">{{ display }}</span>
              <button type="button" class="me-credits" @click="ui.openRecharge()"><svg class="bolt" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z"/></svg>{{ auth.points }} 积分 · 充值</button>
            </div>
          </div>
          <button type="button" class="me-logout" @click="logout">退出登录</button>
        </template>
        <router-link v-else to="/login" class="me-login">登录 / 注册</router-link>
      </div>
    </aside>

    <!-- 主内容 -->
    <main class="content">
      <router-view />
    </main>

    <!-- 全局充值弹窗（侧边栏与工作台共用） -->
    <div v-if="ui.showRecharge" class="modal-mask" @click.self="ui.closeRecharge()">
      <div class="modal">
        <div class="modal-head"><b>{{ auth.isTester ? '积分充值' : '内测体验额度' }}</b><button type="button" class="modal-x" @click="ui.closeRecharge()">×</button></div>
        <p v-if="ui.rechargeMsg" class="modal-msg">{{ ui.rechargeMsg }}</p>
        <template v-if="payStep === 'pkg'">
          <div class="pkgs">
            <button v-for="p in packages" :key="p.id" type="button" class="pkg" :disabled="paying || !!recharging" @click="recharge(p)">
              <span class="pkg-credits">{{ p.credits + p.bonus }}<em>积分</em></span>
              <span v-if="p.bonus" class="pkg-bonus">含赠 {{ p.bonus }}</span>
              <span class="pkg-price">¥{{ p.priceYuan }}</span>
              <span v-if="recharging === p.id || (paying && !payOrder)" class="pkg-spin" />
            </button>
          </div>
          <p class="modal-foot">当前余额 {{ auth.points }} 积分{{ auth.isTester ? ' · 测试账号直充' : '' }}</p>
        </template>
        <template v-else-if="payStep === 'qr'">
          <p class="pay-sub">请用{{ payOrder?.channel === 'wechat' ? '微信' : '支付宝' }}扫码支付 <b>¥{{ payOrder?.amountYuan }}</b>（到账 {{ payOrder?.credits }} 积分）</p>
          <img v-if="payOrder?.qrUrl" :src="payOrder.qrUrl" alt="支付二维码" class="pay-qr" />
          <a v-else-if="payOrder?.payUrl" :href="payOrder.payUrl" target="_blank" rel="noopener" class="pay-link">点此打开支付</a>
          <p class="modal-foot">支付完成后自动到账，请稍候…</p>
        </template>
        <p v-else class="pay-done">✅ 支付成功，已到账 <b>{{ payOrder?.credits }}</b> 积分！当前余额 <b>{{ auth.points }}</b>。</p>
        <button v-if="auth.isLoggedIn" type="button" class="modal-logout" @click="logout">退出登录</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const ui = useUiStore();

const isActive = (p: string) => route.path.startsWith(p);
const display = computed(() => auth.displayName);
const initial = computed(() => (auth.email || auth.phone || 'U').trim().charAt(0).toUpperCase());

function logout() { auth.logout(); router.push('/'); }

const DEFAULT_PACKAGES = [
  { id: 'starter', label: '体验包', credits: 200, bonus: 0, priceYuan: 19.9 },
  { id: 'basic', label: '创作包', credits: 690, bonus: 110, priceYuan: 69 },
  { id: 'pro', label: '热门包', credits: 1990, bonus: 610, priceYuan: 199 },
  { id: 'flagship', label: '旗舰包', credits: 4990, bonus: 2010, priceYuan: 499 },
];
const packages = ref<any[]>(DEFAULT_PACKAGES);
const recharging = ref('');
const isAdmin = ref(false);

onMounted(async () => {
  try {
    const j = await (await fetch('/api/replica/pricing')).json();
    if (j.success && j.packages) packages.value = j.packages;
  } catch { /* 用默认套餐 */ }
  if (auth.isLoggedIn && auth.email) {
    auth.fetchPointsFromServer(auth.email);
    try {
      const a = await (await fetch(`/api/admin/check?email=${encodeURIComponent(auth.email)}`)).json();
      isAdmin.value = !!a.isAdmin;
    } catch { /* 非管理员 */ }
  }
});

// 真支付：下单→出二维码→轮询到账。测试号仍走直充。
const payStep = ref<'pkg' | 'qr' | 'done'>('pkg');
const payOrder = ref<any>(null);
const paying = ref(false);
let payTimer: any = null;

watch(() => ui.showRecharge, (v) => {
  if (!v) { if (payTimer) { clearInterval(payTimer); payTimer = null; } payStep.value = 'pkg'; payOrder.value = null; }
});

async function recharge(pkg: any) {
  if (auth.isTester) { return rechargeTester(pkg); }
  paying.value = true; ui.rechargeMsg = '';
  try {
    const ch = await (await fetch('/api/pay/channels')).json().catch(() => ({}));
    const channel = ch.alipay ? 'alipay' : (ch.wechat ? 'wechat' : 'alipay');
    const r = await fetch('/api/pay/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userEmail: auth.email, packageId: pkg.id, channel }) });
    const j = await r.json();
    if (!j.success) { ui.rechargeMsg = j.message || '下单失败'; return; }
    payOrder.value = { ...j, channel }; payStep.value = 'qr';
    payTimer = setInterval(pollPay, 3000);
  } catch { ui.rechargeMsg = '网络错误，请重试'; }
  finally { paying.value = false; }
}
async function pollPay() {
  if (!payOrder.value?.orderId) return;
  try {
    const j = await (await fetch(`/api/pay/order?orderId=${encodeURIComponent(payOrder.value.orderId)}`)).json();
    if (j.status === 'paid') { if (payTimer) { clearInterval(payTimer); payTimer = null; } if (auth.email) await auth.fetchPointsFromServer(auth.email); payStep.value = 'done'; }
  } catch { /* 下一轮再试 */ }
}
async function rechargeTester(pkg: any) {
  recharging.value = pkg.id;
  try {
    const r = await fetch('/api/replica/recharge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userEmail: auth.email, packageId: pkg.id }) });
    const j = await r.json();
    if (j.success) {
      if (auth.email) await auth.fetchPointsFromServer(auth.email);
      ui.rechargeMsg = `充值成功，已到账 ${j.added} 积分`;
      setTimeout(() => ui.closeRecharge(), 1200);
    } else { ui.rechargeMsg = j.message || '充值失败'; }
  } catch { ui.rechargeMsg = '网络错误，请重试'; }
  finally { recharging.value = ''; }
}
</script>

<style scoped lang="scss">
.shell { min-height: 100vh; display: flex; background: var(--color-bg-subtle); }

.sidebar {
  width: 220px; flex-shrink: 0; position: sticky; top: 0; height: 100vh;
  display: flex; flex-direction: column; padding: 20px 14px;
  background: rgba(255,255,255,.78); backdrop-filter: blur(14px);
  border-right: 1px solid rgba(255,255,255,.7); box-shadow: 1px 0 0 rgba(37,99,235,.05);
}
.brand { display: flex; align-items: center; gap: 9px; padding: 4px 8px 18px; text-decoration: none;
  .brand-mark { width: 30px; height: 30px; border-radius: 9px; background: linear-gradient(135deg,#3B82F6,#6366F1); color:#fff; font-weight:800; font-size:16px; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 14px -4px rgba(37,99,235,.6); }
  .brand-name { font-size: 20px; font-weight: 800; letter-spacing: -.02em; color: var(--color-text-primary); }
}
.nav { display: flex; flex-direction: column; gap: 4px; }
.nav-item {
  display: flex; align-items: center; gap: 11px; padding: 11px 12px; border-radius: 12px;
  font-size: 14px; font-weight: 600; color: var(--color-text-secondary); text-decoration: none;
  border: none; background: transparent; cursor: pointer; width: 100%; text-align: left;
  transition: all .2s ease;
  .ic { width:19px; height:19px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; svg { width:100%; height:100%; } }
  .lb { display:flex; align-items:center; gap:6px; em { font-style:normal; font-size:10px; font-weight:600; color:#fff; background:#c7d2fe; padding:1px 6px; border-radius:999px; } }
  &:hover:not(.disabled) { background: rgba(37,99,235,.07); color: var(--color-text-primary); }
  &.active { background: linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; box-shadow:0 8px 18px -8px rgba(37,99,235,.5); }
  &.disabled { opacity:.55; cursor:default; }
}

.me { margin-top: auto; padding-top: 14px; border-top: 1px solid var(--color-border-light); }
.me-row { display: flex; align-items: center; gap: 10px; padding: 6px 6px 8px; }
.avatar { width: 34px; height: 34px; border-radius: 50%; flex-shrink:0; background: linear-gradient(135deg,#6366f1,#06b6d4); color:#fff; font-weight:700; display:flex; align-items:center; justify-content:center; }
.me-info { display: flex; flex-direction: column; min-width: 0; }
.me-name { font-size: 13px; font-weight: 700; color: var(--color-text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.me-credits { display:inline-flex; align-items:center; gap:4px; font-size: 12px; color: var(--color-primary); font-weight: 600; background:none; border:none; padding:0; cursor:pointer; text-align:left; .bolt { width:11px; height:11px; flex-shrink:0; } }
.me-logout { width: 100%; margin-top: 4px; padding: 8px; border: 1px solid var(--color-border); border-radius: 10px; background:#fff; font-size: 12px; color: var(--color-text-secondary); cursor: pointer; &:hover { border-color:#c7d2fe; } }
.me-login { display:block; text-align:center; padding: 10px; border-radius: 10px; background: linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-weight:600; font-size:14px; text-decoration:none; }

.content { flex: 1; min-width: 0; }

/* 手机端：左侧栏 → 底部 Tab 栏，释放全宽（iPad/桌面保持侧栏） */
@media (max-width: 640px) {
  .shell { flex-direction: column; overflow-x: hidden; }
  .sidebar {
    position: fixed; left: 0; right: 0; bottom: 0; top: auto;
    width: 100%; height: auto; flex-direction: row; align-items: stretch; gap: 2px;
    padding: 4px 6px calc(4px + env(safe-area-inset-bottom, 0px));
    border-right: none; border-top: 1px solid rgba(37,99,235,.12);
    box-shadow: 0 -6px 20px -10px rgba(15,23,42,.18); z-index: 60;
  }
  .brand { display: none; }
  .nav { flex-direction: row; flex: 1; gap: 2px; }
  .nav-item {
    flex: 1; flex-direction: column; justify-content: center; gap: 3px;
    padding: 7px 2px; border-radius: 12px; width: auto; font-size: 11px;
    .ic { width: 22px; height: 22px; }
    .lb { font-size: 11px; gap: 0; em { display: none; } }
    &.active { background: transparent; color: var(--color-primary); box-shadow: none; }
  }
  .me {
    margin-top: 0; padding-top: 0; border-top: none;
    border-left: 1px solid var(--color-border-light);
    display: flex; align-items: center; padding-left: 6px; margin-left: 2px;
  }
  .me-row { flex-direction: column; gap: 2px; padding: 4px 6px; align-items: center; }
  .me-name, .me-logout { display: none; }
  .avatar { width: 26px; height: 26px; font-size: 12px; }
  .me-credits { font-size: 10px; white-space: nowrap; }
  .me-login { padding: 8px 12px; font-size: 12px; }
  .content { padding-bottom: 70px; }
}

.modal-logout { display: none; }
@media (max-width: 640px) {
  .modal-logout { display: block; width: 100%; margin-top: 12px; padding: 10px; border: 1px solid var(--color-border); border-radius: 10px; background:#fff; font-size: 13px; color: var(--color-text-secondary); cursor: pointer; }
}

/* 充值弹窗（与工作台同款） */
.modal-mask { position:fixed; inset:0; background:rgba(15,23,42,.5); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:200; padding:20px; }
.modal { width:100%; max-width:420px; background:#fff; border-radius:var(--radius-2xl); padding:24px; box-shadow:var(--shadow-xl); }
.modal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; b { font-size:18px; font-weight:800; } }
.modal-x { width:30px; height:30px; border:none; background:var(--color-bg-subtle); border-radius:50%; font-size:18px; color:var(--color-text-secondary); cursor:pointer; line-height:1; }
.modal-msg { font-size:13px; color:var(--color-primary); background:var(--color-primary-light); padding:10px 12px; border-radius:var(--radius-md); margin:0 0 14px; }
.pkgs { display:flex; flex-direction:column; gap:10px; }
.pkg { position:relative; display:flex; align-items:center; gap:12px; padding:16px; border:1px solid var(--color-border); border-radius:var(--radius-lg); background:#fff; cursor:pointer; transition:all var(--transition-fast);
  &:hover:not(:disabled) { border-color:var(--color-primary); background:var(--color-primary-light); transform:translateY(-1px); }
  &:disabled { opacity:.6; cursor:default; }
}
.pkg-credits { font-size:20px; font-weight:800; color:var(--color-text-primary); em { font-style:normal; font-size:12px; font-weight:500; color:var(--color-text-tertiary); margin-left:3px; } }
.pkg-bonus { font-size:11px; font-weight:600; color:#f59e0b; background:#fef3c7; padding:2px 8px; border-radius:999px; }
.pkg-price { margin-left:auto; font-size:17px; font-weight:800; color:var(--color-primary); }
.pkg-spin { position:absolute; right:16px; width:16px; height:16px; border:2px solid var(--color-border); border-top-color:var(--color-primary); border-radius:50%; animation:spin .8s linear infinite; }
.modal-foot { font-size:11px; color:var(--color-text-tertiary); text-align:center; margin:14px 0 0; }
.modal-tip { font-size:14px; line-height:1.75; color: var(--color-text-secondary); text-align:center; padding:6px 4px 2px; b { color: var(--color-primary); font-weight:700; } }
.pay-sub { font-size:14px; color:var(--color-text-secondary); text-align:center; margin:0 0 6px; b { color:var(--color-primary); font-weight:800; } }
.pay-qr { width:220px; height:220px; display:block; margin:14px auto; border-radius:12px; border:1px solid var(--color-border-light); }
.pay-link { display:block; text-align:center; margin:14px auto; color:var(--color-primary); font-weight:700; }
.pay-done { font-size:15px; line-height:1.8; color:#065f46; background:#ecfdf5; border-radius:12px; padding:18px; text-align:center; b { color:#16a34a; } }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
