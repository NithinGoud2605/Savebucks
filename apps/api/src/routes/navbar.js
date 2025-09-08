import express from 'express'
import { makeAdminClient } from '../lib/supa.js'

const router = express.Router()

// Get navbar stats (users online, deals today, coupons today)
router.get('/stats', async (req, res) => {
  try {
    const supabase = makeAdminClient()
    
    // Get today's date range (start and end of today in UTC)
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

    // Get users online (active in last 15 minutes) - use user_sessions table
    let usersOnline = 0
    try {
      const { data: onlineUsers, error: onlineError } = await supabase
        .from('user_sessions')
        .select('user_id')
        .gte('last_seen', new Date(Date.now() - 15 * 60 * 1000).toISOString())
      
      if (!onlineError && onlineUsers) {
        usersOnline = onlineUsers.length
      }
    } catch (error) {
      console.log('User sessions query failed, using fallback:', error.message)
      // Fallback: count active profiles
      const { data: activeProfiles } = await supabase
        .from('profiles')
        .select('id')
        .gte('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      
      usersOnline = activeProfiles?.length || 0
    }

    // Get deals added today
    let dealsToday = 0
    try {
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('id')
        .eq('status', 'approved')
        .gte('created_at', startOfToday.toISOString())
        .lt('created_at', endOfToday.toISOString())
      
      if (!dealsError && dealsData) {
        dealsToday = dealsData.length
      }
    } catch (error) {
      console.log('Deals query failed:', error.message)
    }

    // Get coupons added today
    let couponsToday = 0
    try {
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        .select('id')
        .eq('status', 'approved')
        .gte('created_at', startOfToday.toISOString())
        .lt('created_at', endOfToday.toISOString())
      
      if (!couponsError && couponsData) {
        couponsToday = couponsData.length
      }
    } catch (error) {
      console.log('Coupons query failed:', error.message)
    }

    // Add base numbers to make the platform feel more active
    // This helps new users feel like they're joining an active community
    const baseUsers = 50
    const baseDeals = 10
    const baseCoupons = 10
    
    // Store real counts for logging
    const realUsers = usersOnline
    const realDeals = dealsToday
    const realCoupons = couponsToday
    
    usersOnline = baseUsers + usersOnline
    dealsToday = baseDeals + dealsToday
    couponsToday = baseCoupons + couponsToday

    const stats = {
      usersOnline,
      dealsToday,
      couponsToday
    }

    console.log('Navbar stats:', {
      ...stats,
      breakdown: {
        realUsers,
        realDeals,
        realCoupons,
        baseUsers,
        baseDeals,
        baseCoupons
      }
    })
    res.json({ stats })
  } catch (error) {
    console.error('Navbar stats error:', error)
    // Return base values on complete failure to maintain platform feel
    res.json({ 
      stats: {
        usersOnline: 50,
        dealsToday: 10,
        couponsToday: 10
      }
    })
  }
})

// Get trending categories with counts
router.get('/trending-categories', async (req, res) => {
  try {
    const supabase = makeAdminClient()
    
    const { data, error } = await supabase
      .rpc('get_trending_categories_with_counts')
    
    if (error) throw error

    res.json(data || [])
  } catch (error) {
    console.error('Trending categories error:', error)
    res.status(500).json({ error: 'Failed to fetch trending categories' })
  }
})

export default router
