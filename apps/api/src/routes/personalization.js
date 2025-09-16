import { Router } from 'express'
import { makeAdminClient } from '../lib/supa.js'
import { makeAuth } from '../middleware/auth.js'

const router = Router()
const supaAdmin = makeAdminClient()

// Use proper auth middleware
const requireAuth = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}

// Get user preferences
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const { data: preferences, error } = await supaAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', req.user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user preferences:', error)
      return res.status(500).json({ error: 'Failed to fetch preferences' })
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      preferred_categories: [],
      preferred_companies: [],
      preferred_price_range: { min: 0, max: 10000 },
      preferred_discount_minimum: 10.00,
      email_notifications: true,
      push_notifications: true,
      deal_alerts: true,
      price_drop_alerts: true,
      new_deal_notifications: true,
      weekly_digest: true,
      theme: 'light',
      language: 'en',
      currency: 'USD',
      timezone: 'UTC',
      show_adult_content: false,
      content_filter_level: 'moderate',
      profile_visibility: 'public',
      show_activity: true,
      allow_data_collection: true
    }

    res.json(preferences || defaultPreferences)
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user preferences
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const preferences = req.body

    const { data, error } = await supaAdmin
      .from('user_preferences')
      .upsert({
        user_id: req.user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      return res.status(500).json({ error: 'Failed to update preferences' })
    }

    res.json(data)
  } catch (error) {
    console.error('Error updating user preferences:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Track user activity
router.post('/activity', requireAuth, async (req, res) => {
  try {
    const { activity_type, target_type, target_id, target_slug, metadata, session_id } = req.body

    if (!activity_type) {
      return res.status(400).json({ error: 'Activity type is required' })
    }

    // Use the RPC function to track activity
    const { error } = await supaAdmin
      .rpc('track_user_activity', {
        user_id_param: req.user.id,
        activity_type_param: activity_type,
        target_type_param: target_type,
        target_id_param: target_id,
        target_slug_param: target_slug,
        metadata_param: metadata || {},
        session_id_param: session_id
      })

    if (error) {
      console.error('Error tracking user activity:', error)
      return res.status(500).json({ error: 'Failed to track activity' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error tracking user activity:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user recommendations
router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const { type, limit = 12 } = req.query

    const { data: recommendations, error } = await supaAdmin
      .rpc('get_user_recommendations', {
        user_id_param: req.user.id,
        limit_param: parseInt(limit),
        recommendation_type_param: type || null
      })

    if (error) {
      console.error('Error fetching user recommendations:', error)
      // Return empty array instead of error to allow fallback to work
      return res.json([])
    }

    // If no recommendations exist or we have fewer than requested, generate more
    if (!recommendations || recommendations.length < parseInt(limit)) {
      console.log(`Generating recommendations for user ${req.user.id}, current count: ${recommendations?.length || 0}, requested: ${limit}`)
      
      try {
        await supaAdmin.rpc('generate_user_recommendations', {
          user_id_param: req.user.id
        })
      } catch (genError) {
        console.error('Error generating recommendations:', genError)
        // Continue anyway, maybe we can get some existing recommendations
      }

      // Fetch again after generation
      const { data: newRecommendations } = await supaAdmin
        .rpc('get_user_recommendations', {
          user_id_param: req.user.id,
          limit_param: parseInt(limit),
          recommendation_type_param: type || null
        })

      console.log(`After generation: ${newRecommendations?.length || 0} recommendations found`)
      return res.json(newRecommendations || [])
    }

    res.json(recommendations)
  } catch (error) {
    console.error('Error fetching user recommendations:', error)
    // Return empty array to allow fallback to work
    res.json([])
  }
})

// Generate new recommendations
router.post('/recommendations/generate', requireAuth, async (req, res) => {
  try {
    const { error } = await supaAdmin
      .rpc('generate_user_recommendations', {
        user_id_param: req.user.id
      })

    if (error) {
      console.error('Error generating recommendations:', error)
      return res.status(500).json({ error: 'Failed to generate recommendations' })
    }

    res.json({ success: true, message: 'Recommendations generated successfully' })
  } catch (error) {
    console.error('Error generating recommendations:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Debug endpoint to check recommendation status
router.get('/recommendations/debug', requireAuth, async (req, res) => {
  try {
    const { data: recommendations } = await supaAdmin
      .rpc('get_user_recommendations', {
        user_id_param: req.user.id,
        limit_param: 50,
        recommendation_type_param: null
      })

    const { data: preferences } = await supaAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', req.user.id)
      .single()

    const { data: activities } = await supaAdmin
      .from('user_activities')
      .select('*')
      .eq('user_id', req.user.id)
      .limit(10)

    res.json({
      user_id: req.user.id,
      recommendations_count: recommendations?.length || 0,
      recommendations: recommendations || [],
      preferences: preferences || {},
      recent_activities: activities || [],
      debug_info: {
        has_preferences: !!preferences,
        has_activities: (activities?.length || 0) > 0,
        recommendation_types: recommendations?.map(r => r.recommendation_type) || []
      }
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user interests
router.get('/interests', requireAuth, async (req, res) => {
  try {
    const { data: interests, error } = await supaAdmin
      .from('user_interests')
      .select('*')
      .eq('user_id', req.user.id)
      .order('interest_weight', { ascending: false })

    if (error) {
      console.error('Error fetching user interests:', error)
      return res.status(500).json({ error: 'Failed to fetch interests' })
    }

    res.json(interests || [])
  } catch (error) {
    console.error('Error fetching user interests:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user activity history
router.get('/activity', requireAuth, async (req, res) => {
  try {
    const { limit = 50, offset = 0, type } = req.query

    let query = supaAdmin
      .from('user_activities')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) {
      query = query.eq('activity_type', type)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Error fetching user activities:', error)
      return res.status(500).json({ error: 'Failed to fetch activities' })
    }

    res.json(activities || [])
  } catch (error) {
    console.error('Error fetching user activities:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get saved searches
router.get('/saved-searches', requireAuth, async (req, res) => {
  try {
    const { data: savedSearches, error } = await supaAdmin
      .from('user_saved_searches')
      .select('*')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved searches:', error)
      return res.status(500).json({ error: 'Failed to fetch saved searches' })
    }

    res.json(savedSearches || [])
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Save a search
router.post('/saved-searches', requireAuth, async (req, res) => {
  try {
    const { search_name, search_query, search_filters, notify_on_new_results, notification_frequency } = req.body

    if (!search_name || !search_query) {
      return res.status(400).json({ error: 'Search name and query are required' })
    }

    const { data: savedSearch, error } = await supaAdmin
      .from('user_saved_searches')
      .insert({
        user_id: req.user.id,
        search_name,
        search_query,
        search_filters: search_filters || {},
        notify_on_new_results: notify_on_new_results || false,
        notification_frequency: notification_frequency || 'daily'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving search:', error)
      return res.status(500).json({ error: 'Failed to save search' })
    }

    res.status(201).json(savedSearch)
  } catch (error) {
    console.error('Error saving search:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update saved search
router.put('/saved-searches/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data: savedSearch, error } = await supaAdmin
      .from('user_saved_searches')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating saved search:', error)
      return res.status(500).json({ error: 'Failed to update saved search' })
    }

    res.json(savedSearch)
  } catch (error) {
    console.error('Error updating saved search:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete saved search
router.delete('/saved-searches/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supaAdmin
      .from('user_saved_searches')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) {
      console.error('Error deleting saved search:', error)
      return res.status(500).json({ error: 'Failed to delete saved search' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting saved search:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user follows
router.get('/follows', requireAuth, async (req, res) => {
  try {
    const { type = 'user' } = req.query

    const { data: follows, error } = await supaAdmin
      .from('user_follows')
      .select(`
        *,
        following:profiles!user_follows_following_id_fkey(
          id, username, display_name, avatar_url, is_verified
        )
      `)
      .eq('follower_id', req.user.id)
      .eq('follow_type', type)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching user follows:', error)
      return res.status(500).json({ error: 'Failed to fetch follows' })
    }

    res.json(follows || [])
  } catch (error) {
    console.error('Error fetching user follows:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Follow a user
router.post('/follows', requireAuth, async (req, res) => {
  try {
    const { following_id, follow_type = 'user' } = req.body

    if (!following_id) {
      return res.status(400).json({ error: 'Following ID is required' })
    }

    if (following_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' })
    }

    const { data: follow, error } = await supaAdmin
      .from('user_follows')
      .insert({
        follower_id: req.user.id,
        following_id,
        follow_type
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'Already following this user' })
      }
      console.error('Error following user:', error)
      return res.status(500).json({ error: 'Failed to follow user' })
    }

    res.status(201).json(follow)
  } catch (error) {
    console.error('Error following user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Unfollow a user
router.delete('/follows/:following_id', requireAuth, async (req, res) => {
  try {
    const { following_id } = req.params

    const { error } = await supaAdmin
      .from('user_follows')
      .delete()
      .eq('follower_id', req.user.id)
      .eq('following_id', following_id)

    if (error) {
      console.error('Error unfollowing user:', error)
      return res.status(500).json({ error: 'Failed to unfollow user' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error unfollowing user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get personalized dashboard data
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    // Get user preferences
    const { data: preferences } = await supaAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', req.user.id)
      .single()

    // Get recent recommendations
    const { data: recommendations } = await supaAdmin
      .rpc('get_user_recommendations', {
        user_id_param: req.user.id,
        limit_param: 10,
        recommendation_type_param: 'deal'
      })

    // Get user interests
    const { data: interests } = await supaAdmin
      .from('user_interests')
      .select('*')
      .eq('user_id', req.user.id)
      .order('interest_weight', { ascending: false })
      .limit(10)

    // Get recent activity
    const { data: recentActivity } = await supaAdmin
      .from('user_activities')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get saved searches
    const { data: savedSearches } = await supaAdmin
      .from('user_saved_searches')
      .select('*')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false })
      .limit(5)

    res.json({
      preferences: preferences || {},
      recommendations: recommendations || [],
      interests: interests || [],
      recentActivity: recentActivity || [],
      savedSearches: savedSearches || []
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
