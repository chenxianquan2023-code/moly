<template>
  <header class="tool-header">
    <div class="header-inner">
      <div class="breadcrumb">
        <router-link to="/tools">AI 工具</router-link>
        <RightOutlined class="crumb-icon" />
        <router-link to="/tools/listing">一键生成 Listing</router-link>
        <RightOutlined class="crumb-icon" />
        <span>{{ breadcrumbLabel }}</span>
      </div>
      <div class="header-right">
        <span class="points"><ThunderboltFilled /> {{ auth.points }} 积分</span>
        <router-link to="/recharge" class="recharge-link">充值</router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RightOutlined, ThunderboltFilled } from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth'

defineProps<{ breadcrumbLabel: string }>()
const auth = useAuthStore()
</script>

<style scoped lang="scss">
.tool-header {
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  padding: 12px 0;
  .header-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .breadcrumb {
    font-size: 14px;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: 8px;
    a {
      color: var(--color-primary);
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
    .crumb-icon { font-size: 10px; }
  }
  .header-right { display: flex; align-items: center; gap: 16px; font-size: 14px; }
  .points { color: var(--color-text-secondary); }
  .recharge-link { color: var(--color-primary); text-decoration: none; }
}
</style>
