<template>
  <div class="field-image-upload">
    <div 
      class="upload-area"
      :class="{ 'has-image': modelValue, 'disabled': disabled }"
      @click="handleClick"
      @drop.prevent="handleDrop"
      @dragover.prevent
    >
      <img v-if="typeof modelValue === 'string'" :src="modelValue" alt="Preview" class="preview-image" />
      <div v-else class="upload-placeholder">
        <PlusOutlined :style="{ fontSize: '32px' }" />
        <p class="main-text">{{ placeholder || '点击上传图片' }}</p>
        <p class="hint-text">{{ acceptHint }}</p>
      </div>
      
      <!-- 已上传时的操作按钮 -->
      <div v-if="modelValue" class="action-buttons">
        <button @click.stop="handleReupload" class="btn-action" title="重新上传">
          <ReloadOutlined />
        </button>
        <button @click.stop="handleRemove" class="btn-action btn-remove" title="删除">
          <DeleteOutlined />
        </button>
      </div>
    </div>
    
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      hidden
      @change="handleFileChange"
    />
    
    <!-- 错误提示 -->
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { PlusOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons-vue';

interface Props {
  modelValue?: string | string[];
  accept?: string;
  maxSize?: number;
  aspectRatio?: [number, number];
  multiple?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/*',
  maxSize: 10 * 1024 * 1024, // 10MB
  multiple: false,
  disabled: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]];
  change: [file: File];
  error: [error: string];
}>();

const fileInput = ref<HTMLInputElement>();
const error = ref('');

const acceptHint = computed(() => {
  const sizeMB = Math.round(props.maxSize / 1024 / 1024);
  return `支持 ${props.accept}, 最大 ${sizeMB}MB`;
});

const handleClick = () => {
  if (!props.disabled) {
    fileInput.value?.click();
  }
};

const handleFileChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files.length > 0 && files[0]) {
    processFile(files[0]);
  }
};

const handleDrop = (e: DragEvent) => {
  if (props.disabled) return;
  
  const files = e.dataTransfer?.files;
  if (files && files.length > 0 && files[0]) {
    processFile(files[0]);
  }
};

const processFile = (file: File) => {
  error.value = '';
  
  // 验证大小
  if (file.size > props.maxSize) {
    const maxMB = Math.round(props.maxSize / 1024 / 1024);
    error.value = `文件大小不能超过 ${maxMB}MB`;
    emit('error', error.value);
    return;
  }
  
  // 读取文件
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    emit('update:modelValue', result);
    emit('change', file);
  };
  reader.readAsDataURL(file);
};

const handleReupload = () => {
  fileInput.value?.click();
};

const handleRemove = () => {
  emit('update:modelValue', '');
  error.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};
</script>

<style scoped lang="scss">
.field-image-upload {
  width: 100%;
}

.upload-area {
  position: relative;
  width: 100%;
  min-height: 200px;
  border: 2px dashed #D1D5DB;
  border-radius: 12px;
  background: #F9FAFB;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover:not(.disabled) {
    border-color: #2563EB;
    background: #EFF6FF;
  }

  &.has-image {
    border-style: solid;
    border-color: #E5E7EB;

    &:hover {
      border-color: #93C5FD;
    }
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6B7280;

  .main-text {
    margin: 12px 0 4px 0;
    font-size: 14px;
    font-weight: 500;
  }

  .hint-text {
    margin: 0;
    font-size: 12px;
    color: #9CA3AF;
  }
}

.action-buttons {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
  
  .upload-area:hover & {
    opacity: 1;
  }
}

.btn-action {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: scale(1.1);
  }
  
  &.btn-remove:hover {
    background: #ff4d4f;
  }
}

.error-message {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 77, 79, 0.1);
  border-left: 3px solid #ff4d4f;
  color: #ff4d4f;
  font-size: 12px;
  border-radius: 4px;
}
</style>
