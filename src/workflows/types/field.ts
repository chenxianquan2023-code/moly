/**
 * 工作流字段组件类型定义
 */

// 基础字段接口
export interface BaseField {
    id: string;
    label?: string;
    description?: string;
    required?: boolean;
    disabled?: boolean;
    defaultValue?: any;
}

// 图片上传字段
export interface ImageUploadField extends BaseField {
    type: 'image-upload';
    props: {
        accept?: string;
        maxSize?: number;
        aspectRatio?: [number, number];
        multiple?: boolean;
        placeholder?: string;
    };
}

// 滑块字段
export interface SliderField extends BaseField {
    type: 'slider';
    props: {
        min: number;
        max: number;
        step?: number;
        showValue?: boolean;
    };
}

// 选择器字段
export interface SelectField extends BaseField {
    type: 'select';
    props: {
        options: Array<{ label: string; value: any; icon?: string }>;
        multiple?: boolean;
    };
}

// 场景选择器字段
export interface SceneSelectorField extends BaseField {
    type: 'scene-selector';
    props: {
        options: Array<{
            id: string;
            name: string;
            thumbnail: string;
            description?: string;
        }>;
        multiple?: boolean;
        max?: number;
    };
}

// 文本域字段
export interface TextareaField extends BaseField {
    type: 'textarea';
    props: {
        rows?: number;
        maxLength?: number;
        placeholder?: string;
    };
}

// 颜色选择器字段
export interface ColorPickerField extends BaseField {
    type: 'color-picker';
    props: {
        presets?: string[];
        showAlpha?: boolean;
    };
}

// 联合类型 - 所有字段类型
export type FieldConfig =
    | ImageUploadField
    | SliderField
    | SelectField
    | SceneSelectorField
    | TextareaField
    | ColorPickerField;

// 字段类型名称
export type FieldType = FieldConfig['type'];
