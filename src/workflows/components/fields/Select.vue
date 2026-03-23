<template>
  <div class="field-select">
    <select
      :value="modelValue"
      :disabled="disabled"
      :multiple="multiple"
      class="select-input"
      @change="handleChange"
    >
      <option 
        v-for="option in options" 
        :key="option.value"
        :value="option.value"
      >
        {{ option.icon ? `${option.icon} ` : '' }}{{ option.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
interface SelectOption {
  label: string;
  value: any;
  icon?: string;
}

interface Props {
  modelValue: any;
  options: SelectOption[];
  multiple?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  disabled: false
});

const emit = defineEmits<{
  'update:modelValue': [value: any];
  change: [value: any];
}>();

const handleChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const value = props.multiple 
    ? Array.from(target.selectedOptions).map(opt => opt.value)
    : target.value;
  
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<style scoped lang="scss">
.field-select {
  width: 100%;
}

.select-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
  cursor: pointer;
  
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
  }
  
  option {
    background: #1a1a1a;
    color: rgba(255, 255, 255, 0.9);
    padding: 8px;
  }
}
</style>
