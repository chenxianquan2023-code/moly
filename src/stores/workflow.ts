import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  WorkflowDefinition, 
  WorkflowExecutionResult,
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeStatus
} from '@/types/ai.types';

const STORAGE_KEY = 'omni_gen_workflows';

interface StoredWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  version: string;
  createdAt: string;
  updatedAt: string;
}

function loadStoredWorkflows(): StoredWorkflow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useWorkflowStore = defineStore('workflow', () => {
  // State
  const workflows = ref<WorkflowDefinition[]>(loadStoredWorkflows());
  const currentWorkflow = ref<WorkflowDefinition | null>(null);
  const isExecuting = ref(false);
  const executionProgress = ref(0);
  const executionMessage = ref('');
  const lastResult = ref<WorkflowExecutionResult | null>(null);

  // Getters
  const workflowList = computed(() => workflows.value);
  
  const currentNodes = computed(() => currentWorkflow.value?.nodes || []);
  const currentEdges = computed(() => currentWorkflow.value?.edges || []);
  
  const hasUnsavedChanges = computed(() => {
    if (!currentWorkflow.value) return false;
    const stored = workflows.value.find(w => w.id === currentWorkflow.value!.id);
    if (!stored) return true;
    return JSON.stringify(stored) !== JSON.stringify(currentWorkflow.value);
  });

  const isValid = computed(() => {
    if (!currentWorkflow.value) return false;
    const nodes = currentWorkflow.value.nodes;
    const edges = currentWorkflow.value.edges;
    
    // 必须有输入和输出节点
    const hasInput = nodes.some(n => n.type === 'input');
    const hasOutput = nodes.some(n => n.type === 'output');
    
    // 检查循环依赖
    try {
      checkCircularDependency(nodes, edges);
    } catch {
      return false;
    }
    
    return hasInput && hasOutput && nodes.length > 0;
  });

  // Actions
  function createWorkflow(name: string, description?: string): WorkflowDefinition {
    const workflow: WorkflowDefinition = {
      id: generateId(),
      name,
      description,
      nodes: [],
      edges: [],
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    workflows.value.push(workflow);
    currentWorkflow.value = workflow;
    saveWorkflows();
    
    return workflow;
  }

  function loadWorkflow(id: string): WorkflowDefinition | null {
    const workflow = workflows.value.find(w => w.id === id);
    if (workflow) {
      currentWorkflow.value = { ...workflow };
      return currentWorkflow.value;
    }
    return null;
  }

  function saveCurrentWorkflow(): boolean {
    if (!currentWorkflow.value) return false;
    
    currentWorkflow.value.updatedAt = new Date().toISOString();
    
    const index = workflows.value.findIndex(w => w.id === currentWorkflow.value!.id);
    if (index >= 0) {
      workflows.value[index] = { ...currentWorkflow.value };
    } else {
      workflows.value.push({ ...currentWorkflow.value });
    }
    
    saveWorkflows();
    return true;
  }

  function deleteWorkflow(id: string): boolean {
    const index = workflows.value.findIndex(w => w.id === id);
    if (index >= 0) {
      workflows.value.splice(index, 1);
      saveWorkflows();
      
      if (currentWorkflow.value?.id === id) {
        currentWorkflow.value = null;
      }
      
      return true;
    }
    return false;
  }

  // 节点操作
  function addNode(node: Omit<WorkflowNode, 'id'>): WorkflowNode {
    if (!currentWorkflow.value) {
      throw new Error('No workflow loaded');
    }
    
    const newNode: WorkflowNode = {
      ...node,
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending'
    };
    
    currentWorkflow.value.nodes.push(newNode);
    return newNode;
  }

  function updateNode(id: string, updates: Partial<WorkflowNode>): boolean {
    if (!currentWorkflow.value) return false;
    
    const node = currentWorkflow.value.nodes.find(n => n.id === id);
    if (node) {
      Object.assign(node, updates);
      return true;
    }
    return false;
  }

  function removeNode(id: string): boolean {
    if (!currentWorkflow.value) return false;
    
    const index = currentWorkflow.value.nodes.findIndex(n => n.id === id);
    if (index >= 0) {
      currentWorkflow.value.nodes.splice(index, 1);
      
      // 删除相关的边
      currentWorkflow.value.edges = currentWorkflow.value.edges.filter(
        e => e.from !== id && e.to !== id
      );
      
      return true;
    }
    return false;
  }

  // 边操作
  function addEdge(edge: Omit<WorkflowEdge, 'id'>): WorkflowEdge {
    if (!currentWorkflow.value) {
      throw new Error('No workflow loaded');
    }
    
    const newEdge: WorkflowEdge = {
      ...edge,
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    currentWorkflow.value.edges.push(newEdge);
    return newEdge;
  }

  function removeEdge(id: string): boolean {
    if (!currentWorkflow.value) return false;
    
    const index = currentWorkflow.value.edges.findIndex(e => e.id === id);
    if (index >= 0) {
      currentWorkflow.value.edges.splice(index, 1);
      return true;
    }
    return false;
  }

  // 执行状态更新
  function updateExecutionProgress(progress: number, message: string) {
    executionProgress.value = progress;
    executionMessage.value = message;
  }

  function setNodeStatus(nodeId: string, status: WorkflowNodeStatus, output?: any, error?: string) {
    if (!currentWorkflow.value) return;
    
    const node = currentWorkflow.value.nodes.find(n => n.id === nodeId);
    if (node) {
      node.status = status;
      if (output !== undefined) node.outputs = { result: output };
      if (error !== undefined) node.error = error;
    }
  }

  function resetNodeStatuses() {
    if (!currentWorkflow.value) return;
    
    currentWorkflow.value.nodes.forEach(node => {
      node.status = 'pending';
      node.outputs = undefined;
      node.error = undefined;
    });
  }

  // 持久化
  function saveWorkflows() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows.value));
    } catch (error) {
      console.error('[WorkflowStore] Save error:', error);
    }
  }

  // 辅助函数
  function generateId(): string {
    return `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function checkCircularDependency(nodes: WorkflowNode[], edges: WorkflowEdge[]): void {
    const graph = new Map<string, Set<string>>();
    
    nodes.forEach(node => graph.set(node.id, new Set()));
    edges.forEach(edge => {
      const neighbors = graph.get(edge.from);
      if (neighbors) neighbors.add(edge.to);
    });
    
    const visited = new Set<string>();
    const recStack = new Set<string>();
    
    function hasCycle(nodeId: string): boolean {
      visited.add(nodeId);
      recStack.add(nodeId);
      
      const neighbors = graph.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
      
      recStack.delete(nodeId);
      return false;
    }
    
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) {
          throw new Error('Circular dependency detected');
        }
      }
    }
  }

  return {
    // State
    workflows,
    currentWorkflow,
    isExecuting,
    executionProgress,
    executionMessage,
    lastResult,
    
    // Getters
    workflowList,
    currentNodes,
    currentEdges,
    hasUnsavedChanges,
    isValid,
    
    // Actions
    createWorkflow,
    loadWorkflow,
    saveCurrentWorkflow,
    deleteWorkflow,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    updateExecutionProgress,
    setNodeStatus,
    resetNodeStatuses
  };
});
