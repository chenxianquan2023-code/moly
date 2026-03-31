<template>
  <div class="min-h-screen flex items-center justify-center bg-white p-4">
    <div class="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] w-[420px] p-10">
      <router-link to="/" class="flex items-center justify-center gap-2.5 mb-8">
        <div class="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center">
          <span class="text-white text-xl font-[800] leading-none" style="font-family:'Nunito',sans-serif">M</span>
        </div>
        <span class="text-[26px] font-[800] bg-gradient-to-br from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent" style="font-family:'Nunito',sans-serif">Moly</span>
      </router-link>

      <LoginForm
        v-if="!regionLoading"
        :region-mode="regionMode"
        @success="onSuccess"
      />
      <div v-else class="flex justify-center py-8">
        <span class="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>

      <div
        v-if="regionMode !== 'cn' && !regionLoading"
        class="flex justify-center gap-4 mt-7 pt-6 border-t border-[#F3F4F6]"
      >
        <button
          type="button"
          class="w-12 h-12 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:border-primary hover:bg-[#F8FAFC] transition-colors"
          aria-label="Google 登录"
          @click="handleGoogleLogin"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" class="w-6 h-6" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import LoginForm from '@/components/auth/LoginForm.vue';
import { useRegion } from '@/composables/useRegion';

const router = useRouter();
const route = useRoute();
const { mode: regionMode, loading: regionLoading } = useRegion();

function onSuccess() {
  const redirect = (route.query.redirect as string) || '/';
  router.push(redirect);
  message.success('登录成功');
}

// Google 登录（需要接入后端）
function handleGoogleLogin() {
  // 方式1: 直接跳转到 Google OAuth
  // window.location.href = '/api/auth/google';
  
  // 方式2: 使用 Google Identity Services
  // 需要先在 index.html 引入 Google 脚本
  message.info('Google 登录需要接入后端服务');
  
  // TODO: 接入 Google OAuth 2.0
  // 1. 在 Google Cloud Console 创建 OAuth 2.0 客户端 ID
  // 2. 配置重定向 URI: http://localhost:5173/api/auth/google/callback
  // 3. 后端实现 /api/auth/google 和 /api/auth/google/callback
  // 4. 前端调用 Google Identity API
}
</script>
