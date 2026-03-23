<template>
  <MainLayout>
    <div class="p-8 max-w-7xl mx-auto">
      <!-- 欢迎区域 -->
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-bold mb-3">欢迎回来，泉哥 👋</h2>
            <p class="text-white/80">今天想创作什么内容？AI 助手随时为您服务</p>
          </div>
          <div class="hidden md:flex gap-4">
            <button class="px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-white/90 transition" @click="$router.push('/agent')">
              AI 助手
            </button>
            <button class="px-6 py-3 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition" @click="$router.push('/tools/listing/create')">
              新建 Listing
            </button>
          </div>
        </div>
      </div>

      <!-- 快捷入口 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div
          v-for="shortcut in shortcuts"
          :key="shortcut.name"
          class="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-lg hover:border-blue-300 transition text-center"
          @click="$router.push(shortcut.path)"
        >
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mx-auto mb-3">
            {{ shortcut.icon }}
          </div>
          <h3 class="font-medium text-gray-900">{{ shortcut.name }}</h3>
        </div>
      </div>

      <!-- 最近项目 -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">最近项目</h2>
          <button class="text-blue-600 text-sm hover:underline" @click="$router.push('/tools/history')">
            查看全部 →
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="project in recentProjects"
            :key="project.id"
            class="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition"
            @click="openProject(project)"
          >
            <div class="h-32 bg-gray-100 relative">
              <img :src="project.image" class="w-full h-full object-cover" alt="" />
              <div class="absolute top-2 right-2 px-2 py-1 bg-white/90 rounded-lg text-xs">
                {{ project.type }}
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-medium text-gray-900 mb-1 truncate">{{ project.name }}</h3>
              <p class="text-sm text-gray-500">{{ project.time }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 使用统计 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">📊</div>
            <div>
              <div class="text-2xl font-bold text-gray-900">128</div>
              <div class="text-sm text-gray-500">本月生成内容</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl">⚡</div>
            <div>
              <div class="text-2xl font-bold text-gray-900">1,250</div>
              <div class="text-sm text-gray-500">剩余积分</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl">🎯</div>
            <div>
              <div class="text-2xl font-bold text-gray-900">98%</div>
              <div class="text-sm text-gray-500">满意度</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/layout/MainLayout.vue';

const shortcuts = [
  { name: 'AI 助手', icon: '🤖', path: '/agent' },
  { name: '创作中心', icon: '🎨', path: '/tools' },
  { name: 'Listing', icon: '📝', path: '/tools/listing' },
  { name: '历史记录', icon: '📚', path: '/tools/history' },
];

const recentProjects = [
  { id: 1, name: '充电宝 Listing', type: 'Listing', time: '2小时前', image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400' },
  { id: 2, name: '耳机模特图', type: '图片', time: '昨天', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' },
  { id: 3, name: '手机壳视频', type: '视频', time: '3天前', image: 'https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?w=400' },
];

function openProject(project: any) {
  // 打开项目详情
}
</script>
