<template>
  <div class="field-slider">
    <input
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      class="slider-input"
      @input="handleInput"
    />
    <div class="slider-track-bg"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: number;
  min: number;
  max: number;
  step?: number;
  showValue?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  step: 1,
  showValue: true,
  disabled: false
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

const handleInput = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value);
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<style scoped lang="scss">
.field-slider {
  position: relative;
  width: 100%;
  padding: 8px 0;
}

.slider-input {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  position: relative;
  z-index: 1;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  // Chrome/Safari thumb
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    border: 2px solid #667eea;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.2s;
    
    &:hover {
      transform: scale(1.2);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  }
  
  // Firefox thumb
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    border: 2px solid #667eea;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.2s;
    
    &:hover {
      transform: scale(1.2);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  }
  
  // Firefox track
  &::-moz-range-track {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 3px;
    height: 6px;
  }
}

.slider-track-bg {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  transform: translateY(-50%);
  z-index: 0;
}
</style>
