<template>
  <div class="workbench-layout">
    <!-- 左侧导航栏 -->
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-header">
        <router-link to="/dashboard" class="logo">Moly</router-link>
      </div>

      <!-- 导航菜单 -->
      <nav class="sidebar-nav">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', isActive(item.path) ? 'active' : '']"
        >
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"></path>
          </svg>
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- 用户信息 -->
      <div class="sidebar-footer">
        <router-link to="/recharge" class="user-card">
          <div class="user-avatar-small">泉</div>
          <div class="user-info">
            <div class="user-name">泉哥</div>
            <div class="user-plan">专业版 · 1,250 积分</div>
          </div>
          <svg class="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </router-link>
      </div>
    </aside>

    <!-- 右侧内容区 -->
    <div class="main-content">
      <!-- 顶部 Header -->
      <header class="workbench-header">
        <!-- Left: Breadcrumb -->
        <div class="left-section">
          <nav class="breadcrumb">
            <router-link to="/dashboard" class="breadcrumb-link">首页</router-link>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current">工作台</span>
          </nav>
        </div>

        <!-- Right: Search + Notification + Credits + Avatar -->
        <div class="right-section">
          <div class="search-wrapper">
            <SearchOutlined class="search-icon" />
            <input type="text" placeholder="搜索工作流..." class="search-input" />
          </div>

          <div class="notification-icon">
            <BellOutlined />
            <span class="notification-dot"></span>
          </div>

          <div class="credits-box">
            <span class="credits-label">剩余额度</span>
            <span class="credits-value">2,500</span>
            <PlusCircleOutlined class="credits-add" />
          </div>

          <div class="user-avatar">USER</div>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="workbench-body">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SearchOutlined, BellOutlined, PlusCircleOutlined } from '@ant-design/icons-vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const menuItems = [
  {
    name: '首页',
    path: '/dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    name: '创作中心',
    path: '/tools',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    name: '工作台',
    path: '/workbench',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
  },
  {
    name: '模版中心',
    path: '/templates',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
  {
    name: '资产库',
    path: '/assets',
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  },
  {
    name: '历史记录',
    path: '/history',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

function isActive(path: string) {
  if (path === '/tools') {
    return route.path === '/tools' || route.path.startsWith('/tools/');
  }
  return route.path === path;
}
</script>

<style scoped lang="scss">
.workbench-layout {
  min-height: 100vh;
  display: flex;
  background-color: #F9FAFB;
}

// 左侧导航栏
.sidebar {
  width: 256px;
  background: #ffffff;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .sidebar-header {
    height: 64px;
    display: flex;
    align-items: center;
    padding: 0 24px;
    border-bottom: 1px solid #F3F4F6;

    .logo {
      font-size: 22px;
      font-weight: 800;
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-decoration: none;
      font-family: 'Nunito', sans-serif;
    }
  }

  .sidebar-nav {
    flex: 1;
    padding: 16px 12px;
    overflow-y: auto;

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 4px;
      color: #6B7280;
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        background: #F9FAFB;
        color: #374151;
      }

      &.active {
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(96, 165, 250, 0.08) 100%);
        color: #2563EB;
        font-weight: 600;

        .nav-icon {
          color: #2563EB;
        }
      }

      .nav-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      span {
        font-size: 14px;
      }
    }
  }

  .sidebar-footer {
    padding: 16px 12px;
    border-top: 1px solid #F3F4F6;

    .user-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      text-decoration: none;
      transition: background 0.2s;

      &:hover {
        background: #F9FAFB;
      }

      .user-avatar-small {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2563EB 0%, #60A5FA 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: 500;
        flex-shrink: 0;
      }

      .user-info {
        flex: 1;
        min-width: 0;

        .user-name {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          margin-bottom: 2px;
        }

        .user-plan {
          font-size: 12px;
          color: #9CA3AF;
        }
      }

      .arrow-icon {
        width: 16px;
        height: 16px;
        color: #9CA3AF;
        flex-shrink: 0;
      }
    }
  }
}

// 右侧内容区
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.workbench-header {
  height: 64px;
  border-bottom: 1px solid #E5E7EB;
  background-color: #ffffff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  .left-section {
    display: flex;
    align-items: center;

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;

      .breadcrumb-link {
        color: #2563EB;
        font-size: 14px;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      .breadcrumb-separator {
        color: #D1D5DB;
        font-size: 12px;
      }

      .breadcrumb-current {
        color: #6B7280;
        font-size: 14px;
      }
    }
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 24px;

    .search-wrapper {
      position: relative;

      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #9CA3AF;
        font-size: 14px;
        transition: color 0.2s;
      }

      .search-input {
        width: 256px;
        background: #F9FAFB;
        color: #111827;
        font-size: 14px;
        padding: 6px 16px 6px 36px;
        border-radius: 8px;
        border: 1px solid #E5E7EB;
        outline: none;
        transition: all 0.2s;

        &::placeholder {
          color: #9CA3AF;
        }

        &:focus {
          border-color: #2563EB;
          background: #ffffff;

          & + .search-icon {
            color: #2563EB;
          }
        }
      }
    }

    .notification-icon {
      position: relative;
      color: #6B7280;
      font-size: 20px;
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: #111827;
      }

      .notification-dot {
        position: absolute;
        top: 0;
        right: 0;
        width: 8px;
        height: 8px;
        background-color: #2563EB;
        border-radius: 50%;
        border: 2px solid #ffffff;
      }
    }

    .credits-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #EFF6FF;
      padding: 6px 12px;
      border-radius: 9999px;
      border: 1px solid #DBEAFE;
      cursor: pointer;
      transition: border-color 0.2s;

      &:hover {
        border-color: #93C5FD;
      }

      .credits-label {
        font-size: 12px;
        color: #6B7280;
      }

      .credits-value {
        font-size: 14px;
        font-weight: 700;
        color: #2563EB;
      }

      .credits-add {
        color: #2563EB;
        font-size: 16px;
      }
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      border: 2px solid #E5E7EB;
      cursor: pointer;
    }
  }
}

.workbench-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
