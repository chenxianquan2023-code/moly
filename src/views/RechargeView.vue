<template>
  <div class="recharge-view">
    <div class="recharge-card">
      <h1 class="title">积分充值</h1>
      <p class="subtitle">当前余额：<strong>{{ auth.points }}</strong> 积分</p>
      <div class="plans">
        <div class="plan">
          <span class="plan-name">100 积分</span>
          <span class="plan-price">演示免费</span>
          <button class="plan-btn" @click="addPoints(100)">领取</button>
        </div>
        <div class="plan">
          <span class="plan-name">500 积分</span>
          <span class="plan-price">演示免费</span>
          <button class="plan-btn" @click="addPoints(500)">领取</button>
        </div>
      </div>
      <p class="hint">正式环境可接入微信/支付宝等支付方式</p>
      <router-link to="/workflow/try-on" class="back-link">返回工作流</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';

const auth = useAuthStore();

function addPoints(amount: number) {
  auth.addPoints(amount);
  message.success(`已领取 ${amount} 积分`);
}
</script>

<style scoped lang="scss">
.recharge-view {
  min-height: 100vh;
  padding: 24px;
  background: #f5f6f8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recharge-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px;
  color: #1a1a1a;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  .title {
    font-size: 20px;
    margin: 0 0 8px 0;
  }

  .subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 24px 0;
  }

  .plans {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .plan {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #f9fafb;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
  }

  .plan-name {
    font-weight: 500;
  }

  .plan-price {
    font-size: 13px;
    color: #6b7280;
  }

  .plan-btn {
    padding: 6px 16px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
  }
  .plan-btn:hover {
    background: #1d4ed8;
  }

  .hint {
    font-size: 12px;
    color: #6b7280;
    margin: 0 0 20px 0;
  }

  .back-link {
    display: inline-block;
    color: #1677ff;
    font-size: 14px;
    text-decoration: none;
  }
  .back-link:hover {
    text-decoration: underline;
  }
}
</style>
