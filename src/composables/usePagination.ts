import { ref, computed } from 'vue'

interface PaginationOptions {
  pageSize?: number
  total?: number
}

export function usePagination(options: PaginationOptions = {}) {
  const { pageSize = 20, total = 0 } = options
  
  const currentPage = ref(1)
  const pageSizeRef = ref(pageSize)
  const totalRef = ref(total)
  
  const totalPages = computed(() => Math.ceil(totalRef.value / pageSizeRef.value))
  
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)
  
  const startIndex = computed(() => (currentPage.value - 1) * pageSizeRef.value)
  const endIndex = computed(() => Math.min(startIndex.value + pageSizeRef.value, totalRef.value))
  
  function nextPage() {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }
  
  function prevPage() {
    if (hasPrevPage.value) {
      currentPage.value--
    }
  }
  
  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }
  
  function reset() {
    currentPage.value = 1
  }
  
  function setTotal(total: number) {
    totalRef.value = total
  }
  
  return {
    currentPage,
    pageSize: pageSizeRef,
    total: totalRef,
    totalPages,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    nextPage,
    prevPage,
    goToPage,
    reset,
    setTotal
  }
}
