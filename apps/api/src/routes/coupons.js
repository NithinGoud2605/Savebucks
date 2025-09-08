import express from 'express'
import { makeAdminClient } from '../lib/supa.js'
import { makeUserClientFromToken } from '../lib/supaUser.js'
import { createSafeUserClient } from '../lib/authUtils.js'
import multer from 'multer'
import path from 'path'

const router = express.Router()
const supabase = makeAdminClient()

// Configure multer for image uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'))
    }
  }
})

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}

// Helper function to get bearer token
function bearer(req) {
  const h = req.headers.authorization || ''
  return h.startsWith('Bearer ') ? h.slice(7) : null
}

// Test endpoint to debug the issue
router.get('/test', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Coupons test endpoint working', 
      timestamp: new Date().toISOString(),
      mockData: [
        { id: 1, title: "Test Coupon 1", code: "TEST1" },
        { id: 2, title: "Test Coupon 2", code: "TEST2" }
      ]
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    res.status(500).json({ error: 'Test failed' })
  }
})

  // List coupons with filtering
// Extract hashtags to tag filter helper
function extractHashtagSlugs(text) {
  if (!text) return [];
  const matches = text.match(/(^|\s)#([a-z0-9][a-z0-9-_]*)/gi) || [];
  return Array.from(new Set(matches.map(m => m.replace(/^[^#]*#/, '').toLowerCase().replace(/[^a-z0-9-_]/g, ''))));
}

router.get('/', async (req, res) => {
  try {
    const { 
      company, 
      category, 
      type, 
      featured, 
      search, 
      sort = 'newest',
      page = 1,
      limit = 20 
    } = req.query

    let query = supabase
      .from('coupons')
      .select(`
        *,
        companies (id, name, slug, logo_url, is_verified),
        categories (id, name, slug, color),
        profiles!submitter_id (handle, avatar_url)
      `)
      .eq('status', 'approved')

    // Apply filters
    if (company) {
      query = query.eq('companies.slug', company)
    }

    if (category) {
      query = query.eq('categories.slug', category)
    }

    if (type) {
      query = query.eq('coupon_type', type)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,coupon_code.ilike.%${search}%`)
      // If search contains hashtags, translate to coupon_tags filter
      const slugs = extractHashtagSlugs(search)
      if (slugs.length > 0) {
        const { data: tagRows } = await supabase
          .from('tags')
          .select('id, slug')
          .in('slug', slugs)
        const tagIds = (tagRows || []).map(t => t.id)
        if (tagIds.length > 0) {
          query = query.in('coupon_tags.tag_id', tagIds)
        }
      }
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'expiring':
        query = query.order('expires_at', { ascending: true })
        break
      case 'popular':
        query = query.order('views_count', { ascending: false })
        break
      case 'success_rate':
        query = query.order('success_rate', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: coupons, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Get vote counts for each coupon
    const couponIds = coupons.map(c => c.id)
    let voteMap = new Map()

    if (couponIds.length > 0) {
      try {
        // Try to get votes from the coupon_votes table directly
        const { data: votesData, error: votesError } = await supabase
          .from('coupon_votes')
          .select('coupon_id, value')
          .in('coupon_id', couponIds)
        
        if (!votesError && votesData) {
          // Aggregate votes manually
          votesData.forEach(vote => {
            const existing = voteMap.get(vote.coupon_id) || { ups: 0, downs: 0 }
            if (vote.value === 1) {
              existing.ups = (existing.ups || 0) + 1
            } else if (vote.value === -1) {
              existing.downs = (existing.downs || 0) + 1
            }
            voteMap.set(vote.coupon_id, existing)
          })
        }
      } catch (e) {
        console.error('Error getting coupon votes:', e)
      }
    }

    // Enrich coupons with vote data
    const enrichedCoupons = coupons.map(coupon => {
      const votes = voteMap.get(coupon.id) || { ups: 0, downs: 0 }
      return {
        ...coupon,
        votes: {
          ups: parseInt(votes.ups) || 0,
          downs: parseInt(votes.downs) || 0,
          score: (parseInt(votes.ups) || 0) - (parseInt(votes.downs) || 0)
        }
      }
    })

    res.json(enrichedCoupons)
  } catch (error) {
    console.error('Error fetching coupons:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single coupon
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select(`
        *,
        companies (id, name, slug, logo_url, website, is_verified),
        categories (id, name, slug, color),
        profiles!submitter_id (handle, avatar_url, karma)
      `)
      .eq('id', id)
      .single()

    if (error || !coupon) {
      return res.status(404).json({ error: 'Coupon not found' })
    }

    // Get votes
    const { data: votesAgg } = await supabase.rpc('get_coupon_votes_agg')
    const votes = votesAgg?.find(v => v.coupon_id === parseInt(id)) || { ups: 0, downs: 0 }

    // Get comments
    const { data: comments } = await supabase
      .from('coupon_comments')
      .select(`
        *,
        profiles!user_id (handle, avatar_url, karma)
      `)
      .eq('coupon_id', id)
      .order('created_at', { ascending: false })

    // Increment view count
    await supabase
      .from('coupons')
      .update({ views_count: coupon.views_count + 1 })
      .eq('id', id)

    res.json({
      ...coupon,
      votes: {
        ups: parseInt(votes.ups) || 0,
        downs: parseInt(votes.downs) || 0,
        score: (parseInt(votes.ups) || 0) - (parseInt(votes.downs) || 0)
      },
      comments: comments || []
    })
  } catch (error) {
    console.error('Error fetching coupon:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new coupon
router.post('/', requireAuth, async (req, res) => {
  try {
    const token = bearer(req)
    if (!token) return res.status(401).json({ error: 'Authentication required' })
    
    const supaUser = await createSafeUserClient(token, res)
    if (!supaUser) return; // Exit if client creation failed
    const {
      title,
      description,
      coupon_code,
      coupon_type,
      discount_value,
      minimum_order_amount,
      maximum_discount_amount,
      company_id,
      category_id,
      terms_conditions,
      usage_limit,
      usage_limit_per_user,
      starts_at,
      expires_at,
      source_url,
      tags,
      is_exclusive
    } = req.body

    // Validation
    if (!title || !coupon_code || !coupon_type || !company_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, coupon_code, coupon_type, company_id' 
      })
    }

    const { data: coupon, error } = await supaUser
      .from('coupons')
      .insert([{
        title: title.trim(),
        description: description?.trim(),
        coupon_code: coupon_code.trim().toUpperCase(),
        coupon_type,
        discount_value: discount_value ? parseFloat(discount_value) : null,
        minimum_order_amount: minimum_order_amount ? parseFloat(minimum_order_amount) : null,
        maximum_discount_amount: maximum_discount_amount ? parseFloat(maximum_discount_amount) : null,
        company_id: parseInt(company_id),
        category_id: category_id ? parseInt(category_id) : null,
        terms_conditions: terms_conditions?.trim(),
        usage_limit: usage_limit ? parseInt(usage_limit) : null,
        usage_limit_per_user: usage_limit_per_user ? parseInt(usage_limit_per_user) : 1,
        starts_at: starts_at || null,
        expires_at: expires_at || null,
        source_url: source_url?.trim(),
        tags: tags || [],
        is_exclusive: is_exclusive || false
      }])
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Auto-attach hashtags from title/description as tags
    try {
      const slugs = extractHashtagSlugs(`${title} ${description || ''}`)
      if (slugs.length > 0) {
        const { data: existing } = await supabase
          .from('tags')
          .select('id, slug')
          .in('slug', slugs)
        const existingMap = new Map((existing || []).map(t => [t.slug, t.id]))
        const missing = slugs.filter(s => !existingMap.has(s))
        if (missing.length > 0) {
          const toInsert = missing.map(slug => ({
            name: slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            slug,
            color: '#3B82F6',
            category: 'custom',
            is_featured: false,
          }))
          const { data: inserted } = await supabase
            .from('tags')
            .insert(toInsert)
            .select('id, slug')
          ;(inserted || []).forEach(t => existingMap.set(t.slug, t.id))
        }
        const tagIds = slugs.map(s => existingMap.get(s)).filter(Boolean)
        if (tagIds.length > 0) {
          const rows = tagIds.map(tag_id => ({ coupon_id: coupon.id, tag_id }))
          await supabase.from('coupon_tags').insert(rows)
        }
      }
    } catch (_) {}

    res.status(201).json(coupon)
  } catch (error) {
    console.error('Error creating coupon:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload coupon images
router.post('/:id/images', requireAuth, upload.array('images', 3), async (req, res) => {
  try {
    const token = bearer(req)
    if (!token) return res.status(401).json({ error: 'Authentication required' })

    const couponId = parseInt(req.params.id)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' })
    }

    // Verify coupon exists and user owns it
    const { data: coupon } = await supabase
      .from('coupons')
      .select('id, submitter_id')
      .eq('id', couponId)
      .single()

    if (!coupon || coupon.submitter_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const uploadedImages = []
    const imageUrls = []

    // Upload each image
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i]
      const fileExt = path.extname(file.originalname)
      const fileName = `coupon-${couponId}-${Date.now()}-${i}${fileExt}`
      const filePath = `coupons/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      imageUrls.push(publicUrl)

      // Save image record
      await supabase
        .from('images')
        .insert({
          user_id: req.user.id,
          filename: fileName,
          original_name: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
          storage_path: filePath,
          public_url: publicUrl,
          entity_type: 'coupon',
          entity_id: couponId,
          is_primary: i === 0
        })
    }

    // Update coupon with image URLs
    if (imageUrls.length > 0) {
      const updateData = {
        coupon_images: imageUrls,
        featured_image: imageUrls[0]
      }

      await supabase
        .from('coupons')
        .update(updateData)
        .eq('id', couponId)
    }

    res.json({
      uploaded_count: imageUrls.length,
      image_urls: imageUrls
    })
  } catch (error) {
    console.error('Error uploading coupon images:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Vote on coupon
router.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const token = bearer(req)
    if (!token) return res.status(401).json({ error: 'Authentication required' })
    
    const supaUser = await createSafeUserClient(token, res)
    if (!supaUser) return; // Exit if client creation failed
    const couponId = parseInt(req.params.id)
    const { value } = req.body

    if (![-1, 1].includes(value)) {
      return res.status(400).json({ error: 'Vote value must be -1 or 1' })
    }

    // Upsert vote
    const { data, error } = await supaUser
      .from('coupon_votes')
      .upsert([{
        coupon_id: couponId,
        user_id: req.user.id,
        value
      }])
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ success: true, vote: data })
  } catch (error) {
    console.error('Error voting on coupon:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Use coupon (track usage)
router.post('/:id/use', async (req, res) => {
  try {
    const couponId = parseInt(req.params.id)
    const { order_amount, was_successful = true } = req.body
    const userId = req.user?.id || null

    // Track usage
    await supabase.rpc('track_coupon_usage', {
      coupon_id_param: couponId,
      user_id_param: userId,
      order_amount_param: order_amount ? parseFloat(order_amount) : null,
      was_successful_param: was_successful
    })

    // Increment clicks count
    await supabase
      .from('coupons')
      .update({ 
        clicks_count: supabase.raw('clicks_count + 1')
      })
      .eq('id', couponId)

    res.json({ success: true })
  } catch (error) {
    console.error('Error tracking coupon usage:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add comment to coupon
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const token = bearer(req)
    if (!token) return res.status(401).json({ error: 'Authentication required' })
    
    const supaUser = await createSafeUserClient(token, res)
    if (!supaUser) return; // Exit if client creation failed
    const couponId = parseInt(req.params.id)
    const { body, parent_id } = req.body

    if (!body || body.trim().length < 3) {
      return res.status(400).json({ error: 'Comment must be at least 3 characters long' })
    }

    const { data: comment, error } = await supaUser
      .from('coupon_comments')
      .insert([{
        coupon_id: couponId,
        body: body.trim(),
        parent_id: parent_id || null
      }])
      .select(`
        *,
        profiles!user_id (handle, avatar_url, karma)
      `)
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json(comment)
  } catch (error) {
    console.error('Error creating coupon comment:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Track coupon click
router.post('/:id/click', async (req, res) => {
  try {
    const couponId = parseInt(req.params.id)
    const userId = req.user?.id || null
    const { source = 'unknown' } = req.body // Track where the click came from

    // Increment clicks count using RPC function
    try {
      await supabase.rpc('increment_coupon_clicks', { coupon_id: couponId })
    } catch (rpcError) {
      console.log('RPC click tracking failed, using direct update:', rpcError.message)
      // Fallback to direct update
      await supabase
        .from('coupons')
        .update({ 
          clicks_count: supabase.raw('COALESCE(clicks_count, 0) + 1')
        })
        .eq('id', couponId)
    }

    // Track analytics event
    try {
      await supabase
        .from('analytics_events')
        .insert([{
          user_id: userId,
          event_name: 'coupon_click',
          properties: {
            coupon_id: couponId,
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
    console.error('Error tracking coupon click:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
