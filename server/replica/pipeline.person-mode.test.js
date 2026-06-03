import test from 'node:test';
import assert from 'node:assert/strict';
import { applySeedancePersonPolicy, fallbackScenesForSource, sourceStyleRefsForScene } from './pipeline.js';

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
