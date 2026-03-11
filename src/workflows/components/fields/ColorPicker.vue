<template>
  <div class="field-color-picker">
    <div class="color-input-wrapper">
      <input
        type="color"
        :value="modelValue"
        :disabled="disabled"
        class="color-input"
        @input="handleInput"
      />
      <div class="color-preview" :style="{ background: modelValue }"></div>
      <input
        type="text"
        :value="modelValue"
        :disabled="disabled"
        class="color-text"
        @input="handleTextInput"
      />
    </div>
    
    <div v-if="presets && presets.length > 0" class="color-presets">
      <div
        v-for="color in presets"
        :key="color"
        class="preset-item"
        :class="{ active: modelValue === color }"
        :style="{ background: color }"
        :title="color"
        @click="selectPreset(color)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string;
  presets?: string[];
  showAlpha?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showAlpha: false,
  disabled: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();

const handleInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  emit('update:modelValue', value);
  emit('change', value);
};

const handleTextInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  if (/^#[0-9A-F]{6}$/i.test(value)) {
    emit('update:modelValue', value);
    emit('change', value);
  }
};

const selectPreset = (color: string) => {
  if (!props.disabled) {
    emit('update:modelValue', color);
    emit('change', color);
  }
};
</script>

<style scoped lang="scss">
.field-color-picker {
  width: 100%;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-input {
  width: 0;
  height: 0;
  opacity: 0;
  position: absolute;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: scale(1.05);
    border-color: #667eea;
  }
}

.color-text {
  flex: 1;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-family: 'Courier New', monospace;
  outline: none;
  
  &:focus {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }
}

.color-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.preset-item {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: scale(1.1);
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  &.active {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
  }
}
</style>
