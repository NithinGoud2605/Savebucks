const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
const AFF_ENABLED = (import.meta.env.VITE_AFF_ENABLED ?? 'false').toString().toLowerCase() === 'true';

export default function AffiliateButton({ dealId, children = 'Go to deal' }) {
  const href = `${API_BASE}/go/${dealId}`;
  const rel = AFF_ENABLED ? 'noopener nofollow sponsored' : 'noopener nofollow';
  return (
    <a
      className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700"
      href={href}
      target="_blank"
      rel={rel}
    >
      {children}
    </a>
  );
}
