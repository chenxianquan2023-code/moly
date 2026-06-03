/**
 * FFmpeg 封装 —— 视频探测与合成
 * 用 ffmpeg-static / ffprobe-static 自带二进制，本地与 Railway 均无需系统安装。
 */
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { spawn, execSync } from 'node:child_process';

// 二进制解析优先级：环境变量 > 系统 PATH(本地 brew) > ffmpeg-static(Railway 等无系统 ffmpeg 的环境)
// 说明：Apple Silicon 上 ffmpeg-static 的二进制可能因签名问题报 EBADARCH(-86)，优先用系统 ffmpeg 规避。
function resolveBin(name, fallback) {
  const env = process.env[`${name.toUpperCase()}_PATH`];
  if (env) return env;
  try {
    const p = execSync(`command -v ${name}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (p) return p;
  } catch { /* 系统无该命令，回退 ffmpeg-static */ }
  return fallback;
}

const FFMPEG = resolveBin('ffmpeg', ffmpegPath);
const FFPROBE = resolveBin('ffprobe', ffprobeStatic?.path);

function exec(bin, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { cwd: opts.cwd });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve({ out, err }) : reject(new Error(`${bin} exit ${code}: ${err.slice(-600)}`))));
  });
}

/** 直接跑 ffmpeg，args 为参数数组；opts.cwd 可设工作目录 */
export const ffmpeg = (args, opts) => exec(FFMPEG, args, opts);

/** 探测视频元信息：时长(秒)/宽/高 */
export async function probe(input) {
  const { out } = await exec(FFPROBE, ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', input]);
  const j = JSON.parse(out);
  const v = (j.streams || []).find((s) => s.codec_type === 'video') || {};
  return { duration: parseFloat(j.format?.duration) || 0, width: v.width || 0, height: v.height || 0, raw: j };
}

/** 缩放并补边到 9:16（默认 1080x1920） */
export const toVertical = (input, output, w = 1080, h = 1920) =>
  ffmpeg(['-y', '-i', input, '-vf',
    `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black,setsar=1`,
    '-r', '30', output]);

/** 拼接多段「无音轨」视频（先各自统一到 w×h 再 concat） */
export async function concatVideo(inputs, output, w = 1080, h = 1920) {
  const args = ['-y'];
  inputs.forEach((i) => args.push('-i', i));
  const parts = inputs.map((_, i) =>
    `[${i}:v:0]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=30[v${i}]`);
  const chain = inputs.map((_, i) => `[v${i}]`).join('');
  args.push('-filter_complex', `${parts.join(';')};${chain}concat=n=${inputs.length}:v=1:a=0[v]`, '-map', '[v]', output);
  return ffmpeg(args);
}

/** 烧录字幕（srt/ass）；建议传相对文件名 + opts.cwd，避开 filtergraph 路径解析坑 */
export const burnSubtitles = (input, subPath, output, opts) =>
  ffmpeg(['-y', '-i', input, '-vf', `subtitles=${subPath}`, output], opts);

/** 给视频混入配音（音频以较短者为准） */
export const addAudio = (video, audio, output) =>
  ffmpeg(['-y', '-i', video, '-i', audio, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-shortest', output]);

/** 截取封面（单帧） */
export const thumbnail = (input, output, atSec = 0) =>
  ffmpeg(['-y', '-ss', String(atSec), '-i', input, '-frames:v', '1', '-q:v', '2', output]);

/** 按 fps 抽帧给 AI 分析；pattern 形如 /tmp/x/frame_%03d.jpg；可限制只看前 N 秒 */
export const extractFrames = (input, pattern, fps = 0.5, durationSec = 0) => {
  const args = ['-y', '-i', input];
  if (durationSec > 0) args.push('-t', String(durationSec));
  args.push('-vf', `fps=${fps}`, pattern);
  return ffmpeg(args);
};

export { FFMPEG, FFPROBE };
