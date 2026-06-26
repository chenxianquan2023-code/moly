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

test('studio presents the BGM picker as a music director, not a plain search box', () => {
  assert.match(source, /音乐导演推荐/);
  assert.match(source, /爆款类型/);
  assert.match(source, /行业场景/);
  assert.match(source, /转场音效/);
  assert.match(source, /口播垫乐/);
  assert.match(source, /卡点转场/);
  assert.match(source, /元气种草/);
  assert.match(source, /高级质感/);
  assert.match(source, /美妆护肤/);
  assert.match(source, /穿搭包包/);
  assert.match(source, /fetchTrendingForPreset/);
  assert.match(source, /selectedBgmPreset/);
});

test('studio BGM picker has a polished workstation layout and clear selection states', () => {
  assert.match(source, /class="bgm-workspace"/);
  assert.match(source, /class="bgm-rail"/);
  assert.match(source, /class="bgm-panel"/);
  assert.match(source, /class="bgm-current"/);
  assert.match(source, /class="bgm-wave"/);
  assert.match(source, /class="bgm-use"/);
  assert.match(source, /已选音乐/);
  assert.match(source, /选择此音乐/);
  assert.match(source, /按这个方向找爆款/);
});

test('studio excludes local generated ambient BGM from the picker', () => {
  assert.match(source, /DISPLAYABLE_BGM_LICENSE_TYPES/);
  assert.match(source, /isDisplayableBgmTrack/);
  assert.match(source, /filter\(isDisplayableBgmTrack\)/);
  assert.doesNotMatch(source, /DISPLAYABLE_BGM_LICENSE_TYPES[\s\S]*moly_generated/);
});

test('studio BGM picker makes multiple search results obvious', () => {
  assert.match(source, /class="bgm-results-head"/);
  assert.match(source, /class="bgm-list-wrap"/);
  assert.match(source, /shownTrackCount/);
  assert.match(source, /匹配音乐/);
  assert.match(source, /向下滚动查看更多/);
});

test('studio disables source BGM when no reference video is uploaded', () => {
  assert.match(source, /canUseSourceBgm/);
  assert.match(source, /:disabled="!canUseSourceBgm"/);
  assert.match(source, /未上传参考视频时不可用/);
  assert.match(source, /watch\(canUseSourceBgm/);
});
