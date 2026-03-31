<template>
  <div class="main-layout">
    <header class="main-header" :class="{ 'scrolled': isScrolled }">
      <div class="header-container">
        <div class="logo" @click="router.push('/')">
          <div class="logo-icon">
            <span class="logo-m">M</span>
          </div>
          <span class="logo-text">Moly</span>
        </div>
        
        <nav class="main-nav">
          <a href="#" class="nav-item group disabled" @click.prevent>
            产品 
            <!-- <DownOutlined class="nav-icon"/> -->
          </a>
          <a href="#" class="nav-item group disabled" @click.prevent>
             解决方案 
             <!-- <DownOutlined class="nav-icon"/> -->
          </a>
          <a href="#" class="nav-item disabled" @click.prevent>价格</a>
        </nav>

        <div class="header-actions">
          <template v-if="auth.isLoggedIn">
            <span class="header-points">
              <ThunderboltFilled class="points-icon" /> {{ auth.points }} 积分
            </span>
            <button class="action-btn btn-glow" @click="goToWorkbench">
              进入工作台
            </button>
            <button class="action-btn btn-outline" @click="handleLogout">退出</button>
          </template>
          <template v-else>
            <router-link to="/login" class="action-btn btn-glow">登录</router-link>
            <router-link to="/register" class="action-btn btn-outline">注册</router-link>
            <button class="action-btn btn-glow" @click="goToWorkbench">
              进入工作台
            </button>
          </template>
        </div>
      </div>
    </header>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ThunderboltFilled } from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();
const isScrolled = ref(false);

const goToWorkbench = () => {
  if (!auth.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: '/tools' } });
    return;
  }
  router.push('/tools');
};

const handleLogout = () => {
  auth.logout();
  router.push('/');
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped lang="scss">
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: #1a1a1a;
  font-family: 'Inter', sans-serif;
}

.main-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  transition: all 0.3s ease;
  height: 92px;
  display: flex;
  align-items: center;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &.scrolled {
    background: #ffffff;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
    height: 84px;
    border-bottom-color: rgba(0, 0, 0, 0.06);
  }

  .header-container {
    max-width: 1280px; /* Match max-w-7xl */
    width: 100%;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;

    .logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #3B82F6, #2563EB);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .logo-m {
      color: white;
      font-size: 20px;
      font-weight: 800;
      font-family: 'Nunito', sans-serif;
      line-height: 1;
    }

    .logo-text {
      font-size: 26px;
      font-weight: 800;
      font-family: 'Nunito', sans-serif;
      background: linear-gradient(135deg, #3B82F6, #2563EB);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .main-nav {
    display: none;
    
    @media (min-width: 768px) {
      display: flex;
      gap: 32px;
    }
    
    .nav-item {
      color: #4b5563;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: color 0.2s;

      &:hover {
        color: #111;
      }
      
      .nav-icon {
        font-size: 12px;
        color: #6b7280;
        transition: color 0.2s;
      }

      &:hover .nav-icon {
        color: #111;
      }

      &.disabled {
        color: #9ca3af;
        cursor: not-allowed;
        opacity: 0.7;
        pointer-events: none;
      }
    }
  }

  .header-points {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #4b5563;
    margin-right: 12px;
    .points-icon { color: #f59e0b; }
  }

  .action-btn {
    background-color: #2563eb;
    color: white;
    padding: 8px 20px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
    transition: all 0.3s;
    outline: none;
    text-decoration: none;
    margin-left: 8px;

    &:hover {
      background-color: #1d4ed8;
    }
  }

  .btn-outline {
    background: transparent;
    color: #2563eb;
    border: 1px solid #2563eb;
    box-shadow: none;
    &:hover {
      background: #eff6ff;
    }
  }

  /* Glow Effect */
  .btn-glow {
    position: relative;
    overflow: hidden;
    
    &::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 60%);
      opacity: 0;
      transform: scale(0.5);
      transition: opacity 0.3s, transform 0.3s;
    }
    
    &:hover::after {
      opacity: 1;
      transform: scale(1);
    }
  }
}

.main-content {
  flex: 1;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
}
</style>
