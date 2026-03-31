<template>
  <div class="min-h-screen flex items-center justify-center bg-white p-6">
    <div class="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] w-[420px] p-10">
      <router-link to="/" class="flex items-center justify-center gap-2.5 mb-6">
        <div class="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center">
          <span class="text-white text-xl font-[800] leading-none" style="font-family:'Nunito',sans-serif">M</span>
        </div>
        <span class="text-[26px] font-[800] bg-gradient-to-br from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent" style="font-family:'Nunito',sans-serif">Moly</span>
      </router-link>

        <div v-if="!regionLoading" class="space-y-5">
        <div class="flex justify-center gap-12 border-b border-[#E5E7EB] mb-2">
          <button
            v-if="regionMode === 'cn'"
            type="button"
            :class="['pb-3 text-[15px] transition-colors relative', registerType === 'phone' ? 'text-[#111827] font-medium after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-[#2563EB] after:content-[\'\']' : 'text-[#9CA3AF] hover:text-[#6B7280]']"
            @click="registerType = 'phone'"
          >
            手机号注册
          </button>
          <button
            type="button"
            :class="['pb-3 text-[15px] transition-colors relative', registerType === 'email' ? 'text-[#111827] font-medium after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-[#2563EB] after:content-[\'\']' : 'text-[#9CA3AF] hover:text-[#6B7280]']"
            @click="registerType = 'email'"
          >
            邮箱注册
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <template v-if="registerType === 'phone'">
            <div>
              <PhoneInput v-model="phone" v-model:country-code="countryCode" placeholder="请输入手机号" :error="!!errors.phone" />
              <p v-if="errors.phone" class="mt-1 text-xs text-[#EF4444]">{{ errors.phone }}</p>
            </div>
          </template>
          <template v-else>
            <div>
              <input
                v-model="email"
                type="email"
                placeholder="请输入邮箱"
                :class="['w-full h-12 px-4 text-[15px] border rounded-lg outline-none bg-[#F9FAFB] transition-colors', errors.email ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#2563EB] focus:bg-white']"
              />
              <p v-if="errors.email" class="mt-1 text-xs text-[#EF4444]">{{ errors.email }}</p>
            </div>
          </template>

          <template v-if="registerType === 'email'">
            <div>
              <PasswordInput v-model="password" placeholder="请输入密码（8-20位，含字母和数字）" :error="!!errors.password" />
              <p v-if="errors.password" class="mt-1 text-xs text-[#EF4444]">{{ errors.password }}</p>
            </div>
            <div>
              <PasswordInput v-model="confirmPassword" placeholder="请再次输入密码" :error="!!errors.confirm" />
              <p v-if="errors.confirm" class="mt-1 text-xs text-[#EF4444]">{{ errors.confirm }}</p>
            </div>
          </template>
          <div>
            <VerificationInput
              v-model="code"
              :countdown="countdown"
              :can-send="registerType === 'email' ? isEmailValid : isPhoneValid"
              send-text="发送验证码"
              :error="!!errors.code"
              @send="sendCode"
            />
            <p v-if="errors.code" class="mt-1 text-xs text-[#EF4444]">{{ errors.code }}</p>
            <p v-if="devCode" class="mt-1 text-xs text-[#2563EB]">验证码（演示）：{{ devCode }}</p>
          </div>
          <p class="text-xs text-[#6B7280] leading-relaxed">
            注册即代表已阅读并同意我们的
            <a href="#" class="text-[#2563EB] hover:underline" @click.prevent>用户协议</a>
            与
            <a href="#" class="text-[#2563EB] hover:underline" @click.prevent>隐私政策</a>
          </p>
          <p v-if="errors.submit" class="text-sm text-[#EF4444]">{{ errors.submit }}</p>
          <button
            type="submit"
            :disabled="submitting"
            class="w-full h-12 rounded-lg bg-[#2563EB] text-white font-medium text-base hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <span v-if="submitting" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {{ submitting ? '注册中...' : '注册' }}
          </button>
        </form>
      </div>
      <div v-else class="flex justify-center py-8">
        <span class="inline-block w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>

      <router-link :to="{ name: 'login', query: $route.query }" class="block text-center mt-6 text-sm text-[#2563EB] hover:underline">返回登录</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import PhoneInput from '@/components/auth/PhoneInput.vue';
