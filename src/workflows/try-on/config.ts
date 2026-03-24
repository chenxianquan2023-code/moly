/**
 * Try-On Workflow Configuration
 * AI电商虚拟试穿工作流
 */

import { TryOnWorkflowService } from './service';
import type { WorkflowConfig } from '../types/config';
import TryOnInputPanel from './components/TryOnInputPanel.vue';

export const tryOnWorkflowConfig: WorkflowConfig = {
    // ========== 基础信息 ==========
    id: 'try-on',
    name: 'AI 电商虚拟试穿',
    description: '让模特穿上任意服装，生成逼真的虚拟试穿效果',
    icon: 'SkinOutlined',

    // ========== 业务服务 ==========
    service: TryOnWorkflowService,

    // ========== 使用自定义输入面板 ==========
    customComponents: {
        inputPanel: TryOnInputPanel
    },

    // ========== 左侧输入面板配置（自定义组件会忽略此配置，但保留用于文档） ==========
    inputPanel: {
        sections: [
            {
                id: 'model',
                title: '1. 模特图输入',
                field: {
                    id: 'model-image',
                    type: 'image-upload',
                    required: true,
                    props: {
                        accept: 'image/*',
                        placeholder: '点击上传模特'
                    }
                }
            },
            {
                id: 'garment',
                title: '2. 服装图输入',
                field: {
                    id: 'garment-image',
                    type: 'image-upload',
                    required: true,
                    props: {
                        accept: 'image/*',
                        placeholder: '点击上传服装'
                    }
                }
            }
        ]
    },

    // ========== 右侧配置面板 ==========
    configPanel: {
        title: '生成配置',
        subtitle: '配置 Moly 融合参数',
        executeButton: {
            text: '生成虚拟试穿',
            icon: 'ExperimentOutlined'
        },
        groups: [
            // 顶部：动作描述（不分组）
            {
                id: 'action-desc',
                fields: [
                    {
                        id: 'actionText',
                        type: 'textarea',
                        label: '模特动作描述',
                        defaultValue: '潇洒自信，眼神凝视镜头',
                        props: {
                            rows: 2,
                            placeholder: '描述您希望的模特动作，如：潇洒自信，眼神凝视镜头'
                        }
                    }
                ]
            },

            // 分组1：图片设置
            {
                id: 'image-settings',
                title: '图片设置',
                fields: [
                    {
                        id: 'aspectRatio',
                        type: 'select',
                        label: '图片比例',
                        defaultValue: '3:4',
                        props: {
                            options: [
                                { label: '1:1 正方形', value: '1:1' },
                                { label: '3:4 竖版', value: '3:4' },
                                { label: '4:3 横版', value: '4:3' },
                                { label: '16:9 宽屏', value: '16:9' },
                                { label: '9:16 手机竖屏', value: '9:16' }
                            ]
                        }
                    },
                    {
                        id: 'imageSize',
                        type: 'select',
                        label: '图片质量',
                        defaultValue: '2K',
                        props: {
                            options: [
                                { label: '1K 标准', value: '1K' },
                                { label: '2K 高清', value: '2K' },
                                { label: '4K 超清', value: '4K' }
                            ]
                        }
                    },
                    {
                        id: 'temperature',
                        type: 'slider',
                        label: '创意程度',
                        defaultValue: 0.7,
                        props: {
                            min: 0.1,
                            max: 1.5,
                            step: 0.1,
                            showValue: true
                        }
                    }
                ]
            },

            // 分组2：摄影风格
            {
                id: 'photo-style',
                title: '摄影风格',
                fields: [
                    {
                        id: 'photoStyle',
                        type: 'select',
                        label: '风格类型',
                        defaultValue: 'realistic',
                        props: {
                            options: [
                                { label: '写实摄影', value: 'realistic' },
                                { label: '时尚大片', value: 'fashion' },
                                { label: '街拍风格', value: 'street' },
                                { label: '商业广告风', value: 'commercial' }
                            ]
                        }
                    },
                    {
                        id: 'lensView',
                        type: 'select',
                        label: '镜头视角',
                        defaultValue: 'half',
                        props: {
                            options: [
                                { label: '特写', value: 'closeup' },
                                { label: '半身', value: 'half' },
                                { label: '全身', value: 'full' },
                                { label: '远景', value: 'distant' }
                            ]
                        }
                    },
                    {
                        id: 'cameraAngle',
                        type: 'select',
                        label: '拍摄角度',
                        defaultValue: 'eye',
                        props: {
                            options: [
                                { label: '平视', value: 'eye' },
                                { label: '俯拍', value: 'high' },
                                { label: '仰拍', value: 'low' },
                                { label: '45度角', value: '45deg' }
                            ]
                        }
                    }
                ]
            },

            // 分组3：背景设置
            {
                id: 'background-settings',
                title: '背景设置',
                fields: [
                    {
                        id: 'bgType',
                        type: 'select',
                        label: '背景类型',
                        defaultValue: 'original',
                        props: {
                            options: [
                                { label: '保持原背景', value: 'original' },
                                { label: '纯色背景', value: 'solid' },
                                { label: '室内场景', value: 'indoor' },
                                { label: '户外街道', value: 'outdoor' },
                                { label: '自然风景', value: 'nature' }
                            ]
                        }
                    },
                    {
                        id: 'bgBlur',
                        type: 'select',
                        label: '背景模糊',
                        defaultValue: 'none',
                        props: {
                            options: [
                                { label: '清晰背景', value: 'none' },
                                { label: '轻微虚化', value: 'light' },
                                { label: '大光圈虚化', value: 'heavy' }
                            ]
                        }
                    }
                    // Note: lighting toggle will be handled separately in custom config panel
                ]
            }
        ]
    },

    // ========== 中间画布配置 ==========
    canvas: {
        fitView: true,
        nodes: [
            {
                id: 'model',
                type: 'image',
                position: { x: 50, y: 220 },
                data: { title: '上传模特图', imageUrl: null }
            },
            {
                id: 'garment',
                type: 'image',
                position: { x: 50, y: 580 },
                data: { title: '上传衣服图（只有衣服）', imageUrl: null }
            },
            {
                id: 'generated',
                type: 'text',
                position: { x: 380, y: 20 },
                data: {
                    title: '已设定好',
                    content: '请上传模特图和服装图...',
                    editable: false,
                    tall: true
                }
            },
            {
                id: 'result',
                type: 'image',
                position: { x: 700, y: 380 },
                data: { title: '成果图', imageUrl: null }
            }
        ],
        edges: [
            {
                id: 'e2',
                source: 'model',
                target: 'generated',
                style: { stroke: '#52525b', strokeWidth: 3 }
            },
            {
                id: 'e3',
                source: 'model',
                target: 'result',
                style: { stroke: '#52525b', strokeWidth: 3 }
            },
            {
                id: 'e4',
                source: 'garment',
                target: 'generated',
                style: { stroke: '#52525b', strokeWidth: 3 }
            },
            {
                id: 'e5',
                source: 'garment',
                target: 'result',
                style: { stroke: '#52525b', strokeWidth: 3 }
            },
            {
                id: 'e6',
                source: 'generated',
                target: 'result',
                style: { stroke: '#52525b', strokeWidth: 3 }
            }
        ]
    }
};

export default tryOnWorkflowConfig;
