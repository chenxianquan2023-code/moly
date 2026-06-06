const tails = new Map();

export function withKeyLock(key, fn) {
  const k = String(key || '');
  const prev = tails.get(k) || Promise.resolve();
  const run = prev.catch(() => undefined).then(fn);
  const cleanup = run.finally(() => {
    if (tails.get(k) === cleanup) tails.delete(k);
  }).catch(() => undefined);
  tails.set(k, cleanup);
  return run;
}
