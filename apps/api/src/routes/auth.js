import { Router } from 'express';
import { makeAdminClient } from '../lib/supa.js';
import { log } from '../lib/logger.js';

const r = Router();
const supaAdmin = makeAdminClient();

/**
 * Sign up new user
 * POST /api/auth/signup
 * Body: { email, password, handle? }
 */
r.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, handle } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Check if handle is already taken (if provided)
    if (handle) {
      const { data: existingProfile } = await supaAdmin
        .from('profiles')
        .select('id')
        .eq('handle', handle.toLowerCase())
        .single();
        
      if (existingProfile) {
        return res.status(400).json({ error: 'Handle is already taken' });
      }
    }
    
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supaAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now
    });
    
    if (authError) {
      log('Signup error:', authError);
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }
      return res.status(400).json({ error: authError.message });
    }
    
    // Update profile with handle if provided
    if (handle && authData.user) {
      const { error: profileError } = await supaAdmin
        .from('profiles')
        .update({ handle: handle.toLowerCase() })
        .eq('id', authData.user.id);
        
      if (profileError) {
        log('Profile update error:', profileError);
      }
    }
    
    // Generate session for the user
    const { data: sessionData, error: sessionError } = await supaAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
    });
    
    if (sessionError) {
      log('Session generation error:', sessionError);
    }
    
    res.status(201).json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        handle: handle || null,
      },
      message: 'User created successfully'
    });
    
  } catch (error) {
    log('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Sign in user
 * POST /api/auth/signin
 * Body: { email, password }
 */
r.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Sign in with Supabase Auth
    const { data, error } = await supaAdmin.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      log('Signin error:', error);
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      return res.status(400).json({ error: error.message });
    }
    
    if (!data.user || !data.session) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
    
    // Get user profile
    const { data: profile } = await supaAdmin
      .from('profiles')
      .select('handle, karma, role, created_at')
      .eq('id', data.user.id)
      .single();
    
    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        handle: profile?.handle || null,
        karma: profile?.karma || 0,
        role: profile?.role || 'user',
        created_at: profile?.created_at,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      }
    });
    
  } catch (error) {
    log('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Sign out user
 * POST /api/auth/signout
 * Headers: Authorization: Bearer <token>
 */
r.post('/api/auth/signout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Revoke the session
      const { error } = await supaAdmin.auth.admin.signOut(token);
      if (error) {
        log('Signout error:', error);
      }
    }
    
    res.json({ message: 'Signed out successfully' });
    
  } catch (error) {
    log('Signout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Refresh token
 * POST /api/auth/refresh
 * Body: { refresh_token }
 */
r.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body || {};
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    const { data, error } = await supaAdmin.auth.refreshSession({
      refresh_token
    });
    
    if (error) {
      log('Token refresh error:', error);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    if (!data.session) {
      return res.status(401).json({ error: 'Failed to refresh session' });
    }
    
    res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      }
    });
    
  } catch (error) {
    log('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 */
r.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    
    // Verify token and get user
    const { data: userData, error: userError } = await supaAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supaAdmin
      .from('profiles')
      .select('handle, karma, role, created_at, updated_at')
      .eq('id', userData.user.id)
      .single();
    
    if (profileError) {
      log('Profile fetch error:', profileError);
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    res.json({
      user: {
        id: userData.user.id,
        email: userData.user.email,
        handle: profile.handle,
        karma: profile.karma,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }
    });
    
  } catch (error) {
    log('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update user profile
 * PUT /api/auth/profile
 * Headers: Authorization: Bearer <token>
 * Body: { handle?, avatar_url? }
 */
r.put('/api/auth/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    
    // Verify token and get user
    const { data: userData, error: userError } = await supaAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    const { handle, avatar_url } = req.body || {};
    const updateData = {};
    
    if (handle !== undefined) {
      // Validate handle
      if (handle && (handle.length < 3 || handle.length > 20)) {
        return res.status(400).json({ error: 'Handle must be 3-20 characters long' });
      }
      
      if (handle && !/^[a-zA-Z0-9_-]+$/.test(handle)) {
        return res.status(400).json({ error: 'Handle can only contain letters, numbers, hyphens, and underscores' });
      }
      
      // Check if handle is already taken
      if (handle) {
        const { data: existingProfile } = await supaAdmin
          .from('profiles')
          .select('id')
          .eq('handle', handle.toLowerCase())
          .neq('id', userData.user.id)
          .single();
          
        if (existingProfile) {
          return res.status(400).json({ error: 'Handle is already taken' });
        }
      }
      
      updateData.handle = handle?.toLowerCase() || null;
    }
    
    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url;
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Update profile
    const { data: updatedProfile, error: updateError } = await supaAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userData.user.id)
      .select()
      .single();
    
    if (updateError) {
      log('Profile update error:', updateError);
      return res.status(400).json({ error: 'Failed to update profile' });
    }
    
    res.json({
      user: {
        id: userData.user.id,
        email: userData.user.email,
        handle: updatedProfile.handle,
        avatar_url: updatedProfile.avatar_url,
        karma: updatedProfile.karma,
        role: updatedProfile.role,
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at,
      }
    });
    
  } catch (error) {
    log('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default r;
