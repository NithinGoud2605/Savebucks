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

// Get reviews for a deal
router.get('/deals/:dealId/reviews', async (req, res) => {
  try {
    const { dealId } = req.params
    const { sort = 'newest', limit = 20, page = 1, filter = 'all' } = req.query
    const offset = (page - 1) * limit

    console.log(`Fetching reviews for deal ${dealId} with params:`, { sort, limit, page, filter })

    // Build query
    let query = supaAdmin
      .from('deal_reviews')
      .select(`
        id,
        title,
        content,
        rating,
        is_verified_purchase,
        is_featured,
        is_helpful_count,
        is_not_helpful_count,
        views_count,
        created_at,
        updated_at,
        profiles!deal_reviews_user_id_fkey(
          id,
          handle,
          avatar_url
        )
      `)
      .eq('deal_id', dealId)

    // Apply filters
    if (filter === 'verified') {
      query = query.eq('is_verified_purchase', true)
    } else if (filter === 'featured') {
      query = query.eq('is_featured', true)
    }

    // Apply sorting
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'highest_rated':
        query = query.order('rating', { ascending: false })
        break
      case 'lowest_rated':
        query = query.order('rating', { ascending: true })
        break
      case 'most_helpful':
        query = query.order('is_helpful_count', { ascending: false })
        break
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: reviews, error: reviewsError, count } = await query

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
      return res.json({ reviews: [], stats: { average_rating: 0, total_reviews: 0, rating_distribution: {} } })
    }

    // Get review statistics directly from database
    let stats = null
    try {
      const { data: statsData, error: statsError } = await supaAdmin
        .from('deal_reviews')
        .select('rating, is_verified_purchase, is_featured, is_helpful_count, is_not_helpful_count')
        .eq('deal_id', parseInt(dealId))

      if (statsError) {
        console.error('Error fetching review stats:', statsError)
      } else if (statsData) {
        // Calculate stats manually
        const totalReviews = statsData.length
        const averageRating = totalReviews > 0 ? statsData.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0
        const ratingDistribution = {
          '5_star': statsData.filter(r => r.rating === 5).length,
          '4_star': statsData.filter(r => r.rating === 4).length,
          '3_star': statsData.filter(r => r.rating === 3).length,
          '2_star': statsData.filter(r => r.rating === 2).length,
          '1_star': statsData.filter(r => r.rating === 1).length
        }
        const verifiedPurchases = statsData.filter(r => r.is_verified_purchase).length
        const featuredReviews = statsData.filter(r => r.is_featured).length
        const totalHelpfulVotes = statsData.reduce((sum, r) => sum + (r.is_helpful_count || 0), 0)
        const totalNotHelpfulVotes = statsData.reduce((sum, r) => sum + (r.is_not_helpful_count || 0), 0)

        stats = {
          total_reviews: totalReviews,
          average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          rating_distribution: ratingDistribution,
          verified_purchases: verifiedPurchases,
          featured_reviews: featuredReviews,
          total_helpful_votes: totalHelpfulVotes,
          total_not_helpful_votes: totalNotHelpfulVotes
        }
      }
    } catch (error) {
      console.error('Error calculating review stats:', error)
    }

    // Transform reviews data
    const transformedReviews = (reviews || []).map(review => ({
      id: review.id,
      title: review.title,
      content: review.content,
      rating: review.rating,
      isVerifiedPurchase: review.is_verified_purchase,
      isFeatured: review.is_featured,
      helpfulCount: review.is_helpful_count,
      notHelpfulCount: review.is_not_helpful_count,
      viewsCount: review.views_count,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      user: {
        id: review.profiles?.id,
        username: review.profiles?.handle,
        displayName: review.profiles?.handle,
        avatar: review.profiles?.avatar_url
      }
    }))

    res.json({
      reviews: transformedReviews,
      stats: stats || {
        total_reviews: 0,
        average_rating: 0,
        rating_distribution: { '5_star': 0, '4_star': 0, '3_star': 0, '2_star': 0, '1_star': 0 },
        verified_purchases: 0,
        featured_reviews: 0,
        total_helpful_votes: 0,
        total_not_helpful_votes: 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Submit a review
router.post('/', requireAuth, async (req, res) => {
  try {
    const { deal_id, rating, title, content } = req.body

    console.log(`Submitting review for deal ${deal_id} by user ${req.user.id}:`, { rating, title, content })

    if (!deal_id || !rating || !content) {
      return res.status(400).json({ error: 'Deal ID, rating, and content are required' })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    // Check if user already reviewed this deal
    const { data: existingReview } = await supaAdmin
      .from('deal_reviews')
      .select('id')
      .eq('deal_id', deal_id)
      .eq('user_id', req.user.id)
      .single()

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this deal' })
    }

    // Create review
    const { data: review, error } = await supaAdmin
      .from('deal_reviews')
      .insert({
        deal_id,
        user_id: req.user.id,
        rating,
        title: title?.trim() || `Review for deal ${deal_id}`,
        content: content.trim(),
        is_verified_purchase: false,
        is_featured: false,
        is_helpful_count: 0,
        is_not_helpful_count: 0,
        views_count: 0
      })
      .select(`
        id,
        title,
        content,
        rating,
        is_verified_purchase,
        is_featured,
        is_helpful_count,
        is_not_helpful_count,
        views_count,
        created_at,
        profiles!deal_reviews_user_id_fkey(
          id,
          handle,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating review:', error)
      return res.status(400).json({ error: error.message })
    }

    // Transform review data
    const transformedReview = {
      id: review.id,
      title: review.title,
      content: review.content,
      rating: review.rating,
      isVerifiedPurchase: review.is_verified_purchase,
      isFeatured: review.is_featured,
      helpfulCount: review.is_helpful_count,
      notHelpfulCount: review.is_not_helpful_count,
      viewsCount: review.views_count,
      createdAt: review.created_at,
      user: {
        id: review.profiles?.id,
        username: review.profiles?.handle,
        displayName: review.profiles?.handle,
        avatar: review.profiles?.avatar_url
      }
    }

    res.status(201).json({
      success: true,
      review: transformedReview
    })
  } catch (error) {
    console.error('Error creating review:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Vote on a review

// Get user's vote on a review
router.get('/:reviewId/vote', requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params

    const { data: voteType, error } = await supaAdmin
      .rpc('get_user_review_vote', {
        review_id_param: parseInt(reviewId),
        user_id_param: req.user.id
      })

    if (error) {
      console.error('Error getting user vote:', error)
      return res.status(500).json({ error: 'Failed to get user vote' })
    }

    res.json({
      voteType: voteType || 'none'
    })
  } catch (error) {
    console.error('Error getting user vote:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Report a review
router.post('/:reviewId/report', requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params
    const { reason, description } = req.body

    if (!reason || !['spam', 'inappropriate', 'fake', 'off_topic', 'harassment', 'other'].includes(reason)) {
      return res.status(400).json({ error: 'Invalid report reason' })
    }

    const { data: result, error } = await supaAdmin
      .rpc('report_review', {
        review_id_param: parseInt(reviewId),
        reporter_id_param: req.user.id,
        reason_param: reason,
        description_param: description
      })

    if (error) {
      console.error('Error reporting review:', error)
      return res.status(500).json({ error: 'Failed to report review' })
    }

    res.json(result)
  } catch (error) {
    console.error('Error reporting review:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Vote on review (helpful/not helpful)
router.post('/:reviewId/vote', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { reviewId } = req.params
    const { isHelpful } = req.body

    if (typeof isHelpful !== 'boolean') {
      return res.status(400).json({ error: `isHelpful must be a boolean, got ${typeof isHelpful}: ${isHelpful}` })
    }

    // Try to check if user already voted on this review
    let existingVote = null
    try {
      const { data } = await supaAdmin
        .from('review_votes')
        .select('id')
        .eq('review_id', parseInt(reviewId))
        .eq('user_id', req.user.id)
        .single()
      existingVote = data
    } catch (error) {
      // Table might not exist or have different schema, continue
      console.log('Could not check existing vote (table might not exist):', error.message)
    }

    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted on this review' })
    }

    // Try to insert the vote with the new schema (is_helpful BOOLEAN)
    let vote = null
    let voteError = null
    
    try {
      const { data, error } = await supaAdmin
        .from('review_votes')
        .insert({
          review_id: parseInt(reviewId),
          user_id: req.user.id,
          is_helpful: isHelpful,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      vote = data
      voteError = error
    } catch (error) {
      voteError = error
    }

    // If the new schema fails, try the old schema (vote_type TEXT)
    if (voteError && voteError.message.includes('column "is_helpful" does not exist')) {
      console.log('Trying old schema with vote_type...')
      try {
        const voteType = isHelpful ? 'helpful' : 'not_helpful'
        const { data, error } = await supaAdmin
          .from('review_votes')
          .insert({
            review_id: parseInt(reviewId),
            user_id: req.user.id,
            vote_type: voteType,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        vote = data
        voteError = error
      } catch (error) {
        voteError = error
      }
    }

    if (voteError) {
      console.error('Error inserting vote:', voteError)
      return res.status(500).json({ error: 'Failed to vote on review: ' + voteError.message })
    }

    // Update the review vote counts
    const updateField = isHelpful ? 'is_helpful_count' : 'is_not_helpful_count'
    
    try {
      // Get current count and increment it
      const { data: currentReview } = await supaAdmin
        .from('deal_reviews')
        .select(updateField)
        .eq('id', parseInt(reviewId))
        .single()
      
      if (currentReview) {
        const newCount = (currentReview[updateField] || 0) + 1
        const { error: updateError } = await supaAdmin
          .from('deal_reviews')
          .update({ [updateField]: newCount })
          .eq('id', parseInt(reviewId))
        
        if (updateError) {
          console.error('Error updating review counts:', updateError)
          // Don't fail the request, just log the error
        }
      }
    } catch (error) {
      console.error('Error updating vote counts:', error)
      // Don't fail the request, just log the error
    }

    res.json({ success: true, vote })
  } catch (error) {
    console.error('Error voting on review:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Increment review views
router.post('/:reviewId/view', async (req, res) => {
  try {
    const { reviewId } = req.params

    const { error } = await supaAdmin
      .rpc('increment_review_views', {
        review_id_param: parseInt(reviewId)
      })

    if (error) {
      console.error('Error incrementing review views:', error)
      return res.status(500).json({ error: 'Failed to increment views' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error incrementing review views:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
