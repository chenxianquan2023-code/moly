/**
 * 异步生成任务系统
 * 真相源在 DB 表 generation_tasks；状态机：created→queued→running→succeeded/failed/cancelled。
 * MVP 用进程内异步执行 + DB 持久化状态，前端轮询 GET /api/generation-tasks/:id。
 * 注意：若进程重启，running 中的任务会成为孤儿（需人工或后续接队列/worker 解决）。
 */
import { insertRow, getById, updateById } from '../lib/supabase.js';
import { addPoints } from '../lib/points.js';

const running = new Set(); // 防止同一任务重复执行

export async function createTask({
  userEmail, sourceVideoId = null, taskType = 'one_click_replica',
  options = {}, input = {}, creditsEstimated = 0, creditsCharged = 0,
}) {
  return insertRow('generation_tasks', {
    user_email: userEmail,
    source_video_id: sourceVideoId,
    task_type: taskType,
    status: 'queued',
    progress: 0,
    options_json: options,
    input_json: input,
    steps: [],
    credits_estimated: creditsEstimated,
    credits_charged: creditsCharged,
  });
}

export const getTask = (id) => getById('generation_tasks', id);
export const updateTask = (id, patch) => updateById('generation_tasks', id, patch);

/**
 * 异步执行任务（不阻塞请求）。
 * runner: async (task, ctx) => outputObject
 * ctx.setProgress(0-100) / ctx.setSteps(stepsArray)
 */
export function runTask(taskId, runner) {
  if (running.has(taskId)) return;
  running.add(taskId);
  (async () => {
    try {
      await updateTask(taskId, { status: 'running' });
      const ctx = {
        setProgress: (p) => updateTask(taskId, { progress: Math.max(0, Math.min(100, Math.round(p))) }),
        setSteps: (steps) => updateTask(taskId, { steps }),
      };
      const task = await getTask(taskId);
      const output = await runner(task, ctx);
      await updateTask(taskId, { status: 'succeeded', progress: 100, output_json: output || {} });
    } catch (e) {
      console.error(`[task ${taskId}] failed:`, e?.message || e);
      try { await updateTask(taskId, { status: 'failed', error_message: String(e?.message || e) }); }
      catch (e2) { console.error(`[task ${taskId}] 更新失败状态也失败:`, e2?.message || e2); }
      // 生成失败 → 退还已扣积分
      try {
        const t = await getTask(taskId);
        if (t && (t.credits_charged || 0) > 0) {
          await addPoints(t.user_email, t.credits_charged, `生成失败退款#${String(taskId).slice(0, 8)}`);
          await updateTask(taskId, { credits_charged: 0 });
        }
      } catch (e3) { console.error(`[task ${taskId}] 退款失败:`, e3?.message || e3); }
    } finally {
      running.delete(taskId);
    }
  })();
}
