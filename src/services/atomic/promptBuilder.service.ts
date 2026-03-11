/**
 * 提示词构建服务
 * 
 * 集中管理所有 AI 提示词的构建逻辑
 */

export type PromptTemplate = 
  | 'tryon'
  | 'scene'
  | 'upscale'
  | 'enhance'
  | 'background'
  | 'modelAnalysis'
  | 'garmentAnalysis'
  | 'productAnalysis'

export class PromptBuilderService {
  /**
   * 构建虚拟试穿提示词
   */
  buildTryOnPrompt(
    modelDescription: string,
    garmentDescription: string,
    action: string,
    keepBackground: boolean = true,
    enhanceLighting: boolean = false
  ): string {
    const parts = [
      '生成一张高质量的虚拟试穿效果图：',
      '',
      '【模特信息】',
      modelDescription,
      '',
      '【服装信息】',
      garmentDescription,
      '',
      '【动作要求】',
      action,
      '',
      '【技术要求】',
      '- 保持模特面部特征和身材比例不变',
      '- 服装细节必须100%还原',
      '- 光影效果自然，符合物理规律',
      keepBackground ? '- 保持原背景' : '- 使用合适的背景',
      enhanceLighting ? '- 增强光影效果，提升质感' : '',
      '',
      '请生成一张专业电商级别的试穿效果图。'
    ]

    return parts.filter(Boolean).join('\n')
  }

  /**
   * 构建场景生成提示词
   */
  buildScenePrompt(
    productDescription: string,
    sceneType: string,
    style?: string
  ): string {
    return `
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
    `.trim()
  }

  /**
   * 构建图片放大提示词
   */
  buildUpscalePrompt(scale: 2 | 4): string {
    return `
对这张图片进行 ${scale}x 超分辨率放大：

要求：
- 保持原有细节和纹理
- 修复模糊区域
- 增强清晰度
- 不引入伪影或失真
- 保持原始色彩

请生成一张高清晰度的放大图片。
    `.trim()
  }

  /**
   * 构建细节增强提示词
   */
  buildEnhancePrompt(aspect: 'face' | 'texture' | 'lighting'): string {
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
    `.trim()
  }

  /**
   * 构建分析提示词
   */
  buildAnalysisPrompt(type: 'model' | 'garment' | 'product'): string {
    const prompts = {
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
      `
    }

    return prompts[type].trim()
  }
}

// 导出单例
export const promptBuilderService = new PromptBuilderService()
export default PromptBuilderService
