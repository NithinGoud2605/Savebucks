import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let upstash = null;
if (url && token) {
  const redis = new Redis({ url, token });
  upstash = {
    // create a sliding-window limiter
    create: ({ limit, windowSec, prefix }) =>
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
        prefix
      })
  };
}

// in-memory fallback (dev only)
const memBuckets = new Map();
function memTake(key, limit, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;
  let arr = memBuckets.get(key) || [];
  arr = arr.filter(ts => ts > windowStart);
  if (arr.length >= limit) {
    memBuckets.set(key, arr);
    return { success: false, remaining: 0, reset: arr[0] + windowMs };
  }
  arr.push(now);
  memBuckets.set(key, arr);
  return { success: true, remaining: limit - arr.length, reset: arr[0] + windowMs };
}

export function makeLimiter({ key, limit, windowSec, prefix }) {
  const windowMs = windowSec * 1000;
  if (upstash) {
    const rl = upstash.create({ limit, windowSec, prefix });
    return async function take() {
      const { success, reset, remaining } = await rl.limit(key());
      return { success, reset: reset * 1000, remaining };
    };
  }
  return async function take() {
    return memTake(key(), limit, windowMs);
  };
}

// convenience helpers
export function userOrIp(req) {
  const auth = req.user?.id || null;
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()) || req.ip || 'ip:unknown';
  return auth ? `u:${auth}` : `ip:${ip}`;
}

export function ipKey(req) {
  return (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()) || req.ip || 'ip:unknown';
}
