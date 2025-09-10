/**
 * Enterprise-Level Search Engine
 * Comprehensive search system with advanced features:
 * - Multi-entity search across deals, coupons, users, companies
 * - Advanced fuzzy matching and ranking algorithms
 * - Search analytics and performance monitoring
 * - Intelligent caching and indexing
 * - Real-time search suggestions
 * - Advanced filtering and sorting
 */

import { makeAdminClient } from '../supa.js'
import SearchAnalytics from './SearchAnalytics.js'
import SearchCache from './SearchCache.js'
import SearchRanking from './SearchRanking.js'
import SearchSuggestions from './SearchSuggestions.js'
import FuzzyMatcher from './FuzzyMatcher.js'

class SearchEngine {
  constructor() {
    this.supabase = makeAdminClient()
    this.analytics = new SearchAnalytics()
    this.cache = new SearchCache()
    this.ranking = new SearchRanking()
    this.suggestions = new SearchSuggestions()
    this.fuzzyMatcher = new FuzzyMatcher()
    
    // Search configuration
    this.config = {
      maxResults: 100,
      cacheTimeout: 300000, // 5 minutes
      minQueryLength: 1,
      maxQueryLength: 200,
      fuzzyThreshold: 0.6,
      enableAnalytics: true,
      enableCaching: true,
      enableSuggestions: true,
      searchTypes: ['deals', 'coupons', 'users', 'companies', 'categories'],
      sortOptions: ['relevance', 'newest', 'oldest', 'popular', 'price_low', 'price_high', 'discount'],
      defaultSort: 'relevance'
    }
  }

  /**
   * Main search method - handles all search requests
   */
  async search(params) {
    const startTime = Date.now()
    
    try {
      // Validate and normalize search parameters
      const normalizedParams = this.normalizeSearchParams(params)
      
      // Check cache first
      if (this.config.enableCaching) {
        const cachedResult = await this.cache.get(normalizedParams)
        if (cachedResult) {
          await this.analytics.recordSearch(normalizedParams, cachedResult, Date.now() - startTime, 'cache_hit')
          return cachedResult
        }
      }

      // Perform the actual search
      const searchResult = await this.performSearch(normalizedParams)
      
      // Apply ranking and sorting
      const rankedResult = await this.ranking.rankResults(searchResult, normalizedParams)
      
      // Cache the results
      if (this.config.enableCaching) {
        await this.cache.set(normalizedParams, rankedResult)
      }

      // Record analytics
      if (this.config.enableAnalytics) {
        await this.analytics.recordSearch(normalizedParams, rankedResult, Date.now() - startTime, 'database_hit')
      }

      return rankedResult
    } catch (error) {
      console.error('Search Engine Error:', error)
      
      // Record error analytics
      if (this.config.enableAnalytics) {
        await this.analytics.recordError(params, error, Date.now() - startTime)
      }
      
      throw error
    }
  }

