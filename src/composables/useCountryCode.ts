import { ref, computed } from 'vue';
import type { CountryCodeItem } from '@/types/auth.types';

const COUNTRY_LIST: CountryCodeItem[] = [
  { code: 'CN', dial: '+86', name: '中国' },
  { code: 'HK', dial: '+852', name: '中国香港' },
  { code: 'TW', dial: '+886', name: '中国台湾' },
  { code: 'US', dial: '+1', name: '美国' },
  { code: 'GB', dial: '+44', name: '英国' },
  { code: 'JP', dial: '+81', name: '日本' },
  { code: 'KR', dial: '+82', name: '韩国' },
  { code: 'SG', dial: '+65', name: '新加坡' },
  { code: 'MY', dial: '+60', name: '马来西亚' },
  { code: 'AU', dial: '+61', name: '澳大利亚' },
];

export function useCountryCode(initialDial = '+86') {
  const list = ref<CountryCodeItem[]>(COUNTRY_LIST);
  const first = COUNTRY_LIST.find((c) => c.dial === initialDial);
  const fallback = COUNTRY_LIST[0] as CountryCodeItem;
  const selected = ref<CountryCodeItem>(first ?? fallback);
  const search = ref('');

  const filteredList = computed(() => {
    const s = search.value.trim().toLowerCase();
    if (!s) return list.value;
    return list.value.filter(
      (c) =>
        c.dial.includes(s) ||
        c.name.toLowerCase().includes(s) ||
        c.code.toLowerCase().includes(s)
    );
  });

  function select(item: CountryCodeItem) {
    selected.value = item;
  }

  return { list: filteredList, fullList: list, selected, search, select };
}
