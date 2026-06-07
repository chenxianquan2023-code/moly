/**
 * 运营预警：付费 AI 引擎欠费/额度耗尽时，立刻推送给管理员，别再等用户报障才发现。
 * - 始终打一条醒目日志（Railway 日志可见）。
 * - 若配了 env ALERT_WEBHOOK_URL，则推送到群机器人（自动识别 飞书/企业微信/钉钉/Slack，其余走通用 JSON）。
 * - 同类预警 20 分钟内去重，避免刷屏。
 * 配置示例：ALERT_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxxx
 */
const WEBHOOK = process.env.ALERT_WEBHOOK_URL || '';
const DEBOUNCE_MS = 20 * 60 * 1000;

const _lastSent = new Map(); // title -> ts（去重用）
let _lastAlert = null;       // { title, detail, at } 给 /api/health 展示

export function getLastAlert() { return _lastAlert; }
export const isAlertWebhookConfigured = () => !!WEBHOOK;

// 按 webhook 域名拼成对应平台的文本消息体（都发纯文本即可）
function buildPayload(url, text) {
  if (/feishu|larksuite/i.test(url)) return { msg_type: 'text', content: { text } };
  if (/dingtalk|qyapi\.weixin|weixin/i.test(url)) return { msgtype: 'text', text: { content: text } };
  if (/slack/i.test(url)) return { text };
  return { text, content: text, msg_type: 'text' }; // 通用兜底：多塞几个常见字段
}

/**
 * 推送一条管理员预警（不阻塞调用方；失败只记日志）。
 * @param {string} title 简短标题，如「视频模型没额度了」
 * @param {string} detail 详情/处理建议
 */
export async function notifyAdmin(title, detail = '') {
  const at = new Date().toISOString();
  _lastAlert = { title, detail: String(detail).slice(0, 300), at };
  console.error(`🔴[ALERT] ${title} | ${String(detail).slice(0, 200)} | ${at}`);
  if (!WEBHOOK) return;
  const now = Date.now();
  const last = _lastSent.get(title) || 0;
  if (now - last < DEBOUNCE_MS) return; // 去重
  _lastSent.set(title, now);
  const text = `🔴 Moly 运营预警\n${title}\n${String(detail).slice(0, 300)}\n时间：${at}\n请尽快处理（充值 / 检查账户）。`;
  try {
    await fetch(WEBHOOK, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(WEBHOOK, text)),
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) { console.error('[alert] webhook 推送失败:', e?.message || e); }
}
