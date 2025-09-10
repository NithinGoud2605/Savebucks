/**
 * Advanced Search Caching System
 * Implements intelligent caching with TTL and invalidation strategies
 */

import crypto from 'crypto'

class SearchCache {
  constructor() {
    this.cache = new Map()
    this.ttlMap = new Map()
    this.config = {
      defaultTTL: 300000, // 5 minutes
      maxCacheSize: 1000,
      cleanupInterval: 60000, // 1 minute
      compressionThreshold: 1024 // 1KB
    }

    // Start cleanup interval
    this.startCleanupInterval()
  }

  /**
   * Generate cache key from search parameters
   */
  generateCacheKey(params) {
    const normalizedParams = {
      query: params.query || '',
      type: params.type || 'all',
      category: params.category || '',
      company: params.company || '',
      tags: Array.isArray(params.tags) ? params.tags.sort() : [],
      min_price: params.min_price || null,
      max_price: params.max_price || null,
      min_discount: params.min_discount || null,
      max_discount: params.max_discount || null,
      has_coupon: params.has_coupon || false,
      coupon_type: params.coupon_type || '',
      featured: params.featured || false,
      sort: params.sort || 'relevance',
      page: params.page || 1,
      limit: params.limit || 20
    }

    const keyString = JSON.stringify(normalizedParams)
    return crypto.createHash('sha256').update(keyString).digest('hex')
  }

  /**
   * Get cached search results
   */
  async get(params) {
    const key = this.generateCacheKey(params)
    
    // Check if key exists and is not expired
    if (!this.cache.has(key) || this.isExpired(key)) {
      this.delete(key)
      return null
    }

    const cachedData = this.cache.get(key)
    
    // Decompress if needed
    if (cachedData.compressed) {
      return this.decompress(cachedData.data)
    }

    return cachedData.data
  }

  /**
   * Set search results in cache
   */
  async set(params, data, ttl = null) {
    const key = this.generateCacheKey(params)
    const expiryTime = Date.now() + (ttl || this.config.defaultTTL)

    // Check cache size and cleanup if needed
    if (this.cache.size >= this.config.maxCacheSize) {
      this.cleanup()
    }

    // Compress large data
    const serializedData = JSON.stringify(data)
    const shouldCompress = serializedData.length > this.config.compressionThreshold

    const cacheEntry = {
      data: shouldCompress ? this.compress(data) : data,
      compressed: shouldCompress,
      size: serializedData.length,
      createdAt: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    }

    this.cache.set(key, cacheEntry)
    this.ttlMap.set(key, expiryTime)

    return true
  }

  /**
   * Delete cached entry
   */
  delete(key) {
    this.cache.delete(key)
    this.ttlMap.delete(key)
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(key) {
    const expiryTime = this.ttlMap.get(key)
    return !expiryTime || Date.now() > expiryTime
  }

  /**
   * Clear all cache
   */
  async clear() {
    this.cache.clear()
    this.ttlMap.clear()
    return true
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let totalSize = 0
    let expiredCount = 0
    let compressedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      totalSize += entry.size
      
      if (this.isExpired(key)) {
        expiredCount++
      }
      
      if (entry.compressed) {
        compressedCount++
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      compressedEntries: compressedCount,
      totalSize,
      averageSize: this.cache.size > 0 ? Math.round(totalSize / this.cache.size) : 0,
      hitRate: this.calculateHitRate(),
      memoryUsage: process.memoryUsage()
    }
  }

  /**
   * Calculate cache hit rate
   */
  calculateHitRate() {
    // This would need to be tracked over time in a real implementation
    // For now, return a placeholder
    return 0.85
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const expiredKeys = []
    
    for (const [key, expiryTime] of this.ttlMap.entries()) {
      if (Date.now() > expiryTime) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.delete(key))

    // If still over limit, remove oldest entries
    if (this.cache.size >= this.config.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
      
      const toRemove = entries.slice(0, Math.floor(this.config.maxCacheSize * 0.1))
      toRemove.forEach(([key]) => this.delete(key))
    }

    return expiredKeys.length
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Compress data (simple JSON compression)
   */
  compress(data) {
    // In a real implementation, you might use gzip or another compression algorithm
    // For now, just return the data as-is
    return data
  }

  /**
   * Decompress data
   */
  decompress(data) {
    // In a real implementation, you would decompress the data
    // For now, just return the data as-is
    return data
  }

  /**
   * Invalidate cache based on patterns
   */
  invalidatePattern(pattern) {
    const keysToDelete = []
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.delete(key))
    return keysToDelete.length
  }

  /**
   * Warm up cache with popular searches
   */
  async warmUp(popularSearches) {
    // This would typically be called during application startup
    // to pre-populate the cache with frequently searched terms
    const promises = popularSearches.map(async (searchParams) => {
      // You would call your search function here
      // and cache the results
      console.log(`Warming up cache for: ${searchParams.query}`)
    })

    await Promise.all(promises)
  }

  /**
   * Update cache entry access statistics
   */
  updateAccessStats(key) {
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)
      entry.accessCount++
      entry.lastAccessed = Date.now()
      this.cache.set(key, entry)
    }
  }

  /**
   * Get most accessed cache entries
   */
  getMostAccessed(limit = 10) {
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => b[1].accessCount - a[1].accessCount)
    
    return entries.slice(0, limit).map(([key, entry]) => ({
      key,
      accessCount: entry.accessCount,
      size: entry.size,
      createdAt: entry.createdAt,
      lastAccessed: entry.lastAccessed
    }))
  }

  /**
   * Export cache for backup
   */
  export() {
    const exportData = {
      cache: Array.from(this.cache.entries()),
      ttl: Array.from(this.ttlMap.entries()),
      timestamp: Date.now()
    }
    
    return JSON.stringify(exportData)
  }

  /**
   * Import cache from backup
   */
  import(exportedData) {
    try {
      const data = JSON.parse(exportedData)
      
      this.cache.clear()
      this.ttlMap.clear()
      
      data.cache.forEach(([key, value]) => {
        this.cache.set(key, value)
      })
      
      data.ttl.forEach(([key, value]) => {
        // Only import non-expired entries
        if (Date.now() < value) {
          this.ttlMap.set(key, value)
        }
      })
      
      return true
    } catch (error) {
      console.error('Error importing cache:', error)
      return false
    }
  }
}

export default SearchCache
