/**
 * AI 配置文件
 * 
 * 注意：生产环境应使用环境变量
 */

import type { AIConfig } from '@/types/ai.types'

// 默认配置
export const AI_CONFIG: AIConfig = {
    // API Key (生产环境应从环境变量读取)
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'sk-2XnZFCYGdomWE3EOieoZZYcwSVEQJgybXjmxIh8PjE5nTVJh',

    // 分析模型 (Flash - 用于图片分析，速度快)
    analysisModel: import.meta.env.VITE_GEMINI_ANALYSIS_MODEL || 'gemini-2.0-flash',

    // 图片生成模型 (Pro - 用于生成成果图，质量高)
    imageModel: import.meta.env.VITE_GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation',

    // 代理地址：优先用环境变量，生产环境走同源 /api/gemini/ 代理避免 CORS
    baseUrl: import.meta.env.VITE_GEMINI_BASE_URL ||
        (typeof window !== 'undefined' ? window.location.origin + '/api/gemini/' : 'https://www.ezmodel.cloud')
}

// 提示词模板
export const PROMPTS = {
    // 分析模特图 - 简洁版本
    analyzeModel: `
请用一句话（70-80字以内）描述这张图片中的人物特征。
格式：图1[性别][发型特征][穿着描述]的[年龄段]
例如：图1深色短发穿着白色T恤的年轻女性
`,

    // 分析服装图 - 简洁版本
    analyzeGarment: `
请用一句话（70-80字以内）描述这件服装。
格式：图2[颜色][材质][款式类型]
例如：图2黑色皮质机车夹克
`,

    // 同时分析两张图片 - 一次调用生成完整提示词
    analyzeBoth: `
请分析这两张图片并生成简洁的描述（总共70-80字以内）：
- 图1是模特照片
- 图2是服装照片

请按以下格式输出：
图1[人物特征]；图2[服装描述]
例如：图1深色短发的年轻女性；图2黑色皮质机车夹克
`,

    // 生成虚拟试穿图
    generateTryOn: (modelDesc: string, garmentDesc: string, action: string, keepBg: boolean, lighting: boolean) => `
请生成一张虚拟试穿效果图：

【模特信息】
${modelDesc}

【服装信息】
${garmentDesc}

【要求】
1. 让模特穿上这件服装
2. 模特动作：${action}
3. ${keepBg ? '保留原始背景' : '可以调整背景使其更协调'}
4. ${lighting ? '增强光影效果，使画面更有质感' : '保持自然光照'}
5. 保证服装细节与原图100%一致
6. 保持模特面部特征不变

请生成一张高质量的虚拟试穿效果图。
`
}

// 动作选项
export const ACTION_OPTIONS = {
    arms_crossed: '双手抱臂，姿态自信',
    standing: '自然站立，双手自然下垂',
    hands_pocket: '双手插兜，休闲随性',
    walking: '行走姿态，自然摆动',
    posing: '摆拍姿势，展示服装'
}

// 分析提示词模板（用于新的原子服务）
export const ANALYSIS_PROMPTS = {
    model: `
请详细描述这张模特图片：
- 人物外貌特征（发型、面部特征、肤色）
- 身材体型
- 当前姿势和表情
- 穿着的现有服装（如有）
- 整体风格

请用简洁的语言描述，用于后续生成参考。
    `,
    garment: `
请详细描述这张服装图片：
- 服装类型（上衣/裤子/裙子等）
- 颜色、材质、图案
- 款式特点（领口、袖型、版型等）
- 细节装饰（纽扣、拉链、口袋等）
- 整体风格

请用简洁的语言描述，用于后续生成参考。
    `,
    product: `
请详细描述这个产品图片：
- 产品类型和用途
- 外观特征（颜色、形状、材质）
- 关键细节和卖点
- 整体风格定位

请用简洁的语言描述。
    `,
    generic: `
请详细描述这张图片的内容，包括：
- 主体是什么
- 外观特征
- 关键细节
- 整体风格

请用简洁的语言描述。
    `,
    tryonPair: `
请分析这两张图片：
- 图1是模特照片，描述人物特征
- 图2是服装照片，描述服装特征

请分别描述，用于虚拟试穿生成。
    `,
    scenePair: `
请分析这两张图片：
- 图1是产品照片
- 图2是场景参考（如有）

请描述产品特征，以及如何将产品融入场景。
    `,
    comparisonPair: `
请对比分析这两张图片的异同点。
    `
}

// 生成提示词模板（用于新的原子服务）
export const GENERATION_PROMPTS = {
    tryon: (
        modelDescription: string,
        garmentDescription: string,
        action: string,
        keepBackground: boolean,
        enhanceLighting: boolean
    ) => `
生成一张高质量的虚拟试穿效果图：

【模特信息】
${modelDescription}

【服装信息】
${garmentDescription}

【动作要求】
${action}

【技术要求】
- 保持模特面部特征和身材比例不变
- 服装细节必须100%还原
- 光影效果自然，符合物理规律
${keepBackground ? '- 保持原背景' : '- 使用合适的背景'}
${enhanceLighting ? '- 增强光影效果，提升质感' : ''}

请生成一张专业电商级别的试穿效果图。
    `,
    scene: (productDescription: string, sceneType: string, style?: string) => `
将以下产品放入指定场景中：

【产品描述】
${productDescription}

【场景要求】
场景类型：${sceneType}
${style ? `风格：${style}` : ''}

要求：
- 产品与场景融合自然
- 光影效果真实
- 适合电商展示
- 高清晰度

请生成一张专业的产品场景图。
    `,
    upscale: (scale: 2 | 4) => `
对这张图片进行 ${scale}x 超分辨率放大：

要求：
- 保持原有细节和纹理
- 修复模糊区域
- 增强清晰度
- 不引入伪影或失真
- 保持原始色彩

请生成一张高清晰度的放大图片。
    `,
    enhance: (aspect: 'face' | 'texture' | 'lighting') => {
        const aspectPrompts = {
            face: '优化面部细节：修复瑕疵、美化肤色、保持自然',
            texture: '优化材质纹理：增强织物细节、提升质感',
            lighting: '优化光影效果：增强立体感、改善曝光'
        }
        return `
对图片进行细节增强：

【优化重点】
${aspectPrompts[aspect]}

要求：
- 效果自然，不过度处理
- 保持原始风格
- 提升专业感

请生成优化后的图片。
        `
    },
    background: (newBackground: string) => `
将图片中的主体保留，替换为以下背景：

【新背景描述】
${newBackground}

要求：
- 主体边缘处理干净
- 与新背景光影一致
- 过渡自然无痕迹
- 高清晰度

请生成替换背景后的图片。
    `
}
