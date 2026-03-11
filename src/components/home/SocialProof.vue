<template>
  <section class="social-proof">
    <h2 class="section-title">已被 10,000+ 商家信赖</h2>
    <div class="scroll-wrap">
      <div class="scroll-track">
        <img v-for="(logo, i) in logos" :key="i" :src="logo.src" :alt="logo.name" class="logo-img" />
        <img v-for="(logo, i) in logos" :key="`dup-${i}`" :src="logo.src" :alt="logo.name" class="logo-img" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import amazonLogo from '@/assets/svg/amazon-ar21.svg';
import ebayLogo from '@/assets/svg/ebay.svg';
import instagramLogo from '@/assets/svg/instagram-seeklogo.svg';
import shopifyLogo from '@/assets/svg/shopify-ar21.svg';
import tiktokLogo from '@/assets/svg/tiktok-seeklogo.svg';
import woocommerceLogo from '@/assets/svg/woocommerce.svg';

const logos = [
  { name: 'Amazon', src: amazonLogo },
  { name: 'eBay', src: ebayLogo },
  { name: 'Instagram', src: instagramLogo },
  { name: 'Shopify', src: shopifyLogo },
  { name: 'TikTok', src: tiktokLogo },
  { name: 'WooCommerce', src: woocommerceLogo },
];
</script>

<style scoped lang="scss">
.social-proof {
  padding: 60px 24px;
  background: transparent;
  overflow: hidden;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 32px 0;
  text-align: center;
}

.scroll-wrap {
  width: 100%;
  overflow: hidden;
}

.scroll-track {
  display: flex;
  gap: 48px;
  animation: scroll 30s linear infinite;
  width: max-content;

  &:hover {
    animation-play-state: paused;
  }
}

.logo-img {
  height: 36px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
  filter: grayscale(1);
  opacity: 0.6;
  transition: filter 0.2s, opacity 0.2s;
  flex-shrink: 0;

  .scroll-track:hover & {
    filter: grayscale(0);
    opacity: 1;
  }
}

@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
</style>
