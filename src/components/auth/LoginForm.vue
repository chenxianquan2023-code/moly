<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Google 一键登录(配置了 GOOGLE_CLIENT_ID 才显示；国内无代理加载失败则自动隐藏) -->
    <div v-show="googleReady" class="space-y-3">
      <div ref="googleBtn" class="flex justify-center"></div>
      <div class="flex items-center gap-3">
        <span class="flex-1 h-px bg-[#E5E7EB]"></span>
        <span class="text-xs text-[#9CA3AF]">或者</span>
        <span class="flex-1 h-px bg-[#E5E7EB]"></span>
      </div>
    </div>

    <!-- 海外站定位：仅邮箱。两种方式——密码登录 | 验证码登录(验证码即登录即注册) -->
    <div class="flex border-b border-[#E5E7EB] mb-6">
      <button
        type="button"
        :class="['flex-1 pb-3 text-base font-medium transition-colors', method === 'password' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-[#6B7280]']"
        @click="switchMethod('password')"
      >
        密码登录
      </button>
      <button
        type="button"
        :class="['flex-1 pb-3 text-base font-medium transition-colors', method === 'email_code' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-[#6B7280]']"
        @click="switchMethod('email_code')"
      >
        验证码登录
      </button>
    </div>

    <!-- 邮箱(两种方式共用) -->
    <div>
      <input
        v-model="email"
        type="email"
        placeholder="请输入邮箱地址"
        :class="['w-full h-12 px-4 text-[15px] border rounded-lg outline-none bg-[#F9FAFB] transition-colors', emailError ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#2563EB] focus:bg-white']"
        @input="emailError = ''"
      />
      <p v-if="emailError" class="mt-1.5 text-xs text-[#EF4444]">{{ emailError }}</p>
    </div>

    <!-- 密码登录 -->
    <template v-if="method === 'password'">
      <div>
        <PasswordInput
          v-model="password"
          placeholder="请输入密码"
          :error="!!passwordError"
          @input="passwordError = ''"
        />
        <p v-if="passwordError" class="mt-1.5 text-xs text-[#EF4444]">{{ passwordError }}</p>
      </div>
    </template>

    <!-- 验证码登录(未注册的邮箱会自动注册并赠送体验积分) -->
    <template v-else>
      <div>
        <VerificationInput
          v-model="code"
          :countdown="countdown"
          :can-send="isEmailValid"
          send-text="获取验证码"
          :error="!!codeError"
          @send="sendEmailCode"
        />
        <p v-if="codeError" class="mt-1.5 text-xs text-[#EF4444]">{{ codeError }}</p>
        <p v-if="devCode" class="mt-1.5 text-xs text-[#2563EB]">验证码（本地开发）：{{ devCode }}</p>
        <p class="mt-1.5 text-xs text-[#9CA3AF]">未注册的邮箱将自动创建账号并赠送体验积分</p>
      </div>
    </template>

    <!-- 用户协议 -->
    <p class="text-xs text-[#6B7280] leading-relaxed pt-2">
      注册登录即代表已阅读并同意我们的
      <a href="#" class="text-[#2563EB] hover:underline" @click.prevent>用户协议</a>
      与
      <a href="#" class="text-[#2563EB] hover:underline" @click.prevent>隐私政策</a>
    </p>

    <!-- 忘记密码 / 立即注册 -->
    <div class="flex justify-between items-center text-sm">
      <router-link to="/forgot-password" class="text-[#6B7280] hover:underline">忘记密码</router-link>
      <router-link :to="{ name: 'register', query: $route.query }" class="text-[#6B7280] hover:underline">立即注册</router-link>
    </div>

    <!-- 提交错误 -->
    <p v-if="submitError" class="text-sm text-[#EF4444] text-center">{{ submitError }}</p>

    <!-- 登录按钮 -->
    <button
      type="submit"
      :disabled="submitting"
      class="w-full h-12 rounded-full bg-[#2563EB] !text-white font-medium text-base hover:bg-[#1d4ed8] active:bg-[#1e40af] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
      style="color: white;"
    >
      <span v-if="submitting" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      {{ submitting ? '登录中...' : '登录' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import VerificationInput from './VerificationInput.vue';
import PasswordInput from './PasswordInput.vue';
import { useVerification } from '@/composables/useVerification';
import { useAuthStore } from '@/stores/auth';
import * as api from '@/api/auth';
import { validateEmail, validateCode } from '@/utils/validators';
import type { RegionMode } from '@/types/auth.types';

// regionMode 保留以兼容父组件传参；海外站统一邮箱登录，不再分区
defineProps<{ regionMode?: RegionMode }>();
const auth = useAuthStore();
const emit = defineEmits<{ success: [] }>();

const method = ref<'password' | 'email_code'>('password');
const email = ref('');
const password = ref('');
const code = ref('');
const { countdown, start: startCooldown } = useVerification(60);
const devCode = ref('');
const submitting = ref(false);

const codeError = ref('');
const emailError = ref('');
const passwordError = ref('');
const submitError = ref('');

const isEmailValid = computed(() => validateEmail(email.value).valid);

function switchMethod(newMethod: 'password' | 'email_code') {
  method.value = newMethod;
  codeError.value = '';
  emailError.value = '';
  passwordError.value = '';
  submitError.value = '';
  devCode.value = '';
}

// ── Google 一键登录(GIS)：后端配置了 GOOGLE_CLIENT_ID 才渲染；脚本加载失败(国内无代理)静默隐藏 ──
const googleBtn = ref<HTMLElement | null>(null);
const googleReady = ref(false);

onMounted(async () => {
  try {
    const cfg = await (await fetch('/api/auth/google-config')).json();
    const clientId = cfg?.clientId;
    if (!clientId) return;
    await new Promise<void>((resolve, reject) => {
      if ((window as any).google?.accounts?.id) return resolve();
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('gsi load failed'));
      document.head.appendChild(s);
    });
    const gsi = (window as any).google.accounts.id;
    gsi.initialize({ client_id: clientId, callback: onGoogleCredential });
    if (googleBtn.value) {
      gsi.renderButton(googleBtn.value, { theme: 'outline', size: 'large', width: 320, text: 'signin_with', locale: 'zh_CN' });
      googleReady.value = true;
    }
  } catch { /* 加载失败(常见于国内直连)→ 不显示 Google 按钮，邮箱登录不受影响 */ }
});

async function onGoogleCredential(resp: any) {
  submitError.value = '';
  submitting.value = true;
  try {
    const r = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: resp?.credential }) });
    const j = await r.json().catch(() => ({ success: false, message: '服务响应异常，请重试' }));
    if (j.success && j.user?.email) {
      auth.login({ email: j.user.email, points: j.user.points });
      emit('success');
    } else {
      submitError.value = j.message || 'Google 登录失败';
    }
  } catch (e: any) {
    submitError.value = e?.message || '网络错误，请重试';
  } finally {
    submitting.value = false;
  }
}

