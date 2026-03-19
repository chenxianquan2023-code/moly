import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { GeneratedAPlusModule, APlusPromptBlocks, APlusVisualPlanResult, APlusVisualPlanModule } from '@/services/pipeline/types'

export type APlusExportMode = 'copy_only' | 'copy_and_images'

export interface APlusWizardInput {
  productName: string
  rawParams: string
  images: string[]
  targetPersona: string
  brandTone: string
  differentiation: string
  market: string
  language: string
  /** 回填来源提示（只读展示用） */
  prefillSource?: 'listing' | 'userInput' | 'manual'
  /** 防止回填覆盖用户编辑 */
  touched: Partial<Record<keyof Omit<APlusWizardInput, 'touched'>, boolean>>
  updatedAt: string
}

export interface APlusDraftSettings {
  language: string
  market: string
  templateId: string
  moduleCount: number
  generateImages: boolean
  enableSelfCheck: boolean
  aspectRatio: '1:1' | '4:5' | '16:9' | '3:4'
  imageSize: '1K' | '2K' | '4K'
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
const WIZARD_INPUT_STORAGE_KEY = 'moly:aplus:wizardInput:v1'

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

function loadWizardInput(): APlusWizardInput {
  try {
    const raw = localStorage.getItem(WIZARD_INPUT_STORAGE_KEY)
    if (!raw) {
      return {
        productName: '',
        rawParams: '',
        images: [],
        targetPersona: '',
        brandTone: '',
        differentiation: '',
        market: 'us',
        language: 'en',
        prefillSource: 'manual',
        touched: {},
        updatedAt: nowIso(),
      }
    }
    const parsed = JSON.parse(raw) as Partial<APlusWizardInput>
    return {
      productName: parsed.productName ?? '',
      rawParams: parsed.rawParams ?? '',
      images: Array.isArray(parsed.images) ? parsed.images.filter((x) => typeof x === 'string') : [],
      targetPersona: parsed.targetPersona ?? '',
      brandTone: parsed.brandTone ?? '',
      differentiation: parsed.differentiation ?? '',
      market: parsed.market ?? 'us',
      language: parsed.language ?? 'en',
      prefillSource: parsed.prefillSource ?? 'manual',
      touched: (parsed.touched ?? {}) as any,
      updatedAt: parsed.updatedAt ?? nowIso(),
    }
  } catch {
    return {
      productName: '',
      rawParams: '',
      images: [],
      targetPersona: '',
      brandTone: '',
      differentiation: '',
      market: 'us',
      language: 'en',
      prefillSource: 'manual',
      touched: {},
      updatedAt: nowIso(),
    }
  }
}

function saveWizardInput(input: APlusWizardInput) {
  localStorage.setItem(WIZARD_INPUT_STORAGE_KEY, JSON.stringify(input))
}

function revokeBlobUrls(urls: string[]) {
  urls.forEach((url) => {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url)
      } catch {
        /* ignore */
      }
    }
  })
}

const WIZARD_SAVE_DEBOUNCE_MS = 500
let wizardSaveTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSaveWizardInput(getInput: () => APlusWizardInput) {
  if (wizardSaveTimer) clearTimeout(wizardSaveTimer)
  wizardSaveTimer = setTimeout(() => {
    wizardSaveTimer = null
    saveWizardInput(getInput())
  }, WIZARD_SAVE_DEBOUNCE_MS)
}

