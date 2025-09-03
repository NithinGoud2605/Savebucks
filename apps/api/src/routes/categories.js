import { Router } from 'express';
import { makeAdminClient } from '../lib/supa.js';
import { log } from '../lib/logger.js';

const r = Router();
const supaAdmin = makeAdminClient();

/**
 * Get all categories with optional hierarchy
 * GET /api/categories
 * Query params: ?include_subcategories=true&featured_only=true
 */
r.get('/', async (req, res) => {
  try {
    const { data: categories, error } = await supaAdmin
      .from('categories')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) throw error;
    
    res.json(categories);
  } catch (error) {
    log('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



/**
 * Get all collections
 * GET /api/collections
 * Query params: ?featured_only=true
 */
r.get('/collections', async (req, res) => {
  try {
    const { featured_only } = req.query;
    
    let query = supaAdmin
      .from('collections')
      .select(`
        *,
        categories(name, slug)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (featured_only === 'true') {
      query = query.eq('is_featured', true);
    }
    
    const { data: collections, error } = await query;
    
    if (error) throw error;
    
    res.json(collections);
  } catch (error) {
    log('Get collections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get collection by slug with deals
 * GET /api/collections/:slug
 */
r.get('/collections/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    // Get collection details
    const { data: collection, error: collectionError } = await supaAdmin
      .from('collections')
      .select(`
        *,
        categories(name, slug)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    if (collectionError || !collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    let deals = [];
    
    // Get deals based on collection type
    if (collection.type === 'manual') {
      // Manual collection - get deals from collection_items
      const { data: manualDeals, error: manualError } = await supaAdmin
        .from('collection_items')
        .select(`
          deals!inner(
            id, title, url, price, merchant, description, image_url, 
            created_at, coupon_code, coupon_type, discount_percentage,
            discount_amount, original_price, expires_at
          )
        `)
        .eq('collection_id', collection.id)
        .order('sort_order', { ascending: true })
        .range(offset, offset + limit - 1);
      
      if (!manualError) {
        deals = manualDeals.map(item => item.deals);
      }
    } else {
      // Auto collection - build query based on type
      let dealsQuery = supaAdmin
        .from('deals')
        .select('id, title, url, price, merchant, description, image_url, created_at, coupon_code, coupon_type, discount_percentage, discount_amount, original_price, expires_at')
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });
      
      if (collection.type === 'auto_category' && collection.category_id) {
        dealsQuery = dealsQuery.eq('category_id', collection.category_id);
      }
      
      if (collection.type === 'auto_merchant' && collection.merchant) {
        dealsQuery = dealsQuery.ilike('merchant', `%${collection.merchant}%`);
      }
      
      if (collection.type === 'auto_discount' && collection.min_discount) {
        dealsQuery = dealsQuery.gte('discount_percentage', collection.min_discount);
      }
      
      const maxItems = collection.max_items || 20;
      dealsQuery = dealsQuery.range(offset, Math.min(offset + limit - 1, maxItems - 1));
      
      const { data: autoDeals, error: autoError } = await dealsQuery;
      
      if (!autoError) {
        deals = autoDeals;
      }
    }
    
    // Get vote aggregations for deals
    const dealIds = deals.map(d => d.id);
    let voteMap = new Map();
    
    if (dealIds.length > 0) {
      try {
        const { data: votesAgg } = await supaAdmin.rpc('get_votes_agg');
        (votesAgg || []).forEach(v => {
          if (dealIds.includes(v.deal_id)) {
            voteMap.set(v.deal_id, v);
          }
        });
      } catch (_) {}
    }
    
    // Enrich deals with vote data
    const enrichedDeals = deals.map(deal => {
      const votes = voteMap.get(deal.id) || { ups: 0, downs: 0 };
      return {
        ...deal,
        ups: votes.ups || 0,
        downs: votes.downs || 0
      };
    });
    
    res.json({
      ...collection,
      deals: enrichedDeals
    });
  } catch (error) {
    log('Get collection deals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get active banners
 * GET /api/banners
 * Query params: ?position=hero
 */
r.get('/banners', async (req, res) => {
  try {
    const { position } = req.query;
    
    let query = supaAdmin
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .or('start_date.is.null,start_date.lte.now()')
      .or('end_date.is.null,end_date.gte.now()')
      .order('sort_order', { ascending: true });
    
    if (position) {
      query = query.eq('position', position);
    }
    
    const { data: banners, error } = await query;
    
    if (error) throw error;
    
    res.json(banners);
  } catch (error) {
    log('Get banners error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get deal tags
 * GET /api/deal-tags
 */
r.get('/deal-tags', async (req, res) => {
  try {
    const { data: tags, error } = await supaAdmin
      .from('deal_tags')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    res.json(tags);
  } catch (error) {
    log('Get deal tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get category by slug
 * GET /api/categories/:slug
 */
r.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const { data: category, error } = await supaAdmin
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error || !category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Get subcategories if this is a parent category
    const { data: subcategories } = await supaAdmin
      .from('categories')
      .select('*')
      .eq('parent_id', category.id)
      .order('id', { ascending: true });
    
    res.json({
      ...category,
      subcategories: subcategories || []
    });
  } catch (error) {
    log('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default r;

