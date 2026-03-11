import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';

export const useCanvasStore = defineStore('canvas', () => {
    // Use shallowRef for non-reactive complex objects like Fabric Canvas instance
    // to improve performance.
    const canvasInstance = shallowRef<any | null>(null);
    const activeObject = ref<any | null>(null);

    function setCanvas(canvas: any) {
        canvasInstance.value = canvas;
    }

    function setActiveObject(obj: any) {
        activeObject.value = obj;
    }

    return {
        canvasInstance,
        activeObject,
        setCanvas,
        setActiveObject,
    };
});
