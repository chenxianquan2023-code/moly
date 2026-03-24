<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center font-bold text-white text-3xl mx-auto mb-4">M</div>
        <h2 class="text-2xl font-bold text-gray-900">创建 Moly 账号</h2>
        <p class="text-gray-500 mt-2">开始您的 AI 创作之旅</p>
      </div>

      <!-- 注册表单 -->
      <div class="bg-white rounded-2xl border border-gray-200 p-8">
        <form @submit.prevent="handleRegister" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
            <input 
              v-model="form.email"
              type="email" 
              placeholder="请输入邮箱"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">手机号</label>
            <div class="flex gap-2">
              <select class="w-24 px-3 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500">
                <option>+86</option>
                <option>+1</option>
              </select>
              <input 
                v-model="form.phone"
                type="tel" 
                placeholder="请输入手机号"
                class="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">验证码</label>
            <div class="flex gap-2">
              <input 
                v-model="form.code"
                type="text" 
                placeholder="请输入验证码"
                class="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <button 
                type="button" 
                class="px-4 py-3 rounded-xl border border-blue-500 text-blue-600 font-medium hover:bg-blue-50 transition whitespace-nowrap"
                :disabled="countdown > 0"
                @click="sendCode"
              >
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <input 
              v-model="form.password"
              type="password" 
              placeholder="请设置密码（至少8位）"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div class="flex items-start gap-2">
            <input v-model="form.agree" type="checkbox" class="mt-1 rounded border-gray-300" />
            <span class="text-sm text-gray-600">
              我已阅读并同意
              <a href="#" class="text-blue-600 hover:underline">服务条款</a>
              和
              <a href="#" class="text-blue-600 hover:underline">隐私政策</a>
            </span>
          </div>

          <button 
            type="submit" 
            class="w-full py-3 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition"
            :disabled="isLoading || !form.agree"
          >
            {{ isLoading ? '注册中...' : '创建账号' }}
          </button>
        </form>

        <!-- 登录链接 -->
        <p class="text-center mt-6 text-sm text-gray-600">
          已有账号？
          <router-link to="/login" class="text-blue-600 font-medium hover:underline">立即登录</router-link>
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
const countdown = ref(0);

const form = reactive({
  email: '',
  phone: '',
  code: '',
  password: '',
  agree: false,
});

function sendCode() {
  countdown.value = 60;
  const timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
    }
  }, 1000);
}

async function handleRegister() {
  isLoading.value = true;
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
