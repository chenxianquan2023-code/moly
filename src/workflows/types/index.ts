/**
 * 工作流类型系统统一导出
 */

// 字段类型
export type {
    BaseField,
    ImageUploadField,
    SliderField,
    SelectField,
    SceneSelectorField,
    TextareaField,
    ColorPickerField,
    FieldConfig,
    FieldType
} from './field';

// 配置类型
export type {
    InputPanelConfig,
    ConfigGroup,
    ConfigPanelConfig,
    CanvasNode,
    CanvasEdge,
    CanvasConfig,
    WorkflowConfig
} from './config';

// 服务类型
export type {
    WorkflowExecutionContext,
    WorkflowExecutionResult,
    ProgressCallback
} from './service';

export { WorkflowStatus } from './service';
