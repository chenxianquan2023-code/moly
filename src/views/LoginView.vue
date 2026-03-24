<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center font-bold text-white text-3xl mx-auto mb-4">M</div>
        <h2 class="text-2xl font-bold text-gray-900">欢迎回到 Moly</h2>
        <p class="text-gray-500 mt-2">登录您的账号继续创作</p>
      </div>

      <!-- 登录表单 -->
      <div class="bg-white rounded-2xl border border-gray-200 p-8">
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">邮箱 / 手机号</label>
            <input 
              v-model="form.account"
              type="text" 
              placeholder="请输入邮箱或手机号"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <div class="relative">
              <input 
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'" 
                placeholder="请输入密码"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" @click="showPassword = !showPassword">
                {{ showPassword ? '隐藏' : '显示' }}
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.remember" type="checkbox" class="rounded border-gray-300" />
              <span class="text-sm text-gray-600">记住我</span>
            </label>
            <router-link to="/forgot-password" class="text-sm text-blue-600 hover:underline">忘记密码？</router-link>
          </div>

          <button 
            type="submit" 
            class="w-full py-3 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition"
            :disabled="isLoading"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </form>

        <!-- 分割线 -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">或使用以下方式登录</span>
          </div>
        </div>

        <!-- 第三方登录 -->
        <div class="grid grid-cols-2 gap-3">
          <button class="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
            <span class="text-xl">G</span>
            <span class="text-sm">Google</span>
          </button>
          <button class="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
            <span class="text-xl">📱</span>
            <span class="text-sm">微信</span>
          </button>
        </div>

        <!-- 注册链接 -->
        <p class="text-center mt-6 text-sm text-gray-600">
          还没有账号？
          <router-link to="/register" class="text-blue-600 font-medium hover:underline">立即注册</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoading = ref(false);
const showPassword = ref(false);

const form = reactive({
  account: '',
  password: '',
  remember: false,
});

async function handleLogin() {
  isLoading.value = true;
  // 模拟登录
  setTimeout(() => {
    isLoading.value = false;
    router.push('/');
  }, 1000);
}
</script>

<style scoped>
.gradient-bg {
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
}
</style>
