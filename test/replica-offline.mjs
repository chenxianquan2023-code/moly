/**
 * 离线测试台（0 AI 成本）——只用纯逻辑 + ffmpeg 假素材，反复验证"算时长 / 合成"这段最易出 bug 的逻辑。
 * 用法: node test/replica-offline.mjs
 * 覆盖: ① computeSceneDurations 各场景不出"首幕过长/总长超源被砍尾" ② 背景乐循环铺底，-shortest 不砍画面。
 */
import { computeSceneDurations, composeVideo } from '../server/replica/pipeline.js';
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

// F. 用户指定总时长(短/标准/长) → 成片总时长贴合该目标
{
  const scenes = [{ durationRatio: 0.5 }, { durationRatio: 0.3 }, { durationRatio: 0.2 }];
  const audios = scenes.map(() => ({ path: null }));
  for (const target of [8, 12, 18]) {
    const { durations } = computeSceneDurations(scenes, audios, 8.8, target);
    const s = sum(durations);
    console.log(`  目标${target}s → ${durations.map((d) => d.toFixed(1)).join(',')} | 总${s.toFixed(1)}`);
    ok(Math.abs(s - target) <= 2.0, `选"目标 ${target}s" → 成片总时长 ${s.toFixed(1)}s 贴合目标`);
    ok(Math.max(...durations) <= 1.8 * (s / durations.length), `目标 ${target}s 各幕仍均衡、无某幕过长`);
  }
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

console.log('\n═══ Part 3: composeVideo 抽出后端到端合成（假片，验证抽函数没改坏）═══');
{
  const d2 = mkdtempSync(join(tmpdir(), 'moly-compose-'));
  try {
    const mk = async (n, dur, c) => { const p = join(d2, n); await ffmpeg(['-y', '-f', 'lavfi', '-i', `color=c=${c}:s=320x568:d=${dur}:r=30`, '-pix_fmt', 'yuv420p', p]); return p; };
    // 源视频(带音轨6s)放到 work/src.mp4 供背景乐
    await ffmpeg(['-y', '-f', 'lavfi', '-i', 'color=c=gray:s=320x568:d=6:r=30', '-f', 'lavfi', '-i', 'sine=frequency=320:duration=6', '-shortest', '-pix_fmt', 'yuv420p', join(d2, 'src.mp4')]);
    const scenes = [{ type: 'hook', text: '第一幕文案' }, { type: 'demo', text: '第二幕文案' }, { type: 'proof', text: '第三幕文案' }];
    const audios = scenes.map(() => ({ path: null }));
    const { durations } = computeSceneDurations(scenes, audios, 8.8);
    const clips = [await mk('s0.mp4', 6, 'red'), await mk('s1.mp4', 6, 'green'), await mk('s2.mp4', 6, 'blue')];
    const r = await composeVideo({ work: d2, scenes, sceneDurations: durations, sceneClips: clips, sceneAudios: audios, ttsOk: false, analysis: { durationSec: 8.8 }, opts: { generate_music: true, generate_subtitle: true }, notes: [] });
    const outDur = (await probe(r.finalPath)).duration;
    console.log(`  composeVideo → 成片 ${outDur.toFixed(1)}s (期望≈${sum(durations).toFixed(1)})`);
    ok(Math.abs(outDur - sum(durations)) < 0.9, 'composeVideo 成片时长正确、结尾没被砍(含背景乐循环+烧字幕+淡出)');
    ok(r.duration > 0 && !!r.coverPath, 'composeVideo 返回封面+时长');
  } catch (e) { fail++; console.log('  ✗ composeVideo 异常:', String(e.message || e).slice(0, 160)); }
  finally { try { rmSync(d2, { recursive: true, force: true }); } catch { /* ignore */ } }
}

console.log('\n═══ Part 4: 换单镜 swap-重合成 回归（换掉中间一镜，验证总时长/对齐不变）═══');
{
  const d3 = mkdtempSync(join(tmpdir(), 'moly-regen-'));
  try {
    const mk = async (n, dur, c) => { const p = join(d3, n); await ffmpeg(['-y', '-f', 'lavfi', '-i', `color=c=${c}:s=320x568:d=${dur}:r=30`, '-pix_fmt', 'yuv420p', p]); return p; };
    await ffmpeg(['-y', '-f', 'lavfi', '-i', 'color=c=gray:s=320x568:d=6:r=30', '-f', 'lavfi', '-i', 'sine=frequency=320:duration=6', '-shortest', '-pix_fmt', 'yuv420p', join(d3, 'src.mp4')]);
    const scenes = [{ type: 'hook', text: '第一幕' }, { type: 'demo', text: '第二幕' }, { type: 'proof', text: '第三幕' }];
    const audios = scenes.map(() => ({ path: null }));
    const { durations } = computeSceneDurations(scenes, audios, 8.8);
    // 原片：3 镜
    const clips = [await mk('s0.mp4', 6, 'red'), await mk('s1.mp4', 6, 'green'), await mk('s2.mp4', 6, 'blue')];
    const r1 = await composeVideo({ work: d3, scenes, sceneDurations: durations, sceneClips: clips, sceneAudios: audios, ttsOk: false, analysis: { durationSec: 8.8 }, opts: { generate_music: true, generate_subtitle: true }, notes: [] });
    const dur1 = (await probe(r1.finalPath)).duration;
    // 换单镜：只把第 2 镜(index 1)换成新片(同样时长够长)，其余复用 → 重合成
    const swapped = clips.slice(); swapped[1] = await mk('s1b.mp4', 6, 'orange');
    const r2 = await composeVideo({ work: mkdtempSync(join(tmpdir(), 'moly-regen2-')), scenes, sceneDurations: durations, sceneClips: swapped, sceneAudios: audios, ttsOk: false, analysis: { durationSec: 8.8 }, opts: { generate_music: true, generate_subtitle: true }, notes: [] });
    const dur2 = (await probe(r2.finalPath)).duration;
    console.log(`  原片 ${dur1.toFixed(1)}s → 换中间镜重合成 ${dur2.toFixed(1)}s (期望两者≈${sum(durations).toFixed(1)})`);
    ok(Math.abs(dur1 - sum(durations)) < 0.9 && Math.abs(dur2 - sum(durations)) < 0.9, '换单镜重合成：总时长与原片一致、对齐不乱、结尾不被砍');
    ok(Math.abs(dur1 - dur2) < 0.5, '换单镜前后成片时长稳定（换一镜不改变整片节奏）');
  } catch (e) { fail++; console.log('  ✗ 换单镜重合成异常:', String(e.message || e).slice(0, 160)); }
  finally { try { rmSync(d3, { recursive: true, force: true }); } catch { /* ignore */ } }
}

console.log(`\n═══ 结果: ${pass} 通过 / ${fail} 失败 ═══`);
process.exit(fail ? 1 : 0);
