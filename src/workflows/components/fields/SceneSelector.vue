<template>
  <div class="field-scene-selector">
    <div class="scene-grid">
      <div 
        v-for="scene in options" 
        :key="scene.id"
        class="scene-card"
        :class="{ 
          'active': isSelected(scene.id),
          'disabled': disabled || (multiple && isMaxReached && !isSelected(scene.id))
        }"
        @click="handleToggle(scene.id)"
      >
        <div class="scene-thumbnail">
          <img :src="scene.thumbnail" :alt="scene.name" />
          <div v-if="isSelected(scene.id)" class="check-mark">
            <CheckOutlined />
          </div>
        </div>
        <div class="scene-info">
          <div class="scene-name">{{ scene.name }}</div>
          <div v-if="scene.description" class="scene-description">
            {{ scene.description }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="multiple && max" class="selection-hint">
      已选择 {{ selectedCount }} / {{ max }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CheckOutlined } from '@ant-design/icons-vue';

interface SceneOption {
  id: string;
  name: string;
  thumbnail: string;
  description?: string;
}

interface Props {
  modelValue: string | string[];
  options: SceneOption[];
  multiple?: boolean;
  max?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  disabled: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]];
  change: [value: string | string[]];
}>();

const selectedCount = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue.length : 0;
});

const isMaxReached = computed(() => {
  return props.max !== undefined && selectedCount.value >= props.max;
});

const isSelected = (sceneId: string): boolean => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(sceneId);
  }
  return props.modelValue === sceneId;
};

const handleToggle = (sceneId: string) => {
  if (props.disabled) return;
  
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = current.indexOf(sceneId);
    
    if (index > -1) {
      current.splice(index, 1);
    } else {
      if (props.max && current.length >= props.max) {
        return;
      }
      current.push(sceneId);
    }
    
    emit('update:modelValue', current);
    emit('change', current);
  } else {
    emit('update:modelValue', sceneId);
    emit('change', sceneId);
  }
};
</script>

<style scoped lang="scss">
.field-scene-selector {
  width: 100%;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.scene-card {
  border: 2px solid transparent;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.03);
  
  &:hover:not(.disabled) {
    transform: translateY(-2px);
    border-color: rgba(102, 126, 234, 0.5);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  &.active {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }
  
  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.scene-thumbnail {
  position: relative;
  width: 100%;
  padding-top: 75%; // 4:3 aspect ratio
  overflow: hidden;
  
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.check-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.scene-info {
  padding: 10px;
}

.scene-name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 4px;
}

.scene-description {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;
}

.selection-hint {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
