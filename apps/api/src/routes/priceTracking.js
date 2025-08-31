import express from 'express'
import { makeAdminClient } from '../lib/supa.js'
import { makeUserClientFromToken } from '../lib/supaUser.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

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
router.get('/api/price-tracking/deals/:dealId/history', requireAuth, async (req, res) => {
  try {
    const { dealId } = req.params
    const { days = 30 } = req.query

    const { data: history, error } = await supabase
      .from('deal_price_history')
      .select('*')
      .eq('deal_id', dealId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(history || [])
  } catch (error) {
    console.error('Error fetching price history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get deal countdown info
router.get('/api/price-tracking/deals/:dealId/countdown', requireAuth, async (req, res) => {
  try {
    const { dealId } = req.params

    const { data: deal, error } = await supabase
      .from('deals')
      .select('id, title, expires_at, stock_status')
      .eq('id', dealId)
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' })
    }

    const now = new Date()
    const expiresAt = deal.expires_at ? new Date(deal.expires_at) : null
    const timeLeft = expiresAt ? expiresAt.getTime() - now.getTime() : null

    res.json({
      deal_id: deal.id,
      title: deal.title,
      expires_at: deal.expires_at,
      stock_status: deal.stock_status,
      time_left_ms: timeLeft,
      is_expired: timeLeft ? timeLeft <= 0 : false,
      days_left: timeLeft ? Math.ceil(timeLeft / (1000 * 60 * 60 * 24)) : null
    })
  } catch (error) {
    console.error('Error fetching deal countdown:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create price alert
router.post('/api/price-tracking/alerts', requireAuth, async (req, res) => {
  try {
    const {
      deal_id,
      target_price,
      alert_type = 'price_drop',
      notification_methods = ['in_app']
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
        alert_type,
        notification_methods,
        status: 'active'
      })
      .select()
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

// Get user's price alerts
router.get('/api/price-tracking/alerts', requireAuth, async (req, res) => {
  try {
    const { data: alerts, error } = await supabase
      .from('price_alerts')
      .select(`
        *,
        deal:deals(id, title, price, original_price, merchant, url)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(alerts || [])
  } catch (error) {
    console.error('Error fetching price alerts:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update price alert
router.put('/api/price-tracking/alerts/:alertId', requireAuth, async (req, res) => {
  try {
    const { alertId } = req.params
    const updates = req.body

    const { data: alert, error } = await supabase
      .from('price_alerts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', alertId)
      .eq('user_id', req.user.id)
      .select()
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
router.delete('/api/price-tracking/alerts/:alertId', requireAuth, async (req, res) => {
  try {
    const { alertId } = req.params

    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', alertId)
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

// Get expiring deals
router.get('/api/price-tracking/expiring', requireAuth, async (req, res) => {
  try {
    const { days = 7 } = req.query
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

    const { data: deals, error } = await supabase
      .from('deals')
      .select('id, title, price, original_price, merchant, expires_at, stock_status')
      .not('expires_at', 'is', null)
      .lte('expires_at', cutoffDate)
      .eq('status', 'approved')
      .order('expires_at', { ascending: true })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(deals || [])
  } catch (error) {
    console.error('Error fetching expiring deals:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark deals as expired
router.post('/api/price-tracking/mark-expired', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { deal_ids } = req.body

    if (!deal_ids || !Array.isArray(deal_ids)) {
      return res.status(400).json({ error: 'deal_ids array is required' })
    }

    const { data: deals, error } = await supabase
      .from('deals')
      .update({ 
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .in('id', deal_ids)
      .select()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ 
      success: true, 
      updated_count: deals?.length || 0,
      deals: deals || []
    })
  } catch (error) {
    console.error('Error marking deals as expired:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Get price tracking stats
router.get('/api/admin/price-tracking/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Get price history stats
    const { count: priceHistoryCount } = await supabase
      .from('deal_price_history')
      .select('*', { count: 'exact', head: true })

    // Get price alerts stats
    const { count: totalAlerts } = await supabase
      .from('price_alerts')
      .select('*', { count: 'exact', head: true })

    const { count: activeAlerts } = await supabase
      .from('price_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get recent price changes
    const { data: recentChanges } = await supabase
      .from('deal_price_history')
      .select(`
        *,
        deal:deals(id, title, merchant)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    res.json({
      price_history: {
        total: priceHistoryCount || 0
      },
      price_alerts: {
        total: totalAlerts || 0,
        active: activeAlerts || 0
      },
      recent_changes: recentChanges || []
    })
  } catch (error) {
    console.error('Error fetching price tracking stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Get all price alerts
router.get('/api/admin/price-tracking/alerts', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query

    let query = supabase
      .from('price_alerts')
      .select(`
        *,
        deal:deals(id, title, price, merchant),
        user:profiles!price_alerts_user_id_fkey(handle, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
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

export default router
