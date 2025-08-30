import express from 'express'
import { makeAdminClient } from '../lib/supa.js'
import multer from 'multer'
import path from 'path'

const router = express.Router()
const supabase = makeAdminClient()

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}

// Configure multer for image uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'))
    }
  }
})

// Get leaderboard
router.get('/api/users/leaderboard/:period', async (req, res) => {
  try {
    const { period = 'all_time' } = req.params
    const { limit = 50 } = req.query

    // Validate period
    const validPeriods = ['weekly', 'monthly', 'all_time']
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Use weekly, monthly, or all_time' })
    }

    // Call the database function
    const { data, error } = await supabase
      .rpc('get_leaderboard', {
        period_type: period,
        limit_count: parseInt(limit)
      })

    if (error) {
      console.error('Leaderboard error:', error)
      return res.status(400).json({ error: error.message })
    }

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user profile
router.get('/api/users/:handle', async (req, res) => {
  try {
    const { handle } = req.params

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_achievements (
          achievement_id,
          earned_at,
          points_earned,
          achievements (*)
        ),
        user_follows!user_follows_following_id_fkey (
          follower_id,
          created_at,
          profiles!user_follows_follower_id_fkey (handle, avatar_url)
        )
      `)
      .eq('handle', handle)
      .single()

    if (error || !profile) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get follower and following counts
    const { count: followersCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id)

    const { count: followingCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id)

    // Get user's recent activity
    const { data: activities } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get user's recent deals
    const { data: deals } = await supabase
      .from('deals')
      .select('*')
      .eq('submitter_id', profile.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10)

    res.json({
      ...profile,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      recent_activities: activities || [],
      recent_deals: deals || []
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user profile
router.put('/api/users/:handle', requireAuth, async (req, res) => {
  try {
    const { handle } = req.params
    const { bio, website, location } = req.body
    const userId = req.user.id

    // Verify user owns this profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (!profile || profile.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        bio: bio?.slice(0, 500), // Limit bio length
        website: website?.slice(0, 200),
        location: location?.slice(0, 100)
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload profile image
router.post('/api/users/:handle/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    const { handle } = req.params
    const userId = req.user.id

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Verify user owns this profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (!profile || profile.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Generate unique filename
    const fileExt = path.extname(req.file.originalname)
    const fileName = `${userId}-${Date.now()}${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return res.status(500).json({ error: 'Failed to upload image' })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    // Update user profile with new avatar URL
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Save image record
    await supabase
      .from('images')
      .insert({
        user_id: userId,
        filename: fileName,
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        storage_path: filePath,
        public_url: publicUrl,
        entity_type: 'profile',
        entity_id: userId,
        is_primary: true
      })

    res.json({ avatar_url: publicUrl })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Follow/unfollow user
router.post('/api/users/:handle/follow', requireAuth, async (req, res) => {
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
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', userToFollow.id)
      .single()

    if (existingFollow) {
      // Unfollow
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', userToFollow.id)

      if (error) {
        return res.status(400).json({ error: error.message })
      }

      res.json({ following: false })
    } else {
      // Follow
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: followerId,
          following_id: userToFollow.id
        })

      if (error) {
        return res.status(400).json({ error: error.message })
      }

      res.json({ following: true })
    }
  } catch (error) {
    console.error('Error following user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's followers
router.get('/api/users/:handle/followers', async (req, res) => {
  try {
    const { handle } = req.params
    const { page = 1, limit = 20 } = req.query

    // Get user ID
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const offset = (page - 1) * limit

    const { data: followers, error } = await supabase
      .from('user_follows')
      .select(`
        created_at,
        profiles!user_follows_follower_id_fkey (
          handle,
          avatar_url,
          karma,
          total_posts
        )
      `)
      .eq('following_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(followers || [])
  } catch (error) {
    console.error('Error fetching followers:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user's following
router.get('/api/users/:handle/following', async (req, res) => {
  try {
    const { handle } = req.params
    const { page = 1, limit = 20 } = req.query

    // Get user ID
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const offset = (page - 1) * limit

    const { data: following, error } = await supabase
      .from('user_follows')
      .select(`
        created_at,
        profiles!user_follows_following_id_fkey (
          handle,
          avatar_url,
          karma,
          total_posts
        )
      `)
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(following || [])
  } catch (error) {
    console.error('Error fetching following:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user achievements
router.get('/api/users/:handle/achievements', async (req, res) => {
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

    const { data: achievements, error } = await supabase
      .from('user_achievements')
      .select(`
        earned_at,
        points_earned,
        achievements (*)
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(achievements || [])
  } catch (error) {
    console.error('Error fetching achievements:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user activity feed
router.get('/api/users/:handle/activity', async (req, res) => {
  try {
    const { handle } = req.params
    const { page = 1, limit = 20 } = req.query

    // Get user ID
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .single()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const offset = (page - 1) * limit

    const { data: activities, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(activities || [])
  } catch (error) {
    console.error('Error fetching user activity:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user badges
router.get('/api/users/:handle/badges', async (req, res) => {
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

    const { data: badges, error } = await supabase
      .from('user_badges')
      .select(`
        awarded_at,
        badges!user_badges_badge_id_fkey (*)
      `)
      .eq('user_id', user.id)
      .order('awarded_at', { ascending: false })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json(badges || [])
  } catch (error) {
    console.error('Error fetching user badges:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user stats
router.get('/api/users/:handle/stats', async (req, res) => {
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

    // Get basic stats from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_posts, total_comments, karma, weekly_points, monthly_points, all_time_points')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return res.status(400).json({ error: profileError.message })
    }

    // Get additional stats
    const { count: dealsCount } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('submitter_id', user.id)
      .eq('status', 'approved')

    const { count: votesReceived } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('deal_id', user.id)

    res.json({
      total_posts: profile.total_posts || 0,
      total_comments: profile.total_comments || 0,
      karma: profile.karma || 0,
      weekly_points: profile.weekly_points || 0,
      monthly_points: profile.monthly_points || 0,
      all_time_points: profile.all_time_points || 0,
      deals_posted: dealsCount || 0,
      votes_received: votesReceived || 0
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user reputation
router.get('/api/users/:handle/reputation', async (req, res) => {
  try {
    const { handle } = req.params

    // Get user ID
    const { data: user } = await supabase
      .from('profiles')
      .select('id, karma, role, created_at')
      .eq('handle', handle)
      .single()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Calculate reputation level based on karma
    let level = 'Newcomer'
    let nextLevel = 'Regular'
    let pointsToNext = 50

    if (user.karma >= 1000) {
      level = 'Expert'
      nextLevel = 'Master'
      pointsToNext = 5000 - user.karma
    } else if (user.karma >= 500) {
      level = 'Advanced'
      nextLevel = 'Expert' 
      pointsToNext = 1000 - user.karma
    } else if (user.karma >= 100) {
      level = 'Regular'
      nextLevel = 'Advanced'
      pointsToNext = 500 - user.karma
    } else if (user.karma >= 50) {
      level = 'Active'
      nextLevel = 'Regular'
      pointsToNext = 100 - user.karma
    }

    res.json({
      karma: user.karma || 0,
      level,
      nextLevel,
      pointsToNext: Math.max(0, pointsToNext),
      role: user.role,
      memberSince: user.created_at
    })
  } catch (error) {
    console.error('Error fetching user reputation:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router