<template>
  <div class="aplus-workbench">
    <header class="tool-header">
      <div class="header-inner">
        <div class="breadcrumb">
          <router-link to="/tools">AI 工具</router-link>
          <RightOutlined class="crumb-icon" />
          <router-link to="/tools/listing">一键生成 Listing</router-link>
          <RightOutlined class="crumb-icon" />
          <span>A+ 工作台</span>
        </div>
        <div class="header-right">
          <span class="points"><ThunderboltFilled /> {{ auth.points }} 积分</span>
          <span v-if="draft" class="draft-meta">
            <strong>{{ draft.name }}</strong>
            <span class="muted">v{{ draft.version }}</span>
          </span>
          <router-link to="/recharge" class="recharge-link">充值</router-link>
        </div>
      </div>
    </header>

    <main class="tool-main">
      <!-- 无上下文：提示先完成 Listing -->
      <div v-if="!hasContext" class="empty-state">
        <div class="empty-icon"><FileTextOutlined /></div>
        <h3 class="empty-title">请先完成 Listing 生成</h3>
        <p class="empty-desc">A+ 页面需要基于已生成的 Listing 和竞品分析策略，请先在「一键生成 Listing」中完成商品信息、市场洞察和 AI 生成。</p>
        <router-link to="/tools/listing" class="empty-btn">前往 Listing</router-link>
      </div>

      <!-- 有上下文：A+ 工作台 -->
      <template v-else>
        <div class="workbench-layout">
          <!-- 左侧：策略与约束 -->
          <aside class="panel left">
            <div class="panel-title-row">
              <h3 class="panel-title">策略与约束</h3>
              <button class="ghost-btn" @click="resetDraftFromContext">重置草稿</button>
            </div>

            <div class="field">
              <label>草稿名称</label>
              <input v-model="draftName" class="text-input" placeholder="例如：US站点 A+ v1" />
            </div>

            <div class="grid-2">
              <div class="field">
                <label>语言</label>
                <input v-model="settings.language" class="text-input" placeholder="en / zh / ..." />
              </div>
              <div class="field">
                <label>市场</label>
                <input v-model="settings.market" class="text-input" placeholder="us / uk / de / ..." />
              </div>
            </div>

            <div class="grid-2">
              <div class="field">
                <label>模块数量</label>
                <input v-model.number="settings.moduleCount" type="number" min="3" max="7" class="text-input" />
              </div>
              <div class="field checkbox">
                <label>
                  <input v-model="settings.generateImages" type="checkbox" />
                  生成配图
                </label>
              </div>
            </div>

            <div class="field">
              <label>模板</label>
              <select v-model="settings.templateId" class="text-input">
                <option value="default">默认（最佳实践）</option>
                <option value="brand_story_first">品牌故事优先</option>
                <option value="feature_first">功能卖点优先</option>
                <option value="comparison_focus">对比强化</option>
              </select>
              <div class="hint">模板会影响模块顺序与写作重心（仍以你的提示词为最高优先级）。</div>
            </div>

            <div class="field checkbox">
              <label>
                <input v-model="settings.enableSelfCheck" type="checkbox" />
                生成后自检（避免虚构）
              </label>
            </div>

            <div class="field">
              <label>A+ 生成提示词（可编辑）</label>
              <textarea
                v-model="editablePrompt"
                class="prompt-textarea"
                rows="8"
                placeholder="编辑策略提示词：风格、结构、禁用词、卖点排序等…"
              />
              <div class="hint">提示词将与竞品策略/分析一起作为生成约束（以此处为最高优先级）。</div>
            </div>

            <div class="section">
              <div class="section-label-row">
                <span class="section-label">上下文健康度</span>
                <span class="badge" :class="{ ok: contextHealth.ok }">{{ contextHealth.ok ? 'OK' : '缺项' }}</span>
              </div>
              <ul class="health-list">
                <li :class="{ ok: contextHealth.hasStrategy }">策略提示词</li>
                <li :class="{ ok: contextHealth.hasAnalysis }">分析报告</li>
                <li :class="{ ok: contextHealth.hasListing }">已生成 Listing</li>
                <li :class="{ ok: contextHealth.hasImages }">参考图片（用于配图）</li>
              </ul>
            </div>

            <div class="section context-summary">
              <div class="section-label-row">
                <span class="section-label">事实源（只读）</span>
                <button class="ghost-btn" @click="copyFacts">复制事实源</button>
              </div>
              <div class="context-card">
                <div class="context-row"><strong>标题：</strong>{{ store.generatedListing?.title }}</div>
                <div class="context-row"><strong>品牌：</strong>{{ productBrand }}</div>
                <div class="context-row"><strong>类目：</strong>{{ productCategory }}</div>
                <div class="context-row"><strong>核心卖点（前 3 条）：</strong></div>
                <ul class="context-bullets">
                  <li v-for="(bp, i) in (store.generatedListing?.bulletPoints?.slice(0, 3) ?? [])" :key="i">{{ bp }}</li>
                </ul>
              </div>
            </div>
          </aside>

          <!-- 中间：模块画布 -->
          <section class="panel center">
            <div class="panel-title-row">
              <h3 class="panel-title">模块画布</h3>
              <div class="actions">
                <button class="primary-btn" :disabled="isGenerating" @click="generateFull">
                  <ExperimentOutlined v-if="!isGenerating" />
                  <LoadingOutlined v-else class="spin" />
                  {{ isGenerating ? progressMessage : '整页生成' }}
                </button>
                <button class="ghost-btn" @click="addEmptyModule">新增模块</button>
                <button class="ghost-btn" @click="copyWholePage">复制整页</button>
              </div>
            </div>

            <div v-if="isGenerating" class="progress-row">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progress + '%' }" />
              </div>
              <div class="progress-msg">{{ progressMessage }}</div>
            </div>

            <div v-if="!draft?.modules?.length" class="empty-canvas">
              <p>暂无模块。你可以点击“整页生成”，或先“新增模块”再按模块重写/配图。</p>
            </div>

            <div v-else class="module-list">
              <div
                v-for="(mod, idx) in draft.modules"
                :key="mod.id"
                class="module-card"
                draggable="true"
                @dragstart="onDragStart(idx)"
                @dragover.prevent
                @drop="onDrop(idx)"
              >
                <div class="module-header">
                  <span class="module-type">{{ mod.type }}</span>
                  <div class="module-actions">
                    <button class="chip-btn" @click="toggleLock(mod.id, 'headline')">锁标题</button>
                    <button class="chip-btn" @click="toggleLock(mod.id, 'body')">锁正文</button>
                    <button class="chip-btn" @click="toggleLock(mod.id, 'image')">锁图片</button>
                    <button class="chip-btn" @click="copyModule(mod)"><CopyOutlined /> 复制</button>
                    <button class="chip-btn" :disabled="isGenerating" @click="rewriteModule(mod.id)">重写</button>
                    <button class="chip-btn" :disabled="isGenerating || !settings.generateImages" @click="regenImage(mod.id)">配图</button>
                    <button class="chip-btn danger" @click="deleteModule(mod.id)">删除</button>
                  </div>
                </div>

                <div class="field">
                  <label>模块类型</label>
                  <select v-model="mod.type" class="text-input" @change="persistModule(mod)">
                    <option value="品牌故事">品牌故事</option>
                    <option value="功能展示">功能展示</option>
                    <option value="场景图">场景图</option>
                    <option value="对比图">对比图</option>
                    <option value="规格说明">规格说明</option>
                    <option value="FAQ">FAQ</option>
                  </select>
                </div>

                <div class="field">
                  <label>标题</label>
                  <input v-model="mod.headline" class="text-input" :disabled="mod.locked?.headline" @input="persistModule(mod)" />
                </div>

                <div class="field">
                  <label>正文</label>
                  <textarea v-model="mod.body" class="prompt-textarea" rows="4" :disabled="mod.locked?.body" @input="persistModule(mod)" />
                </div>

                <div class="grid-2">
                  <div class="field">
                    <label>配图提示词（英文）</label>
                    <textarea v-model="mod.imagePrompt" class="prompt-textarea" rows="3" :disabled="mod.locked?.image" @input="persistModule(mod)" />
                  </div>
                  <div class="field">
                    <label>配图</label>
                    <div class="img-box">
                      <img v-if="mod.imageUrl" :src="mod.imageUrl" alt="模块配图" />
                      <div v-else class="img-empty">暂无配图</div>
                    </div>
                  </div>
                </div>

                <div v-if="mod.meta?.lastError" class="error-hint">上次失败：{{ mod.meta.lastError }}</div>
              </div>
            </div>
          </section>

          <!-- 右侧：质量与交付 -->
          <aside class="panel right">
            <h3 class="panel-title">质量与交付</h3>

            <div class="section">
              <div class="section-label-row">
                <span class="section-label">成本预估</span>
                <span class="muted">（临时：按整页 A+ 费用展示）</span>
              </div>
              <div class="cost-row">
                <ThunderboltFilled class="icon" />
                预估消耗 <strong>{{ LISTING_POINTS_COST.aPlusGeneration }}</strong> 积分
              </div>
            </div>

            <div class="section">
              <div class="section-label-row">
                <span class="section-label">快速质量检查</span>
                <button class="ghost-btn" @click="runLocalQualityCheck">刷新</button>
              </div>
              <ul class="quality-list">
                <li v-for="(item, i) in qualityFindings" :key="i" :class="item.level">
                  <strong>[{{ item.level }}]</strong> {{ item.message }}
                </li>
              </ul>
              <p v-if="!qualityFindings.length" class="muted">暂无明显问题。</p>
            </div>

            <div class="section">
              <div class="section-label-row">
                <span class="section-label">导出</span>
              </div>
              <button class="primary-btn" :disabled="!draft" @click="downloadZip">下载交付 ZIP</button>
              <button class="primary-btn" :disabled="!draft" @click="downloadJson">导出结构 JSON</button>
              <button class="ghost-btn" :disabled="!draft" @click="downloadCopy">导出文案 TXT</button>
              <p class="hint">ZIP 内含文案/CSV/图片清单（图片以 URL 形式提供，不会二进制打包）。</p>
            </div>

            <div class="section">
              <div class="section-label-row">
                <span class="section-label">草稿历史</span>
              </div>
              <div class="draft-list">
                <button
                  v-for="d in aplus.listDrafts()"
                  :key="d.draftId"
                  class="draft-item"
                  :class="{ active: d.draftId === aplus.activeDraftId }"
                  @click="aplus.setActiveDraft(d.draftId)"
                >
                  <div class="draft-name">{{ d.name }}</div>
                  <div class="draft-sub muted">v{{ d.version }} · {{ formatShortTime(d.updatedAt) }}</div>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  RightOutlined,
  ThunderboltFilled,
  FileTextOutlined,
  CopyOutlined,
  ExperimentOutlined,
  LoadingOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useAuthStore } from '@/stores/auth'
