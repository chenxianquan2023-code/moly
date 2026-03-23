<template>
  <div class="workbench-layout">
    <header class="workbench-header">
      <!-- Left: Logo + Nav -->
      <div class="left-section">
        <router-link to="/" class="logo">
          <img src="@/assets/logo.png" alt="Moly" class="logo-img" />
        </router-link>
        
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
  background-color: #050505;
}

.workbench-header {
  height: 64px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background-color: #050505;
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

    .logo {
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      height: 100%;
      
      .logo-img {
        height: 32px;
        width: auto;
        max-width: 100px;
        object-fit: contain;
      }
    }

    .main-nav {
      display: flex;
      align-items: center;
      gap: 24px;
      font-size: 14px;
      font-weight: 500;

      .nav-item {
        color: #9ca3af;
        text-decoration: none;
        padding: 20px 0;
        position: relative;
        transition: color 0.2s;

        &:hover {
          color: #fff;
        }

        &.active {
          color: #60a5fa;
          border-bottom: 2px solid #60a5fa;
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
        color: #6b7280;
        font-size: 14px;
        transition: color 0.2s;
      }

      .search-input {
        width: 256px;
        background: #1a1a1c;
        color: #fff;
        font-size: 14px;
        padding: 6px 16px 6px 36px;
        border-radius: 8px;
        border: 1px solid transparent;
        outline: none;
        transition: all 0.2s;

        &::placeholder {
          color: #4b5563;
        }

        &:focus {
          border-color: rgba(59, 130, 246, 0.5);
          background: #18181b;
          
          & + .search-icon {
            color: #60a5fa;
          }
        }
      }
    }

    .notification-icon {
      position: relative;
      color: #9ca3af;
      font-size: 20px;
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: #fff;
      }

      .notification-dot {
        position: absolute;
        top: 0;
        right: 0;
        width: 8px;
        height: 8px;
        background-color: #3b82f6;
        border-radius: 50%;
        border: 2px solid #050505;
      }
    }

    .credits-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #1a1a1c;
      padding: 6px 12px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      cursor: pointer;
      transition: border-color 0.2s;

      &:hover {
        border-color: rgba(255, 255, 255, 0.2);
      }

      .credits-label {
        font-size: 12px;
        color: #9ca3af;
      }

      .credits-value {
        font-size: 14px;
        font-weight: 700;
        color: #fff;
      }

      .credits-add {
        color: #3b82f6;
        font-size: 16px;
      }
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(to bottom right, #4b5563, #6b7280);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.1);
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
