<template>
  <div class="addon-services">
    <h3 class="addon-title">增值服务</h3>
    <p class="addon-desc">提升商品曝光率，让你的产品在竞争中脱颖而出</p>

    <div class="addon-cards">
      <div class="addon-card" @click="goToPromoImage">
        <div class="card-badge">增值</div>
        <div class="card-icon promo-image-icon">
          <PictureOutlined />
        </div>
        <div class="card-body">
          <h4 class="card-title">AI 宣传场景图</h4>
          <p class="card-desc">将商品放入精美场景中，生成高转化率的宣传图，适用于 A+ 页面和广告投放</p>
        </div>
        <div class="card-action">
          前往生成 <ArrowRightOutlined />
        </div>
      </div>

      <div class="addon-card" @click="goToPromoVideo">
        <div class="card-badge">增值</div>
        <div class="card-icon promo-video-icon">
          <VideoCameraOutlined />
        </div>
        <div class="card-body">
          <h4 class="card-title">AI 宣传视频</h4>
          <p class="card-desc">基于商品信息自动生成产品展示视频，适用于 Listing 视频和社交媒体推广</p>
        </div>
        <div class="card-action">
          前往生成 <ArrowRightOutlined />
        </div>
      </div>

      <div class="addon-card" @click="goToAPlus">
        <div class="card-badge">增值</div>
        <div class="card-icon aplus-icon">
          <FileTextOutlined />
        </div>
        <div class="card-body">
          <h4 class="card-title">AI A+ 页面</h4>
          <p class="card-desc">基于 Listing 与竞品策略，生成模块化 A+ 文案与配图，符合 Amazon A+ 规范</p>
        </div>
        <div class="card-action">
          前往生成 <ArrowRightOutlined />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { PictureOutlined, VideoCameraOutlined, FileTextOutlined, ArrowRightOutlined } from '@ant-design/icons-vue'

const router = useRouter()

function goToPromoImage() {
  router.push('/tools/scene-generation')
}

function goToPromoVideo() {
  router.push('/workflow/marketing')
}

function goToAPlus() {
  router.push('/tools/aplus-wizard?from=listing')
}
</script>

<style scoped lang="scss">
.addon-services {
  margin-top: 36px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
}

.addon-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.addon-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: -4px 0 0;
}

.addon-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
}

.addon-card {
  position: relative;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px 24px 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 6px 24px rgba(37, 99, 235, 0.12);
    transform: translateY(-2px);
  }
}

.card-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  background: var(--color-primary);
  color: #fff;
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;

  &.promo-image-icon {
    background: var(--color-primary-light);
    color: var(--color-primary);
  }

  &.promo-video-icon {
    background: #fef3c7;
    color: var(--color-warning);
  }

  &.aplus-icon {
    background: #d1fae5;
    color: var(--color-success);
  }
}

.card-body {
  flex: 1;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 6px;
}

.card-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.55;
  margin: 0;
}

.card-action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  padding-top: 12px;
  margin-top: 4px;
  border-top: 1px solid var(--color-border-light);
}
</style>
