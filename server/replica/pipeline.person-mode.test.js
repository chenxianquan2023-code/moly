import test from 'node:test';
import assert from 'node:assert/strict';
import { applySeedancePersonPolicy, anonymousSubjectRule, fallbackScenesForSource, sourceStyleRefsForScene } from './pipeline.js';

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
