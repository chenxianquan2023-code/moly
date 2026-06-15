<template>
  <div class="admin">
    <header class="head">
      <h1>超级管理员 · 积分充值</h1>
      <p>给任意已注册用户充值积分。需后台配置 <code>ADMIN_SECRET</code> 并在下方填入密钥。</p>
    </header>

    <div v-if="!isAdmin" class="card deny">无权限。当前账号不是管理员。</div>

    <template v-else>
      <div v-if="!enabled" class="card warn">后台尚未配置 <code>ADMIN_SECRET</code> 环境变量，充值功能未开启。请在 Railway 设好后刷新。</div>

      <div class="card">
        <label class="fld">
          <span>管理员密钥</span>
          <input v-model="secret" type="password" placeholder="ADMIN_SECRET（本机记住，不上传明文存储）" @change="saveSecret" />
        </label>

        <label class="fld">
          <span>目标用户邮箱</span>
          <div class="row">
            <input v-model="targetEmail" type="email" placeholder="user@example.com" @keyup.enter="lookup" />
            <button type="button" class="btn ghost" :disabled="busy || !targetEmail || !secret" @click="lookup">查余额</button>
          </div>
        </label>
        <p v-if="currentBalance !== null" class="balance">该用户当前余额：<b>{{ currentBalance }}</b> 积分</p>

        <div class="fld">
          <span>充值积分</span>
          <div class="presets">
            <button v-for="p in presets" :key="p.label" type="button" class="preset" :class="{ on: amount === p.credits }" @click="amount = p.credits">
              <b>{{ p.credits }}</b><em>{{ p.label }} ¥{{ p.priceYuan }}</em>
            </button>
            <input v-model.number="amount" type="number" min="1" class="custom" placeholder="自定义" />
          </div>
        </div>

        <label class="fld">
          <span>备注（可选）</span>
          <input v-model="reason" type="text" maxlength="40" placeholder="如：渠道赠送 / 补偿" />
        </label>

        <button type="button" class="btn primary" :disabled="busy || !canGrant" @click="grant">
          {{ busy ? '处理中…' : `给 ${targetEmail || '该用户'} 充 ${amount || 0} 积分` }}
        </button>
        <p v-if="msg" class="msg" :class="msgType">{{ msg }}</p>
      </div>

      <div v-if="log.length" class="card">
        <h2>本次会话充值记录</h2>
        <div v-for="(g, i) in log" :key="i" class="logrow">
          <span class="le">{{ g.email }}</span>
          <span class="la">+{{ g.added }}</span>
          <span class="lb">余额 {{ g.points }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const isAdmin = ref(false);
const enabled = ref(false);
const presets = ref<any[]>([]);
const secret = ref('');
const targetEmail = ref('');
const amount = ref<number | null>(null);
const reason = ref('');
const currentBalance = ref<number | null>(null);
const busy = ref(false);
const msg = ref('');
const msgType = ref<'ok' | 'err'>('ok');
const log = ref<any[]>([]);

const canGrant = computed(() => !!secret.value && !!targetEmail.value && !!amount.value && amount.value > 0);

function saveSecret() { try { localStorage.setItem('moly_admin_secret', secret.value); } catch { /* ignore */ } }

onMounted(async () => {
  try { secret.value = localStorage.getItem('moly_admin_secret') || ''; } catch { /* ignore */ }
  if (!auth.isLoggedIn || !auth.email) return;
  try {
    const a = await (await fetch(`/api/admin/check?email=${encodeURIComponent(auth.email)}`)).json();
    isAdmin.value = !!a.isAdmin;
    enabled.value = !!a.enabled;
    presets.value = a.presets || [];
  } catch { /* ignore */ }
});

async function lookup() {
  currentBalance.value = null; msg.value = '';
  busy.value = true;
  try {
    const r = await fetch(`/api/admin/user?email=${encodeURIComponent(targetEmail.value)}&adminSecret=${encodeURIComponent(secret.value)}`);
    const j = await r.json();
    if (j.success) { currentBalance.value = j.points; }
    else { msg.value = j.message || '查询失败'; msgType.value = 'err'; }
  } catch { msg.value = '网络错误'; msgType.value = 'err'; }
  finally { busy.value = false; }
}

async function grant() {
  if (!canGrant.value) return;
  busy.value = true; msg.value = '';
  try {
    const r = await fetch('/api/admin/grant', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail: auth.email, adminSecret: secret.value, targetEmail: targetEmail.value, amount: amount.value, reason: reason.value }),
    });
    const j = await r.json();
    if (j.success) {
      msg.value = `✅ 已给 ${j.email} 充值 ${j.added} 积分，当前余额 ${j.points}`;
      msgType.value = 'ok';
      currentBalance.value = j.points;
      log.value.unshift({ email: j.email, added: j.added, points: j.points });
      reason.value = '';
    } else { msg.value = j.message || '充值失败'; msgType.value = 'err'; }
  } catch { msg.value = '网络错误'; msgType.value = 'err'; }
  finally { busy.value = false; }
}
</script>

