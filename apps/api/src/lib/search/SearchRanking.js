/**
 * Advanced Search Ranking Algorithm
 * Implements sophisticated result ranking and relevance scoring
 */

class SearchRanking {
  constructor() {
    this.config = {
      // Base scoring weights
      textRelevance: 0.4,
      popularity: 0.3,
      recency: 0.2,
      userEngagement: 0.1,
      
      // Boost factors
      exactMatchBoost: 2.0,
      titleMatchBoost: 1.5,
      featuredBoost: 1.3,
      verifiedBoost: 1.2,
      freshContentBoost: 1.1,
      
      // Penalty factors
      oldContentPenalty: 0.8,
      lowEngagementPenalty: 0.9,
      
      // Time decay factors
      timeDecayFactor: 0.1,
      maxAgeMonths: 12
    }
  }

  /**
   * Rank search results based on relevance and other factors
   */
  async rankResults(searchResults, params) {
    const { query, sort } = params

    // If user specified a sort order other than relevance, apply that first
    if (sort && sort !== 'relevance') {
      return this.applySortOrder(searchResults, sort)
    }

    // Apply relevance-based ranking
    const rankedResults = {
      ...searchResults,
      deals: this.rankDeals(searchResults.deals || [], query),
      coupons: this.rankCoupons(searchResults.coupons || [], query),
      users: this.rankUsers(searchResults.users || [], query),
      companies: this.rankCompanies(searchResults.companies || [], query),
      categories: this.rankCategories(searchResults.categories || [], query)
    }

    return rankedResults
  }

  /**
   * Rank deals by relevance
   */
  rankDeals(deals, query) {
    if (!deals || deals.length === 0) return deals

    const scoredDeals = deals.map(deal => {
      const score = this.calculateDealScore(deal, query)
      return { ...deal, _relevanceScore: score }
    })

    // Sort by relevance score (descending)
    scoredDeals.sort((a, b) => b._relevanceScore - a._relevanceScore)

    // Remove the scoring metadata
    return scoredDeals.map(deal => {
      const { _relevanceScore, ...cleanDeal } = deal
      return cleanDeal
    })
  }

  /**
   * Calculate relevance score for a deal
   */
  calculateDealScore(deal, query) {
    let score = 0

    // Text relevance score
    const textScore = this.calculateTextRelevance(deal, query, ['title', 'description', 'merchant'])
    score += textScore * this.config.textRelevance

    // Popularity score (views, clicks)
    const popularityScore = this.calculatePopularityScore({
      views: deal.views_count || 0,
      clicks: deal.clicks_count || 0,
      maxViews: 10000, // Assumed max for normalization
      maxClicks: 1000
    })
    score += popularityScore * this.config.popularity

    // Recency score
    const recencyScore = this.calculateRecencyScore(deal.created_at)
    score += recencyScore * this.config.recency

    // User engagement score
    const engagementScore = this.calculateEngagementScore({
      views: deal.views_count || 0,
      clicks: deal.clicks_count || 0
    })
    score += engagementScore * this.config.userEngagement

    // Apply boost factors
    if (this.hasExactMatch(deal, query, ['title', 'merchant'])) {
      score *= this.config.exactMatchBoost
    }

    if (this.hasTitleMatch(deal, query)) {
      score *= this.config.titleMatchBoost
    }

    if (deal.is_featured) {
      score *= this.config.featuredBoost
    }

    if (deal.companies?.is_verified) {
      score *= this.config.verifiedBoost
    }

    // Apply penalties
    if (this.isOldContent(deal.created_at)) {
      score *= this.config.oldContentPenalty
    }

    if (this.hasLowEngagement(deal)) {
      score *= this.config.lowEngagementPenalty
    }

    return Math.max(0, score)
  }

