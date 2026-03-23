import { ref, onMounted } from 'vue';
import type { RegionMode } from '@/types/auth.types';

const CACHE_KEY = 'omni_region';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function useRegion() {
  const mode = ref<RegionMode>('overseas');
  const loading = ref(true);

  onMounted(async () => {
    // 检查 URL 参数（用于测试）
    const urlParams = new URLSearchParams(window.location.search);
    const forceRegion = urlParams.get('region');
    if (forceRegion === 'cn' || forceRegion === 'overseas') {
      mode.value = forceRegion;
      loading.value = false;
      return;
    }

    // 检查缓存
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { value, at } = JSON.parse(cached);
        if (Date.now() - at < CACHE_TTL_MS && (value === 'cn' || value === 'overseas')) {
          mode.value = value;
          loading.value = false;
          return;
        }
      } catch (_) {}
    }

    // 方法1: 通过时区检测（无需网络）
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const chinaTimezones = [
        'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Taipei', 
        'Asia/Macau', 'Asia/Urumqi'
      ];
      if (chinaTimezones.includes(timeZone)) {
        mode.value = 'cn';
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value: mode.value, at: Date.now() }));
        loading.value = false;
        return;
      }
    } catch (_) {}

    // 方法2: 通过语言检测
    try {
      const lang = navigator.language || (navigator as any).browserLanguage || '';
      if (lang.toLowerCase() === 'zh-cn') {
        mode.value = 'cn';
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value: mode.value, at: Date.now() }));
        loading.value = false;
        return;
      }
    } catch (_) {}

    // 方法3: 通过 IP API 检测
    try {
      const res = await fetch('https://ipapi.co/json/', { 
        signal: AbortSignal.timeout(3000) // 3秒超时
      });
      const data = await res.json();
      const countryCode = (data.country_code || '').toUpperCase();
      mode.value = countryCode === 'CN' || countryCode === 'TW' || countryCode === 'HK' ? 'cn' : 'overseas';
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value: mode.value, at: Date.now() }));
    } catch (_) {
      // 如果都失败了，默认根据时区猜测
      const offset = new Date().getTimezoneOffset();
      // 北京时间是 UTC+8，offset 是 -480
      mode.value = offset === -480 ? 'cn' : 'overseas';
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value: mode.value, at: Date.now() }));
    } finally {
      loading.value = false;
    }
  });

  return { mode, loading };
}

// 手动设置地区（用于调试）
export function setRegion(mode: RegionMode) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value: mode, at: Date.now() }));
  window.location.reload();
}

// 清除地区缓存
export function clearRegionCache() {
  sessionStorage.removeItem(CACHE_KEY);
}
