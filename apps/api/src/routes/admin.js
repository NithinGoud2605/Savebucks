import { Router } from 'express';
import { makeAdminClient } from '../lib/supa.js';
import { makeUserClientFromToken } from '../lib/supaUser.js';

const r = Router();
const supaAdmin = makeAdminClient();

function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  try {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const supaUser = makeUserClientFromToken(token);
    const { data: { user } } = await supaUser.auth.getUser();
    
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    const { data: profile } = await supaAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

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

export default r;