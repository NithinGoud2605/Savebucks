import { Router } from 'express';
import { makeAdminClient } from '../lib/supa.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import multer from 'multer';
import { randomUUID } from 'crypto';

const r = Router();
const supaAdmin = makeAdminClient();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}



// Dashboard Analytics
r.get('/dashboard', requireAdmin, async (req, res) => {
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
        id, title, status, created_at, merchant, source, submitter_id, quality_score,
        companies(name),
        profiles!submitter_id(handle)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentCoupons } = await supaAdmin
      .from('coupons')
      .select(`
        id, title, status, created_at, merchant, source, submitter_id, quality_score,
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

// Who am I (admin check)
r.get('/whoami', async (req, res) => {
  try {
    const user = req.user;
    if (!user?.id) return res.json({ isAdmin: false });
    const { data: prof } = await supaAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    res.json({ isAdmin: prof?.role === 'admin' });
  } catch (_) {
    res.json({ isAdmin: false });
  }
});

// Analytics endpoint
r.get('/analytics', requireAdmin, async (req, res) => {
  try {
    // Get top contributors (users with highest karma)
    const { data: topContributors } = await supaAdmin
      .from('profiles')
      .select('id, handle, avatar_url, karma')
      .order('karma', { ascending: false })
      .limit(10);

    // Get deal submission counts for each top contributor
    const contributorsWithStats = await Promise.all(
      (topContributors || []).map(async (user) => {
        const { count: dealCount } = await supaAdmin
          .from('deals')
          .select('*', { count: 'exact', head: true })
          .eq('submitter_id', user.id);

        const { count: commentCount } = await supaAdmin
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        return {
          ...user,
          total_posts: dealCount || 0,
          total_comments: commentCount || 0
        };
      })
    );

    // Get platform-wide stats
    const [
      { count: totalDeals },
      { count: totalViews },
      { count: totalClicks }
    ] = await Promise.all([
      supaAdmin.from('deals').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supaAdmin.from('deals').select('views_count').eq('status', 'approved'),
      supaAdmin.from('deals').select('clicks_count').eq('status', 'approved')
    ]);

    // Get deals with most views
    const { data: topDeals } = await supaAdmin
      .from('deals')
      .select('id, title, views_count, clicks_count')
      .eq('status', 'approved')
      .order('views_count', { ascending: false })
      .limit(5);

    // Get ingestion stats (deals by source)
    const { data: sourceStats } = await supaAdmin
      .from('deals')
      .select('source')
      .not('source', 'is', null);

    const sourceCounts = (sourceStats || []).reduce((acc, d) => {
      acc[d.source] = (acc[d.source] || 0) + 1;
      return acc;
    }, {});

    res.json({
      topContributors: contributorsWithStats,
      topDeals: topDeals || [],
      stats: {
        totalDeals: totalDeals || 0,
        dealsBySource: sourceCounts
      },
      votes: {
        deals: [],
        coupons: []
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users with email (admin only)
r.get('/users', requireAdmin, async (req, res) => {
  try {
    const { search = '', role = '', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Build query for profiles
    let query = supaAdmin
      .from('profiles')
      .select('id, handle, avatar_url, role, karma, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.ilike('handle', `%${search}%`);
    }
    if (role) {
      query = query.eq('role', role);
    }

    const { data: profiles, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Try to get emails from Supabase admin API (if available)
    // Note: This requires admin privileges
    let usersWithEmails = profiles || [];

    try {
      // Get auth users to match emails
      const { data: authData } = await supaAdmin.auth.admin.listUsers();
      const authUsers = authData?.users || [];

      // Create email lookup map
      const emailMap = {};
      authUsers.forEach(u => {
        emailMap[u.id] = u.email;
      });

      // Add emails to profiles
      usersWithEmails = (profiles || []).map(profile => ({
        ...profile,
        email: emailMap[profile.id] || null
      }));
    } catch (authError) {
      console.log('Could not fetch auth users, emails will be null');
    }

    res.json(usersWithEmails);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role
r.put('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'mod', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const { data: profile, error } = await supaAdmin
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get deals with status filter (pending by default) + basic search
r.get('/deals', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supaAdmin
      .from('deals')
      .select(`
        *,
        companies(id, name, slug, logo_url, is_verified),
        categories(id, name, slug, color),
        profiles!submitter_id(handle, avatar_url, karma, created_at),
        deal_tags(
          tag_id,
          tags(id, name, slug)
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      // Search by title, description, or merchant
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,merchant.ilike.%${search}%`
      );
    }

    const { data: deals, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(deals || []);
  } catch (error) {
    console.error('Error fetching admin deals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending coupons for approval
r.get('/coupons/pending', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data: coupons, error } = await supaAdmin
      .from('coupons')
      .select(`
        *,
        companies(id, name, slug, logo_url, is_verified),
        categories(id, name, slug, color),
        profiles!submitter_id(handle, avatar_url, karma, created_at),
        coupon_tags(
          tag_id,
          tags(id, name, slug)
        )
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

// Get coupons with status filter (pending by default) + search
r.get('/coupons', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supaAdmin
      .from('coupons')
      .select(`
        *,
        companies(id, name, slug, logo_url, is_verified),
        categories(id, name, slug, color),
        profiles!submitter_id(handle, avatar_url, karma, created_at),
        coupon_tags(
          tag_id,
          tags(id, name, slug)
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      // Search by title, description or coupon code
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,coupon_code.ilike.%${search}%`
      );
    }

    const { data: coupons, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(coupons || []);
  } catch (error) {
    console.error('Error fetching admin coupons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Karma calculation function
function calculateKarmaPoints(submissionType, submissionData) {
  let fieldCount = 0;
  let totalPossibleFields;

  if (submissionType === 'deal') {
    totalPossibleFields = 15; // Total optional fields for deals

    // Check each optional field
    if (submissionData.original_price) fieldCount++;
    if (submissionData.discount_percentage) fieldCount++;
    if (submissionData.merchant) fieldCount++;
    if (submissionData.category_id) fieldCount++;
    if (submissionData.deal_type && submissionData.deal_type !== 'deal') fieldCount++;
    if (submissionData.coupon_code) fieldCount++;
    if (submissionData.coupon_type && submissionData.coupon_type !== 'none') fieldCount++;
    if (submissionData.starts_at) fieldCount++;
    if (submissionData.expires_at) fieldCount++;
    if (submissionData.stock_status && submissionData.stock_status !== 'unknown') fieldCount++;
    if (submissionData.stock_quantity) fieldCount++;
    if (submissionData.tags) fieldCount++;
    if (submissionData.image_url) fieldCount++;
    if (submissionData.description) fieldCount++;
    if (submissionData.terms_conditions) fieldCount++;

  } else if (submissionType === 'coupon') {
    totalPossibleFields = 10; // Total optional fields for coupons

    if (submissionData.minimum_order_amount) fieldCount++;
    if (submissionData.maximum_discount_amount) fieldCount++;
    if (submissionData.usage_limit) fieldCount++;
    if (submissionData.usage_limit_per_user) fieldCount++;
    if (submissionData.starts_at) fieldCount++;
    if (submissionData.expires_at) fieldCount++;
    if (submissionData.source_url) fieldCount++;
    if (submissionData.category_id) fieldCount++;
    if (submissionData.description) fieldCount++;
    if (submissionData.terms_conditions) fieldCount++;
  }

  // Calculate karma based on field completion percentage
  if (fieldCount === 0) {
    return 3; // Only required fields
  } else if (fieldCount <= totalPossibleFields * 0.3) {
    return 5; // 30% or less of optional fields
  } else if (fieldCount <= totalPossibleFields * 0.7) {
    return 8; // 30-70% of optional fields
  } else {
    return 10; // 70%+ of optional fields
  }
}

// Review deal (approve/reject with single endpoint)
r.post('/deals/:id/review', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejection_reason } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required. Use "approve" or "reject"' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
    }

    if (action === 'reject' && !rejection_reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // First get the deal data to calculate karma (only for approval)
    let existingDeal = null;
    if (action === 'approve') {
      const { data: dealData, error: fetchError } = await supaAdmin
        .from('deals')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        return res.status(400).json({ error: fetchError.message });
      }
      existingDeal = dealData;
    }

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
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

    // Award karma points for approved deals
    if (action === 'approve' && deal.submitter_id) {
      const karmaPoints = calculateKarmaPoints('deal', existingDeal);

      // Get current karma and update it
      const { data: currentProfile } = await supaAdmin
        .from('profiles')
        .select('karma')
        .eq('id', deal.submitter_id)
        .single();

      if (currentProfile) {
        const newKarma = (currentProfile.karma || 0) + karmaPoints;
        await supaAdmin
          .from('profiles')
          .update({ karma: newKarma })
          .eq('id', deal.submitter_id);

        console.log(`Awarded ${karmaPoints} karma points to user ${deal.submitter_id} for detailed deal submission`);
      }
    }

    res.json({
      success: true,
      deal,
      karma_points: action === 'approve' ? calculateKarmaPoints('deal', existingDeal) : null
    });
  } catch (error) {
    console.error('Error reviewing deal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve deal (alias)
r.post('/deals/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // First get the deal data to calculate karma
    const { data: existingDeal, error: fetchError } = await supaAdmin
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    const updateData = {
      status: 'approved',
      approved_at: new Date().toISOString()
    };

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

    // Award karma points based on submission completeness
    if (deal.submitter_id) {
      const karmaPoints = calculateKarmaPoints('deal', existingDeal);

      // Get current karma and update it
      const { data: currentProfile } = await supaAdmin
        .from('profiles')
        .select('karma')
        .eq('id', deal.submitter_id)
        .single();

      if (currentProfile) {
        const newKarma = (currentProfile.karma || 0) + karmaPoints;
        await supaAdmin
          .from('profiles')
          .update({ karma: newKarma })
          .eq('id', deal.submitter_id);
      }

      console.log(`Awarded ${karmaPoints} karma points to user ${deal.submitter_id} for detailed deal submission`);
    }

    res.json({ success: true, deal, karma_points: calculateKarmaPoints('deal', existingDeal) });
  } catch (error) {
    console.error('Error reviewing deal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject deal (alias)
r.post('/deals/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });

    const updateData = {
      status: 'rejected',
      approved_at: new Date().toISOString(),
      rejection_reason: reason,
    };

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
    console.error('Error rejecting deal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve/Reject Coupon
r.post('/coupons/:id/review', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejection_reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
    }

    if (action === 'reject' && !rejection_reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // First get the coupon data to calculate karma (only for approval)
    let existingCoupon = null;
    if (action === 'approve') {
      const { data: couponData, error: fetchError } = await supaAdmin
        .from('coupons')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        return res.status(400).json({ error: fetchError.message });
      }
      existingCoupon = couponData;
    }

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
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

    // Award karma points for approved coupons
    if (action === 'approve' && coupon.submitter_id && existingCoupon) {
      const karmaPoints = calculateKarmaPoints('coupon', existingCoupon);

      // Get current karma and update it
      const { data: currentProfile } = await supaAdmin
        .from('profiles')
        .select('karma')
        .eq('id', coupon.submitter_id)
        .single();

      if (currentProfile) {
        const newKarma = (currentProfile.karma || 0) + karmaPoints;
        await supaAdmin
          .from('profiles')
          .update({ karma: newKarma })
          .eq('id', coupon.submitter_id);
      }

      console.log(`Awarded ${karmaPoints} karma points to user ${coupon.submitter_id} for detailed coupon submission`);

      res.json({ success: true, coupon, karma_points: karmaPoints });
    } else {
      res.json({ success: true, coupon });
    }
  } catch (error) {
    console.error('Error reviewing coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Edit Deal (Admin)
r.put('/deals/:id/edit', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      url,
      price,
      original_price,
      merchant,
      company_id,
      company_name,
      company_website,
      category_id,
      quality_score,
      deal_type,
      discount_percentage,
      discount_amount,
      coupon_code,
      expires_at,
      deal_images,
      featured_image,
      tags
    } = req.body;

    // Validate required fields
    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    let finalCompanyId = company_id;

    // Handle company creation if company doesn't exist
    if (!company_id && company_name) {
      try {
        // Check if company already exists
        const { data: existingCompany } = await supaAdmin
          .from('companies')
          .select('id')
          .ilike('name', company_name)
          .single();

        if (existingCompany) {
          finalCompanyId = existingCompany.id;
        } else {
          // Create new company
          const { data: newCompany, error: companyError } = await supaAdmin
            .from('companies')
            .insert([{
              name: company_name,
              slug: company_name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              website_url: company_website || null,
              status: 'active',
              created_by: req.user.id
            }])
            .select('id')
            .single();

          if (companyError) {
            console.error('Error creating company:', companyError);
            return res.status(400).json({ error: 'Failed to create company: ' + companyError.message });
          }

          finalCompanyId = newCompany.id;
        }
      } catch (error) {
        console.error('Error handling company:', error);
        return res.status(400).json({ error: 'Failed to handle company information' });
      }
    }

    // Update deal
    const updateData = {
      title: title.trim(),
      description: description?.trim() || null,
      url: url.trim(),
      price: price ? parseFloat(price) : null,
      original_price: original_price ? parseFloat(original_price) : null,
      merchant: merchant?.trim() || null,
      company_id: finalCompanyId,
      category_id: category_id || null,
      quality_score: quality_score !== undefined ? parseFloat(quality_score) : null,
      deal_type: deal_type || null,
      discount_percentage: discount_percentage ? parseFloat(discount_percentage) : null,
      discount_amount: discount_amount ? parseFloat(discount_amount) : null,
      coupon_code: coupon_code?.trim() || null,
      expires_at: expires_at || null,
      deal_images: deal_images || null,
      featured_image: featured_image || null,
      updated_at: new Date().toISOString()
    };

    const { data: deal, error } = await supaAdmin
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        companies(id, name, slug, logo_url, is_verified),
        categories(id, name, slug, color),
        profiles!submitter_id(handle, avatar_url, karma, created_at)
      `)
      .single();

    if (error) {
      console.error('Error updating deal:', error);
      return res.status(400).json({ error: error.message });
    }

    // Handle tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      try {
        // Remove existing deal tags
        const { error: deleteError } = await supaAdmin
          .from('deal_tags')
          .delete()
          .eq('deal_id', id);

        if (deleteError) {
          console.error('Error deleting existing tags:', deleteError);
        }

        // Process each tag
        for (const tag of tags) {
          let tagId;

          if (typeof tag === 'number' || (typeof tag === 'string' && !isNaN(tag))) {
            // Existing tag ID
            tagId = parseInt(tag);
          } else if (typeof tag === 'string') {
            // New tag - create it
            const { data: newTag, error: tagError } = await supaAdmin
              .from('tags')
              .upsert([{
                name: tag.trim().toLowerCase(),
                slug: tag.trim().toLowerCase().replace(/[^a-z0-9]/g, '-'),
                usage_count: 0
              }], {
                onConflict: 'name',
                ignoreDuplicates: false
              })
              .select('id')
              .single();

            if (tagError) {
              console.error('Error creating tag:', tagError);
              continue;
            }

            tagId = newTag.id;
          } else {
            continue;
          }

          // Associate tag with deal
          const { error: associationError } = await supaAdmin
            .from('deal_tags')
            .insert([{
              deal_id: id,
              tag_id: tagId
            }]);

          if (associationError) {
            console.error('Error associating tag with deal:', associationError);
          }
        }

      } catch (tagError) {
        console.error('Error processing tags:', tagError);
        // Don't fail the entire request if tags fail
      }
    }

    res.json({ success: true, deal });
  } catch (error) {
    console.error('Error editing deal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Edit Coupon (Admin)
r.put('/coupons/:id/edit', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      coupon_code,
      discount_value,
      coupon_type,
      company_id,
      company_name,
      company_website,
      category_id,
      minimum_order_amount,
      maximum_discount_amount,
      usage_limit,
      expires_at,
      terms_conditions,
      tags
    } = req.body;

    // Validate required fields
    if (!title || !coupon_code) {
      return res.status(400).json({ error: 'Title and coupon code are required' });
    }

    let finalCompanyId = company_id;

    // Handle company creation if company doesn't exist
    if (!company_id && company_name) {
      try {
        // Check if company already exists
        const { data: existingCompany } = await supaAdmin
          .from('companies')
          .select('id')
          .ilike('name', company_name)
          .single();

        if (existingCompany) {
          finalCompanyId = existingCompany.id;
        } else {
          // Create new company
          const { data: newCompany, error: companyError } = await supaAdmin
            .from('companies')
            .insert([{
              name: company_name,
              slug: company_name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              website_url: company_website || null,
              status: 'active',
              created_by: req.user.id
            }])
            .select('id')
            .single();

          if (companyError) {
            console.error('Error creating company:', companyError);
            return res.status(400).json({ error: 'Failed to create company: ' + companyError.message });
          }

          finalCompanyId = newCompany.id;
        }
      } catch (error) {
        console.error('Error handling company:', error);
        return res.status(400).json({ error: 'Failed to handle company information' });
      }
    }

    // Update coupon
    const updateData = {
      title: title.trim(),
      description: description?.trim() || null,
      coupon_code: coupon_code.trim(),
      discount_value: discount_value ? parseFloat(discount_value) : null,
      coupon_type: coupon_type || 'percentage',
      company_id: finalCompanyId,
      category_id: category_id || null,
      minimum_order_amount: minimum_order_amount ? parseFloat(minimum_order_amount) : null,
      maximum_discount_amount: maximum_discount_amount ? parseFloat(maximum_discount_amount) : null,
      usage_limit: usage_limit ? parseInt(usage_limit) : null,
      expires_at: expires_at || null,
      terms_conditions: terms_conditions?.trim() || null,
      updated_at: new Date().toISOString()
    };

    const { data: coupon, error } = await supaAdmin
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        companies(id, name, slug, logo_url, is_verified),
        categories(id, name, slug, color),
        profiles!submitter_id(handle, avatar_url, karma, created_at)
      `)
      .single();

    if (error) {
      console.error('Error updating coupon:', error);
      return res.status(400).json({ error: error.message });
    }

    // Handle tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      try {
        // Remove existing coupon tags
        const { error: deleteError } = await supaAdmin
          .from('coupon_tags')
          .delete()
          .eq('coupon_id', id);

        if (deleteError) {
          console.error('Error deleting existing coupon tags:', deleteError);
        }

        // Process each tag
        for (const tag of tags) {
          let tagId;

          if (typeof tag === 'number' || (typeof tag === 'string' && !isNaN(tag))) {
            // Existing tag ID
            tagId = parseInt(tag);
          } else if (typeof tag === 'string') {
            // New tag - create it
            const { data: newTag, error: tagError } = await supaAdmin
              .from('tags')
              .upsert([{
                name: tag.trim().toLowerCase(),
                slug: tag.trim().toLowerCase().replace(/[^a-z0-9]/g, '-'),
                usage_count: 0
              }], {
                onConflict: 'name',
                ignoreDuplicates: false
              })
              .select('id')
              .single();

            if (tagError) {
              console.error('Error creating tag:', tagError);
              continue;
            }

            tagId = newTag.id;
          } else {
            continue;
          }

          // Associate tag with coupon
          const { error: associationError } = await supaAdmin
            .from('coupon_tags')
            .insert([{
              coupon_id: id,
              tag_id: tagId
            }]);

          if (associationError) {
            console.error('Error associating tag with coupon:', associationError);
          }
        }

      } catch (tagError) {
        console.error('Error processing coupon tags:', tagError);
        // Don't fail the entire request if tags fail
      }
    }

    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Error editing coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users with pagination and filters
r.get('/users', requireAdmin, async (req, res) => {
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
r.post('/users/:id/role', requireAdmin, async (req, res) => {
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
r.get('/analytics', requireAdmin, async (req, res) => {
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
r.post('/deals/:id/feature', requireAdmin, async (req, res) => {
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

// Update deal (Admin only)
r.put('/deals/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      url,
      price,
      original_price,
      discount_percentage,
      discount_amount,
      merchant,
      image_url,
      featured_image,
      deal_images,
      category_id,
      deal_type,
      is_featured,
      expires_at,
      coupon_code,
      coupon_type,
      status,
      company_id,
    } = req.body || {};

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (url !== undefined) updateData.url = url;
    if (price !== undefined) updateData.price = price === '' ? null : parseFloat(price);
    if (original_price !== undefined) updateData.original_price = original_price === '' ? null : parseFloat(original_price);
    if (discount_percentage !== undefined) updateData.discount_percentage = discount_percentage === '' ? null : parseFloat(discount_percentage);
    if (discount_amount !== undefined) updateData.discount_amount = discount_amount === '' ? null : parseFloat(discount_amount);
    if (merchant !== undefined) updateData.merchant = merchant;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (featured_image !== undefined) updateData.featured_image = featured_image;
    if (deal_images !== undefined) updateData.deal_images = deal_images; // expecting array
    if (category_id !== undefined) updateData.category_id = category_id === '' ? null : parseInt(category_id);
    if (company_id !== undefined) updateData.company_id = company_id === '' ? null : parseInt(company_id);
    if (deal_type !== undefined) updateData.deal_type = deal_type;
    if (is_featured !== undefined) updateData.is_featured = !!is_featured;
    if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at).toISOString() : null;
    if (coupon_code !== undefined) updateData.coupon_code = coupon_code;
    if (coupon_type !== undefined) updateData.coupon_type = coupon_type;
    if (status !== undefined) updateData.status = status;

    const { data: deal, error } = await supaAdmin
      .from('deals')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, deal });
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update coupon (Admin only)
r.put('/coupons/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      coupon_code,
      coupon_type,
      is_featured,
      expires_at,
      status,
      company_id,
      category_id,
      image_url,
    } = req.body || {};

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (coupon_code !== undefined) updateData.coupon_code = coupon_code;
    if (coupon_type !== undefined) updateData.coupon_type = coupon_type;
    if (is_featured !== undefined) updateData.is_featured = !!is_featured;
    if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at).toISOString() : null;
    if (status !== undefined) updateData.status = status;
    if (company_id !== undefined) updateData.company_id = company_id === '' ? null : parseInt(company_id);
    if (category_id !== undefined) updateData.category_id = category_id === '' ? null : parseInt(category_id);
    if (image_url !== undefined) updateData.image_url = image_url;

    const { data: coupon, error } = await supaAdmin
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

r.post('/coupons/:id/feature', requireAdmin, async (req, res) => {
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
r.get('/expiration/stats', requireAdmin, async (req, res) => {
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
r.get('/expiration/expiring-soon', requireAdmin, async (req, res) => {
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
r.post('/expiration/mark-expired', requireAdmin, async (req, res) => {
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
r.post('/expiration/cleanup', requireAdmin, async (req, res) => {
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
r.get('/gamification/stats', requireAdmin, async (req, res) => {
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

r.get('/gamification/achievements', requireAdmin, async (req, res) => {
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

r.post('/gamification/achievements', requireAdmin, async (req, res) => {
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

r.put('/gamification/achievements/:id', requireAdmin, async (req, res) => {
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

r.get('/gamification/xp-config', requireAdmin, async (req, res) => {
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

r.put('/gamification/xp-config/:id', requireAdmin, async (req, res) => {
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
r.get('/auto-tagging/stats', requireAdmin, async (req, res) => {
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

r.get('/auto-tagging/merchant-patterns', requireAdmin, async (req, res) => {
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

r.post('/auto-tagging/merchant-patterns', requireAdmin, async (req, res) => {
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

r.get('/auto-tagging/category-patterns', requireAdmin, async (req, res) => {
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

r.post('/auto-tagging/category-patterns', requireAdmin, async (req, res) => {
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
r.get('/price-tracking/stats', requireAdmin, async (req, res) => {
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

r.get('/price-tracking/alerts', requireAdmin, async (req, res) => {
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
r.get('/saved-searches/stats', requireAdmin, async (req, res) => {
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

r.get('/saved-searches/list', requireAdmin, async (req, res) => {
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

r.get('/notifications/queue', requireAdmin, async (req, res) => {
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
r.get('/system/health', requireAdmin, async (req, res) => {
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

// Admin: list reports with deal info
r.get('/reports', requireAdmin, async (_req, res) => {
  try {
    const { data: reports, error } = await supaAdmin
      .from('reports')
      .select(`
        *,
        deals(title)
      `)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return res.status(400).json({ error: error.message });
    res.json(reports || []);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Admin: delete report
r.delete('/reports/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supaAdmin
      .from('reports')
      .delete()
      .eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});



// Delete Deal (Admin only)
r.delete('/deals/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // First, delete associated images from storage
    const { data: images } = await supaAdmin
      .from('images')
      .select('storage_path')
      .eq('entity_type', 'deal')
      .eq('entity_id', id);

    if (images && images.length > 0) {
      const pathsToDelete = images.map(img => img.storage_path);
      await supaAdmin.storage
        .from('images')
        .remove(pathsToDelete);
    }

    // Delete associated records (tags, votes, etc.)
    await supaAdmin
      .from('deal_tags')
      .delete()
      .eq('deal_id', id);

    await supaAdmin
      .from('deal_votes')
      .delete()
      .eq('deal_id', id);

    await supaAdmin
      .from('images')
      .delete()
      .eq('entity_type', 'deal')
      .eq('entity_id', id);

    // Finally, delete the deal
    const { error } = await supaAdmin
      .from('deals')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete Coupon (Admin only)
r.delete('/coupons/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // First, delete associated images from storage
    const { data: images } = await supaAdmin
      .from('images')
      .select('storage_path')
      .eq('entity_type', 'coupon')
      .eq('entity_id', id);

    if (images && images.length > 0) {
      const pathsToDelete = images.map(img => img.storage_path);
      await supaAdmin.storage
        .from('images')
        .remove(pathsToDelete);
    }

    // Delete associated records (tags, votes, etc.)
    await supaAdmin
      .from('coupon_tags')
      .delete()
      .eq('coupon_id', id);

    await supaAdmin
      .from('coupon_votes')
      .delete()
      .eq('coupon_id', id);

    await supaAdmin
      .from('images')
      .delete()
      .eq('entity_type', 'coupon')
      .eq('entity_id', id);

    // Finally, delete the coupon
    const { error } = await supaAdmin
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update/Edit Coupon
r.put('/coupons/:id/edit', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    const tags = updateData.tags;

    // Handle company creation/association
    if (updateData.company_name && !updateData.company_id) {
      // Create new company
      const { data: newCompany, error: companyError } = await supaAdmin
        .from('companies')
        .insert({
          name: updateData.company_name,
          slug: updateData.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          website_url: updateData.company_website || null
        })
        .select()
        .single();

      if (companyError) {
        return res.status(400).json({ error: `Failed to create company: ${companyError.message}` });
      }

      updateData.company_id = newCompany.id;
    }

    // Remove company creation fields and tags from coupon update
    delete updateData.company_name;
    delete updateData.company_website;
    delete updateData.tags;

    const { data: coupon, error } = await supaAdmin
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        companies(name, website_url),
        profiles!submitter_id(handle)
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Handle tags if provided
    if (tags && Array.isArray(tags)) {
      // Remove existing coupon tags
      await supaAdmin.from('coupon_tags').delete().eq('coupon_id', id);

      // Process and add new tags
      const tagIds = [];
      for (const tag of tags) {
        if (typeof tag === 'string') {
          // Create new tag
          const tagSlug = tag.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const { data: newTag, error: tagError } = await supaAdmin
            .from('tags')
            .upsert({
              name: tag,
              slug: tagSlug,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'slug'
            })
            .select()
            .single();

          if (!tagError && newTag) {
            tagIds.push(newTag.id);
          }
        } else if (typeof tag === 'number') {
          // Existing tag ID
          tagIds.push(tag);
        }
      }

      // Create coupon-tag associations
      if (tagIds.length > 0) {
        const couponTagRows = tagIds.map(tag_id => ({ coupon_id: parseInt(id), tag_id }));
        await supaAdmin.from('coupon_tags').insert(couponTagRows);
      }
    }

    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tags for admin management
r.get('/tags', requireAdmin, async (req, res) => {
  try {
    const { data: tags, error } = await supaAdmin
      .from('tags')
      .select('*')
      .order('name');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(tags || []);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Run expiration check manually
r.post('/expire-items', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supaAdmin.rpc('handle_expired_items');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      expired_count: data || 0,
      message: `Successfully expired ${data || 0} items`
    });
  } catch (error) {
    console.error('Error running expiration check:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get items expiring soon
r.get('/expiring-soon', requireAdmin, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const { data, error } = await supaAdmin.rpc('get_expiring_soon', { hours_ahead: hours });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload images for admin use
r.post('/upload-image', requireAdmin, upload.single('image'), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Check if images bucket exists
    const { data: buckets, error: bucketError } = await supaAdmin.storage.listBuckets();
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      return res.status(500).json({ error: 'Storage service unavailable' });
    }

    const imagesBucket = buckets.find(bucket => bucket.id === 'images');
    if (!imagesBucket) {
      console.error('Images bucket not found. Available buckets:', buckets.map(b => b.id));
      return res.status(500).json({ error: 'Images storage bucket not configured' });
    }


    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `admin-${randomUUID()}.${fileExtension}`;
    const filePath = `admin-uploads/${fileName}`;


    // Upload to Supabase Storage
    const { data, error } = await supaAdmin.storage
      .from('images')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return res.status(500).json({
        error: 'Failed to upload image',
        details: error.message,
        code: error.statusCode
      });
    }


    // Get public URL
    const { data: urlData } = supaAdmin.storage
      .from('images')
      .getPublicUrl(filePath);


    res.json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName: fileName,
      filePath: filePath
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Delete Company (Admin only)
r.delete('/companies/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting company:', id);

    // Check if company exists
    const { data: company, error: checkError } = await supaAdmin
      .from('companies')
      .select('id, name, logo_url')
      .eq('id', id)
      .single();

    if (checkError || !company) {
      console.log('❌ Company not found:', id);
      return res.status(404).json({ error: 'Company not found' });
    }

    console.log('✅ Found company to delete:', company.name);

    // Check for related data (deals and coupons)
    const [dealsResult, couponsResult] = await Promise.all([
      supaAdmin
        .from('deals')
        .select('id', { count: 'exact' })
        .eq('company_id', id),
      supaAdmin
        .from('coupons')
        .select('id', { count: 'exact' })
        .eq('company_id', id)
    ]);

    const dealsCount = dealsResult.count || 0;
    const couponsCount = couponsResult.count || 0;

    console.log(`📊 Related data found - Deals: ${dealsCount}, Coupons: ${couponsCount}`);

    // Delete related deals and coupons first (cascade delete)
    if (dealsCount > 0) {
      console.log('🗑️ Deleting related deals...');
      await supaAdmin
        .from('deals')
        .delete()
        .eq('company_id', id);
    }

    if (couponsCount > 0) {
      console.log('🗑️ Deleting related coupons...');
      await supaAdmin
        .from('coupons')
        .delete()
        .eq('company_id', id);
    }

    // Delete company logo from storage if it exists
    if (company.logo_url) {
      try {
        const fileName = company.logo_url.split('/').pop();
        if (fileName) {
          console.log('🗑️ Deleting company logo:', fileName);
          await supaAdmin.storage
            .from('images')
            .remove([`companies/${fileName}`]);
        }
      } catch (logoError) {
        console.log('⚠️ Could not delete logo:', logoError.message);
        // Continue with company deletion even if logo deletion fails
      }
    }

    // Delete the company
    const { error: deleteError } = await supaAdmin
      .from('companies')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error deleting company:', deleteError);
      return res.status(500).json({ error: 'Failed to delete company' });
    }

    console.log('✅ Company deleted successfully:', company.name);

    res.json({
      success: true,
      message: `Company "${company.name}" deleted successfully`,
      deletedData: {
        company: company.name,
        deals: dealsCount,
        coupons: couponsCount
      }
    });

  } catch (error) {
    console.error('❌ Error deleting company:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default r;