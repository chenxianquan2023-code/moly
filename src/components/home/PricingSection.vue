<template>
  <section class="pricing">
    <div class="pr-head">
      <span class="pr-kicker">MOLY · 积分充值</span>
      <h2>越大越划算 · <span class="hl">充值方案</span></h2>
      <p class="pr-sub">爆款视频一键复刻 · 9:16 竖屏成片</p>
      <div class="pr-rate">牌价 <b>1 元 = 10 积分</b> · 充得越多，每积分越便宜</div>
    </div>

    <div class="pr-grid">
      <div v-for="p in cards" :key="p.id" class="pr-card" :class="{ hot: p.popular }">
        <div v-if="p.popular" class="pr-badge">★ 最多人选 · 最划算</div>
        <div class="pr-name">{{ p.label }}</div>
        <div class="pr-tag">{{ p.tag }}</div>
        <div class="pr-price"><em>¥</em>{{ p.priceYuan }}</div>
        <div v-if="p.originalYuan" class="pr-orig">原价 ¥{{ p.originalYuan }}</div>
        <div v-if="p.save >= 1" class="pr-save">省 ¥{{ p.save }}</div>

        <div class="pr-credits">
          <b>{{ p.total.toLocaleString() }}</b> 积分
          <span v-if="p.bonus" class="pr-bonus">含赠送 +{{ p.bonus }}</span>
          <span v-else class="pr-bonus none">无赠送</span>
        </div>
        <div class="pr-unit">单价 <b>¥{{ p.unit }}</b> / 积分</div>

        <div class="pr-est">
          <span class="pr-est-h">约可生成</span>
          <div class="pr-est-row"><span>短 8秒</span><b :class="{ z: p.v8 === 0 }">{{ p.v8 }} 条</b></div>
          <div class="pr-est-row"><span>标准 12秒</span><b :class="{ z: p.v12 === 0 }">{{ p.v12 }} 条</b></div>
          <div class="pr-est-row"><span>长 18秒</span><b :class="{ z: p.v18 === 0 }">{{ p.v18 }} 条</b></div>
        </div>

        <router-link to="/studio" class="pr-btn">去充值</router-link>
      </div>
    </div>

    <p class="pr-foot"><b>条数为整条向下取整</b> · 可混搭不同时长按实际积分扣除 · 出 2 版供挑 = 积分翻倍、条数减半</p>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// 单条成本(积分)：基础20 + Seedance 20/秒 × 秒数。与后端 pricing 一致。
const COST = { v8: 180, v12: 260, v18: 380 };
const FALLBACK = [
  { id: 'starter', label: '体验包', tag: '先试一条', credits: 200, bonus: 0, priceYuan: 19.9, originalYuan: 20 },
  { id: 'basic', label: '创作包', tag: '日常够用', credits: 690, bonus: 110, priceYuan: 69, originalYuan: 80 },
  { id: 'pro', label: '热门包', tag: '单价跳水最猛', credits: 1990, bonus: 610, priceYuan: 199, originalYuan: 260, popular: true },
  { id: 'flagship', label: '旗舰包', tag: '批量产出', credits: 4990, bonus: 2010, priceYuan: 499, originalYuan: 700 },
];
const raw = ref<any[]>(FALLBACK);

const cards = computed(() => raw.value.map((p) => {
  const total = (p.credits || 0) + (p.bonus || 0);
  return {
    ...p,
    total,
    save: p.originalYuan ? Math.round((p.originalYuan - p.priceYuan) * 100) / 100 : 0,
    unit: total ? (p.priceYuan / total).toFixed(3) : '0',
    v8: Math.floor(total / COST.v8),
    v12: Math.floor(total / COST.v12),
    v18: Math.floor(total / COST.v18),
  };
}));

onMounted(async () => {
  try {
    const j = await (await fetch('/api/replica/pricing')).json();
    if (j.success && Array.isArray(j.packages) && j.packages.length) raw.value = j.packages;
  } catch { /* 用兜底 */ }
});
</script>

