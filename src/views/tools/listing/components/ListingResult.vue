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
          <template v-if="editingField === 'bullets'">
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
          <h4 class="section-title">Amazon 主图</h4>
          <div class="main-image-actions">
            <button class="action-icon-btn" title="下载图片" @click="downloadMainImage">
              <DownloadOutlined />
            </button>
          </div>
        </div>
        <div class="main-image-wrap">
          <div class="main-image-thumb clickable" @click="openMainImageLightbox">
            <img :src="mainImage" alt="Amazon 主图" class="main-image" />
          </div>
        </div>
        <Teleport to="body">
          <div
            v-if="mainImageLightboxVisible"
            class="main-image-lightbox"
            tabindex="-1"
            @click.self="closeMainImageLightbox"
          >
            <button class="lightbox-close" @click="closeMainImageLightbox">×</button>
            <div class="lightbox-content" @click.self="closeMainImageLightbox">
              <img v-if="mainImage" :src="mainImage" alt="放大预览" />
            </div>
            <button class="lightbox-download" title="下载" @click.stop="downloadMainImage">
              <DownloadOutlined /> 下载
            </button>
          </div>
        </Teleport>
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
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { CopyOutlined, EditOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { GeneratedListing } from '@/services/listing.service'

const props = defineProps<{
  listing: GeneratedListing | null
  images: string[]
  mainImage?: string | null
}>()

const emit = defineEmits<{
  'update-listing': [payload: { field: 'title' | 'bullets' | 'description'; value: string | string[] }]
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
  if (field === 'title') {
    props.listing.title = editTitle.value
    emit('update-listing', { field: 'title', value: editTitle.value })
  } else if (field === 'description') {
    props.listing.description = editDescription.value
    emit('update-listing', { field: 'description', value: editDescription.value })
  } else if (field === 'bullets') {
    const bullets = editBullets.value.map(b => b.trim()).filter(Boolean)
    const arr = bullets.length ? bullets : ['']
    props.listing.bulletPoints = arr
    emit('update-listing', { field: 'bullets', value: arr })
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

const mainImageLightboxVisible = ref(false)

function openMainImageLightbox() {
  mainImageLightboxVisible.value = true
  nextTick(() => (document.querySelector('.main-image-lightbox') as HTMLElement)?.focus())
}

function closeMainImageLightbox() {
  mainImageLightboxVisible.value = false
}

function downloadMainImage() {
  if (!props.mainImage) return
  const a = document.createElement('a')
  a.href = props.mainImage
  a.download = 'amazon-main-image.png'
  a.target = '_blank'
  a.click()
  message.success('已开始下载')
}

function onLightboxKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && mainImageLightboxVisible.value) closeMainImageLightbox()
}

onMounted(() => {
  window.addEventListener('keydown', onLightboxKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onLightboxKeydown)
})
</script>

<style scoped lang="scss">
.listing-result {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .result-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
  }
}

.result-body {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.result-section {
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
}

.section-content {
  background: var(--color-bg-subtle);
  padding: 16px 18px;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-primary);
  line-height: 1.6;
  position: relative;
  cursor: text;
  border: 1px solid var(--color-border-light);
  .edit-icon {
    position: absolute; top: 10px; right: 10px; font-size: 14px; color: var(--color-text-tertiary);
    cursor: pointer; opacity: 0; transition: opacity 0.2s;
  }
  &:hover .edit-icon { opacity: 1; }
}

.title-content { font-weight: 600; }

.edit-area { display: flex; flex-direction: column; gap: 10px; }
.edit-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  font-size: 14px;
  resize: vertical;
  min-height: 60px;
  &:focus { outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
}
.edit-actions { display: flex; gap: 10px; }
.save-btn {
  padding: 8px 18px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: var(--color-primary-hover); }
}
.cancel-btn {
  padding: 8px 18px;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  cursor: pointer;
  &:hover { background: var(--color-border-light); color: var(--color-text-primary); }
}

.bullet-list-wrap {
  position: relative; cursor: text;
  .edit-icon.bullet-edit-icon {
    position: absolute; top: 10px; right: 10px; font-size: 14px; color: var(--color-text-tertiary);
    cursor: pointer; opacity: 0; transition: opacity 0.2s;
  }
  &:hover .edit-icon.bullet-edit-icon { opacity: 1; }
  .edit-hint { font-size: 11px; color: var(--color-text-tertiary); margin-top: 6px; display: block; }
}

.bullet-list {
  background: var(--color-bg-subtle);
  padding: 16px 18px 16px 36px;
  border-radius: var(--radius-md);
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid var(--color-border-light);
  li { font-size: 14px; color: var(--color-text-primary); line-height: 1.6; }
}

.bullets-edit { display: flex; flex-direction: column; gap: 10px; }
.bullet-edit-row {
  display: flex; align-items: flex-start; gap: 8px;
  .bullet-num { font-size: 14px; font-weight: 600; color: var(--color-text-secondary); min-width: 20px; padding-top: 10px; }
  .bullet-textarea { flex: 1; min-height: 50px; }
}
.save-btn-inline, .cancel-btn-inline {
  padding: 6px 14px;
  font-size: 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 1px solid var(--color-border);
}
.save-btn-inline {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
  margin-right: 8px;
}
.cancel-btn-inline { background: var(--color-bg); color: var(--color-text-secondary); }

.keyword-cloud { display: flex; flex-wrap: wrap; gap: 10px; }
.keyword-tag {
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 13px;
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.main-image-actions {
  display: flex; align-items: center; gap: 8px;
}

.action-icon-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; padding: 0;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-light);
  }
}

.main-image-wrap {
  background: var(--color-bg-subtle);
  border-radius: var(--radius-lg);
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
}

.main-image-thumb {
  max-width: 100%; max-height: 360px; border-radius: 6px; overflow: hidden;
  &.clickable {
    cursor: pointer;
    &:hover { box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15); }
  }
  .main-image { max-width: 100%; max-height: 360px; object-fit: contain; display: block; }
}

.main-image-lightbox {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.9);
  z-index: 9999; display: flex; align-items: center; justify-content: center;
  outline: none;
  .lightbox-close {
    position: absolute; top: 16px; right: 24px;
    width: 40px; height: 40px; font-size: 28px; line-height: 1;
    color: #fff; background: transparent; border: none; cursor: pointer;
    opacity: 0.8; &:hover { opacity: 1; }
  }
  .lightbox-content {
    max-width: 90%; max-height: 90%; display: flex; align-items: center; justify-content: center;
    img { max-width: 100%; max-height: 90vh; object-fit: contain; }
  }
  .lightbox-download {
    position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 6px;
    padding: 10px 24px; background: rgba(255, 255, 255, 0.15);
    color: #fff; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 8px;
    font-size: 14px; cursor: pointer;
    &:hover { background: rgba(255, 255, 255, 0.25); }
  }
}

.image-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;
  .result-image {
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--color-border);
    img { width: 100%; height: auto; display: block; }
  }
}

.improvement-list {
  background: #fef3c7;
  padding: 14px 16px 14px 32px;
  border-radius: var(--radius-lg);
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid rgba(217, 119, 6, 0.3);
  li { font-size: 13px; color: var(--color-warning); line-height: 1.5; }
}
</style>
