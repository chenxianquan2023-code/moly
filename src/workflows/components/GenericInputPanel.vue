<template>
  <aside class="generic-input-panel">
    <div 
      v-for="section in sections" 
      :key="section.id"
      class="input-section"
    >
      <div class="section-header">
        <span class="section-title">{{ section.title }}</span>
        <span v-if="section.field.required" class="required-mark">*</span>
      </div>
      
      <!-- 动态渲染字段组件 -->
      <component
        :is="getFieldComponent(section.field.type)"
        v-model="formData[section.id]"
        v-bind="section.field.props"
        :disabled="section.field.disabled"
        @change="handleFieldChange(section.id, $event)"
        @error="handleFieldError(section.id, $event)"
      />
      
      <!-- 字段描述 -->
      <p v-if="section.field.description" class="field-description">
        {{ section.field.description }}
      </p>
      
      <!-- 验证错误 -->
      <div v-if="errors[section.id]" class="error-message">
        <ExclamationCircleOutlined />
        <span>{{ errors[section.id] }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { reactive, watch, onMounted } from 'vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { getFieldComponent } from './fields';
import type { InputPanelConfig } from '@/workflows/types/config';

interface Props {
  sections: InputPanelConfig['sections'];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  change: [data: Record<string, any>];
  validate: [isValid: boolean, errors: Record<string, string>];
}>();

const formData = reactive<Record<string, any>>({});
const errors = reactive<Record<string, string>>({});

// 初始化默认值
onMounted(() => {
  props.sections.forEach(section => {
    if (section.field.defaultValue !== undefined) {
      formData[section.id] = section.field.defaultValue;
    }
  });
});

const handleFieldChange = (fieldId: string, _value: any) => {
  // 清除该字段的错误
  delete errors[fieldId];
  
  // 通知父组件数据变化
  emit('change', { ...formData });
};

const handleFieldError = (fieldId: string, error: string) => {
  errors[fieldId] = error;
};

/**
 * 验证表单
 */
const validate = (): boolean => {
  let isValid = true;
  
  // 清空之前的错误
  Object.keys(errors).forEach(key => delete errors[key]);
  
  props.sections.forEach(section => {
    if (section.field.required && !formData[section.id]) {
      errors[section.id] = '此字段为必填项';
      isValid = false;
    }
  });
  
  emit('validate', isValid, errors);
  return isValid;
};

/**
 * 获取表单数据
 */
const getData = () => {
  return { ...formData };
};

/**
 * 设置表单数据
 */
const setData = (data: Record<string, any>) => {
  Object.assign(formData, data);
};

/**
 * 重置表单
 */
const reset = () => {
  Object.keys(formData).forEach(key => delete formData[key]);
  Object.keys(errors).forEach(key => delete errors[key]);
  
  // 恢复默认值
  props.sections.forEach(section => {
    if (section.field.defaultValue !== undefined) {
      formData[section.id] = section.field.defaultValue;
    }
  });
};

// 暴露方法给父组件
defineExpose({
  validate,
  getData,
  setData,
  reset
});

// 监听表单数据变化（用于调试）
watch(
  () => ({ ...formData }),
  () => {
    // Data changed, could add additional logic here if needed
  },
  { deep: true }
);
</script>

<style scoped lang="scss">
.generic-input-panel {
  width: 320px;
  background: #ffffff;
  padding: 20px;
  overflow-y: auto;
  border-right: 1px solid #E5E7EB;
  height: 100%;
}

.input-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.required-mark {
  color: #EF4444;
  margin-left: 4px;
  font-size: 14px;
}

.field-description {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #9CA3AF;
  line-height: 1.5;
}

.error-message {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid #EF4444;
  color: #EF4444;
  font-size: 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 滚动条样式 */
.generic-input-panel::-webkit-scrollbar {
  width: 6px;
}

.generic-input-panel::-webkit-scrollbar-track {
  background: transparent;
}

.generic-input-panel::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;

  &:hover {
    background: #9CA3AF;
  }
}
</style>
