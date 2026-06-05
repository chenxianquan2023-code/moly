/**
 * 离线测试台（0 AI 成本）——只用纯逻辑 + ffmpeg 假素材，反复验证"算时长 / 合成"这段最易出 bug 的逻辑。
 * 用法: node test/replica-offline.mjs
 * 覆盖: ① computeSceneDurations 各场景不出"首幕过长/总长超源被砍尾" ② 背景乐循环铺底，-shortest 不砍画面。
 */
import { computeSceneDurations } from '../server/replica/pipeline.js';
import { ffmpeg, probe, concatVideo, addAudio } from '../server/replica/ai/ffmpeg.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ 失败: ' + m); } };
const sum = (a) => a.reduce((x, y) => x + y, 0);

console.log('═══ Part 1: computeSceneDurations 纯逻辑（瞬时、0 成本）═══');

// A. 用户那条出 bug 的情形：没配音、3 镜、源 8.8s
{
  const scenes = [{ durationRatio: 0.35 }, { durationRatio: 0.35 }, { durationRatio: 0.29 }];
  const audios = scenes.map(() => ({ path: null, duration: 4 })); // 没配音(path=null)，duration 是旧的 4s 默认
  const { durations } = computeSceneDurations(scenes, audios, 8.8);
  const s = sum(durations);
  console.log('  3镜/无配音/源8.8s →', durations.map((d) => d.toFixed(1)).join(', '), '| 总', s.toFixed(1));
  ok(s <= 8.8 + 1.2, `总时长 ${s.toFixed(1)}s 不超源视频太多 → 不会被背景乐 -shortest 砍尾`);
  ok(Math.max(...durations) <= 1.7 * (s / durations.length), `首幕不过长(最长 ${Math.max(...durations).toFixed(1)}s ≤ 均值1.7倍)`);
  ok(Math.min(...durations) >= 2.0, `每幕 ≥2s(不一闪而过)`);
}
// B. 没配音、4 镜、源 8.8s
{
  const scenes = [0.3, 0.3, 0.2, 0.2].map((r) => ({ durationRatio: r }));
  const audios = scenes.map(() => ({ path: null, duration: 4 }));
  const { durations } = computeSceneDurations(scenes, audios, 8.8);
  const s = sum(durations);
  console.log('  4镜/无配音/源8.8s →', durations.map((d) => d.toFixed(1)).join(', '), '| 总', s.toFixed(1));
  ok(s <= 8.8 + 1.5, `4镜总时长 ${s.toFixed(1)}s 仍贴合源、不砍尾`);
  ok(Math.max(...durations) <= 1.7 * (s / durations.length), '4镜也没有某幕过长');
}
// C. 源 ratio 严重不均（导演给首幕超大占比）——仍不能让首幕吃掉全片
{
  const scenes = [0.7, 0.1, 0.1, 0.1].map((r) => ({ durationRatio: r }));
  const audios = scenes.map(() => ({ path: null, duration: 4 }));
  const { durations } = computeSceneDurations(scenes, audios, 8.8);
  console.log('  极端不均(0.7/0.1/0.1/0.1) →', durations.map((d) => d.toFixed(1)).join(', '));
  ok(durations[0] <= 1.8 * (sum(durations) / durations.length), `首幕被均匀化压住(${durations[0].toFixed(1)}s，没吃掉全片)`);
}
// D. 有配音：时长应跟着配音走（每幕≥各自配音时长）
{
  const scenes = [{ durationRatio: 0.5 }, { durationRatio: 0.5 }];
  const audios = [{ path: '/x.mp3', duration: 3.5 }, { path: '/y.mp3', duration: 2.5 }];
  const { durations } = computeSceneDurations(scenes, audios, 8);
  console.log('  有配音 →', durations.map((d) => d.toFixed(1)).join(', '));
  ok(durations[0] >= 3.5 && durations[1] >= 2.5, '有配音时每幕≥各自配音时长(不会把人话切断)');
}
// E. 退化：无源视频、无配音 → 兜底每幕~3s，不崩
{
  const scenes = [{}, {}, {}];
  const audios = scenes.map(() => ({ path: null }));
  const { durations } = computeSceneDurations(scenes, audios, 0);
  ok(durations.every((d) => d >= 2 && d <= 6), `无源无配音兜底每幕 2~6s(${durations.map((d) => d.toFixed(1)).join(',')})`);
}

console.log('\n═══ Part 2: 合成 -shortest 砍尾 回归（造假片+假音乐跑真 ffmpeg，0 AI）═══');
const dir = mkdtempSync(join(tmpdir(), 'moly-test-'));
try {
  const mk = async (name, dur, color) => { const p = join(dir, name); await ffmpeg(['-y', '-f', 'lavfi', '-i', `color=c=${color}:s=320x568:d=${dur}:r=30`, '-pix_fmt', 'yuv420p', p]); return p; };
  const mkAudio = async (name, dur) => { const p = join(dir, name); await ffmpeg(['-y', '-f', 'lavfi', '-i', `sine=frequency=300:duration=${dur}`, '-c:a', 'mp3', p]); return p; };

  // 新逻辑：画面 9s（3×3s），源音乐只有 6s → 循环铺满 → 成片应是 9s（不砍）
  const clips = [await mk('c0.mp4', 3, 'red'), await mk('c1.mp4', 3, 'green'), await mk('c2.mp4', 3, 'blue')];
  const concat = join(dir, 'concat.mp4'); await concatVideo(clips, concat);
  const vDur = (await probe(concat)).duration;
  const src = await mkAudio('src.mp3', 6); // 源音乐比画面短
  // ——新做法：-stream_loop -1 把音乐循环铺满画面时长
  const bgmLooped = join(dir, 'bgm.mp3');
  await ffmpeg(['-y', '-stream_loop', '-1', '-i', src, '-vn', '-t', String(vDur), '-c:a', 'mp3', bgmLooped]);
  const outNew = join(dir, 'new.mp4'); await addAudio(concat, bgmLooped, outNew);
  const newDur = (await probe(outNew)).duration;
  console.log(`  画面 ${vDur.toFixed(1)}s + 源乐6s(循环铺满) → 成片 ${newDur.toFixed(1)}s`);
  ok(Math.abs(newDur - vDur) < 0.6, `新逻辑：成片≈画面时长，结尾没被砍`);

  // ——对照旧 bug：音乐不循环(只有6s) + -shortest → 成片被砍到 6s
  const outOld = join(dir, 'old.mp4'); await addAudio(concat, src, outOld);
  const oldDur = (await probe(outOld)).duration;
  console.log(`  对照(旧bug)：画面 ${vDur.toFixed(1)}s + 源乐6s(不循环) → 成片 ${oldDur.toFixed(1)}s`);
  ok(oldDur < vDur - 1, `复现旧 bug：不循环时画面确实被砍掉 ${(vDur - oldDur).toFixed(1)}s(证明修复有效)`);
} catch (e) {
  fail++; console.log('  ✗ 合成测试异常:', String(e.message || e).slice(0, 150));
} finally {
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}

console.log(`\n═══ 结果: ${pass} 通过 / ${fail} 失败 ═══`);
process.exit(fail ? 1 : 0);
