<template>
  <div class="aplus-input-form">
    <div class="form-title-row">
      <h3 class="form-title">A+ 商品信息</h3>
      <button type="button" class="clear-btn" @click="onClearInput">
        <DeleteOutlined /> 清空输入
      </button>
    </div>
    <p class="form-hint">
      必填：产品名称 + 原始卖点/参数 + 图片。其余都可选，后续仍可编辑。
      <span v-if="prefillHint" class="prefill-hint">{{ prefillHint }}</span>
    </p>

    <!-- 卡片 1：基础信息 -->
    <div class="form-card">
      <h4 class="card-title">基础信息</h4>
      <div class="form-grid">
        <div class="form-section form-section-span">
          <label class="field-label">商品图片 *<span class="field-tip">最多 5 张，用于后续生成配图</span></label>
          <span v-if="(validationBlurred.images || props.showValidation) && !aplus.wizardInput.images.length" class="field-error-msg">请至少上传 1 张商品图片</span>
          <div class="image-upload-grid">
            <div v-for="(img, idx) in aplus.wizardInput.images" :key="idx" class="image-thumb">
              <img :src="img" alt="商品图" />
              <button class="remove-btn" @click="removeImage(idx)">
                <CloseOutlined />
              </button>
            </div>
            <div
              v-if="aplus.wizardInput.images.length < 5"
              class="image-add"
              @click="triggerUpload"
              @dragover.prevent
              @drop.prevent="onDrop"
            >
              <PlusOutlined class="add-icon" />
              <span>上传图片</span>
            </div>
          </div>
          <input
            ref="fileRef"
            type="file"
            accept="image/*"
            multiple
            class="hidden-input"
            @change="onFileChange"
          />
        </div>
        <div class="form-section">
          <label class="field-label">产品名称 *<span class="field-tip">尽量写「名称+核心属性词/使用场景」</span></label>
          <input
            :value="aplus.wizardInput.productName"
            type="text"
            class="field-input"
            :class="{ 'field-error': (validationBlurred.productName || props.showValidation) && !aplus.wizardInput.productName.trim() }"
            placeholder="如：车载智能恒温咖啡杯 / 2人位超轻防水徒步帐篷"
            @input="onTextInput('productName', ($event.target as HTMLInputElement).value)"
            @blur="validationBlurred.productName = true"
          />
          <span v-if="(validationBlurred.productName || props.showValidation) && !aplus.wizardInput.productName.trim()" class="field-error-msg">请填写产品名称</span>
        </div>
        <div class="form-section form-section-span">
          <label class="field-label">原始卖点与参数 *<span class="field-tip">越「原句/冷冰冰」越好，直接粘贴参数堆</span></label>
          <textarea
            :value="aplus.wizardInput.rawParams"
            rows="6"
            class="field-textarea"
            :class="{ 'field-error': (validationBlurred.rawParams || props.showValidation) && !aplus.wizardInput.rawParams.trim() }"
            placeholder="例如：
