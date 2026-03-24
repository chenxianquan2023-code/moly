<template>
  <div class="min-h-screen flex items-center justify-center bg-white p-4">
    <div class="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] w-[420px] p-10">
      <!-- Logo -->
      <router-link to="/" class="flex items-center justify-center gap-2.5 mb-6">
        <div class="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center">
          <span class="text-white text-xl font-[800] leading-none" style="font-family: 'Nunito', sans-serif">M</span>
        </div>
        <span class="text-[26px] font-[800] bg-gradient-to-br from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent" style="font-family: 'Nunito', sans-serif">Moly</span>
      </router-link>

      <!-- Tabs -->
      <div class="flex justify-center gap-12 border-b border-[#E5E7EB] mb-6">
        <button
          type="button"
          :class="['pb-3 text-[15px] transition-colors relative', method === 'phone' ? 'text-[#111827] font-medium after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-[#2563EB]' : 'text-[#9CA3AF] hover:text-[#6B7280]']"
          @click="switchMethod('phone')"
        >
          手机号注册
        </button>
        <button
          type="button"
          :class="['pb-3 text-[15px] transition-colors relative', method === 'email' ? 'text-[#111827] font-medium after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-[#2563EB]' : 'text-[#9CA3AF] hover:text-[#6B7280]']"
          @click="switchMethod('email')"
        >
          邮箱注册
        </button>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- 手机号 / 邮箱输入 -->
        <div v-if="method === 'phone'">
          <input
            v-model="phoneDisplay"
            type="tel"
            inputmode="numeric"
            maxlength="11"
            placeholder="请输入手机号"
            :class="['w-full h-11 px-4 text-[15px] border rounded-lg outline-none bg-[#F9FAFB] focus:bg-white transition-colors', phoneError ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#2563EB]']"
            @input="onPhoneInput"
          />
          <p v-if="phoneError" class="mt-1.5 text-xs text-[#EF4444]">{{ phoneError }}</p>
        </div>
        <div v-else>
          <input
            v-model="email"
            type="email"
            placeholder="请输入邮箱地址"
            :class="['w-full h-11 px-4 text-[15px] border rounded-lg outline-none bg-[#F9FAFB] focus:bg-white transition-colors', emailError ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#2563EB]']"
            @input="emailError = ''"
          />
          <p v-if="emailError" class="mt-1.5 text-xs text-[#EF4444]">{{ emailError }}</p>
        </div>

        <!-- 验证码 -->
        <div>
          <div class="flex gap-3 items-center">
            <input
              v-model="code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder=""
              autocomplete="one-time-code"
              :class="['flex-1 min-w-0 h-11 px-4 text-[15px] border rounded-lg outline-none bg-[#F9FAFB] focus:bg-white transition-colors', codeError ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#2563EB]']"
              @input="onCodeInput"
            />
            <button
              type="button"
              :disabled="countdown > 0 || !canSendCode"
              class="shrink-0 text-[14px] text-[#6B7280] font-medium whitespace-nowrap disabled:text-[#9CA3AF] disabled:cursor-not-allowed hover:enabled:text-[#111827] transition-colors bg-transparent border-none cursor-pointer"
              @click="sendVerifyCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </button>
          </div>
          <p v-if="codeError" class="mt-1.5 text-xs text-[#EF4444]">{{ codeError }}</p>
          <p v-if="devCode" class="mt-1.5 text-xs text-[#2563EB]">验证码（演示）：{{ devCode }}</p>
        </div>

        <!-- 密码 -->
        <div>
          <PasswordInput
            v-model="password"
            placeholder="请设置密码（6-20位）"
            :error="!!passwordError"
            @input="passwordError = ''"
          />
          <p v-if="passwordError" class="mt-1.5 text-xs text-[#EF4444]">{{ passwordError }}</p>
        </div>

        <!-- 确认密码 -->
        <div>
          <PasswordInput
            v-model="confirmPassword"
            placeholder="请确认密码"
            :error="!!confirmError"
            @input="confirmError = ''"
          />
          <p v-if="confirmError" class="mt-1.5 text-xs text-[#EF4444]">{{ confirmError }}</p>
        </div>

        <!-- 协议勾选 -->
        <div class="flex items-start gap-2 text-xs text-[#6B7280] leading-relaxed">
          <input
            v-model="agreed"
            type="checkbox"
            class="mt-0.5 w-3.5 h-3.5 accent-[#2563EB]"
          />
          <span>我已阅读并同意 <a href="#" class="text-[#2563EB]" @click.prevent>用户协议</a> 与 <a href="#" class="text-[#2563EB]" @click.prevent>隐私政策</a></span>
        </div>

        <!-- 已有账号 -->
        <div class="flex justify-end">
          <router-link to="/login" class="text-sm text-[#6B7280] hover:text-[#4B5563] transition-colors">已有账号？立即登录</router-link>
        </div>

        <!-- 提交错误 -->
        <p v-if="submitError" class="text-sm text-[#EF4444] text-center">{{ submitError }}</p>

        <!-- 注册按钮 -->
        <button
          type="submit"
          :disabled="submitting"
          class="w-full h-11 rounded-lg bg-[#2563EB] text-white! font-medium text-[15px] hover:bg-[#1D4ED8] active:bg-[#1e40af] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <span v-if="submitting" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {{ submitting ? '注册中...' : '注册' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import PasswordInput from '@/components/auth/PasswordInput.vue';