  /**
   * Normalize and validate search parameters
   */
  normalizeSearchParams(params) {
    const {
      q = '',
      type = 'all',
      category,
      company,
      tags,
      min_price,
      max_price,
      min_discount,
      max_discount,
      has_coupon,
      coupon_type,
      featured,
      sort = this.config.defaultSort,
      page = 1,
      limit = 20,
      filters = {}
    } = params

    // Validate query length
    const query = q.trim()
    if (query.length > this.config.maxQueryLength) {
      throw new Error(`Query too long. Maximum ${this.config.maxQueryLength} characters allowed.`)
    }

    // Validate search type
    if (type !== 'all' && !this.config.searchTypes.includes(type)) {
      throw new Error(`Invalid search type: ${type}`)
    }

    // Validate sort option
    if (!this.config.sortOptions.includes(sort)) {
      throw new Error(`Invalid sort option: ${sort}`)
    }

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(this.config.maxResults, Math.max(1, parseInt(limit) || 20))

    return {
      query,
      type,
      category,
      company,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',') : []),
      min_price: min_price ? parseFloat(min_price) : null,
      max_price: max_price ? parseFloat(max_price) : null,
      min_discount: min_discount ? parseInt(min_discount) : null,
      max_discount: max_discount ? parseInt(max_discount) : null,
      has_coupon: has_coupon === 'true' || has_coupon === true,
      coupon_type,
      featured: featured === 'true' || featured === true,
      sort,
      page: pageNum,
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      filters
    }
  }

  /**
   * Perform the actual search across all entities
   */
  async performSearch(params) {
    const { query, type } = params
    const results = {
      deals: [],
      coupons: [],
      users: [],
      companies: [],
      categories: [],
      total_deals: 0,
      total_coupons: 0,
      total_users: 0,
      total_companies: 0,
      total_categories: 0,
      total_results: 0,
      query: query,
      search_time: 0,
      suggestions: []
    }

    const searchPromises = []

    // Search deals
    if (type === 'all' || type === 'deals') {
      searchPromises.push(this.searchDeals(params).then(data => {
        results.deals = data.results
        results.total_deals = data.total
      }))
    }

    // Search coupons
    if (type === 'all' || type === 'coupons') {
      searchPromises.push(this.searchCoupons(params).then(data => {
        results.coupons = data.results
        results.total_coupons = data.total
      }))
    }

    // Search users
    if (type === 'all' || type === 'users') {
      searchPromises.push(this.searchUsers(params).then(data => {
        results.users = data.results
        results.total_users = data.total
      }))
    }

    // Search companies
    if (type === 'all' || type === 'companies') {
      searchPromises.push(this.searchCompanies(params).then(data => {
        results.companies = data.results
        results.total_companies = data.total
      }))
    }

    // Search categories
    if (type === 'all' || type === 'categories') {
      searchPromises.push(this.searchCategories(params).then(data => {
        results.categories = data.results
        results.total_categories = data.total
      }))
    }

    // Execute all searches in parallel
    await Promise.all(searchPromises)

    // Calculate total results
    results.total_results = results.total_deals + results.total_coupons + 
                           results.total_users + results.total_companies + 
                           results.total_categories

    // Generate search suggestions if enabled
    if (this.config.enableSuggestions && query.length >= 2) {
      results.suggestions = await this.suggestions.generateSuggestions(query, results)
    }

    return results
  }

  /**
   * Search deals with advanced matching including tags
   */
  async searchDeals(params) {
    const { query, category, company, min_price, max_price, min_discount, max_discount, 
            has_coupon, featured, sort, offset, limit } = params

    try {
      // First, search for deals by text content
      let dealsQuery = this.supabase
        .from('deals')
        .select(`
          id, title, url, price, merchant, created_at, approved_at, status,
          description, image_url, deal_images, featured_image, coupon_code, coupon_type, 
          discount_percentage, discount_amount, original_price, expires_at, category_id, 
          deal_type, is_featured, views_count, clicks_count, submitter_id,
          categories(name, slug),
          companies(name, slug, logo_url, is_verified)
        `, { count: 'exact' })
        .eq('status', 'approved')

      let dealIds = []

      // Apply text search (includes tag search)
      if (query && query.length > 0) {
        // Search in deal content
        const searchConditions = this.buildTextSearchConditions(query, [
          'title', 'description', 'merchant'
        ])
        
        // Also search in tags
        const tagMatchingDeals = await this.searchDealsByTags(query)
        
        if (searchConditions.length > 0 && tagMatchingDeals.length > 0) {
          // Combine text search with tag search
          dealsQuery = dealsQuery.or(`${searchConditions.join(',')},id.in.(${tagMatchingDeals.join(',')})`)
        } else if (searchConditions.length > 0) {
          // Only text search
          dealsQuery = dealsQuery.or(searchConditions.join(','))
        } else if (tagMatchingDeals.length > 0) {
          // Only tag search
          dealsQuery = dealsQuery.in('id', tagMatchingDeals)
        } else {
          // No matches found, return empty
          return { results: [], total: 0 }
        }
      }

      // Apply filters
      dealsQuery = this.applyDealsFilters(dealsQuery, {
        category, company, min_price, max_price, min_discount, max_discount, 
        has_coupon, featured
      })

      // Apply sorting
      dealsQuery = this.applySorting(dealsQuery, sort, 'deals')

      // Apply pagination
      const { data: deals, error, count } = await dealsQuery.range(offset, offset + limit - 1)

      if (error) {
        console.error('Deals search error:', error)
        return { results: [], total: 0 }
      }

      // Apply fuzzy matching for better relevance
      let results = deals || []
      if (query && query.length > 0) {
        results = this.fuzzyMatcher.filterAndRankResults(results, query, [
          'title', 'description', 'merchant'
        ])
      }

      // Enhance results with tag information
      results = await this.enhanceDealsWithTags(results)

      return { results, total: count || 0 }
    } catch (error) {
      console.error('Deals search error:', error)
      return { results: [], total: 0 }
    }
  }

  /**
   * Search deals by tags
   */
  async searchDealsByTags(query) {
    try {
      const { data: tagMatches } = await this.supabase
        .from('deal_tags')
        .select(`
          deal_id,
          tags!inner(name, slug)
        `)
        .or(`tags.name.ilike.%${query}%,tags.slug.ilike.%${query}%`)

      return tagMatches ? tagMatches.map(match => match.deal_id) : []
    } catch (error) {
      console.error('Error searching deals by tags:', error)
      return []
    }
  }

  /**
   * Search coupons by tags
   */
  async searchCouponsByTags(query) {
    try {
      const { data: tagMatches } = await this.supabase
        .from('coupon_tags')
        .select(`
          coupon_id,
          tags!inner(name, slug)
        `)
        .or(`tags.name.ilike.%${query}%,tags.slug.ilike.%${query}%`)

      return tagMatches ? tagMatches.map(match => match.coupon_id) : []
    } catch (error) {
      console.error('Error searching coupons by tags:', error)
      return []
    }
  }

  /**
   * Search coupons with advanced matching including tags
   */
  async searchCoupons(params) {
    const { query, category, company, min_discount, max_discount, coupon_type, 
            featured, sort, offset, limit } = params

    try {
      let couponsQuery = this.supabase
        .from('coupons')
        .select(`
          id, title, description, coupon_code, coupon_type, discount_value,
          minimum_order_amount, maximum_discount_amount, company_id, category_id,
          submitter_id, terms_conditions, starts_at, expires_at, 
          is_featured, is_exclusive, views_count, clicks_count, success_rate, 
          created_at, updated_at, status,
          companies(id, name, slug, logo_url, is_verified),
          categories(id, name, slug, color)
        `, { count: 'exact' })
        .eq('status', 'approved')

      // Apply text search (includes tag search)
      if (query && query.length > 0) {
        // Search in coupon content
        const searchConditions = this.buildTextSearchConditions(query, [
          'title', 'description', 'coupon_code'
        ])
        
        // Also search in tags
        const tagMatchingCoupons = await this.searchCouponsByTags(query)
        
        if (searchConditions.length > 0 && tagMatchingCoupons.length > 0) {
          // Combine text search with tag search
          couponsQuery = couponsQuery.or(`${searchConditions.join(',')},id.in.(${tagMatchingCoupons.join(',')})`)
        } else if (searchConditions.length > 0) {
          // Only text search
          couponsQuery = couponsQuery.or(searchConditions.join(','))
        } else if (tagMatchingCoupons.length > 0) {
          // Only tag search
          couponsQuery = couponsQuery.in('id', tagMatchingCoupons)
        } else {
          // No matches found, return empty
          return { results: [], total: 0 }
        }
      }

      // Apply filters
      couponsQuery = this.applyCouponsFilters(couponsQuery, {
        category, company, min_discount, max_discount, coupon_type, featured
      })

      // Apply sorting
      couponsQuery = this.applySorting(couponsQuery, sort, 'coupons')

      // Apply pagination
      const { data: coupons, error, count } = await couponsQuery.range(offset, offset + limit - 1)

      if (error) {
        console.error('Coupons search error:', error)
        return { results: [], total: 0 }
      }

      // Apply fuzzy matching for better relevance
      let results = coupons || []
      if (query && query.length > 0) {
        results = this.fuzzyMatcher.filterAndRankResults(results, query, [
          'title', 'description', 'coupon_code'
        ])
      }

      // Enhance results with tag information
      results = await this.enhanceCouponsWithTags(results)

      return { results, total: count || 0 }
    } catch (error) {
      console.error('Coupons search error:', error)
      return { results: [], total: 0 }
    }
  }

  /**
   * Search users with enhanced name matching
   */
  async searchUsers(params) {
    const { query, sort, offset, limit } = params

    try {
      let usersQuery = this.supabase
        .from('profiles')
        .select(`
          id, handle, avatar_url, karma, role, created_at,
          first_name, last_name, display_name, bio, location, website
        `, { count: 'exact' })

      // Apply text search with enhanced name matching
      if (query && query.length > 0) {
        const searchConditions = this.buildNameSearchConditions(query)
        if (searchConditions.length > 0) {
          usersQuery = usersQuery.or(searchConditions.join(','))
        }
      }

      // Apply sorting
      usersQuery = this.applySorting(usersQuery, sort, 'users')

      // Apply pagination
      const { data: users, error, count } = await usersQuery.range(offset, offset + limit - 1)

      if (error) {
        console.error('Users search error:', error)
        return { results: [], total: 0 }
      }

      // Enhance user data with additional information
      const results = await this.enhanceUserResults(users || [])

      return { results, total: count || 0 }
    } catch (error) {
      console.error('Users search error:', error)
      return { results: [], total: 0 }
    }
  }

  /**
   * Search companies
   */
  async searchCompanies(params) {
    const { query, category, sort, offset, limit } = params

    try {
      let companiesQuery = this.supabase
        .from('companies')
        .select(`
          id, name, slug, logo_url, website_url, 
          is_verified, created_at, category_id
        `, { count: 'exact' })

      // Apply text search
      if (query && query.length > 0) {
        const searchConditions = this.buildTextSearchConditions(query, ['name'])
        if (searchConditions.length > 0) {
          companiesQuery = companiesQuery.or(searchConditions.join(','))
        }
      }

      // Apply filters
      if (category) {
        companiesQuery = companiesQuery.eq('category_id', category)
      }

      // Apply sorting
      companiesQuery = this.applySorting(companiesQuery, sort, 'companies')

      // Apply pagination
      const { data: companies, error, count } = await companiesQuery.range(offset, offset + limit - 1)

      if (error) {
        console.error('Companies search error:', error)
        return { results: [], total: 0 }
      }

      // Enhance company data
      const results = await this.enhanceCompanyResults(companies || [])

      return { results, total: count || 0 }
    } catch (error) {
      console.error('Companies search error:', error)
      return { results: [], total: 0 }
    }
  }

  /**
   * Search categories
   */
  async searchCategories(params) {
    const { query, sort, offset, limit } = params

    try {
      let categoriesQuery = this.supabase
        .from('categories')
        .select(`
          id, name, slug, color, created_at
        `, { count: 'exact' })

      // Apply text search
      if (query && query.length > 0) {
        const searchConditions = this.buildTextSearchConditions(query, ['name'])
        if (searchConditions.length > 0) {
          categoriesQuery = categoriesQuery.or(searchConditions.join(','))
        }
      }

      // Apply sorting
      categoriesQuery = this.applySorting(categoriesQuery, sort, 'categories')

      // Apply pagination
      const { data: categories, error, count } = await categoriesQuery.range(offset, offset + limit - 1)

      if (error) {
        console.error('Categories search error:', error)
        return { results: [], total: 0 }
      }

      // Enhance category data
      const results = await this.enhanceCategoryResults(categories || [])

      return { results, total: count || 0 }
    } catch (error) {
      console.error('Categories search error:', error)
      return { results: [], total: 0 }
    }
  }

  /**
   * Build text search conditions for given fields
   */
  buildTextSearchConditions(query, fields) {
    const conditions = []
    const cleanQuery = query.toLowerCase().trim()
    
    if (!cleanQuery) return conditions

    // Split query into words for better matching
    const words = cleanQuery.split(/\s+/).filter(word => word.length > 0)
    
    // Add exact phrase matching
    fields.forEach(field => {
      conditions.push(`${field}.ilike.*${cleanQuery}*`)
    })

    // Add individual word matching
    words.forEach(word => {
      if (word.length >= 2) {
        fields.forEach(field => {
          conditions.push(`${field}.ilike.*${word}*`)
        })
      }
    })

    return conditions
  }

  /**
   * Build enhanced name search conditions
   */
  buildNameSearchConditions(query) {
    const conditions = []
    const cleanQuery = query.toLowerCase().trim()
    
    if (!cleanQuery) return conditions

    const nameFields = ['handle', 'display_name', 'first_name', 'last_name', 'bio']
    const words = cleanQuery.split(/\s+/).filter(word => word.length > 0)

    // Exact matching
    nameFields.forEach(field => {
      conditions.push(`${field}.ilike.*${cleanQuery}*`)
    })

    // Word-by-word matching
    words.forEach(word => {
      if (word.length >= 2) {
        nameFields.forEach(field => {
          conditions.push(`${field}.ilike.*${word}*`)
          conditions.push(`${field}.ilike.${word}*`)
        })
      }
    })

    return conditions
  }

  /**
   * Apply deals-specific filters
   */
  applyDealsFilters(query, filters) {
    const { category, company, min_price, max_price, min_discount, max_discount, has_coupon, featured } = filters

    if (category) {
      query = query.eq('category_id', category)
    }

    if (company) {
      query = query.eq('company_id', company)
    }

    if (min_price !== null && min_price !== undefined) {
      query = query.gte('price', min_price)
    }

    if (max_price !== null && max_price !== undefined) {
      query = query.lte('price', max_price)
    }

    if (min_discount !== null && min_discount !== undefined) {
      query = query.gte('discount_percentage', min_discount)
    }

    if (max_discount !== null && max_discount !== undefined) {
      query = query.lte('discount_percentage', max_discount)
    }

    if (has_coupon) {
      query = query.not('coupon_code', 'is', null)
    }

    if (featured) {
      query = query.eq('is_featured', true)
    }

    return query
  }

  /**
   * Apply coupons-specific filters
   */
  applyCouponsFilters(query, filters) {
    const { category, company, min_discount, max_discount, coupon_type, featured } = filters

    if (category) {
      query = query.eq('category_id', category)
    }

    if (company) {
      query = query.eq('company_id', company)
    }

    if (min_discount !== null && min_discount !== undefined) {
      query = query.gte('discount_value', min_discount)
    }

    if (max_discount !== null && max_discount !== undefined) {
      query = query.lte('discount_value', max_discount)
    }

    if (coupon_type) {
      query = query.eq('coupon_type', coupon_type)
    }

    if (featured) {
      query = query.eq('is_featured', true)
    }

    return query
  }

  /**
   * Apply sorting to queries
   */
  applySorting(query, sort, entityType) {
    switch (sort) {
      case 'newest':
        return query.order('created_at', { ascending: false })
      
      case 'oldest':
        return query.order('created_at', { ascending: true })
      
      case 'popular':
        if (entityType === 'deals' || entityType === 'coupons') {
          return query.order('views_count', { ascending: false })
        } else if (entityType === 'users') {
          return query.order('karma', { ascending: false })
        }
        return query.order('created_at', { ascending: false })
      
      case 'price_low':
        if (entityType === 'deals') {
          return query.order('price', { ascending: true })
        }
        return query.order('created_at', { ascending: false })
      
      case 'price_high':
        if (entityType === 'deals') {
          return query.order('price', { ascending: false })
        }
        return query.order('created_at', { ascending: false })
      
      case 'discount':
        if (entityType === 'deals') {
          return query.order('discount_percentage', { ascending: false })
        } else if (entityType === 'coupons') {
          return query.order('discount_value', { ascending: false })
        }
        return query.order('created_at', { ascending: false })
      
      case 'relevance':
      default:
        // For relevance, we'll sort by a combination of factors
        if (entityType === 'deals' || entityType === 'coupons') {
          return query.order('views_count', { ascending: false })
        } else if (entityType === 'users') {
          return query.order('karma', { ascending: false })
        } else if (entityType === 'companies') {
          return query.order('is_verified', { ascending: false }).order('name', { ascending: true })
        }
        return query.order('created_at', { ascending: false })
    }
  }

  /**
   * Enhance deals with tag information
   */
  async enhanceDealsWithTags(deals) {
    if (!deals || deals.length === 0) return deals

    try {
      const dealIds = deals.map(deal => deal.id)
      const { data: dealTags } = await this.supabase
        .from('deal_tags')
        .select(`
          deal_id,
          tags(id, name, slug, color)
        `)
        .in('deal_id', dealIds)

      const tagsByDealId = {}
      dealTags?.forEach(dealTag => {
        if (!tagsByDealId[dealTag.deal_id]) {
          tagsByDealId[dealTag.deal_id] = []
        }
        tagsByDealId[dealTag.deal_id].push(dealTag.tags)
      })

      return deals.map(deal => ({
        ...deal,
        tags: tagsByDealId[deal.id] || []
      }))
    } catch (error) {
      console.error('Error enhancing deals with tags:', error)
      return deals
    }
  }

  /**
   * Enhance coupons with tag information
   */
  async enhanceCouponsWithTags(coupons) {
    if (!coupons || coupons.length === 0) return coupons

    try {
      const couponIds = coupons.map(coupon => coupon.id)
      const { data: couponTags } = await this.supabase
        .from('coupon_tags')
        .select(`
          coupon_id,
          tags(id, name, slug, color)
        `)
        .in('coupon_id', couponIds)

      const tagsByCouponId = {}
      couponTags?.forEach(couponTag => {
        if (!tagsByCouponId[couponTag.coupon_id]) {
          tagsByCouponId[couponTag.coupon_id] = []
        }
        tagsByCouponId[couponTag.coupon_id].push(couponTag.tags)
      })

      return coupons.map(coupon => ({
        ...coupon,
        tags: tagsByCouponId[coupon.id] || []
      }))
    } catch (error) {
      console.error('Error enhancing coupons with tags:', error)
      return coupons
    }
  }

  /**
   * Enhance user results with additional data
   */
  async enhanceUserResults(users) {
    if (!users || users.length === 0) return users

    // Get additional stats for each user
    const enhancedUsers = await Promise.all(users.map(async (user) => {
      try {
        // Get user's deal and coupon counts
        const [dealsResult, couponsResult] = await Promise.all([
          this.supabase.from('deals').select('id', { count: 'exact' }).eq('submitter_id', user.id).eq('status', 'approved'),
          this.supabase.from('coupons').select('id', { count: 'exact' }).eq('submitter_id', user.id).eq('status', 'approved')
        ])

        return {
          ...user,
          stats: {
            deals_count: dealsResult.count || 0,
            coupons_count: couponsResult.count || 0,
            total_contributions: (dealsResult.count || 0) + (couponsResult.count || 0)
          }
        }
      } catch (error) {
        console.error('Error enhancing user data:', error)
        return {
          ...user,
          stats: {
            deals_count: 0,
            coupons_count: 0,
            total_contributions: 0
          }
        }
      }
    }))

    return enhancedUsers
  }

  /**
   * Enhance company results with additional data
   */
  async enhanceCompanyResults(companies) {
    if (!companies || companies.length === 0) return companies

    // Get additional stats for each company
    const enhancedCompanies = await Promise.all(companies.map(async (company) => {
      try {
        // Get company's deal and coupon counts
        const [dealsResult, couponsResult] = await Promise.all([
          this.supabase.from('deals').select('id', { count: 'exact' }).eq('company_id', company.id).eq('status', 'approved'),
          this.supabase.from('coupons').select('id', { count: 'exact' }).eq('company_id', company.id).eq('status', 'approved')
        ])

        return {
          ...company,
          stats: {
            deals_count: dealsResult.count || 0,
            coupons_count: couponsResult.count || 0,
            total_offers: (dealsResult.count || 0) + (couponsResult.count || 0)
          }
        }
      } catch (error) {
        console.error('Error enhancing company data:', error)
        return {
          ...company,
          stats: {
            deals_count: 0,
            coupons_count: 0,
            total_offers: 0
          }
        }
      }
    }))

    return enhancedCompanies
  }

  /**
   * Enhance category results with additional data
   */
  async enhanceCategoryResults(categories) {
    if (!categories || categories.length === 0) return categories

    // Get additional stats for each category
    const enhancedCategories = await Promise.all(categories.map(async (category) => {
      try {
        // Get category's deal and coupon counts
        const [dealsResult, couponsResult] = await Promise.all([
          this.supabase.from('deals').select('id', { count: 'exact' }).eq('category_id', category.id).eq('status', 'approved'),
          this.supabase.from('coupons').select('id', { count: 'exact' }).eq('category_id', category.id).eq('status', 'approved')
        ])

        return {
          ...category,
          stats: {
            deals_count: dealsResult.count || 0,
            coupons_count: couponsResult.count || 0,
            total_items: (dealsResult.count || 0) + (couponsResult.count || 0)
          }
        }
      } catch (error) {
        console.error('Error enhancing category data:', error)
        return {
          ...category,
          stats: {
            deals_count: 0,
            coupons_count: 0,
            total_items: 0
          }
        }
      }
    }))

    return enhancedCategories
  }

  /**
   * Get search analytics
   */
  async getAnalytics(timeframe = '24h') {
    return await this.analytics.getAnalytics(timeframe)
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query, limit = 10) {
    return await this.suggestions.getSuggestions(query, limit)
  }

  /**
   * Clear search cache
   */
  async clearCache() {
    return await this.cache.clear()
  }
}

export default SearchEngine
