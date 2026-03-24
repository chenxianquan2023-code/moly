<template>
  <div class="home-view">
    <!-- Top Navigation Bar -->
    <nav class="home-nav">
      <div class="nav-inner">
        <div class="nav-left">
          <router-link to="/" class="nav-logo">
            <div class="logo-icon">
              <span class="logo-icon-letter">M</span>
            </div>
            <span class="logo-text">Moly</span>
          </router-link>
        </div>
        <div class="nav-right">
          <a href="#features" class="nav-link">产品</a>
          <a href="#showcase" class="nav-link">解决方案</a>
          <a href="#pricing" class="nav-link">价格</a>
          <template v-if="authStore.isLoggedIn">
            <span class="credits-badge">{{ authStore.user?.credits || 0 }} 积分</span>
            <router-link to="/dashboard" class="btn-primary-sm">进入工作台</router-link>
            <button class="btn-outline-sm" @click="authStore.logout()">退出</button>
          </template>
          <template v-else>
            <router-link to="/login" class="btn-outline-sm">登录</router-link>
            <router-link to="/register" class="btn-primary-sm">免费注册</router-link>
          </template>
        </div>
      </div>
    </nav>

    <HeroSection />
    <FeaturesSection />
    <ProductShowcase />
    <ShowcaseSection />
    <SocialProof />
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import HeroSection from '@/components/home/HeroSection.vue';
import FeaturesSection from '@/components/home/FeaturesSection.vue';
import ProductShowcase from '@/components/home/ProductShowcase.vue';
import ShowcaseSection from '@/components/home/ShowcaseSection.vue';
import SocialProof from '@/components/home/SocialProof.vue';
import Footer from '@/components/home/Footer.vue';

const authStore = useAuthStore();
</script>

<style scoped lang="scss">
.home-view {
  min-height: 100vh;
  background: #ffffff;
}

.home-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left {
  .nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .logo-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-icon-letter {
    color: #fff;
    font-size: 20px;
    font-weight: 800;
    line-height: 1;
    font-family: 'Nunito', sans-serif;
  }

  .logo-text {
    font-size: 26px;
    font-weight: 800;
    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: 'Nunito', sans-serif;
  }
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-link {
  font-size: 14px;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: #111827;
  }
}

.credits-badge {
  font-size: 13px;
  color: #ca8a04;
}

.btn-primary-sm {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
}

.btn-outline-sm {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: transparent;
  color: #374151;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f9fafb;
  }
}
</style>
