<template>
  <aside class="generic-config-panel">
    <div class="config-header">
      <h2 class="config-title">{{ title }}</h2>
      <p class="config-subtitle">{{ subtitle }}</p>
    </div>

    <div class="config-body">
      <!-- 配置组 -->
      <div 
        v-for="group in groups" 
        :key="group.id"
        class="config-group"
      >
        <div v-if="group.title" class="group-title">{{ group.title }}</div>
        
        <!-- 字段 -->
        <div 
          v-for="field in group.fields"
          :key="field.id"
          class="config-field"
        >
          <label class="field-label">
            {{ field.label }}
            <span v-if="field.type === 'slider' && configData[field.id] !== undefined">
              : <strong>{{ configData[field.id] }}</strong>
            </span>
            <span v-if="field.required" class="required-mark">*</span>
          </label>
          
          <!-- 动态渲染字段组件 -->
          <component
            :is="getFieldComponent(field.type)"
            v-model="configData[field.id]"
            v-bind="field.props"
            :disabled="field.disabled"
            @change="handleConfigChange(field.id, $event)"
          />
          
          <!-- 字段描述 -->
          <p v-if="field.description" class="field-description">
            {{ field.description }}
          </p>
        </div>
      </div>

      <!-- 执行按钮 -->
      <button 
        class="execute-btn" 
        :disabled="isExecuting"
        @click="handleExecute"
      >
        <component 
          :is="executeButtonIcon" 
          v-if="executeButtonIcon" 
          :class="{ spinning: isExecuting }"
        />
        <span>{{ isExecuting ? '执行中...' : executeButton.text }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, ref } from 'vue';
import { getFieldComponent } from './fields';
import * as Icons from '@ant-design/icons-vue';
import type { ConfigPanelConfig } from '@/workflows/types/config';

interface Props {
  title: string;
  subtitle: string;
  groups: ConfigPanelConfig['groups'];
  executeButton: { text: string; icon?: string };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  execute: [config: Record<string, any>];
  change: [config: Record<string, any>];
}>();

const configData = reactive<Record<string, any>>({});
const isExecuting = ref(false);

// 获取执行按钮图标
const executeButtonIcon = computed(() => {
  if (!props.executeButton.icon) return null;
  return (Icons as any)[props.executeButton.icon] || null;
});

// 初始化默认值
onMounted(() => {
  props.groups.forEach(group => {
    group.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        configData[field.id] = field.defaultValue;
      }
    });
  });
});

const handleConfigChange = (fieldId: string, value: any) => {
  console.log(`[GenericConfigPanel] Config "${fieldId}" changed:`, value);
  emit('change', { ...configData });
};

const handleExecute = () => {
  console.log('[GenericConfigPanel] Execute with config:', configData);
  isExecuting.value = true;
  emit('execute', { ...configData });
  
  // 模拟执行完成（实际应由父组件控制）
  setTimeout(() => {
    isExecuting.value = false;
  }, 1000);
};

/**
 * 获取配置数据
 */
const getData = () => {
  return { ...configData };
};

/**
 * 设置配置数据
 */
const setData = (data: Record<string, any>) => {
  Object.assign(configData, data);
};

/**
 * 重置配置
 */
const reset = () => {
  Object.keys(configData).forEach(key => delete configData[key]);
  
  // 恢复默认值
  props.groups.forEach(group => {
    group.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        configData[field.id] = field.defaultValue;
      }
    });
  });
};

/**
 * 设置执行状态
 */
const setExecuting = (executing: boolean) => {
  isExecuting.value = executing;
};

// 暴露方法给父组件
defineExpose({
  getData,
  setData,
  reset,
  setExecuting
});
</script>

<style scoped lang="scss">
.generic-config-panel {
  width: 320px;
  background: #ffffff;
  padding: 20px;
  overflow-y: auto;
  border-left: 1px solid #E5E7EB;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.config-header {
  margin-bottom: 24px;
}

.config-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.config-subtitle {
  margin: 0;
  font-size: 13px;
  color: #6B7280;
}

.config-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.config-group {
  margin-bottom: 24px;

  &:last-of-type {
    margin-bottom: auto;
  }
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E5E7EB;
}

.config-field {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;

  strong {
    color: #2563EB;
  }
}

.required-mark {
  color: #EF4444;
  margin-left: 4px;
}

.field-description {
  margin: 6px 0 0 0;
  font-size: 11px;
  color: #9CA3AF;
  line-height: 1.4;
}

.execute-btn {
  width: 100%;
  padding: 14px 20px;
  margin-top: 24px;
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 滚动条样式 */
.generic-config-panel::-webkit-scrollbar {
  width: 6px;
}

.generic-config-panel::-webkit-scrollbar-track {
  background: transparent;
}

.generic-config-panel::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;

  &:hover {
    background: #9CA3AF;
  }
}
</style>
