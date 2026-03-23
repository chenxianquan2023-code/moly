/**
 * 工作流配置类型定义
 */

import type { Component } from 'vue';
import type { FieldConfig } from './field';
import type { WorkflowService } from '../base/WorkflowService';

/**
 * 输入面板配置
 */
export interface InputPanelConfig {
    sections: Array<{
        id: string;
        title: string;
        field: FieldConfig;
    }>;
}

/**
 * 配置面板组
 */
export interface ConfigGroup {
    id: string;
    title?: string;
    fields: FieldConfig[];
}

/**
 * 配置面板配置
 */
export interface ConfigPanelConfig {
    title: string;
    subtitle: string;
    executeButton: {
        text: string;
        icon?: string;
    };
    groups: ConfigGroup[];
}

/**
 * 画布节点
 */
export interface CanvasNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, any>;
}

/**
 * 画布连线
 */
export interface CanvasEdge {
    id: string;
    source: string;
    target: string;
    animated?: boolean;
    style?: Record<string, any>;
}

/**
 * 画布配置
 */
export interface CanvasConfig {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    fitView?: boolean;
}

/**
 * 完整工作流配置
 */
export interface WorkflowConfig {
    // 基础信息
    id: string;
    name: string;
    description?: string;
    icon?: string;

    // 面板配置（使用通用组件）
    inputPanel: InputPanelConfig;
    configPanel: ConfigPanelConfig;
    canvas: CanvasConfig;

    // 业务服务类
    service: typeof WorkflowService;

    // 自定义组件（可选，用于完全自定义的场景）
    customComponents?: {
        inputPanel?: Component;
        configPanel?: Component;
    };
}
