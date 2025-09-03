import express from 'express'
import { makeAdminClient } from '../lib/supa.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()
const supabase = makeAdminClient()

// Get all tags
router.get('/', async (req, res) => {
  try {
    const { category, featured_only, limit = 100 } = req.query

    let query = supabase
      .from('tags')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true })
      .limit(parseInt(limit))

    if (category) {
      query = query.eq('category', category)
    }

    if (featured_only === 'true') {
      query = query.eq('is_featured', true)
    }

    const { data: tags, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(tags || [])
  } catch (error) {
    console.error('Error fetching tags:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get popular tags
router.get('/popular', async (req, res) => {
  try {
    const { category, limit = 20 } = req.query

    const { data: tags, error } = await supabase
      .rpc('get_popular_tags', {
        tag_category_filter: category || null,
        limit_count: parseInt(limit)
      })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(tags || [])
  } catch (error) {
    console.error('Error fetching popular tags:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Suggest tags for content
router.post('/suggest', async (req, res) => {
  try {
    const { title, description = '', max_suggestions = 10 } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const { data: suggestions, error } = await supabase
      .rpc('suggest_tags_for_content', {
        title_text: title,
        description_text: description,
        max_suggestions: parseInt(max_suggestions)
      })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(suggestions || [])
  } catch (error) {
    console.error('Error suggesting tags:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new tag (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description, color = '#3B82F6', icon, category = 'custom', is_featured = false } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' })
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const { data: tag, error } = await supabase
      .from('tags')
      .insert([{
        name: name.trim(),
        slug,
        description: description?.trim(),
        color,
        icon,
        category,
        is_featured
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'Tag name or slug already exists' })
      }
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json(tag)
  } catch (error) {
    console.error('Error creating tag:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update tag (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, color, icon, category, is_featured } = req.body

    const updateData = {}
    if (name !== undefined) {
      updateData.name = name.trim()
      updateData.slug = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }
    if (description !== undefined) updateData.description = description?.trim()
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon
    if (category !== undefined) updateData.category = category
    if (is_featured !== undefined) updateData.is_featured = is_featured

    const { data: tag, error } = await supabase
      .from('tags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Tag name or slug already exists' })
      }
      return res.status(400).json({ error: error.message })
    }

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' })
    }

    res.json(tag)
  } catch (error) {
    console.error('Error updating tag:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete tag (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ message: 'Tag deleted successfully' })
  } catch (error) {
    console.error('Error deleting tag:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add tags to deal (admin or deal owner)
router.post('/deals/:id/tags', async (req, res) => {
  try {
    const { id } = req.params
    const { tag_ids } = req.body

    if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
      return res.status(400).json({ error: 'tag_ids array is required' })
    }

    // Check if user can modify this deal
    const { data: deal } = await supabase
      .from('deals')
      .select('submitter_id')
      .eq('id', id)
      .single()

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' })
    }

    const isOwner = req.user && deal.submitter_id === req.user.id
    const isAdmin = req.user && req.admin
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Permission denied' })
    }

    // Remove existing tags
    await supabase
      .from('deal_tags')
      .delete()
      .eq('deal_id', id)

    // Add new tags
    const dealTags = tag_ids.map(tag_id => ({
      deal_id: parseInt(id),
      tag_id: parseInt(tag_id)
    }))

    const { data: createdTags, error } = await supabase
      .from('deal_tags')
      .insert(dealTags)
      .select(`
        tag_id,
        tags (*)
      `)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(createdTags || [])
  } catch (error) {
    console.error('Error adding tags to deal:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add tags to coupon (admin or coupon owner)
router.post('/coupons/:id/tags', async (req, res) => {
  try {
    const { id } = req.params
    const { tag_ids } = req.body

    if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
      return res.status(400).json({ error: 'tag_ids array is required' })
    }

    // Check if user can modify this coupon
    const { data: coupon } = await supabase
      .from('coupons')
      .select('submitter_id')
      .eq('id', id)
      .single()

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' })
    }

    const isOwner = req.user && coupon.submitter_id === req.user.id
    const isAdmin = req.user && req.admin
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Permission denied' })
    }

    // Remove existing tags
    await supabase
      .from('coupon_tags')
      .delete()
      .eq('coupon_id', id)

    // Add new tags
    const couponTags = tag_ids.map(tag_id => ({
      coupon_id: parseInt(id),
      tag_id: parseInt(tag_id)
    }))

    const { data: createdTags, error } = await supabase
      .from('coupon_tags')
      .insert(couponTags)
      .select(`
        tag_id,
        tags (*)
      `)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(createdTags || [])
  } catch (error) {
    console.error('Error adding tags to coupon:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
