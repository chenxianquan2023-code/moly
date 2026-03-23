<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 左侧导航栏 -->
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-200">
        <div class="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center font-bold text-white mr-3">M</div>
        <span class="text-xl font-bold text-blue-600">Moly</span>
      </div>
      
      <!-- 导航菜单 -->
      <nav class="flex-1 py-4 overflow-y-auto">
        <router-link 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path"
          :class="['sidebar-item flex items-center gap-3 px-6 py-3 transition', $route.path === item.path ? 'active text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900']"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"></path>
          </svg>
          <span>{{ item.name }}</span>
        </router-link>
      </nav>
      
      <!-- 用户信息 -->
      <div class="p-4 border-t border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium">泉</div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm truncate">泉哥</div>
            <div class="text-xs text-gray-500">专业版</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶部栏 -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
        <h1 class="text-xl font-semibold text-gray-900">{{ title }}</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-yellow-600">💰 1,250 积分</span>
          <button class="px-4 py-2 rounded-lg gradient-bg text-white text-sm font-medium hover:opacity-90 transition" @click="$router.push('/tools/listing/create')">
            + 新建 Listing
          </button>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="flex-1 overflow-auto">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const menuItems = [
  {
    name: '首页',
    path: '/',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    name: 'AI 助手',
    path: '/agent',
    icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  },
  {
    name: '创作中心',
    path: '/tools',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    name: '工作台',
    path: '/workbench',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
  },
];

const title = computed(() => {
  const item = menuItems.find(i => i.path === route.path);
  return item?.name || 'Moly';
});
</script>

<style scoped>
.gradient-bg {
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
}

.sidebar-item {
  transition: all 0.2s;
}

.sidebar-item:hover {
  background: rgba(59, 130, 246, 0.1);
}

.sidebar-item.active {
  background: rgba(59, 130, 246, 0.15);
  border-right: 3px solid #2563EB;
}
</style>
