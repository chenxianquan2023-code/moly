<template>
  <div class="workflow-page" v-if="workflow">
    <!-- Header -->
    <WorkflowHeader :workflow-name="workflow.name" />
    
    <!-- Main Content -->
    <div class="workflow-body">
      <!-- Left Panel: Input -->
      <component 
        :is="workflow.customComponents?.inputPanel || GenericInputPanel"
        v-bind="inputPanelProps"
        ref="inputPanelRef"
        @change="handleInputChange"
      />
      
      <!-- Center: Canvas -->
      <WorkflowCanvas
        :nodes="canvasNodes"
        :edges="canvasEdges"
        ref="canvasRef"
      />
      
      <!-- Right Panel: Config -->
      <component
        :is="workflow.customComponents?.configPanel || GenericConfigPanel"
        v-bind="configPanelProps"
        ref="configPanelRef"
        @change="handleConfigChange"
        @execute="handleExecute"
      />
    </div>
  </div>
  <div v-else class="loading-container">
    <div class="loading-spinner"></div>
    <p>加载工作流配置...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { workflowRegistry } from '@/workflows/registry';
import WorkflowHeader from '@/workflows/components/WorkflowHeader.vue';
import WorkflowCanvas from '@/workflows/components/WorkflowCanvas.vue';
import GenericInputPanel from '@/workflows/components/GenericInputPanel.vue';
import GenericConfigPanel from '@/workflows/components/GenericConfigPanel.vue';
import type { WorkflowConfig } from '@/workflows/types/config';
import type { Node, Edge } from '@vue-flow/core';

const route = useRoute();

const workflow = ref<WorkflowConfig | null>(null);
const workflowService = ref<any>(null);

const inputPanelRef = ref();
const configPanelRef = ref();
const canvasRef = ref();

const canvasNodes = ref<Node[]>([]);
const canvasEdges = ref<Edge[]>([]);

// Load workflow configuration
onMounted(async () => {
  try {
    const workflowType = route.params.workflowType as string;
    
    // Load workflow config from registry
    workflow.value = await workflowRegistry.getWorkflow(workflowType);
    
    // Initialize service
    const ServiceClass = workflow.value.service as any;
    workflowService.value = new ServiceClass();
    
    // Setup progress callback
    workflowService.value.setProgressCallback((progress: number, msg?: string) => {
      console.log(`Progress: ${progress}% - ${msg || ''}`);
      // Could update UI here
    });
    
    // Initialize canvas
    canvasNodes.value = [...workflow.value.canvas.nodes];
    canvasEdges.value = [...workflow.value.canvas.edges];
    
    // Fit view after a short delay
    setTimeout(() => {
      canvasRef.value?.fitView();
    }, 100);
    
  } catch (error) {
    console.error('Failed to load workflow:', error);
    message.error('工作流加载失败');
  }
});

// Computed input panel props (reactive)
const inputPanelProps = computed(() => {
  if (!workflow.value) return {};
  
  // If using custom component, pass the whole config and current mode
  if (workflow.value.customComponents?.inputPanel) {
    return { 
      workflow: workflow.value,
      mode: currentConfig.value.mode || 'decompose'
    };
  }
  
  // Otherwise use generic panel config
  return {
    sections: workflow.value.inputPanel.sections
  };
});

const currentConfig = ref<Record<string, any>>({ mode: 'decompose' });
const currentInput = ref<Record<string, any>>({});

// Computed config panel props (reactive)
const configPanelProps = computed(() => {
  if (!workflow.value) return {};
  
  // Read real-time data
  const product = currentInput.value.product;
  const scene = currentInput.value.scene;
  const mode = currentConfig.value.mode || 'decompose';
  
  let canGenerate = false;
  
  if (mode === 'promotion') {
    // In promotion mode, only product is required
    canGenerate = !!product;
  } else {
    // In other modes, both are required
    canGenerate = !!(product && scene);
  }
  
  // If using custom component, pass workflow and canGenerate
  if (workflow.value.customComponents?.configPanel) {
    return { 
      workflow: workflow.value,
      canGenerate 
    };
  }
  
  // Otherwise use generic panel config
  return {
    title: workflow.value.configPanel.title,
    subtitle: workflow.value.configPanel.subtitle,
    groups: workflow.value.configPanel.groups,
    executeButton: workflow.value.configPanel.executeButton
  };
});

// Handle input data change
const handleInputChange = (data: Record<string, any>) => {
  console.log('[GenericWorkflowView] Input changed:', data);
  currentInput.value = data;
  // Update canvas nodes if needed
  updateCanvasFromInput(data);
};

// Handle config change
const handleConfigChange = (configData: Record<string, any>) => {
  console.log('[GenericWorkflowView] Config changed:', configData);
  currentConfig.value = configData;
};

// Handle workflow execution
const handleExecute = async (_config: Record<string, any>) => {
  if (!workflowService.value || !inputPanelRef.value || !configPanelRef.value) {
    return;
  }
  
  try {
    // Validate inputs
    const isValid = inputPanelRef.value.validate?.();
    if (isValid === false) {
      message.warning('请检查输入');
      return;
    }
    
    // Get data
    const inputData = inputPanelRef.value.getData?.() || {};
    const configData = configPanelRef.value.getData?.() || {};
    
    // Set executing state
    configPanelRef.value.setExecuting?.(true);
    
    // Set loading on result node
    updateResultNode({ loading: true });
    
    // Execute workflow
    const result = await workflowService.value.execute({
      workflowId: workflow.value!.id,
      inputData,
      configData
    });
    
    if (result.success) {
      message.success('生成成功！');
      // Update result node
      updateResultNode(result.data);
    } else {
      message.error(result.error?.message || '生成失败');
      // Clear loading on failure
      updateResultNode({ loading: false });
    }
    
  } catch (error: any) {
    console.error('Execution failed:', error);
    message.error(error.message || '执行失败');
    // Clear loading on error
    updateResultNode({ loading: false });
  } finally {
    configPanelRef.value?.setExecuting?.(false);
  }
};

// Update canvas nodes from input data
const updateCanvasFromInput = (inputData: Record<string, any>) => {
  // Update image nodes based on input
  Object.keys(inputData).forEach(key => {
    const nodeIndex = canvasNodes.value.findIndex(n => n.id === key);
    if (nodeIndex !== -1) {
      if (canvasNodes.value[nodeIndex]) {
        canvasNodes.value[nodeIndex].data.imageUrl = inputData[key];
      }
    }
  });
};

// Update result node with generated data
const updateResultNode = (resultData: any) => {
  const resultNode = canvasNodes.value.find(n => n.id === 'result');
  if (resultNode) {
    // Update loading state
    if (resultData.loading !== undefined) {
      resultNode.data.loading = resultData.loading;
    }
    
    // Update imageUrl if present
    if (resultData.imageUrl) {
      resultNode.data.imageUrl = resultData.imageUrl;
      resultNode.data.videoUrl = null; // Clear video when showing image
      resultNode.data.loading = false; // Stop loading when content is ready
    }
    // Update videoUrl if present
    if (resultData.videoUrl) {
      resultNode.data.videoUrl = resultData.videoUrl;
      resultNode.data.imageUrl = null; // Clear image when showing video
      resultNode.data.loading = false; // Stop loading when content is ready
    }
    console.log('[GenericWorkflowView] Result node updated:', resultNode.data);
  }
};
</script>

<style scoped lang="scss">
.workflow-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0a0a0a;
  overflow: hidden;
}

.workflow-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.loading-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  color: rgba(255, 255, 255, 0.7);
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
