/**
 * Search Analytics and Performance Monitoring
 * Tracks search patterns, performance metrics, and user behavior
 */

import { makeAdminClient } from '../supa.js'

class SearchAnalytics {
  constructor() {
    this.supabase = makeAdminClient()
    this.metrics = new Map()
    this.config = {
      batchSize: 100,
      flushInterval: 30000, // 30 seconds
      retentionDays: 30,
      enableRealTimeTracking: true
    }

    // Start periodic flushing of metrics
    this.startMetricsFlush()
  }

  /**
   * Record a search event
   */
  async recordSearch(params, results, responseTime, source = 'database') {
    const searchEvent = {
      query: params.query || '',
      type: params.type || 'all',
      filters: this.sanitizeFilters(params),
      results_count: results.total_results || 0,
      response_time: responseTime,
      source: source, // 'cache_hit' or 'database_hit'
      timestamp: new Date().toISOString(),
      user_agent: this.getUserAgent(),
      ip_hash: this.getIPHash()
    }

    // Store in memory for batching
    const key = `search_${Date.now()}_${Math.random()}`
    this.metrics.set(key, searchEvent)

    // Update real-time metrics
    if (this.config.enableRealTimeTracking) {
      this.updateRealTimeMetrics(searchEvent)
    }

    return searchEvent
  }

  /**
   * Record a search error
   */
  async recordError(params, error, responseTime) {
    const errorEvent = {
      query: params.query || '',
      type: params.type || 'all',
      error_message: error.message,
      error_code: error.code || 'UNKNOWN',
      response_time: responseTime,
      timestamp: new Date().toISOString(),
      user_agent: this.getUserAgent(),
      ip_hash: this.getIPHash()
    }

    // Store in memory for batching
    const key = `error_${Date.now()}_${Math.random()}`
    this.metrics.set(key, errorEvent)

    return errorEvent
  }

  /**
   * Record user interaction with search results
   */
  async recordInteraction(searchQuery, resultType, resultId, interactionType = 'click') {
    const interactionEvent = {
      query: searchQuery,
      result_type: resultType,
      result_id: resultId,
      interaction_type: interactionType, // 'click', 'view', 'share', etc.
      timestamp: new Date().toISOString(),
      user_agent: this.getUserAgent(),
      ip_hash: this.getIPHash()
    }

    const key = `interaction_${Date.now()}_${Math.random()}`
    this.metrics.set(key, interactionEvent)

    return interactionEvent
  }

  /**
   * Get search analytics for a given timeframe
   */
  async getAnalytics(timeframe = '24h') {
    try {
      const { startDate, endDate } = this.parseTimeframe(timeframe)
      
      // Get search statistics
      const searchStats = await this.getSearchStats(startDate, endDate)
      
      // Get popular queries
      const popularQueries = await this.getPopularQueries(startDate, endDate)
      
      // Get performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(startDate, endDate)
      
      // Get error statistics
      const errorStats = await this.getErrorStats(startDate, endDate)
      
      // Get conversion metrics
      const conversionMetrics = await this.getConversionMetrics(startDate, endDate)

      return {
        timeframe,
        period: { startDate, endDate },
        search_stats: searchStats,
        popular_queries: popularQueries,
        performance: performanceMetrics,
        errors: errorStats,
        conversions: conversionMetrics,
        real_time: this.getRealTimeMetrics()
      }
    } catch (error) {
      console.error('Error getting analytics:', error)
      return this.getEmptyAnalytics()
    }
  }

  /**
   * Get search statistics
   */
  async getSearchStats(startDate, endDate) {
    // In a real implementation, this would query a dedicated analytics table
    // For now, return mock data based on current metrics
    const searches = Array.from(this.metrics.values())
      .filter(event => event.timestamp >= startDate && event.timestamp <= endDate)
      .filter(event => event.query !== undefined)

    const totalSearches = searches.length
    const uniqueQueries = new Set(searches.map(s => s.query)).size
    const avgResponseTime = searches.length > 0 
      ? searches.reduce((sum, s) => sum + s.response_time, 0) / searches.length 
      : 0

    const cacheHits = searches.filter(s => s.source === 'cache_hit').length
    const cacheHitRate = totalSearches > 0 ? (cacheHits / totalSearches) * 100 : 0

    return {
      total_searches: totalSearches,
      unique_queries: uniqueQueries,
      avg_response_time: Math.round(avgResponseTime),
      cache_hit_rate: Math.round(cacheHitRate * 100) / 100,
      search_types: this.getSearchTypeBreakdown(searches)
    }
  }

