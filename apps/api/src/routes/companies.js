import express from 'express'
import { makeAdminClient } from '../lib/supa.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import multer from 'multer'
import path from 'path'

const router = express.Router()
const supabase = makeAdminClient()

// Helper functions to get category information by ID (temporary until database table is created)
function getCategoryNameById(categoryId) {
  const categories = {
    1: 'E-commerce',
    2: 'Technology', 
    3: 'Restaurant',
    4: 'Travel',
    5: 'Fashion',
    6: 'Health & Beauty',
    7: 'Home & Garden',
    8: 'Automotive',
    9: 'Entertainment',
    10: 'Education',
    11: 'Finance',
    12: 'Sports & Fitness',
    13: 'Pets',
    14: 'Books & Media'
  }
  return categories[categoryId] || 'Other'
}

function getCategorySlugById(categoryId) {
  const slugs = {
    1: 'e-commerce',
    2: 'technology',
    3: 'restaurant',
    4: 'travel',
    5: 'fashion',
    6: 'health-beauty',
    7: 'home-garden',
    8: 'automotive',
    9: 'entertainment',
    10: 'education',
    11: 'finance',
    12: 'sports-fitness',
    13: 'pets',
    14: 'books-media'
  }
  return slugs[categoryId] || 'other'
}

function getCategoryColorById(categoryId) {
  const colors = {
    1: '#3B82F6',
    2: '#10B981',
    3: '#F59E0B',
    4: '#8B5CF6',
    5: '#EC4899',
    6: '#EF4444',
    7: '#84CC16',
    8: '#6B7280',
    9: '#F97316',
    10: '#06B6D4',
    11: '#059669',
    12: '#DC2626',
    13: '#7C3AED',
    14: '#1E40AF'
  }
  return colors[categoryId] || '#6B7280'
}

// Configure multer for image uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('🔧 File filter check:', { mimetype: file.mimetype, originalname: file.originalname })
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      console.log('❌ Invalid file type:', file.mimetype)
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'))
    }
  }
})

// Helper function to get bearer token
function bearer(req) {
  const h = req.headers.authorization || ''
  return h.startsWith('Bearer ') ? h.slice(7) : null
}

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}