import PasswordInput from '@/components/auth/PasswordInput.vue';
import VerificationInput from '@/components/auth/VerificationInput.vue';
import { useRegion } from '@/composables/useRegion';
import { useVerification } from '@/composables/useVerification';
import { useAuthStore } from '@/stores/auth';
import * as api from '@/api/auth';
import { validatePhone, validateEmail, validateCode, validatePassword, validatePasswordConfirm } from '@/utils/validators';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const { mode: regionMode, loading: regionLoading } = useRegion();
const { countdown, start: startCooldown } = useVerification(60);

const registerType = ref<'phone' | 'email'>('email');
const phone = ref('');
const countryCode = ref('+86');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const code = ref('');
const devCode = ref('');
const submitting = ref(false);
const errors = ref<Record<string, string>>({});

const isPhoneValid = computed(() => validatePhone(phone.value).valid);
const isEmailValid = computed(() => validateEmail(email.value).valid);

async function sendCode() {
  errors.value = {};
  if (registerType.value === 'phone') {
    const r = validatePhone(phone.value);
    if (!r.valid) {
      errors.value.phone = r.message ?? '';
      return;
    }
    try {
      const res = await api.sendCode({ phone: phone.value, countryCode: countryCode.value });
      if (res.success) {
        if (res.devCode) devCode.value = res.devCode;
        startCooldown();
      } else errors.value.code = res.message ?? '发送失败';
    } catch {
      errors.value.submit = '网络错误，请确认已启动认证服务（npm run dev:server）';
    }
    return;
  }
  const r = validateEmail(email.value);
  if (!r.valid) {
    errors.value.email = r.message ?? '';
    return;
  }
  try {
    const res = await api.sendCode({ email: email.value });
    if (res.success) {
      if (res.devCode) devCode.value = res.devCode;
      startCooldown();
    } else errors.value.code = res.message ?? '发送失败';
  } catch {
    errors.value.submit = '网络错误，请确认已启动认证服务（npm run dev:server）';
  }
}

async function handleSubmit() {
  errors.value = {};
  const r1 = registerType.value === 'phone' ? validatePhone(phone.value) : validateEmail(email.value);
  const r4 = validateCode(code.value);
  if (!r1.valid) {
    if (registerType.value === 'phone') errors.value.phone = r1.message ?? '';
    else errors.value.email = r1.message ?? '';
    return;
  }
  if (registerType.value === 'email') {
    const r2 = validatePassword(password.value);
    const r3 = validatePasswordConfirm(password.value, confirmPassword.value);
    if (!r2.valid) { errors.value.password = r2.message ?? ''; return; }
    if (!r3.valid) { errors.value.confirm = r3.message ?? ''; return; }
  }
  if (!r4.valid) {
    errors.value.code = r4.message ?? '';
    return;
  }
  submitting.value = true;
  try {
    const payload =
      registerType.value === 'email'
        ? { email: email.value.trim().toLowerCase(), password: password.value, code: code.value.trim() }
        : {
            phone: phone.value.replace(/\D/g, ''),
            countryCode: countryCode.value,
            password: '',
            code: code.value.trim(),
          };
    const res = await api.register(payload);
    if (res.success) {
      if (registerType.value === 'email') {
        const loginRes = await api.login({ account: email.value.trim(), password: password.value });
        if (loginRes.success && loginRes.user) {
          auth.login({ email: loginRes.user.email ?? email.value });
          router.push((route.query.redirect as string) || '/');
          message.success('注册成功');
        } else {
          router.push({ name: 'login', query: route.query });
          message.success('注册成功，请登录');
        }
      } else {
        router.push({ name: 'login', query: route.query });
        message.success('手机号已注册，请使用验证码登录');
      }
    } else {
      errors.value.submit = res.message ?? '注册失败';
    }
  } catch {
    errors.value.submit = '网络错误，请稍后重试';
  } finally {
    submitting.value = false;
  }
}
</script>
