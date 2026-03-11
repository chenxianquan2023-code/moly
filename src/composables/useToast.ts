import { ref } from 'vue'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function show(message: string, type: Toast['type'] = 'info', duration = 3000) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const toast: Toast = {
      id,
      type,
      message,
      duration
    }
    
    toasts.value.push(toast)
    
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
    
    return id
  }
  
  function success(message: string, duration?: number) {
    return show(message, 'success', duration)
  }
  
  function error(message: string, duration?: number) {
    return show(message, 'error', duration)
  }
  
  function warning(message: string, duration?: number) {
    return show(message, 'warning', duration)
  }
  
  function info(message: string, duration?: number) {
    return show(message, 'info', duration)
  }
  
  function remove(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  function clear() {
    toasts.value = []
  }
  
  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    remove,
    clear
  }
}