  /**
   * Get popular search queries
   */
  async getPopularQueries(startDate, endDate, limit = 20) {
    const searches = Array.from(this.metrics.values())
      .filter(event => event.timestamp >= startDate && event.timestamp <= endDate)
      .filter(event => event.query && event.query.length > 0)

    const queryCount = new Map()
    
    searches.forEach(search => {
      const query = search.query.toLowerCase().trim()
      queryCount.set(query, (queryCount.get(query) || 0) + 1)
    })

    return Array.from(queryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({
        query,
        count,
        percentage: Math.round((count / searches.length) * 10000) / 100
      }))
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(startDate, endDate) {
    const searches = Array.from(this.metrics.values())
      .filter(event => event.timestamp >= startDate && event.timestamp <= endDate)
      .filter(event => event.response_time !== undefined)

    if (searches.length === 0) {
      return {
        avg_response_time: 0,
        median_response_time: 0,
        p95_response_time: 0,
        p99_response_time: 0,
        fastest_query: null,
        slowest_query: null
      }
    }

    const responseTimes = searches.map(s => s.response_time).sort((a, b) => a - b)
    
    return {
      avg_response_time: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
      median_response_time: this.calculatePercentile(responseTimes, 50),
      p95_response_time: this.calculatePercentile(responseTimes, 95),
      p99_response_time: this.calculatePercentile(responseTimes, 99),
      fastest_query: searches.find(s => s.response_time === Math.min(...responseTimes)),
      slowest_query: searches.find(s => s.response_time === Math.max(...responseTimes))
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(startDate, endDate) {
    const errors = Array.from(this.metrics.values())
      .filter(event => event.error_message !== undefined)
      .filter(event => event.timestamp >= startDate && event.timestamp <= endDate)

    const errorCount = new Map()
    
    errors.forEach(error => {
      const errorType = error.error_code || 'UNKNOWN'
      errorCount.set(errorType, (errorCount.get(errorType) || 0) + 1)
    })

    return {
      total_errors: errors.length,
      error_rate: Math.round((errors.length / this.getTotalEvents(startDate, endDate)) * 10000) / 100,
      error_breakdown: Array.from(errorCount.entries()).map(([type, count]) => ({
        error_type: type,
        count,
        percentage: Math.round((count / errors.length) * 10000) / 100
      }))
    }
  }

  /**
   * Get conversion metrics (clicks on search results)
   */
  async getConversionMetrics(startDate, endDate) {
    const interactions = Array.from(this.metrics.values())
      .filter(event => event.interaction_type !== undefined)
      .filter(event => event.timestamp >= startDate && event.timestamp <= endDate)

    const searches = Array.from(this.metrics.values())
      .filter(event => event.query !== undefined)
      .filter(event => event.timestamp >= startDate && event.timestamp <= endDate)

    const clickThroughRate = searches.length > 0 
      ? (interactions.length / searches.length) * 100 
      : 0

    const resultTypeClicks = new Map()
    interactions.forEach(interaction => {
      const type = interaction.result_type || 'unknown'
      resultTypeClicks.set(type, (resultTypeClicks.get(type) || 0) + 1)
    })

    return {
      total_interactions: interactions.length,
      click_through_rate: Math.round(clickThroughRate * 100) / 100,
      result_type_breakdown: Array.from(resultTypeClicks.entries()).map(([type, count]) => ({
        result_type: type,
        clicks: count,
        percentage: Math.round((count / interactions.length) * 10000) / 100
      }))
    }
  }

  /**
   * Update real-time metrics
   */
  updateRealTimeMetrics(event) {
    const now = Date.now()
    const timeWindow = 5 * 60 * 1000 // 5 minutes

    // Clean old real-time data
    if (!this.realTimeMetrics) {
      this.realTimeMetrics = {
        searches: [],
        errors: [],
        interactions: []
      }
    }

    // Add new event
    if (event.query !== undefined) {
      this.realTimeMetrics.searches.push({ ...event, timestamp: now })
    } else if (event.error_message !== undefined) {
      this.realTimeMetrics.errors.push({ ...event, timestamp: now })
    } else if (event.interaction_type !== undefined) {
      this.realTimeMetrics.interactions.push({ ...event, timestamp: now })
    }

    // Clean old events
    this.realTimeMetrics.searches = this.realTimeMetrics.searches.filter(e => now - e.timestamp < timeWindow)
    this.realTimeMetrics.errors = this.realTimeMetrics.errors.filter(e => now - e.timestamp < timeWindow)
    this.realTimeMetrics.interactions = this.realTimeMetrics.interactions.filter(e => now - e.timestamp < timeWindow)
  }

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics() {
    if (!this.realTimeMetrics) {
      return {
        searches_per_minute: 0,
        errors_per_minute: 0,
        interactions_per_minute: 0,
        current_load: 'low'
      }
    }

    const now = Date.now()
    const oneMinute = 60 * 1000

    const recentSearches = this.realTimeMetrics.searches.filter(e => now - e.timestamp < oneMinute)
    const recentErrors = this.realTimeMetrics.errors.filter(e => now - e.timestamp < oneMinute)
    const recentInteractions = this.realTimeMetrics.interactions.filter(e => now - e.timestamp < oneMinute)

    const searchesPerMinute = recentSearches.length
    let currentLoad = 'low'
    
    if (searchesPerMinute > 100) currentLoad = 'high'
    else if (searchesPerMinute > 50) currentLoad = 'medium'

    return {
      searches_per_minute: searchesPerMinute,
      errors_per_minute: recentErrors.length,
      interactions_per_minute: recentInteractions.length,
      current_load: currentLoad
    }
  }

  /**
   * Flush metrics to persistent storage
   */
  async flushMetrics() {
    if (this.metrics.size === 0) return

    try {
      const events = Array.from(this.metrics.values())
      
      // In a real implementation, you would batch insert these into a database
      console.log(`Flushing ${events.length} analytics events to storage`)
      
      // Clear the in-memory metrics after flushing
      this.metrics.clear()
      
      return events.length
    } catch (error) {
      console.error('Error flushing metrics:', error)
      return 0
    }
  }

  /**
   * Start periodic metrics flushing
   */
  startMetricsFlush() {
    setInterval(async () => {
      await this.flushMetrics()
    }, this.config.flushInterval)
  }

  /**
   * Helper methods
   */
  parseTimeframe(timeframe) {
    const now = new Date()
    let startDate = new Date(now)

    switch (timeframe) {
      case '1h':
        startDate.setHours(now.getHours() - 1)
        break
      case '24h':
        startDate.setDate(now.getDate() - 1)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      default:
        startDate.setDate(now.getDate() - 1)
    }

    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    }
  }

  sanitizeFilters(params) {
    const { query, ...filters } = params
    return filters
  }

  getUserAgent() {
    // In a real implementation, you would get this from the request
    return 'SearchEngine/1.0'
  }

  getIPHash() {
    // In a real implementation, you would hash the user's IP for privacy
    return 'hashed_ip'
  }

  calculatePercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
    return sortedArray[Math.max(0, index)]
  }

  getSearchTypeBreakdown(searches) {
    const typeCount = new Map()
    
    searches.forEach(search => {
      const type = search.type || 'all'
      typeCount.set(type, (typeCount.get(type) || 0) + 1)
    })

    return Array.from(typeCount.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / searches.length) * 10000) / 100
    }))
  }

  getTotalEvents(startDate, endDate) {
    return Array.from(this.metrics.values())
      .filter(event => event.timestamp >= startDate && event.timestamp <= endDate)
      .length
  }

  getEmptyAnalytics() {
    return {
      search_stats: {
        total_searches: 0,
        unique_queries: 0,
        avg_response_time: 0,
        cache_hit_rate: 0,
        search_types: []
      },
      popular_queries: [],
      performance: {
        avg_response_time: 0,
        median_response_time: 0,
        p95_response_time: 0,
        p99_response_time: 0
      },
      errors: {
        total_errors: 0,
        error_rate: 0,
        error_breakdown: []
      },
      conversions: {
        total_interactions: 0,
        click_through_rate: 0,
        result_type_breakdown: []
      },
      real_time: {
        searches_per_minute: 0,
        errors_per_minute: 0,
        interactions_per_minute: 0,
        current_load: 'low'
      }
    }
  }
}

export default SearchAnalytics
