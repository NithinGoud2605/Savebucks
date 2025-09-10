import express from 'express'
import { makeAdminClient } from '../lib/supa.js'

const router = express.Router()
const supabase = makeAdminClient()

// Helper function to check authentication
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}

// Get user profile by handle or ID (public endpoint)
router.get('/:identifier/profile', async (req, res) => {
  try {
    const { identifier } = req.params

    // Check if identifier is a UUID (user ID) or handle
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
    
    let query = supabase
      .from('profiles')
      .select(`
        id, handle, avatar_url, karma, role, created_at, updated_at,
        first_name, last_name, display_name, bio, location, website
      `)

    if (isUUID) {
      query = query.eq('id', identifier)
    } else {
      query = query.eq('handle', identifier)
    }

    const { data: profile, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' })
      }
      throw error
    }

    // Increment profile view count
    await supabase
      .from('profiles')
      .update({ 
        profile_views_count: (profile.profile_views_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    // Get user stats
    const [dealsResult, couponsResult] = await Promise.all([
      supabase
        .from('deals')
        .select('id', { count: 'exact' })
        .eq('submitter_id', profile.id)
        .eq('status', 'approved'),
      
      supabase
        .from('coupons')
        .select('id', { count: 'exact' })
        .eq('submitter_id', profile.id)
        .eq('status', 'approved')
    ])

    // Get total views from deals and coupons
    const [dealsViewsResult, couponsViewsResult] = await Promise.all([
      supabase
        .from('deals')
        .select('views_count')
        .eq('submitter_id', profile.id)
        .eq('status', 'approved'),
      
      supabase
        .from('coupons')
        .select('views_count')
        .eq('submitter_id', profile.id)
        .eq('status', 'approved')
    ])

    const totalViews = (dealsViewsResult.data || []).reduce((sum, deal) => sum + (deal.views_count || 0), 0) +
                      (couponsViewsResult.data || []).reduce((sum, coupon) => sum + (coupon.views_count || 0), 0)

    // Get recent activity (last 5 deals and coupons)
    const [recentDeals, recentCoupons] = await Promise.all([
      supabase
        .from('deals')
        .select(`
          id, title, price, discount_percentage, created_at, views_count,
          categories(name, slug), companies(name, slug, logo_url)
        `)
        .eq('submitter_id', profile.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5),
      
      supabase
        .from('coupons')
        .select(`
          id, title, discount_value, coupon_type, created_at, views_count,
          categories(name, slug), companies(name, slug, logo_url)
        `)
        .eq('submitter_id', profile.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    // Get user achievements/badges (placeholder for future implementation)
    const achievements = []

    // Get user's favorite categories (placeholder for future implementation)
    const favoriteCategories = []

    const profileData = {
      ...profile,
      stats: {
        deals_count: dealsResult.count || 0,
        coupons_count: couponsResult.count || 0,
        followers_count: 0, // Will be implemented when user_follows table exists
        following_count: 0, // Will be implemented when user_follows table exists
        total_views: totalViews,
        profile_views: (profile.profile_views_count || 0) + 1
      },
      recent_activity: {
        deals: recentDeals.data || [],
        coupons: recentCoupons.data || []
      },
      achievements: [], // Will be implemented when achievements system exists
      favorite_categories: [] // Will be implemented when category preferences exist
    }

    res.json(profileData)
  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's deals with pagination
router.get('/:identifier/deals', async (req, res) => {
  try {
    const { identifier } = req.params
    const { page = 1, limit = 20, sort = 'newest' } = req.query
    const offset = (page - 1) * limit

    // Check if identifier is a UUID (user ID) or handle
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
    
    let userQuery = supabase
      .from('profiles')
      .select('id')

    if (isUUID) {
      userQuery = userQuery.eq('id', identifier)
    } else {
      userQuery = userQuery.eq('handle', identifier)
    }

    const { data: user } = await userQuery.single()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Build query
    let query = supabase
      .from('deals')
      .select(`
        id, title, url, price, merchant, created_at, approved_at, status,
        description, image_url, deal_images, featured_image, coupon_code, coupon_type, 
        discount_percentage, discount_amount, original_price, expires_at, category_id, 
        deal_type, is_featured, views_count, clicks_count, submitter_id,
        categories(name, slug, color),
        companies(name, slug, logo_url, is_verified),
        profiles!submitter_id(id, handle, avatar_url, karma, role),
        deal_tags(tags(id, name, slug, color, category))
      `)
      .eq('submitter_id', user.id)
      .eq('status', 'approved')

    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'popular':
        query = query.order('views_count', { ascending: false })
        break
      case 'trending':
        query = query.order('score', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data: deals, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit)

    if (error) throw error

    res.json({
      deals: deals || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Get user deals error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's coupons with pagination
router.get('/:identifier/coupons', async (req, res) => {
  try {
    const { identifier } = req.params
    const { page = 1, limit = 20, sort = 'newest' } = req.query
    const offset = (page - 1) * limit

    // Check if identifier is a UUID (user ID) or handle
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
    
    let userQuery = supabase
      .from('profiles')
      .select('id')

    if (isUUID) {
      userQuery = userQuery.eq('id', identifier)
    } else {
      userQuery = userQuery.eq('handle', identifier)
    }

    const { data: user } = await userQuery.single()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Build query
    let query = supabase
      .from('coupons')
      .select(`
        id, title, description, coupon_code, coupon_type, discount_value,
        minimum_order_amount, maximum_discount_amount, company_id, category_id,
        submitter_id, terms_conditions, starts_at, expires_at, 
        is_featured, is_exclusive, views_count, clicks_count, success_rate, 
        created_at, updated_at, status
      `)
      .eq('submitter_id', user.id)
      .eq('status', 'approved')

    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'popular':
        query = query.order('views_count', { ascending: false })
        break
      case 'trending':
        query = query.order('score', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data: coupons, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit)

    if (error) throw error

    res.json({
      coupons: coupons || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Get user coupons error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's activity feed
router.get('/:handle/activity', async (req, res) => {
  try {
    const { handle } = req.params
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    // First get the user ID from handle
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get user's activity (deals, coupons, votes, comments, etc.)
    const [dealsActivity, couponsActivity, votesActivity, commentsActivity] = await Promise.all([
      // Recent deals
      supabase
        .from('deals')
        .select(`
          id, title, price, discount_percentage, created_at, status,
          categories(name, slug), companies(name, slug)
        `)
        .eq('submitter_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Recent coupons
      supabase
        .from('coupons')
        .select(`
          id, title, discount_value, coupon_type, created_at, status,
          categories(name, slug), companies(name, slug)
        `)
        .eq('submitter_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Recent votes
      supabase
        .from('deal_votes')
        .select(`
          id, vote_type, created_at,
          deals(id, title, categories(name, slug))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Recent comments (if comments table exists)
      supabase
        .from('deal_comments')
        .select(`
          id, content, created_at,
          deals(id, title, categories(name, slug))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    // Combine and sort all activities
    const activities = []
    
    // Add deals
    (dealsActivity.data || []).forEach(deal => {
      activities.push({
        type: 'deal_created',
        data: deal,
        created_at: deal.created_at
      })
    })
    
    // Add coupons
    (couponsActivity.data || []).forEach(coupon => {
      activities.push({
        type: 'coupon_created',
        data: coupon,
        created_at: coupon.created_at
      })
    })
    
    // Add votes
    (votesActivity.data || []).forEach(vote => {
      activities.push({
        type: 'vote_cast',
        data: vote,
        created_at: vote.created_at
      })
    })
    
    // Add comments
    (commentsActivity.data || []).forEach(comment => {
      activities.push({
        type: 'comment_posted',
        data: comment,
        created_at: comment.created_at
      })
    })

    // Sort by date and paginate
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const paginatedActivities = activities.slice(offset, offset + limit)

    res.json({
      activities: paginatedActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activities.length,
        pages: Math.ceil(activities.length / limit)
      }
    })
  } catch (error) {
    console.error('Get user activity error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's followers
router.get('/:handle/followers', async (req, res) => {
  try {
    const { handle } = req.params
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    // First get the user ID from handle
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get followers
    const { data: followers, error, count } = await supabase
      .from('user_follows')
      .select(`
        id, created_at,
        profiles!follower_id(
          id, handle, avatar_url, karma, role, bio, location,
          created_at, last_active_at
        )
      `)
      .eq('following_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json({
      followers: followers || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Get user followers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's following
router.get('/:handle/following', async (req, res) => {
  try {
    const { handle } = req.params
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    // First get the user ID from handle
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get following
    const { data: following, error, count } = await supabase
      .from('user_follows')
      .select(`
        id, created_at,
        profiles!following_id(
          id, handle, avatar_url, karma, role, bio, location,
          created_at, last_active_at
        )
      `)
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json({
      following: following || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Get user following error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user profile (authenticated user only)
router.put('/:handle/profile', requireAuth, async (req, res) => {
  try {
    const { handle } = req.params
    const userId = req.user.id
    const {
      bio, location, website, social_links, preferences,
      first_name, last_name, display_name, phone, date_of_birth,
      timezone, language, is_public, allow_messages, allow_following
    } = req.body

    // Verify user can update this profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, handle')
      .eq('handle', handle)
      .single()

    if (!profile) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (profile.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this profile' })
    }

    // Update profile
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        bio,
        location,
        website,
        social_links,
        preferences,
        first_name,
        last_name,
        display_name,
        phone,
        date_of_birth,
        timezone,
        language,
        is_public,
        allow_messages,
        allow_following,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    res.json(updatedProfile)
  } catch (error) {
    console.error('Update user profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload/update profile picture
router.post('/:handle/avatar', requireAuth, async (req, res) => {
  try {
    const { handle } = req.params
    const userId = req.user.id
    const { avatar_url } = req.body

    // Verify user can update this profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (!profile || profile.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Update avatar
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('avatar_url')
      .single()

    if (error) throw error

    res.json({ avatar_url: updatedProfile.avatar_url })
  } catch (error) {
    console.error('Update avatar error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Follow/Unfollow user
router.post('/:handle/follow', requireAuth, async (req, res) => {
  try {
    const { handle } = req.params
    const followerId = req.user.id

    // Get the user to follow
    const { data: userToFollow } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (userToFollow.id === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' })
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', userToFollow.id)
      .single()

    if (existingFollow) {
      // Unfollow
      await supabase
        .from('user_follows')
        .delete()
        .eq('id', existingFollow.id)

      res.json({ following: false })
    } else {
      // Follow
      await supabase
        .from('user_follows')
        .insert({
          follower_id: followerId,
          following_id: userToFollow.id
        })

      res.json({ following: true })
    }
  } catch (error) {
    console.error('Follow/unfollow error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Check if current user follows another user
router.get('/:identifier/follow-status', requireAuth, async (req, res) => {
  try {
    const { identifier } = req.params
    const userId = req.user.id

    // Check if identifier is a UUID (user ID) or handle
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
    
    let userQuery = supabase
      .from('profiles')
      .select('id')

    if (isUUID) {
      userQuery = userQuery.eq('id', identifier)
    } else {
      userQuery = userQuery.eq('handle', identifier)
    }

    const { data: userToCheck } = await userQuery.single()

    if (!userToCheck) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check follow status
    const { data: followStatus } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', userId)
      .eq('following_id', userToCheck.id)
      .single()

    res.json({ following: !!followStatus })
  } catch (error) {
    console.error('Check follow status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's saved items
router.get('/:handle/saved', requireAuth, async (req, res) => {
  try {
    const { handle } = req.params
    const userId = req.user.id
    const { page = 1, limit = 20, type = 'all' } = req.query
    const offset = (page - 1) * limit

    // Verify user can access this data
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (!profile || profile.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    let query = supabase
      .from('saved_items')
      .select(`
        id, item_type, created_at,
        deals(id, title, price, discount_percentage, image_url, created_at, categories(name, slug), companies(name, slug)),
        coupons(id, title, discount_value, coupon_type, image_url, created_at, categories(name, slug), companies(name, slug))
      `)
      .eq('user_id', userId)

    if (type !== 'all') {
      query = query.eq('item_type', type)
    }

    const { data: savedItems, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json({
      saved_items: savedItems || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Get saved items error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's achievements
router.get('/:handle/achievements', async (req, res) => {
  try {
    const { handle } = req.params

    // Get user ID
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get user achievements
    const { data: achievements, error } = await supabase
      .from('user_achievements')
      .select(`
        id, achievement_type, earned_at, progress, level,
        achievements(id, name, description, icon, color, category, requirements)
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })

    if (error) throw error

    res.json(achievements || [])
  } catch (error) {
    console.error('Get user achievements error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's leaderboard position
router.get('/:handle/leaderboard', async (req, res) => {
  try {
    const { handle } = req.params

    // Get user ID
    const { data: user } = await supabase
      .from('profiles')
      .select('id, karma')
      .eq('handle', handle)
      .single()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get user's rank
    const { data: rankData } = await supabase
      .from('profiles')
      .select('id')
      .gte('karma', user.karma)
      .order('karma', { ascending: false })

    const rank = rankData ? rankData.findIndex(p => p.id === user.id) + 1 : 0

    // Get top users for context
    const { data: topUsers } = await supabase
      .from('profiles')
      .select('id, handle, avatar_url, karma')
      .order('karma', { ascending: false })
      .limit(10)

    res.json({
      rank,
      karma: user.karma,
      top_users: topUsers || []
    })
  } catch (error) {
    console.error('Get leaderboard position error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Session heartbeat endpoint
router.post('/session/heartbeat', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    
    // Update user's last active timestamp
    await supabase
      .from('profiles')
      .update({ 
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    res.json({ success: true, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Session heartbeat error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router