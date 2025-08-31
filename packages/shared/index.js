// Shared utilities (JS only)
export function normalizeUrl(raw) {
  const u = new URL(raw);
  u.hash = '';
  const strip = ['utm_source','utm_medium','utm_campaign','gclid','fbclid','igshid','mc_eid'];
  strip.forEach(p => u.searchParams.delete(p));
  return u.toString().toLowerCase();
}

// Hot score ~2-day half life
export function hotScore(ups, downs, createdUnixSec, nowUnixSec) {
  const s = Math.max(ups - downs, 1);
  const order = Math.log10(s);
  const hours = (nowUnixSec - createdUnixSec) / 3600;
  return Number((order - hours / 48).toFixed(7));
}

// Telegram parser exports
export * from './src/telegramParser.js';
