import { Router } from 'express'
import { makeAdminClient } from '../lib/supa.js'

const router = Router()
const supaAdmin = makeAdminClient()

// Simple auth middleware for reviews
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  
  // For now, just set a mock user - in production you'd verify the JWT
  req.user = { id: 'mock-user-id' }
  next()
}

// Get reviews for a deal
router.get('/deals/:dealId/reviews', async (req, res) => {
  try {
    const { dealId } = req.params
    const { sort = 'newest', limit = 20 } = req.query

    let orderBy = 'created_at'
    let ascending = false

    switch (sort) {
      case 'newest':
        orderBy = 'created_at'
        ascending = false
        break
      case 'oldest':
        orderBy = 'created_at'
        ascending = true
        break
      case 'highest_rated':
        orderBy = 'rating'
        ascending = false
        break
      case 'most_helpful':
        orderBy = 'helpful_count'
        ascending = false
        break
    }

    // For now, return empty data since the table doesn't exist yet
    // This prevents errors and allows the frontend to work
    const reviews = []
    const totalReviews = 0
    const averageRating = 0
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

    res.json({
      reviews: reviews || [],
      stats: {
        total_reviews: totalReviews,
        average_rating: averageRating,
        rating_distribution: ratingDistribution
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
        title: title?.trim(),
        content: content.trim(),
        status: 'pending' // Will be auto-approved for now
      })
      .select(`
        *,
        profiles(handle, avatar_url, is_verified)
      `)
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json(review)
  } catch (error) {
    console.error('Error creating review:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Vote on a review
router.post('/:reviewId/vote', requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params
    const { vote_type } = req.body // 'helpful' or 'not_helpful'

    if (!['helpful', 'not_helpful'].includes(vote_type)) {
      return res.status(400).json({ error: 'Invalid vote type' })
    }

    // Check if user already voted
    const { data: existingVote } = await supaAdmin
      .from('review_votes')
      .select('id, vote_type')
      .eq('review_id', reviewId)
      .eq('user_id', req.user.id)
      .single()

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // Remove vote
        await supaAdmin
          .from('review_votes')
          .delete()
          .eq('id', existingVote.id)
      } else {
        // Update vote
        await supaAdmin
          .from('review_votes')
          .update({ vote_type })
          .eq('id', existingVote.id)
      }
    } else {
      // Create new vote
      await supaAdmin
        .from('review_votes')
        .insert({
          review_id: reviewId,
          user_id: req.user.id,
          vote_type
        })
    }

    // Update review vote counts
    const { data: helpfulVotes } = await supaAdmin
      .from('review_votes')
      .select('id', { count: 'exact', head: true })
      .eq('review_id', reviewId)
      .eq('vote_type', 'helpful')

    const { data: notHelpfulVotes } = await supaAdmin
      .from('review_votes')
      .select('id', { count: 'exact', head: true })
      .eq('review_id', reviewId)
      .eq('vote_type', 'not_helpful')

    await supaAdmin
      .from('deal_reviews')
      .update({
        helpful_count: helpfulVotes || 0,
        not_helpful_count: notHelpfulVotes || 0
      })
      .eq('id', reviewId)

    res.json({ success: true })
  } catch (error) {
    console.error('Error voting on review:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