import { useVerification } from '@/composables/useVerification';
import { useAuthStore } from '@/stores/auth';
import * as api from '@/api/auth';
import { validatePhone, validateEmail, validateCode, validatePassword, validatePasswordConfirm } from '@/utils/validators';

const router = useRouter();
const auth = useAuthStore();
const DOMESTIC_COUNTRY_CODE = '86';

const method = ref<'phone' | 'email'>('phone');
const phoneDisplay = ref('');
const phone = ref('');
const email = ref('');
const code = ref('');
const password = ref('');
const confirmPassword = ref('');
const agreed = ref(false);
const { countdown, start: startCooldown } = useVerification(60);
const devCode = ref('');
const submitting = ref(false);

const phoneError = ref('');
const emailError = ref('');
const codeError = ref('');
const passwordError = ref('');
const confirmError = ref('');
const submitError = ref('');

function switchMethod(m: 'phone' | 'email') {
  method.value = m;
  phoneError.value = '';
  emailError.value = '';
  codeError.value = '';
  passwordError.value = '';
  confirmError.value = '';
  submitError.value = '';
  devCode.value = '';
}

function onPhoneInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
  phoneDisplay.value = raw;
  phone.value = raw;
  phoneError.value = '';
}

function onCodeInput(e: Event) {
  code.value = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
  codeError.value = '';
}

const canSendCode = computed(() => {
  if (method.value === 'phone') return validatePhone(phone.value).valid;
  return validateEmail(email.value).valid;
});

async function sendVerifyCode() {
  submitError.value = '';
  codeError.value = '';

  if (method.value === 'phone') {
    const r = validatePhone(phone.value);
    if (!r.valid) { phoneError.value = r.message || '请输入正确的手机号'; return; }
  } else {
    const r = validateEmail(email.value);
    if (!r.valid) { emailError.value = r.message || '请输入正确的邮箱'; return; }
  }

  const params = method.value === 'phone'
    ? { phone: phone.value.replace(/\D/g, ''), countryCode: `+${DOMESTIC_COUNTRY_CODE}` }
    : { email: email.value.trim() };

  try {
    const res = await api.sendCode(params);
    if (res.devCode) devCode.value = res.devCode;
    startCooldown();
  } catch {
    codeError.value = '网络错误，请稍后重试';
  }
}

async function handleSubmit() {
  phoneError.value = '';
  emailError.value = '';
  codeError.value = '';
  passwordError.value = '';
  confirmError.value = '';
  submitError.value = '';

  if (method.value === 'phone') {
    const r = validatePhone(phone.value);
    if (!r.valid) { phoneError.value = r.message || '请输入正确的手机号'; return; }
  } else {
    const r = validateEmail(email.value);
    if (!r.valid) { emailError.value = r.message || '请输入正确的邮箱'; return; }
  }

  const rc = validateCode(code.value);
  if (!rc.valid) { codeError.value = rc.message || '请输入验证码'; return; }

  const rp = validatePassword(password.value);
  if (!rp.valid) { passwordError.value = rp.message || '请输入密码'; return; }

  const rpc = validatePasswordConfirm(password.value, confirmPassword.value);
  if (!rpc.valid) { confirmError.value = rpc.message || '两次密码不一致'; return; }

  if (!agreed.value) { submitError.value = '请先同意用户协议与隐私政策'; return; }

  submitting.value = true;
  try {
    const params = method.value === 'phone'
      ? { phone: phone.value.replace(/\D/g, ''), countryCode: `+${DOMESTIC_COUNTRY_CODE}`, password: password.value, code: code.value.trim() }
      : { email: email.value.trim(), password: password.value, code: code.value.trim() };

    const res = await api.register(params);
    if (res.success) {
      // 注册成功后尝试自动登录
      try {
        const account = method.value === 'phone'
          ? `${DOMESTIC_COUNTRY_CODE}${phone.value.replace(/\D/g, '')}`
          : email.value.trim();
        const loginRes = await api.login({ account, password: password.value });
        if (loginRes.user) {
          const loginData = method.value === 'phone'
            ? { phone: loginRes.user.phone || phone.value, userId: loginRes.user.id, displayName: loginRes.user.displayName }
            : { email: loginRes.user.email || email.value, userId: loginRes.user.id, displayName: loginRes.user.displayName };
          auth.login(loginData, loginRes.token);
          message.success('注册成功');
          router.push('/workflow/try-on');
          return;
        }
      } catch {
        // 自动登录失败，回退到跳转登录页
      }
      message.success('注册成功，请登录');
      router.push('/login');
    } else {
      submitError.value = res.message || '注册失败';
    }
  } catch {
    submitError.value = '网络错误，请稍后重试';
  } finally {
    submitting.value = false;
  }
}
</script>
