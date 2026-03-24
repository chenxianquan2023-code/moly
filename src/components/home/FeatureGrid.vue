<template>
  <section class="feature-grid">
    <div class="features-container">
      <div class="header-row">
        <h2 class="section-title">核心能力</h2>
      </div>

      <div class="features-wrapper">
        <!-- Card 1: AI 电商 -->
        <div class="custom-card type-blue" @click="$router.push('/workbench')" style="cursor: pointer;">
          <div class="card-icon-area">
            <UserOutlined />
          </div>
          <h3 class="card-title">AI 全球化电商视觉生产</h3>
          <p class="card-desc">模特虚拟换装、多人种族裔匹配、 将产品瞬间置于目标市场的典型消费场景中、预设姿态库。</p>
        </div>

        <!-- Card 2: Amazon A+ -->
        <div class="custom-card type-yellow" @click="$router.push('/workflow/marketing')" style="cursor: pointer;">
          <div class="card-header-row">
            <div class="card-icon-area">
              <AppstoreOutlined />
            </div>
            <span class="badge yellow">公测版</span>
          </div>
          <h3 class="card-title">商品营销物料工厂</h3>
          <p class="card-desc">List视觉车间（Amazon A+详情页）</p>
          <p class="card-desc">品牌物料车间（Facebook、Instagram）</p>
        </div>

        <!-- Card 3: Video -->
        <div class="custom-card type-purple">
          <div class="card-header-row">
            <div class="card-icon-area">
              <PlayCircleOutlined />
            </div>
            <span class="badge purple">即将上线</span>
          </div>
          <h3 class="card-title">全领域视频营销</h3>
          <p class="card-desc">短视频营销工厂（tiktok/Reels/Shorts）</p>
          <p class="card-desc">长视频带货推广（Facebook/Youtube）</p>
          <p class="card-desc">高品质TVC制作</p>
        </div>
      </div>

      <div class="trust-footer">
        <p>受到超过<span class="highlight">1,000,000+</span> 家时尚与电商品牌的信赖。</p>

        <div class="brand-logos">
          <img :src="tiktokLogo" alt="TikTok" class="brand-logo" />
          <img :src="instagramLogo" alt="Instagram" class="brand-logo" />
          <img :src="amazonLogo" alt="Amazon" class="brand-logo" />
          <img :src="woocommerceLogo" alt="WooCommerce" class="brand-logo" />
          <img :src="shopifyLogo" alt="Shopify" class="brand-logo" />
          <img :src="ebayLogo" alt="eBay" class="brand-logo" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { UserOutlined, AppstoreOutlined, PlayCircleOutlined } from '@ant-design/icons-vue';

// Import logos
import amazonLogo from '../../assets/svg/amazon-ar21.svg';
import ebayLogo from '../../assets/svg/ebay.svg';
import instagramLogo from '../../assets/svg/instagram-seeklogo.svg';
import shopifyLogo from '../../assets/svg/shopify-ar21.svg';
import tiktokLogo from '../../assets/svg/tiktok-seeklogo.svg';
import woocommerceLogo from '../../assets/svg/woocommerce.svg';
</script>

<style scoped lang="scss">
.feature-grid {
  padding: 80px 0;
  display: flex;
  justify-content: center;
  background: linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%);
}

.features-container {
  width: 100%;
  max-width: 1280px;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
}

.header-row {
  margin-bottom: 32px;
  .section-title {
    font-size: 24px;
    font-weight: 700;
    color: #111827;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.features-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.custom-card {
  background: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 24px;
  height: 100%;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 240px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  &.type-blue:hover { border-color: #93C5FD; }
  &.type-yellow:hover { border-color: #FCD34D; }
  &.type-purple:hover { border-color: #C4B5FD; }

  .card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    margin-bottom: 16px;

    .card-icon-area { margin-bottom: 0; }
  }

  .card-icon-area {
    width: 40px;
    height: 40px;
    background: #EFF6FF;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #2563EB;
    margin-bottom: 16px;
    transition: all 0.3s;
  }

  &.type-blue:hover .card-icon-area { color: #2563EB; background: #DBEAFE; }
  &.type-yellow:hover .card-icon-area { color: #D97706; background: #FEF3C7; }
  &.type-purple:hover .card-icon-area { color: #7C3AED; background: #EDE9FE; }

  .card-title {
    color: #111827;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .card-desc {
    color: #6B7280;
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 0;
  }
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  display: inline-block;

  &.yellow {
    background: #FEF3C7;
    color: #D97706;
    border: 1px solid #FCD34D;
  }

  &.purple {
    background: #EDE9FE;
    color: #7C3AED;
    border: 1px solid #C4B5FD;
  }
}

.trust-footer {
  margin-top: 80px;
  text-align: center;
  padding-top: 40px;
  border-top: 1px solid #E5E7EB;

  p {
    color: #6B7280;
    font-size: 16px;
    margin-bottom: 48px;

    .highlight {
      font-weight: 700;
      color: #2563EB;
    }
  }

  .brand-logos {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 32px 48px;
    opacity: 0.7;

    .brand-logo {
      width: 90px;
      max-width: 120px;
      object-fit: contain;
      filter: grayscale(1);
      opacity: 0.6;
      transition: all 0.3s ease;

      &:hover {
        opacity: 1;
        filter: grayscale(0);
      }
    }
  }
}
</style>
