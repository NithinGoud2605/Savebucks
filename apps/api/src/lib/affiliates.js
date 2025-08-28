import crypto from 'node:crypto';

export function isAffEnabled() {
  const v = (process.env.AFF_ENABLED ?? 'false').toString().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

export function hostnameOf(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function isAmazonHost(host) {
  return host.endsWith('amazon.com') || host.endsWith('amzn.to');
}

export function addAmazonTag(rawUrl, tag) {
  const u = new URL(rawUrl);
  u.searchParams.set('tag', tag);
  return u.toString();
}

/** CJ deep link: https://<domain>/click/<PID>/<AID>?url=<ENCODED_TARGET> */
export function buildCjDeepLink(targetUrl, advertiserId, websiteId, base = process.env.CJ_DEEP_LINK_BASE) {
  const pid = websiteId || process.env.CJ_WEBSITE_ID;
  if (!pid || !advertiserId || !base) return targetUrl; // not configured → clean link
  const b = base.replace(/\/+$/, '');
  return `${b}/${encodeURIComponent(pid)}/${encodeURIComponent(advertiserId)}?url=${encodeURIComponent(targetUrl)}`;
}

export function randomClickId() {
  return crypto.randomUUID();
}
