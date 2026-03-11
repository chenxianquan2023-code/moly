import { defineAsyncComponent, type Component } from 'vue';

/**
 * 字段组件注册表
 * 使用异步组件以支持按需加载
 */
export const FIELD_COMPONENTS: Record<string, Component> = {
    'image-upload': defineAsyncComponent(() => import('./ImageUpload.vue')),
    'scene-selector': defineAsyncComponent(() => import('./SceneSelector.vue')),
    'select': defineAsyncComponent(() => import('./Select.vue')),
    'slider': defineAsyncComponent(() => import('./Slider.vue')),
    'textarea': defineAsyncComponent(() => import('./Textarea.vue')),
    'color-picker': defineAsyncComponent(() => import('./ColorPicker.vue')),
};

/**
 * 获取字段组件
 * @param type 字段类型
 * @returns Vue Component
 */
export function getFieldComponent(type: string): Component {
    const component = FIELD_COMPONENTS[type];
    if (!component) {
        console.warn(`[FieldComponents] Unknown field type: "${type}", falling back to textarea`);
        return FIELD_COMPONENTS['textarea'] as Component;
    }
    return component;
}

/**
 * 注册自定义字段组件
 * @param type 类型名称
 * @param component 组件
 */
export function registerFieldComponent(type: string, component: Component): void {
    if (FIELD_COMPONENTS[type]) {
        console.warn(`[FieldComponents] Overwriting existing component type: "${type}"`);
    }
    FIELD_COMPONENTS[type] = component;
}
