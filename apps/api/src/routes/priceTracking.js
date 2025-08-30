import express from 'express'
import { makeAdminClient } from '../lib/supa.js'
import { makeUserClientFromToken } from '../lib/supaUser.js'

const router = express.Router()
const supabase = makeAdminClient()

function bearer(req) {
  const h = req.headers.authorization || ''
  return h.startsWith('Bearer ') ? h.slice(7) : null
}

// Middleware to get authenticated user
const requireAuth = async (req, res, next) => {
  try {
    const token = bearer(req)
    if (!token) return res.status(401).json({ error: 'Authentication required' })

    const supaUser = makeUserClientFromToken(token)
    const { data: { user } } = await supaUser.auth.getUser()
    
    if (!user) return res.status(401).json({ error: 'Invalid token' })

    req.user = user
    next()
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

// Get price history for a deal
router.get('/api/deals/:id/price-history', async (req, res) => {
  try {
    const { id } = req.params
    const { days = 30 } = req.query

    const { data: history, error } = await supabase
      .rpc('get_price_sparkline', {
        deal_id_param: parseInt(id),
        days_back: parseInt(days)
      })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(history || [])
  } catch (error) {
    console.error('Error fetching price history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get deal countdown information
router.get('/api/deals/:id/countdown', async (req, res) => {
  try {
    const { id } = req.params

    const { data: countdown, error } = await supabase
      .rpc('get_deal_countdown', {
        deal_id_param: parseInt(id)
      })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(countdown?.[0] || { status: 'no_expiration', urgency_level: 0 })
  } catch (error) {
    console.error('Error fetching deal countdown:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Record price change (admin or automated)
router.post('/api/deals/:id/price-update', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const {
      price,
      original_price,
      stock_status,
      stock_quantity,
      source = 'manual',
      notes
    } = req.body

    // Check if user is admin or if this is an automated update
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single()

    if (source === 'manual' && profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required for manual price updates' })
    }

    const { data: historyId, error } = await supabase
      .rpc('record_price_change', {
        deal_id_param: parseInt(id),
        new_price: price,
        new_original_price: original_price,
        new_stock_status: stock_status,
        new_stock_quantity: stock_quantity,
        source_param: source,
        notes_param: notes
      })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ 
      success: true, 
      history_id: historyId,
      message: 'Price update recorded successfully'
    })
  } catch (error) {
    console.error('Error recording price update:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's price alerts
router.get('/api/price-alerts', requireAuth, async (req, res) => {
  try {
    const { deal_id } = req.query

    let query = supabase
      .from('price_alerts')
      .select(`
        *,
        deal:deals(id, title, price, merchant, image_url)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (deal_id) {
      query = query.eq('deal_id', deal_id)
    }

    const { data: alerts, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(alerts || [])
  } catch (error) {
    console.error('Error fetching price alerts:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create price alert
router.post('/api/price-alerts', requireAuth, async (req, res) => {
  try {
    const {
      deal_id,
      target_price,
      alert_type = 'price_drop'
    } = req.body

    if (!deal_id || !target_price) {
      return res.status(400).json({ error: 'Deal ID and target price are required' })
    }

    const { data: alert, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: req.user.id,
        deal_id,
        target_price,
        alert_type
      })
      .select(`
        *,
        deal:deals(id, title, price, merchant)
      `)
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json(alert)
  } catch (error) {
    console.error('Error creating price alert:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update price alert
router.put('/api/price-alerts/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data: alert, error } = await supabase
      .from('price_alerts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select(`
        *,
        deal:deals(id, title, price, merchant)
      `)
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!alert) {
      return res.status(404).json({ error: 'Price alert not found' })
    }

    res.json(alert)
  } catch (error) {
    console.error('Error updating price alert:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete price alert
router.delete('/api/price-alerts/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting price alert:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get deals expiring soon
router.get('/api/deals/expiring-soon', async (req, res) => {
  try {
    const { hours = 24, limit = 20 } = req.query

    const { data: deals, error } = await supabase
      .from('deals')
      .select(`
        id, title, url, price, original_price, merchant, expires_at,
        discount_percentage, image_url, featured_image
      `)
      .not('expires_at', 'is', null)
      .gte('expires_at', new Date().toISOString())
      .lte('expires_at', new Date(Date.now() + hours * 60 * 60 * 1000).toISOString())
      .eq('status', 'approved')
      .order('expires_at', { ascending: true })
      .limit(limit)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Add countdown information to each deal
    const dealsWithCountdown = await Promise.all(
      (deals || []).map(async (deal) => {
        const { data: countdown } = await supabase
          .rpc('get_deal_countdown', { deal_id_param: deal.id })

        return {
          ...deal,
          countdown: countdown?.[0] || { status: 'active', urgency_level: 1 }
        }
      })
    )

    res.json(dealsWithCountdown)
  } catch (error) {
    console.error('Error fetching expiring deals:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Auto-expire deals (admin endpoint)
router.post('/api/admin/deals/auto-expire', requireAuth, async (req, res) => {
  try {
    // Check admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { data: expiredCount, error } = await supabase
      .rpc('auto_expire_deals')

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ 
      success: true, 
      expired_count: expiredCount,
      message: `${expiredCount} deals expired automatically`
    })
  } catch (error) {
    console.error('Error auto-expiring deals:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get price trend analysis
router.get('/api/deals/:id/price-trend', async (req, res) => {
  try {
    const { id } = req.params

    const { data: deal, error } = await supabase
      .from('deals')
      .select('price_trend, last_price_check, stock_status')
      .eq('id', id)
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' })
    }

    // Get recent price points for trend analysis
    const { data: recentPrices, error: pricesError } = await supabase
      .from('deal_price_history')
      .select('price, created_at')
      .eq('deal_id', id)
      .not('price', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (pricesError) {
      return res.status(400).json({ error: pricesError.message })
    }

    res.json({
      trend: deal.price_trend,
      last_check: deal.last_price_check,
      stock_status: deal.stock_status,
      recent_prices: recentPrices || [],
      price_points: recentPrices?.length || 0
    })
  } catch (error) {
    console.error('Error fetching price trend:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
