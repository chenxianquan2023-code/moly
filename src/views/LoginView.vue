<template>
  <div class="min-h-screen flex items-center justify-center bg-white p-4">
    <!-- Login card: 420px, padding 40px, logo inside -->
    <div class="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] w-[420px] p-10">
      <!-- Logo -->
      <router-link to="/" class="flex items-center justify-center gap-2.5 mb-8">
        <div class="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center">
          <span class="text-white text-xl font-[800] leading-none" style="font-family: 'Nunito', sans-serif">M</span>
        </div>
        <span class="text-[26px] font-[800] bg-gradient-to-br from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent" style="font-family: 'Nunito', sans-serif">Moly</span>
      </router-link>

      <LoginForm
        @success="onSuccess"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import LoginForm from '@/components/auth/LoginForm.vue';

const router = useRouter();
const route = useRoute();

function onSuccess() {
  const redirect = (route.query.redirect as string) || '/workbench';
  router.push(redirect);
  message.success('登录成功');
}
</script>