// 发送邮箱验证码
async function sendEmailCode() {
  emailError.value = '';
  codeError.value = '';
  submitError.value = '';
  const r = validateEmail(email.value);
  if (!r.valid) { emailError.value = r.message ?? '请输入正确的邮箱'; return; }
  try {
    const res = await api.sendCode({ email: email.value.trim() });
    if (res.success) {
      if (res.devCode) devCode.value = res.devCode;
      startCooldown();
    } else {
      codeError.value = res.message || '发送失败';
    }
  } catch (e: unknown) {
    codeError.value = (e as { message?: string })?.message || '网络错误，请稍后重试';
  }
}

// 提交登录
async function handleSubmit() {
  codeError.value = '';
  emailError.value = '';
  passwordError.value = '';
  submitError.value = '';

  const r1 = validateEmail(email.value);
  if (!r1.valid) { emailError.value = r1.message ?? '请输入正确的邮箱'; return; }

  if (method.value === 'email_code') {
    const r2 = validateCode(code.value);
    if (!r2.valid) { codeError.value = r2.message ?? '请输入正确的验证码'; return; }
    submitting.value = true;
    try {
      const res = await api.loginByCode({ account: email.value.trim(), code: code.value });
      if (res.success && res.user?.email) {
        auth.login({ email: res.user.email, points: res.user.points });
        emit('success');
      } else {
        submitError.value = res.message || '登录失败';
      }
    } catch (e: any) {
      submitError.value = e?.message || '网络错误';
    } finally {
      submitting.value = false;
    }
    return;
  }

  // 登录只校验非空——密码格式(长度/字母数字)是注册时的要求,登录处校验会误拦合法/历史密码
  if (!password.value) { passwordError.value = '请输入密码'; return; }
  submitting.value = true;
  try {
    const res = await api.login({ account: email.value.trim(), password: password.value });
    if (res.success && res.user) {
      const e = res.user.email ?? email.value;
      if (e) auth.login({ email: e, points: res.user.points });
      emit('success');
    } else {
      submitError.value = res.message || '登录失败';
    }
  } catch (e: any) {
    submitError.value = e?.message || '网络错误';
  } finally {
    submitting.value = false;
  }
}
</script>
