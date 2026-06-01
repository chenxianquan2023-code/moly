import { defineStore } from 'pinia';
import { ref } from 'vue';

/** 全局 UI 状态：充值弹窗(被侧边栏与工作台共用)、带入复刻的预填素材 */
export const useUiStore = defineStore('ui', () => {
  const showRecharge = ref(false);
  const rechargeMsg = ref('');
  function openRecharge(msg = '') { rechargeMsg.value = msg; showRecharge.value = true; }
  function closeRecharge() { showRecharge.value = false; rechargeMsg.value = ''; }
  return { showRecharge, rechargeMsg, openRecharge, closeRecharge };
});
