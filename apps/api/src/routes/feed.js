import { Router } from 'express';
import { makeAdminClient } from '../lib/supa.js';

const router = Router();
const supa = makeAdminClient();

// Get unified feed data with pagination and filtering (Deals + Coupons)
// Pattern: Instagram/Facebook unified content feed
router.get('/', async (req, res) => {
  try {
    const { 
      cursor = 0, 
      limit = 12, 
      filter = 'all',
      category,
      sort = 'newest'
    } = req.query;

    // No hard limit - support infinite scrolling with large batches
    const limitNum = parseInt(limit) || 20;
    const cursorNum = parseInt(cursor) || 0;

    // Fetch both deals and coupons in parallel - NO LIMIT to get everything
    const [dealsResult, couponsResult] = await Promise.all([
      // Fetch ALL deals with images
      supa
        .from('deals')
        .select(`
          id,
          title,
          description,
          price,
          original_price,
          discount_percentage,
          merchant,
          category_id,
          image_url,
          featured_image,
          submitter_id,
          status,
          created_at,
          updated_at,
          expires_at,
          deal_images,
          companies (
            id,
            name,
            slug,
            logo_url,
            is_verified
          ),
          profiles!deals_submitter_id_fkey (
            id,
            handle,
            display_name,
            avatar_url,
            karma
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false }),

      // Fetch ALL coupons
      supa
        .from('coupons')
        .select(`
          id,
          title,
          description,
          coupon_code,
          discount_type,
          discount_value,
          category_id,
          submitter_id,
          status,
          created_at,
          updated_at,
          expires_at,
          companies (
            id,
            name,
            slug,
            logo_url,
            is_verified
          ),
          profiles!coupons_submitter_id_fkey (
            id,
            handle,
            display_name,
            avatar_url,
            karma
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
    ]);

    if (dealsResult.error) {
      console.error('Deals query error:', dealsResult.error);
    }

    if (couponsResult.error) {
      console.error('Coupons query error:', couponsResult.error);
    }

    const deals = dealsResult.data || [];
    const coupons = couponsResult.data || [];

    // Transform deals for the feed
    const transformedDeals = deals.map(deal => ({
      id: deal.id,
      content_id: `deal-${deal.id}`,
      type: 'deal',
      title: deal.title,
      description: deal.description,
      price: deal.price,
      original_price: deal.original_price,
      discount_percentage: deal.discount_percentage,
      merchant: deal.merchant,
      category: deal.category_id, // Use category_id instead of category
      image_url: deal.image_url || deal.featured_image,
      featured_image: deal.featured_image,
      deal_images: deal.deal_images || [],
      submitter_id: deal.submitter_id,
      status: deal.status,
      created_at: deal.created_at,
      updated_at: deal.updated_at,
      expires_at: deal.expires_at,
      company: deal.companies,
      companies: deal.companies,
      profiles: deal.profiles,
      submitter: deal.profiles,
      // Engagement metrics (defaults, will be populated by joins if available)
      ups: 0,
      downs: 0,
      comments_count: 0,
      views_count: 0,
      saves_count: 0
    }));

    // Transform coupons for the feed
    const transformedCoupons = coupons.map(coupon => ({
      id: coupon.id,
      content_id: `coupon-${coupon.id}`,
      type: 'coupon',
      title: coupon.title,
      description: coupon.description,
      coupon_code: coupon.coupon_code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      category: coupon.category_id, // Use category_id instead of category
      submitter_id: coupon.submitter_id,
      status: coupon.status,
      created_at: coupon.created_at,
      updated_at: coupon.updated_at,
      expires_at: coupon.expires_at,
      company: coupon.companies,
      companies: coupon.companies,
      profiles: coupon.profiles,
      submitter: coupon.profiles,
      // Engagement metrics (defaults)
      ups: 0,
      downs: 0,
      comments_count: 0,
      views_count: 0,
      saves_count: 0
    }));

    // Merge and sort by created_at (most recent first)
    const allItems = [...transformedDeals, ...transformedCoupons]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(cursorNum, cursorNum + limitNum);

    // Apply filters after merging
    let filteredItems = allItems;

    // Price-based filters
    if (filter === 'under-10') {
      filteredItems = allItems.filter(item => item.price && item.price < 10);
    } else if (filter === 'under-25') {
      filteredItems = allItems.filter(item => item.price && item.price < 25);
    } else if (filter === 'under-50') {
      filteredItems = allItems.filter(item => item.price && item.price < 50);
    }
    // Discount-based filters
    else if (filter === '50-off') {
      filteredItems = allItems
        .filter(item => item.discount_percentage >= 50)
        .sort((a, b) => b.discount_percentage - a.discount_percentage);
    }
    // Time-based filters
    else if (filter === 'trending') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filteredItems = allItems
        .filter(item => new Date(item.created_at) >= sevenDaysAgo)
        .sort((a, b) => (b.ups - b.downs) - (a.ups - a.downs));
    } else if (filter === 'hot') {
      // Hot deals: High engagement in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filteredItems = allItems
        .filter(item => new Date(item.created_at) >= oneDayAgo && (item.ups - item.downs) > 5)
        .sort((a, b) => (b.ups - b.downs) - (a.ups - a.downs));
    } else if (filter === 'ending-soon') {
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      filteredItems = allItems
        .filter(item => item.expires_at && new Date(item.expires_at) <= threeDaysFromNow)
        .sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at));
    } else if (filter === 'new-arrivals') {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      filteredItems = allItems.filter(item => new Date(item.created_at) >= threeDaysAgo);
    }
    // Special filters
    else if (filter === 'freebies') {
      filteredItems = allItems.filter(item => item.price === 0 || item.price === null);
    } else if (filter === 'flash-sale') {
      // Flash sales: High discount + ending soon
      const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      filteredItems = allItems
        .filter(item => 
          item.discount_percentage >= 40 && 
          item.expires_at && 
          new Date(item.expires_at) <= twoDaysFromNow
        )
        .sort((a, b) => b.discount_percentage - a.discount_percentage);
    } else if (filter === 'free-shipping') {
      filteredItems = allItems.filter(item => 
        item.title?.toLowerCase().includes('free shipping') || 
        item.description?.toLowerCase().includes('free shipping')
      );
    }

    // Apply category filter
    if (category) {
      filteredItems = filteredItems.filter(item => {
        const itemCategory = item.category?.toString() || '';
        const itemTitle = item.title?.toLowerCase() || '';
        const itemDescription = item.description?.toLowerCase() || '';
        const categoryLower = category.toLowerCase();
        
        // Check if category_id matches or if title/description contains category name
        return itemCategory === category || 
               itemTitle.includes(categoryLower) || 
               itemDescription.includes(categoryLower);
      });
    }

    // Get next cursor
    const nextCursor = filteredItems.length === limitNum 
      ? cursorNum + limitNum 
      : null;

    // Debug logging
    console.log('[Feed API] Request:', { filter, category, totalItems: allItems.length, filteredCount: filteredItems.length });

    res.json({
      data: filteredItems,
      items: filteredItems, // Support both formats
      nextCursor,
      hasMore: nextCursor !== null,
      meta: {
        total: filteredItems.length,
        deals_count: transformedDeals.length,
        coupons_count: transformedCoupons.length,
        filter,
        category
      }
    });

  } catch (error) {
    console.error('Feed endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get feed stats for the homepage
router.get('/stats', async (req, res) => {
  try {
    const [
      { count: totalDeals },
      { count: activeDeals },
      { count: totalUsers }
    ] = await Promise.all([
      supa.from('deals').select('*', { count: 'exact', head: true }),
      supa.from('deals').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supa.from('profiles').select('*', { count: 'exact', head: true })
    ]);

    res.json({
      totalDeals: totalDeals || 0,
      activeDeals: activeDeals || 0,
      totalUsers: totalUsers || 0
    });
  } catch (error) {
    console.error('Feed stats error:', error);
    res.status(500).json({ error: 'Failed to fetch feed stats' });
  }
});

export default router;