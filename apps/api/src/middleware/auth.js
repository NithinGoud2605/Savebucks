// Supabase JWT authentication middleware
import { createClient } from '@supabase/supabase-js';

export function makeAuth() {
  let supabase = null;
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    }
  } catch (error) {
    console.warn('Supabase auth disabled - invalid configuration:', error.message);
  }

  return async function auth(req, _res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token && supabase) {
      try {
        // Verify the token and get user data
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (!error && user) {
          // Set the user in the request object for middleware that needs it
          req.user = user;
          req.user.id = user.id;

          // Also store the token for use in database operations
          req.authToken = token;

          console.log(`🔐 Authenticated user: ${user.id}`);
        } else {
          console.warn('⚠️ Invalid or expired token:', error?.message);
        }
      } catch (error) {
        console.warn('Auth middleware error:', error.message);
      }
    } else {
      console.log('🔓 No token provided or Supabase not configured');
    }

    next();
  };
}

/**
 * Optional auth middleware - same as makeAuth but more explicitly named
 * Use this for routes that work for both guests and authenticated users
 */
export const makeAuthOptional = makeAuth();
