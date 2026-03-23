<template>
  <div class="relative">
    <button
      type="button"
      class="flex items-center gap-1 h-12 px-3 border border-[#E5E7EB] rounded-l-lg bg-[#F9FAFB] text-[#111827] text-sm min-w-[72px] hover:bg-[#F3F4F6] transition-colors"
      @click="open = !open"
    >
      <span>{{ selected.dial }}</span>
      <DownOutlined :class="['text-[#6B7280] transition-transform', open && 'rotate-180']" />
    </button>
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="open"
        class="absolute left-0 top-full mt-1 z-50 w-56 max-h-64 overflow-auto bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1"
      >
        <input
          v-model="search"
          type="text"
          placeholder="搜索"
          class="w-full px-3 py-2 text-sm border-b border-[#E5E7EB] outline-none"
        />
        <button
          v-for="item in list"
          :key="item.code"
          type="button"
          class="w-full px-3 py-2 text-left text-sm hover:bg-[#F3F4F6] flex justify-between items-center"
          @click="select(item)"
        >
          <span class="text-[#111827]">{{ item.name }}</span>
          <span class="text-[#6B7280]">{{ item.dial }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { DownOutlined } from '@ant-design/icons-vue';
import { useCountryCode } from '@/composables/useCountryCode';
import type { CountryCodeItem } from '@/types/auth.types';

const props = withDefaults(
  defineProps<{ modelValue?: string }>(),
  { modelValue: '+86' }
);

const emit = defineEmits<{ 'update:modelValue': [dial: string] }>();

const { list, fullList, selected, search, select: doSelect } = useCountryCode(props.modelValue);
const open = ref(false);

watch(
  () => props.modelValue,
  (dial) => {
    const item = fullList.value.find((c) => c.dial === dial);
    if (item) doSelect(item);
  },
  { immediate: true }
);

function select(item: CountryCodeItem) {
  doSelect(item);
  emit('update:modelValue', item.dial);
  open.value = false;
}

defineExpose({ selected });
</script>
