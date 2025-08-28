import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://ixkhkzjhelyumdplutbz.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4a2hrempoZWx5dW1kcGx1dGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MDQ5OTMsImV4cCI6MjA3MTk4MDk5M30.T5-RXfOVOKIMstjyHuc_sEI0B-MTc9wK1BuNWdzYuPs';

export const supa = createClient(url, key);
