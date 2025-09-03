import express from 'express'
import { makeAdminClient } from '../lib/supa.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
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

// Get single company
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !company) {
      return res.status(404).json({ error: 'Company not found' })
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

// Create new company (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      website,
      category,
      is_verified = false
    } = req.body

    // Validation
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' })
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

    const { data: company, error } = await supabase
      .from('companies')
      .insert([{
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description?.trim(),
        website: website?.trim(),
        category: category?.trim(),
        is_verified
      }])
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json(company)
  } catch (error) {
    console.error('Error creating company:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update company (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      slug,
      description,
      website,
      category,
      is_verified
    } = req.body

    const { data: company, error } = await supabase
      .from('companies')
      .update({
        ...(name && { name: name.trim() }),
        ...(slug && { slug: slug.trim().toLowerCase() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(website !== undefined && { website: website?.trim() }),
        ...(category !== undefined && { category: category?.trim() }),
        ...(is_verified !== undefined && { is_verified })
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    res.json(company)
  } catch (error) {
    console.error('Error updating company:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload company logo (Admin only)
router.post('/:id/logo', requireAdmin, upload.single('logo'), async (req, res) => {
  try {
    const { id } = req.params

    if (!req.file) {
      return res.status(400).json({ error: 'No logo file uploaded' })
    }

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
        logo_url: publicUrl,
        logo_uploaded_by: req.user.id,
        logo_uploaded_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Save image record
    await supabase
      .from('images')
      .insert({
        user_id: req.user.id,
        filename: fileName,
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        storage_path: filePath,
        public_url: publicUrl,
        entity_type: 'company',
        entity_id: parseInt(id),
        is_primary: true
      })

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

// Get company deals
router.get('/:slug/deals', async (req, res) => {
  try {
    const { slug } = req.params
    const { page = 1, limit = 20 } = req.query

    // Get company
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    // Get deals
    const offset = (page - 1) * limit
    const { data: deals, error } = await supabase
      .from('deals')
      .select(`
        *,
        categories (id, name, slug, color),
        profiles!submitter_id (handle, avatar_url)
      `)
      .eq('company_id', company.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(deals || [])
  } catch (error) {
    console.error('Error fetching company deals:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get company coupons
router.get('/:slug/coupons', async (req, res) => {
  try {
    const { slug } = req.params
    const { page = 1, limit = 20 } = req.query

    // Get company
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    // Get coupons
    const offset = (page - 1) * limit
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select(`
        *,
        categories (id, name, slug, color),
        profiles!submitter_id (handle, avatar_url)
      `)
      .eq('company_id', company.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(coupons || [])
  } catch (error) {
    console.error('Error fetching company coupons:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get company categories
router.get('/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('companies')
      .select('category')
      .not('category', 'is', null)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Get unique categories
    const uniqueCategories = [...new Set(categories.map(c => c.category))].sort()

    res.json(uniqueCategories)
  } catch (error) {
    console.error('Error fetching company categories:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router