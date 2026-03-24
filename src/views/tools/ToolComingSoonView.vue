<template>
  <div class="coming-soon-view">
    <header class="cs-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <span>{{ toolName }}</span>
        </div>
      </div>
    </header>
    <main class="cs-main">
      <div class="cs-card">
        <span class="cs-icon">{{ icon }}</span>
        <h2>{{ toolName }}</h2>
        <p>{{ description }}</p>
        <p class="cs-hint">即将上线，敬请期待</p>
        <router-link to="/tools" class="back-link">返回工具列表</router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RightOutlined } from '@ant-design/icons-vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { tools } from '@/utils/tools';

const route = useRoute();
const toolId = route.params.toolId as string;

const tool = computed(() => tools.find(t => t.id === toolId));
const toolName = computed(() => tool.value?.name || 'AI 工具');
const description = computed(() => tool.value?.description || '');
const icon = computed(() => tool.value?.icon || '');
</script>

<style scoped lang="scss">
.coming-soon-view {
  min-height: 100vh;
  background: #ffffff;
}

.cs-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 20px;

  .header-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .logo-img { height: 32px; width: auto; object-fit: contain; }

  .breadcrumb {
    font-size: 14px;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 8px;
    a { color: #2563eb; text-decoration: none; }
    .crumb-icon { font-size: 10px; }
  }
}

.cs-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px;
  display: flex;
  justify-content: center;
}

.cs-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);

  .cs-icon { font-size: 48px; display: block; margin-bottom: 16px; }
  h2 { font-size: 24px; margin: 0 0 12px 0; color: #1f2937; }
  p { font-size: 15px; color: #6b7280; line-height: 1.6; margin: 0 0 24px 0; }
  .cs-hint { color: #9ca3af; font-size: 14px; margin-bottom: 32px !important; }
  .back-link {
    display: inline-block;
    padding: 12px 24px;
    background: #2563eb;
    color: #fff;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    transition: background 0.2s;
    &:hover { background: #1d4ed8; }
  }
}
</style>