import { useListingStore } from '@/stores/listing'
import { aplusService } from '@/services/aplus.service'
import { downloadAPlusDeliveryZip } from '@/services/aplus.export'
import { LISTING_POINTS_COST } from '@/config/listing.config'
import { useAPlusStore } from '@/stores/aplus'
import type { APlusDraft, APlusDraftModule, APlusDraftSettings } from '@/stores/aplus'

const auth = useAuthStore()
const store = useListingStore()
const aplus = useAPlusStore()

const isGenerating = ref(false)
const progress = ref(0)
const progressMessage = ref('')
const draggingIndex = ref<number | null>(null)
const qualityFindings = ref<Array<{ level: 'info' | 'warn' | 'error'; message: string }>>([])

const hasContext = computed(() => {
  return (
    store.strategyPrompts &&
    store.analysisReport &&
    store.generatedListing &&
    (store.productInfo?.name || store.userListingData?.title)
  )
})

const productBrand = computed(() => {
  return store.productInfo?.brand ?? store.userListingData?.brand ?? ''
})
const productCategory = computed(() => {
  return store.productInfo?.category ?? store.userListingData?.categoryPath ?? '-'
})

const draft = computed(() => aplus.activeDraft as APlusDraft | null)
const editablePrompt = computed({
  get: () => draft.value?.userEditablePrompt ?? '',
  set: (v) => aplus.setUserEditablePrompt(v),
})
const settings = computed({
  get: () =>
    (draft.value?.settings ??
      ({
        language: store.productInfo?.language ?? 'en',
        market: store.productInfo?.market ?? 'us',
        templateId: 'default',
        moduleCount: 5,
        generateImages: true,
        enableSelfCheck: true,
        exportMode: 'copy_and_images',
      } as APlusDraftSettings)),
  set: (v) => aplus.patchSettings(v),
})
const draftName = computed({
  get: () => draft.value?.name ?? '',
  set: (v) => aplus.setDraftName(v),
})

