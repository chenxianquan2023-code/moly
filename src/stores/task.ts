import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Task {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  inputData?: any;
  outputData?: any;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  pointsCost: number;
}

export const useTaskStore = defineStore('task', () => {
  // State
  const tasks = ref<Task[]>([]);
  const activeTask = ref<Task | null>(null);
  const isProcessing = ref(false);

  // Getters
  const allTasks = computed(() => 
    tasks.value.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  
  const pendingTasks = computed(() => tasks.value.filter(t => t.status === 'pending'));
  const processingTasks = computed(() => tasks.value.filter(t => t.status === 'processing'));
  const completedTasks = computed(() => tasks.value.filter(t => t.status === 'completed'));
  const failedTasks = computed(() => tasks.value.filter(t => t.status === 'failed'));

  const hasActiveTask = computed(() => !!activeTask.value);
  const currentProgress = computed(() => activeTask.value?.progress || 0);
  const currentMessage = computed(() => activeTask.value?.message || '');

  // Actions
  function createTask(type: string, inputData: any, pointsCost: number = 0): Task {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: 'pending',
      progress: 0,
      message: '等待中...',
      inputData,
      createdAt: new Date().toISOString(),
      pointsCost
    };
    
    tasks.value.unshift(task);
    
    // 如果没有活跃任务，设置为活跃
    if (!activeTask.value) {
      activeTask.value = task;
    }
    
    return task;
  }

  function startTask(taskId: string): boolean {
    const task = tasks.value.find(t => t.id === taskId);
    if (task && task.status === 'pending') {
      task.status = 'processing';
      task.startedAt = new Date().toISOString();
      task.message = '处理中...';
      activeTask.value = task;
      isProcessing.value = true;
      return true;
    }
    return false;
  }

  function updateProgress(taskId: string, progress: number, message?: string): boolean {
    const task = tasks.value.find(t => t.id === taskId);
    if (task && task.status === 'processing') {
      task.progress = Math.min(100, Math.max(0, progress));
      if (message) task.message = message;
      
      if (activeTask.value?.id === taskId) {
        activeTask.value = { ...task };
      }
      
      return true;
    }
    return false;
  }

  function completeTask(taskId: string, outputData: any): boolean {
    const task = tasks.value.find(t => t.id === taskId);
    if (task && task.status === 'processing') {
      task.status = 'completed';
      task.progress = 100;
      task.message = '完成';
      task.outputData = outputData;
      task.completedAt = new Date().toISOString();
      
      if (activeTask.value?.id === taskId) {
        activeTask.value = null;
        isProcessing.value = false;
        
        // 自动开始下一个待处理任务
        const nextTask = pendingTasks.value[0];
        if (nextTask) {
          startTask(nextTask.id);
        }
      }
      
      return true;
    }
    return false;
  }

  function failTask(taskId: string, error: string): boolean {
    const task = tasks.value.find(t => t.id === taskId);
    if (task && task.status === 'processing') {
      task.status = 'failed';
      task.error = error;
      task.message = '失败';
      task.completedAt = new Date().toISOString();
      
      if (activeTask.value?.id === taskId) {
        activeTask.value = null;
        isProcessing.value = false;
        
        // 自动开始下一个待处理任务
        const nextTask = pendingTasks.value[0];
        if (nextTask) {
          startTask(nextTask.id);
        }
      }
      
      return true;
    }
    return false;
  }

  function cancelTask(taskId: string): boolean {
    const task = tasks.value.find(t => t.id === taskId);
    if (task && (task.status === 'pending' || task.status === 'processing')) {
      task.status = 'cancelled';
      task.message = '已取消';
      
      if (activeTask.value?.id === taskId) {
        activeTask.value = null;
        isProcessing.value = false;
        
        // 自动开始下一个待处理任务
        const nextTask = pendingTasks.value[0];
        if (nextTask) {
          startTask(nextTask.id);
        }
      }
      
      return true;
    }
    return false;
  }

  function clearCompleted() {
    tasks.value = tasks.value.filter(t => 
      t.status === 'pending' || t.status === 'processing'
    );
  }

  function clearAll() {
    tasks.value = [];
    activeTask.value = null;
    isProcessing.value = false;
  }

  return {
    // State
    tasks,
    activeTask,
    isProcessing,
    
    // Getters
    allTasks,
    pendingTasks,
    processingTasks,
    completedTasks,
    failedTasks,
    hasActiveTask,
    currentProgress,
    currentMessage,
    
    // Actions
    createTask,
    startTask,
    updateProgress,
    completeTask,
    failTask,
    cancelTask,
    clearCompleted,
    clearAll
  };
});
