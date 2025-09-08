import { createClient } from '@supabase/supabase-js';

export async function makeUserClientFromToken(token) {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  if (!token) throw new Error('Missing user token');
  
  // Validate JWT format (should have 3 parts separated by dots)
  if (!token.includes('.') || token.split('.').length !== 3) {
    throw new Error('Invalid JWT token format');
  }
  
  // Create a Supabase client with the user's token
  const client = createClient(url, anon, {
    global: { 
      headers: { 
        Authorization: `Bearer ${token}`,
        'X-Client-Info': 'savebucks-api'
      } 
    },
    auth: { 
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  try {
    // Test the token by trying to get user info
    // This will fail if the JWT is invalid
    const { data: { user }, error } = await client.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid or expired JWT token');
    }
    
    // Set the session manually to establish user context for database triggers
    // This ensures that auth.uid() works in database triggers
    await client.auth.setSession({
      access_token: token,
      refresh_token: null,
      expires_in: 86400, // 24 hours instead of 1 hour
      token_type: 'bearer'
    });
    
    // Verify the session is properly set
    const { data: { session } } = await client.auth.getSession();
    if (!session || !session.access_token) {
      throw new Error('Failed to establish authentication session');
    }
    
    return client;
  } catch (authError) {
    // If auth.getUser fails, it's likely due to JWT verification
    if (authError.message.includes('JWT') || authError.message.includes('token')) {
      throw new Error('Invalid or expired JWT token');
    } else {
      throw new Error('Failed to verify authentication: ' + authError.message);
    }
  }
}