  /**
   * Rank coupons by relevance
   */
  rankCoupons(coupons, query) {
    if (!coupons || coupons.length === 0) return coupons

    const scoredCoupons = coupons.map(coupon => {
      const score = this.calculateCouponScore(coupon, query)
      return { ...coupon, _relevanceScore: score }
    })

    scoredCoupons.sort((a, b) => b._relevanceScore - a._relevanceScore)

    return scoredCoupons.map(coupon => {
      const { _relevanceScore, ...cleanCoupon } = coupon
      return cleanCoupon
    })
  }

  /**
   * Calculate relevance score for a coupon
   */
  calculateCouponScore(coupon, query) {
    let score = 0

    // Text relevance score
    const textScore = this.calculateTextRelevance(coupon, query, ['title', 'description', 'coupon_code'])
    score += textScore * this.config.textRelevance

    // Popularity score
    const popularityScore = this.calculatePopularityScore({
      views: coupon.views_count || 0,
      clicks: coupon.clicks_count || 0,
      maxViews: 5000,
      maxClicks: 500
    })
    score += popularityScore * this.config.popularity

    // Recency score
    const recencyScore = this.calculateRecencyScore(coupon.created_at)
    score += recencyScore * this.config.recency

    // Success rate as engagement metric
    const engagementScore = (coupon.success_rate || 0) / 100
    score += engagementScore * this.config.userEngagement

    // Apply boost factors
    if (this.hasExactMatch(coupon, query, ['title', 'coupon_code'])) {
      score *= this.config.exactMatchBoost
    }

    if (coupon.is_featured) {
      score *= this.config.featuredBoost
    }

    if (coupon.is_exclusive) {
      score *= 1.1 // Small boost for exclusive coupons
    }

    if (coupon.companies?.is_verified) {
      score *= this.config.verifiedBoost
    }

    // Expiration penalty (coupons expiring soon get slight penalty)
    if (coupon.expires_at && this.isExpiringSoon(coupon.expires_at)) {
      score *= 0.95
    }

    return Math.max(0, score)
  }

  /**
   * Rank users by relevance
   */
  rankUsers(users, query) {
    if (!users || users.length === 0) return users

    const scoredUsers = users.map(user => {
      const score = this.calculateUserScore(user, query)
      return { ...user, _relevanceScore: score }
    })

    scoredUsers.sort((a, b) => b._relevanceScore - a._relevanceScore)

    return scoredUsers.map(user => {
      const { _relevanceScore, ...cleanUser } = user
      return cleanUser
    })
  }

  /**
   * Calculate relevance score for a user
   */
  calculateUserScore(user, query) {
    let score = 0

    // Text relevance score (name matching is crucial for users)
    const textScore = this.calculateTextRelevance(user, query, [
      'handle', 'display_name', 'first_name', 'last_name', 'bio'
    ])
    score += textScore * 0.6 // Higher weight for text relevance in user search

    // Karma as popularity metric
    const karmaScore = Math.min(1, (user.karma || 0) / 1000) // Normalize karma
    score += karmaScore * 0.3

    // Activity score (based on contributions)
    const activityScore = this.calculateUserActivityScore(user)
    score += activityScore * 0.1

    // Apply boost factors
    if (this.hasExactMatch(user, query, ['handle', 'display_name'])) {
      score *= this.config.exactMatchBoost
    }

    // Boost verified or high-karma users
    if (user.role === 'admin' || user.role === 'moderator') {
      score *= 1.3
    }

    if ((user.karma || 0) > 500) {
      score *= 1.1
    }

    return Math.max(0, score)
  }

  /**
   * Calculate user activity score
   */
  calculateUserActivityScore(user) {
    const stats = user.stats || {}
    const totalContributions = (stats.deals_count || 0) + (stats.coupons_count || 0)
    
    // Normalize contribution count
    return Math.min(1, totalContributions / 50)
  }

  /**
   * Rank companies by relevance
   */
  rankCompanies(companies, query) {
    if (!companies || companies.length === 0) return companies

    const scoredCompanies = companies.map(company => {
      const score = this.calculateCompanyScore(company, query)
      return { ...company, _relevanceScore: score }
    })

    scoredCompanies.sort((a, b) => b._relevanceScore - a._relevanceScore)

    return scoredCompanies.map(company => {
      const { _relevanceScore, ...cleanCompany } = company
      return cleanCompany
    })
  }

