import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { withKeyLock } from './keyed-lock.js';

test('withKeyLock serializes work for the same key', async () => {
  const events = [];
  const jobs = [0, 1, 2].map((i) => withKeyLock('same', async () => {
    events.push(`start-${i}`);
    await sleep(10);
    events.push(`end-${i}`);
    return i;
  }));

  assert.deepEqual(await Promise.all(jobs), [0, 1, 2]);
  assert.deepEqual(events, ['start-0', 'end-0', 'start-1', 'end-1', 'start-2', 'end-2']);
});

test('withKeyLock allows different keys to run concurrently', async () => {
  let running = 0;
  let peak = 0;
  await Promise.all(['a', 'b'].map((key) => withKeyLock(key, async () => {
    running += 1;
    peak = Math.max(peak, running);
    await sleep(20);
    running -= 1;
  })));

  assert.equal(peak, 2);
});