<style scoped lang="scss">
.pricing { max-width: 1180px; margin: 0 auto; padding: 72px 24px; }
.pr-head { text-align: center; margin-bottom: 36px; }
.pr-kicker { font-size: 13px; font-weight: 800; letter-spacing: 2px; color: #2563eb; }
.pr-head h2 { font-size: 36px; font-weight: 900; color: #0f172a; margin: 12px 0 0; .hl { color: #2563eb; } }
.pr-sub { font-size: 15px; color: #64748b; margin: 10px 0 0; }
.pr-rate { display: inline-block; margin-top: 18px; padding: 9px 20px; border-radius: 999px; background: #fff; border: 1px solid #e2e8f0; font-size: 14px; color: #475569; box-shadow: 0 10px 26px -20px rgba(15,23,42,.4); b { color: #0f172a; } }

.pr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; align-items: start; }
.pr-card { position: relative; background: #fff; border: 1px solid #eef2f7; border-radius: 22px; padding: 30px 24px 26px; text-align: center; box-shadow: 0 24px 50px -40px rgba(15,23,42,.5); transition: transform .2s ease, box-shadow .2s ease; }
.pr-card:hover { transform: translateY(-4px); box-shadow: 0 30px 60px -38px rgba(37,99,235,.45); }
.pr-card.hot { border: 2px solid #4f46e5; box-shadow: 0 30px 60px -34px rgba(79,70,229,.5); }
.pr-badge { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: linear-gradient(135deg,#6366f1,#4f46e5); color: #fff; font-size: 13px; font-weight: 800; padding: 7px 18px; border-radius: 999px; box-shadow: 0 10px 22px -10px rgba(79,70,229,.6); }
.pr-name { font-size: 19px; font-weight: 800; color: #0f172a; }
.pr-tag { font-size: 13px; color: #94a3b8; margin-top: 4px; }
.pr-price { font-size: 52px; font-weight: 900; color: #0f172a; line-height: 1.1; margin-top: 16px; em { font-style: normal; font-size: 26px; font-weight: 800; vertical-align: super; margin-right: 2px; } }
.pr-card.hot .pr-price { color: #4f46e5; }
.pr-orig { font-size: 13px; color: #cbd5e1; text-decoration: line-through; margin-top: 4px; }
.pr-save { display: inline-block; margin-top: 10px; font-size: 13px; font-weight: 700; color: #dc2626; background: #fef2f2; padding: 3px 12px; border-radius: 999px; }
.pr-credits { margin-top: 18px; padding: 16px 8px; border-radius: 14px; background: #eef2ff; b { font-size: 26px; font-weight: 900; color: #2563eb; } }
.pr-bonus { display: block; margin-top: 4px; font-size: 12px; font-weight: 700; color: #4f46e5; &.none { color: #94a3b8; font-weight: 600; } }
.pr-unit { margin-top: 14px; font-size: 13px; color: #475569; b { color: #16a34a; font-weight: 800; } }
.pr-est { margin-top: 16px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
.pr-est-h { font-size: 13px; color: #94a3b8; }
.pr-est-row { display: flex; justify-content: space-between; align-items: center; margin-top: 11px; font-size: 14px; color: #475569; b { color: #16a34a; font-weight: 800; &.z { color: #cbd5e1; } } }
.pr-btn { display: block; margin-top: 22px; padding: 12px; border-radius: 12px; background: #f1f5f9; color: #334155; font-weight: 700; font-size: 14px; text-decoration: none; transition: all .18s ease; &:hover { background: #2563eb; color: #fff; } }
.pr-card.hot .pr-btn { background: linear-gradient(135deg,#2563eb,#4f46e5); color: #fff; }
.pr-foot { text-align: center; margin-top: 30px; font-size: 13px; color: #94a3b8; b { color: #64748b; } }

@media (max-width: 900px) {
  .pr-grid { grid-template-columns: repeat(2, 1fr); }
  .pr-head h2 { font-size: 28px; }
}
@media (max-width: 520px) {
  .pr-grid { grid-template-columns: 1fr; }
}
</style>
