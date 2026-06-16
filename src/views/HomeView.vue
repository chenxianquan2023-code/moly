<template>
  <div class="home-view">
    <HeroSection />
    <FeaturesSection />
    <ProductShowcase />
    <ShowcaseSection />
    <SocialProof />
    <PricingSection />
    <Footer />
  </div>
</template>

<script setup lang="ts">
import HeroSection from '@/components/home/HeroSection.vue';
import FeaturesSection from '@/components/home/FeaturesSection.vue';
import ProductShowcase from '@/components/home/ProductShowcase.vue';
import ShowcaseSection from '@/components/home/ShowcaseSection.vue';
import SocialProof from '@/components/home/SocialProof.vue';
import PricingSection from '@/components/home/PricingSection.vue';
import Footer from '@/components/home/Footer.vue';
</script>

<style scoped lang="scss">
.home-view {
  min-height: 100vh;
  background: #ffffff;
}
</style>
