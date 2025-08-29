import { Router } from 'express';
import { makeAdminClient } from '../lib/supa.js';
import { makeUserClientFromToken } from '../lib/supaUser.js';
import { log } from '../lib/logger.js';

const r = Router();
const supaAdmin = makeAdminClient();

function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

/**
 * Get user profile by handle
 * GET /api/users/:handle
 */
r.get('/api/users/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    
    // Get user profile
    const { data: profile, error: profileError } = await supaAdmin
      .from('profiles')
      .select(`
        id,
        handle,
        avatar_url,
        karma,
        role,
        created_at,
        updated_at
      `)
      .eq('handle', handle.toLowerCase())
      .single();
    
    if (profileError || !profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user stats
    const { data: dealsCount } = await supaAdmin
      .from('deals')
      .select('id', { count: 'exact' })
      .eq('submitter_id', profile.id)
      .eq('status', 'approved');
    
    const { data: commentsCount } = await supaAdmin
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('user_id', profile.id);
    
    // Get recent deals
    const { data: recentDeals } = await supaAdmin
      .from('deals')
      .select('id, title, price, merchant, created_at, status')
      .eq('submitter_id', profile.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5);
    
    res.json({
      id: profile.id,
      handle: profile.handle,
      display_name: profile.handle,
      avatar_url: profile.avatar_url,
      karma: profile.karma,
      role: profile.role,
      is_verified: profile.role !== 'user',
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      stats: {
        deals_posted: dealsCount?.length || 0,
        comments_made: commentsCount?.length || 0,
        karma: profile.karma,
      },
      recent_deals: recentDeals || []
    });
    
  } catch (error) {
    log('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Search users
 * GET /api/users/search?q=query
 */
r.get('/api/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }
    
    const { data: users, error } = await supaAdmin
      .from('profiles')
      .select('id, handle, avatar_url, karma, role')
      .or(`handle.ilike.%${q.trim()}%`)
      .order('karma', { ascending: false })
      .limit(10);
    
    if (error) {
      log('User search error:', error);
      return res.status(500).json({ error: 'Search failed' });
    }
    
    const results = users.map(user => ({
      id: user.id,
      handle: user.handle,
      display_name: user.handle,
      avatar_url: user.avatar_url,
      karma: user.karma,
      role: user.role
    }));
    
    res.json(results);
    
  } catch (error) {
    log('User search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user activity feed
 * GET /api/users/:handle/activity
 */
r.get('/api/users/:handle/activity', async (req, res) => {
  try {
    const { handle } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    // Get user profile
    const { data: profile } = await supaAdmin
      .from('profiles')
      .select('id')
      .eq('handle', handle.toLowerCase())
      .single();
    
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get recent deals
    const { data: deals } = await supaAdmin
      .from('deals')
      .select('id, title, price, merchant, created_at, status')
      .eq('submitter_id', profile.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Get recent comments
    const { data: comments } = await supaAdmin
      .from('comments')
      .select(`
        id,
        body,
        created_at,
        deal_id,
        deals!inner(id, title)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Combine and sort activities
    const activities = [
      ...(deals || []).map(deal => ({
        id: `deal-${deal.id}`,
        type: 'deal_posted',
        created_at: deal.created_at,
        deal: {
          id: deal.id,
          title: deal.title,
          price: deal.price,
          merchant: deal.merchant
        },
        points: 5
      })),
      ...(comments || []).map(comment => ({
        id: `comment-${comment.id}`,
        type: 'deal_commented',
        created_at: comment.created_at,
        comment: {
          id: comment.id,
          body: comment.body
        },
        deal: comment.deals,
        points: 1
      }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
     .slice(0, limit);
    
    res.json(activities);
    
  } catch (error) {
    log('Get user activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user stats
 * GET /api/users/:handle/stats
 */
r.get('/api/users/:handle/stats', async (req, res) => {
  try {
    const { handle } = req.params;
    
    // Get user profile
    const { data: profile } = await supaAdmin
      .from('profiles')
      .select('id, karma, created_at')
      .eq('handle', handle.toLowerCase())
      .single();
    
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get detailed stats
    const { data: approvedDeals } = await supaAdmin
      .from('deals')
      .select('id', { count: 'exact' })
      .eq('submitter_id', profile.id)
      .eq('status', 'approved');
    
    const { data: allDeals } = await supaAdmin
      .from('deals')
      .select('id', { count: 'exact' })
      .eq('submitter_id', profile.id);
    
    const { data: comments } = await supaAdmin
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('user_id', profile.id);
    
    // Calculate success rate
    const successRate = allDeals?.length > 0 
      ? Math.round((approvedDeals?.length || 0) / allDeals.length * 100)
      : 0;
    
    res.json({
      karma: profile.karma,
      karma_change_30d: 0, // Would need historical data
      deals_posted: approvedDeals?.length || 0,
      deals_posted_change_30d: 0, // Would need historical data
      comments_made: comments?.length || 0,
      comments_change_30d: 0, // Would need historical data
      successful_deals: approvedDeals?.length || 0,
      success_rate: successRate,
      total_submissions: allDeals?.length || 0,
      member_since: profile.created_at,
      engagement_rate: 0.15, // Mock data - would calculate from actual engagement
      activity_heatmap: [], // Would need to implement activity tracking
      monthly_stats: {}, // Would need historical data
      category_breakdown: {}, // Would need to track categories
      best_deals: [], // Would need to implement deal ranking
      top_interactions: [] // Would need to track interactions
    });
    
  } catch (error) {
    log('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Follow/Unfollow user
 * POST /api/users/:userId/follow
 * DELETE /api/users/:userId/unfollow
 */
r.post('/api/users/:userId/follow', async (req, res) => {
  try {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'auth required' });
    
    const { data: userData } = await supaAdmin.auth.getUser(token);
    if (!userData.user) return res.status(401).json({ error: 'invalid token' });
    
    const { userId } = req.params;
    
    // For now, just return success (would implement actual following logic)
    res.json({ message: 'Following user', following: true });
    
  } catch (error) {
    log('Follow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

r.post('/api/users/:userId/unfollow', async (req, res) => {
  try {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'auth required' });
    
    const { data: userData } = await supaAdmin.auth.getUser(token);
    if (!userData.user) return res.status(401).json({ error: 'invalid token' });
    
    const { userId } = req.params;
    
    // For now, just return success (would implement actual unfollowing logic)
    res.json({ message: 'Unfollowed user', following: false });
    
  } catch (error) {
    log('Unfollow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Check if following user
 * GET /api/users/:userId/following
 */
r.get('/api/users/:userId/following', async (req, res) => {
  try {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'auth required' });
    
    const { data: userData } = await supaAdmin.auth.getUser(token);
    if (!userData.user) return res.status(401).json({ error: 'invalid token' });
    
    // For now, return false (would implement actual following check)
    res.json({ following: false });
    
  } catch (error) {
    log('Check following error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default r;
