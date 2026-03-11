<template>
  <div class="flex rounded-lg overflow-hidden border transition-colors" :class="error ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]'">
    <CountryCodeSelect v-model="countryDial" />
    <input
      :value="modelValue"
      type="tel"
      inputmode="numeric"
      maxlength="11"
      :placeholder="placeholder"
      :disabled="disabled"
      class="flex-1 h-12 px-4 text-[15px] outline-none bg-[#F9FAFB] focus:bg-white"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import CountryCodeSelect from './CountryCodeSelect.vue';

const props = defineProps<{
  modelValue: string;
  countryCode?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [v: string]; 'update:countryCode': [v: string] }>();

const countryDial = ref(props.countryCode ?? '+86');

watch(
  () => props.countryCode,
  (v) => {
    if (v) countryDial.value = v;
  }
);

watch(countryDial, (v) => emit('update:countryCode', v));

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
  emit('update:modelValue', v);
}
</script>
