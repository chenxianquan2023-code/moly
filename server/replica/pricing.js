/**
 * 复刻生成 · 积分定价（「用户选模型、不同定价」）
 * 价格 = 基础(解析+导演+配音+字幕+合成) + 所选视频引擎 + 所选画面模型。
 * 默认走最稳的标准档；前端可让用户升级到高级/高清档。
 */

export const BASE_COST = 20; // 基础流程（解析+导演分镜+配音+字幕+合成）
export const REGEN_SCENE_COST = 15; // 换单镜：只重生一镜（复用其余镜的底图/动画片缓存 + 重新合成），远低于整条重生
export const DOWNLOAD_COST = 5; // 找爆款·下载原视频每条扣费（很低，覆盖 Apify 下载成本）
export const IMPORT_COST = 2; // 找爆款·「用它复刻」把爆款封面+文案带入工作台的导入费（很低）

// 视频引擎：用户可选。Seedance 2.0 走 fal 国际版(真人脸不封、全身写实最强)；可灵性价比高。
export const VIDEO_MODELS = {
  seedance: { id: 'seedance', label: '高级 · Seedance 2.0', price: 80, desc: '真人/全身最自然真实，对标头部产品（推荐）' },
  kling: { id: 'kling', label: '标准 · 可灵', price: 50, desc: '真人脸自然、动作灵动，性价比高' },
};

// 画面生成模型：配图精细度不同
export const IMAGE_MODELS = {
  gemini: { id: 'gemini', label: '标准 · Gemini', price: 0, desc: '出图快，质感好' },
  openai: { id: 'openai', label: '高清 · GPT Image', price: 10, desc: '更精细的细节与质感(略慢)' },
};

const pick = (table, id, def) => (table[id] ? id : def);

/** 估算一次生成的积分价（不扣费），返回 {cost, breakdown} */
export function estimateCost(options = {}) {
  const m = options.models || {};
  const video = pick(VIDEO_MODELS, m.video, 'seedance');
  const image = pick(IMAGE_MODELS, m.image, 'gemini');
  const cost = BASE_COST + VIDEO_MODELS[video].price + IMAGE_MODELS[image].price;
  return {
    cost,
    breakdown: {
      base: BASE_COST,
      video: VIDEO_MODELS[video],
      image: IMAGE_MODELS[image],
    },
  };
}

/** 换单镜估价（只重生一镜，复用其余缓存）——比整条生成便宜得多 */
export function estimateRegenCost() {
  return { cost: REGEN_SCENE_COST, breakdown: { base: REGEN_SCENE_COST } };
}

/** 给前端渲染定价/选项用 */
export function pricingTable() {
  return { base: BASE_COST, video: Object.values(VIDEO_MODELS), image: Object.values(IMAGE_MODELS) };
}

// 充值套餐（MVP：支付网关待接入，下单后体验直充）
export const RECHARGE_PACKAGES = [
  { id: 'starter', label: '体验包', credits: 100, bonus: 0, priceYuan: 9.9 },
  { id: 'basic', label: '基础包', credits: 500, bonus: 50, priceYuan: 49 },
  { id: 'pro', label: '专业包', credits: 1500, bonus: 300, priceYuan: 99 },
];
