<template>
  <header class="workflow-header">
    <div class="header-left">
      <div class="breadcrumb">
        <router-link to="/tools" class="crumb-link">AI 工具</router-link>
        <RightOutlined class="crumb-icon" />
        <span class="crumb-current">{{ workflowName }}</span>
      </div>
    </div>
    <div class="header-right">
      <div class="status-badge">
        <span class="status-dot"></span>
        节点引擎就绪
      </div>
      <div class="user-avatar"></div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RightOutlined } from '@ant-design/icons-vue';

interface Props {
  workflowName: string;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.workflow-header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.crumb-link {
  color: #2563EB;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.crumb-icon {
  font-size: 10px;
  color: #6B7280;
}

.crumb-current {
  color: #111827;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6B7280;
  background: #F3F4F6;
  border: 1px solid #E5E7EB;
  padding: 6px 12px;
  border-radius: 9999px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
  border: 2px solid #E5E7EB;
}
</style>
