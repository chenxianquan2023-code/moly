import { ref, computed } from 'vue'

interface UseLoadingOptions {
  initialState?: boolean
  minDuration?: number
}

export function useLoading(options: UseLoadingOptions = {}) {
  const { initialState = false, minDuration = 0 } = options
  
  const isLoading = ref(initialState)
  const progress = ref(0)
  const message = ref('')
  const startTime = ref<number>(0)
  
  const loadingText = computed(() => {
    if (message.value) return message.value
    return isLoading.value ? '加载中...' : ''
  })
  
  async function start(msg?: string) {
    isLoading.value = true
    progress.value = 0
    message.value = msg || ''
    startTime.value = Date.now()
  }
  
  async function stop() {
    // 确保最小加载时间，避免闪烁
    const elapsed = Date.now() - startTime.value
    const remaining = minDuration - elapsed
    
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining))
    }
    
    isLoading.value = false
    progress.value = 0
    message.value = ''
  }
  
  function updateProgress(value: number, msg?: string) {
    progress.value = Math.min(100, Math.max(0, value))
    if (msg) message.value = msg
  }
  
  function setMessage(msg: string) {
    message.value = msg
  }
  
  return {
    isLoading,
    progress,
    message,
    loadingText,
    start,
    stop,
    updateProgress,
    setMessage
  }
}
