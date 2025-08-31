import { Router } from 'express';
import { makeAdminClient } from '../lib/supa.js';
import { makeUserClientFromToken } from '../lib/supaUser.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const r = Router();
const supaAdmin = makeAdminClient();

function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}



// Dashboard Analytics
r.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    // Get overall statistics
    const [
      { count: totalDeals },
      { count: pendingDeals },
      { count: approvedDeals },
      { count: rejectedDeals },
      { count: totalCoupons },
      { count: pendingCoupons },
      { count: approvedCoupons },
      { count: rejectedCoupons },
      { count: totalUsers },
      { count: totalCompanies }
    ] = await Promise.all([
      supaAdmin.from('deals').select('*', { count: 'exact', head: true }),
      supaAdmin.from('deals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supaAdmin.from('deals').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supaAdmin.from('deals').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supaAdmin.from('coupons').select('*', { count: 'exact', head: true }),
      supaAdmin.from('coupons').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supaAdmin.from('coupons').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supaAdmin.from('coupons').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supaAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supaAdmin.from('companies').select('*', { count: 'exact', head: true })
    ]);

    // Get recent activity
    const { data: recentDeals } = await supaAdmin
      .from('deals')
      .select(`
        id, title, status, created_at,
        companies(name),
        profiles!submitter_id(handle)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentCoupons } = await supaAdmin
      .from('coupons')
      .select(`
        id, title, status, created_at,
        companies(name),
        profiles!submitter_id(handle)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      stats: {
        deals: {
          total: totalDeals || 0,
          pending: pendingDeals || 0,
          approved: approvedDeals || 0,
          rejected: rejectedDeals || 0
        },
        coupons: {
          total: totalCoupons || 0,
          pending: pendingCoupons || 0,
          approved: approvedCoupons || 0,
          rejected: rejectedCoupons || 0
        },
        users: {
          total: totalUsers || 0
        },
        companies: {
          total: totalCompanies || 0
        }
      },
      recentActivity: {
        deals: recentDeals || [],
        coupons: recentCoupons || []
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending deals for approval
r.get('/api/admin/deals/pending', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data: deals, error } = await supaAdmin
      .from('deals')
      .select(`
        *,
        companies(id, name, slug, logo_url, is_verified),
        categories(id, name, slug, color),
        profiles!submitter_id(handle, avatar_url, karma, created_at)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(deals || []);
  } catch (error) {
    console.error('Error fetching pending deals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending coupons for approval
r.get('/api/admin/coupons/pending', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data: coupons, error } = await supaAdmin
      .from('coupons')
      .select(`
        *,
        companies(id, name, slug, logo_url, is_verified),
        categories(id, name, slug, color),
        profiles!submitter_id(handle, avatar_url, karma, created_at)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(coupons || []);
  } catch (error) {
    console.error('Error fetching pending coupons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/Reject Deal
r.post('/api/admin/deals/:id/review', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejection_reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
    }

    if (action === 'reject' && !rejection_reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: req.user.id,
      approved_at: new Date().toISOString()
    };

    if (action === 'reject') {
      updateData.rejection_reason = rejection_reason;
    }

    const { data: deal, error } = await supaAdmin
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        companies(name),
        profiles!submitter_id(handle)
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, deal });
  } catch (error) {
    console.error('Error reviewing deal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/Reject Coupon
r.post('/api/admin/coupons/:id/review', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejection_reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
    }

    if (action === 'reject' && !rejection_reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: req.user.id,
      approved_at: new Date().toISOString()
    };

    if (action === 'reject') {
      updateData.rejection_reason = rejection_reason;
    }

    const { data: coupon, error } = await supaAdmin
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        companies(name),
        profiles!submitter_id(handle)
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Error reviewing coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users with pagination and filters
r.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role } = req.query;
    const offset = (page - 1) * limit;

    let query = supaAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`handle.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(users || []);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role
r.post('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'mod', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const { data: user, error } = await supaAdmin
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics data
r.get('/api/admin/analytics', requireAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get vote statistics
    const { data: dealVotes } = await supaAdmin.rpc('get_votes_agg');
    const { data: couponVotes } = await supaAdmin.rpc('get_coupon_votes_agg');

    // Get top contributors
    const { data: topContributors } = await supaAdmin
      .from('profiles')
      .select('handle, avatar_url, karma, total_posts, total_comments')
      .order('karma', { ascending: false })
      .limit(10);

    res.json({
      votes: {
        deals: dealVotes || [],
        coupons: couponVotes || []
      },
      topContributors: topContributors || []
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Feature/Unfeature deals and coupons
r.post('/api/admin/deals/:id/feature', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    const { data: deal, error } = await supaAdmin
      .from('deals')
      .update({ is_featured: featured })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, deal });
  } catch (error) {
    console.error('Error featuring deal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

r.post('/api/admin/coupons/:id/feature', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    const { data: coupon, error } = await supaAdmin
      .from('coupons')
      .update({ is_featured: featured })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Error featuring coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get expiration statistics and management
r.get('/api/admin/expiration/stats', requireAdmin, async (req, res) => {
  try {
    const { data: stats, error } = await supabase.rpc('get_expiration_stats')

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(stats || {})
  } catch (error) {
    console.error('Error fetching expiration stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get items expiring soon
r.get('/api/admin/expiration/expiring-soon', requireAdmin, async (req, res) => {
  try {
    const { hours = 24 } = req.query
    const { data: expiringItems, error } = await supabase.rpc('get_expiring_soon', { 
      hours_ahead: parseInt(hours) 
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(expiringItems || [])
  } catch (error) {
    console.error('Error fetching expiring items:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Manually mark expired items
r.post('/api/admin/expiration/mark-expired', requireAdmin, async (req, res) => {
  try {
    const { data: expiredCount, error } = await supabase.rpc('mark_expired_items')

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ 
      success: true, 
      expired_count: expiredCount || 0,
      message: `Marked ${expiredCount || 0} items as expired`
    })
  } catch (error) {
    console.error('Error marking expired items:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Clean up old expired items
r.post('/api/admin/expiration/cleanup', requireAdmin, async (req, res) => {
  try {
    const { data: cleanupCount, error } = await supabase.rpc('cleanup_old_expired_items')

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ 
      success: true, 
      cleanup_count: cleanupCount || 0,
      message: `Archived ${cleanupCount || 0} old expired items`
    })
  } catch (error) {
    console.error('Error cleaning up expired items:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Gamification System Management
r.get('/api/admin/gamification/stats', requireAdmin, async (req, res) => {
  try {
    const [
      { count: totalXpEvents },
      { count: totalAchievements },
      { count: totalUserAchievements },
      { data: topUsers },
      { data: recentXpEvents }
    ] = await Promise.all([
      supaAdmin.from('xp_events').select('*', { count: 'exact', head: true }),
      supaAdmin.from('achievements').select('*', { count: 'exact', head: true }),
      supaAdmin.from('user_achievements').select('*', { count: 'exact', head: true }),
      supaAdmin.from('profiles')
        .select('id, handle, total_xp, current_level, badges_earned, streak_days')
        .order('total_xp', { ascending: false })
        .limit(10),
      supaAdmin.from('xp_events')
        .select(`
          id, event_type, xp_amount, final_xp, created_at,
          profiles!user_id(handle)
        `)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    res.json({
      stats: {
        totalXpEvents: totalXpEvents || 0,
        totalAchievements: totalAchievements || 0,
        totalUserAchievements: totalUserAchievements || 0
      },
      topUsers: topUsers || [],
      recentXpEvents: recentXpEvents || []
    });
  } catch (error) {
    console.error('Gamification stats error:', error);
    res.status(500).json({ error: 'Failed to fetch gamification stats' });
  }
});

r.get('/api/admin/gamification/achievements', requireAdmin, async (req, res) => {
  try {
    const { data: achievements } = await supaAdmin
      .from('achievements')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    res.json(achievements || []);
  } catch (error) {
    console.error('Achievements fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

r.post('/api/admin/gamification/achievements', requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, category, criteria_type, criteria_value, xp_reward, badge_icon, badge_color, rarity, is_hidden } = req.body;
    
    const { data, error } = await supaAdmin
      .from('achievements')
      .insert({
        name,
        slug,
        description,
        category,
        criteria_type,
        criteria_value,
        xp_reward,
        badge_icon,
        badge_color,
        rarity,
        is_hidden
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Achievement creation error:', error);
    res.status(500).json({ error: 'Failed to create achievement' });
  }
});

r.put('/api/admin/gamification/achievements/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const { data, error } = await supaAdmin
      .from('achievements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Achievement update error:', error);
    res.status(500).json({ error: 'Failed to update achievement' });
  }
});

r.get('/api/admin/gamification/xp-config', requireAdmin, async (req, res) => {
  try {
    const { data: xpConfig } = await supaAdmin
      .from('xp_config')
      .select('*')
      .order('event_type', { ascending: true });

    res.json(xpConfig || []);
  } catch (error) {
    console.error('XP config fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch XP configuration' });
  }
});

r.put('/api/admin/gamification/xp-config/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { base_xp, max_daily, is_active } = req.body;
    
    const { data, error } = await supaAdmin
      .from('xp_config')
      .update({ base_xp, max_daily, is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('XP config update error:', error);
    res.status(500).json({ error: 'Failed to update XP configuration' });
  }
});

// Auto-Tagging System Management
r.get('/api/admin/auto-tagging/stats', requireAdmin, async (req, res) => {
  try {
    const [
      { count: totalPatterns },
      { count: totalMerchantPatterns },
      { count: totalCategoryPatterns },
      { data: recentLogs }
    ] = await Promise.all([
      supaAdmin.from('auto_tagging_log').select('*', { count: 'exact', head: true }),
      supaAdmin.from('merchant_patterns').select('*', { count: 'exact', head: true }),
      supaAdmin.from('category_patterns').select('*', { count: 'exact', head: true }),
      supaAdmin.from('auto_tagging_log')
        .select(`
          id, detected_merchant, detected_category, status, created_at,
          deals(title),
          coupons(title)
        `)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    res.json({
      stats: {
        totalPatterns: totalPatterns || 0,
        totalMerchantPatterns: totalMerchantPatterns || 0,
        totalCategoryPatterns: totalCategoryPatterns || 0
      },
      recentLogs: recentLogs || []
    });
  } catch (error) {
    console.error('Auto-tagging stats error:', error);
    res.status(500).json({ error: 'Failed to fetch auto-tagging stats' });
  }
});

r.get('/api/admin/auto-tagging/merchant-patterns', requireAdmin, async (req, res) => {
  try {
    const { data: patterns } = await supaAdmin
      .from('merchant_patterns')
      .select('*')
      .order('merchant_name', { ascending: true });

    res.json(patterns || []);
  } catch (error) {
    console.error('Merchant patterns fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch merchant patterns' });
  }
});

r.post('/api/admin/auto-tagging/merchant-patterns', requireAdmin, async (req, res) => {
  try {
    const { merchant_name, domain_patterns, title_patterns, auto_apply_tags, confidence_score } = req.body;
    
    const { data, error } = await supaAdmin
      .from('merchant_patterns')
      .insert({
        merchant_name,
        domain_patterns,
        title_patterns,
        auto_apply_tags,
        confidence_score
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Merchant pattern creation error:', error);
    res.status(500).json({ error: 'Failed to create merchant pattern' });
  }
});

r.get('/api/admin/auto-tagging/category-patterns', requireAdmin, async (req, res) => {
  try {
    const { data: patterns } = await supaAdmin
      .from('category_patterns')
      .select(`
        *,
        categories(name)
      `)
      .order('category_name', { ascending: true });

    res.json(patterns || []);
  } catch (error) {
    console.error('Category patterns fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch category patterns' });
  }
});

r.post('/api/admin/auto-tagging/category-patterns', requireAdmin, async (req, res) => {
  try {
    const { category_name, category_id, keyword_patterns, title_patterns, confidence_score, priority } = req.body;
    
    const { data, error } = await supaAdmin
      .from('category_patterns')
      .insert({
        category_name,
        category_id,
        keyword_patterns,
        title_patterns,
        confidence_score,
        priority
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Category pattern creation error:', error);
    res.status(500).json({ error: 'Failed to create category pattern' });
  }
});

// Price Tracking Management
r.get('/api/admin/price-tracking/stats', requireAdmin, async (req, res) => {
  try {
    const [
      { count: totalPriceHistory },
      { count: totalPriceAlerts },
      { count: activePriceAlerts },
      { data: recentPriceChanges }
    ] = await Promise.all([
      supaAdmin.from('deal_price_history').select('*', { count: 'exact', head: true }),
      supaAdmin.from('price_alerts').select('*', { count: 'exact', head: true }),
      supaAdmin.from('price_alerts').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supaAdmin.from('deal_price_history')
        .select(`
          id, price, original_price, stock_status, created_at,
          deals(title),
          profiles!created_by(handle)
        `)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    res.json({
      stats: {
        totalPriceHistory: totalPriceHistory || 0,
        totalPriceAlerts: totalPriceAlerts || 0,
        activePriceAlerts: activePriceAlerts || 0
      },
      recentPriceChanges: recentPriceChanges || []
    });
  } catch (error) {
    console.error('Price tracking stats error:', error);
    res.status(500).json({ error: 'Failed to fetch price tracking stats' });
  }
});

r.get('/api/admin/price-tracking/alerts', requireAdmin, async (req, res) => {
  try {
    const { data: alerts } = await supaAdmin
      .from('price_alerts')
      .select(`
        *,
        deals(title, price),
        profiles!user_id(handle)
      `)
      .order('created_at', { ascending: false });

    res.json(alerts || []);
  } catch (error) {
    console.error('Price alerts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch price alerts' });
  }
});

// Saved Searches Management
r.get('/api/admin/saved-searches/stats', requireAdmin, async (req, res) => {
  try {
    const [
      { count: totalSavedSearches },
      { count: activeSearches },
      { count: totalNotifications },
      { data: topSearches }
    ] = await Promise.all([
      supaAdmin.from('saved_searches').select('*', { count: 'exact', head: true }),
      supaAdmin.from('saved_searches').select('*', { count: 'exact', head: true }).eq('alert_enabled', true),
      supaAdmin.from('notification_queue').select('*', { count: 'exact', head: true }),
      supaAdmin.from('saved_searches')
        .select('name, search_type, total_matches, total_notifications_sent, created_at, profiles!user_id(handle)')
        .order('total_notifications_sent', { ascending: false })
        .limit(10)
    ]);

    res.json({
      stats: {
        totalSavedSearches: totalSavedSearches || 0,
        activeSearches: activeSearches || 0,
        totalNotifications: totalNotifications || 0
      },
      topSearches: topSearches || []
    });
  } catch (error) {
    console.error('Saved searches stats error:', error);
    res.status(500).json({ error: 'Failed to fetch saved searches stats' });
  }
});

r.get('/api/admin/saved-searches/list', requireAdmin, async (req, res) => {
  try {
    const { data: searches } = await supaAdmin
      .from('saved_searches')
      .select(`
        *,
        profiles!user_id(handle)
      `)
      .order('created_at', { ascending: false });

    res.json(searches || []);
  } catch (error) {
    console.error('Saved searches fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch saved searches' });
  }
});

r.get('/api/admin/notifications/queue', requireAdmin, async (req, res) => {
  try {
    const { data: notifications } = await supaAdmin
      .from('notification_queue')
      .select(`
        *,
        profiles!user_id(handle),
        saved_searches(name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    res.json(notifications || []);
  } catch (error) {
    console.error('Notification queue fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notification queue' });
  }
});

// System Health and Maintenance
r.get('/api/admin/system/health', requireAdmin, async (req, res) => {
  try {
    const [
      { count: totalDeals },
      { count: totalUsers },
      { count: totalComments },
      { count: totalVotes },
      { count: pendingDeals },
      { count: pendingCoupons }
    ] = await Promise.all([
      supaAdmin.from('deals').select('*', { count: 'exact', head: true }),
      supaAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supaAdmin.from('comments').select('*', { count: 'exact', head: true }),
      supaAdmin.from('votes').select('*', { count: 'exact', head: true }),
      supaAdmin.from('deals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supaAdmin.from('coupons').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    // Get recent activity
    const { data: recentActivity } = await supaAdmin
      .from('deals')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    res.json({
      stats: {
        totalDeals: totalDeals || 0,
        totalUsers: totalUsers || 0,
        totalComments: totalComments || 0,
        totalVotes: totalVotes || 0,
        pendingDeals: pendingDeals || 0,
        pendingCoupons: pendingCoupons || 0
      },
      activity: {
        dealsLast24h: recentActivity?.length || 0
      },
      status: 'healthy'
    });
  } catch (error) {
    console.error('System health check error:', error);
    res.status(500).json({ error: 'Failed to check system health' });
  }
});

export default r;