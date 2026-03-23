<template>
  <header class="workflow-header">
    <div class="header-left">
      <router-link to="/" class="logo">
        <img src="@/assets/logo.png" alt="Moly" class="logo-img" />
      </router-link>
      <div class="divider"></div>
      <div class="breadcrumb">
        <span class="crumb-parent">工作流</span>
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
  background: #0a0a0a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-img {
  height: 32px;
  width: auto;
  max-width: 100px;
  object-fit: contain;
}

.divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.1);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.crumb-parent {
  color: #9ca3af;
}

.crumb-icon {
  font-size: 10px;
  color: #9ca3af;
}

.crumb-current {
  color: #fff;
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
  color: #9ca3af;
  background: #1c1c1e;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  background: linear-gradient(to bottom right, #ec4899, #f97316);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
