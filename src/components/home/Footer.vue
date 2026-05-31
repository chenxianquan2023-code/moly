<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="brand">
          <router-link to="/" class="logo-link">
            <span class="logo-mark">M</span>
            <span class="logo-word">Moly</span>
          </router-link>
          <p class="brand-desc">AI 爆款视频复刻 · 让带货短视频量产化</p>
        </div>
        <div class="links">
          <div class="link-group">
            <h4 class="link-title">产品</h4>
            <router-link to="/studio">爆款视频复刻</router-link>
            <router-link to="/studio">立即体验</router-link>
          </div>
          <div class="link-group">
            <h4 class="link-title">资源</h4>
            <a href="#">帮助中心</a>
            <a href="#">文档</a>
          </div>
          <div class="link-group">
            <h4 class="link-title">公司</h4>
            <a href="#">关于我们</a>
            <a href="#">联系我们</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span class="copyright">© {{ new Date().getFullYear() }} Moly. All rights reserved.</span>
        <div class="social">
          <a href="#" class="social-link" aria-label="微博">微博</a>
          <a href="#" class="social-link" aria-label="微信">微信</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.footer {
  background: #1f2937;
  color: #9ca3af;
  padding: 48px 24px 24px;
}

.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
}

.footer-top {
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  @media (min-width: 768px) {
    grid-template-columns: 280px 1fr;
  }
}

.brand {
  .logo-link {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 12px;
    text-decoration: none;
  }
  .logo-mark {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    background: linear-gradient(135deg, #3B82F6, #6366F1);
    color: #fff;
    font-weight: 800;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logo-word {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #fff;
  }
  .brand-desc {
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
    max-width: 240px;
  }
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 32px 48px;
}

.link-group {
  .link-title {
    font-size: 12px;
    font-weight: 600;
    color: #d1d5db;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 12px 0;
  }
  a {
    display: block;
    font-size: 14px;
    color: #9ca3af;
    text-decoration: none;
    margin-bottom: 8px;
    transition: color 0.2s;
    &:hover {
      color: #fff;
    }
  }
}

.footer-bottom {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding-top: 24px;
  text-align: center;
  @media (min-width: 640px) {
    flex-direction: row;
    text-align: left;
  }
}

.copyright {
  font-size: 13px;
}

.social {
  display: flex;
  gap: 16px;
}

.social-link {
  font-size: 13px;
  color: #9ca3af;
  text-decoration: none;
  &:hover {
    color: #fff;
  }
}
</style>
