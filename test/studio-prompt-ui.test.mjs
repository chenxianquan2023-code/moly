import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(root, 'src/views/StudioView.vue'), 'utf8');

test('studio uses one primary prompt composer instead of two sibling prompt boxes', () => {
  assert.match(source, /class="prompt-composer"/);
  assert.match(source, /描述你想生成的视频/);
  assert.match(source, /高级避免项/);
  assert.match(source, /高级生成设置/);
  assert.match(source, /class="advanced-settings"/);
  assert.doesNotMatch(source, /不要出现（选填）/);
});

test('studio exposes a Moly-styled prompt guide modal with scenario cards', () => {
  assert.match(source, /class="prompt-guide-mask"/);
  assert.match(source, /提示词向导/);
  assert.match(source, /核心信息/);
  assert.match(source, /拍摄方案/); // 步骤名已去 creatok 化：场景与建议 → 拍摄方案
  assert.match(source, /提示词/);
  assert.match(source, /推荐方案/);
  assert.match(source, /主体/);
  assert.match(source, /光线/);
  assert.match(source, /镜头/);
  assert.match(source, /动作/);
  assert.match(source, /用这套方案/);
  assert.doesNotMatch(source, /Raw UGC/); // creatok 痕迹的英文标签已删除，不许回流
});

test('studio makes generated results easy to find after completion', () => {
  assert.match(source, /生成结果/);
  assert.match(source, /class="result-jump"/);
  assert.match(source, /ref="previewPanel"/);
  assert.match(source, /scrollResultIntoView/);
  assert.match(source, /成片已生成/);
});
