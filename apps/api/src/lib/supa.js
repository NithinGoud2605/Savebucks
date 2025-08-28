import { createClient } from '@supabase/supabase-js';

export function makeAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE');
  }
  
  try {
    return createClient(url, key, { auth: { persistSession: false } });
  } catch (error) {
    throw new Error(`Invalid Supabase configuration: ${error.message}`);
  }
}
