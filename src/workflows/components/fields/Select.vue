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
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  color: #111827;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
  cursor: pointer;

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
  }

  option {
    background: #ffffff;
    color: #111827;
    padding: 8px;
  }
}
</style>