<style scoped lang="scss">
.admin { max-width: 720px; margin: 0 auto; padding: 36px 28px 64px; }
.head h1 { font-size: 24px; font-weight: 800; color: #0f172a; }
.head p { font-size: 13px; color: #64748b; margin-top: 6px; code { background:#f1f5f9; padding:1px 6px; border-radius:6px; font-size:12px; } }
.card { margin-top: 18px; padding: 20px; border: 1px solid rgba(148,163,184,.22); border-radius: 18px; background: rgba(255,255,255,.86); box-shadow: 0 16px 34px -30px rgba(15,23,42,.45); }
.card.deny { color:#b91c1c; font-weight:600; }
.card.warn { color:#92400e; background:#fffbeb; border-color:#fde68a; font-size:13px; }
.card h2 { font-size: 14px; font-weight: 800; color:#0f172a; margin-bottom: 12px; }
.fld { display:block; margin-bottom: 16px; > span { display:block; font-size:12px; font-weight:700; color:#475569; margin-bottom:7px; } }
.fld input[type=email], .fld input[type=password], .fld input[type=text] { width:100%; padding:11px 13px; border:1px solid #e2e8f0; border-radius:11px; font-size:14px; outline:none; &:focus { border-color:#2563eb; } }
.row { display:flex; gap:8px; input { flex:1; } }
.balance { font-size:13px; color:#0f172a; margin:-6px 0 16px; b { color:#2563eb; } }
.presets { display:flex; flex-wrap:wrap; gap:8px; }
.preset { display:flex; flex-direction:column; align-items:flex-start; gap:2px; padding:10px 14px; border:1px solid #e2e8f0; border-radius:12px; background:#fff; cursor:pointer; transition:all .16s ease;
  b { font-size:16px; font-weight:800; color:#0f172a; } em { font-style:normal; font-size:11px; color:#94a3b8; }
  &:hover { border-color:#c7d2fe; } &.on { border-color:#2563eb; background:#eff6ff; }
}
.custom { width:110px; padding:10px 12px; border:1px solid #e2e8f0; border-radius:12px; font-size:15px; outline:none; &:focus { border-color:#2563eb; } }
.btn { padding:11px 16px; border-radius:11px; font-size:14px; font-weight:700; cursor:pointer; border:1px solid transparent; &:disabled { opacity:.5; cursor:default; } }
.btn.ghost { background:#fff; border-color:#e2e8f0; color:#475569; &:hover:not(:disabled){ border-color:#c7d2fe; } }
.btn.primary { width:100%; margin-top:6px; background:linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; box-shadow:0 10px 22px -12px rgba(37,99,235,.6); }
.msg { margin-top:12px; font-size:13px; padding:10px 12px; border-radius:10px; &.ok { color:#065f46; background:#ecfdf5; } &.err { color:#b91c1c; background:#fef2f2; } }
.logrow { display:flex; align-items:center; gap:10px; padding:8px 0; border-top:1px solid #f1f5f9; font-size:13px;
  .le { flex:1; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .la { color:#16a34a; font-weight:700; } .lb { color:#94a3b8; }
}
</style>
