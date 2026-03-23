<template>
  <div class="flex gap-3">
    <input
      :value="modelValue"
      type="text"
      inputmode="numeric"
      maxlength="6"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="[
        'flex-1 h-12 px-4 text-[15px] border rounded-lg outline-none transition-colors bg-[#F9FAFB]',
        error ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#2563EB] focus:bg-white',
      ]"
      autocomplete="one-time-code"
      @input="onInput"
    />
    <button
      type="button"
      :disabled="countdown > 0 || disabled || !canSend"
      class="flex-shrink-0 h-12 px-4 text-[14px] font-medium rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:border-[#E5E7EB] disabled:cursor-not-allowed hover:enabled:bg-[#DBEAFE] transition-colors whitespace-nowrap"
      @click="emit('send')"
    >
      {{ countdown > 0 ? `${countdown}s 后重发` : sendText }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  placeholder?: string;
  countdown: number;
  canSend?: boolean;
  disabled?: boolean;
  error?: boolean;
  sendText?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [v: string];
  send: [];
}>();

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
  emit('update:modelValue', v);
}
</script>
