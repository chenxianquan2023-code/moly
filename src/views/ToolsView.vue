<template>
  <MainLayout>
    <div class="p-8 max-w-7xl mx-auto">
      <!-- Banner 区域 -->
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
        <div class="flex items-center justify-between">
          <div class="max-w-xl">
            <span class="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-4">热门推荐</span>
            <h2 class="text-3xl font-bold mb-3">AI 一键生成专业 Listing</h2>
            <p class="text-white/80 mb-6">输入 ASIN 或产品链接，AI 自动分析竞品、生成标题、五点描述和 A+ 内容</p>
            <button class="px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-white/90 transition" @click="$router.push('/tools/listing')">
              立即体验
            </button>
          </div>
          <div class="hidden md:block">
            <div class="w-64 h-40 bg-white/10 rounded-xl flex items-center justify-center">
              <span class="text-6xl">📝</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 主要工具区域 -->
      <div class="mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">选择场景，快速生成专业图片</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="tool in mainTools"
            :key="tool.id"
            class="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition group"
            @click="handleToolClick(tool)"
          >
            <!-- 工具预览图 -->
            <div class="h-40 bg-gray-100 relative overflow-hidden">
              <img 
                :src="tool.image || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'" 
                class="w-full h-full object-cover group-hover:scale-105 transition"
                alt=""
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div class="absolute bottom-4 left-4 text-white">
                <span class="text-2xl mr-2">{{ tool.icon }}</span>
              </div>
            </div>
            <!-- 工具信息 -->
            <div class="p-5">
              <h3 class="font-semibold text-gray-900 mb-2">{{ tool.name }}</h3>
              <p class="text-sm text-gray-500">{{ tool.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Listing 工具区域 -->
      <div class="mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">文案与 Listing</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 一键生成 Listing -->
          <div
            class="bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition flex items-center gap-6"
            @click="$router.push('/tools/listing')"
          >
            <div class="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-4xl flex-shrink-0">
              📝
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">一键生成 Listing</h3>
              <p class="text-sm text-gray-500">基于商品信息与竞品分析，自动生成标题、五点、描述与主图建议</p>
            </div>
          </div>

          <!-- A+ 内容生成 -->
          <div
            class="bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition flex items-center gap-6"
            @click="$router.push('/tools/aplus-wizard')"
          >
            <div class="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center text-4xl flex-shrink-0">
              ✨
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">A+ 内容生成</h3>
              <p class="text-sm text-gray-500">基于已生成 Listing 与策略，生成 Amazon A+ 模块化文案与配图</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 视频工具区域 -->
      <div>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900">爆款视频复刻</h2>
          <button class="text-blue-600 text-sm hover:underline" @click="handleViewAll('video')">
            查看全部 →
          </button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="video in videoTools"
            :key="video.id"
            class="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition"
            @click="handleToolClick(video)"
          >
            <div class="aspect-video bg-gray-100 relative">
              <img :src="video.thumbnail" class="w-full h-full object-cover" alt="" />
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <svg class="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="p-3">
              <h4 class="font-medium text-sm text-gray-900 truncate">{{ video.name }}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import MainLayout from '@/layout/MainLayout.vue';

const router = useRouter();

// 主要工具
const mainTools = [
  {
    id: 'virtual-try-on',
    name: '模特试穿',
    description: '将服装穿到 AI 模特身上，保留服装细节与版型',
    icon: '👗',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
  },
  {
    id: 'face-swap',
    name: '模特换脸',
    description: '保持模特姿势与服装，替换为指定面孔',
    icon: '👤',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  },
  {
    id: 'scene-generation',
    name: '商品场景图',
    description: '将商品融入 AI 生成的场景，提升展示效果',
    icon: '🏞️',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
  },
  {
    id: 'background-replace',
    name: '背景替换',
    description: '智能识别主体，一键替换背景',
    icon: '🖼️',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
  },
  {
    id: 'detail-enhance',
    name: '细节增强',
    description: '提升图片清晰度与质感',
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
  },
  {
    id: 'upscale',
    name: '图片放大',
    description: '无损放大图片，保持清晰度',
    icon: '🔍',
    image: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=400',
  },
];

// 视频工具
const videoTools = [
  { id: 1, name: '产品展示视频', thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300' },
  { id: 2, name: '使用教程视频', thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=300' },
  { id: 3, name: '对比测评视频', thumbnail: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=300' },
  { id: 4, name: '开箱视频', thumbnail: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300' },
];

function handleToolClick(tool: any) {
  router.push(`/tools/${tool.id}`);
}

function handleViewAll(type: string) {
  router.push(`/tools?category=${type}`);
}
</script>
