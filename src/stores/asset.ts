import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ImageInfo, ImageProcessingOptions } from '@/types/ai.types';

const STORAGE_KEY = 'omni_gen_assets';

export interface Asset {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  type: 'model' | 'garment' | 'product' | 'scene' | 'generic';
  category?: string;
  tags: string[];
  width?: number;
  height?: number;
  size: number;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface AssetCategory {
  id: string;
  name: string;
  icon?: string;
  count: number;
}

function loadStoredAssets(): Asset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useAssetStore = defineStore('asset', () => {
  // State
  const assets = ref<Asset[]>(loadStoredAssets());
  const categories = ref<AssetCategory[]>([
    { id: 'all', name: '全部', count: 0 },
    { id: 'default', name: '默认目录', count: 0 },
    { id: 'product', name: '商品图', count: 0 },
    { id: 'model', name: '模特图', count: 0 },
    { id: 'scene', name: '场景图', count: 0 }
  ]);
  const selectedCategory = ref<string>('all');
  const searchQuery = ref('');
  const isUploading = ref(false);
  const uploadProgress = ref(0);

  // Getters
  const filteredAssets = computed(() => {
    let result = assets.value;
    
    // 按分类筛选
    if (selectedCategory.value !== 'all') {
      result = result.filter(a => a.type === selectedCategory.value || a.category === selectedCategory.value);
    }
    
    // 按搜索词筛选
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    
    // 按时间倒序
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  const assetCount = computed(() => assets.value.length);
  
  const recentAssets = computed(() => {
    return assets.value
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
  });

  const popularAssets = computed(() => {
    return assets.value
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
  });

  // Actions
  async function addAsset(
    file: File,
    type: Asset['type'],
    options?: {
      name?: string;
      category?: string;
      tags?: string[];
    }
  ): Promise<Asset> {
    isUploading.value = true;
    uploadProgress.value = 0;
    
    try {
      // 读取文件为 base64
      const base64 = await fileToBase64(file, (progress) => {
        uploadProgress.value = progress;
      });
      
      // 获取图片尺寸
      const dimensions = await getImageDimensions(base64);
      
      const asset: Asset = {
        id: generateId(),
        name: options?.name || file.name,
        url: base64,
        type,
        category: options?.category,
        tags: options?.tags || [],
        width: dimensions.width,
        height: dimensions.height,
        size: file.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      };
      
      assets.value.unshift(asset);
      updateCategoryCounts();
      saveAssets();
      
      return asset;
    } finally {
      isUploading.value = false;
      uploadProgress.value = 0;
    }
  }

  function removeAsset(id: string): boolean {
    const index = assets.value.findIndex(a => a.id === id);
    if (index >= 0) {
      assets.value.splice(index, 1);
      updateCategoryCounts();
      saveAssets();
      return true;
    }
    return false;
  }

  function updateAsset(id: string, updates: Partial<Asset>): boolean {
    const asset = assets.value.find(a => a.id === id);
    if (asset) {
      Object.assign(asset, updates, { updatedAt: new Date().toISOString() });
      updateCategoryCounts();
      saveAssets();
      return true;
    }
    return false;
  }

  function incrementUsage(id: string) {
    const asset = assets.value.find(a => a.id === id);
    if (asset) {
      asset.usageCount++;
      asset.updatedAt = new Date().toISOString();
      saveAssets();
    }
  }

  function setCategory(categoryId: string) {
    selectedCategory.value = categoryId;
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  // 辅助函数
  function updateCategoryCounts() {
    categories.value.forEach(cat => {
      if (cat.id === 'all') {
        cat.count = assets.value.length;
      } else {
        cat.count = assets.value.filter(a => a.type === cat.id || a.category === cat.id).length;
      }
    });
  }

  function saveAssets() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assets.value));
    } catch (error) {
      console.error('[AssetStore] Save error:', error);
    }
  }

  function generateId(): string {
    return `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function fileToBase64(file: File, onProgress?: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = base64;
    });
  }

  // 初始化
  updateCategoryCounts();

  return {
    // State
    assets,
    categories,
    selectedCategory,
    searchQuery,
    isUploading,
    uploadProgress,
    
    // Getters
    filteredAssets,
    assetCount,
    recentAssets,
    popularAssets,
    
    // Actions
    addAsset,
    removeAsset,
    updateAsset,
    incrementUsage,
    setCategory,
    setSearchQuery
  };
});
