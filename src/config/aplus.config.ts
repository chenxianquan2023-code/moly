/**
 * A+ 向导配置
 */

export type APlusTemplateId = 'default' | 'brand_story_first' | 'feature_first' | 'comparison_focus'

export const APLUS_TEMPLATE_OPTIONS: { value: APlusTemplateId; label: string }[] = [
  { value: 'default', label: '默认' },
  { value: 'brand_story_first', label: '品牌故事优先：先讲品牌与信任，再讲功能' },
  { value: 'feature_first', label: '功能卖点优先：突出参数与硬实力' },
  { value: 'comparison_focus', label: '对比强化：强调与竞品差异' },
]
