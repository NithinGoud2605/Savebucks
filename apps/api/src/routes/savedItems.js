import { Router } from 'express'
import { makeAdminClient } from '../lib/supa.js'

const router = Router()
const supaAdmin = makeAdminClient()

// Simple auth middleware for saved items
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  
  try {
    // Decode JWT to get user ID (simple base64 decode for now)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    req.user = { id: payload.sub }
    next()
  } catch (error) {
    console.error('Token decode error:', error)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Get all saved items for a user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { type = 'all' } = req.query // 'deals', 'coupons', or 'all'
    
    // For now, return mock data since the table doesn't exist yet
    const mockSavedItems = {
      deals: [
        {
          id: 1,
          deal_id: 17,
          user_id: req.user.id,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          deal: {
            id: 17,
            title: "Samsung Galaxy S24 Ultra - 256GB",
            price: 999.99,
            original_price: 1199.99,
            discount_percentage: 17,
            image_url: "https://images.samsung.com/is/image/samsung/p6pim/us/galaxy-s24-ultra/gallery/us-galaxy-s24-ultra-s928-sm-s928uzkaxaa-thumb-539573421",
            merchant: "Samsung",
            url: "https://samsung.com/galaxy-s24-ultra",
            status: "approved",
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        },
        {
          id: 2,
          deal_id: 23,
          user_id: req.user.id,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          deal: {
            id: 23,
            title: "Sony WH-1000XM5 Wireless Headphones",
            price: 299.99,
            original_price: 399.99,
            discount_percentage: 25,
            image_url: "https://sony.scene7.com/is/image/sonyglobalsolutions/wh-1000xm5_Primary_image",
            merchant: "Sony",
            url: "https://sony.com/wh-1000xm5",
            status: "approved",
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      ],
      coupons: [
        {
          id: 1,
          coupon_id: 5,
          user_id: req.user.id,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          coupon: {
            id: 5,
            title: "20% Off Electronics",
            description: "Get 20% off on all electronics",
            coupon_code: "ELECTRONICS20",
            discount_type: "percentage",
            discount_value: 20,
            merchant: "Best Buy",
            url: "https://bestbuy.com/coupons",
            status: "approved",
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      ]
    }

    let result = []
    if (type === 'all') {
      result = [...mockSavedItems.deals, ...mockSavedItems.coupons]
    } else if (type === 'deals') {
      result = mockSavedItems.deals
    } else if (type === 'coupons') {
      result = mockSavedItems.coupons
    }

    res.json({
      items: result,
      total: result.length,
      deals_count: mockSavedItems.deals.length,
      coupons_count: mockSavedItems.coupons.length
    })
  } catch (error) {
    console.error('Error fetching saved items:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Save a deal
router.post('/deals/:dealId', requireAuth, async (req, res) => {
  try {
    const { dealId } = req.params
    
    // For now, return success since the table doesn't exist yet
    res.status(201).json({
      id: Date.now(),
      deal_id: parseInt(dealId),
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      message: 'Deal saved successfully'
    })
  } catch (error) {
    console.error('Error saving deal:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Save a coupon
router.post('/coupons/:couponId', requireAuth, async (req, res) => {
  try {
    const { couponId } = req.params
    
    // For now, return success since the table doesn't exist yet
    res.status(201).json({
      id: Date.now(),
      coupon_id: parseInt(couponId),
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      message: 'Coupon saved successfully'
    })
  } catch (error) {
    console.error('Error saving coupon:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Unsave a deal
router.delete('/deals/:dealId', requireAuth, async (req, res) => {
  try {
    const { dealId } = req.params
    
    // For now, return success since the table doesn't exist yet
    res.json({
      message: 'Deal removed from saved items'
    })
  } catch (error) {
    console.error('Error unsaving deal:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Unsave a coupon
router.delete('/coupons/:couponId', requireAuth, async (req, res) => {
  try {
    const { couponId } = req.params
    
    // For now, return success since the table doesn't exist yet
    res.json({
      message: 'Coupon removed from saved items'
    })
  } catch (error) {
    console.error('Error unsaving coupon:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Check if items are saved
router.get('/check', requireAuth, async (req, res) => {
  try {
    const { deal_ids, coupon_ids } = req.query
    
    // For now, return mock data
    const savedDeals = deal_ids ? deal_ids.split(',').map(id => parseInt(id)) : []
    const savedCoupons = coupon_ids ? coupon_ids.split(',').map(id => parseInt(id)) : []
    
    res.json({
      saved_deals: savedDeals,
      saved_coupons: savedCoupons
    })
  } catch (error) {
    console.error('Error checking saved items:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
