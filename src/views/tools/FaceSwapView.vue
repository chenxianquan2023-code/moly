<template>
  <ToolPageTemplate
    title="模特换脸"
    description="保持模特姿势与服装，替换为指定面孔"
    :cost="15"
  >
    <template #settings>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">选择面孔</label>
        <select class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500">
          <option>亚洲女性面孔 A</option>
          <option>亚洲女性面孔 B</option>
          <option>欧美女性面孔 A</option>
          <option>上传自定义面孔</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">融合度</label>
        <input type="range" min="0" max="100" value="80" class="w-full" />
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>自然</span>
          <span>相似</span>
        </div>
      </div>
    </template>
  </ToolPageTemplate>
</template>

<script setup lang="ts">
import ToolPageTemplate from '@/components/ToolPageTemplate.vue';
</script>
