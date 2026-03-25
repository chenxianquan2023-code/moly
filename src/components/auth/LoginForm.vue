<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- 手机号登录 | 邮箱登录 两个 Tab，默认手机号 -->
    <div class="flex justify-center gap-12 border-b border-[#E5E7EB] mb-6">
      <button
        type="button"
        class="pb-3 text-[15px] font-medium"
        style="color: #111827 !important;"
        @click="switchMethod('phone_code')"
      >
        <span>手机号登录</span>
        <span class="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#2563EB]"></span>
      </button>
      <button
        type="button"
        class="pb-3 text-[15px]"
        style="color: #6B7280 !important;"
        @click="switchMethod('email')"
      >
        <span>邮箱登录</span>
      </button>
    </div>

    <!-- 手机号登录 -->
    <template v-if="method === 'phone_code'">
      <!-- 手机号输入框（单独一行） -->
      <div>
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
      <!-- 验证码输入框 + 获取验证码按钮（同一行） -->
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
            :disabled="countdown > 0 || !isPhoneValid"
            class="shrink-0 text-[14px] text-[#1D4ED8] font-medium whitespace-nowrap disabled:text-[#D1D5DB] disabled:cursor-not-allowed hover:enabled:text-[#1E40AF] transition-colors bg-transparent border-none cursor-pointer"
            @click="sendPhoneCode"
          >
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </div>
        <p v-if="codeError" class="mt-1.5 text-xs text-[#EF4444]">{{ codeError }}</p>
        <p v-if="devCode" class="mt-1.5 text-xs text-[#2563EB]">验证码（演示）：{{ devCode }}</p>
      </div>
    </template>

    <!-- 邮箱 + 密码（国内备用 / 海外唯一） -->
    <template v-if="method === 'email'">
      <div class="space-y-4">
        <div>
          <input
            v-model="email"
            type="email"
            placeholder="请输入邮箱地址"
            :class="['w-full h-11 px-4 text-[15px] border rounded-lg outline-none bg-[#F9FAFB] focus:bg-white transition-colors', emailError ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#2563EB]']"
            @input="emailError = ''"
          />
          <p v-if="emailError" class="mt-1.5 text-xs text-[#EF4444]">{{ emailError }}</p>
        </div>
        <div>
          <PasswordInput
            v-model="password"
            placeholder="8-20位，至少包含字母和数字"
            :error="!!passwordError"
            @input="passwordError = ''"
          />
          <p v-if="passwordError" class="mt-1.5 text-xs text-[#EF4444]">{{ passwordError }}</p>
        </div>
      </div>
    </template>

    <!-- 提交错误 -->
    <p v-if="submitError" class="text-sm text-[#EF4444] text-center">{{ submitError }}</p>

    <!-- 用户协议 -->
    <p class="text-[13px] text-[#9CA3AF] text-center whitespace-nowrap">
      注册登录即代表已阅读并同意我们的 <a href="#" class="text-[#2563EB]" @click.prevent>用户协议</a> 与 <a href="#" class="text-[#2563EB]" @click.prevent>隐私政策</a>
    </p>

    <!-- 忘记密码 / 立即注册 -->
    <div class="flex justify-between items-center">
      <a href="#" class="text-sm text-[#6B7280] hover:text-[#4B5563] transition-colors" @click.prevent>忘记密码</a>
      <router-link to="/register" class="text-sm text-[#6B7280] hover:text-[#4B5563] transition-colors">立即注册</router-link>
    </div>

    <!-- 登录按钮 - 纯蓝色 -->
    <button
      type="submit"
      :disabled="submitting"
      class="w-full h-11 rounded-lg bg-[#2563EB] text-white! font-medium text-base hover:bg-[#1d4ed8] active:bg-[#1e40af] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
    >
      <span v-if="submitting" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      {{ submitting ? '登录中...' : '登录' }}
    </button>

  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import PasswordInput from './PasswordInput.vue';
import { useVerification } from '@/composables/useVerification';
import { useAuthStore } from '@/stores/auth';
import * as api from '@/api/auth';
import { validatePhone, validateEmail, validateCode, validatePassword } from '@/utils/validators';