const contextHealth = computed(() => {
  const hasStrategy = !!store.strategyPrompts
  const hasAnalysis = !!store.analysisReport
  const hasListing = !!store.generatedListing
  const hasImages =
    !!store.mainImageUrl ||
    (store.generatedImages?.length ?? 0) > 0 ||
    (store.productInfo?.images?.length ?? 0) > 0 ||
    !!store.userListingData?.mainImageUrl
  return { hasStrategy, hasAnalysis, hasListing, hasImages, ok: hasStrategy && hasAnalysis && hasListing }
})

function formatShortTime(iso: string) {
  try {
    const d = new Date(iso)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${mm}-${dd} ${hh}:${mi}`
  } catch {
    return iso
  }
}

function buildContextFingerprint() {
  return aplus.computeContextFingerprint({
    listing: store.generatedListing,
    productInfo: store.productInfo,
    userListing: store.userListingData,
    analysis: store.analysisReport?.aPlusAnalysis,
    strategy: store.strategyPrompts?.aPlusGuidancePrompt,
    mainImageUrl: store.mainImageUrl,
  })
}

function ensureDraftReady() {
  if (!hasContext.value || !store.strategyPrompts || !store.analysisReport || !store.generatedListing) return
  aplus.refreshFromStorage()
  if (draft.value && draft.value.contextFingerprint === buildContextFingerprint()) return

  const defaultPrompt = aplusService.buildDefaultPrompt(store.strategyPrompts, store.analysisReport)
  aplus.createDraft({
    name: 'A+ 草稿',
    contextFingerprint: buildContextFingerprint(),
    language: store.productInfo?.language ?? 'en',
    market: store.productInfo?.market ?? 'us',
    defaultPrompt,
  })
}

function resetDraftFromContext() {
  if (!hasContext.value || !store.strategyPrompts || !store.analysisReport) return
  const defaultPrompt = aplusService.buildDefaultPrompt(store.strategyPrompts, store.analysisReport)
  aplus.createDraft({
    name: 'A+ 草稿',
    contextFingerprint: buildContextFingerprint(),
    language: store.productInfo?.language ?? 'en',
    market: store.productInfo?.market ?? 'us',
    defaultPrompt,
  })
  message.success('已基于当前上下文创建新草稿')
}

onMounted(() => ensureDraftReady())
watch(hasContext, () => ensureDraftReady())

function addEmptyModule() {
  aplus.addModule()
}

function deleteModule(id: string) {
  aplus.deleteModule(id)
}

function persistModule(mod: APlusDraftModule) {
  aplus.updateModule(mod.id, mod)
}

function onDragStart(index: number) {
  draggingIndex.value = index
}

function onDrop(index: number) {
  if (draggingIndex.value === null) return
  if (draggingIndex.value === index) return
  aplus.reorderModules(draggingIndex.value, index)
  draggingIndex.value = null
}

function toggleLock(moduleId: string, field: 'headline' | 'body' | 'image') {
  const d = draft.value
  if (!d) return
  const mod = d.modules.find((m) => m.id === moduleId)
  if (!mod) return
  const locked = { ...(mod.locked ?? {}) }
  locked[field] = !locked[field]
  aplus.updateModule(moduleId, { locked })
}

async function generateFull() {
  if (!hasContext.value || !store.strategyPrompts || !store.analysisReport || !store.generatedListing) {
    message.warning('缺少必要数据，请先完成 Listing 生成')
    return
  }
  if (!draft.value) ensureDraftReady()
  const cost = LISTING_POINTS_COST.aPlusGeneration
  if (auth.points < cost) {
    message.warning(`积分不足，A+ 生成需要 ${cost} 积分`)
    return
  }
  isGenerating.value = true
  progress.value = 0
  progressMessage.value = '正在生成...'
  try {
    const res = await aplusService.generateAPlus(
      {
        userEditablePrompt: editablePrompt.value,
        strategyPrompts: store.strategyPrompts,
        analysisReport: store.analysisReport,
        generatedListing: store.generatedListing,
        productInfo: store.productInfo,
        userListingData: store.userListingData,
        mainImageUrl: store.mainImageUrl,
        generatedImages: store.generatedImages ?? [],
        settings: {
          language: settings.value.language,
          market: settings.value.market,
          moduleCount: settings.value.moduleCount,
          generateImages: settings.value.generateImages,
          enableSelfCheck: settings.value.enableSelfCheck,
          templateId: settings.value.templateId,
        },
      },
      (p, msg) => {
        progress.value = p
        progressMessage.value = msg
      }
    )
    aplus.attachGenerationResult(res.modules)
    message.success('A+ 页面生成完成')
    runLocalQualityCheck()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '生成失败')
  } finally {
    isGenerating.value = false
  }
}

async function rewriteModule(moduleId: string) {
  const d = draft.value
  if (!d) return
  const mod = d.modules.find((m) => m.id === moduleId)
  if (!mod) return
  if (!store.strategyPrompts || !store.analysisReport || !store.generatedListing) return

  isGenerating.value = true
  progress.value = 0
  progressMessage.value = '正在重写模块...'
  try {
    const updated = await aplusService.rewriteModule(
      {
        module: mod,
        locked: mod.locked ?? {},
        userEditablePrompt: editablePrompt.value,
        strategyPrompts: store.strategyPrompts,
        analysisReport: store.analysisReport,
        generatedListing: store.generatedListing,
        productInfo: store.productInfo,
        userListingData: store.userListingData,
        mainImageUrl: store.mainImageUrl,
        generatedImages: store.generatedImages ?? [],
        settings: {
          language: settings.value.language,
          market: settings.value.market,
          enableSelfCheck: settings.value.enableSelfCheck,
          templateId: settings.value.templateId,
        },
      },
      (p, msg) => {
        progress.value = p
        progressMessage.value = msg
      }
    )
    aplus.updateModule(moduleId, { ...updated, meta: { lastGeneratedAt: new Date().toISOString() } })
    message.success('模块已重写')
    runLocalQualityCheck()
  } catch (err) {
    aplus.updateModule(moduleId, { meta: { lastError: err instanceof Error ? err.message : '重写失败' } })
    message.error(err instanceof Error ? err.message : '重写失败')
  } finally {
    isGenerating.value = false
  }
}

async function regenImage(moduleId: string) {
  const d = draft.value
  if (!d) return
  const mod = d.modules.find((m) => m.id === moduleId)
  if (!mod) return
  if (!store.strategyPrompts || !store.analysisReport || !store.generatedListing) return

  isGenerating.value = true
  progress.value = 0
  progressMessage.value = '正在生成配图...'
  try {
    const updated = await aplusService.generateModuleImage(
      {
        module: mod,
        userEditablePrompt: editablePrompt.value,
        strategyPrompts: store.strategyPrompts,
        analysisReport: store.analysisReport,
        generatedListing: store.generatedListing,
        productInfo: store.productInfo,
        userListingData: store.userListingData,
        mainImageUrl: store.mainImageUrl,
        generatedImages: store.generatedImages ?? [],
      },
      (p, msg) => {
        progress.value = p
        progressMessage.value = msg
      }
    )
    aplus.updateModule(moduleId, { imageUrl: updated.imageUrl, imagePrompt: updated.imagePrompt })
    message.success('配图完成')
  } catch (err) {
    aplus.updateModule(moduleId, { meta: { lastError: err instanceof Error ? err.message : '配图失败' } })
    message.error(err instanceof Error ? err.message : '配图失败')
  } finally {
    isGenerating.value = false
  }
}

function copyModule(mod: { headline: string; body: string }) {
  const text = `${mod.headline}\n\n${mod.body}`.trim()
  navigator.clipboard.writeText(text).then(
    () => message.success('已复制到剪贴板'),
    () => message.error('复制失败')
  )
}

function copyWholePage() {
  const d = draft.value
  if (!d) return
  const text = d.modules.map((m, i) => `【${i + 1}｜${m.type}】\n${m.headline}\n\n${m.body}`).join('\n\n---\n\n')
  navigator.clipboard.writeText(text).then(
    () => message.success('已复制整页文案'),
    () => message.error('复制失败')
  )
}

function copyFacts() {
  const text = [
    `Title: ${store.generatedListing?.title ?? ''}`,
    `Brand: ${productBrand.value}`,
    `Category: ${productCategory.value}`,
    `Bullets: ${(store.generatedListing?.bulletPoints ?? []).join(' | ')}`,
  ].join('\n')
  navigator.clipboard.writeText(text).then(
    () => message.success('已复制事实源'),
    () => message.error('复制失败')
  )
}

function runLocalQualityCheck() {
  const d = draft.value
  if (!d) {
    qualityFindings.value = []
    return
  }
  const findings: Array<{ level: 'info' | 'warn' | 'error'; message: string }> = []
  const absWords = /\b(best|No\.1|number\s*one|guarantee|100%|never|always|perfect)\b/i
  const claimWords = /\b(cure|treat|medical|FDA|clinically)\b/i

  d.modules.forEach((m, idx) => {
    const text = `${m.headline}\n${m.body}`
    if (!m.headline?.trim()) findings.push({ level: 'warn', message: `模块 ${idx + 1}：标题为空` })
    if (!m.body?.trim()) findings.push({ level: 'warn', message: `模块 ${idx + 1}：正文为空` })
    if (absWords.test(text)) findings.push({ level: 'warn', message: `模块 ${idx + 1}：可能含绝对化用语（需合规确认）` })
    if (claimWords.test(text)) findings.push({ level: 'error', message: `模块 ${idx + 1}：可能含医疗/功效承诺高风险用语` })
  })

  if (settings.value.generateImages && !contextHealth.value.hasImages) {
    findings.push({ level: 'info', message: '当前未检测到参考图片：配图可能会被跳过或质量不稳定' })
  }
  qualityFindings.value = findings
}

function downloadBlob(filename: string, content: Blob) {
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadJson() {
  if (!draft.value) return
  const blob = new Blob([JSON.stringify(draft.value, null, 2)], { type: 'application/json;charset=utf-8' })
  downloadBlob(`aplus_draft_${draft.value.draftId}.json`, blob)
  message.success('已导出 JSON')
}

function downloadCopy() {
  if (!draft.value) return
  const text = draft.value.modules.map((m, i) => `# ${i + 1} ${m.type}\n${m.headline}\n\n${m.body}`).join('\n\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  downloadBlob(`aplus_copy_${draft.value.draftId}.txt`, blob)
  message.success('已导出 TXT')
}

async function downloadZip() {
  if (!draft.value) return
  try {
    await downloadAPlusDeliveryZip(draft.value)
    message.success('已下载交付 ZIP')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '导出失败')
  }
}
</script>

