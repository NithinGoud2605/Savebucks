import express from 'express'
import { makeAdminClient } from '../lib/supa.js'
import { makeUserClientFromToken } from '../lib/supaUser.js'
import { createSafeUserClient } from '../lib/authUtils.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import savedSearchAlerts from '../lib/savedSearchAlerts.js'

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

    const supaUser = await createSafeUserClient(token, res)
    if (!supaUser) return; // Exit if client creation failed

    const { data: { user } } = await supaUser.auth.getUser()

    if (!user) return res.status(401).json({ error: 'Invalid token' })

    req.user = user
    next()
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

// Get user's saved searches
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data: searches, error } = await supabase
      .from('saved_searches')
      .select(`
        *,
        category:categories(id, name, slug)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(searches || [])
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new saved search
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      name,
      search_type,
      query_text,
      merchant_domain,
      category_id,
      filters = {},
      alert_enabled = true,
      alert_frequency = 'immediate',
      price_threshold,
      discount_threshold,
      push_notifications = true,
      email_notifications = true,
      in_app_notifications = true
    } = req.body

    if (!name || !search_type) {
      return res.status(400).json({ error: 'Name and search type are required' })
    }

    const { data: search, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: req.user.id,
        name,
        search_type,
        query_text,
        merchant_domain,
        category_id,
        filters,
        alert_enabled,
        alert_frequency,
        price_threshold,
        discount_threshold,
        push_notifications,
        email_notifications,
        in_app_notifications
      })
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json(search)
  } catch (error) {
    console.error('Error creating saved search:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update saved search
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data: search, error } = await supabase
      .from('saved_searches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!search) {
      return res.status(404).json({ error: 'Saved search not found' })
    }

    res.json(search)
  } catch (error) {
    console.error('Error updating saved search:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete saved search
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting saved search:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Test saved search (preview results)
router.post('/test', requireAuth, async (req, res) => {
  try {
    const { search_type, query_text, merchant_domain, category_id, filters = {} } = req.body

    let query = supabase
      .from('deals')
      .select(`
        id, title, url, price, original_price, merchant, description,
        created_at, status, discount_percentage
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10)

    // Apply filters based on search type
    switch (search_type) {
      case 'keyword':
        if (query_text) {
          query = query.or(`title.ilike.%${query_text}%,description.ilike.%${query_text}%`)
        }
        break
      case 'merchant':
        if (merchant_domain) {
          query = query.ilike('merchant', `%${merchant_domain}%`)
        }
        break
      case 'category':
        if (category_id) {
          query = query.eq('category_id', category_id)
        }
        break
      case 'advanced':
        if (filters.min_price) {
          query = query.gte('price', filters.min_price)
        }
        if (filters.max_price) {
          query = query.lte('price', filters.max_price)
        }
        if (filters.min_discount) {
          query = query.gte('discount_percentage', filters.min_discount)
        }
        break
    }

    const { data: deals, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({
      preview: deals || [],
      count: deals?.length || 0
    })
  } catch (error) {
    console.error('Error testing saved search:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's notification preferences
router.get('/notification-preferences', requireAuth, async (req, res) => {
  try {
    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', req.user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return res.status(400).json({ error: error.message })
    }

    // Return default preferences if none exist
    if (!preferences) {
      const defaultPreferences = {
        user_id: req.user.id,
        push_notifications_enabled: true,
        email_notifications_enabled: true,
        in_app_notifications_enabled: true,
        max_daily_notifications: 10,
        max_weekly_notifications: 50,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        price_drop_alerts: true,
        new_deal_alerts: true,
        deal_expiry_alerts: true,
        followed_merchant_alerts: true,
        followed_category_alerts: true,
        push_tokens: []
      }

      res.json(defaultPreferences)
      return
    }

    res.json(preferences)
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update notification preferences
router.put('/notification-preferences', requireAuth, async (req, res) => {
  try {
    const preferences = req.body

    const { data: updated, error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: req.user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(updated)
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's notifications
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const { unread_only = false, limit = 50, offset = 0 } = req.query

    let query = supabase
      .from('notification_queue')
      .select(`
        id, title, message, action_url, image_url, priority,
        notification_type, status, sent_at, scheduled_for, created_at,
        deal:deals(id, title, price),
        coupon:coupons(id, title, coupon_code),
        saved_search:saved_searches(id, name)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unread_only === 'true') {
      query = query.eq('status', 'pending')
    }

    const { data: notifications, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(notifications || [])
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark notification as read
router.put('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const { data: notification, error } = await supabase
      .from('notification_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json(notification)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark multiple notifications as read
router.post('/notifications/mark-read', requireAuth, async (req, res) => {
  try {
    const { notification_ids } = req.body

    if (!notification_ids || !Array.isArray(notification_ids)) {
      return res.status(400).json({ error: 'notification_ids array is required' })
    }

    const { data: notifications, error } = await supabase
      .from('notification_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .in('id', notification_ids)
      .eq('user_id', req.user.id)
      .select()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({
      success: true,
      updated_count: notifications?.length || 0,
      notifications: notifications || []
    })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get notification queue (for admin)
router.get('/admin/notifications/queue', requireAuth, async (req, res) => {
  try {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { limit = 50, offset = 0, status } = req.query

    let query = supabase
      .from('notification_queue')
      .select(`
        id, title, message, action_url, image_url, priority,
        notification_type, status, sent_at, scheduled_for, created_at,
        deal:deals(id, title, price),
        coupon:coupons(id, title, coupon_code),
        saved_search:saved_searches(id, name),
        user:profiles!notification_queue_user_id_fkey(handle)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: notifications, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(notifications || [])
  } catch (error) {
    console.error('Error fetching notification queue:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Get saved searches stats
router.get('/admin/saved-searches/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Get total saved searches
    const { count: totalSearches } = await supabase
      .from('saved_searches')
      .select('*', { count: 'exact', head: true })

    // Get active saved searches
    const { count: activeSearches } = await supabase
      .from('saved_searches')
      .select('*', { count: 'exact', head: true })
      .eq('alert_enabled', true)

    // Get total notifications
    const { count: totalNotifications } = await supabase
      .from('notification_queue')
      .select('*', { count: 'exact', head: true })

    // Get top searches
    const { data: topSearches } = await supabase
      .from('saved_searches')
      .select(`
        *,
        user:profiles!saved_searches_user_id_fkey(handle)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    res.json({
      saved_searches: {
        total: totalSearches || 0,
        active: activeSearches || 0
      },
      notifications: {
        total: totalNotifications || 0
      },
      top_searches: topSearches || []
    })
  } catch (error) {
    console.error('Error fetching saved searches stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Get saved searches list
router.get('/admin/saved-searches/list', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query

    const { data: searches, error } = await supabase
      .from('saved_searches')
      .select(`
        *,
        user:profiles!saved_searches_user_id_fkey(handle),
        category:categories(id, name, slug)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(searches || [])
  } catch (error) {
    console.error('Error fetching saved searches list:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Trigger saved search alert processing
router.post('/admin/process-alerts', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { minutes = 30 } = req.body

    console.log('🔔 Admin triggered saved search alert processing')
    const result = await savedSearchAlerts.processNewDealAlerts(minutes)

    res.json({
      success: true,
      message: `Processed ${result.processed} deals, found ${result.matches} matches, sent ${result.notifications} notifications`,
      ...result
    })
  } catch (error) {
    console.error('Error processing alerts:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

