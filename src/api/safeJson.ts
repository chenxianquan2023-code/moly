// 把 fetch 响应安全解析成 JSON。
// 后端重启/请求超时时，Railway 网关会直接回纯文本(如 "upstream error")——
// 裸 .json() 会把 `Unexpected token 'u', "upstream error" is not valid JSON`
// 这种天书一路抛到 alert/错误面板。统一在这里转成人话。
export async function safeJson(r: Response): Promise<any> {
  const text = await r.text();
  try { return JSON.parse(text); }
  catch {
    throw new Error(r.ok
      ? '服务响应异常，请稍后重试'
      : '服务正在重启或繁忙，请稍等几秒再试');
  }
}
