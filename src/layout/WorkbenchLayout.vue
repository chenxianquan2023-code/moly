<template>
  <div class="workbench-layout">
    <header class="workbench-header">
      <!-- Left: Logo + Nav -->
      <div class="left-section">
        <nav class="breadcrumb">
          <router-link to="/tools" class="text-[#2563eb] text-sm no-underline hover:underline">AI 工具</router-link>
          <span class="text-gray-400 text-xs mx-2">›</span>
          <span class="text-gray-500 text-sm">工作流</span>
        </nav>

        <nav class="main-nav">
          <a href="#" class="nav-item active">工作流</a>
          <a href="#" class="nav-item">资产库</a>
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

    <main class="workbench-body">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { SearchOutlined, BellOutlined, PlusCircleOutlined } from '@ant-design/icons-vue';
</script>

<style scoped lang="scss">
.workbench-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #F9FAFB;
}

.workbench-header {
  height: 64px;
  border-bottom: 1px solid #E5E7EB;
  background-color: #ffffff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;

  .left-section {
    display: flex;
    align-items: center;
    gap: 40px;

    .main-nav {
      display: flex;
      align-items: center;
      gap: 24px;
      font-size: 14px;
      font-weight: 500;

      .nav-item {
        color: #6B7280;
        text-decoration: none;
        padding: 20px 0;
        position: relative;
        transition: color 0.2s;

        &:hover {
          color: #111827;
        }

        &.active {
          color: #2563EB;
          border-bottom: 2px solid #2563EB;
        }
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