// Get all companies
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      verified, 
      search, 
      sort = 'name',
      page = 1,
      limit = 50 
    } = req.query

    let query = supabase
      .from('companies')
      .select('*')

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }

    if (verified === 'true') {
      query = query.eq('is_verified', true)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    switch (sort) {
      case 'name':
        query = query.order('name', { ascending: true })
        break
      case 'rating':
        query = query.order('rating', { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('name', { ascending: true })
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: companies, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(companies || [])
  } catch (error) {
    console.error('Error fetching companies:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get company listings with stats (only approved and verified companies for users)
router.get('/listings', async (req, res) => {
  try {
    const { 
      category, 
      verified, 
      sort = 'name',
      page = 1,
      limit = 50 
    } = req.query

    // For now, use the basic companies table until the view is properly set up
    let query = supabase
      .from('companies')
      .select('*')
      .eq('status', 'approved') // Only show approved companies
      .eq('is_verified', true)  // Only show verified companies

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }

    // Apply sorting
    switch (sort) {
      case 'name':
        query = query.order('name', { ascending: true })
        break
      case 'rating':
        query = query.order('rating', { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('name', { ascending: true })
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: companies, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(companies || [])
  } catch (error) {
    console.error('Error fetching company listings:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get company categories (temporary hardcoded solution until database table is created)
router.get('/categories', async (req, res) => {
  try {
    // Temporary hardcoded categories until company_categories table is created
    const categories = [
      { id: 1, name: 'E-commerce', slug: 'e-commerce', description: 'Online retail and shopping platforms', icon: 'shopping-bag', color: '#3B82F6', is_active: true },
      { id: 2, name: 'Technology', slug: 'technology', description: 'Software, hardware, and tech services', icon: 'computer-desktop', color: '#10B981', is_active: true },
      { id: 3, name: 'Restaurant', slug: 'restaurant', description: 'Food and dining establishments', icon: 'cake', color: '#F59E0B', is_active: true },
      { id: 4, name: 'Travel', slug: 'travel', description: 'Hotels, flights, and travel services', icon: 'airplane', color: '#8B5CF6', is_active: true },
      { id: 5, name: 'Fashion', slug: 'fashion', description: 'Clothing, accessories, and style', icon: 'shirt', color: '#EC4899', is_active: true },
      { id: 6, name: 'Health & Beauty', slug: 'health-beauty', description: 'Wellness, cosmetics, and personal care', icon: 'heart', color: '#EF4444', is_active: true },
      { id: 7, name: 'Home & Garden', slug: 'home-garden', description: 'Furniture, decor, and outdoor living', icon: 'home', color: '#84CC16', is_active: true },
      { id: 8, name: 'Automotive', slug: 'automotive', description: 'Cars, parts, and automotive services', icon: 'truck', color: '#6B7280', is_active: true },
      { id: 9, name: 'Entertainment', slug: 'entertainment', description: 'Movies, games, and leisure activities', icon: 'play', color: '#F97316', is_active: true },
      { id: 10, name: 'Education', slug: 'education', description: 'Learning platforms and educational services', icon: 'academic-cap', color: '#06B6D4', is_active: true },
      { id: 11, name: 'Finance', slug: 'finance', description: 'Banking, insurance, and financial services', icon: 'currency-dollar', color: '#059669', is_active: true },
      { id: 12, name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Athletic equipment and fitness services', icon: 'muscle', color: '#DC2626', is_active: true },
      { id: 13, name: 'Pets', slug: 'pets', description: 'Pet supplies and veterinary services', icon: 'heart', color: '#7C3AED', is_active: true },
      { id: 14, name: 'Books & Media', slug: 'books-media', description: 'Books, music, and digital content', icon: 'book-open', color: '#1E40AF', is_active: true }
    ]

    res.json(categories)
  } catch (error) {
    console.error('Error fetching company categories:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get company full data with deals and coupons (only approved and verified companies)
router.get('/:slug/full', async (req, res) => {
  try {
    const { slug } = req.params

    // First get the company - only approved and verified companies
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'approved')
      .eq('is_verified', true)
      .single()

    if (companyError || !company) {
      return res.status(404).json({ error: 'Company not found or not available for public viewing' })
    }

    // Get deals for this company
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('*')
      .eq('company_id', company.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (dealsError) {
      console.error('Error fetching deals:', dealsError)
    }

    // Get coupons for this company
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('*')
      .eq('company_id', company.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (couponsError) {
      console.error('Error fetching coupons:', couponsError)
    }

    // Get company stats
    const [
      { count: totalDeals },
      { count: totalCoupons }
    ] = await Promise.all([
      supabase.from('deals').select('*', { count: 'exact', head: true }).eq('company_id', company.id).eq('status', 'approved'),
      supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('company_id', company.id).eq('status', 'approved')
    ])

    // Calculate total views and clicks from deals and coupons
    const totalViews = (deals || []).reduce((sum, deal) => sum + (deal.views_count || 0), 0) + 
                      (coupons || []).reduce((sum, coupon) => sum + (coupon.views_count || 0), 0)
    const totalClicks = (deals || []).reduce((sum, deal) => sum + (deal.clicks_count || 0), 0) + 
                       (coupons || []).reduce((sum, coupon) => sum + (coupon.clicks_count || 0), 0)

    const fullData = {
      company: {
        ...company,
        stats: {
          total_deals: totalDeals || 0,
          total_coupons: totalCoupons || 0,
          total_views: totalViews,
          total_clicks: totalClicks
        }
      },
      deals: deals || [],
      coupons: coupons || []
    }

    res.json(fullData)
  } catch (error) {
    console.error('Error fetching company full data:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get company deals (only approved and verified companies)
router.get('/:slug/deals', async (req, res) => {
  try {
    const { slug } = req.params
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    // First get the company - only approved and verified companies
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, slug, logo_url')
      .eq('slug', slug)
      .eq('status', 'approved')
      .eq('is_verified', true)
      .single()

    if (companyError || !company) {
      return res.status(404).json({ error: 'Company not found or not available for public viewing' })
    }

    // Get deals for this company
    const { data: deals, error: dealsError, count } = await supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .eq('company_id', company.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (dealsError) {
      return res.status(400).json({ error: dealsError.message })
    }

    res.json({
      company,
      deals: deals || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching company deals:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get company coupons by company ID (for internal API use)
router.get('/:id/coupons', async (req, res) => {
  try {
    const companyId = parseInt(req.params.id)
    const limit = parseInt(req.query.limit) || 8
    
    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'Invalid company ID' })
    }

    // Get coupons for this company
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select(`
        id, title, description, coupon_code, coupon_type, 
        discount_percentage, discount_amount, minimum_order_amount, 
        maximum_discount_amount, terms_conditions, starts_at, expires_at,
        is_featured, is_exclusive, karma_points, views_count, clicks_count,
        created_at, updated_at,
        company:companies (
          id, name, slug, logo_url, is_verified, status
        )
      `)
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (couponsError) {
      return res.status(400).json({ error: couponsError.message })
    }

    res.json(coupons || [])
  } catch (error) {
    console.error('Error fetching company coupons:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get company coupons by slug (only approved and verified companies)
router.get('/:slug/coupons', async (req, res) => {
  try {
    const { slug } = req.params
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    // First get the company - only approved and verified companies
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, slug, logo_url')
      .eq('slug', slug)
      .eq('status', 'approved')
      .eq('is_verified', true)
      .single()

    if (companyError || !company) {
      return res.status(404).json({ error: 'Company not found or not available for public viewing' })
    }

    // Get coupons for this company
    const { data: coupons, error: couponsError, count } = await supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .eq('company_id', company.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (couponsError) {
      return res.status(400).json({ error: couponsError.message })
    }

    res.json({
      company,
      coupons: coupons || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching company coupons:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single company (only approved and verified companies)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'approved')
      .eq('is_verified', true)
      .single()

    if (error || !company) {
      return res.status(404).json({ error: 'Company not found or not available for public viewing' })
    }

    // Get company stats
    const [
      { count: totalDeals },
      { count: totalCoupons }
    ] = await Promise.all([
      supabase.from('deals').select('*', { count: 'exact', head: true }).eq('company_id', company.id).eq('status', 'approved'),
      supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('company_id', company.id).eq('status', 'approved')
    ])

    res.json({
      ...company,
      stats: {
        total_deals: totalDeals || 0,
        total_coupons: totalCoupons || 0
      }
    })
  } catch (error) {
    console.error('Error fetching company:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new company (User submission)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      website_url,
      category_id,
      headquarters,
      contact_info
    } = req.body

    // Validation
    if (!name || !slug || !category_id) {
      return res.status(400).json({ error: 'Name, slug, and category are required' })
    }

    // Check if slug already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingCompany) {
      return res.status(400).json({ error: 'Company with this slug already exists' })
    }

    // Verify category exists (temporary validation against hardcoded categories)
    const validCategoryIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
    if (!validCategoryIds.includes(parseInt(category_id))) {
      return res.status(400).json({ error: 'Invalid category selected' })
    }

    const { data: company, error } = await supabase
      .from('companies')
      .insert([{
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description?.trim(),
        website_url: website_url?.trim(),
        category: getCategoryNameById(parseInt(category_id)), // Store as text for now
        headquarters: headquarters?.trim(),
        contact_info: contact_info || {},
        status: 'pending',
        submitted_by: req.user?.id,
        submitted_at: new Date().toISOString(),
        is_verified: false
      }])
      .select('*')
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json({
      ...company,
      category_info: {
        id: parseInt(category_id),
        name: getCategoryNameById(parseInt(category_id)),
        slug: getCategorySlugById(parseInt(category_id)),
        color: getCategoryColorById(parseInt(category_id))
      },
      message: 'Company submitted successfully and is pending admin approval'
    })
  } catch (error) {
    console.error('Error creating company:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update company (Admin only) - Can edit all fields
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    console.log('🔧 PUT /api/companies/:id - Updating company:', req.params.id)
    console.log('🔧 Request body:', JSON.stringify(req.body, null, 2))
    
    const { id } = req.params
    const {
      name,
      slug,
      description,
      website_url,
      category_id,
      is_verified,
      status,
      priority,
      flags,
      review_notes,
      reviewed_by,
      reviewed_at,
      headquarters,
      contact_info,
      business_hours,
      payment_methods,
      shipping_info,
      return_policy,
      customer_service,
      founded_year,
      employee_count,
      revenue_range,
      rating,
      total_reviews,
      trustpilot_rating,
      trustpilot_reviews_count,
      app_store_rating,
      play_store_rating,
      bbb_rating,
      certifications,
      awards,
      meta_title,
      meta_description,
      meta_keywords,
      canonical_url,
      logo_url,
      banner_image
    } = req.body

    const updateData = {}
    
    console.log('🔧 Parsed fields - category_id:', category_id, 'name:', name)
    
    // Basic company info
    if (name !== undefined) updateData.name = name?.trim() || null
    if (slug !== undefined) updateData.slug = slug?.trim().toLowerCase() || null
    if (description !== undefined) updateData.description = description?.trim() || null
    if (website_url !== undefined) updateData.website_url = website_url?.trim() || null
    if (category_id !== undefined) {
      if (category_id === '' || category_id === null) {
        updateData.category = null
      } else {
        updateData.category = getCategoryNameById(parseInt(category_id))
      }
    }
    if (is_verified !== undefined) updateData.is_verified = is_verified
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (flags !== undefined) updateData.flags = flags
    if (review_notes !== undefined) updateData.review_notes = review_notes?.trim() || null
    if (reviewed_by !== undefined) updateData.reviewed_by = reviewed_by
    if (reviewed_at !== undefined) updateData.reviewed_at = reviewed_at
    
    // Company details
    if (headquarters !== undefined) updateData.headquarters = headquarters?.trim() || null
    if (contact_info !== undefined) updateData.contact_info = contact_info
    if (business_hours !== undefined) updateData.business_hours = business_hours
    if (payment_methods !== undefined) updateData.payment_methods = payment_methods
    if (shipping_info !== undefined) updateData.shipping_info = shipping_info
    if (return_policy !== undefined) updateData.return_policy = return_policy?.trim() || null
    if (customer_service !== undefined) updateData.customer_service = customer_service?.trim() || null
    
    // Company stats - handle empty strings for numeric fields
    if (founded_year !== undefined) updateData.founded_year = founded_year === '' ? null : parseInt(founded_year)
    if (employee_count !== undefined) updateData.employee_count = employee_count === '' ? null : parseInt(employee_count)
    if (revenue_range !== undefined) updateData.revenue_range = revenue_range?.trim() || null
    if (rating !== undefined) updateData.rating = rating === '' ? null : parseFloat(rating)
    if (total_reviews !== undefined) updateData.total_reviews = total_reviews === '' ? null : parseInt(total_reviews)
    
    // Ratings - handle empty strings for numeric fields
    if (trustpilot_rating !== undefined) updateData.trustpilot_rating = trustpilot_rating === '' ? null : parseFloat(trustpilot_rating)
    if (trustpilot_reviews_count !== undefined) updateData.trustpilot_reviews_count = trustpilot_reviews_count === '' ? null : parseInt(trustpilot_reviews_count)
    if (app_store_rating !== undefined) updateData.app_store_rating = app_store_rating === '' ? null : parseFloat(app_store_rating)
    if (play_store_rating !== undefined) updateData.play_store_rating = play_store_rating === '' ? null : parseFloat(play_store_rating)
    
    // BBB rating - handle empty strings for numeric fields
    if (bbb_rating !== undefined) updateData.bbb_rating = bbb_rating === '' ? null : parseFloat(bbb_rating)
    
    // Awards and certifications
    if (certifications !== undefined) updateData.certifications = certifications
    if (awards !== undefined) updateData.awards = awards
    
    // SEO and media
    if (meta_title !== undefined) updateData.meta_title = meta_title?.trim() || null
    if (meta_description !== undefined) updateData.meta_description = meta_description?.trim() || null
    if (meta_keywords !== undefined) updateData.meta_keywords = meta_keywords
    if (canonical_url !== undefined) updateData.canonical_url = canonical_url?.trim() || null
    if (logo_url !== undefined) updateData.logo_url = logo_url
    if (banner_image !== undefined) updateData.banner_image = banner_image
    
    // Set review info if status is being changed
    if (status === 'approved' || status === 'rejected') {
      updateData.reviewed_by = req.user.id
      updateData.reviewed_at = new Date().toISOString()
    }

    console.log('🔧 Final updateData:', JSON.stringify(updateData, null, 2))
    console.log('🔧 Updating company with ID:', id)

    const { data: company, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('❌ Supabase update error:', error)
      return res.status(400).json({ error: error.message })
    }

    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    // Add category info to response
    const companyWithCategory = {
      ...company,
      category_info: {
        id: category_id || null,
        name: company.category,
        slug: getCategorySlugById(category_id),
        color: getCategoryColorById(category_id)
      }
    }

    res.json(companyWithCategory)
  } catch (error) {
    console.error('❌ Error updating company:', error)
    console.error('❌ Error stack:', error.stack)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload company logo (Admin only)
router.post('/:id/logo', requireAdmin, (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      console.log('❌ Multer error:', err.message)
      return res.status(400).json({ error: err.message })
    }
    next()
  })
}, async (req, res) => {
  try {
    console.log('🔧 Logo upload request:', { id: req.params.id, user: req.user?.id })
    const { id } = req.params

    if (!req.file) {
      console.log('❌ No file uploaded')
      return res.status(400).json({ error: 'No logo file uploaded' })
    }

    console.log('🔧 File received:', { 
      originalname: req.file.originalname, 
      mimetype: req.file.mimetype, 
      size: req.file.size 
    })

    // Verify company exists
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', id)
      .single()

    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    // Generate unique filename
    const fileExt = path.extname(req.file.originalname)
    const fileName = `${id}-${Date.now()}${fileExt}`
    const filePath = `companies/${fileName}`

    // Delete old logo if it exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('logo_url')
      .eq('id', id)
      .single()

    if (existingCompany?.logo_url) {
      try {
        // Extract filename from existing logo URL
        const oldFileName = existingCompany.logo_url.split('/').pop()
        if (oldFileName) {
          await supabase.storage
            .from('images')
            .remove([`companies/${oldFileName}`])
        }
      } catch (deleteError) {
        console.log('Could not delete old logo:', deleteError.message)
      }
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return res.status(500).json({ error: 'Failed to upload logo' })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    // Update company with new logo URL
    const { data: updatedCompany, error } = await supabase
      .from('companies')
      .update({ 
        logo_url: publicUrl
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Note: Image record saving removed to avoid schema issues
    // The logo_url is stored directly in the companies table

    res.json({ 
      success: true, 
      logo_url: publicUrl,
      company: updatedCompany
    })
  } catch (error) {
    console.error('Error uploading company logo:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})


// Search companies with full-text search (only approved and verified companies)
router.get('/search', async (req, res) => {
  try {
    const { 
      q, 
      category, 
      page = 1, 
      limit = 20 
    } = req.query

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    // For now, use basic search until the RPC function is properly set up
    let query = supabase
      .from('companies')
      .select('*')
      .eq('status', 'approved')
      .eq('is_verified', true)
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)

    if (category) {
      query = query.eq('category', category)
    }

    const { data: companies, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Apply pagination
    const offset = (page - 1) * limit
    const paginatedCompanies = companies.slice(offset, offset + limit)

    res.json({
      companies: paginatedCompanies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: companies.length,
        total_pages: Math.ceil(companies.length / limit)
      }
    })
  } catch (error) {
    console.error('Error searching companies:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get pending companies for admin review
router.get('/admin/pending', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    const { data: companies, error, count } = await supabase
      .from('companies')
      .select(`
        *,
        company_categories (
          id,
          name,
          slug,
          description,
          icon,
          color
        ),
        profiles!submitted_by (
          id,
          handle,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({
      companies: companies || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching pending companies:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get company by slug for editing
router.get('/admin/:slug', requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params

    const { data: company, error } = await supabase
      .from('companies')
      .select(`
        *,
        company_categories (
          id,
          name,
          slug,
          description,
          icon,
          color
        ),
        profiles!submitted_by (
          id,
          handle,
          avatar_url
        )
      `)
      .eq('slug', slug)
      .single()

    if (error || !company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    res.json(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Search companies by name for deal/coupon submission
router.get('/search/name', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query

    if (!q || q.length < 2) {
      return res.json([])
    }

    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        slug,
        logo_url,
        website_url,
        company_categories (
          id,
          name,
          slug,
          icon,
          color
        )
      `)
      .eq('status', 'approved')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(parseInt(limit))

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(companies || [])
  } catch (error) {
    console.error('Error searching companies:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin endpoint to update company details with restaurant options
router.put('/admin/:id/update', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const {
      // Basic company fields
      name,
      slug,
      description,
      website_url,
      logo_url,
      headquarters,
      contact_info,
      status,
      is_verified,
      
      // Restaurant-specific fields
      is_restaurant,
      latitude,
      longitude,
      address,
      city,
      state,
      zip_code,
      country,
      phone,
      website,
      cuisine_type,
      price_range,
      restaurant_hours
    } = req.body

    console.log('🔧 Admin updating company:', id, { is_restaurant, cuisine_type, price_range })

    // Check if company exists
    const { data: existingCompany, error: checkError } = await supabase
      .from('companies')
      .select('id, name, slug')
      .eq('id', id)
      .single()

    if (checkError || !existingCompany) {
      return res.status(404).json({ error: 'Company not found' })
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    }

    // Add basic fields if provided
    if (name !== undefined) updateData.name = name.trim()
    if (slug !== undefined) updateData.slug = slug.trim().toLowerCase()
    if (description !== undefined) updateData.description = description?.trim()
    if (website_url !== undefined) updateData.website_url = website_url?.trim()
    if (logo_url !== undefined) updateData.logo_url = logo_url?.trim()
    if (headquarters !== undefined) updateData.headquarters = headquarters?.trim()
    if (contact_info !== undefined) updateData.contact_info = contact_info
    if (status !== undefined) updateData.status = status
    if (is_verified !== undefined) updateData.is_verified = is_verified

    // Add restaurant-specific fields if provided
    if (is_restaurant !== undefined) updateData.is_restaurant = is_restaurant
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null
    if (address !== undefined) updateData.address = address?.trim()
    if (city !== undefined) updateData.city = city?.trim()
    if (state !== undefined) updateData.state = state?.trim()
    if (zip_code !== undefined) updateData.zip_code = zip_code?.trim()
    if (country !== undefined) updateData.country = country?.trim()
    if (phone !== undefined) updateData.phone = phone?.trim()
    if (website !== undefined) updateData.website = website?.trim()
    if (cuisine_type !== undefined) updateData.cuisine_type = cuisine_type?.trim()
    if (price_range !== undefined) updateData.price_range = price_range?.trim()
    if (restaurant_hours !== undefined) updateData.restaurant_hours = restaurant_hours

    // Update the company
    const { data: updatedCompany, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating company:', error)
      return res.status(500).json({ error: 'Failed to update company' })
    }

    console.log('✅ Company updated successfully:', updatedCompany.name)

    res.json({
      success: true,
      data: updatedCompany,
      message: 'Company updated successfully'
    })

  } catch (error) {
    console.error('Error in admin company update:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin endpoint to get company details for editing
router.get('/admin/:id/edit', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    res.json({
      success: true,
      data: company
    })

  } catch (error) {
    console.error('Error fetching company for edit:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router