  /**
   * Calculate relevance score for a company
   */
  calculateCompanyScore(company, query) {
    let score = 0

    // Text relevance score
    const textScore = this.calculateTextRelevance(company, query, ['name'])
    score += textScore * 0.5

    // Company size/activity score
    const stats = company.stats || {}
    const totalOffers = (stats.deals_count || 0) + (stats.coupons_count || 0)
    const activityScore = Math.min(1, totalOffers / 100)
    score += activityScore * 0.3

    // Verification boost
    if (company.is_verified) {
      score *= this.config.verifiedBoost
    }

    // Exact name match boost
    if (this.hasExactMatch(company, query, ['name'])) {
      score *= this.config.exactMatchBoost
    }

    return Math.max(0, score)
  }

  /**
   * Rank categories by relevance
   */
  rankCategories(categories, query) {
    if (!categories || categories.length === 0) return categories

    const scoredCategories = categories.map(category => {
      const score = this.calculateCategoryScore(category, query)
      return { ...category, _relevanceScore: score }
    })

    scoredCategories.sort((a, b) => b._relevanceScore - a._relevanceScore)

    return scoredCategories.map(category => {
      const { _relevanceScore, ...cleanCategory } = category
      return cleanCategory
    })
  }

  /**
   * Calculate relevance score for a category
   */
  calculateCategoryScore(category, query) {
    let score = 0

    // Text relevance score
    const textScore = this.calculateTextRelevance(category, query, ['name'])
    score += textScore * 0.6

    // Category size/popularity score
    const stats = category.stats || {}
    const totalItems = (stats.deals_count || 0) + (stats.coupons_count || 0)
    const popularityScore = Math.min(1, totalItems / 200)
    score += popularityScore * 0.4

    // Exact match boost
    if (this.hasExactMatch(category, query, ['name'])) {
      score *= this.config.exactMatchBoost
    }

    return Math.max(0, score)
  }

  /**
   * Calculate text relevance score
   */
  calculateTextRelevance(item, query, fields) {
    if (!query || !fields || fields.length === 0) return 0

    const queryLower = query.toLowerCase().trim()
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0)
    
    let maxScore = 0

