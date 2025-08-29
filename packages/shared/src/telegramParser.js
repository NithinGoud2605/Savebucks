import { z } from 'zod';

const Price = z.number().nonnegative().optional();
const Url = z.string().url();

export function extractUrl(text) {
  if (!text) return null;
  const m = text.match(/https?:\/\/\S+/i);
  return m ? m[0].replace(/[)\]\s]+$/, '') : null;
}

export function extractPrice(text) {
  if (!text) return undefined;
  const m = text.match(/(?:\$|usd[\s:]*)(\d{1,4}(?:[\.,]\d{2})?)|(\d{1,4}(?:[\.,]\d{2})?)\$/i);
  if (!m) return undefined;
  const raw = (m[1] || m[2] || '').replace(',', '.');
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function merchantFromUrl(u) {
  try {
    const host = new URL(u).hostname.toLowerCase().replace(/^www\./,'');
    return host.split('.').slice(-2).join('.'); // bestbuy.com, amazon.com
  } catch { return null; }
}

export function cleanTitle(text, url, price) {
  if (!text) return '';
  let t = text;
  if (url) t = t.replace(url, '');
  if (price !== undefined) t = t.replace(/\$?\s?\d{1,4}(?:[\.,]\d{2})?\$?/g,'');
  t = t.replace(/[#@][\w_]+/g,'').replace(/[🔥✨💥🧨🎉]+/g,'').replace(/\s{2,}/g,' ').trim();
  return t.slice(0, 140).replace(/[-–—•,:;.\s]+$/,'');
}

export function parseTelegramText(text) {
  const url = extractUrl(text);
  if (!url) return null;
  const price = extractPrice(text);
  const merchant = merchantFromUrl(url);
  const title = cleanTitle(text, url, price);
  return { url, price, merchant, title };
}
