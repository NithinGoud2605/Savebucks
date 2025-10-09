import { Router } from 'express';
import { hotScore, normalizeUrl } from '@savebucks/shared';
import { makeAdminClient } from '../lib/supa.js';
import { makeUserClientFromToken } from '../lib/supaUser.js';
import { createSafeUserClient } from '../lib/authUtils.js';
import multer from 'multer';
import path from 'path';

const r = Router();
const supaAdmin = makeAdminClient();

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

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for deal images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  }
});

function bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// Extract hashtags from text like "#electronics #TV-Deals" → ["electronics","tv-deals"]
function parseHashtags(...texts) {
  const combined = (texts || []).filter(Boolean).join(' ');
  const matches = combined.match(/(^|\s)#([a-z0-9][a-z0-9-_]*)/gi) || [];
  return Array.from(new Set(matches.map(m => m.replace(/^[^#]*#/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/-{2,}/g, '-')
  )));
}

async function ensureTagsReturnIds(slugs) {
  if (!slugs || slugs.length === 0) return [];
  // Fetch existing
  const { data: existing } = await supaAdmin
    .from('tags')
    .select('id, slug')
    .in('slug', slugs);
  const existingMap = new Map((existing || []).map(t => [t.slug, t.id]));
  const missing = slugs.filter(s => !existingMap.has(s));
  if (missing.length > 0) {
    const toInsert = missing.map(slug => ({
      name: slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      slug,
      color: '#3B82F6',
      category: 'custom',
      is_featured: false,
    }));
    const { data: inserted } = await supaAdmin
      .from('tags')
      .insert(toInsert)
      .select('id, slug');
    (inserted || []).forEach(t => existingMap.set(t.slug, t.id));
  }
  return slugs.map(s => existingMap.get(s)).filter(Boolean);
}

async function listDeals(tab, filters = {}) {
  let query = supaAdmin
    .from('deals')
    .select(`
      id, title, url, price, merchant, created_at, approved_at, status,
      description, image_url, deal_images, featured_image, coupon_code, coupon_type, discount_percentage,
      discount_amount, original_price, expires_at, category_id, deal_type,
      is_featured, views_count, clicks_count, submitter_id,
      categories(name, slug),
      companies(name, slug, logo_url, is_verified),
      profiles!submitter_id(id, handle, avatar_url, karma, role),
      deal_tags(tags(id, name, slug, color, category))
    `)
    .eq('status','approved');
    
  // Apply filters
  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  
  if (filters.merchant) {
    query = query.ilike('merchant', `%${filters.merchant}%`);
  }
  
  if (filters.min_discount) {
    query = query.gte('discount_percentage', filters.min_discount);
  }
  
  if (filters.max_price) {
    query = query.lte('price', filters.max_price);
  }
  
  if (filters.has_coupon) {
    query = query.not('coupon_code', 'is', null);
  }
  
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,merchant.ilike.%${filters.search}%`);
  }
  
  if (filters.tags && filters.tags.length > 0) {
    // Filter deals that have any of the specified tags
    const tagIds = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
    query = query.in('deal_tags.tag_id', tagIds);
  }

  if (filters.ending_soon) {
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    query = query.not('expires_at', 'is', null).lt('expires_at', threeDaysFromNow);
  }

  if (filters.exclude) {
    query = query.neq('id', filters.exclude);
  }

  if (filters.free_shipping) {
    query = query.eq('is_free_shipping', true);
  }

  if (filters.timeframe === 'week') {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('approved_at', oneWeekAgo);
  }
    
  query = query.order('approved_at', { ascending: false }).limit(200);
  
  const { data, error } = await query;
  if (error) throw error;

  const now = Math.floor(Date.now() / 1000);

  let voteMap = new Map();
  try {
    const { data: votesAgg } = await supaAdmin.rpc('get_votes_agg');
    (votesAgg || []).forEach(v => voteMap.set(v.deal_id, v));
  } catch (_) {}

  const enriched = data.map(d => {
    const createdSec = Math.floor(new Date(d.created_at).getTime() / 1000);
    const v = voteMap.get(d.id) || { ups: 0, downs: 0 };
    
    // Calculate savings and discount info
    let savings = null;
    let discountText = null;
    
    if (d.original_price && d.price) {
      savings = d.original_price - d.price;
      const discountPercent = Math.round((savings / d.original_price) * 100);
      discountText = `${discountPercent}% OFF`;
    } else if (d.discount_percentage) {
      discountText = `${d.discount_percentage}% OFF`;
    } else if (d.discount_amount) {
      discountText = `$${d.discount_amount} OFF`;
    }
    
    return {
      id: d.id,
      title: d.title,
      url: d.url,
      price: d.price,
      original_price: d.original_price,
      merchant: d.merchant,
      store: d.companies?.name || d.merchant,
      description: d.description,
      image_url: d.image_url,
      deal_images: d.deal_images,
      featured_image: d.featured_image,
      created: createdSec,
      ups: v.ups || 0,
      downs: v.downs || 0,
      vote_score: (v.ups || 0) - (v.downs || 0),
      hot: hotScore(v.ups || 0, v.downs || 0, createdSec, now),
      coupon_code: d.coupon_code,
      coupon_type: d.coupon_type,
      discount_percentage: d.discount_percentage,
      discount_amount: d.discount_amount,
      expires_at: d.expires_at,
      category: d.categories,
      company: d.companies,
      deal_type: d.deal_type,
      is_featured: d.is_featured,
      views_count: d.views_count || 0,
      view_count: d.views_count || 0, // Keep both for compatibility
      clicks_count: d.clicks_count || 0,
      submitter: d.profiles, // Include submitter information
      submitter_id: d.submitter_id,
      savings,
      discount_text: discountText,
      free_shipping: d.is_free_shipping || false
    };
  });

  // Apply tab-specific filtering and sorting
  switch (tab) {
    case 'new':
    case 'newest':
      return enriched.sort((a,b) => b.created - a.created);
    
    case 'trending':
      // For trending, prioritize recent deals with high engagement
      const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      return enriched
        .filter(deal => deal.created > oneDayAgo)
        .sort((a,b) => {
          const aScore = (a.vote_score * 2) + (a.view_count * 0.1) + (a.clicks_count * 0.5);
          const bScore = (b.vote_score * 2) + (b.view_count * 0.1) + (b.clicks_count * 0.5);
          return bScore - aScore;
        });
    
    case 'popular':
      // For popular (top deals this week), use votes + clicks from this week
      const oneWeekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
      return enriched
        .filter(deal => deal.created > oneWeekAgo)
        .sort((a,b) => {
          const aScore = (a.vote_score * 3) + (a.clicks_count * 1) + (a.view_count * 0.2);
          const bScore = (b.vote_score * 3) + (b.clicks_count * 1) + (b.view_count * 0.2);
          return bScore - aScore;
        });
    
    case 'personalized':
      // For personalized, mix featured deals with high-rated ones
      return enriched
        .sort((a,b) => {
          const aScore = (a.is_featured ? 100 : 0) + (a.vote_score * 2) + (a.view_count * 0.1);
          const bScore = (b.is_featured ? 100 : 0) + (b.vote_score * 2) + (b.view_count * 0.1);
          return bScore - aScore;
        });
    
    case 'discount':
      // Sort by discount percentage
      return enriched
        .filter(deal => deal.discount_percentage && deal.discount_percentage > 0)
        .sort((a,b) => (b.discount_percentage || 0) - (a.discount_percentage || 0));
    
    case 'under-20':
      return enriched
        .filter(deal => deal.price && deal.price <= 20)
        .sort((a,b) => b.hot - a.hot);
    
    case '50-percent-off':
      return enriched
        .filter(deal => deal.discount_percentage && deal.discount_percentage >= 50)
        .sort((a,b) => b.hot - a.hot);
    
    case 'free-shipping':
      return enriched
        .filter(deal => deal.free_shipping || 
                       deal.title.toLowerCase().includes('free shipping') || 
                       deal.description?.toLowerCase().includes('free shipping'))
        .sort((a,b) => b.hot - a.hot);
    
    case 'new-arrivals':
      const newArrivalWeek = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
      return enriched
        .filter(deal => deal.created > newArrivalWeek)
        .sort((a,b) => b.created - a.created);
    
    case 'hot-deals':
      return enriched
        .filter(deal => deal.vote_score >= 5) // Popular deals
        .sort((a,b) => b.hot - a.hot);
    
    case 'ending-soon':
      const nowSec = Math.floor(Date.now() / 1000);
      const threeDaysFromNow = nowSec + (3 * 24 * 60 * 60);
      return enriched
        .filter(deal => deal.expires_at && new Date(deal.expires_at).getTime() / 1000 < threeDaysFromNow)
        .sort((a,b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
    
    default: // 'hot'
      return enriched.sort((a,b) => b.hot - a.hot);
  }
}

r.get('/', async (req, res) => {
  try {
    // Support both tab= and sort= aliases from frontend
    const tab = (req.query.tab || req.query.sort_by || 'hot').toString().replace('newest','new').replace('top_rated','hot');
    const filters = {
      category_id: req.query.category_id ? parseInt(req.query.category_id) : null,
      merchant: req.query.merchant,
      min_discount: req.query.min_discount ? parseInt(req.query.min_discount) : null,
      max_price: req.query.max_price ? parseFloat(req.query.max_price) : null,
      has_coupon: req.query.has_coupon === 'true',
      search: req.query.search,
      ending_soon: req.query.ending_soon === 'true',
      timeframe: req.query.timeframe,
      exclude: req.query.exclude ? parseInt(req.query.exclude) : null
    };
    // If search contains hashtags, convert to tag filters (union with any provided tags[])
    let tagIdsFromSearch = [];
    if (filters.search && /#/.test(filters.search)) {
      const slugs = parseHashtags(filters.search);
      tagIdsFromSearch = await ensureTagsReturnIds(slugs);
    }
    if (tagIdsFromSearch.length > 0) {
      filters.tags = tagIdsFromSearch;
    }
    
    const items = await listDeals(tab, filters);
    
    // Ensure all deals have company data and proper field mapping
    const enrichedItems = items.map(deal => {
      if (!deal.company) {
        // Create a virtual company object from merchant data or use a default
        const companyName = deal.merchant || 'Unknown Company'
        deal.company = {
          name: companyName,
          slug: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-'),
          logo_url: null,
          is_verified: false
        }
      }
      
      // Ensure submitter information is properly formatted
      if (deal.submitter_id && !deal.submitter) {
        // If no profile found but submitter_id exists, create a basic submitter object
        deal.submitter = {
          id: deal.submitter_id,
          handle: `User ${deal.submitter_id}`,
          avatar_url: null,
          role: 'user',
          karma: 0
        }
      }
      
      return deal
    })
    
    // Featured filter if requested
    let out = enrichedItems;
    if (req.query.featured === 'true') {
      const { data: featuredIds } = await supaAdmin
        .from('deals')
        .select('id')
        .eq('is_featured', true)
        .eq('status', 'approved');
      const set = new Set((featuredIds||[]).map(d=>d.id));
      out = enrichedItems.filter(d => set.has(d.id));
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    let finalResult = limit ? out.slice(0, Math.max(0, limit)) : out;
    
    // Return only real deals, no duplication
    console.log(`🔍 Deals API Debug: limit=${limit}, finalResult.length=${finalResult.length}`);
    
    res.json(finalResult);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Deal detail (includes comments + vote agg) */
r.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data: d, error: dErr } = await supaAdmin
      .from('deals')
      .select(`
        id,title,url,price,merchant,description,image_url,deal_images,featured_image,created_at,status,category_id,deal_type,is_featured,views_count,clicks_count,expires_at,original_price,discount_percentage,discount_amount,coupon_code,coupon_type,company_id,submitter_id,
        companies(
          id,name,slug,logo_url,website_url,is_verified,description,founded_year,headquarters,employee_count,revenue_range,social_media,contact_info,business_hours,payment_methods,shipping_info,return_policy,customer_service,faq_url,blog_url,newsletter_signup,loyalty_program,mobile_app_url,app_store_rating,play_store_rating,trustpilot_rating,trustpilot_reviews_count,bbb_rating,bbb_accreditation,certifications,awards,featured_image,banner_image,gallery_images,video_url,rating,total_reviews,status,created_at,updated_at
        ),
        profiles!submitter_id(
          id,handle,avatar_url,karma,created_at,role
        )
      `)
      .eq('id', id)
      .single();
    if (dErr) return res.status(404).json({ error: 'not found' });

    // Increment view counter best-effort
    try { await supaAdmin.rpc('increment_deal_views', { deal_id: id }); } catch (_) {}

    const { data: comments = [] } = await supaAdmin
      .from('comments')
      .select('id,user_id,body,parent_id,created_at')
      .order('created_at', { ascending: true });

    // Get vote counts directly from votes table
    let ups = 0, downs = 0;
    try {
      const { data: votesData, error: votesError } = await supaAdmin
        .from('votes')
        .select('value')
        .eq('deal_id', id);
      
      if (votesError) {
        console.error('Error getting votes for deal:', votesError);
      } else if (votesData) {
        ups = votesData.filter(v => v.value === 1).length;
        downs = votesData.filter(v => v.value === -1).length;
      }
      console.log('Vote counts for deal', id, ':', { ups, downs, totalVotes: votesData?.length || 0 });
    } catch (error) {
      console.error('Error calculating vote counts:', error);
    }
    const created = Math.floor(new Date(d.created_at).getTime()/1000);
    const now = Math.floor(Date.now()/1000);

    // Get user's current vote if authenticated
    let userVote = null;
    if (req.user && req.user.id) {
      try {
        const { data: userVoteData } = await supaAdmin
          .from('votes')
          .select('value')
          .eq('deal_id', id)
          .eq('user_id', req.user.id)
          .single();
        userVote = userVoteData?.value || null;
      } catch (error) {
        // User hasn't voted yet, userVote remains null
      }
    }

    // Fetch tags for this deal
    let tags = [];
    try {
      const { data: tagRows } = await supaAdmin
        .from('deal_tags')
        .select('tags(id,name,slug,color,category)')
        .eq('deal_id', id);
      tags = (tagRows || []).map(r => r.tags).filter(Boolean);
    } catch (_) {}

    res.json({
      id: d.id, title: d.title, url: d.url, price: d.price, merchant: d.merchant,
      description: d.description, image_url: d.image_url, deal_images: d.deal_images, featured_image: d.featured_image, created,
      ups, downs, upvotes: ups, downvotes: downs, hot: hotScore(ups, downs, created, now),
      comments, category_id: d.category_id, deal_type: d.deal_type, is_featured: d.is_featured,
      views_count: d.views_count, clicks_count: d.clicks_count, expires_at: d.expires_at,
      original_price: d.original_price, discount_percentage: d.discount_percentage,
      discount_amount: d.discount_amount, coupon_code: d.coupon_code, coupon_type: d.coupon_type,
      company: d.companies, // Include full company information
      submitter: d.profiles, // Include submitter information
      submitter_id: d.submitter_id, // Include submitter ID
      tags,
      userVote // Include user's current vote
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Create deal (JWT required; RLS + trigger sets submitter_id) */
r.post('/', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { 
      title, 
      url, 
      price = null, 
      original_price = null,
      merchant = null, 
      description = null, 
      image_url = null, 
      deal_images = null, 
      featured_image = null,
      category_id = null,
      company_id = null,
      deal_type = 'deal',
      discount_percentage = null,
      discount_amount = null,
      coupon_code = null,
      coupon_type = 'none',
      minimum_order_amount = null,
      maximum_discount_amount = null,
      terms_conditions = null,
      starts_at = null,
      expires_at = null,
      tags = null,
      is_featured = false,
      is_exclusive = false,
      stock_status = 'unknown',
      stock_quantity = null,
    } = req.body || {};
    
    if (!title || !url) return res.status(400).json({ error: 'title and url required' });

    const { data, error } = await supaAdmin
      .from('deals')
      .insert([{ 
        title: title.trim(), 
        url: normalizeUrl(url), 
        price: price ? parseFloat(price) : null,
        original_price: original_price ? parseFloat(original_price) : null,
        merchant: merchant?.trim() || null, 
        description: description?.trim() || null, 
        image_url: image_url?.trim() || null, 
        deal_images: deal_images || null, 
        featured_image: featured_image || null,
        category_id: category_id ? parseInt(category_id) : null,
        company_id: company_id ? parseInt(company_id) : null,
        deal_type: deal_type || 'deal',
        discount_percentage: discount_percentage ? parseFloat(discount_percentage) : null,
        discount_amount: discount_amount ? parseFloat(discount_amount) : null,
        coupon_code: coupon_code?.trim() || null,
        coupon_type: coupon_type || 'none',
        minimum_order_amount: minimum_order_amount ? parseFloat(minimum_order_amount) : null,
        maximum_discount_amount: maximum_discount_amount ? parseFloat(maximum_discount_amount) : null,
        terms_conditions: terms_conditions?.trim() || null,
        starts_at: starts_at || null,
        expires_at: expires_at || null,
        is_featured: Boolean(is_featured),
        is_exclusive: Boolean(is_exclusive),
        stock_status: stock_status || 'unknown',
        stock_quantity: stock_quantity ? parseInt(stock_quantity) : null,
        status: 'pending',
        submitter_id: req.user.id
      }])
      .select()
      .single();
    if (error) throw error;

    // Handle tags - use provided tags or parse from title/description
    try {
      let tagSlugs = [];
      
      // Use provided tags if available
      if (tags && Array.isArray(tags)) {
        tagSlugs = tags.map(tag => tag.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')).filter(tag => tag);
      } else if (typeof tags === 'string' && tags.trim()) {
        tagSlugs = tags.split(',').map(tag => tag.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')).filter(tag => tag);
      }
      
      // If no tags provided, parse from title/description
      if (tagSlugs.length === 0) {
        tagSlugs = parseHashtags(title, description);
      }
      
      if (tagSlugs.length > 0) {
        const tagIds = await ensureTagsReturnIds(tagSlugs);
        if (tagIds.length > 0) {
          const dealTagRows = tagIds.map(tag_id => ({ deal_id: data.id, tag_id }));
          await supaAdmin.from('deal_tags').insert(dealTagRows);
        }
      }
    } catch (error) {
      console.error('Error handling tags:', error);
    }

    res.status(201).json({
      id: data.id, title: data.title, url: data.url, price: data.price,
      merchant: data.merchant, created: Math.floor(new Date(data.created_at).getTime()/1000),
      ups: 0, downs: 0, deal_images: data.deal_images, featured_image: data.featured_image,
      karma_points: calculateKarmaPoints('deal', req.body)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Get related deals for a specific deal */
r.get('/related/:id', async (req, res) => {
  try {
    const dealId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 8;
    
    if (isNaN(dealId)) {
      return res.status(400).json({ error: 'Invalid deal ID' });
    }

    // First get the current deal to find related deals
    const { data: currentDeal, error: dealError } = await supabase
      .from('deals')
      .select('category_id, company_id, merchant, tags')
      .eq('id', dealId)
      .eq('status', 'approved')
      .single();

    if (dealError || !currentDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    let query = supabase
      .from('deals')
      .select(`
        id, title, url, price, original_price, merchant, description, 
        image_url, deal_images, featured_image, category_id, company_id,
        deal_type, discount_percentage, discount_amount, coupon_code,
        coupon_type, minimum_order_amount, maximum_discount_amount,
        terms_conditions, starts_at, expires_at, stock_status, stock_quantity,
        is_featured, is_exclusive, karma_points, views_count, clicks_count,
        created_at, updated_at,
        companies (
          id, name, slug, logo_url, is_verified, status
        ),
        categories (
          id, name, slug
        )
      `)
      .eq('status', 'approved')
      .neq('id', dealId) // Exclude the current deal
      .order('created_at', { ascending: false })
      .limit(limit);

    // Try to find related deals by category first
    if (currentDeal.category_id) {
      query = query.eq('category_id', currentDeal.category_id);
    }

    const { data: relatedDeals, error: relatedError } = await query;

    if (relatedError) {
      console.error('Error fetching related deals:', relatedError);
      return res.status(500).json({ error: 'Failed to fetch related deals' });
    }

    // If we don't have enough deals by category, try to get deals from the same company
    if (relatedDeals.length < limit && currentDeal.company_id) {
      const remainingLimit = limit - relatedDeals.length;
      const existingIds = relatedDeals.map(deal => deal.id);
      
      let companyQuery = supabase
        .from('deals')
        .select(`
          id, title, url, price, original_price, merchant, description, 
          image_url, deal_images, featured_image, category_id, company_id,
          deal_type, discount_percentage, discount_amount, coupon_code,
          coupon_type, minimum_order_amount, maximum_discount_amount,
          terms_conditions, starts_at, expires_at, stock_status, stock_quantity,
          is_featured, is_exclusive, karma_points, views_count, clicks_count,
          created_at, updated_at,
          companies (
            id, name, slug, logo_url, is_verified, status
          ),
          categories (
            id, name, slug
          )
        `)
        .eq('status', 'approved')
        .eq('company_id', currentDeal.company_id)
        .order('created_at', { ascending: false })
        .limit(remainingLimit);

      if (existingIds.length > 0) {
        companyQuery = companyQuery.not('id', 'in', `(${existingIds.join(',')})`);
      }

      const { data: companyDeals, error: companyError } = await companyQuery;

      if (!companyError && companyDeals) {
        relatedDeals.push(...companyDeals);
      }
    }

    // If still not enough deals, get recent popular deals
    if (relatedDeals.length < limit) {
      const remainingLimit = limit - relatedDeals.length;
      const existingIds = relatedDeals.map(deal => deal.id);
      
      let popularQuery = supabase
        .from('deals')
        .select(`
          id, title, url, price, original_price, merchant, description, 
          image_url, deal_images, featured_image, category_id, company_id,
          deal_type, discount_percentage, discount_amount, coupon_code,
          coupon_type, minimum_order_amount, maximum_discount_amount,
          terms_conditions, starts_at, expires_at, stock_status, stock_quantity,
          is_featured, is_exclusive, karma_points, views_count, clicks_count,
          created_at, updated_at,
          companies (
            id, name, slug, logo_url, is_verified, status
          ),
          categories (
            id, name, slug
          )
        `)
        .eq('status', 'approved')
        .order('karma_points', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(remainingLimit);

      if (existingIds.length > 0) {
        popularQuery = popularQuery.not('id', 'in', `(${existingIds.join(',')})`);
      }

      const { data: popularDeals, error: popularError } = await popularQuery;

      if (!popularError && popularDeals) {
        relatedDeals.push(...popularDeals);
      }
    }

    res.json(relatedDeals.slice(0, limit));
  } catch (error) {
    console.error('Error in related deals endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** Vote (JWT required; RLS ensures deal is approved) */
r.post('/:id/vote', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required. Please login again.' });
    }

    const id = Number(req.params.id);
    const { value } = req.body || {};
    
    // Handle vote removal (null value)
    if (value === null) {
      // Remove existing vote
      const { error: deleteError } = await supaAdmin
        .from('votes')
        .delete()
        .eq('deal_id', id)
        .eq('user_id', req.user.id);
      
      if (deleteError) {
        return res.status(500).json({ error: 'Failed to remove vote: ' + deleteError.message });
      }
      
      // Return fresh aggregation after vote removal
      const { data: votesData, error: votesError } = await supaAdmin
        .from('votes')
        .select('value')
        .eq('deal_id', id);
      
      let ups = 0, downs = 0;
      if (!votesError && votesData) {
        ups = votesData.filter(v => v.value === 1).length;
        downs = votesData.filter(v => v.value === -1).length;
      }
      
      const { data: d, error: dErr } = await supaAdmin
        .from('deals')
        .select('id,title,url,price,merchant,created_at').eq('id', id).single();
      if (dErr) throw dErr;

      const created = Math.floor(new Date(d.created_at).getTime()/1000);
      return res.json({
        success: true,
        vote_score: ups - downs,
        upvotes: ups,
        downvotes: downs,
        created_at: created
      });
    }
    
    if (![1, -1].includes(value)) return res.status(400).json({ error: 'value must be 1 or -1' });

    // Use upsert to handle existing votes (update if exists, insert if not)
    const { error } = await supaAdmin.from('votes').upsert([{ 
      deal_id: id, 
      value,
      user_id: req.user.id,
      created_at: new Date().toISOString()
    }], {
      onConflict: 'user_id,deal_id'
    });
    if (error) {
      return res.status(500).json({ error: 'Failed to vote: ' + error.message });
    }

    // return fresh agg
    const { data: votesData, error: votesError } = await supaAdmin
      .from('votes')
      .select('value')
      .eq('deal_id', id);
    
    let ups = 0, downs = 0;
    if (!votesError && votesData) {
      ups = votesData.filter(v => v.value === 1).length;
      downs = votesData.filter(v => v.value === -1).length;
    }
    
    const { data: d, error: dErr } = await supaAdmin
      .from('deals')
      .select('id,title,url,price,merchant,created_at').eq('id', id).single();
    if (dErr) throw dErr;

    const created = Math.floor(new Date(d.created_at).getTime()/1000);
    const now = Math.floor(Date.now()/1000);

    res.json({ id: d.id, title: d.title, url: d.url, price: d.price, merchant: d.merchant, created, ups, downs, hot: hotScore(ups, downs, created, now) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Comment (JWT required; RLS enforces deal approved) */
r.post('/:id/comment', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const id = Number(req.params.id);
    const { body, parent_id = null } = req.body || {};
    if (!body || !body.trim()) return res.status(400).json({ error: 'body required' });

    const { data, error } = await supaAdmin
      .from('comments')
      .insert([{ deal_id: id, body: body.trim(), parent_id, user_id: req.user.id }])
      .select('id,deal_id,user_id,body,parent_id,created_at')
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

  /** Report deal (JWT required) */
  r.post('/:id/report', async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const id = Number(req.params.id);
      const { reason, note = null } = req.body || {};
      if (!reason || !reason.trim()) return res.status(400).json({ error: 'reason required' });
      if (reason.length < 3 || reason.length > 500) return res.status(400).json({ error: 'reason must be 3-500 characters' });

      const { data, error } = await supaAdmin
        .from('reports')
        .insert([{ 
          deal_id: id, 
          reason: reason.trim(), 
          note: note?.trim() || null,
          reporter_id: req.user.id
        }])
        .select('id,deal_id,reporter_id,reason,note,created_at')
        .single();
      if (error) throw error;

      res.status(201).json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /** Upload deal images (JWT required) */
  r.post('/:id/images', upload.array('images', 5), async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const dealId = Number(req.params.id);
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
      }

      // Verify deal exists and user owns it
      const { data: deal, error: dealError } = await supaAdmin
        .from('deals')
        .select('id, submitter_id')
        .eq('id', dealId)
        .single();

      if (dealError || !deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      const uploadedImages = [];
      const imageUrls = [];

      // Upload each image
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileExt = path.extname(file.originalname);
        const fileName = `${dealId}-${Date.now()}-${i}${fileExt}`;
        const filePath = `deals/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supaAdmin.storage
          .from('images')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue; // Skip this file and continue with others
        }

        // Get public URL
        const { data: { publicUrl } } = supaAdmin.storage
          .from('images')
          .getPublicUrl(filePath);

        imageUrls.push(publicUrl);

        // Save image record
        const { data: imageRecord } = await supaAdmin
          .from('images')
          .insert({
            user_id: deal.submitter_id,
            filename: fileName,
            original_name: file.originalname,
            file_size: file.size,
            mime_type: file.mimetype,
            storage_path: filePath,
            public_url: publicUrl,
            entity_type: 'deal',
            entity_id: dealId,
            is_primary: i === 0 // First image is primary
          })
          .select()
          .single();

        if (imageRecord) {
          uploadedImages.push(imageRecord);
        }
      }

      // Update deal with image URLs
      if (imageUrls.length > 0) {
        const updateData = {
          deal_images: imageUrls,
          featured_image: imageUrls[0] // First image as featured
        };

        const { error: updateError } = await supaAdmin
          .from('deals')
          .update(updateData)
          .eq('id', dealId);

        if (updateError) {
          console.error('Error updating deal with images:', updateError);
        }
      }

      res.json({
        uploaded_count: uploadedImages.length,
        images: uploadedImages,
        image_urls: imageUrls
      });
    } catch (e) {
      console.error('Error uploading deal images:', e);
      res.status(500).json({ error: e.message });
    }
  });

// Track deal click
r.post('/:id/click', async (req, res) => {
  try {
    const dealId = parseInt(req.params.id)
    const userId = req.user?.id || null
    const { source = 'unknown' } = req.body // Track where the click came from

    // Increment clicks count using RPC function
    try {
      await supaAdmin.rpc('increment_deal_clicks', { deal_id: dealId })
    } catch (rpcError) {
      console.log('RPC click tracking failed, using direct update:', rpcError.message)
      // Fallback to direct update
      await supaAdmin
        .from('deals')
        .update({ 
          clicks_count: supaAdmin.raw('COALESCE(clicks_count, 0) + 1')
        })
        .eq('id', dealId)
    }

    // Track analytics event
    try {
      await supaAdmin
        .from('analytics_events')
        .insert([{
          user_id: userId,
          event_name: 'deal_click',
          properties: {
            deal_id: dealId,
            source: source,
            timestamp: new Date().toISOString()
          }
        }])
    } catch (analyticsError) {
      console.log('Analytics tracking failed:', analyticsError.message)
      // Don't fail the request if analytics fails
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error tracking deal click:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default r;

