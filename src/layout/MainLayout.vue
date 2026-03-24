<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 左侧导航栏 -->
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      <!-- Breadcrumb navigation -->
      <div class="h-16 flex items-center px-6 border-b border-gray-100">
        <nav class="flex items-center gap-2 text-sm">
          <template v-if="isDashboard">
            <span class="text-gray-700 font-medium">首页</span>
          </template>
          <template v-else>
            <router-link to="/tools" class="text-[#2563eb] no-underline hover:underline">AI 工具</router-link>
            <span v-if="currentToolName" class="text-gray-400 text-xs">›</span>
            <span v-if="currentToolName" class="text-gray-500">{{ currentToolName }}</span>
          </template>
        </nav>
      </div>

      <!-- 导航菜单 -->
      <nav class="flex-1 py-4 px-3 overflow-y-auto">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          :class="['sidebar-item flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all', isActive(item.path) ? 'active' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50']"
        >
          <div :class="['w-9 h-9 rounded-lg flex items-center justify-center transition-all', isActive(item.path) ? 'bg-white shadow-sm' : 'bg-transparent']">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"></path>
            </svg>
          </div>
          <span class="text-sm">{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- 用户信息 -->
      <div class="p-4 border-t border-gray-100">
        <router-link to="/recharge" class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
          <div class="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-medium shadow-sm shadow-blue-200">泉</div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm text-gray-900 truncate">泉哥</div>
            <div class="text-xs text-gray-400">专业版 · 1,250 积分</div>
          </div>
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </router-link>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- 页面内容 -->
      <div class="flex-1 overflow-auto">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const isDashboard = computed(() => route.path === '/dashboard');

const toolNameMap: Record<string, string> = {
  '/tools/virtual-try-on': 'AI 模特试穿',
  '/tools/face-swap': '模特换脸',
  '/tools/shoe-try-on': '试鞋',
  '/tools/scene-generation': '商品场景图',
  '/tools/hand-product': '手持商品',
  '/tools/model-bg-replace': '换背景',
  '/tools/background-replace': '背景替换',
  '/tools/detail-enhance': '细节增强',
  '/tools/upscale': '图片放大',
  '/tools/cutout-white-bg': '抠图白底',
  '/tools/ai-shadow': 'AI 阴影',
  '/tools/listing': '一键生成 Listing',
  '/tools/listing/create': '创建 Listing',
  '/tools/listing/optimize': '优化 Listing',
  '/tools/aplus-wizard': 'A+ 内容生成',
  '/workbench': '工作台',
  '/templates': '模版中心',
  '/assets': '资产库',
  '/history': '历史记录',
  '/recharge': '充值',
};

const currentToolName = computed(() => {
  return toolNameMap[route.path] || '';
});

const menuItems = [
  {
    name: '首页',
    path: '/dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
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
  {
    name: '模版中心',
    path: '/templates',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
  {
    name: '资产库',
    path: '/assets',
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  },
  {
    name: '历史记录',
    path: '/history',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

function isActive(path: string) {
  if (path === '/tools') {
    return route.path === '/tools' || route.path.startsWith('/tools/');
  }
  return route.path === path;
}
</script>

<style scoped>
.gradient-bg {
  background: linear-gradient(135deg, #2563EB 0%, #60A5FA 100%);
}

.sidebar-item {
  transition: all 0.2s ease;
}

.sidebar-item.active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(96, 165, 250, 0.08) 100%);
  color: #2563EB;
  font-weight: 600;
}

.sidebar-item.active svg {
  color: #2563EB;
}
</style>
