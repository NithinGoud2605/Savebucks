import express from 'express'
import { makeAdminClient } from '../lib/supa.js'

const supabase = makeAdminClient()
const router = express.Router()

// Helper function to get deals with pagination
async function getDealsWithPagination(query, page = 1, limit = 20) {
  const offset = (page - 1) * limit
  
  const { data: deals, error, count } = await query
    .range(offset, offset + limit - 1)
    .select(`
      *,
      company:companies(name, logo_url, website_url),
      category:categories(name, slug),
      tags:deal_tags(tag:tags(name, slug, color)),
      user:profiles(handle, display_name, avatar_url),
      votes:votes(count),
      comments:comments(count)
    `, { count: 'exact' })
  
  if (error) {
    throw error
  }
  
  return {
    deals: deals || [],
    total: count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil((count || 0) / limit)
  }
}

// Trending deals - based on upvotes and recent activity
router.get('/trending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    
    // Get deals with high upvotes and recent activity
    // Trending score = (upvotes * 2) + (comments * 1) + (recent activity bonus)
    const query = supabase
      .from('deals')
      .select(`
        *,
        company:companies(name, logo_url, website_url),
        category:categories(name, slug),
        tags:deal_tags(tag:tags(name, slug, color)),
        user:profiles(handle, display_name, avatar_url),
        votes:deal_votes(count),
        comments:deal_comments(count)
      `)
      .eq('status', 'approved')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('created_at', { ascending: false })
    
    const result = await getDealsWithPagination(query, page, limit)
    
    // Sort by trending score (upvotes + comments + recency)
    result.deals = result.deals.sort((a, b) => {
      const scoreA = (a.votes?.[0]?.count || 0) * 2 + (a.comments?.[0]?.count || 0) + 
                    (new Date(a.created_at).getTime() / (1000 * 60 * 60 * 24)) // Days since creation
      const scoreB = (b.votes?.[0]?.count || 0) * 2 + (b.comments?.[0]?.count || 0) + 
                    (new Date(b.created_at).getTime() / (1000 * 60 * 60 * 24))
      return scoreB - scoreA
    })
    
    res.json({
      success: true,
      data: result,
      category: 'trending'
    })
  } catch (error) {
    console.error('Trending deals error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Under $20 deals
router.get('/under-20', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    
    const query = supabase
      .from('deals')
      .select(`
        *,
        company:companies(name, logo_url, website_url),
        category:categories(name, slug),
        tags:deal_tags(tag:tags(name, slug, color)),
        user:profiles(handle, display_name, avatar_url),
        votes:deal_votes(count),
        comments:deal_comments(count)
      `)
      .eq('status', 'approved')
      .lt('price', 20)
      .order('price', { ascending: true })
    
    const result = await getDealsWithPagination(query, page, limit)
    
    res.json({
      success: true,
      data: result,
      category: 'under-20'
    })
  } catch (error) {
    console.error('Under $20 deals error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 50% off deals
router.get('/50-off', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    
    const query = supabase
      .from('deals')
      .select(`
        *,
        company:companies(name, logo_url, website_url),
        category:categories(name, slug),
        tags:deal_tags(tag:tags(name, slug, color)),
        user:profiles(handle, display_name, avatar_url),
        votes:deal_votes(count),
        comments:deal_comments(count)
      `)
      .eq('status', 'approved')
      .gte('discount_percentage', 50)
      .order('discount_percentage', { ascending: false })
    
    const result = await getDealsWithPagination(query, page, limit)
    
    res.json({
      success: true,
      data: result,
      category: '50-off'
    })
  } catch (error) {
    console.error('50% off deals error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Free shipping deals
router.get('/free-shipping', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    
    // Get deals with free shipping tag
    const { data: freeShippingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', 'free-shipping')
      .single()
    
    if (!freeShippingTag) {
      return res.json({
        success: true,
        data: { deals: [], total: 0, page: 1, limit: 20, totalPages: 0 },
        category: 'free-shipping'
      })
    }
    
    const query = supabase
      .from('deals')
      .select(`
        *,
        company:companies(name, logo_url, website_url),
        category:categories(name, slug),
        tags:deal_tags(tag:tags(name, slug, color)),
        user:profiles(handle, display_name, avatar_url),
        votes:deal_votes(count),
        comments:deal_comments(count)
      `)
      .eq('status', 'approved')
      .eq('deal_tags.tag_id', freeShippingTag.id)
      .order('created_at', { ascending: false })
    
    const result = await getDealsWithPagination(query, page, limit)
    
    res.json({
      success: true,
      data: result,
      category: 'free-shipping'
    })
  } catch (error) {
    console.error('Free shipping deals error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// New arrivals - based on date posted
router.get('/new-arrivals', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    
    const query = supabase
      .from('deals')
      .select(`
        *,
        company:companies(name, logo_url, website_url),
        category:categories(name, slug),
        tags:deal_tags(tag:tags(name, slug, color)),
        user:profiles(handle, display_name, avatar_url),
        votes:deal_votes(count),
        comments:deal_comments(count)
      `)
      .eq('status', 'approved')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('created_at', { ascending: false })
    
    const result = await getDealsWithPagination(query, page, limit)
    
    res.json({
      success: true,
      data: result,
      category: 'new-arrivals'
    })
  } catch (error) {
    console.error('New arrivals error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Hot deals - based on user engagement
router.get('/hot-deals', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    
    const query = supabase
      .from('deals')
      .select(`
        *,
        company:companies(name, logo_url, website_url),
        category:categories(name, slug),
        tags:deal_tags(tag:tags(name, slug, color)),
        user:profiles(handle, display_name, avatar_url),
        votes:deal_votes(count),
        comments:deal_comments(count)
      `)
      .eq('status', 'approved')
      .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()) // Last 14 days
      .order('created_at', { ascending: false })
    
    const result = await getDealsWithPagination(query, page, limit)
    
    // Sort by engagement score (upvotes + comments + views)
    result.deals = result.deals.sort((a, b) => {
      const engagementA = (a.votes?.[0]?.count || 0) * 3 + (a.comments?.[0]?.count || 0) * 2 + (a.views_count || 0)
      const engagementB = (b.votes?.[0]?.count || 0) * 3 + (b.comments?.[0]?.count || 0) * 2 + (b.views_count || 0)
      return engagementB - engagementA
    })
    
    res.json({
      success: true,
      data: result,
      category: 'hot-deals'
    })
  } catch (error) {
    console.error('Hot deals error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Ending soon - based on expiry date
router.get('/ending-soon', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    
    const query = supabase
      .from('deals')
      .select(`
        *,
        company:companies(name, logo_url, website_url),
        category:categories(name, slug),
        tags:deal_tags(tag:tags(name, slug, color)),
        user:profiles(handle, display_name, avatar_url),
        votes:deal_votes(count),
        comments:deal_comments(count)
      `)
      .eq('status', 'approved')
      .not('expires_at', 'is', null)
      .gte('expires_at', new Date().toISOString()) // Not expired yet
      .lte('expires_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()) // Expires within 7 days
      .order('expires_at', { ascending: true })
    
    const result = await getDealsWithPagination(query, page, limit)
    
    res.json({
      success: true,
      data: result,
      category: 'ending-soon'
    })
  } catch (error) {
    console.error('Ending soon deals error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
