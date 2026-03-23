/**
 * 商品营销物料工作流配置
 */

import { MarketingWorkflowService } from './service';
import type { WorkflowConfig } from '../types/config';
import MarketingInputPanel from './components/MarketingInputPanel.vue';
import MarketingConfigPanel from './components/MarketingConfigPanel.vue';

export const marketingWorkflowConfig: WorkflowConfig = {
    // ========== 基础信息 ==========
    id: 'marketing',
    name: '商品营销物料工厂',
    description: 'AI生成商品营销素材',
    icon: 'FireOutlined',

    // ========== 业务服务 ==========
    service: MarketingWorkflowService,

    // ========== 使用自定义组件 ==========
    customComponents: {
        inputPanel: MarketingInputPanel,
        configPanel: MarketingConfigPanel
    },

    // ========== 左侧输入面板配置（文档用途，实际使用自定义组件） ==========
    inputPanel: {
        sections: [
            {
                id: 'product',
                title: '1. 商品图输入',
                field: {
                    id: 'product-image',
                    type: 'image-upload',
                    required: true,
                    props: {
                        accept: 'image/*',
                        placeholder: '点击上传商品'
                    }
                }
            },
            {
                id: 'scene',
                title: '2. 设计素材输入',
                field: {
                    id: 'scene-image',
                    type: 'image-upload',
                    required: true,
                    props: {
                        accept: 'image/*',
                        placeholder: '点击上传场景'
                    }
                }
            }
        ]
    },

    // ========== 右侧配置面板（文档用途，实际使用自定义组件） ==========
    configPanel: {
        title: '营销物料配置',
        subtitle: 'AI 生成商品营销素材',
        executeButton: {
            text: '生成营销物料',
            icon: 'ExperimentOutlined'
        },
        groups: [
            {
                id: 'mode',
                title: '功能模式',
                fields: [
                    {
                        id: 'mode',
                        type: 'select',
                        label: '生成模式',
                        defaultValue: 'decompose',
                        props: {
                            options: [
                                { label: '全能分解', value: 'decompose' },
                                { label: '文创周边生成', value: 'creative' },
                                { label: '爆款折扣促销海报', value: 'promotion' }
                            ]
                        }
                    }
                ]
            },
            {
                id: 'prompt',
                fields: [
                    {
                        id: 'prompt',
                        type: 'textarea',
                        label: '生成提示词',
                        defaultValue: '',
                        props: {
                            rows: 6,
                            placeholder: '描述您想要生成的营销物料效果...'
                        }
                    }
                ]
            }
        ]
    },

    // ========== 中间画布配置 ==========
    canvas: {
        fitView: true,
        nodes: [
            {
                id: 'product',
                type: 'image',
                position: { x: 50, y: 150 },
                data: {
                    title: '●上传商品图',
                    imageUrl: null
                }
            },
            {
                id: 'scene',
                type: 'image',
                position: { x: 50, y: 450 },
                data: {
                    title: '●上传设计素材',
                    imageUrl: null
                }
            },
            {
                id: 'result',
                type: 'image',
                position: { x: 600, y: 300 },
                data: {
                    title: '●成果图',
                    imageUrl: null,
                    videoUrl: null  // 支持视频
                }
            }
        ],
        edges: [
            {
                id: 'e1',
                source: 'product',
                target: 'result',
                style: { stroke: '#52525b', strokeWidth: 3 }
            },
            {
                id: 'e2',
                source: 'scene',
                target: 'result',
                style: { stroke: '#52525b', strokeWidth: 3 }
            }
        ]
    }
};

export default marketingWorkflowConfig;
