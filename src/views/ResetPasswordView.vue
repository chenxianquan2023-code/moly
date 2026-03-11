<template>
  <div class="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
    <div class="w-full max-w-[420px] bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-10">
      <router-link to="/" class="flex justify-center mb-6">
        <img src="@/assets/logo.png" alt="Moly" class="h-8 w-auto" />
      </router-link>
      <h1 class="text-xl font-semibold text-[#111827] text-center mb-2">设置新密码</h1>
      <p class="text-sm text-[#6B7280] text-center mb-6">请设置 8-20 位含字母和数字的密码</p>

      <form v-if="token" class="space-y-5" @submit.prevent="reset">
        <div>
          <PasswordInput v-model="newPassword" placeholder="新密码" :error="!!errors.password" />
          <p v-if="errors.password" class="mt-1 text-xs text-[#EF4444]">{{ errors.password }}</p>
        </div>
        <div>
          <PasswordInput v-model="confirmPassword" placeholder="再次输入新密码" :error="!!errors.confirm" />
          <p v-if="errors.confirm" class="mt-1 text-xs text-[#EF4444]">{{ errors.confirm }}</p>
        </div>
        <p v-if="errors.submit" class="text-sm text-[#EF4444]">{{ errors.submit }}</p>
        <button
          type="submit"
          :disabled="submitting"
          class="w-full h-12 rounded-lg bg-[#2563EB] text-white font-medium disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <span v-if="submitting" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {{ submitting ? '提交中...' : '确认重置' }}
        </button>
      </form>

      <div v-else class="text-center text-[#EF4444]">
        <p>链接无效或已过期，请重新<a href="/forgot-password" class="underline">申请重置</a>。</p>
      </div>

      <router-link to="/login" class="block text-center mt-6 text-sm text-[#2563EB] hover:underline">返回登录</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import PasswordInput from '@/components/auth/PasswordInput.vue';
import { resetPassword } from '@/api/auth';
import { validatePassword, validatePasswordConfirm } from '@/utils/validators';

const route = useRoute();
const router = useRouter();
const token = computed(() => (route.query.token as string) || '');
const newPassword = ref('');
const confirmPassword = ref('');
const submitting = ref(false);
const errors = ref<Record<string, string>>({});

async function reset() {
  errors.value = {};
  const r1 = validatePassword(newPassword.value);
  const r2 = validatePasswordConfirm(newPassword.value, confirmPassword.value);
  if (!r1.valid) { errors.value.password = r1.message!; return; }
  if (!r2.valid) { errors.value.confirm = r2.message!; return; }
  submitting.value = true;
  try {
    const res = await resetPassword({ token: token.value, newPassword: newPassword.value });
    if (res.success) {
      message.success('密码已重置，请登录');
      router.push('/login');
    } else {
      errors.value.submit = res.message || '重置失败';
    }
  } catch {
    errors.value.submit = '网络错误';
  } finally {
    submitting.value = false;
  }
}
</script>
