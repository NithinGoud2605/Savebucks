const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
export async function api(path, opts) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
