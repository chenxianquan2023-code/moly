import { ref, watch } from 'vue'

interface DebounceOptions {
  delay?: number
  immediate?: boolean
}

export function useDebounce<T>(value: T, options: DebounceOptions = {}) {
  const { delay = 300, immediate = false } = options
  
  const debouncedValue = ref(value)
  const timeoutId = ref<ReturnType<typeof setTimeout> | null>(null)
  
  watch(
    () => value,
    (newValue) => {
      if (timeoutId.value) {
        clearTimeout(timeoutId.value)
      }
      
      if (immediate && !timeoutId.value) {
        debouncedValue.value = newValue
      }
      
      timeoutId.value = setTimeout(() => {
        debouncedValue.value = newValue
        timeoutId.value = null
      }, delay)
    },
    { immediate }
  )
  
  return debouncedValue
}

export function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}
