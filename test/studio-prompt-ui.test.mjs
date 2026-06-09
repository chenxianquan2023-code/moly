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

test('studio exposes a Creatok-style prompt guide modal with scenario cards', () => {
  assert.match(source, /class="prompt-guide-mask"/);
  assert.match(source, /提示词向导/);
  assert.match(source, /核心信息/);
  assert.match(source, /场景与建议/);
  assert.match(source, /提示词/);
  assert.match(source, /推荐方案/);
  assert.match(source, /主体/);
  assert.match(source, /光线/);
  assert.match(source, /镜头/);
  assert.match(source, /动作/);
  assert.match(source, /选择此方案/);
});
