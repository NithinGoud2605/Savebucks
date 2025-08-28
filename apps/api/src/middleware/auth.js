// Minimal Supabase JWT guard for future use (non-blocking for now).
import { createClient } from '@supabase/supabase-js';

export function makeAuth() {
  let supabase = null;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
  return async function auth(req, _res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token && supabase) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) req.user = user;
      } catch (_) {}
    }
    next();
  };
}
