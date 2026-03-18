<template>
  <div class="listing-result">
    <div class="result-header">
      <h3 class="result-title">生成结果</h3>
      <div class="result-actions">
        <button class="action-btn" @click="copyAll">
          <CopyOutlined /> 一键复制
        </button>
      </div>
    </div>

    <div v-if="listing" class="result-body">
      <div class="result-section">
        <div class="section-header">
          <h4 class="section-title">商品标题</h4>
          <button class="regen-btn" @click="$emit('regenerate', 'title')">
            <ReloadOutlined /> 重新生成
          </button>
        </div>
        <div v-if="editingField === 'title'" class="edit-area">
          <textarea v-model="editTitle" rows="2" class="edit-textarea"></textarea>
          <div class="edit-actions">
            <button class="save-btn" @click="saveEdit('title')">保存</button>
            <button class="cancel-btn" @click="editingField = ''">取消</button>
          </div>
        </div>
        <div v-else class="section-content title-content" @dblclick="startEdit('title')">
          {{ listing.title }}
          <EditOutlined class="edit-icon" @click="startEdit('title')" />
        </div>
      </div>

      <div class="result-section">
        <div class="section-header">
          <h4 class="section-title">五点描述 (Bullet Points)</h4>
          <button v-if="editingField !== 'bullets'" class="regen-btn" @click="$emit('regenerate', 'bullets')">
            <ReloadOutlined /> 重新生成
          </button>
          <template v-else>
            <button class="save-btn-inline" @click="saveEdit('bullets')">保存</button>
            <button class="cancel-btn-inline" @click="editingField = ''">取消</button>
          </template>
        </div>
        <div v-if="editingField === 'bullets'" class="edit-area bullets-edit">
          <div v-for="(bp, idx) in editBullets" :key="idx" class="bullet-edit-row">
            <span class="bullet-num">{{ idx + 1 }}.</span>
            <textarea v-model="editBullets[idx]" :rows="2" class="edit-textarea bullet-textarea"></textarea>
          </div>
        </div>
        <div v-else class="bullet-list-wrap" @dblclick="startEdit('bullets')">
          <ul class="bullet-list">
            <li v-for="(bp, idx) in listing.bulletPoints" :key="idx">{{ bp }}</li>
          </ul>
          <EditOutlined class="edit-icon bullet-edit-icon" @click="startEdit('bullets')" />
          <span class="edit-hint">双击或点击编辑图标可修改</span>
        </div>
      </div>

      <div class="result-section">
        <div class="section-header">
          <h4 class="section-title">产品描述</h4>
          <button class="regen-btn" @click="$emit('regenerate', 'description')">
            <ReloadOutlined /> 重新生成
          </button>
        </div>
        <div v-if="editingField === 'description'" class="edit-area">
          <textarea v-model="editDescription" rows="5" class="edit-textarea"></textarea>
          <div class="edit-actions">
            <button class="save-btn" @click="saveEdit('description')">保存</button>
            <button class="cancel-btn" @click="editingField = ''">取消</button>
          </div>
        </div>
        <div v-else class="section-content desc-content" @dblclick="startEdit('description')">
          {{ listing.description }}
          <EditOutlined class="edit-icon" @click="startEdit('description')" />
        </div>
      </div>

      <div class="result-section">
        <div class="section-header">
          <h4 class="section-title">搜索关键词</h4>
        </div>
        <div class="keyword-cloud">
          <span v-for="(kw, idx) in listing.searchTerms" :key="idx" class="keyword-tag">{{ kw }}</span>
        </div>
      </div>

      <div v-if="mainImage" class="result-section">
        <div class="section-header">
          <h4 class="section-title">Amazon 合规主图</h4>
          <span v-if="complianceResult" class="compliance-badge" :class="complianceResult.passed ? 'badge-pass' : 'badge-fail'">
            <CheckCircleFilled v-if="complianceResult.passed" />
            <CloseCircleFilled v-else />
            {{ complianceResult.passed ? '合规' : '待修正' }}
          </span>
        </div>
        <div class="main-image-wrap">
          <img :src="mainImage" alt="Amazon 合规主图" class="main-image" />
        </div>
      </div>

      <div v-else-if="images.length" class="result-section">
        <div class="section-header">
          <h4 class="section-title">商品图片</h4>
        </div>
        <div class="image-grid">
          <div v-for="(img, idx) in images" :key="idx" class="result-image">
            <img :src="img" alt="生成的商品图" />
          </div>
        </div>
      </div>

      <div v-if="listing.improvements && listing.improvements.length" class="result-section">
        <div class="section-header">
          <h4 class="section-title">优化说明</h4>
        </div>
        <ul class="improvement-list">
          <li v-for="(imp, idx) in listing.improvements" :key="idx">{{ imp }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CopyOutlined, ReloadOutlined, EditOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { GeneratedListing, ComplianceResult } from '@/services/listing.service'

const props = defineProps<{
  listing: GeneratedListing | null
  images: string[]
  mainImage?: string | null
  complianceResult?: ComplianceResult | null
}>()

defineEmits<{
  regenerate: [field: string]
}>()

const editingField = ref('')
const editTitle = ref('')
const editDescription = ref('')
const editBullets = ref<string[]>([])

function startEdit(field: string) {
  if (!props.listing) return
  editingField.value = field
  if (field === 'title') editTitle.value = props.listing.title
  if (field === 'description') editDescription.value = props.listing.description
  if (field === 'bullets') {
    const arr = [...props.listing.bulletPoints].slice(0, 5)
    while (arr.length < 5) arr.push('')
    editBullets.value = arr
  }
}

function saveEdit(field: string) {
  if (!props.listing) return
  if (field === 'title') props.listing.title = editTitle.value
  if (field === 'description') props.listing.description = editDescription.value
  if (field === 'bullets') {
    const bullets = editBullets.value.map(b => b.trim()).filter(Boolean)
    props.listing.bulletPoints = bullets.length ? bullets : ['']
  }
  editingField.value = ''
}

function copyAll() {
  if (!props.listing) return
  const text = [
    `标题: ${props.listing.title}`,
    '',
    '五点描述:',
    ...props.listing.bulletPoints.map((bp, i) => `${i + 1}. ${bp}`),
    '',
    `产品描述: ${props.listing.description}`,
    '',
    `搜索关键词: ${props.listing.searchTerms.join(', ')}`,
  ].join('\n')

  navigator.clipboard.writeText(text).then(() => {
    message.success('已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败，请手动复制')
  })
}
</script>

<style scoped lang="scss">
.listing-result { display: flex; flex-direction: column; gap: 20px; }

.result-header {
  display: flex; align-items: center; justify-content: space-between;
  .result-title { font-size: 20px; font-weight: 700; color: #111827; margin: 0; }
}

.action-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  background: #2563eb; color: #fff; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  &:hover { background: #1d4ed8; }
}

.result-body { display: flex; flex-direction: column; gap: 24px; }

.result-section {
  .section-header {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
  }
  .section-title { font-size: 15px; font-weight: 600; color: #374151; margin: 0; }
  .regen-btn {
    display: flex; align-items: center; gap: 4px; font-size: 12px; color: #6b7280;
    background: none; border: 1px solid #e5e7eb; border-radius: 6px; padding: 4px 10px; cursor: pointer;
    &:hover { background: #f3f4f6; color: #374151; }
  }
}

.section-content {
  background: #f9fafb; padding: 14px 16px; border-radius: 10px; font-size: 14px;
  color: #111827; line-height: 1.6; position: relative; cursor: text;
  .edit-icon {
    position: absolute; top: 10px; right: 10px; font-size: 14px; color: #9ca3af;
    cursor: pointer; opacity: 0; transition: opacity 0.2s;
  }
  &:hover .edit-icon { opacity: 1; }
}

.title-content { font-weight: 600; }

.edit-area { display: flex; flex-direction: column; gap: 8px; }
.edit-textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #2563eb; border-radius: 8px; font-size: 14px;
  resize: vertical; min-height: 60px; &:focus { outline: none; }
}
.edit-actions { display: flex; gap: 8px; }
.save-btn {
  padding: 6px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px;
  font-size: 13px; cursor: pointer; &:hover { background: #1d4ed8; }
}
.cancel-btn {
  padding: 6px 16px; background: #fff; color: #6b7280; border: 1px solid #d1d5db; border-radius: 6px;
  font-size: 13px; cursor: pointer; &:hover { background: #f3f4f6; }
}

.bullet-list-wrap {
  position: relative; cursor: text;
  .edit-icon.bullet-edit-icon {
    position: absolute; top: 10px; right: 10px; font-size: 14px; color: #9ca3af;
    cursor: pointer; opacity: 0; transition: opacity 0.2s;
  }
  &:hover .edit-icon.bullet-edit-icon { opacity: 1; }
  .edit-hint { font-size: 11px; color: #9ca3af; margin-top: 6px; display: block; }
}

.bullet-list {
  background: #f9fafb; padding: 14px 16px 14px 32px; border-radius: 10px;
  margin: 0; display: flex; flex-direction: column; gap: 8px;
  li { font-size: 14px; color: #111827; line-height: 1.6; }
}

.bullets-edit { display: flex; flex-direction: column; gap: 10px; }
.bullet-edit-row {
  display: flex; align-items: flex-start; gap: 8px;
  .bullet-num { font-size: 14px; font-weight: 600; color: #6b7280; min-width: 20px; padding-top: 10px; }
  .bullet-textarea { flex: 1; min-height: 50px; }
}
.save-btn-inline, .cancel-btn-inline {
  padding: 4px 12px; font-size: 12px; border-radius: 6px; cursor: pointer; border: 1px solid #d1d5db;
}
.save-btn-inline { background: #2563eb; color: #fff; border-color: #2563eb; margin-right: 6px; }
.cancel-btn-inline { background: #fff; color: #6b7280; }

.keyword-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
.keyword-tag {
  padding: 5px 14px; border-radius: 16px; font-size: 13px;
  background: #eff6ff; color: #2563eb;
}

.compliance-badge {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
  &.badge-pass { background: #ecfdf5; color: #059669; }
  &.badge-fail { background: #fef2f2; color: #dc2626; }
}

.main-image-wrap {
  background: #f9fafb; border-radius: 10px; padding: 12px; display: flex;
  align-items: center; justify-content: center; border: 1px solid #e5e7eb;
  .main-image { max-width: 100%; max-height: 360px; object-fit: contain; border-radius: 6px; }
}

.image-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;
  .result-image {
    border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;
    img { width: 100%; height: auto; display: block; }
  }
}

.improvement-list {
  background: #fffbeb; padding: 14px 16px 14px 32px; border-radius: 10px;
  margin: 0; display: flex; flex-direction: column; gap: 6px;
  li { font-size: 13px; color: #92400e; line-height: 1.5; }
}
</style>
