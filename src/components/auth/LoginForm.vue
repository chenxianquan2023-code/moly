<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- 国内：手机号登录 | 邮箱登录 两个 Tab，默认手机号 -->
    <div v-if="regionMode === 'cn'" class="flex border-b border-[#E5E7EB] mb-6">
      <button
        type="button"
        :class="['flex-1 pb-3 text-base font-medium transition-colors', method === 'phone_code' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-[#6B7280]']"
        @click="switchMethod('phone_code')"
      >
        手机号登录
      </button>
      <button
        type="button"
        :class="['flex-1 pb-3 text-base font-medium transition-colors', method === 'email' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-[#6B7280]']"
        @click="switchMethod('email')"
      >
        邮箱登录
      </button>
    </div>
    <!-- 海外：仅邮箱登录，无 Tab，显示标题 -->
    <h2 v-else class="text-lg font-semibold text-[#1F2937] mb-6">邮箱登录</h2>

    <!-- 手机号 + 验证码（国内）：单输入框，无 +86，与 Deepseek 一致 -->
    <template v-if="method === 'phone_code'">
      <div class="space-y-4">
        <div>
          <input
            v-model="phoneDisplay"
            type="tel"
            inputmode="numeric"
            maxlength="11"
            placeholder="请输入手机号"
            :class="['w-full h-12 px-4 text-[15px] border rounded-lg outline-none bg-[#F9FAFB] transition-colors', phoneError ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#2563EB] focus:bg-white']"
            @input="onPhoneInput"
          />
          <p v-if="phoneError" class="mt-1.5 text-xs text-[#EF4444]">{{ phoneError }}</p>
        </div>
        <div>
          <VerificationInput
            v-model="code"
            :countdown="countdown"
            :can-send="isPhoneValid"
            send-text="获取验证码"
            :error="!!codeError"
            @send="sendPhoneCode"
          />
          <p v-if="codeError" class="mt-1.5 text-xs text-[#EF4444]">{{ codeError }}</p>
          <p v-if="devCode" class="mt-1.5 text-xs text-[#2563EB]">验证码（演示）：{{ devCode }}</p>
        </div>
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
            :class="['w-full h-12 px-4 text-[15px] border rounded-lg outline-none bg-[#F9FAFB] transition-colors', emailError ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#2563EB] focus:bg-white']"
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

    <!-- 用户协议 -->
    <p class="text-xs text-[#6B7280] leading-relaxed pt-2">
      注册登录即代表已阅读并同意我们的
      <a href="#" class="text-[#2563EB] hover:underline" @click.prevent>用户协议</a>
      与
      <a href="#" class="text-[#2563EB] hover:underline" @click.prevent>隐私政策</a>
    </p>

    <!-- 忘记密码 / 立即注册：与 Deepseek 一致，左忘记密码、右立即注册 -->
    <div class="flex justify-between items-center text-sm">
      <router-link to="/forgot-password" class="text-[#6B7280] hover:underline">忘记密码</router-link>
      <router-link :to="{ name: 'register', query: $route.query }" class="text-[#6B7280] hover:underline">立即注册</router-link>
    </div>

    <!-- 提交错误 -->
    <p v-if="submitError" class="text-sm text-[#EF4444] text-center">{{ submitError }}</p>

    <!-- 登录按钮 - 白色文字 -->
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
import { ref, computed } from 'vue';
import VerificationInput from './VerificationInput.vue';
import PasswordInput from './PasswordInput.vue';
import { useVerification } from '@/composables/useVerification';
import { useAuthStore } from '@/stores/auth';
import * as api from '@/api/auth';
import { validatePhone, validateEmail, validateCode, validatePassword } from '@/utils/validators';
import type { RegionMode } from '@/types/auth.types';

const props = defineProps<{ regionMode: RegionMode }>();
const auth = useAuthStore();
const emit = defineEmits<{ success: [] }>();

const method = ref<'phone_code' | 'email'>(props.regionMode === 'cn' ? 'phone_code' : 'email');
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

  // #region agent log
  fetch('http://127.0.0.1:7540/ingest/d97822f3-40b2-4c53-b46c-84dbb07e685e', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'efb394',
    },
    body: JSON.stringify({
      sessionId: 'efb394',
      runId: 'pre-fix-1',
      hypothesisId: 'H2',
      location: 'src/components/auth/LoginForm.vue:sendPhoneCode',
      message: 'sendPhoneCode called with current phone',
      data: { phone: phone.value },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log

  const r = validatePhone(phone.value);
  if (!r.valid) {
    phoneError.value = r.message ?? '请输入正确的手机号';
    return;
  }

  const body = {
    phone: phone.value.replace(/\D/g, ''),
    countryCode: `+${DOMESTIC_COUNTRY_CODE}`,
  };
  try {
    const res = await api.sendCode(body);
    // 调试代码已注释
    // #region agent log
    // fetch('http://127.0.0.1:7540/ingest/d97822f3-40b2-4c53-b46c-84dbb07e685e', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-Debug-Session-Id': 'efb394',
    //   },
    //   body: JSON.stringify({
    //     sessionId: 'efb394',
    //     runId: 'pre-fix-2',
    //     hypothesisId: 'H3',
    //     location: 'src/components/auth/LoginForm.vue:sendPhoneCode:afterApi',
    //     message: 'sendPhoneCode api.sendCode result',
    //     data: { success: res.success, message: res.message },
    //     timestamp: Date.now(),
    //   }),
    // }).catch(() => {});
    // #endregion agent log
    console.log('[Login] API 响应:', res);
    if (res.success) {
      if (res.devCode) devCode.value = res.devCode;
      startCooldown();
    } else {
      const msg = res.message || '发送失败';
      codeError.value = msg === '请输入正确的邮箱' ? '请输入正确的手机号' : msg;
    }
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
      phoneError.value = r1.message ?? '请输入正确的手机号'; 
      return; 
    }
    if (!r2.valid) { 
      codeError.value = r2.message ?? '请输入正确的验证码'; 
      return; 
    }
    
    submitting.value = true;
    try {
      const accountStr = `${DOMESTIC_COUNTRY_CODE}${phone.value.replace(/\D/g, '')}`;
      const res = await api.loginByCode({ account: accountStr, code: code.value });
      if (res.success && res.user) {
        const p = res.user.phone ?? phone.value;
        if (p) auth.login({ phone: p });
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
    emailError.value = r1.message ?? '请输入正确的邮箱'; 
    return; 
  }
  if (!r2.valid) { 
    passwordError.value = r2.message ?? '请输入正确的密码'; 
    return; 
  }
  
  submitting.value = true;
  try {
    const res = await api.login({ account: email.value.trim(), password: password.value });
    if (res.success && res.user) {
      const e = res.user.email ?? email.value;
      if (e) auth.login({ email: e });
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
