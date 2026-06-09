import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRequiredCreativePrompt } from './routes.js';

test('required creative prompt rejects blank input', () => {
  assert.equal(validateRequiredCreativePrompt('').ok, false);
  assert.equal(validateRequiredCreativePrompt('   \n\t  ').ok, false);
});

test('required creative prompt rejects vague one-word input', () => {
  const result = validateRequiredCreativePrompt('试用');

  assert.equal(result.ok, false);
  assert.match(result.message, /提示词|至少/);
});

test('required creative prompt accepts a concrete user direction', () => {
  const result = validateRequiredCreativePrompt('模特敷面膜试用，保留参考视频的浴室自拍感');

  assert.equal(result.ok, true);
  assert.equal(result.value, '模特敷面膜试用，保留参考视频的浴室自拍感');
});
