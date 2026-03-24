<template>
  <div class="tools-layout">
    <!-- 左侧导航栏 -->
    <aside class="sidebar">
      <div class="breadcrumb">
        <router-link to="/tools" class="breadcrumb-link">AI 工具</router-link>
      </div>
      <nav class="sidebar-nav">
        <router-link
          to="/tools"
          class="nav-item"
          :class="{ active: isToolsHome }"
        >
          <HomeOutlined class="nav-icon" />
          <span>首页</span>
        </router-link>
        <router-link to="/tools/templates" class="nav-item" :class="{ active: isTemplates }">
          <AppstoreOutlined class="nav-icon" />
          <span>模版中心</span>
        </router-link>
        <router-link to="/tools/assets" class="nav-item" :class="{ active: isAssets }">
          <FolderOutlined class="nav-icon" />
          <span>资产库</span>
        </router-link>
        <router-link to="/tools/history" class="nav-item" :class="{ active: isHistory }">
          <HistoryOutlined class="nav-icon" />
          <span>历史记录</span>
        </router-link>
      </nav>
    </aside>
    
    <!-- 右侧内容区 -->
    <main class="main-content">
      <!-- 页面内容 -->
      <div class="content-body">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { HomeOutlined, AppstoreOutlined, FolderOutlined, HistoryOutlined } from '@ant-design/icons-vue';

const route = useRoute();

const path = computed(() => route.path);

const isToolsHome = computed(() => {
  const p = path.value;
  if (p === '/tools' || p === '/tools/') return true;
  if (p.startsWith('/tools/') && !['/tools/templates', '/tools/assets', '/tools/history'].some(x => p === x || p.startsWith(x + '/'))) return true;
  return false;
});

const isTemplates = computed(() => path.value.startsWith('/tools/templates'));
const isAssets = computed(() => path.value.startsWith('/tools/assets'));
const isHistory = computed(() => path.value.startsWith('/tools/history'));
</script>

<style scoped lang="scss">
.tools-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: row;
  background: #ffffff;
}

// 左侧导航栏
.sidebar {
  width: 220px;
  min-width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid var(--color-border);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;

  .breadcrumb {
    padding: 0 12px;
    margin-bottom: 24px;

    .breadcrumb-link {
      color: #2563EB;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      font-size: 14px;
      color: var(--color-text-secondary);
      text-decoration: none;
      border-radius: var(--radius-lg);
      transition: all var(--transition-fast);

      &:hover {
        color: var(--color-text-primary);
        background: var(--color-bg);
      }

      &.active {
        color: var(--color-primary);
        background: var(--color-primary-light);
        font-weight: 600;
      }

      .nav-icon {
        font-size: 18px;
      }
    }
  }
}

// 右侧内容区
.main-content {
  flex: 1;
  margin-left: 220px;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

// 内容区域
.content-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #ffffff;
  min-height: 100vh;
}

// 响应式
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    height: 60px;
    flex-direction: row;
    padding: 8px;
    border-right: none;
    border-top: 1px solid var(--color-border);
    
    .breadcrumb {
      display: none;
    }
    
    .sidebar-nav {
      flex-direction: row;
      justify-content: space-around;
      width: 100%;
      
      .nav-item {
        flex-direction: column;
        padding: 8px;
        font-size: 12px;
        gap: 4px;
        
        .nav-icon {
          font-size: 20px;
        }
      }
    }
  }
  
  .main-content {
    margin-left: 0;
    margin-bottom: 60px;
  }
  
}
</style>
