import express from 'express'
import { makeAdminClient } from '../lib/supa.js'
import pushService from '../lib/pushService.js'

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

// ===== WEB PUSH NOTIFICATION ENDPOINTS =====

/**
 * Get VAPID public key for push subscriptions
 * This is a public endpoint (no auth required)
 */
router.get('/vapid-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY

  if (!publicKey) {
    // Return a placeholder message if VAPID keys aren't configured
    console.warn('⚠️ VAPID_PUBLIC_KEY not configured')
    return res.status(503).json({
      error: 'Push notifications not configured',
      hint: 'Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables'
    })
  }

  res.json({ publicKey })
})

/**
 * Save push subscription for a user
 * Stores the endpoint and keys for sending push notifications
 */
router.post('/push-subscription', requireAuth, async (req, res) => {
  try {
    const { subscription } = req.body

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' })
    }

    // Store the subscription in the database
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: req.user.id,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys?.p256dh,
        auth_key: subscription.keys?.auth,
        user_agent: req.headers['user-agent'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'endpoint'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving push subscription:', error)
      // Check if table doesn't exist
      if (error.code === '42P01') {
        return res.status(503).json({
          error: 'Push subscriptions table not set up',
          hint: 'Run database migrations'
        })
      }
      return res.status(400).json({ error: error.message })
    }

    console.log('✅ Push subscription saved for user:', req.user.id)
    res.json({ success: true, subscription: data })

  } catch (error) {
    console.error('Error saving push subscription:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Delete push subscription
 * Used when user disables notifications or unsubscribes
 */
router.delete('/push-subscription', requireAuth, async (req, res) => {
  try {
    const { endpoint } = req.body

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' })
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', req.user.id)

    if (error) {
      console.error('Error deleting push subscription:', error)
      return res.status(400).json({ error: error.message })
    }

    console.log('✅ Push subscription deleted for user:', req.user.id)
    res.json({ success: true })

  } catch (error) {
    console.error('Error deleting push subscription:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Get user's push subscriptions (for debugging/admin)
 */
router.get('/push-subscriptions', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, user_agent, created_at, updated_at')
      .eq('user_id', req.user.id)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(data || [])

  } catch (error) {
    console.error('Error fetching push subscriptions:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ===== ADMIN PUSH SENDING ENDPOINTS =====

/**
 * Send a test push notification to yourself (admin)
 */
router.post('/admin/test-push', requireAdmin, async (req, res) => {
  try {
    const result = await pushService.sendPushToUser(req.user.id, {
      title: '🧪 Test Notification',
      body: 'Push notifications are working! This is a test from SaveBucks.',
      url: '/',
      type: 'test'
    })

    res.json({
      success: true,
      message: 'Test notification sent',
      result
    })

  } catch (error) {
    console.error('Error sending test push:', error)
    res.status(500).json({ error: 'Failed to send test notification' })
  }
})

/**
 * Send a push notification to a specific user (admin)
 */
router.post('/admin/send-push', requireAdmin, async (req, res) => {
  try {
    const { user_id, title, body, url, type } = req.body

    if (!user_id || !title || !body) {
      return res.status(400).json({ error: 'user_id, title, and body are required' })
    }

    const result = await pushService.sendPushToUser(user_id, {
      title,
      body,
      url: url || '/',
      type: type || 'admin'
    })

    res.json({
      success: true,
      message: `Notification sent to user ${user_id}`,
      result
    })

  } catch (error) {
    console.error('Error sending push:', error)
    res.status(500).json({ error: 'Failed to send notification' })
  }
})

/**
 * Broadcast a push notification to all users (admin) 
 * Use with caution!
 */
router.post('/admin/broadcast', requireAdmin, async (req, res) => {
  try {
    const { title, body, url, type } = req.body

    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required' })
    }

    const result = await pushService.sendPushToAll({
      title,
      body,
      url: url || '/',
      type: type || 'announcement'
    })

    res.json({
      success: true,
      message: 'Broadcast sent',
      result
    })

  } catch (error) {
    console.error('Error broadcasting push:', error)
    res.status(500).json({ error: 'Failed to broadcast notification' })
  }
})

export default router
