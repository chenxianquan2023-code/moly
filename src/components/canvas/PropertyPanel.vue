<template>
  <div class="property-panel">
    <div class="panel-header">Properties</div>
    <div class="panel-content" v-if="activeObject">
      <a-form layout="vertical">
        <a-form-item label="Type">
          <a-tag color="blue">{{ activeObject.type }}</a-tag>
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Left">
              <a-input-number v-model:value="props.left" @change="updateProp('left', $event)" />
            </a-form-item>
          </a-col>
           <a-col :span="12">
            <a-form-item label="Top">
              <a-input-number v-model:value="props.top" @change="updateProp('top', $event)" />
            </a-form-item>
          </a-col>
        </a-row>

         <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Width">
              <a-input-number v-model:value="props.width" @change="updateProp('width', $event)" />
            </a-form-item>
          </a-col>
           <a-col :span="12">
            <a-form-item label="Opacity">
              <a-slider v-model:value="props.opacity" :min="0" :max="1" :step="0.1" @change="updateProp('opacity', $event)" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="Fill Color" v-if="props.fill">
           <a-input type="color" v-model:value="props.fill" @change="updateProp('fill', $event)" style="width: 100%"/>
        </a-form-item>

      </a-form>
    </div>
    <div class="empty-state" v-else>
      <div class="empty-icon">Select an object</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useCanvasStore } from '../../stores/canvas';

const store = useCanvasStore();
const activeObject = computed(() => store.activeObject);

const props = ref<any>({});

// Watch for selection changes to update local reactive props
watch(activeObject, (newObj) => {
  if (newObj) {
    props.value = {
      left: Math.round(newObj.left || 0),
      top: Math.round(newObj.top || 0),
      width: Math.round(newObj.width || 0),
      opacity: newObj.opacity ?? 1,
      fill: typeof newObj.fill === 'string' ? newObj.fill : '#000000',
      type: newObj.type
    };
  } else {
    props.value = {};
  }
});

const updateProp = (key: string, value: any) => {
  if (store.canvasInstance && activeObject.value) {
    activeObject.value.set(key, value);
    // Needed for scaling via width/height to work properly in Fabric sometimes
    if (key === 'width') {
        activeObject.value.setCoords();
    }
    store.canvasInstance.renderAll();
  }
};
</script>

<style scoped lang="scss">
.property-panel {
  width: 280px;
  background-color: #ffffff;
  border-left: 1px solid #E5E7EB;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  height: 40px;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-weight: bold;
  font-size: 14px;
  color: #111827;
}

.panel-content {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  font-size: 14px;
}
</style>
