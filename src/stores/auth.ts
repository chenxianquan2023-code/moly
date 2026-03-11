import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserPoints, PointTransaction } from '@/types/ai.types';

const STORAGE_KEY = 'omni_gen_auth';
const POINTS_KEY = 'omni_gen_points';
const TRANSACTIONS_KEY = 'omni_gen_transactions';

const defaultPoints = 100;

interface StoredAuth {
  email?: string;
  phone?: string;
  userId?: string;
  displayName?: string;
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadStoredPoints(): number {
  try {
    const pointsRaw = localStorage.getItem(POINTS_KEY);
    return pointsRaw != null ? parseInt(pointsRaw, 10) : defaultPoints;
  } catch {
    return defaultPoints;
  }
}

function loadStoredTransactions(): PointTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const email = ref<string | null>(null);
  const phone = ref<string | null>(null);
  const userId = ref<string | null>(null);
  const userDisplayName = ref<string | null>(null);
  const points = ref<number>(loadStoredPoints());
  const transactions = ref<PointTransaction[]>(loadStoredTransactions());
  const isLoading = ref(false);
  const lastError = ref<string | null>(null);

  // Getters
  const isLoggedIn = computed(() => !!email.value || !!phone.value);
  const displayName = computed(() => userDisplayName.value || email.value || phone.value || '未登录');
  
  const userPoints = computed<UserPoints>(() => ({
    balance: points.value,
    totalUsed: transactions.value
      .filter(t => t.type === 'spend')
      .reduce((sum, t) => sum + t.amount, 0),
    history: transactions.value
  }));

  const canAfford = computed(() => (cost: number) => points.value >= cost);

  // Actions
  function login(by: { email?: string; phone?: string; userId?: string; displayName?: string }) {
    isLoading.value = true;
    lastError.value = null;
    
    try {
      if (by.email) {
        email.value = by.email;
        phone.value = null;
      } else if (by.phone) {
        phone.value = by.phone;
        email.value = null;
      }
      
      if (by.userId) userId.value = by.userId;
      if (by.displayName) userDisplayName.value = by.displayName;
      
      const stored = loadStoredAuth();
      if (stored?.points !== undefined) {
        points.value = stored.points;
      }
      
      save();
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : '登录失败';
      console.error('[AuthStore] Login error:', error);
    } finally {
      isLoading.value = false;
    }
  }

  function logout() {
    email.value = null;
    phone.value = null;
    userId.value = null;
    userDisplayName.value = null;
    save();
  }

  function save() {
    try {
      if (email.value || phone.value) {
        const data: StoredAuth = {
          email: email.value || undefined,
          phone: phone.value || undefined,
          userId: userId.value || undefined,
          displayName: userDisplayName.value || undefined
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      localStorage.setItem(POINTS_KEY, String(points.value));
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions.value));
    } catch (error) {
      console.error('[AuthStore] Save error:', error);
    }
  }

  /** 扣除积分 */
  function deductPoints(amount: number, description: string, taskId?: string): boolean {
    if (points.value < amount) {
      lastError.value = '积分不足';
      return false;
    }
    
    points.value -= amount;
    
    // 记录交易
    const transaction: PointTransaction = {
      id: generateId(),
      type: 'spend',
      amount,
      description,
      timestamp: new Date().toISOString(),
      relatedTaskId: taskId
    };
    
    transactions.value.unshift(transaction);
    
    // 限制历史记录数量
    if (transactions.value.length > 100) {
      transactions.value = transactions.value.slice(0, 100);
    }
    
    save();
    return true;
  }

  /** 充值积分 */
  function addPoints(amount: number, description: string = '充值') {
    points.value += amount;
    
    const transaction: PointTransaction = {
      id: generateId(),
      type: 'earn',
      amount,
      description,
      timestamp: new Date().toISOString()
    };
    
    transactions.value.unshift(transaction);
    save();
  }

  /** 退款 */
  function refundPoints(amount: number, description: string, taskId: string) {
    points.value += amount;
    
    const transaction: PointTransaction = {
      id: generateId(),
      type: 'refund',
      amount,
      description,
      timestamp: new Date().toISOString(),
      relatedTaskId: taskId
    };
    
    transactions.value.unshift(transaction);
    save();
  }

  /** 清除错误 */
  function clearError() {
    lastError.value = null;
  }

  // Helper
  function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 初始化
  const stored = loadStoredAuth();
  if (stored) {
    email.value = stored.email || null;
    phone.value = stored.phone || null;
    userId.value = stored.userId || null;
    userDisplayName.value = stored.displayName || null;
  }

  return {
    // State
    email,
    phone,
    userId,
    points,
    transactions,
    isLoading,
    lastError,
    
    // Getters
    isLoggedIn,
    displayName,
    userPoints,
    canAfford,
    
    // Actions
    login,
    logout,
    deductPoints,
    addPoints,
    refundPoints,
    clearError,
    save
  };
});
