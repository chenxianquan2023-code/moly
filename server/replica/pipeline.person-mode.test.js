import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applySeedancePersonPolicy,
  anonymousSubjectRule,
  classifyReplicaProduct,
  fallbackScenesForSource,
  sourceStyleRefsForScene,
  buildReplicaSafetyRule,
  buildReplicaUserDirection,
  buildFaithfulFramePrompt,
} from './pipeline.js';

test('Seedance keeps face-mask demos as anonymous model usage instead of product-only shots', () => {
  const notes = [];
  const scenes = applySeedancePersonPolicy([
    {
      type: 'demo',
      text: '玫瑰粉的胶原蛋白面膜',
      visual: '模特戴着玫瑰粉色面膜居中，手轻按面膜贴合',
      withModel: true,
      sourceShotIndex: 0,
    },
  ], {
    videoModel: 'seedance',
    hasModel: true,
    productText: '魔法面膜 Biodance Bio Collagen Real Deep Mask 补水有弹性',
    sourceShots: [{ hasPerson: 'full', action: '戴着面膜，用吸管喝水，看向镜头', role: 'demo' }],
    notes,
  });

  assert.equal(scenes[0].withModel, true);
  assert.equal(scenes[0].personMode, 'anonymous');
  assert.match(scenes[0].visual, /匿名|面膜|试用|遮挡/);
  assert.doesNotMatch(scenes[0].visual, /只有商品本身|不出现任何人物|商品英雄特写/);
  assert.ok(notes.some((n) => /匿名试用/.test(n)));
});

test('Seedance leaves pure product scenes product-only', () => {
  const notes = [];
  const scenes = applySeedancePersonPolicy([
    {
      type: 'hook',
      text: '包装高级感拉满',
      visual: '面膜包装盒立在浴室台面上',
      withModel: false,
      sourceShotIndex: 0,
    },
  ], {
    videoModel: 'seedance',
    hasModel: true,
    productText: 'Biodance 面膜',
    sourceShots: [{ hasPerson: 'none', action: '包装特写', role: 'hook' }],
    notes,
  });

  assert.equal(scenes[0].withModel, false);
  assert.equal(scenes[0].personMode, 'none');
  assert.equal(notes.length, 0);
});

test('Seedance anonymizes generic fallback model CTA for mask products', () => {
  const notes = [];
  const scenes = applySeedancePersonPolicy([
    { type: 'hook', visual: '商品吸睛特写', withModel: false },
    { type: 'demo', visual: '展示商品核心使用场景', withModel: false },
    { type: 'cta', visual: '模特手持商品微笑推荐', withModel: true },
  ], {
    videoModel: 'seedance',
    hasModel: true,
    productText: '魔法面膜 Biodance 补水面膜',
    sourceShots: [
      { hasPerson: 'full', action: '女生刚睡醒看镜头', role: 'hook' },
      { hasPerson: 'full', action: '女生戴着面膜试用', role: 'demo' },
      { hasPerson: 'full', action: '女生护肤完成看镜头', role: 'proof' },
    ],
    notes,
  });

  assert.equal(scenes[2].withModel, true);
  assert.equal(scenes[2].personMode, 'anonymous');
  assert.match(scenes[2].visual, /匿名|不可识别|面膜|试用/);
});

