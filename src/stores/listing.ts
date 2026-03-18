import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ImageAnalysisResult,
  GeneratedListing,
  ProductInfo,
  ComplianceResult,
  FetchedListing,
} from '@/services/listing.service'
import type { AnalysisReport, StrategyPrompts, ExtractedProductData, CompareResult } from '@/services/pipeline/types'
import { LISTING_POINTS_COST } from '@/config/listing.config'

export type ListingMode = 'create' | 'optimize'

export const useListingStore = defineStore('listing', () => {
  const mode = ref<ListingMode>('create')
  const currentStep = ref(0)

  // 首次创作 - 商品信息
  const productInfo = ref<ProductInfo>({
    name: '',
    category: 'other',
    features: '',
    market: 'us',
    language: 'en',
    images: [],
    brand: '',
    specs: '',
    priceRange: '',
    targetAudience: '',
    useCases: '',
    differentiators: '',
  })

  // 优化模式 - ASIN
  const asinInput = ref('')
  const extractedAsin = ref('')

  // 抓取的真实 Listing 数据
  const fetchedListing = ref<FetchedListing | null>(null)

  // Pipeline 分析结果（整合后统一使用）
  const analysisReport = ref<AnalysisReport | null>(null)
  const strategyPrompts = ref<StrategyPrompts | null>(null)
  const pipelineExtractedData = ref<ExtractedProductData[]>([])
  const userListingData = ref<ExtractedProductData | null>(null) // 优化模式：用户当前 Listing
  const comparison = ref<CompareResult | null>(null)

  const imageAnalysis = ref<ImageAnalysisResult | null>(null)

  // 竞品 ASIN 列表（可选，无竞品时走类目最佳实践分析）
  const competitorAsins = ref<string[]>([''])

  // 优化模式可选补充
  const targetKeywords = ref<string[]>([])
  const targetAudience = ref('')

  // 生成结果
  const generatedListing = ref<GeneratedListing | null>(null)
  const generatedImages = ref<string[]>([])

  // 主图 + 合规检测
  const mainImageUrl = ref<string | null>(null)
  const complianceResult = ref<ComplianceResult | null>(null)
  const isCheckingCompliance = ref(false)

  // 进度状态
  const isAnalyzing = ref(false)
  const isGenerating = ref(false)
  const progress = ref(0)
  const progressMessage = ref('')

  // 计算属性
  const hasProductInfo = computed(() => {
    const p = productInfo.value
    return (
      p.name.trim().length > 0 &&
      p.images.length > 0 &&
      p.brand.trim().length > 0 &&
      p.specs.trim().length > 0 &&
      p.priceRange.trim().length > 0 &&
      p.targetAudience.trim().length > 0 &&
      p.useCases.trim().length > 0 &&
      p.differentiators.trim().length > 0
    )
  })

  /** 返回缺少的必填字段 key 列表，用于缺项预览 */
  function getMissingRequiredFields(): string[] {
    const p = productInfo.value
    const missing: string[] = []
    if (!p.name.trim()) missing.push('name')
    if (p.images.length === 0) missing.push('images')
    if (!p.brand.trim()) missing.push('brand')
    if (!p.specs.trim()) missing.push('specs')
    if (!p.priceRange.trim()) missing.push('priceRange')
    if (!p.targetAudience.trim()) missing.push('targetAudience')
    if (!p.useCases.trim()) missing.push('useCases')
    if (!p.differentiators.trim()) missing.push('differentiators')
    return missing
  }

  const hasAsinAnalysis = computed(() => analysisReport.value !== null)
  const hasCompetitorAnalysis = computed(() => analysisReport.value !== null)
  const hasPipelineAnalysis = computed(() => analysisReport.value !== null && strategyPrompts.value !== null)

  const hasValidCompetitorAsins = computed(() =>
    competitorAsins.value.some(a => {
      const t = a.trim()
      return t.length >= 10 || t.includes('amazon')
    })
  )
  const hasGeneratedListing = computed(() => generatedListing.value !== null)
  const hasMainImage = computed(() => mainImageUrl.value !== null)
  const hasComplianceResult = computed(() => complianceResult.value !== null)

  const marketInsightHadCompetitors = computed(() => {
    const extracted = pipelineExtractedData.value
    if (mode.value === 'create') return extracted.length > 0
    if (mode.value === 'optimize') return extracted.length > 1
    return false
  })

  const totalPointsCost = computed(() => {
    let cost = 0
    if (generatedListing.value) {
      cost += LISTING_POINTS_COST.fullGeneration
    }
    if (analysisReport.value) {
      cost += marketInsightHadCompetitors.value
        ? LISTING_POINTS_COST.marketInsightWithCompetitors
        : LISTING_POINTS_COST.marketInsightWithoutCompetitors
    }
    return cost
  })

  function setMode(m: ListingMode) {
    mode.value = m
    reset()
  }

  function setStep(step: number) {
    currentStep.value = step
  }

  function nextStep() {
    currentStep.value++
  }

  function prevStep() {
    if (currentStep.value > 0) currentStep.value--
  }

  function updateProgress(p: number, msg: string) {
    progress.value = p
    progressMessage.value = msg
  }

  function updateProductInfo(info: Partial<ProductInfo>) {
    productInfo.value = { ...productInfo.value, ...info }
  }

  function addProductImage(url: string) {
    if (productInfo.value.images.length < 5) {
      productInfo.value.images.push(url)
    }
  }

  function removeProductImage(index: number) {
    productInfo.value.images.splice(index, 1)
  }

  function addCompetitorAsin() {
    if (competitorAsins.value.length < 3) {
      competitorAsins.value.push('')
    }
  }

  function removeCompetitorAsin(index: number) {
    competitorAsins.value.splice(index, 1)
  }

  function updateCompetitorAsin(index: number, value: string) {
    competitorAsins.value[index] = value
  }

  function updateTargetKeywords(kw: string[]) {
    targetKeywords.value = kw
  }

  function updateTargetAudience(audience: string) {
    targetAudience.value = audience
  }

  function setUserListingData(data: ExtractedProductData | null) {
    userListingData.value = data
  }

  function updateGeneratedListing(partial: Partial<GeneratedListing>) {
    if (generatedListing.value) {
      generatedListing.value = { ...generatedListing.value, ...partial }
    }
  }

  function reset() {
    currentStep.value = 0
    productInfo.value = {
      name: '',
      category: 'other',
      features: '',
      market: 'us',
      language: 'en',
      images: [],
      brand: '',
      specs: '',
      priceRange: '',
      targetAudience: '',
      useCases: '',
      differentiators: '',
    }
    asinInput.value = ''
    extractedAsin.value = ''
    fetchedListing.value = null
    analysisReport.value = null
    strategyPrompts.value = null
    pipelineExtractedData.value = []
    userListingData.value = null
    comparison.value = null
    imageAnalysis.value = null
    competitorAsins.value = ['']
    targetKeywords.value = []
    targetAudience.value = ''
    generatedListing.value = null
    generatedImages.value = []
    mainImageUrl.value = null
    complianceResult.value = null
    isCheckingCompliance.value = false
    isAnalyzing.value = false
    isGenerating.value = false
    progress.value = 0
    progressMessage.value = ''
  }

  return {
    mode,
    currentStep,
    productInfo,
    asinInput,
    extractedAsin,
    fetchedListing,
    analysisReport,
    strategyPrompts,
    pipelineExtractedData,
    userListingData,
    comparison,
    imageAnalysis,
    competitorAsins,
    targetKeywords,
    targetAudience,
    generatedListing,
    generatedImages,
    mainImageUrl,
    complianceResult,
    isCheckingCompliance,
    isAnalyzing,
    isGenerating,
    progress,
    progressMessage,

    hasProductInfo,
    hasAsinAnalysis,
    hasCompetitorAnalysis,
    hasPipelineAnalysis,
    hasValidCompetitorAsins,
    marketInsightHadCompetitors,
    hasGeneratedListing,
    hasMainImage,
    hasComplianceResult,
    totalPointsCost,

    getMissingRequiredFields,
    setMode,
    setStep,
    nextStep,
    prevStep,
    updateProgress,
    updateProductInfo,
    addProductImage,
    removeProductImage,
    addCompetitorAsin,
    removeCompetitorAsin,
    updateCompetitorAsin,
    updateTargetKeywords,
    updateTargetAudience,
    setUserListingData,
    updateGeneratedListing,
    reset,
  }
})
