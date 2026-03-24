<template>
  <ToolPageTemplate
    title="模特试穿"
    description="将服装穿到 AI 模特身上，保留服装细节与版型"
    :cost="20"
  >
    <template #settings>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">选择模特</label>
        <select class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500">
          <option>亚洲女性 - 商务风格</option>
          <option>亚洲女性 - 休闲风格</option>
          <option>欧美女性 - 时尚风格</option>
          <option>亚洲男性 - 商务风格</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">场景风格</label>
        <select class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500">
          <option>室内纯色背景</option>
          <option>街拍场景</option>
          <option>自然光场景</option>
          <option>工作室灯光</option>
        </select>
      </div>
    </template>
  </ToolPageTemplate>
</template>

<script setup lang="ts">
import ToolPageTemplate from '@/components/ToolPageTemplate.vue';
</script>