test('Seedance face-cover products stay anonymous without becoming faceless people', () => {
  const cases = [
    {
      productText: 'Biodance 胶原蛋白片状面膜 sheet mask',
      sourceAction: '女生敷片状面膜，手轻按脸颊',
      visual: '模特正在敷面膜试用',
      visualMust: /眼部|鼻部|嘴部|开孔|半透明/,
      ruleMust: /眼部|鼻部|嘴部|开孔|无脸人/,
    },
    {
      productText: '黑色偏光墨镜 sunglasses 太阳镜',
      sourceAction: '女生戴墨镜试戴，看向镜头',
      visual: '模特佩戴墨镜展示穿搭',
      visualMust: /墨镜|太阳镜|鼻梁|嘴部|自然脸部轮廓/,
      ruleMust: /墨镜|镜片|鼻梁|嘴部|无脸人/,
    },
    {
      productText: '高透气防护口罩 face mask',
      sourceAction: '女生戴口罩试戴，调整耳带',
      visual: '模特佩戴口罩展示贴合度',
      visualMust: /口罩|眉眼|额头|自然脸部轮廓/,
      ruleMust: /口罩|眉眼|额头|无脸人/,
    },
    {
      productText: 'UPF50+ 防晒面罩 sun face cover',
      sourceAction: '女生戴防晒面罩户外防晒',
      visual: '模特佩戴防晒面罩展示防晒效果',
      visualMust: /防晒面罩|眼周|额头|自然头部轮廓/,
      ruleMust: /防晒面罩|眼周|额头|无脸人/,
    },
    {
      productText: '骑行头盔透明防风面罩 helmet visor face shield',
      sourceAction: '女生佩戴头盔面罩骑行防风',
      visual: '模特戴头盔面罩展示防风效果',
      visualMust: /面部遮挡|头部|发际线|开孔|镜片|透气孔|边缘结构/,
      ruleMust: /通用面部遮挡|头部结构|开孔|镜片|透气孔/,
    },
    {
      productText: '滑雪护目镜和防风面罩 ski mask goggles',
      sourceAction: '女生戴护目镜和防风面罩滑雪',
      visual: '模特佩戴滑雪护目镜试用',
      visualMust: /面部遮挡|头部|发际线|开孔|镜片|透气孔|边缘结构/,
      ruleMust: /通用面部遮挡|头部结构|开孔|镜片|透气孔/,
    },
  ];

  for (const c of cases) {
    const scenes = applySeedancePersonPolicy([
      { type: 'demo', visual: c.visual, withModel: true, sourceShotIndex: 0 },
    ], {
      videoModel: 'seedance',
      hasModel: true,
      productText: c.productText,
      sourceShots: [{ hasPerson: 'full', action: c.sourceAction, role: 'demo' }],
      notes: [],
    });

    assert.equal(scenes[0].withModel, true);
    assert.equal(scenes[0].personMode, 'anonymous');
    assert.match(scenes[0].visual, c.visualMust);
    assert.doesNotMatch(scenes[0].visual, /脸部被面膜完整覆盖|整张脸抹成|五官肖像/);

    const rule = anonymousSubjectRule(scenes[0], c.productText, { action: c.sourceAction });
    assert.match(rule, c.ruleMust);
    assert.match(rule, /不能生成.*空白脸|无脸人|假人/);
  }
});

test('source style frames are not passed as image refs when source video contains people', () => {
  const refs = sourceStyleRefsForScene(['frame1', 'frame2'], {
    shots: [{ hasPerson: 'full', action: '女生看镜头' }],
  });

  assert.deepEqual(refs, []);
});

test('source style frames can be used when source video has no people', () => {
  const refs = sourceStyleRefsForScene(['frame1', 'frame2'], {
    shots: [{ hasPerson: 'none', action: '商品包装特写' }],
  });

  assert.deepEqual(refs, ['frame1', 'frame2']);
});

test('fallback scenes preserve source person usage instead of generic English CTA', () => {
  const scenes = fallbackScenesForSource('魔法面膜', 'zh-CN', {
    shots: [
      { index: 1, role: 'hook', hasPerson: 'full', action: '女生刚睡醒看镜头', camera: '固定机位', durationRatio: 0.25 },
      { index: 2, role: 'demo', hasPerson: 'full', action: '女生戴着面膜试用', camera: '轻微手持', durationRatio: 0.25 },
    ],
  });

  assert.equal(scenes.length, 2);
  assert.equal(scenes[0].sourceShotIndex, 1);
  assert.equal(scenes[1].withModel, true);
  assert.match(scenes[1].visual, /使用|试用|魔法面膜/);
  assert.doesNotMatch(scenes[1].text, /Stop scrolling|Tap the link/i);
});

test('bags are accessories, not garments, so faithful replica preserves source outfit', () => {
  const cls = classifyReplicaProduct('Miu Miu 黄色刺绣褶皱手提包 luxury handbag purse');

  assert.equal(cls.isAccessory, true);
  assert.equal(cls.isBag, true);
  assert.equal(cls.isGarment, false);
  assert.equal(cls.isWearable, true);

  const prompt = buildFaithfulFramePrompt({
    isModelScene: true,
    productClass: cls,
    noSrcTextRule: '',
    qualityCue: '',
  });

  assert.match(prompt, /保留.*源.*穿搭|沿用.*源.*穿搭/);
  assert.match(prompt, /完整穿着|不得裸露|不得生成裸身/);
  assert.doesNotMatch(prompt, /人物的长相、发型、以及身上的整套穿搭，一律以后面那张基准图为准/);
});

