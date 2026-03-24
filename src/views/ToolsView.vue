<template>
  <div class="p-8 max-w-7xl mx-auto">
    <!-- Banner 区域 -->
    <div class="banner relative overflow-hidden rounded-2xl p-8 mb-8">
      <div class="relative z-10 flex items-center justify-between">
        <div class="max-w-xl">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white mb-4">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            AI 智能创作
          </span>
          <h2 class="text-3xl font-bold text-white mb-3">AI 一键生成专业 Listing</h2>
          <p class="text-white/80 mb-6 leading-relaxed">输入 ASIN 或产品链接，AI 自动分析竞品、生成标题、五点描述和 A+ 内容</p>
          <button class="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg shadow-blue-500/20" @click="$router.push('/tools/listing')">
            立即体验
          </button>
        </div>
        <div class="hidden lg:flex items-center justify-center w-48 h-48">
          <div class="w-32 h-32 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <svg class="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
        </div>
      </div>
      <!-- 装饰元素 -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
      <div class="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2"></div>
    </div>

    <!-- 选择场景区域 -->
    <div class="mb-10">
      <div class="flex items-center gap-3 mb-6">
        <h2 class="text-xl font-bold text-gray-900">选择场景，快速开始创作</h2>
        <span class="text-sm text-gray-400">选择你需要的 AI 工具</span>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="scene in scenes"
          :key="scene.id"
          class="scene-card group"
          @click="$router.push(scene.path)"
        >
          <div class="scene-icon" :style="{ background: scene.iconBg }">
            <svg class="w-6 h-6" :style="{ color: scene.iconColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="scene.icon"></path>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 text-[15px] mb-1">{{ scene.name }}</h3>
            <p class="text-xs text-gray-400 truncate">{{ scene.desc }}</p>
          </div>
          <svg class="w-5 h-5 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </div>
    </div>

    <!-- 更多图片工具 -->
    <div class="mb-10">
      <h2 class="text-xl font-bold text-gray-900 mb-6">图片工具</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="tool in imageTools"
          :key="tool.id"
          class="tool-card group"
          @click="$router.push(`/tools/${tool.id}`)"
        >
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3" :style="{ background: tool.bg }">
            <svg class="w-5 h-5" :style="{ color: tool.color }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tool.icon"></path>
            </svg>
          </div>
          <h3 class="font-medium text-gray-900 text-sm mb-1">{{ tool.name }}</h3>
          <p class="text-xs text-gray-400">{{ tool.desc }}</p>
        </div>
      </div>
    </div>

    <!-- Listing 工具区域 -->
    <div class="mb-10">
      <h2 class="text-xl font-bold text-gray-900 mb-6">文案与 Listing</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          class="listing-card group"
          @click="$router.push('/tools/listing')"
        >
          <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg class="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 mb-1">一键生成 Listing</h3>
            <p class="text-sm text-gray-400">基于商品信息与竞品分析，自动生成标题、五点、描述</p>
          </div>
        </div>

        <div
          class="listing-card group"
          @click="$router.push('/tools/aplus-wizard')"
        >
          <div class="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <svg class="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"></path>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 mb-1">A+ 内容生成</h3>
            <p class="text-sm text-gray-400">基于 Listing 与策略，生成 Amazon A+ 模块化文案与配图</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频工具区域 -->
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">爆款视频复刻</h2>
        <button class="text-blue-500 text-sm font-medium hover:text-blue-600 transition">
          查看全部 →
        </button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="video in videoTools"
          :key="video.id"
          class="video-card group"
        >
          <div class="aspect-video bg-gray-100 relative rounded-xl overflow-hidden">
            <img :src="video.thumbnail" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <div class="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <svg class="w-5 h-5 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </div>
          <h4 class="font-medium text-sm text-gray-900 mt-3 truncate">{{ video.name }}</h4>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 场景选择 - 6 大核心场景
const scenes = [
  {
    id: 'virtual-try-on',
    name: '模特试穿',
    desc: '将服装穿到 AI 模特身上，保留细节与版型',
    path: '/tools/virtual-try-on',
    icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
  },
  {
    id: 'face-swap',
    name: '模特换脸',
    desc: '保持模特姿势与服装，替换为指定面孔',
    path: '/tools/face-swap',
    icon: 'M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z',
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
  },
  {
    id: 'shoe-try-on',
    name: '试鞋',
    desc: '上传鞋子图片，生成上脚效果图',
    icon: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83zM2 20h20v2H2v-2z',
    path: '/tools/shoe-try-on',
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
  },
  {
    id: 'scene-generation',
    name: '商品场景图',
    desc: '一键生成多种商品场景展示图',
    path: '/tools/scene-generation',
    icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zM16.5 8.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
    iconBg: '#FDF4FF',
    iconColor: '#9333EA',
  },
  {
    id: 'hand-product',
    name: '手持商品',
    desc: '生成手持商品展示效果图',
    path: '/tools/hand-product',
    icon: 'M7.5 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11',
    iconBg: '#FEF2F2',
    iconColor: '#DC2626',
  },
  {
    id: 'model-bg-replace',
    name: '换背景',
    desc: '智能替换模特图片背景',
    path: '/tools/model-bg-replace',
    icon: 'M6.429 6.429L3 12l3.429 5.571h11.142L21 12l-3.429-5.571H6.429zm5.571.821v9.5M7.5 9.75h9M7.5 14.25h9',
    iconBg: '#ECFDF5',
    iconColor: '#059669',
  },
];

// 图片工具
const imageTools = [
  {
    id: 'background-replace',
    name: '背景替换',
    desc: '一键替换背景',
    icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
    bg: '#EFF6FF',
    color: '#2563EB',
  },
  {
    id: 'detail-enhance',
    name: '细节增强',
    desc: '提升清晰度与质感',
    icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z',
    bg: '#FDF4FF',
    color: '#9333EA',
  },
  {
    id: 'upscale',
    name: '图片放大',
    desc: '无损放大图片',
    icon: 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15',
    bg: '#F0FDF4',
    color: '#16A34A',
  },
  {
    id: 'cutout-white-bg',
    name: '抠图白底',
    desc: '智能抠图换白底',
    icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42',
    bg: '#FFF7ED',
    color: '#EA580C',
  },
];

// 视频工具
const videoTools = [
  { id: 1, name: '产品展示视频', thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300' },
  { id: 2, name: '使用教程视频', thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=300' },
  { id: 3, name: '对比测评视频', thumbnail: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=300' },
  { id: 4, name: '开箱视频', thumbnail: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300' },
];
</script>

<style scoped>
.banner {
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 40%, #3b82f6 70%, #60a5fa 100%);
}

.scene-card {
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

.scene-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
  transform: translateY(-1px);
}

.scene-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tool-card {
  background: #fff;
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
  transform: translateY(-1px);
}

.listing-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: #fff;
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.listing-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
  transform: translateY(-1px);
}

.video-card {
  cursor: pointer;
}
</style>