const auth = useAuthStore();
const emit = defineEmits<{ success: [] }>();

// 默认显示国内版本：手机号+邮箱两个选项
const method = ref<'phone_code' | 'email'>('phone_code');
const DOMESTIC_COUNTRY_CODE = '86';
const phoneDisplay = ref('');
const phone = ref('');
const email = ref('');
const password = ref('');
const code = ref('');
const { countdown, start: startCooldown } = useVerification(60);
const devCode = ref('');
const submitting = ref(false);

// 使用独立的 ref 而不是对象，避免任何可能的引用问题
const phoneError = ref('');
const codeError = ref('');
const emailError = ref('');
const passwordError = ref('');
const submitError = ref('');

function onPhoneInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
  phoneDisplay.value = raw;
  phone.value = raw;
}

function onCodeInput(e: Event) {
  code.value = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
}

const isPhoneValid = computed(() => validatePhone(phone.value).valid);

// 切换登录方式
function switchMethod(newMethod: 'phone_code' | 'email') {
  method.value = newMethod;
  // 完全清空所有错误
  phoneError.value = '';
  codeError.value = '';
  emailError.value = '';
  passwordError.value = '';
  submitError.value = '';
  devCode.value = '';
}

// 发送手机验证码（只传 phone + countryCode，避免误走邮箱逻辑）
async function sendPhoneCode() {
  phoneError.value = '';
  codeError.value = '';
  submitError.value = '';

  const r = validatePhone(phone.value);
  if (!r.valid) {
    phoneError.value = r.message || '请输入正确的手机号';
    return;
  }

  const body = {
    phone: phone.value.replace(/\D/g, ''),
    countryCode: `+${DOMESTIC_COUNTRY_CODE}`,
  };
  try {
    const res = await api.sendCode(body);
    console.log('[Login] API 响应:', res);
    // API client 解包后 res 就是 data，成功时直接使用
    if (res.devCode) devCode.value = res.devCode;
    startCooldown();
  } catch (e: unknown) {
    codeError.value = '网络错误，请稍后重试';
    console.error('发送验证码失败:', e);
  }
}

// 提交登录
async function handleSubmit() {
  // 清空所有错误
  phoneError.value = '';
  codeError.value = '';
  emailError.value = '';
  passwordError.value = '';
  submitError.value = '';

  if (method.value === 'phone_code') {
    // 手机号登录验证
    const r1 = validatePhone(phone.value);
    const r2 = validateCode(code.value);

    if (!r1.valid) {
      phoneError.value = r1.message || '请输入正确的手机号';
      return;
    }
    if (!r2.valid) {
      codeError.value = r2.message || '请输入正确的验证码';
      return;
    }

    submitting.value = true;
    try {
      const accountStr = `${DOMESTIC_COUNTRY_CODE}${phone.value.replace(/\D/g, '')}`;
      const res = await api.loginByCode({ account: accountStr, code: code.value });
      // API client 解包后 res 直接就是 data
      if (res.user) {
        const p = res.user.phone || phone.value;
        if (p) auth.login({ phone: p, userId: res.user.id, displayName: res.user.displayName }, res.token);
        emit('success');
      } else {
        submitError.value = res.message || '登录失败';
      }
    } catch {
      submitError.value = '网络错误';
    } finally {
      submitting.value = false;
    }
    return;
  }

  // 邮箱登录验证
  const r1 = validateEmail(email.value);
  const r2 = validatePassword(password.value);

  if (!r1.valid) {
    emailError.value = r1.message || '请输入正确的邮箱';
    return;
  }
  if (!r2.valid) {
    passwordError.value = r2.message || '请输入正确的密码';
    return;
  }

  submitting.value = true;
  try {
    const res = await api.login({ account: email.value.trim(), password: password.value });
    // API client 解包后 res 直接就是 data
    if (res.user) {
      const e = res.user.email || email.value;
      if (e) auth.login({ email: e, userId: res.user.id, displayName: res.user.displayName }, res.token);
      emit('success');
    } else {
      submitError.value = res.message || '登录失败';
    }
  } catch {
    submitError.value = '网络错误';
  } finally {
    submitting.value = false;
  }
}
</script>
