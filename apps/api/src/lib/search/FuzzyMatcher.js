/**
 * Advanced Fuzzy Matching Algorithm
 * Implements sophisticated string matching with relevance scoring
 */

class FuzzyMatcher {
  constructor() {
    this.config = {
      exactMatchBonus: 100,
      startMatchBonus: 50,
      containsMatchBonus: 25,
      fuzzyMatchBonus: 10,
      wordBoundaryBonus: 20,
      camelCaseBonus: 15,
      consecutiveBonus: 10,
      minScore: 0.3
    }
  }

  /**
   * Calculate fuzzy match score between query and text
   */
  calculateScore(query, text, fieldWeight = 1) {
    if (!query || !text) return 0

    const queryLower = query.toLowerCase().trim()
    const textLower = text.toLowerCase().trim()

    let score = 0

    // Exact match
    if (textLower === queryLower) {
      score += this.config.exactMatchBonus
    }

    // Starts with match
    if (textLower.startsWith(queryLower)) {
      score += this.config.startMatchBonus
    }

    // Contains match
    if (textLower.includes(queryLower)) {
      score += this.config.containsMatchBonus
    }

    // Word boundary matches
    const words = queryLower.split(/\s+/)
    words.forEach(word => {
      if (word.length >= 2) {
        const regex = new RegExp(`\\b${this.escapeRegex(word)}`, 'gi')
        const matches = textLower.match(regex)
        if (matches) {
          score += this.config.wordBoundaryBonus * matches.length
        }
      }
    })

    // Camel case matching
    if (this.hasCamelCaseMatch(queryLower, textLower)) {
      score += this.config.camelCaseBonus
    }

    // Consecutive character matching
    const consecutiveScore = this.calculateConsecutiveScore(queryLower, textLower)
    score += consecutiveScore

    // Levenshtein distance bonus
    const levenshteinScore = this.calculateLevenshteinScore(queryLower, textLower)
    score += levenshteinScore

    // Apply field weight
    score *= fieldWeight

    // Normalize score based on text length (longer texts get slight penalty)
    const lengthPenalty = Math.max(0, (textLower.length - queryLower.length) / 100)
    score = Math.max(0, score - lengthPenalty)

    return score
  }

  /**
   * Filter and rank results based on fuzzy matching
   */
  filterAndRankResults(results, query, searchFields, threshold = null) {
    if (!query || !results || results.length === 0) return results

    const scoredResults = results.map(item => {
      let totalScore = 0
      let matchCount = 0

      // Calculate score for each search field
      searchFields.forEach(field => {
        const fieldValue = this.getNestedValue(item, field)
        if (fieldValue) {
          const fieldScore = this.calculateScore(query, fieldValue.toString())
          if (fieldScore > 0) {
            totalScore += fieldScore
            matchCount++
          }
        }
      })

      // Average score across matching fields
      const averageScore = matchCount > 0 ? totalScore / matchCount : 0

      return {
        ...item,
        _searchScore: averageScore,
        _matchCount: matchCount
      }
    })

    // Filter by threshold
    const minThreshold = threshold || this.config.minScore
    const filteredResults = scoredResults.filter(item => 
      item._searchScore >= minThreshold || item._matchCount > 0
    )

    // Sort by score (descending)
    filteredResults.sort((a, b) => {
      // Primary sort by search score
      if (b._searchScore !== a._searchScore) {
        return b._searchScore - a._searchScore
      }
      
      // Secondary sort by match count
      if (b._matchCount !== a._matchCount) {
        return b._matchCount - a._matchCount
      }

      // Tertiary sort by views/popularity if available
      const aViews = a.views_count || a.karma || 0
      const bViews = b.views_count || b.karma || 0
      return bViews - aViews
    })

    // Remove search metadata from results
    return filteredResults.map(item => {
      const { _searchScore, _matchCount, ...cleanItem } = item
      return cleanItem
    })
  }

  /**
   * Check for camel case matching
   */
  hasCamelCaseMatch(query, text) {
    // Extract capital letters from text
    const capitals = text.match(/[A-Z]/g)
    if (!capitals) return false

    const capitalsString = capitals.join('').toLowerCase()
    return capitalsString.includes(query) || query.includes(capitalsString)
  }

  /**
   * Calculate consecutive character matching score
   */
  calculateConsecutiveScore(query, text) {
    let score = 0
    let consecutiveCount = 0
    let queryIndex = 0

    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        consecutiveCount++
        queryIndex++
      } else if (consecutiveCount > 0) {
        score += consecutiveCount * this.config.consecutiveBonus
        consecutiveCount = 0
      }
    }

    // Add final consecutive bonus
    if (consecutiveCount > 0) {
      score += consecutiveCount * this.config.consecutiveBonus
    }

    return score
  }

  /**
   * Calculate Levenshtein distance-based score
   */
  calculateLevenshteinScore(query, text) {
    const distance = this.levenshteinDistance(query, text)
    const maxLength = Math.max(query.length, text.length)
    
    if (maxLength === 0) return 0
    
    const similarity = 1 - (distance / maxLength)
    return similarity * this.config.fuzzyMatchBonus
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
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
   * Get nested value from object using dot notation
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

  /**
   * Highlight matching text in search results
   */
  highlightMatches(text, query) {
    if (!query || !text) return text

    const queryLower = query.toLowerCase()
    const words = queryLower.split(/\s+/).filter(word => word.length > 0)
    
    let highlightedText = text
    
    words.forEach(word => {
      const regex = new RegExp(`(${this.escapeRegex(word)})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
    })

    return highlightedText
  }

  /**
   * Extract search snippets with highlighted matches
   */
  extractSnippet(text, query, maxLength = 150) {
    if (!text || !query) return text

    const queryLower = query.toLowerCase()
    const textLower = text.toLowerCase()
    
    // Find the best position to start the snippet
    const queryIndex = textLower.indexOf(queryLower)
    
    if (queryIndex === -1) {
      // No exact match found, return beginning of text
      return text.length <= maxLength ? text : text.substring(0, maxLength) + '...'
    }

    // Calculate snippet boundaries
    const snippetStart = Math.max(0, queryIndex - Math.floor((maxLength - query.length) / 2))
    const snippetEnd = Math.min(text.length, snippetStart + maxLength)

    let snippet = text.substring(snippetStart, snippetEnd)
    
    // Add ellipsis if needed
    if (snippetStart > 0) snippet = '...' + snippet
    if (snippetEnd < text.length) snippet = snippet + '...'

    return this.highlightMatches(snippet, query)
  }
}

export default FuzzyMatcher
