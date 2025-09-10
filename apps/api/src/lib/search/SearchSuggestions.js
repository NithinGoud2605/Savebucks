/**
 * Intelligent Search Suggestions System
 * Provides auto-complete, spell correction, and query suggestions
 */

import { makeAdminClient } from '../supa.js'

class SearchSuggestions {
  constructor() {
    this.supabase = makeAdminClient()
    this.suggestionCache = new Map()
    this.popularTerms = new Set()
    this.config = {
      maxSuggestions: 10,
      minQueryLength: 2,
      cacheTimeout: 600000, // 10 minutes
      popularityThreshold: 5,
      enableSpellCorrection: true,
      enableAutoComplete: true
    }

    // Initialize popular terms
    this.initializePopularTerms()
  }

  /**
   * Generate search suggestions based on query and results
   */
  async generateSuggestions(query, searchResults) {
    const suggestions = []

    try {
      // Auto-complete suggestions
      if (this.config.enableAutoComplete) {
        const autoComplete = await this.getAutoCompleteSuggestions(query)
        suggestions.push(...autoComplete)
      }

      // Spell correction suggestions
      if (this.config.enableSpellCorrection) {
        const spellCorrections = await this.getSpellCorrections(query)
        suggestions.push(...spellCorrections)
      }

      // Related terms from search results
      const relatedTerms = this.extractRelatedTerms(query, searchResults)
      suggestions.push(...relatedTerms)

      // Popular search suggestions
      const popularSuggestions = await this.getPopularSuggestions(query)
      suggestions.push(...popularSuggestions)

      // Category-based suggestions
      const categorySuggestions = await this.getCategorySuggestions(query)
      suggestions.push(...categorySuggestions)

      // Remove duplicates and rank suggestions
      const uniqueSuggestions = this.removeDuplicates(suggestions)
      const rankedSuggestions = this.rankSuggestions(uniqueSuggestions, query)

      return rankedSuggestions.slice(0, this.config.maxSuggestions)
    } catch (error) {
      console.error('Error generating suggestions:', error)
      return []
    }
  }

  /**
   * Get auto-complete suggestions
   */
  async getAutoCompleteSuggestions(query) {
    if (query.length < this.config.minQueryLength) return []

    const cacheKey = `autocomplete_${query}`
    if (this.suggestionCache.has(cacheKey)) {
      const cached = this.suggestionCache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.suggestions
      }
    }

    const suggestions = []

