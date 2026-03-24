<template>
  <div class="field-textarea">
    <textarea
      :value="modelValue"
      :rows="rows"
      :maxlength="maxLength"
      :placeholder="placeholder"
      :disabled="disabled"
      class="textarea-input"
      @input="handleInput"
    ></textarea>
    <div v-if="maxLength" class="char-count">
      {{ (modelValue?.length || 0) }} / {{ maxLength }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 3,
  disabled: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();

const handleInput = (e: Event) => {
  const value = (e.target as HTMLTextAreaElement).value;
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<style scoped lang="scss">
.field-textarea {
  width: 100%;
  position: relative;
}

.textarea-input {
  width: 100%;
  padding: 10px 14px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  color: #111827;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: all 0.3s;

  &::placeholder {
    color: #9CA3AF;
  }

  &:hover:not(:disabled) {
    border-color: #2563EB;
    background: #EFF6FF;
  }

  &:focus {
    border-color: #2563EB;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    resize: none;
  }
}

.char-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 11px;
  color: #9CA3AF;
  pointer-events: none;
}
</style>