    fields.forEach(field => {
      const fieldValue = this.getNestedValue(item, field)
      if (!fieldValue) return

      const fieldText = fieldValue.toString().toLowerCase()
      let fieldScore = 0

      // Exact phrase match
      if (fieldText.includes(queryLower)) {
        fieldScore += 100
      }

      // Individual word matches
      queryWords.forEach(word => {
        if (fieldText.includes(word)) {
          fieldScore += 20
        }

        // Word boundary matches (higher score)
        const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'i')
        if (wordBoundaryRegex.test(fieldText)) {
          fieldScore += 30
        }

        // Starting word matches (even higher score)
        if (fieldText.startsWith(word)) {
          fieldScore += 40
        }
      })

      maxScore = Math.max(maxScore, fieldScore)
    })

    // Normalize score to 0-1 range
    return Math.min(1, maxScore / 100)
  }

  /**
   * Calculate popularity score
   */
  calculatePopularityScore({ views, clicks, maxViews, maxClicks }) {
    const viewScore = Math.min(1, views / maxViews)
    const clickScore = Math.min(1, clicks / maxClicks)
    
    // Weight clicks higher than views
    return (viewScore * 0.3) + (clickScore * 0.7)
  }

  /**
   * Calculate recency score
   */
  calculateRecencyScore(createdAt) {
    if (!createdAt) return 0

    const now = new Date()
    const created = new Date(createdAt)
    const ageInMonths = (now - created) / (1000 * 60 * 60 * 24 * 30)

    // Exponential decay based on age
    const decayFactor = Math.exp(-this.config.timeDecayFactor * ageInMonths)
    
    return Math.max(0, decayFactor)
  }

  /**
   * Calculate engagement score
   */
  calculateEngagementScore({ views, clicks }) {
    if (views === 0) return 0
    
    const clickThroughRate = clicks / views
    return Math.min(1, clickThroughRate * 10) // CTR of 10% = score of 1
  }

  /**
   * Check for exact match in specified fields
   */
  hasExactMatch(item, query, fields) {
    const queryLower = query.toLowerCase().trim()
    
    return fields.some(field => {
      const fieldValue = this.getNestedValue(item, field)
      return fieldValue && fieldValue.toString().toLowerCase() === queryLower
    })
  }

  /**
   * Check for title match
   */
  hasTitleMatch(item, query) {
    const title = item.title
    if (!title) return false
    
    return title.toLowerCase().includes(query.toLowerCase())
  }

  /**
   * Check if content is old
   */
  isOldContent(createdAt) {
    if (!createdAt) return false
    
    const now = new Date()
    const created = new Date(createdAt)
    const ageInMonths = (now - created) / (1000 * 60 * 60 * 24 * 30)
    
    return ageInMonths > this.config.maxAgeMonths
  }

  /**
   * Check if item has low engagement
   */
  hasLowEngagement(item) {
    const views = item.views_count || 0
    const clicks = item.clicks_count || 0
    
    // Consider low engagement if less than 10 views or 0 clicks
    return views < 10 || clicks === 0
  }

  /**
   * Check if coupon is expiring soon
   */
  isExpiringSoon(expiresAt) {
    if (!expiresAt) return false
    
    const now = new Date()
    const expires = new Date(expiresAt)
    const daysUntilExpiry = (expires - now) / (1000 * 60 * 60 * 24)
    
    return daysUntilExpiry < 7 && daysUntilExpiry > 0
  }

  /**
   * Apply sort order (non-relevance sorting)
   */
  applySortOrder(searchResults, sort) {
    const sortedResults = { ...searchResults }

    // Sort each result type
    if (sortedResults.deals) {
      sortedResults.deals = this.sortArray(sortedResults.deals, sort, 'deals')
    }
    
    if (sortedResults.coupons) {
      sortedResults.coupons = this.sortArray(sortedResults.coupons, sort, 'coupons')
    }
    
    if (sortedResults.users) {
      sortedResults.users = this.sortArray(sortedResults.users, sort, 'users')
    }
    
    if (sortedResults.companies) {
      sortedResults.companies = this.sortArray(sortedResults.companies, sort, 'companies')
    }
    
    if (sortedResults.categories) {
      sortedResults.categories = this.sortArray(sortedResults.categories, sort, 'categories')
    }

    return sortedResults
  }

  /**
   * Sort array based on sort type
   */
  sortArray(array, sort, entityType) {
    if (!array || array.length === 0) return array

    const sortedArray = [...array]

    switch (sort) {
      case 'newest':
        return sortedArray.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
      case 'oldest':
        return sortedArray.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      
      case 'popular':
        if (entityType === 'users') {
          return sortedArray.sort((a, b) => (b.karma || 0) - (a.karma || 0))
        }
        return sortedArray.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      
      case 'price_low':
        if (entityType === 'deals') {
          return sortedArray.sort((a, b) => (a.price || 0) - (b.price || 0))
        }
        return sortedArray
      
      case 'price_high':
        if (entityType === 'deals') {
          return sortedArray.sort((a, b) => (b.price || 0) - (a.price || 0))
        }
        return sortedArray
      
      case 'discount':
        if (entityType === 'deals') {
          return sortedArray.sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0))
        } else if (entityType === 'coupons') {
          return sortedArray.sort((a, b) => (b.discount_value || 0) - (a.discount_value || 0))
        }
        return sortedArray
      
      default:
        return sortedArray
    }
  }

  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }

  /**
   * Escape regex special characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}

export default SearchRanking
