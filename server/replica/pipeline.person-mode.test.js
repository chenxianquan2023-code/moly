import test from 'node:test';
import assert from 'node:assert/strict';
import { applySeedancePersonPolicy } from './pipeline.js';

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
