<template>
  <div class="relative">
    <input
      :value="modelValue"
      :type="visible ? 'text' : 'password'"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="[
        'w-full h-12 pl-4 pr-12 text-[15px] border rounded-lg outline-none transition-colors bg-[#F9FAFB]',
        error ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#2563EB] focus:bg-white',
      ]"
      autocomplete="off"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md transition-colors"
      aria-label="切换显示密码"
      @click="visible = !visible"
    >
      <EyeOutlined v-if="!visible" />
      <EyeInvisibleOutlined v-else />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons-vue';

defineProps<{
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [v: string] }>();
const visible = ref(false);
</script>
