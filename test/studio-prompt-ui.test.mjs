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
