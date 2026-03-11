import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ToolDefinition } from '@/types/ai.types';

export const useToolStore = defineStore('tool', () => {
  // State
  const tools = ref<ToolDefinition[]>([
    {
      id: 'virtual-try-on',
      name: 'AI模特试穿',
      description: '上传服装平铺图，自动生成真人模特上身图',
      icon: '👗',
      category: 'tryon',
      inputTypes: ['image'],
      outputTypes: ['image'],
      exampleImages: {
        before: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop'
      }
    },
    {
      id: 'scene-generation',
      name: 'AI商品场景图',
      description: '上传商品白底图，自动生成场景展示图',
      icon: '🏞️',
      category: 'scene',
      inputTypes: ['image'],
      outputTypes: ['image'],
      exampleImages: {
        before: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=400&auto=format&fit=crop'
      }
    },
    {
      id: 'face-swap',
      name: 'AI模特换脸',
      description: '保持姿势换模特，快速生成不同人种模特图',
      icon: '👤',
      category: 'tryon',
      inputTypes: ['image'],
      outputTypes: ['image'],
      exampleImages: {
        before: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop'
      }
    },
    {
      id: 'detail-enhance',
      name: 'AI细节增强',
      description: '提升图片清晰度，优化面部和材质细节',
      icon: '✨',
      category: 'enhance',
      inputTypes: ['image'],
      outputTypes: ['image'],
      exampleImages: {
        before: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=30&w=400&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=90&w=400&auto=format&fit=crop'
      }
    },
    {
      id: 'background-replace',
      name: 'AI背景替换',
      description: '智能抠图，一键替换背景',
      icon: '🖼️',
      category: 'utility',
      inputTypes: ['image'],
      outputTypes: ['image'],
      exampleImages: {
        before: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=400&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop'
      }
    },
    {
      id: 'upscale',
      name: 'AI图片放大',
      description: '2x/4x超分辨率放大，保持细节清晰',
      icon: '🔍',
      category: 'enhance',
      inputTypes: ['image'],
      outputTypes: ['image'],
      exampleImages: {
        before: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=30&w=400&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=90&w=400&auto=format&fit=crop'
      }
    },
    {
      id: 'shoe-try-on',
      name: 'AI试鞋',
      description: '鞋子虚拟试穿，展示上脚效果',
      icon: '👟',
      category: 'tryon',
      inputTypes: ['image'],
      outputTypes: ['image'],
      exampleImages: {
        before: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=400&auto=format&fit=crop'
      }
    },
    {
      id: 'hand-product',
      name: 'AI手持商品',
      description: '生成模特手持商品的展示图',
      icon: '🤳',
      category: 'scene',
      inputTypes: ['image'],
      outputTypes: ['image'],
      exampleImages: {
        before: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=400&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1583391730485-32a294f2a441?q=80&w=400&auto=format&fit=crop'
      }
    },
    {
      id: 'model-bg-replace',
      name: '模特换背景',
      description: '保留模特，更换背景场景',
      icon: '📸',
      category: 'scene',
      inputTypes: ['image'],
      outputTypes: ['image'],
      exampleImages: {
        before: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=400&auto=format&fit=crop'
      }
    },
    {
      id: 'cutout-white-bg',
      name: '智能抠图',
      description: '自动抠图生成白底图',
      icon: '✂️',
      category: 'utility',
      inputTypes: ['image'],
      outputTypes: ['image'],
      exampleImages: {
        before: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop'
      }
    },
    {
      id: 'ai-shadow',
      name: 'AI阴影生成',
      description: '自动添加自然阴影效果',
      icon: '☁️',
      category: 'utility',
      inputTypes: ['image'],
      outputTypes: ['image'],
      exampleImages: {
        before: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=400&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=400&auto=format&fit=crop'
      }
    }
  ]);
  
  const selectedTool = ref<ToolDefinition | null>(null);
  const isLoading = ref(false);

  // Getters
  const allTools = computed(() => tools.value);
  
  const toolsByCategory = computed(() => {
    const grouped = new Map<string, ToolDefinition[]>();
    
    tools.value.forEach(tool => {
      const list = grouped.get(tool.category) || [];
      list.push(tool);
      grouped.set(tool.category, list);
    });
    
    return grouped;
  });

  const tryOnTools = computed(() => tools.value.filter(t => t.category === 'tryon'));
  const sceneTools = computed(() => tools.value.filter(t => t.category === 'scene'));
  const enhanceTools = computed(() => tools.value.filter(t => t.category === 'enhance'));
  const utilityTools = computed(() => tools.value.filter(t => t.category === 'utility'));

  // Actions
  function selectTool(toolId: string): ToolDefinition | null {
    const tool = tools.value.find(t => t.id === toolId);
    selectedTool.value = tool || null;
    return selectedTool.value;
  }

  function clearSelection() {
    selectedTool.value = null;
  }

  function getToolById(id: string): ToolDefinition | undefined {
    return tools.value.find(t => t.id === id);
  }

  function getToolsByCategory(category: string): ToolDefinition[] {
    return tools.value.filter(t => t.category === category);
  }

  return {
    // State
    tools,
    selectedTool,
    isLoading,
    
    // Getters
    allTools,
    toolsByCategory,
    tryOnTools,
    sceneTools,
    enhanceTools,
    utilityTools,
    
    // Actions
    selectTool,
    clearSelection,
    getToolById,
    getToolsByCategory
  };
});