test('garment products replace source outfit but still forbid nudity', () => {
  const cls = classifyReplicaProduct('Miu Miu 白色刺绣吊带连衣裙 dress');

  assert.equal(cls.isGarment, true);
  assert.equal(cls.isAccessory, false);

  const prompt = buildFaithfulFramePrompt({
    isModelScene: true,
    productClass: cls,
    noSrcTextRule: '',
    qualityCue: '',
  });

  assert.match(prompt, /身上的整套穿搭.*基准图为准|严格保持基准图这一身/);
  assert.match(prompt, /完整穿着|不得裸露|不得生成裸身/);
});

test('replica safety rule blocks nudity for model scenes across product categories', () => {
  const rule = buildReplicaSafetyRule({ hasPerson: true, productClass: classifyReplicaProduct('黄色手提包') });

  assert.match(rule, /完整穿着/);
  assert.match(rule, /不得裸露/);
  assert.match(rule, /不得生成裸身/);
  assert.match(rule, /内衣|泳装|裸背/);
});

test('intimate apparel can be shown as the product without banning itself', () => {
  const cls = classifyReplicaProduct('黑色蕾丝文胸 bra lingerie underwear');

  assert.equal(cls.isGarment, true);
  assert.equal(cls.isAccessory, false);
  assert.equal(cls.isIntimate, true);

  const rule = buildReplicaSafetyRule({ hasPerson: true, productClass: cls });

  assert.match(rule, /成人模特/);
  assert.match(rule, /合规展示|电商展示|穿搭展示/);
  assert.match(rule, /不得裸露|不得生成裸身/);
  assert.match(rule, /不得.*未成年人|不得.*性暗示/);
  assert.doesNotMatch(rule, /不得内衣\/泳装|不得.*泳装模特|不得.*内衣模特/);
});

test('swimwear can be shown as the product while non-intimate items still block swimsuit drift', () => {
  const swim = classifyReplicaProduct('蓝色连体泳衣 swimsuit swimwear');
  const bag = classifyReplicaProduct('黄色刺绣褶皱手提包 handbag');

  assert.equal(swim.isGarment, true);
  assert.equal(swim.isIntimate, true);
  assert.equal(bag.isIntimate, false);

  const swimRule = buildReplicaSafetyRule({ hasPerson: true, productClass: swim });
  const bagRule = buildReplicaSafetyRule({ hasPerson: true, productClass: bag });

  assert.doesNotMatch(swimRule, /不得内衣\/泳装|不得.*泳装模特/);
  assert.match(swimRule, /成人模特/);
  assert.match(bagRule, /不得.*内衣|不得.*泳装/);
});

test('user prompt directions preserve creative instructions and negative constraints', () => {
  const direction = buildReplicaUserDirection({
    creativePrompt: '保留高级秀场感，模特从左侧入画后坐下展示黄色包',
    negativePrompt: '不要裸露，不要换成白色包，不要多手',
  });

  assert.match(direction, /用户创意参考/);
  assert.match(direction, /高级秀场感/);
  assert.match(direction, /用户禁止事项/);
  assert.match(direction, /不要裸露/);
  // 优先级守卫：创意永远低于一致性锁(同人/同衣/同环境)，防"换场景"文案顶翻 hero 锚(实测翻车回归)
  assert.match(direction, /优先级·硬性/);
  assert.match(direction, /忽略冲突部分/);
});

test('single-model user directions forbid duplicate same-person subjects in one frame', () => {
  const direction = buildReplicaUserDirection({
    creativePrompt: '生成一段短视频，一位年轻女性穿白色吊带裙，先走进画面，再坐在窗边喝咖啡，最后起身转圈展示裙摆',
    negativePrompt: '不要裸露，不要换商品',
  });

  assert.match(direction, /主体数量一致性/);
  assert.match(direction, /只允许一个主要人物主体|每个画面只允许一个/);
  assert.match(direction, /第二个同款人物|背景同款人|分身|镜像/);
  assert.match(direction, /连续动作.*拆成不同镜头|不要把同一模特的多个动作状态放进同一帧/);
});
