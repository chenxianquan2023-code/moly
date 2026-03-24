<template>
  <div class="p-8 max-w-6xl mx-auto">
    <!-- 欢迎区域 -->
    <div class="welcome-banner rounded-2xl p-10 mb-10 relative overflow-hidden">
      <div class="relative z-10">
        <h1 class="text-3xl font-bold text-white mb-3">你好，泉哥</h1>
        <p class="text-white/80 text-lg mb-6 max-w-lg">欢迎回到 Moly，AI 驱动的电商创作平台。开始你的创作之旅吧。</p>
        <div class="flex gap-3">
          <button class="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg shadow-blue-500/20" @click="$router.push('/tools')">
            进入创作中心
          </button>
          <button class="px-6 py-3 bg-white/15 text-white rounded-xl font-medium hover:bg-white/25 transition-all backdrop-blur-sm border border-white/20" @click="$router.push('/agent')">
            AI 对话助手
          </button>
        </div>
      </div>
      <div class="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4"></div>
      <div class="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2"></div>
    </div>

    <!-- 快捷入口 -->
    <div class="mb-10">
      <h2 class="text-lg font-bold text-gray-900 mb-5">快捷入口</h2>
      <div class="grid grid-cols-3 gap-4">
        <div
          v-for="scene in scenes"
          :key="scene.id"
          class="shortcut-card group"
          @click="$router.push(scene.path)"
        >
          <div class="shortcut-icon" :style="{ background: scene.iconBg }">
            <svg class="w-6 h-6" :style="{ color: scene.iconColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="scene.icon"></path>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 text-sm mb-0.5">{{ scene.name }}</h3>
            <p class="text-xs text-gray-400 truncate">{{ scene.desc }}</p>
          </div>
          <svg class="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </div>
    </div>

    <!-- 最近使用 & 数据统计 -->
    <div class="grid grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 class="font-bold text-gray-900 mb-4">数据概览</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-blue-50 rounded-xl p-4">
            <div class="text-2xl font-bold text-blue-600">128</div>
            <div class="text-xs text-gray-500 mt-1">已生成图片</div>
          </div>
          <div class="bg-purple-50 rounded-xl p-4">
            <div class="text-2xl font-bold text-purple-600">23</div>
            <div class="text-xs text-gray-500 mt-1">Listing 数量</div>
          </div>
          <div class="bg-green-50 rounded-xl p-4">
            <div class="text-2xl font-bold text-green-600">1,250</div>
            <div class="text-xs text-gray-500 mt-1">剩余积分</div>
          </div>
          <div class="bg-orange-50 rounded-xl p-4">
            <div class="text-2xl font-bold text-orange-600">12</div>
            <div class="text-xs text-gray-500 mt-1">今日使用</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-900">最近创作</h3>
          <router-link to="/history" class="text-sm text-blue-500 hover:text-blue-600 transition">查看全部</router-link>
        </div>
        <div class="space-y-3">
          <div v-for="item in recentItems" :key="item.id" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" :style="{ background: item.iconBg }">
              <svg class="w-5 h-5" :style="{ color: item.iconColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="item.icon"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</div>
              <div class="text-xs text-gray-400">{{ item.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const scenes = [
  {
    id: 'tryon',
    name: 'AI 模特试穿',
    desc: '上传服装，AI 自动生成模特试穿效果',
    path: '/tools/virtual-try-on',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    id: 'faceswap',
    name: 'AI 模特换脸',
    desc: '替换模特面部，保持身材和服装不变',
    path: '/tools/face-swap',
    icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
  },
  {
    id: 'shoe',
    name: 'AI 试鞋',
    desc: '上传鞋子图片，生成上脚效果图',
    path: '/tools/shoe-try-on',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
  },
  {
    id: 'scene',
    name: '商品场景图',
    desc: '一键生成多种商品场景展示图',
    path: '/tools/scene-generation',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    iconBg: '#FDF4FF',
    iconColor: '#9333EA',
  },
  {
    id: 'hand',
    name: '手持商品',
    desc: '生成手持商品展示效果图',
    path: '/tools/hand-product',
    icon: 'M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11',
    iconBg: '#FEF2F2',
    iconColor: '#DC2626',
  },
  {
    id: 'listing',
    name: '一键生成 Listing',
    desc: 'AI 自动生成标题、五点描述和 A+ 内容',
    path: '/tools/listing',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
  },
];

const recentItems = [
  {
    id: 1,
    name: '夏季连衣裙模特试穿',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    time: '2 小时前',
  },
  {
    id: 2,
    name: '运动鞋场景图生成',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
    time: '5 小时前',
  },
  {
    id: 3,
    name: '护肤品 Listing 生成',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
    time: '昨天',
  },
  {
    id: 4,
    name: '手提包背景替换',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    iconBg: '#FDF4FF',
    iconColor: '#9333EA',
    time: '昨天',
  },
];
</script>

<style scoped>
.welcome-banner {
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 40%, #3b82f6 70%, #60a5fa 100%);
}

.shortcut-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.shortcut-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
  transform: translateY(-1px);
}

.shortcut-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
