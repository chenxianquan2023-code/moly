import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePromptGuide } from './routes.js';

test('prompt guide normalizer returns three complete scenario options', () => {
  const guide = normalizePromptGuide({
    productName: '白色刺绣吊带连衣裙',
    category: '服装鞋靴',
    sellingPoints: ['镂空刺绣', '宽松舒适'],
    scenarios: [
      {
        title: '周末卧室自拍',
        subject: '年轻女性模特坐在卧室地板上',
        lighting: '午后自然窗光',
        camera: 'iPhone 自拍 POV',
        actions: ['展示裙摆刺绣', '轻轻拉动裙摆'],
        tags: ['Raw UGC'],
        prompt: '模特在卧室自然展示白色刺绣连衣裙。',
      },
    ],
    negativePrompt: '不要裸露，不要换商品',
  });

  assert.equal(guide.productName, '白色刺绣吊带连衣裙');
  assert.equal(guide.scenarios.length, 3);
  for (const scenario of guide.scenarios) {
    assert.ok(scenario.title);
    assert.ok(scenario.subject);
    assert.ok(scenario.lighting);
    assert.ok(scenario.camera);
    assert.ok(Array.isArray(scenario.actions));
    assert.ok(scenario.actions.length >= 3);
    assert.ok(Array.isArray(scenario.tags));
    assert.ok(scenario.prompt.length > 10);
  }
});
