<template>
  <section class="features">
    <div class="features-inner">
      <h2 class="section-title">一站式 AI 设计解决方案</h2>
      <p class="section-subtitle">从虚拟试穿到营销图生成，全方位提升电商效率</p>
      <div class="cards">
        <FeatureCard
          title="AI 虚拟试穿"
          description="上传模特和服装，一键生成试穿效果图"
          :icon="UserOutlined"
          @click="$router.push('/tools/omni-model')"
        />
        <FeatureCard
          title="Listing 营销大师"
          description="基于商品信息与竞品分析，自动生成标题、五点、描述"
          :icon="FileTextOutlined"
          @click="$router.push('/tools/listing')"
        />
        <FeatureCard
          title="A+ 设计师"
          description="生成 Amazon A+ 模块化文案与配图，提升详情页转化"
          :icon="AppstoreOutlined"
          @click="$router.push('/tools/aplus-wizard')"
        />
        <FeatureCard
          title="短视频工坊"
          description="首饰、服饰品类专属短视频一键生成，适配主流社交平台"
          :icon="PlayCircleOutlined"
          @click="$router.push('/workflow/jewelry')"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { UserOutlined, FileTextOutlined, AppstoreOutlined, PlayCircleOutlined } from '@ant-design/icons-vue';
import FeatureCard from './FeatureCard.vue';
</script>

<style scoped lang="scss">
.features {
  padding: 80px 24px;
}

.features-inner {
  max-width: 1280px;
  margin: 0 auto;
  text-align: center;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 18px;
  color: #6b7280;
  margin: 0 0 48px 0;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
}

.cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  text-align: left;
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
