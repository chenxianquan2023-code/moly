<template>
  <ToolPageTemplate
    title="背景替换"
    description="智能识别主体，一键替换背景"
    :cost="10"
  >
    <template #settings>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">背景类型</label>
        <select class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500">
          <option>纯色背景（白色）</option>
          <option>纯色背景（黑色）</option>
          <option>渐变背景</option>
          <option>透明背景</option>
          <option>自定义背景</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">边缘优化</label>
        <select class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500">
          <option>标准</option>
          <option>精细（适合毛发）</option>
          <option>快速</option>
        </select>
      </div>
    </template>
  </ToolPageTemplate>
</template>

<script setup lang="ts">
import ToolPageTemplate from '@/components/ToolPageTemplate.vue';
</script>
