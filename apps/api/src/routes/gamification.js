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

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  try {
    const token = bearer(req)
    if (!token) return res.status(401).json({ error: 'Authentication required' })

    const supaUser = makeUserClientFromToken(token)
    const { data: { user } } = await supaUser.auth.getUser()
    
    if (!user) return res.status(401).json({ error: 'Invalid token' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Admin auth error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

// Get user's XP and level information
router.get('/api/users/:handle/xp', async (req, res) => {
  try {
    const { handle } = req.params

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id, handle, total_xp, current_level, xp_to_next_level,
        streak_days, longest_streak, badges_earned
      `)
      .eq('handle', handle)
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!profile) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Calculate level information
    const { data: levelInfo, error: levelError } = await supabase
      .rpc('calculate_level_from_xp', { total_xp: profile.total_xp })

    if (levelError) {
      return res.status(400).json({ error: levelError.message })
    }

    res.json({
      ...profile,
      level_info: levelInfo?.[0] || {
        level: 1,
        xp_for_current_level: 0,
        xp_for_next_level: 100,
        progress_to_next: 0
      }
    })
  } catch (error) {
    console.error('Error fetching user XP:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's XP events history
router.get('/api/users/:handle/xp-events', requireAuth, async (req, res) => {
  try {
    const { handle } = req.params
    const { limit = 50, offset = 0, event_type } = req.query

    // Get user ID from handle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Only allow users to see their own XP events
    if (profile.id !== req.user.id) {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .single()

      if (adminProfile?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    let query = supabase
      .from('xp_events')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (event_type) {
      query = query.eq('event_type', event_type)
    }

    const { data: events, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(events || [])
  } catch (error) {
    console.error('Error fetching XP events:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all achievements
router.get('/api/achievements', async (req, res) => {
  try {
    const { category, rarity, hidden = false } = req.query

    let query = supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .order('rarity', { ascending: false })
      .order('xp_reward', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (rarity) {
      query = query.eq('rarity', rarity)
    }

    if (hidden === 'false') {
      query = query.eq('is_hidden', false)
    }

    const { data: achievements, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(achievements || [])
  } catch (error) {
    console.error('Error fetching achievements:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's achievements
router.get('/api/users/:handle/achievements', async (req, res) => {
  try {
    const { handle } = req.params
    const { completed_only = false } = req.query

    // Get user ID from handle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User not found' })
    }

    let query = supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', profile.id)
      .order('completed_at', { ascending: false, nullsFirst: false })

    if (completed_only === 'true') {
      query = query.not('completed_at', 'is', null)
    }

    const { data: userAchievements, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(userAchievements || [])
  } catch (error) {
    console.error('Error fetching user achievements:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get enhanced leaderboard
router.get('/api/leaderboard/enhanced', async (req, res) => {
  try {
    const { period = 'all_time', limit = 50 } = req.query

    const { data: leaderboard, error } = await supabase
      .rpc('get_enhanced_leaderboard', {
        period_type_param: period,
        limit_count: parseInt(limit)
      })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(leaderboard || [])
  } catch (error) {
    console.error('Error fetching enhanced leaderboard:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Award XP manually (admin only)
router.post('/api/admin/award-xp', requireAdmin, async (req, res) => {
  try {
    const {
      user_handle,
      event_type,
      target_type,
      target_id,
      multiplier = 1.0,
      description
    } = req.body

    if (!user_handle || !event_type) {
      return res.status(400).json({ error: 'User handle and event type are required' })
    }

    // Get user ID from handle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', user_handle)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { data: xpAwarded, error } = await supabase
      .rpc('award_xp', {
        user_id_param: profile.id,
        event_type_param: event_type,
        target_type_param: target_type,
        target_id_param: target_id,
        multiplier_param: multiplier,
        description_param: description
      })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({
      success: true,
      xp_awarded: xpAwarded,
      user_handle,
      event_type
    })
  } catch (error) {
    console.error('Error awarding XP:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get XP configuration (admin only)
router.get('/api/admin/xp-config', requireAdmin, async (req, res) => {
  try {
    const { data: config, error } = await supabase
      .from('xp_config')
      .select('*')
      .order('event_type', { ascending: true })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(config || [])
  } catch (error) {
    console.error('Error fetching XP config:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update XP configuration (admin only)
router.put('/api/admin/xp-config/:event_type', requireAdmin, async (req, res) => {
  try {
    const { event_type } = req.params
    const { base_xp, max_daily, description, is_active } = req.body

    const { data: config, error } = await supabase
      .from('xp_config')
      .update({
        base_xp,
        max_daily,
        description,
        is_active
      })
      .eq('event_type', event_type)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!config) {
      return res.status(404).json({ error: 'XP config not found' })
    }

    res.json(config)
  } catch (error) {
    console.error('Error updating XP config:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new achievement (admin only)
router.post('/api/admin/achievements', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      category,
      criteria_type,
      criteria_value,
      criteria_metadata = {},
      xp_reward = 0,
      badge_icon,
      badge_color = '#3B82F6',
      rarity = 'common',
      is_hidden = false
    } = req.body

    if (!name || !slug || !description || !category || !criteria_type) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const { data: achievement, error } = await supabase
      .from('achievements')
      .insert({
        name,
        slug,
        description,
        category,
        criteria_type,
        criteria_value,
        criteria_metadata,
        xp_reward,
        badge_icon,
        badge_color,
        rarity,
        is_hidden
      })
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json(achievement)
  } catch (error) {
    console.error('Error creating achievement:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update achievement (admin only)
router.put('/api/admin/achievements/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data: achievement, error } = await supabase
      .from('achievements')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!achievement) {
      return res.status(404).json({ error: 'Achievement not found' })
    }

    res.json(achievement)
  } catch (error) {
    console.error('Error updating achievement:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Check achievements for user (admin only - for testing)
router.post('/api/admin/check-achievements/:handle', requireAdmin, async (req, res) => {
  try {
    const { handle } = req.params

    // Get user ID from handle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { data: achievementsEarned, error } = await supabase
      .rpc('check_user_achievements', {
        user_id_param: profile.id
      })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({
      success: true,
      user_handle: handle,
      achievements_earned: achievementsEarned
    })
  } catch (error) {
    console.error('Error checking achievements:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get gamification statistics (admin only)
router.get('/api/admin/gamification-stats', requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query

    // Get various statistics
    const [
      { data: totalXpAwarded },
      { data: activeUsers },
      { data: achievementsEarned },
      { data: topLevelUsers }
    ] = await Promise.all([
      supabase
        .from('xp_events')
        .select('final_xp.sum()')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()),
      
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('total_xp', 0),
      
      supabase
        .from('user_achievements')
        .select('id', { count: 'exact', head: true })
        .not('completed_at', 'is', null)
        .gte('completed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()),
      
      supabase
        .from('profiles')
        .select('handle, current_level, total_xp')
        .gt('current_level', 1)
        .order('current_level', { ascending: false })
        .limit(10)
    ])

    // Get XP distribution by event type
    const { data: xpByEventType } = await supabase
      .from('xp_events')
      .select('event_type, final_xp')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    const eventTypeStats = xpByEventType?.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + event.final_xp
      return acc
    }, {}) || {}

    res.json({
      period_days: days,
      total_xp_awarded: totalXpAwarded?.[0]?.sum || 0,
      active_users: activeUsers?.count || 0,
      achievements_earned: achievementsEarned?.count || 0,
      top_level_users: topLevelUsers || [],
      xp_by_event_type: eventTypeStats
    })
  } catch (error) {
    console.error('Error fetching gamification stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
