import express from 'express'
import { makeAdminClient } from '../lib/supa.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()
const supabase = makeAdminClient()

function bearer(req) {
  const h = req.headers.authorization || ''
  return h.startsWith('Bearer ') ? h.slice(7) : null
}



// Auto-tag a specific deal
router.post('/deals/:id/auto-tag', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const { data: result, error } = await supabase
      .rpc('auto_tag_deal', { deal_id_param: parseInt(id) })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(result)
  } catch (error) {
    console.error('Error auto-tagging deal:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Auto-tag all untagged deals
router.post('/admin/auto-tag-all', requireAdmin, async (req, res) => {
  try {
    const { limit = 100 } = req.body

    const { data: result, error } = await supabase
      .rpc('auto_tag_all_deals', { limit_count: limit })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(result)
  } catch (error) {
    console.error('Error auto-tagging all deals:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get merchant patterns
router.get('/admin/merchant-patterns', requireAdmin, async (req, res) => {
  try {
    const { data: patterns, error } = await supabase
      .from('merchant_patterns')
      .select('*')
      .order('confidence_score', { ascending: false })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(patterns || [])
  } catch (error) {
    console.error('Error fetching merchant patterns:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create merchant pattern
router.post('/admin/merchant-patterns', requireAdmin, async (req, res) => {
  try {
    const {
      merchant_name,
      domain_patterns,
      url_patterns,
      title_patterns,
      merchant_id,
      confidence_score = 0.95,
      auto_apply_tags = [],
      category_hint
    } = req.body

    if (!merchant_name || !domain_patterns || domain_patterns.length === 0) {
      return res.status(400).json({ error: 'Merchant name and domain patterns are required' })
    }

    const { data: pattern, error } = await supabase
      .from('merchant_patterns')
      .insert({
        merchant_name,
        domain_patterns,
        url_patterns,
        title_patterns,
        merchant_id,
        confidence_score,
        auto_apply_tags,
        category_hint
      })
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json(pattern)
  } catch (error) {
    console.error('Error creating merchant pattern:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update merchant pattern
router.put('/admin/merchant-patterns/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data: pattern, error } = await supabase
      .from('merchant_patterns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!pattern) {
      return res.status(404).json({ error: 'Merchant pattern not found' })
    }

    res.json(pattern)
  } catch (error) {
    console.error('Error updating merchant pattern:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete merchant pattern
router.delete('/admin/merchant-patterns/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('merchant_patterns')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting merchant pattern:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get category patterns
router.get('/admin/category-patterns', requireAdmin, async (req, res) => {
  try {
    const { data: patterns, error } = await supabase
      .from('category_patterns')
      .select(`
        *,
        category:categories(id, name, slug)
      `)
      .order('priority', { ascending: false })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(patterns || [])
  } catch (error) {
    console.error('Error fetching category patterns:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create category pattern
router.post('/admin/category-patterns', requireAdmin, async (req, res) => {
  try {
    const {
      category_name,
      category_id,
      keyword_patterns,
      title_patterns,
      description_patterns,
      exclusion_patterns,
      confidence_score = 0.8,
      priority = 1,
      auto_apply_tags = []
    } = req.body

    if (!category_name || !keyword_patterns || keyword_patterns.length === 0) {
      return res.status(400).json({ error: 'Category name and keyword patterns are required' })
    }

    const { data: pattern, error } = await supabase
      .from('category_patterns')
      .insert({
        category_name,
        category_id,
        keyword_patterns,
        title_patterns,
        description_patterns,
        exclusion_patterns,
        confidence_score,
        priority,
        auto_apply_tags
      })
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json(pattern)
  } catch (error) {
    console.error('Error creating category pattern:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update category pattern
router.put('/admin/category-patterns/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data: pattern, error } = await supabase
      .from('category_patterns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!pattern) {
      return res.status(404).json({ error: 'Category pattern not found' })
    }

    res.json(pattern)
  } catch (error) {
    console.error('Error updating category pattern:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete category pattern
router.delete('/admin/category-patterns/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('category_patterns')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting category pattern:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Test merchant detection
router.post('/admin/test-merchant-detection', requireAdmin, async (req, res) => {
  try {
    const { url, title = '' } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    const { data: result, error } = await supabase
      .rpc('detect_merchant', {
        url_text: url,
        title_text: title
      })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(result?.[0] || { message: 'No merchant detected' })
  } catch (error) {
    console.error('Error testing merchant detection:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Test category detection
router.post('/admin/test-category-detection', requireAdmin, async (req, res) => {
  try {
    const { title, description = '' } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const { data: result, error } = await supabase
      .rpc('detect_category', {
        title_text: title,
        description_text: description
      })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(result?.[0] || { message: 'No category detected' })
  } catch (error) {
    console.error('Error testing category detection:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get auto-tagging log
router.get('/admin/auto-tagging-log', requireAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query

    const { data: logs, error } = await supabase
      .from('auto_tagging_log')
      .select(`
        *,
        deal:deals(id, title, url),
        coupon:coupons(id, title, code),
        reviewer:profiles!reviewed_by(handle)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(logs || [])
  } catch (error) {
    console.error('Error fetching auto-tagging log:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Review auto-tagging result
router.put('/admin/auto-tagging-log/:id/review', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    if (!status || !['applied', 'suggested', 'rejected', 'manual_override'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' })
    }

    const { data: log, error } = await supabase
      .from('auto_tagging_log')
      .update({
        status,
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
        ...(notes && { notes })
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!log) {
      return res.status(404).json({ error: 'Auto-tagging log entry not found' })
    }

    res.json(log)
  } catch (error) {
    console.error('Error reviewing auto-tagging result:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get auto-tagging statistics
router.get('/admin/auto-tagging-stats', requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query

    const { data: stats, error } = await supabase
      .from('auto_tagging_log')
      .select('status, detected_merchant, detected_category, applied_tags')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Calculate statistics
    const totalAttempts = stats?.length || 0
    const successfulMerchant = stats?.filter(s => s.detected_merchant).length || 0
    const successfulCategory = stats?.filter(s => s.detected_category).length || 0
    const totalTagsApplied = stats?.reduce((sum, s) => sum + (s.applied_tags?.length || 0), 0) || 0

    const statusCounts = stats?.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1
      return acc
    }, {}) || {}

    res.json({
      period_days: days,
      total_attempts: totalAttempts,
      successful_merchant_detection: successfulMerchant,
      successful_category_detection: successfulCategory,
      total_tags_applied: totalTagsApplied,
      merchant_detection_rate: totalAttempts > 0 ? (successfulMerchant / totalAttempts * 100).toFixed(2) : 0,
      category_detection_rate: totalAttempts > 0 ? (successfulCategory / totalAttempts * 100).toFixed(2) : 0,
      avg_tags_per_deal: totalAttempts > 0 ? (totalTagsApplied / totalAttempts).toFixed(2) : 0,
      status_breakdown: statusCounts
    })
  } catch (error) {
    console.error('Error fetching auto-tagging stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Get auto-tagging stats
router.get('/admin/auto-tagging/stats', requireAdmin, async (req, res) => {
  try {
    // Get total patterns
    const { count: totalMerchantPatterns } = await supabase
      .from('merchant_patterns')
      .select('*', { count: 'exact', head: true })

    const { count: totalCategoryPatterns } = await supabase
      .from('category_patterns')
      .select('*', { count: 'exact', head: true })

    // Get recent tagging logs
    const { data: recentLogs } = await supabase
      .from('auto_tagging_log')
      .select(`
        *,
        deal:deals(id, title)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    res.json({
      patterns: {
        merchant: totalMerchantPatterns || 0,
        category: totalCategoryPatterns || 0
      },
      recent_logs: recentLogs || []
    })
  } catch (error) {
    console.error('Error fetching auto-tagging stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Get merchant patterns (updated endpoint)
router.get('/admin/auto-tagging/merchant-patterns', requireAdmin, async (req, res) => {
  try {
    const { data: patterns, error } = await supabase
      .from('merchant_patterns')
      .select('*')
      .order('confidence_score', { ascending: false })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(patterns || [])
  } catch (error) {
    console.error('Error fetching merchant patterns:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Create merchant pattern (updated endpoint)
router.post('/admin/auto-tagging/merchant-patterns', requireAdmin, async (req, res) => {
  try {
    const patternData = req.body

    const { data: pattern, error } = await supabase
      .from('merchant_patterns')
      .insert(patternData)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json(pattern)
  } catch (error) {
    console.error('Error creating merchant pattern:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Get category patterns
router.get('/admin/auto-tagging/category-patterns', requireAdmin, async (req, res) => {
  try {
    const { data: patterns, error } = await supabase
      .from('category_patterns')
      .select(`
        *,
        category:categories(id, name)
      `)
      .order('confidence_score', { ascending: false })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(patterns || [])
  } catch (error) {
    console.error('Error fetching category patterns:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Create category pattern
router.post('/admin/auto-tagging/category-patterns', requireAdmin, async (req, res) => {
  try {
    const patternData = req.body

    const { data: pattern, error } = await supabase
      .from('category_patterns')
      .insert(patternData)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json(pattern)
  } catch (error) {
    console.error('Error creating category pattern:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
