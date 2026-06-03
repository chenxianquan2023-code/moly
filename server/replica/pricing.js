/**
 * 复刻生成 · 积分定价（「用户选模型、不同定价」）
 * 价格 = 基础(解析+导演+配音+字幕+合成) + 所选视频引擎 + 所选画面模型。
 * 默认走最稳的标准档；前端可让用户升级到高级/高清档。
 */

export const BASE_COST = 20; // 基础流程（解析+导演分镜+配音+字幕+合成）
export const DOWNLOAD_COST = 5; // 找爆款·下载原视频每条扣费（很低，覆盖 Apify 下载成本）
export const IMPORT_COST = 2; // 找爆款·「用它复刻」把爆款封面+文案带入工作台的导入费（很低）

// 视频引擎：真人镜的自然度/速度不同
export const VIDEO_MODELS = {
  seedance: { id: 'seedance', label: '标准 · Seedance', price: 30, desc: '产品镜快而稳；不出真人（选它模特不出镜）' },
  kling: { id: 'kling', label: '高级 · 可灵', price: 50, desc: '支持真人出镜，模特动作更自然(略慢)' },
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