- 采用304不锈钢
- 转速20000转/分
- 电池容量5000mAh
- 支持IPX7防水
- YKK防水拉链，不卡齿
..."
            @input="onTextInput('rawParams', ($event.target as HTMLTextAreaElement).value)"
            @blur="validationBlurred.rawParams = true"
          />
          <span v-if="(validationBlurred.rawParams || props.showValidation) && !aplus.wizardInput.rawParams.trim()" class="field-error-msg">请填写原始卖点或参数</span>
        </div>
      </div>
    </div>

    <!-- 卡片 2：市场设置 -->
    <div class="form-card">
      <h4 class="card-title">市场设置</h4>
      <div class="form-grid">
        <div class="form-section">
          <label class="field-label">目标市场<span class="field-tip">决定表达语境（如 us / uk / de）</span></label>
          <select
            :value="aplus.wizardInput.market"
            class="field-input"
            @change="onSelectInput('market', ($event.target as HTMLSelectElement).value)"
          >
            <option value="us">us</option>
            <option value="uk">uk</option>
            <option value="de">de</option>
            <option value="fr">fr</option>
            <option value="it">it</option>
            <option value="es">es</option>
            <option value="ca">ca</option>
          </select>
        </div>
        <div class="form-section">
          <label class="field-label">目标语言 *<span class="field-tip">用于输出文案/规划</span></label>
          <select
            :value="aplus.wizardInput.language"
            class="field-input"
            @change="onSelectInput('language', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="opt in LANGUAGE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- 卡片 3：策略信息 -->
    <div class="form-card">
      <h4 class="card-title">策略信息</h4>
      <div class="form-grid">
        <div class="form-section">
          <label class="field-label">目标客群画像<span class="field-tip">越具体越好：身份/动机/痛点/场景</span></label>
          <textarea
            :value="aplus.wizardInput.targetPersona"
            rows="2"
            class="field-textarea"
            placeholder="如：追求效率的硅谷程序员 / 注重家庭健康的30岁全职妈妈 / 硬核户外生存玩家"
            @input="onTextInput('targetPersona', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
        <div class="form-section">
          <label class="field-label">品牌调性与视觉偏好<span class="field-tip">形容词或对标品牌</span></label>
          <input
            :value="aplus.wizardInput.brandTone"
            type="text"
            class="field-input"
            placeholder="如：极简高端 / 科技硬核 / 居家温馨 / 类似 Anker 的专业感"
            @input="onTextInput('brandTone', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="form-section form-section-span">
          <label class="field-label">核心差异化 / 竞品痛点</label>
          <textarea
            :value="aplus.wizardInput.differentiation"
            rows="2"
            class="field-textarea"
            placeholder="如：竞品拉链容易卡，我们用了 YKK 防水拉链；竞品漏水，我们做了双层密封..."
            @input="onTextInput('differentiation', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>
    </div>

    <!-- 卡片 4：输出设置 -->
    <div class="form-card form-card-output">
      <h4 class="card-title">输出设置</h4>
      <div class="form-grid">
        <div class="form-section">
          <label class="field-label">尺寸比例</label>
          <select :value="aspectRatio" class="field-input" @change="$emit('update:aspectRatio', ($event.target as HTMLSelectElement).value)">
            <option value="1:1">1:1</option>
            <option value="4:5">4:5</option>
            <option value="16:9">16:9</option>
            <option value="3:4">3:4</option>
          </select>
          <span class="field-hint">后续重绘时也会沿用该比例</span>
        </div>
        <div class="form-section">
          <label class="field-label">清晰度</label>
          <select :value="qualityTier" class="field-input" @change="$emit('update:qualityTier', ($event.target as HTMLSelectElement).value)">
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
          <span class="field-hint">1K 更快，4K 更清晰但更慢</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { PlusOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { useAPlusStore } from '@/stores/aplus'
import { LANGUAGE_OPTIONS } from '@/config/listing.config'

const props = withDefaults(
  defineProps<{
    aspectRatio?: '1:1' | '4:5' | '16:9' | '3:4'
    qualityTier?: '1K' | '2K' | '4K'
    showValidation?: boolean
  }>(),
  { showValidation: false }
)

defineEmits<{
  'update:aspectRatio': [value: '1:1' | '4:5' | '16:9' | '3:4']
  'update:qualityTier': [value: '1K' | '2K' | '4K']
}>()

const aplus = useAPlusStore()
const fileRef = ref<HTMLInputElement | null>(null)

const validationBlurred = ref({
  productName: false,
  rawParams: false,
  images: false,
})

const prefillHint = computed(() => {
  const src = aplus.wizardInput.prefillSource
  if (src === 'listing') return '已从 Listing 回填，可编辑'
  if (src === 'userInput') return '已从原始输入回填，可编辑'
  return ''
})

function onClearInput() {
  validationBlurred.value = { productName: false, rawParams: false, images: false }
  aplus.resetWizardInput()
}

function onTextInput(
  field: 'productName' | 'rawParams' | 'targetPersona' | 'brandTone' | 'differentiation',
  value: string
) {
  aplus.touchWizardField(field)
  aplus.updateWizardInput({ [field]: value } as any)
}

function onSelectInput(field: 'market' | 'language', value: string) {
  aplus.touchWizardField(field)
  aplus.updateWizardInput({ [field]: value } as any)
}

function triggerUpload() {
  fileRef.value?.click()
}

function addImages(urls: string[]) {
  validationBlurred.value.images = true
  const current = aplus.wizardInput.images.slice()
  const merged = [...current, ...urls].slice(0, 5)
  aplus.touchWizardField('images')
  aplus.updateWizardInput({ images: merged })
}

function revokeBlobUrl(url: string) {
  if (url?.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    }
  }
}

function removeImage(index: number) {
  validationBlurred.value.images = true
  const current = aplus.wizardInput.images
  const url = current[index]
  revokeBlobUrl(url)
  const next = current.slice()
  next.splice(index, 1)
  aplus.touchWizardField('images')
  aplus.updateWizardInput({ images: next })
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files) return
  const urls: string[] = []
  for (let i = 0; i < files.length; i++) {
    if (aplus.wizardInput.images.length + urls.length >= 5) break
    urls.push(URL.createObjectURL(files[i]))
  }
  if (urls.length) addImages(urls)
  target.value = ''
}

function onDrop(e: DragEvent) {
  const files = e.dataTransfer?.files
  if (!files) return
  const urls: string[] = []
  for (let i = 0; i < files.length; i++) {
    if (!files[i].type.startsWith('image/')) continue
    if (aplus.wizardInput.images.length + urls.length >= 5) break
    urls.push(URL.createObjectURL(files[i]))
  }
  if (urls.length) addImages(urls)
}
</script>

<style scoped lang="scss">
.aplus-input-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
}

.form-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  &:hover {
    color: var(--color-error);
    border-color: var(--color-error);
    background: #fef2f2;
  }
}

.form-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: -8px 0 0;
}

.prefill-hint {
  margin-left: 8px;
  color: var(--color-primary);
  font-weight: 600;
}

.form-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  background: var(--color-bg);
}

.form-card-output {
  max-width: 480px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-light);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.form-section-span {
    grid-column: 1 / -1;
  }
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-tip {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.field-hint {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 4px;
}

.field-input,
.field-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border-muted);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-bg);
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  &.field-error {
    border-color: var(--color-error);
    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }
  }
}

.field-error-msg {
  font-size: 12px;
  color: var(--color-error);
  margin-top: 4px;
  display: block;
}

.field-textarea {
  resize: vertical;
  min-height: 72px;
}

.hidden-input {
  display: none;
}

.image-upload-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-thumb {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
  border: 1px solid var(--color-border);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .remove-btn {
    opacity: 1;
  }
}

.image-add {
  width: 100px;
  height: 100px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  color: var(--color-text-tertiary);
  font-size: 12px;
  transition: all 0.2s;

  .add-icon {
    font-size: 20px;
  }

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-light);
  }
}
</style>
