import { Router } from 'express';
import { hotScore, normalizeUrl } from '@savebucks/shared';
import { makeAdminClient } from '../lib/supa.js';
import { makeUserClientFromToken } from '../lib/supaUser.js';
import multer from 'multer';
import path from 'path';

const r = Router();
const supaAdmin = makeAdminClient();

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

async function listDeals(tab, filters = {}) {
  let query = supaAdmin
    .from('deals')
    .select(`
      id, title, url, price, merchant, created_at, approved_at, status,
      description, image_url, coupon_code, coupon_type, discount_percentage,
      discount_amount, original_price, expires_at, category_id,
      categories(name, slug),
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
      description: d.description,
      image_url: d.image_url,
      created: createdSec,
      ups: v.ups || 0,
      downs: v.downs || 0,
      hot: hotScore(v.ups || 0, v.downs || 0, createdSec, now),
      coupon_code: d.coupon_code,
      coupon_type: d.coupon_type,
      discount_percentage: d.discount_percentage,
      discount_amount: d.discount_amount,
      expires_at: d.expires_at,
      category: d.categories,
      savings,
      discount_text: discountText
    };
  });

  // Apply tab-specific filtering and sorting
  switch (tab) {
    case 'new':
      return enriched.sort((a,b) => b.created - a.created);
    
    case 'trending':
      return enriched.sort((a,b) => (b.ups - b.downs) - (a.ups - a.downs));
    
    case 'under-20':
      return enriched
        .filter(deal => deal.price && deal.price <= 20)
        .sort((a,b) => b.hot - a.hot);
    
    case '50-percent-off':
      return enriched
        .filter(deal => deal.discount_text && deal.discount_text.includes('50%'))
        .sort((a,b) => b.hot - a.hot);
    
    case 'free-shipping':
      return enriched
        .filter(deal => deal.title.toLowerCase().includes('free shipping') || 
                       deal.description?.toLowerCase().includes('free shipping'))
        .sort((a,b) => b.hot - a.hot);
    
    case 'new-arrivals':
      const oneWeekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
      return enriched
        .filter(deal => deal.created > oneWeekAgo)
        .sort((a,b) => b.created - a.created);
    
    case 'hot-deals':
      return enriched
        .filter(deal => (deal.ups - deal.downs) >= 5) // Popular deals
        .sort((a,b) => b.hot - a.hot);
    
    case 'ending-soon':
      const now = Math.floor(Date.now() / 1000);
      const threeDaysFromNow = now + (3 * 24 * 60 * 60);
      return enriched
        .filter(deal => deal.expires_at && deal.expires_at < threeDaysFromNow)
        .sort((a,b) => deal.expires_at - b.expires_at);
    
    default: // 'hot'
      return enriched.sort((a,b) => b.hot - a.hot);
  }
}

r.get('/api/deals', async (req, res) => {
  try {
    // Support both tab= and sort= aliases from frontend
    const tab = (req.query.tab || req.query.sort || 'hot').toString().replace('newest','new').replace('top_rated','hot');
    const filters = {
      category_id: req.query.category_id ? parseInt(req.query.category_id) : null,
      merchant: req.query.merchant,
      min_discount: req.query.min_discount ? parseInt(req.query.min_discount) : null,
      max_price: req.query.max_price ? parseFloat(req.query.max_price) : null,
      has_coupon: req.query.has_coupon === 'true',
      search: req.query.search
    };
    
    const items = await listDeals(tab, filters);
    // Featured filter if requested
    let out = items;
    if (req.query.featured === 'true') {
      const { data: featuredIds } = await supaAdmin
        .from('deals')
        .select('id')
        .eq('is_featured', true)
        .eq('status', 'approved');
      const set = new Set((featuredIds||[]).map(d=>d.id));
      out = items.filter(d => set.has(d.id));
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    res.json(limit ? out.slice(0, Math.max(0, limit)) : out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Deal detail (includes comments + vote agg) */
r.get('/api/deals/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { data: d, error: dErr } = await supaAdmin
      .from('deals')
      .select('id,title,url,price,merchant,description,image_url,created_at,status')
      .eq('id', id)
      .single();
    if (dErr) return res.status(404).json({ error: 'not found' });

    // Increment view counter best-effort
    try { await supaAdmin.rpc('increment_deal_views', { deal_id: id }); } catch (_) {}

    const { data: comments = [] } = await supaAdmin
      .from('comments')
      .select('id,user_id,body,parent_id,created_at')
      .order('created_at', { ascending: true });

    const { data: agg } = await supaAdmin.rpc('get_votes_for_deal', { p_deal_id: id });
    const ups = agg?.ups || 0, downs = agg?.downs || 0;
    const created = Math.floor(new Date(d.created_at).getTime()/1000);
    const now = Math.floor(Date.now()/1000);

    res.json({
      id: d.id, title: d.title, url: d.url, price: d.price, merchant: d.merchant,
      description: d.description, image_url: d.image_url, created,
      ups, downs, hot: hotScore(ups, downs, created, now),
      comments
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Create deal (JWT required; RLS + trigger sets submitter_id) */
r.post('/api/deals', async (req, res) => {
  try {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'auth required' });
    const supaUser = makeUserClientFromToken(token);

    const { title, url, price = null, merchant = null, description = null, image_url = null } = req.body || {};
    if (!title || !url) return res.status(400).json({ error: 'title and url required' });

    const { data, error } = await supaUser
      .from('deals')
      .insert([{ title, url: normalizeUrl(url), price, merchant, description, image_url, status: 'pending' }])
      .select()
      .single();
    if (error) throw error;

    res.status(201).json({
      id: data.id, title: data.title, url: data.url, price: data.price,
      merchant: data.merchant, created: Math.floor(new Date(data.created_at).getTime()/1000),
      ups: 0, downs: 0
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Vote (JWT required; RLS ensures deal is approved) */
r.post('/api/deals/:id/vote', async (req, res) => {
  try {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'auth required' });
    const supaUser = makeUserClientFromToken(token);

    const id = Number(req.params.id);
    const { value } = req.body || {};
    if (![1, -1].includes(value)) return res.status(400).json({ error: 'value must be 1 or -1' });

    // insert vote (user_id auto-set by trigger; RLS enforces)
    const { error } = await supaUser.from('votes').insert([{ deal_id: id, value }]);
    if (error && !/duplicate key/.test(error.message)) throw error;

    // return fresh agg
    const { data: agg, error: aErr } = await supaAdmin.rpc('get_votes_for_deal', { p_deal_id: id });
    if (aErr) throw aErr;
    const { data: d, error: dErr } = await supaAdmin
      .from('deals')
      .select('id,title,url,price,merchant,created_at').eq('id', id).single();
    if (dErr) throw dErr;

    const created = Math.floor(new Date(d.created_at).getTime()/1000);
    const now = Math.floor(Date.now()/1000);
    const ups = agg?.ups || 0, downs = agg?.downs || 0;

    res.json({ id: d.id, title: d.title, url: d.url, price: d.price, merchant: d.merchant, created, ups, downs, hot: hotScore(ups, downs, created, now) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Comment (JWT required; RLS enforces deal approved) */
r.post('/api/deals/:id/comment', async (req, res) => {
  try {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'auth required' });
    const supaUser = makeUserClientFromToken(token);

    const id = Number(req.params.id);
    const { body, parent_id = null } = req.body || {};
    if (!body || !body.trim()) return res.status(400).json({ error: 'body required' });

    const { data, error } = await supaUser
      .from('comments')
      .insert([{ deal_id: id, body: body.trim(), parent_id }])
      .select('id,deal_id,user_id,body,parent_id,created_at')
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

  /** Report deal (JWT required) */
  r.post('/api/deals/:id/report', async (req, res) => {
    try {
      const token = bearer(req);
      if (!token) return res.status(401).json({ error: 'auth required' });
      const supaUser = makeUserClientFromToken(token);

      const id = Number(req.params.id);
      const { reason, note = null } = req.body || {};
      if (!reason || !reason.trim()) return res.status(400).json({ error: 'reason required' });
      if (reason.length < 3 || reason.length > 500) return res.status(400).json({ error: 'reason must be 3-500 characters' });

      const { data, error } = await supaUser
        .from('reports')
        .insert([{ 
          deal_id: id, 
          reason: reason.trim(), 
          note: note?.trim() || null 
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
  r.post('/api/deals/:id/images', upload.array('images', 5), async (req, res) => {
    try {
      const token = bearer(req);
      if (!token) return res.status(401).json({ error: 'auth required' });
      const supaUser = makeUserClientFromToken(token);

      const dealId = Number(req.params.id);
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
      }

      // Verify deal exists and user owns it
      const { data: deal, error: dealError } = await supaUser
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

        const { error: updateError } = await supaUser
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

export default r;
