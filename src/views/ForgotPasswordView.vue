<template>
  <div class="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
    <div class="w-full max-w-[420px] bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-10">
      <router-link to="/" class="flex justify-center mb-6">
        <img src="@/assets/logo.png" alt="Moly" class="h-8 w-auto" />
      </router-link>
      <h1 class="text-xl font-semibold text-[#111827] text-center mb-2">找回密码</h1>
      <p class="text-sm text-[#6B7280] text-center mb-6">输入注册邮箱，我们将发送重置链接</p>

      <form v-if="!sent" class="space-y-5" @submit.prevent="sendLink">
        <div>
          <input
            v-model="email"
            type="email"
            placeholder="请输入邮箱"
            :class="['w-full h-12 px-4 text-[15px] border rounded-lg outline-none bg-[#F9FAFB] transition-colors', error ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#2563EB] focus:bg-white']"
          />
          <p v-if="error" class="mt-1 text-xs text-[#EF4444]">{{ error }}</p>
        </div>
        <button
          type="submit"
          :disabled="submitting"
          class="w-full h-12 rounded-lg bg-[#2563EB] text-white font-medium disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <span v-if="submitting" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {{ submitting ? '发送中...' : '发送重置链接' }}
        </button>
      </form>

      <div v-else class="text-center space-y-4">
        <p class="text-sm text-[#6B7280]">重置链接已发送至 <strong class="text-[#111827]">{{ email }}</strong>，请查收邮件并点击链接设置新密码。</p>
        <router-link to="/login" class="inline-block text-[#2563EB] text-sm hover:underline">返回登录</router-link>
      </div>

      <router-link to="/login" class="block text-center mt-6 text-sm text-[#2563EB] hover:underline">返回登录</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { sendResetLink } from '@/api/auth';
import { validateEmail } from '@/utils/validators';
import { message } from 'ant-design-vue';

const email = ref('');
const sent = ref(false);
const submitting = ref(false);
const error = ref('');

async function sendLink() {
  error.value = '';
  const r = validateEmail(email.value);
  if (!r.valid) {
    error.value = r.message!;
    return;
  }
  submitting.value = true;
  try {
    const res = await sendResetLink(email.value);
    if (res.success) {
      sent.value = true;
      message.success('发送成功，请查收邮件');
    } else {
      error.value = res.message || '发送失败';
    }
  } catch {
    error.value = '网络错误';
  } finally {
    submitting.value = false;
  }
}
</script>
