import { supa } from './supa';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export async function api(path, opts) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiAuth(path, opts = {}) {
  const { data: { session } } = await supa.auth.getSession();
  const token = session?.access_token;
  const headers = { ...(opts.headers || {}), 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return api(path, { ...opts, headers });
}
