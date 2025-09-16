import express from 'express'
import { makeAdminClient } from '../lib/supa.js'

const router = express.Router()
const supabase = makeAdminClient()

// Helper function to check authentication
const requireAuth = (req, res, next) => {
  console.log('🔐 Auth check:', { 
    hasUser: !!req.user, 
    userId: req.user?.id,
    endpoint: req.path,
    method: req.method 
  })
  
  if (!req.user) {
    console.log('❌ No user in request')
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}

// Helper function to check admin role
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    next()
  } catch (error) {
    console.error('Admin check error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Get user's notifications
router.get('/', requireAuth, async (req, res) => {
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
      .range(offset, offset + parseInt(limit) - 1)

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

// Get user's notification preferences
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', req.user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return res.status(400).json({ error: error.message })
    }

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
        deal_expiration_alerts: true,
        weekly_digest: true,
        marketing_emails: false
      }

      const { data: newPreferences, error: insertError } = await supabase
        .from('user_notification_preferences')
        .insert(defaultPreferences)
        .select()
        .single()

      if (insertError) {
        return res.status(400).json({ error: insertError.message })
      }

      return res.json(newPreferences)
    }

    res.json(preferences)
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update notification preferences
router.put('/preferences', requireAuth, async (req, res) => {
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

// Mark notification as read
router.put('/:id/read', requireAuth, async (req, res) => {
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
router.post('/mark-read', requireAuth, async (req, res) => {
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
router.get('/admin/queue', requireAdmin, async (req, res) => {
  try {
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
      .range(offset, offset + parseInt(limit) - 1)

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

export default router
