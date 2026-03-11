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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: all 0.3s;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  &:hover:not(:disabled) {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.08);
  }
  
  &:focus {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  color: rgba(255, 255, 255, 0.4);
  pointer-events: none;
}
</style>
