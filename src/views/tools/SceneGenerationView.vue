<template>
  <ToolPageTemplate
    title="商品场景图"
    description="将商品融入 AI 生成的场景，提升展示效果"
    :cost="25"
  >
    <template #settings>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">场景类型</label>
        <select class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500">
          <option>家居场景</option>
          <option>办公场景</option>
          <option>户外场景</option>
          <option>商业场景</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">光线风格</label>
        <select class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500">
          <option>自然光</option>
          <option>暖色调</option>
          <option>冷色调</option>
          <option>专业摄影灯光</option>
        </select>
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-2">场景描述（可选）</label>
        <textarea 
          placeholder="描述您想要的场景，例如：现代简约客厅，阳光透过窗户..."
          rows="3"
          class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 resize-none"
        ></textarea>
      </div>
    </template>
  </ToolPageTemplate>
</template>

<script setup lang="ts">
import ToolPageTemplate from '@/components/ToolPageTemplate.vue';
</script>
