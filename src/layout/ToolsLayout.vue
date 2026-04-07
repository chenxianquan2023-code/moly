<template>
  <div class="tools-layout">
    <!-- 左侧导航栏 -->
    <aside class="sidebar">
      <router-link to="/" class="logo">
        <div class="logo-icon">
          <span class="logo-m">M</span>
        </div>
        <span class="logo-text">Moly</span>
      </router-link>
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

      <!-- 底部用户信息 -->
      <div class="sidebar-bottom">
        <router-link v-if="auth.isLoggedIn" to="/tools/profile" class="user-card" :class="{ active: isProfile }">
          <div class="user-avatar">{{ avatarChar }}</div>
          <div class="user-info">
            <div class="user-email">{{ auth.displayName }}</div>
            <div class="user-points">
              <span class="points-dot" />
              {{ auth.points }} 积分
            </div>
          </div>
        </router-link>
        <router-link v-else to="/login" class="user-card">
          <div class="user-avatar">?</div>
          <div class="user-info">
            <div class="user-email">未登录</div>
            <div class="user-points">点击登录</div>
          </div>
        </router-link>
      </div>
    </aside>

    <!-- Moly AI 助手悬浮气泡 -->
    <MolyAgent />

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
import { useAuthStore } from '@/stores/auth';
import MolyAgent from '@/components/MolyAgent.vue';

const route = useRoute();
const auth = useAuthStore();

const path = computed(() => route.path);

const isToolsHome = computed(() => {
  const p = path.value;
  if (p === '/tools' || p === '/tools/') return true;
  if (p.startsWith('/tools/') && !['/tools/templates', '/tools/assets', '/tools/history', '/tools/profile', '/tools/recharge'].some(x => p === x || p.startsWith(x + '/'))) return true;
  return false;
});

const isTemplates = computed(() => path.value.startsWith('/tools/templates'));
const isAssets = computed(() => path.value.startsWith('/tools/assets'));
const isHistory = computed(() => path.value.startsWith('/tools/history'));
const isProfile = computed(() => path.value.startsWith('/tools/profile') || path.value.startsWith('/tools/recharge'));

const avatarChar = computed(() => {
  const name = auth.email || auth.displayName || '';
  return name[0]?.toUpperCase() || 'U';
});
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

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px;
    margin-bottom: 24px;
    text-decoration: none;

    .logo-icon {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: linear-gradient(135deg, #3B82F6, #2563EB);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .logo-m {
      color: white;
      font-size: 17px;
      font-weight: 800;
      font-family: 'Nunito', sans-serif;
      line-height: 1;
    }

    .logo-text {
      font-size: 22px;
      font-weight: 800;
      font-family: 'Nunito', sans-serif;
      background: linear-gradient(135deg, #3B82F6, #2563EB);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
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

// 底部用户区
.sidebar-bottom {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);

  .user-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-lg);
    text-decoration: none;
    cursor: pointer;
    transition: background var(--transition-fast);

    &:hover, &.active {
      background: var(--color-bg);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3B82F6, #2563EB);
      color: #fff;
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-info {
      min-width: 0;
      .user-email {
        font-size: 13px;
        font-weight: 500;
        color: var(--color-text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 130px;
      }
      .user-points {
        font-size: 12px;
        color: var(--color-text-secondary);
        display: flex;
        align-items: center;
        gap: 4px;
        .points-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
        }
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
  padding: 32px;
  overflow-y: auto;
  background: #F9FAFB;
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
    
    .logo {
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
