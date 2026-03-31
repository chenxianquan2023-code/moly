<template>
  <section class="feature-grid">
    <div class="features-container">
      <div class="header-row">
        <h2 class="section-title">核心能力</h2>
      </div>
      
      <div class="features-wrapper">
        <!-- Card 1: AI 电商 -->
        <div class="custom-card type-blue" @click="$router.push('/tools/omni-model')" style="cursor: pointer;">
          <div class="card-icon-area">
            <UserOutlined />
          </div>
          <h3 class="card-title">AI 全球化电商视觉生产</h3>
          <p class="card-desc">模特虚拟换装、多人种族裔匹配、 将产品瞬间置于目标市场的典型消费场景中、预设姿态库。</p>
        </div>

        <!-- Card 2: Amazon A+ -->
        <div class="custom-card type-yellow" @click="$router.push('/tools/listing')" style="cursor: pointer;">
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
        <div class="custom-card type-purple" @click="$router.push('/workflow/jewelry')" style="cursor: pointer;">
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
          <!-- Order: WooCommerce, Amazon, Instagram, TikTok, Shopify, eBay -->
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
  background: transparent;
}

.features-container {
  width: 100%;
  max-width: 1280px; /* Match MainLayout */
  padding: 0 24px;
  display: flex;
  flex-direction: column;
}

.header-row {
  margin-bottom: 32px;
  .section-title {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
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
  background: #111; /* Even darker background */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  height: 100%;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 240px; 
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    background: #161616;
  }
  
  /* Feature specific hover colors */
  &.type-blue:hover { border-color: rgba(59, 130, 246, 0.5); }
  &.type-yellow:hover { border-color: rgba(234, 179, 8, 0.5); }
  &.type-purple:hover { border-color: rgba(168, 85, 247, 0.5); }

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
    background: #1f2937; /* gray-800 */
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #d1d5db; /* gray-300 */
    margin-bottom: 16px;
    transition: all 0.3s;
    
    /* If direct child of card */
    &:nth-child(1):last-child {
       margin-bottom: 16px;
    }
  }
  
  /* Icon hover colors */
  &.type-blue:hover .card-icon-area { color: #60a5fa; background: rgba(30, 58, 138, 0.3); }
  &.type-yellow:hover .card-icon-area { color: #facc15; background: rgba(113, 63, 18, 0.3); }
  &.type-purple:hover .card-icon-area { color: #c084fc; background: rgba(88, 28, 135, 0.3); }

  .card-title {
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .card-desc {
    color: #9ca3af; /* gray-400 */
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
    background: rgba(113, 63, 18, 0.4); /* yellow-900/40 */
    color: #eab308; /* yellow-500 */
    border: 1px solid rgba(161, 98, 7, 0.5);
  }
  
  &.purple {
    background: rgba(88, 28, 135, 0.4); /* purple-900/40 */
    color: #c084fc; /* purple-400 */
    border: 1px solid rgba(126, 34, 206, 0.5);
  }
}


.trust-footer {
  margin-top: 80px;
  text-align: center;
  padding-top: 40px;
  border-top: 1px solid rgba(255,255,255,0.05);

  p {
    color: #9ca3af; /* gray-400 */
    font-size: 16px;
    margin-bottom: 48px;
    
    .highlight {
      font-weight: 700;
      color: #e5e7eb; /* gray-200 */
    }
  }

  .brand-logos {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 32px 48px;
    opacity: 0.6;
    
    .brand-logo {
      // height: 32px; /* Increased base height */
      width: 90px;
      max-width: 120px; /* Limit width */
      object-fit: contain;
      filter: brightness(0) invert(1);
      opacity: 0.7;
      transition: all 0.3s ease;
      
      /* Specific adjustment for vertically oriented or small logos if needed, 
         but generally increasing height helps here */
      
      // &:hover {
      //   opacity: 1;
      //   filter: none;
      // }
    }
  }
}
</style>