    try {
      // Search in tags first (highest priority)
      const { data: tags } = await this.supabase
        .from('tags')
        .select('name, slug, usage_count')
        .or(`name.ilike.${query}%,slug.ilike.${query}%`)
        .order('usage_count', { ascending: false })
        .limit(5)

      tags?.forEach(tag => {
        suggestions.push({
          text: tag.name,
          type: 'tag',
          source: 'tags',
          score: 12,
          slug: tag.slug,
          usage: tag.usage_count
        })
      })

      // Search in deals
      const { data: deals } = await this.supabase
        .from('deals')
        .select('title, merchant')
        .ilike('title', `${query}%`)
        .eq('status', 'approved')
        .limit(5)

      deals?.forEach(deal => {
        if (deal.title && deal.title.toLowerCase().startsWith(query.toLowerCase())) {
          suggestions.push({
            text: deal.title,
            type: 'deal_title',
            source: 'deals',
            score: 10
          })
        }
        if (deal.merchant && deal.merchant.toLowerCase().startsWith(query.toLowerCase())) {
          suggestions.push({
            text: deal.merchant,
            type: 'merchant',
            source: 'deals',
            score: 8
          })
        }
      })

      // Search in companies
      const { data: companies } = await this.supabase
        .from('companies')
        .select('name')
        .ilike('name', `${query}%`)
        .limit(5)

      companies?.forEach(company => {
        suggestions.push({
          text: company.name,
          type: 'company',
          source: 'companies',
          score: 9
        })
      })

      // Search in user profiles
      const { data: users } = await this.supabase
        .from('profiles')
        .select('handle, display_name, first_name, last_name')
        .or(`handle.ilike.${query}%,display_name.ilike.${query}%,first_name.ilike.${query}%,last_name.ilike.${query}%`)
        .limit(3)

      users?.forEach(user => {
        if (user.handle?.toLowerCase().startsWith(query.toLowerCase())) {
          suggestions.push({
            text: user.handle,
            type: 'user_handle',
            source: 'users',
            score: 7
          })
        }
        if (user.display_name?.toLowerCase().startsWith(query.toLowerCase())) {
          suggestions.push({
            text: user.display_name,
            type: 'user_name',
            source: 'users',
            score: 6
          })
        }
      })

      // Cache the suggestions
      this.suggestionCache.set(cacheKey, {
        suggestions,
        timestamp: Date.now()
      })

      return suggestions
    } catch (error) {
      console.error('Error getting auto-complete suggestions:', error)
      return []
    }
  }

  /**
   * Get spell correction suggestions
   */
  async getSpellCorrections(query) {
    const suggestions = []
    const words = query.toLowerCase().split(/\s+/)

    // Check each word for potential misspellings
    for (const word of words) {
      if (word.length < 3) continue

      // Check against popular terms
      const corrections = this.findSimilarTerms(word, Array.from(this.popularTerms))
      corrections.forEach(correction => {
        if (correction.distance <= 2) { // Max edit distance of 2
          const correctedQuery = query.replace(new RegExp(word, 'gi'), correction.term)
          suggestions.push({
            text: correctedQuery,
            type: 'spell_correction',
            source: 'spell_checker',
            score: 5 - correction.distance,
            original: query
          })
        }
      })
    }

    return suggestions
  }

  /**
   * Extract related terms from search results
   */
  extractRelatedTerms(query, searchResults) {
    const suggestions = []
    const queryWords = new Set(query.toLowerCase().split(/\s+/))

    // Extract terms from deal titles
    searchResults.deals?.forEach(deal => {
      if (deal.title) {
        const titleWords = deal.title.toLowerCase().split(/\s+/)
        titleWords.forEach(word => {
          if (word.length > 3 && !queryWords.has(word) && this.isValidTerm(word)) {
            suggestions.push({
              text: word,
              type: 'related_term',
              source: 'deal_titles',
              score: 4
            })
          }
        })
      }
    })

    // Extract terms from company names
    searchResults.companies?.forEach(company => {
      if (company.name) {
        const nameWords = company.name.toLowerCase().split(/\s+/)
        nameWords.forEach(word => {
          if (word.length > 2 && !queryWords.has(word) && this.isValidTerm(word)) {
            suggestions.push({
              text: word,
              type: 'related_company',
              source: 'company_names',
              score: 3
            })
          }
        })
      }
    })

    return suggestions
  }

  /**
   * Get popular search suggestions
   */
  async getPopularSuggestions(query) {
    const suggestions = []

    // Get terms that start with the query
    this.popularTerms.forEach(term => {
      if (term.toLowerCase().startsWith(query.toLowerCase()) && term.toLowerCase() !== query.toLowerCase()) {
        suggestions.push({
          text: term,
          type: 'popular_search',
          source: 'popular_terms',
          score: 6
        })
      }
    })

    return suggestions
  }

  /**
   * Get category-based suggestions
   */
  async getCategorySuggestions(query) {
    const suggestions = []

    try {
      const { data: categories } = await this.supabase
        .from('categories')
        .select('name, slug')
        .ilike('name', `%${query}%`)
        .limit(3)

      categories?.forEach(category => {
        suggestions.push({
          text: category.name,
          type: 'category',
          source: 'categories',
          score: 5,
          slug: category.slug
        })
      })

      return suggestions
    } catch (error) {
      console.error('Error getting category suggestions:', error)
      return []
    }
  }

  /**
   * Remove duplicate suggestions
   */
  removeDuplicates(suggestions) {
    const seen = new Set()
    return suggestions.filter(suggestion => {
      const key = suggestion.text.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Rank suggestions by relevance
   */
  rankSuggestions(suggestions, query) {
    return suggestions.sort((a, b) => {
      // Primary sort by score
      if (b.score !== a.score) {
        return b.score - a.score
      }

      // Secondary sort by text similarity to query
      const aDistance = this.calculateEditDistance(query.toLowerCase(), a.text.toLowerCase())
      const bDistance = this.calculateEditDistance(query.toLowerCase(), b.text.toLowerCase())
      
      if (aDistance !== bDistance) {
        return aDistance - bDistance
      }

      // Tertiary sort by text length (shorter is better)
      return a.text.length - b.text.length
    })
  }

  /**
   * Find similar terms using edit distance
   */
  findSimilarTerms(word, termList, maxDistance = 2) {
    const similar = []

    termList.forEach(term => {
      const distance = this.calculateEditDistance(word, term.toLowerCase())
      if (distance <= maxDistance && distance > 0) {
        similar.push({ term, distance })
      }
    })

    return similar.sort((a, b) => a.distance - b.distance)
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  calculateEditDistance(str1, str2) {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Check if a term is valid for suggestions
   */
  isValidTerm(term) {
    // Filter out common stop words and invalid terms
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is', 'are', 'was',
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'can', 'a', 'an'
    ])

    return !stopWords.has(term.toLowerCase()) && 
           /^[a-zA-Z0-9\s-]+$/.test(term) && 
           term.length >= 2
  }

  /**
   * Initialize popular terms from database
   */
  async initializePopularTerms() {
    try {
      // Get popular deal titles
      const { data: deals } = await this.supabase
        .from('deals')
        .select('title, merchant')
        .eq('status', 'approved')
        .order('views_count', { ascending: false })
        .limit(100)

      deals?.forEach(deal => {
        if (deal.title) {
          deal.title.split(/\s+/).forEach(word => {
            if (this.isValidTerm(word)) {
              this.popularTerms.add(word.toLowerCase())
            }
          })
        }
        if (deal.merchant && this.isValidTerm(deal.merchant)) {
          this.popularTerms.add(deal.merchant.toLowerCase())
        }
      })

      // Get popular company names
      const { data: companies } = await this.supabase
        .from('companies')
        .select('name')
        .limit(50)

      companies?.forEach(company => {
        if (company.name && this.isValidTerm(company.name)) {
          this.popularTerms.add(company.name.toLowerCase())
        }
      })

      console.log(`Initialized ${this.popularTerms.size} popular terms for suggestions`)
    } catch (error) {
      console.error('Error initializing popular terms:', error)
    }
  }

  /**
   * Update popular terms periodically
   */
  async updatePopularTerms() {
    await this.initializePopularTerms()
  }

  /**
   * Get suggestions for a specific query
   */
  async getSuggestions(query, limit = 10) {
    if (!query || query.length < this.config.minQueryLength) {
      return []
    }

    const suggestions = await this.generateSuggestions(query, { deals: [], companies: [], users: [] })
    return suggestions.slice(0, limit)
  }

  /**
   * Record a successful suggestion usage
   */
  recordSuggestionUsage(suggestion, originalQuery) {
    // In a real implementation, you would track suggestion effectiveness
    console.log(`Suggestion used: "${suggestion}" for query "${originalQuery}"`)
  }

  /**
   * Get trending search terms
   */
  async getTrendingTerms(limit = 10) {
    // In a real implementation, this would analyze recent search patterns
    // For now, return a subset of popular terms
    const trending = Array.from(this.popularTerms).slice(0, limit)
    return trending.map(term => ({
      term,
      trend: 'up', // 'up', 'down', 'stable'
      change: Math.floor(Math.random() * 50) + 10 // Mock percentage change
    }))
  }

  /**
   * Clear suggestion cache
   */
  clearCache() {
    this.suggestionCache.clear()
  }

  /**
   * Get suggestion statistics
   */
  getStats() {
    return {
      cached_suggestions: this.suggestionCache.size,
      popular_terms: this.popularTerms.size,
      cache_hit_rate: 0.75, // Mock value
      avg_suggestions_per_query: 6.3 // Mock value
    }
  }
}

export default SearchSuggestions
