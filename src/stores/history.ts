import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const STORAGE_KEY = 'moly_history';

export interface HistoryRecord {
  id: string;
  toolId: string;
  toolName: string;
  resultUrl: string;
  createdAt: string;
}

function load(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useHistoryStore = defineStore('history', () => {
  const records = ref<HistoryRecord[]>(load());

  const sortedRecords = computed(() =>
    [...records.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  );

  function addRecord(toolId: string, toolName: string, resultUrl: string): HistoryRecord {
    const record: HistoryRecord = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      toolId,
      toolName,
      resultUrl,
      createdAt: new Date().toISOString(),
    };
    records.value.unshift(record);
    save();
    return record;
  }

  function removeRecords(ids: string[]) {
    const set = new Set(ids);
    records.value = records.value.filter((r) => !set.has(r.id));
    save();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value));
    } catch {}
  }

  return { records, sortedRecords, addRecord, removeRecords };
});
