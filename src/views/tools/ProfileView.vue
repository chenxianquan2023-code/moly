<template>
  <div class="profile-view">
    <div class="page-header">
      <h1>个人中心</h1>
    </div>

    <!-- 用户信息 + 积分卡片 -->
    <div class="cards-row">
      <div class="card user-card">
        <div class="avatar">{{ avatarChar }}</div>
        <div class="user-meta">
          <div class="user-name">{{ auth.displayName }}</div>
          <div class="user-email">{{ auth.email }}</div>
        </div>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>

      <div class="card points-card">
        <div class="points-label">剩余积分</div>
        <div class="points-value">{{ auth.points }}</div>
        <div class="points-stats">
          <span>已消耗 {{ totalUsed }} 积分</span>
        </div>
        <router-link to="/tools/recharge" class="recharge-btn">充值积分</router-link>
      </div>
    </div>

    <!-- 消费记录 -->
    <div class="card transactions-card">
      <div class="section-title">积分记录</div>
      <div v-if="auth.transactions.length === 0" class="empty">暂无记录</div>
      <div v-else class="tx-list">
        <div v-for="tx in auth.transactions.slice(0, 30)" :key="tx.id" class="tx-item">
          <div class="tx-desc">{{ tx.description }}</div>
          <div class="tx-time">{{ formatTime(tx.timestamp) }}</div>
          <div class="tx-amount" :class="tx.type === 'spend' ? 'minus' : 'plus'">
            {{ tx.type === 'spend' ? '-' : '+' }}{{ tx.amount }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const avatarChar = computed(() => (auth.email || auth.displayName || 'U')[0].toUpperCase());

const totalUsed = computed(() =>
  auth.transactions.filter(t => t.type === 'spend').reduce((s, t) => s + t.amount, 0)
);

function formatTime(ts: string) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>

<style scoped lang="scss">
.profile-view {
  max-width: 720px;
}

.page-header {
  margin-bottom: 24px;
  h1 {
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }
}

.cards-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}

.user-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3B82F6, #2563EB);
    color: #fff;
    font-size: 20px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }

  .user-name {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .user-email {
    font-size: 13px;
    color: #6b7280;
  }

  .logout-btn {
    margin-top: auto;
    padding: 6px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    color: #6b7280;
    font-size: 13px;
    cursor: pointer;
    &:hover { background: #f9fafb; color: #ef4444; border-color: #fca5a5; }
  }
}

.points-card {
  display: flex;
  flex-direction: column;

  .points-label {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 8px;
  }

  .points-value {
    font-size: 40px;
    font-weight: 800;
    color: #2563eb;
    line-height: 1;
    margin-bottom: 8px;
  }

  .points-stats {
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 16px;
  }

  .recharge-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 20px;
    background: #2563eb;
    color: #fff !important;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    width: fit-content;
    &:hover { background: #1d4ed8; }
  }
}

.transactions-card {
  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 16px;
  }

  .empty {
    text-align: center;
    color: #9ca3af;
    padding: 32px 0;
    font-size: 14px;
  }

  .tx-list {
    display: flex;
    flex-direction: column;
  }

  .tx-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;
    gap: 12px;
    &:last-child { border-bottom: none; }

    .tx-desc {
      flex: 1;
      font-size: 14px;
      color: #374151;
    }

    .tx-time {
      font-size: 12px;
      color: #9ca3af;
      white-space: nowrap;
    }

    .tx-amount {
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
      &.minus { color: #ef4444; }
      &.plus { color: #22c55e; }
    }
  }
}
</style>
