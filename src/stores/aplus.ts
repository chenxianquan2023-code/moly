import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { GeneratedAPlusModule } from '@/services/pipeline/types'

export type APlusExportMode = 'copy_only' | 'copy_and_images'

export interface APlusDraftSettings {
  language: string
  market: string
  templateId: string
  moduleCount: number
  generateImages: boolean
  enableSelfCheck: boolean
  exportMode: APlusExportMode
}

export interface APlusDraftModule extends GeneratedAPlusModule {
  id: string
  locked?: {
    headline?: boolean
    body?: boolean
    image?: boolean
  }
  meta?: {
    lastGeneratedAt?: string
    lastError?: string
  }
}

export interface APlusDraft {
  draftId: string
  name: string
  createdAt: string
  updatedAt: string
  contextFingerprint: string
  settings: APlusDraftSettings
  userEditablePrompt: string
  modules: APlusDraftModule[]
  version: number
}

const STORAGE_KEY = 'moly:aplus:drafts:v1'

function nowIso() {
  return new Date().toISOString()
}

function uid(prefix = 'aplus') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',')}}`
}

function fastHash(input: string): string {
  // FNV-1a 32-bit
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

function computeContextFingerprint(payload: unknown): string {
  return fastHash(stableStringify(payload))
}

function loadAll(): APlusDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as APlusDraft[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveAll(list: APlusDraft[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export const useAPlusStore = defineStore('aplus', () => {
  const drafts = ref<APlusDraft[]>(loadAll())
  const activeDraftId = ref<string>('')

  const activeDraft = computed(() => drafts.value.find((d) => d.draftId === activeDraftId.value) ?? null)

  function ensureActiveDraft() {
    if (!activeDraftId.value && drafts.value.length) {
      activeDraftId.value = drafts.value[0].draftId
    }
  }

  function listDrafts() {
    return drafts.value.slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  }

  function createDraft(args: {
    name?: string
    contextFingerprint: string
    language: string
    market: string
    defaultPrompt: string
  }): APlusDraft {
    const d: APlusDraft = {
      draftId: uid('aplus_draft'),
      name: args.name ?? 'A+ 草稿',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      contextFingerprint: args.contextFingerprint,
      version: 1,
      userEditablePrompt: args.defaultPrompt,
      settings: {
        language: args.language,
        market: args.market,
        templateId: 'default',
        moduleCount: 5,
        generateImages: true,
        enableSelfCheck: true,
        exportMode: 'copy_and_images',
      },
      modules: [],
    }
    drafts.value = [d, ...drafts.value]
    activeDraftId.value = d.draftId
    saveAll(drafts.value)
    return d
  }

  function upsertDraft(next: APlusDraft) {
    const idx = drafts.value.findIndex((d) => d.draftId === next.draftId)
    const updated: APlusDraft = { ...next, updatedAt: nowIso() }
    if (idx >= 0) {
      const copy = drafts.value.slice()
      copy[idx] = updated
      drafts.value = copy
    } else {
      drafts.value = [updated, ...drafts.value]
    }
    saveAll(drafts.value)
  }

  function bumpVersion(draftId: string) {
    const d = drafts.value.find((x) => x.draftId === draftId)
    if (!d) return
    upsertDraft({ ...d, version: (d.version ?? 1) + 1 })
  }

  function setActiveDraft(draftId: string) {
    activeDraftId.value = draftId
  }

  function deleteDraft(draftId: string) {
    drafts.value = drafts.value.filter((d) => d.draftId !== draftId)
    if (activeDraftId.value === draftId) {
      activeDraftId.value = drafts.value[0]?.draftId ?? ''
    }
    saveAll(drafts.value)
  }

  function setDraftName(name: string) {
    const d = activeDraft.value
    if (!d) return
    upsertDraft({ ...d, name })
  }

  function setUserEditablePrompt(prompt: string) {
    const d = activeDraft.value
    if (!d) return
    upsertDraft({ ...d, userEditablePrompt: prompt })
  }

  function patchSettings(patch: Partial<APlusDraftSettings>) {
    const d = activeDraft.value
    if (!d) return
    upsertDraft({ ...d, settings: { ...d.settings, ...patch } })
  }

  function setModules(modules: APlusDraftModule[]) {
    const d = activeDraft.value
    if (!d) return
    upsertDraft({ ...d, modules })
  }

  function addModule(partial?: Partial<APlusDraftModule>) {
    const d = activeDraft.value
    if (!d) return
    const m: APlusDraftModule = {
      id: uid('aplus_mod'),
      type: partial?.type ?? '功能展示',
      headline: partial?.headline ?? '',
      body: partial?.body ?? '',
      imagePrompt: partial?.imagePrompt,
      imageUrl: partial?.imageUrl,
      locked: partial?.locked ?? {},
      meta: partial?.meta ?? {},
    }
    upsertDraft({ ...d, modules: [...d.modules, m] })
  }

  function updateModule(moduleId: string, patch: Partial<APlusDraftModule>) {
    const d = activeDraft.value
    if (!d) return
    const next = d.modules.map((m) => (m.id === moduleId ? { ...m, ...patch } : m))
    upsertDraft({ ...d, modules: next })
  }

  function deleteModule(moduleId: string) {
    const d = activeDraft.value
    if (!d) return
    upsertDraft({ ...d, modules: d.modules.filter((m) => m.id !== moduleId) })
  }

  function reorderModules(fromIndex: number, toIndex: number) {
    const d = activeDraft.value
    if (!d) return
    const arr = d.modules.slice()
    const [m] = arr.splice(fromIndex, 1)
    arr.splice(toIndex, 0, m)
    upsertDraft({ ...d, modules: arr })
  }

  function attachGenerationResult(modules: GeneratedAPlusModule[]) {
    const d = activeDraft.value
    if (!d) return
    const mapped: APlusDraftModule[] = modules.map((m) => ({
      id: uid('aplus_mod'),
      ...m,
      locked: {},
      meta: { lastGeneratedAt: nowIso() },
    }))
    upsertDraft({ ...d, modules: mapped })
    bumpVersion(d.draftId)
  }

  function refreshFromStorage() {
    drafts.value = loadAll()
    ensureActiveDraft()
  }

  return {
    drafts,
    activeDraftId,
    activeDraft,

    computeContextFingerprint,
    listDrafts,
    createDraft,
    upsertDraft,
    bumpVersion,
    setActiveDraft,
    deleteDraft,
    setDraftName,
    setUserEditablePrompt,
    patchSettings,
    setModules,
    addModule,
    updateModule,
    deleteModule,
    reorderModules,
    attachGenerationResult,
    refreshFromStorage,
    ensureActiveDraft,
  }
})