<style scoped lang="scss">
.aplus-workbench { padding: 0; }

.tool-header {
  margin-bottom: 24px;
  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #6b7280;
    a { color: #2563eb; text-decoration: none; &:hover { text-decoration: underline; } }
  }
  .crumb-icon { font-size: 10px; color: #9ca3af; }
  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    .points { font-size: 14px; font-weight: 600; color: #374151; }
    .draft-meta {
      display: inline-flex;
      align-items: baseline;
      gap: 8px;
      padding: 6px 10px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fff;
      font-size: 13px;
      color: #111827;
    }
    .recharge-link { font-size: 13px; color: #2563eb; text-decoration: none; &:hover { text-decoration: underline; } }
  }
}

.tool-main {
  padding: 0 24px 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 60px 24px;
  .empty-icon { font-size: 48px; color: #d1d5db; margin-bottom: 16px; }
  .empty-title { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px; }
  .empty-desc { font-size: 14px; color: #6b7280; max-width: 400px; margin: 0 auto 24px; line-height: 1.6; }
  .empty-btn {
    display: inline-block;
    padding: 12px 24px;
    background: #2563eb;
    color: #fff;
    border-radius: 10px;
    font-weight: 600;
    text-decoration: none;
    &:hover { background: #1d4ed8; }
  }
}

.workbench-layout {
  display: grid;
  grid-template-columns: 340px 1fr 320px;
  gap: 16px;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px;
}

.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.muted { color: #6b7280; font-size: 12px; }
.hint { color: #9ca3af; font-size: 12px; margin-top: 6px; line-height: 1.5; }

.field { margin-top: 12px; }
.field > label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.field.checkbox > label { display: flex; align-items: center; gap: 8px; margin: 0; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.text-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 13px;
  font-family: inherit;
  background: #fff;
  &:focus { outline: none; border-color: #2563eb; }
}

.prompt-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  &:focus { outline: none; border-color: #2563eb; }
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.ghost-btn {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  &:hover { background: #f9fafb; }
}

.chip-btn {
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
  &:hover { background: #f3f4f6; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &.danger { border-color: #fecaca; color: #dc2626; }
}

.section { margin-top: 14px; padding-top: 14px; border-top: 1px solid #f3f4f6; }
.section-label-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.section-label { font-size: 12px; font-weight: 700; color: #111827; }

.badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  &.ok { color: #166534; border-color: #bbf7d0; background: #f0fdf4; }
}

.health-list { margin: 0; padding: 0 0 0 18px; color: #6b7280; font-size: 12px; }
.health-list li.ok { color: #166534; }

.context-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  font-size: 12px;
  color: #374151;
  .context-row { margin-bottom: 8px; }
  .context-bullets { margin: 6px 0 0 18px; padding: 0; }
}

.cost-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  .icon { color: #f59e0b; }
}

.progress-row { margin: 10px 0 12px; }
.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #7c3aed;
  transition: width 0.3s;
}
.progress-msg { margin-top: 6px; font-size: 12px; color: #6b7280; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.module-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.module-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
}

.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.module-type {
  font-size: 12px;
  font-weight: 600;
  color: #7c3aed;
  background: #f5f3ff;
  padding: 4px 10px;
  border-radius: 8px;
}

.module-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.img-box {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #f9fafb;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
}
.img-empty { color: #9ca3af; font-size: 12px; padding: 10px; }
.empty-canvas { padding: 18px; border: 1px dashed #d1d5db; border-radius: 12px; color: #6b7280; font-size: 13px; }
.quality-list { margin: 0; padding: 0 0 0 18px; font-size: 12px; color: #374151; }
.quality-list li.warn { color: #92400e; }
.quality-list li.error { color: #b91c1c; }
.draft-list { display: flex; flex-direction: column; gap: 8px; }
.draft-item {
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  &:hover { background: #f9fafb; }
  &.active { border-color: #c4b5fd; background: #f5f3ff; }
}
.draft-name { font-size: 13px; font-weight: 700; color: #111827; }
.draft-sub { margin-top: 2px; font-size: 12px; }
.error-hint { margin-top: 8px; font-size: 12px; color: #b91c1c; }
</style>