export const useAPlusStore = defineStore('aplus', () => {
  const drafts = ref<APlusDraft[]>(loadAll())
  const activeDraftId = ref<string>('')
  const wizardInput = ref<APlusWizardInput>(loadWizardInput())
  /** 向导四块式可编辑提示词（中文），由分析结果或用户编辑填充 */
  const promptBlocks = ref<APlusPromptBlocks | null>(null)
  /** 新：视觉营销规划（全局 + 模块） */
  const visualPlan = ref<APlusVisualPlanResult | null>(null)

  const activeDraft = computed(() => drafts.value.find((d) => d.draftId === activeDraftId.value) ?? null)

  function setPromptBlocks(blocks: APlusPromptBlocks | null) {
    promptBlocks.value = blocks
  }

  function setVisualPlan(plan: APlusVisualPlanResult | null) {
    visualPlan.value = plan
  }

  function patchVisualPlanGlobal(patch: Partial<APlusVisualPlanResult['global']>) {
    if (!visualPlan.value) {
      visualPlan.value = {
        global: { commercialTone: '', lightingStyle: '', negativeSpace: '', negativePrompt: '' },
        modules: [],
      }
    }
    visualPlan.value = { ...visualPlan.value, global: { ...visualPlan.value.global, ...patch } }
  }

  function patchVisualPlanModule(index: number, patch: Partial<APlusVisualPlanModule>) {
    if (!visualPlan.value) return
    const next = visualPlan.value.modules.slice()
    const current = next[index]
    if (!current) return
    next[index] = { ...current, ...patch }
    visualPlan.value = { ...visualPlan.value, modules: next }
  }

  function addVisualPlanModule(mod?: Partial<APlusVisualPlanModule>) {
    if (!visualPlan.value) {
      visualPlan.value = {
        global: { commercialTone: '', lightingStyle: '', negativeSpace: '', negativePrompt: '' },
        modules: [],
      }
    }
    if (visualPlan.value.modules.length >= 7) return
    visualPlan.value = {
      ...visualPlan.value,
      modules: [
        ...visualPlan.value.modules,
        {
          moduleName: mod?.moduleName ?? '',
          croLogic: mod?.croLogic ?? '',
          sceneDesc: mod?.sceneDesc ?? '',
          imagePromptEn: mod?.imagePromptEn ?? '',
        },
      ],
    }
  }

  function removeVisualPlanModule(index: number) {
    if (!visualPlan.value) return
    const next = visualPlan.value.modules.slice()
    next.splice(index, 1)
    visualPlan.value = { ...visualPlan.value, modules: next }
  }

  /** 将模块规划数量调整为 targetCount（3~7）；截断或补齐空模块 */
  function resizeVisualPlanModules(targetCount: number) {
    const n = Math.min(7, Math.max(3, targetCount))
    if (!visualPlan.value) {
      visualPlan.value = {
        global: { commercialTone: '', lightingStyle: '', negativeSpace: '', negativePrompt: '' },
        modules: Array.from({ length: n }, () => ({
          moduleName: '',
          croLogic: '',
          sceneDesc: '',
          imagePromptEn: 'Professional product photography, negative space for text overlay, --ar 4:5',
        })),
      }
      return
    }
    const current = visualPlan.value.modules
    if (current.length === n) return
    if (current.length > n) {
      visualPlan.value = { ...visualPlan.value, modules: current.slice(0, n) }
    } else {
      const empty = { moduleName: '', croLogic: '', sceneDesc: '', imagePromptEn: 'Professional product photography, negative space for text overlay, --ar 4:5' }
      visualPlan.value = {
        ...visualPlan.value,
        modules: [...current, ...Array.from({ length: n - current.length }, () => ({ ...empty }))],
      }
    }
  }

  function updatePromptBlock<K extends keyof APlusPromptBlocks>(key: K, value: string) {
    if (!promptBlocks.value) {
      promptBlocks.value = {
        colorPlanning: '',
        lightShadow: '',
        featureStructure: '',
        marketingNarrative: '',
        narrativeStrategy: '',
      }
    }
    promptBlocks.value = { ...promptBlocks.value, [key]: value }
  }

  function updateWizardInput(patch: Partial<Omit<APlusWizardInput, 'touched'>>) {
    wizardInput.value = {
      ...wizardInput.value,
      ...patch,
      updatedAt: nowIso(),
    }
    debouncedSaveWizardInput(() => wizardInput.value)
  }

  function touchWizardField(field: keyof Omit<APlusWizardInput, 'touched'>) {
    wizardInput.value = {
      ...wizardInput.value,
      touched: { ...wizardInput.value.touched, [field]: true },
      updatedAt: nowIso(),
    }
    debouncedSaveWizardInput(() => wizardInput.value)
  }

  function resetWizardInput(patch?: Partial<Omit<APlusWizardInput, 'touched'>>) {
    revokeBlobUrls(wizardInput.value.images ?? [])
    wizardInput.value = {
      productName: '',
      rawParams: '',
      images: [],
      targetPersona: '',
      brandTone: '',
      differentiation: '',
      market: patch?.market ?? wizardInput.value.market ?? 'us',
      language: patch?.language ?? wizardInput.value.language ?? 'en',
      prefillSource: patch?.prefillSource ?? 'manual',
      touched: {},
      updatedAt: nowIso(),
      ...patch,
    }
    saveWizardInput(wizardInput.value)
  }

  function prefillWizardInput(payload: {
    listingTitle?: string
    listingBullets?: string[]
    listingDescription?: string
    listingSearchTerms?: string[]
    inferredTargetPersona?: string
    listingStoreProductName?: string
    listingStoreSpecs?: string
    listingStoreFeatures?: string
    listingStoreDifferentiators?: string
    listingStoreTargetAudience?: string
    listingStoreUseCases?: string
    /** 智能识别：Listing 分析提取的关键词，并入 rawParams */
    listingStoreKeywords?: string[]
    market?: string
    language?: string
    images?: string[]
    /** Listing 生成的主图，拼接到 images 首位 */
    mainImageUrl?: string
    /** 市场洞察：竞品不足 */
    competitorWeaknesses?: string[]
    /** 市场洞察：差异化机会 */
    differentiationSuggestions?: string[]
    source: 'listing' | 'userInput'
  }) {
    const next: Partial<Omit<APlusWizardInput, 'touched'>> = {
      prefillSource: payload.source,
      market: payload.market ?? wizardInput.value.market,
      language: payload.language ?? wizardInput.value.language,
    }

    if (!wizardInput.value.touched.productName) {
      next.productName = (payload.listingTitle || payload.listingStoreProductName || wizardInput.value.productName || '').trim()
    }

    if (!wizardInput.value.touched.rawParams) {
      const blocks: string[] = []
      const title = (payload.listingTitle ?? '').trim()
      if (title) {
        blocks.push(`【标题】\n${title}`)
      }
      const bullets = (payload.listingBullets ?? []).filter(Boolean)
      if (bullets.length) {
        blocks.push(`【五点】\n${bullets.map((b, i) => `${i + 1}. ${String(b).trim()}`).join('\n')}`)
      }
      const desc = (payload.listingDescription ?? '').trim()
      if (desc) blocks.push(`【描述】\n${desc}`)
      const search = (payload.listingSearchTerms ?? []).filter(Boolean)
      if (search.length) blocks.push(`【Search Terms】\n${search.join(', ')}`)
      const fromInputs = [
        payload.listingStoreSpecs ? `【原始规格】\n${payload.listingStoreSpecs}` : '',
        payload.listingStoreFeatures ? `【补充说明】\n${payload.listingStoreFeatures}` : '',
        payload.listingStoreDifferentiators ? `【差异化】\n${payload.listingStoreDifferentiators}` : '',
        payload.listingStoreUseCases ? `【使用场景】\n${payload.listingStoreUseCases}` : '',
      ]
        .filter(Boolean)
        .join('\n\n')
      if (fromInputs) blocks.push(fromInputs)
      const keywords = (payload.listingStoreKeywords ?? []).filter(Boolean)
      if (keywords.length) {
        blocks.push(`【AI 提取关键词】\n${keywords.slice(0, 12).join(', ')}`)
      }

      next.rawParams = blocks.join('\n\n').trim()
    }

    if (!wizardInput.value.touched.targetPersona) {
      const inferred = (payload.inferredTargetPersona || payload.listingStoreTargetAudience || '').trim()
      if (inferred) next.targetPersona = inferred
    }

    if (!wizardInput.value.touched.differentiation) {
      const weaknesses = (payload.competitorWeaknesses ?? []).filter(Boolean)
      const suggestions = (payload.differentiationSuggestions ?? []).filter(Boolean)
      if (weaknesses.length || suggestions.length) {
        const parts: string[] = []
        if (weaknesses.length) {
          parts.push(`【竞品不足】\n${weaknesses.map((w) => `- ${String(w).trim()}`).join('\n')}`)
        }
        if (suggestions.length) {
          parts.push(`【差异化机会】\n${suggestions.map((s) => `- ${String(s).trim()}`).join('\n')}`)
        }
        next.differentiation = parts.join('\n\n')
      } else {
        const diff = (payload.listingStoreDifferentiators || '').trim()
        if (diff) next.differentiation = diff
      }
    }

    if (!wizardInput.value.touched.images) {
      const productImages = (payload.images ?? []).filter(Boolean)
      const combined = payload.mainImageUrl
        ? [payload.mainImageUrl, ...productImages].filter(Boolean).slice(0, 5)
        : productImages.slice(0, 5)
      if (combined.length) next.images = combined
    }

    updateWizardInput(next)
  }

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
        aspectRatio: '4:5',
        imageSize: '2K',
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

  function patchModuleImageByIndex(index: number, imageUrl: string) {
    const d = activeDraft.value
    if (!d || !d.modules[index]) return
    const next = d.modules.slice()
    next[index] = { ...next[index], imageUrl }
    upsertDraft({ ...d, modules: next })
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
    wizardInput,
    promptBlocks,
    setPromptBlocks,
    updatePromptBlock,
    visualPlan,
    setVisualPlan,
    patchVisualPlanGlobal,
    patchVisualPlanModule,
    addVisualPlanModule,
    removeVisualPlanModule,
    resizeVisualPlanModules,

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
    patchModuleImageByIndex,
    refreshFromStorage,
    ensureActiveDraft,

    updateWizardInput,
    touchWizardField,
    resetWizardInput,
    prefillWizardInput,
  }
})

