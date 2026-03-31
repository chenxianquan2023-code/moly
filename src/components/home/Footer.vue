<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="brand">
          <router-link to="/" class="logo-link">
            <img src="@/assets/logo.png" alt="Moly" class="logo-img" />
          </router-link>
          <p class="brand-desc">AI 驱动的一站式电商设计解决方案</p>
        </div>
        <div class="links">
          <div class="link-group">
            <h4 class="link-title">产品</h4>
            <router-link to="/tools/omni-model">虚拟试穿</router-link>
            <router-link to="/tools">工具中心</router-link>
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
    display: inline-block;
    margin-bottom: 12px;
  }
  .logo-img {
    height: 28px;
    width: auto;
    filter: brightness(0) invert(1);
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
