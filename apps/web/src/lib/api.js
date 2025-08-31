const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  }

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body)
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const error = await response.text()
      throw new ApiError(error || 'Request failed', response.status)
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    
    return await response.text()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Network error', 0)
  }
}

export async function apiAuth(endpoint, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...getAuthHeaders(),
    },
  });
}

// Helper function to handle API errors consistently
function handleApiError(error, fallbackData = null) {
  console.error('API Error:', error)
  if (fallbackData) {
    console.warn('Using fallback data due to API error')
    return fallbackData
  }
  throw error
}



export const api = {
  // Tags
  getTags: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    return apiRequest(`/api/tags?${searchParams}`)
  },

  getPopularTags: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    return apiRequest(`/api/tags/popular?${searchParams}`)
  },

  suggestTags: (title, description = '', maxSuggestions = 10) => apiRequest('/api/tags/suggest', {
    method: 'POST',
    body: { title, description, max_suggestions: maxSuggestions },
  }),

  createTag: (tagData) => apiRequest('/api/tags', {
    method: 'POST',
    body: tagData,
  }),

  updateTag: (tagId, tagData) => apiRequest(`/api/tags/${tagId}`, {
    method: 'PUT',
    body: tagData,
  }),

  deleteTag: (tagId) => apiRequest(`/api/tags/${tagId}`, {
    method: 'DELETE',
  }),

  addTagsToDeals: (dealId, tagIds) => apiRequest(`/api/deals/${dealId}/tags`, {
    method: 'POST',
    body: { tag_ids: tagIds },
  }),

  addTagsToCoupon: (couponId, tagIds) => apiRequest(`/api/coupons/${couponId}/tags`, {
    method: 'POST',
    body: { tag_ids: tagIds },
  }),
  // Authentication
  signUp: (credentials) => apiRequest('/api/auth/signup', {
    method: 'POST',
    body: credentials,
  }),
  
  signIn: (credentials) => apiRequest('/api/auth/signin', {
    method: 'POST',
    body: credentials,
  }),
  
  signOut: () => apiRequest('/api/auth/signout', {
    method: 'POST',
  }),
  
  refreshToken: (refreshToken) => apiRequest('/api/auth/refresh', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  }),
  
  getCurrentUser: () => apiRequest('/api/auth/me'),
  
  updateProfile: (profileData) => apiRequest('/api/auth/profile', {
    method: 'PUT',
    body: profileData,
  }),

  // Deals
  getDeals: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (key === 'tags' && Array.isArray(value)) {
          // Handle tag arrays
          value.forEach(tagId => searchParams.append('tags', tagId.toString()))
        } else {
          searchParams.append(key, value.toString())
        }
      }
    })
    return apiRequest(`/api/deals?${searchParams}`)
  },
  
  getDeal: (id) => apiRequest(`/api/deals/${id}`),
  
  createDeal: (deal) => apiRequest('/api/deals', {
    method: 'POST',
    body: deal,
  }),
  
  voteDeal: (id, value) => apiRequest(`/api/deals/${id}/vote`, {
    method: 'POST',
    body: { value },
  }),
  
  commentDeal: (id, body, parentId = null) => apiRequest(`/api/deals/${id}/comment`, {
    method: 'POST',
    body: { body, parent_id: parentId },
  }),
  
  // Categories
  getCategories: (params = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiRequest(`/api/categories?${searchParams}`)
  },
  
  getCategory: (slug) => apiRequest(`/api/categories/${slug}`),
  
  // Collections
  getCollections: (params = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiRequest(`/api/collections?${searchParams}`)
  },
  
  getCollection: (slug) => apiRequest(`/api/collections/${slug}`),
  
  // Banners
  getBanners: (params = {}) => {
    const searchParams = new URLSearchParams(params)
    return apiRequest(`/api/banners?${searchParams}`)
  },
  
  // Deal Tags
  getDealTags: () => apiRequest('/api/deal-tags'),

  // Users
  getUser: (handle) => apiRequest(`/api/users/${handle}`),
  
  updateProfile: (handle, profileData) => apiRequest(`/api/users/${handle}`, {
    method: 'PUT',
    body: profileData,
  }),
  
  uploadAvatar: (handle, file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiRequest(`/api/users/${handle}/avatar`, {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type to let browser set it with boundary
    })
  },
  
  followUser: (handle) => apiRequest(`/api/users/${handle}/follow`, {
    method: 'POST',
  }),
  
  getUserFollowers: (handle, page = 1) => {
    const params = new URLSearchParams({ page: page.toString() })
    return apiRequest(`/api/users/${handle}/followers?${params}`)
  },
  
  getUserFollowing: (handle, page = 1) => {
    const params = new URLSearchParams({ page: page.toString() })
    return apiRequest(`/api/users/${handle}/following?${params}`)
  },
  
  getUserAchievements: (handle) => apiRequest(`/api/users/${handle}/achievements`),
  
  getUserActivity: (handle, page = 1) => {
    const params = new URLSearchParams({ page: page.toString() })
    return apiRequest(`/api/users/${handle}/activity?${params}`)
  },

  // Leaderboard
  getLeaderboard: (period = 'all_time', limit = 50) => {
    const params = new URLSearchParams({ limit: limit.toString() })
    return apiRequest(`/api/users/leaderboard/${period}?${params}`)
  },

  // Deal Images
  uploadDealImages: (dealId, files) => {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append('images', file)
    })
    return apiRequest(`/api/deals/${dealId}/images`, {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type to let browser set it with boundary
    })
  },

  // Coupons
  listCoupons: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    return apiRequest(`/api/coupons?${searchParams}`)
  },

  getCoupon: (id) => apiRequest(`/api/coupons/${id}`),

  createCoupon: (couponData) => apiRequest('/api/coupons', {
    method: 'POST',
    body: couponData,
  }),

  uploadCouponImages: (couponId, files) => {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append('images', file)
    })
    return apiRequest(`/api/coupons/${couponId}/images`, {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type to let browser set it with boundary
    })
  },

  voteCoupon: (couponId, value) => apiRequest(`/api/coupons/${couponId}/vote`, {
    method: 'POST',
    body: { value },
  }),

  useCoupon: (couponId, orderAmount, wasSuccessful = true) => apiRequest(`/api/coupons/${couponId}/use`, {
    method: 'POST',
    body: { order_amount: orderAmount, was_successful: wasSuccessful },
  }),

  addCouponComment: (couponId, body, parentId = null) => apiRequest(`/api/coupons/${couponId}/comments`, {
    method: 'POST',
    body: { body, parent_id: parentId },
  }),

  // Companies
  getCompanies: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    return apiRequest(`/api/companies?${searchParams}`)
  },

  getCompany: (slug) => apiRequest(`/api/companies/${slug}`),

  getCompanyDeals: (slug, params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    return apiRequest(`/api/companies/${slug}/deals?${searchParams}`)
  },

  getCompanyCoupons: (slug, params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    return apiRequest(`/api/companies/${slug}/coupons?${searchParams}`)
  },

  getCompanyCategories: () => apiRequest('/api/companies/categories'),

  // Admin APIs
  getAdminDashboard: () => apiRequest('/api/admin/dashboard'),
  
  getPendingDeals: (page = 1) => {
    const params = new URLSearchParams({ page: page.toString() })
    return apiRequest(`/api/admin/deals/pending?${params}`)
  },
  
  getPendingCoupons: (page = 1) => {
    const params = new URLSearchParams({ page: page.toString() })
    return apiRequest(`/api/admin/coupons/pending?${params}`)
  },
  
  reviewDeal: (dealId, action, rejectionReason = null) => apiRequest(`/api/admin/deals/${dealId}/review`, {
    method: 'POST',
    body: { action, rejection_reason: rejectionReason },
  }),
  
  reviewCoupon: (couponId, action, rejectionReason = null) => apiRequest(`/api/admin/coupons/${couponId}/review`, {
    method: 'POST',
    body: { action, rejection_reason: rejectionReason },
  }),
  
  getAdminUsers: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    return apiRequest(`/api/admin/users?${searchParams}`)
  },
  
  updateUserRole: (userId, role) => apiRequest(`/api/admin/users/${userId}/role`, {
    method: 'POST',
    body: { role },
  }),
  
  getAdminAnalytics: (period = '30') => {
    const params = new URLSearchParams({ period })
    return apiRequest(`/api/admin/analytics?${params}`)
  },
  
  featureDeal: (dealId, featured) => apiRequest(`/api/admin/deals/${dealId}/feature`, {
    method: 'POST',
    body: { featured },
  }),
  
  featureCoupon: (couponId, featured) => apiRequest(`/api/admin/coupons/${couponId}/feature`, {
    method: 'POST',
    body: { featured },
  }),

  // Company management APIs
  createCompany: (companyData) => apiRequest('/api/companies', {
    method: 'POST',
    body: companyData,
  }),

  updateCompany: (companyId, companyData) => apiRequest(`/api/companies/${companyId}`, {
    method: 'PUT',
    body: companyData,
  }),

  uploadCompanyLogo: (companyId, logoFile) => {
    const formData = new FormData()
    formData.append('logo', logoFile)
    
    return fetch(`${API_BASE_URL}/api/companies/${companyId}/logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }
      return response.json()
    })
  },

  // Enhanced deal features
  getSimilarDeals: async (dealId, params = {}) => {
    const searchParams = new URLSearchParams(params)
    return await apiRequest(`/api/deals/${dealId}/similar?${searchParams}`)
  },
  
  trackDealView: (dealId) => apiRequest(`/api/deals/${dealId}/view`, {
    method: 'POST',
  }),
  
  reportDeal: (dealId, reason) => apiRequest(`/api/deals/${dealId}/report`, {
    method: 'POST',
    body: { reason },
  }),
  
  rateDeal: (dealId, rating) => apiRequest(`/api/deals/${dealId}/rate`, {
    method: 'POST',
    body: { rating },
  }),
  
  // Deal alerts
  getDealAlerts: async (dealId) => {
    return await apiRequest(`/api/deals/${dealId}/alerts`)
  },
  
  createDealAlert: (alertData) => apiRequest('/api/deal-alerts', {
    method: 'POST',
    body: alertData,
  }),
  
  deleteDealAlert: (alertId) => apiRequest(`/api/deal-alerts/${alertId}`, {
    method: 'DELETE',
  }),
  
  // Store ratings
  getStoreRating: async (merchant) => {
    return await apiRequest(`/api/stores/${encodeURIComponent(merchant)}/rating`)
  },
  
  // Deal reviews
  submitDealReview: (dealId, reviewData) => apiRequest(`/api/deals/${dealId}/reviews`, {
    method: 'POST',
    body: reviewData,
  }),
  
  voteOnReview: (reviewId, helpful) => apiRequest(`/api/reviews/${reviewId}/vote`, {
    method: 'POST',
    body: { helpful },
  }),
  
  // Search
  searchDeals: (query, filters = {}) => {
    const params = new URLSearchParams({ q: query, ...filters })
    return apiRequest(`/api/search/deals?${params}`)
  },
  
  getSearchSuggestions: (query) => apiRequest(`/api/search/suggestions?q=${encodeURIComponent(query)}`),
  
  saveSearch: (searchData) => apiRequest('/api/searches', {
    method: 'POST',
    body: searchData,
  }),
  
  getSavedSearches: () => apiRequest('/api/searches'),
  
  // Users
  getUserProfile: async (handle) => {
    return await apiRequest(`/api/users/${handle}`)
  },
  
  followUser: (userId) => apiRequest(`/api/users/${userId}/follow`, {
    method: 'POST',
  }),
  
  unfollowUser: (userId) => apiRequest(`/api/users/${userId}/unfollow`, {
    method: 'POST',
  }),
  
    isFollowing: async (userId) => {
    return await apiRequest(`/api/users/${userId}/following`)
  },

  getUserFollowers: async (handle) => {
    return await apiRequest(`/api/users/${handle}/followers`)
  },
  
  getUserActivity: async (handle, options = {}) => {
    const params = new URLSearchParams(options)
    return await apiRequest(`/api/users/${handle}/activity?${params}`)
  },
  
  getUserStats: async (handle) => {
    return await apiRequest(`/api/users/${handle}/stats`)
  },
  
  getUserBadges: async (handle) => {
    return await apiRequest(`/api/users/${handle}/badges`)
  },
  
  getUserReputation: async (handle) => {
    return await apiRequest(`/api/users/${handle}/reputation`)
  },
  
  getUserAchievements: async (userId) => {
    return await apiRequest(`/api/users/${userId}/achievements`)
  },
  
  sendMessage: async (messageData) => {
    return await apiRequest('/api/messages', {
      method: 'POST',
      body: messageData,
    })
  },
  
  updateUserPreferences: (preferences) => apiRequest('/api/user/preferences', {
    method: 'PUT',
    body: preferences,
  }),

  // Enhanced Forum APIs
  searchUsers: async (query) => {
    return await apiRequest(`/api/users/search?q=${encodeURIComponent(query)}`)
  },

  // Thread Subscription APIs
  getThreadSubscription: async (threadId) => {
    return await apiRequest(`/api/threads/${threadId}/subscription`)
  },

  subscribeToThread: async (threadId, options) => {
    return await apiRequest(`/api/threads/${threadId}/subscription`, {
      method: 'POST',
      body: options
    })
  },

  unsubscribeFromThread: async (threadId) => {
    return await apiRequest(`/api/threads/${threadId}/subscription`, {
      method: 'DELETE'
    })
  },

  updateThreadSubscription: async (threadId, updates) => {
    return await apiRequest(`/api/threads/${threadId}/subscription`, {
      method: 'PUT',
      body: updates
    })
  },

  getUserThreadSubscriptions: async (userId) => {
    return await apiRequest(`/api/users/${userId}/subscriptions`)
  },

  // Enhanced Moderation APIs
  getUserPermissions: async () => {
    return await apiRequest('/api/user/permissions')
  },

  banUser: async (userId, options) => {
    return await apiRequest(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      body: options
    })
  },

  warnUser: async (userId, reason) => {
    return await apiRequest(`/api/admin/users/${userId}/warn`, {
      method: 'POST',
      body: { reason }
    })
  },

  logModerationAction: async (actionData) => {
    return await apiRequest('/api/admin/moderation-log', {
      method: 'POST',
      body: actionData
    })
  },

  getForums: async () => {
    return await apiRequest('/api/forums')
  },
  
  // Notifications
  getNotifications: (unreadOnly = false) => apiRequest(`/api/notifications?unread=${unreadOnly}`),
  
  markNotificationRead: (notificationId) => apiRequest(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
  }),
  
  createNotificationSubscription: (subscription) => apiRequest('/api/notifications/subscribe', {
    method: 'POST',
    body: subscription,
  }),
  
  // Analytics
  trackEvent: (eventName, properties = {}) => apiRequest('/api/analytics/track', {
    method: 'POST',
    body: { event: eventName, properties },
  }),
  
  getPersonalizedDeals: () => apiRequest('/api/deals/personalized'),
  
  getDealRecommendations: (dealId) => apiRequest(`/api/deals/${dealId}/recommendations`),
  
  // Admin
  getAdminDeals: (status) => {
    const params = status ? `?status=${status}` : ''
    return apiAuth(`/api/admin/deals${params}`)
  },
  
  approveDeal: (id, edits) => apiAuth(`/api/admin/deals/${id}/approve`, {
    method: 'POST',
    body: edits || {},
  }),
  
  rejectDeal: (id, reason) => apiAuth(`/api/admin/deals/${id}/reject`, {
    method: 'POST',
    body: { reason },
  }),
  
  expireDeal: (id) => apiAuth(`/api/admin/deals/${id}/expire`, {
    method: 'POST',
  }),
  
  checkAdmin: () => apiAuth('/api/admin/whoami'),
  
  getAdminAnalytics: (timeRange = '7d') => apiRequest(`/api/admin/analytics?range=${timeRange}`),
  
  getUserManagement: (filters = {}) => {
    const params = new URLSearchParams(filters)
    return apiRequest(`/api/admin/users?${params}`)
  },
  
  bulkModeratePosts: (action, postIds) => apiRequest('/api/admin/bulk-moderate', {
    method: 'POST',
    body: { action, postIds },
  }),

  // ===== NEW FEATURE APIs =====

  // Saved Searches & Follow Alerts
  savedSearches: {
    create: (searchData) => apiRequest('/api/saved-searches', {
      method: 'POST',
      body: searchData,
    }),
    
    list: () => apiRequest('/api/saved-searches'),
    
    update: (searchId, updates) => apiRequest(`/api/saved-searches/${searchId}`, {
      method: 'PUT',
      body: updates,
    }),
    
    delete: (searchId) => apiRequest(`/api/saved-searches/${searchId}`, {
      method: 'DELETE',
    }),
    
    toggle: (searchId) => apiRequest(`/api/saved-searches/${searchId}/toggle`, {
      method: 'POST',
    }),
  },

  notifications: {
    getPreferences: () => apiRequest('/api/notification-preferences'),
    
    updatePreferences: (preferences) => apiRequest('/api/notification-preferences', {
      method: 'PUT',
      body: preferences,
    }),
    
    getQueue: (params = {}) => {
      const searchParams = new URLSearchParams(params)
      return apiRequest(`/api/notifications?${searchParams}`)
    },
    
    markAsRead: (notificationIds) => apiRequest('/api/notifications/mark-read', {
      method: 'POST',
      body: { notification_ids: notificationIds },
    }),
  },

  // Price Tracking & Countdown
  priceTracking: {
    getDealHistory: (dealId, days = 30) => apiRequest(`/api/price-tracking/deals/${dealId}/history?days=${days}`),
    
    getDealCountdown: (dealId) => apiRequest(`/api/price-tracking/deals/${dealId}/countdown`),
    
    createAlert: (alertData) => apiRequest('/api/price-tracking/alerts', {
      method: 'POST',
      body: alertData,
    }),
    
    getUserAlerts: () => apiRequest('/api/price-tracking/alerts'),
    
    updateAlert: (alertId, updates) => apiRequest(`/api/price-tracking/alerts/${alertId}`, {
      method: 'PUT',
      body: updates,
    }),
    
    deleteAlert: (alertId) => apiRequest(`/api/price-tracking/alerts/${alertId}`, {
      method: 'DELETE',
    }),
    
    getExpiringDeals: (days = 7) => apiRequest(`/api/price-tracking/expiring?days=${days}`),
    
    markExpired: (dealIds) => apiRequest('/api/price-tracking/mark-expired', {
      method: 'POST',
      body: { deal_ids: dealIds },
    }),
  },

  // Auto-Tagging
  autoTagging: {
    autoTagDeal: (dealData) => apiRequest('/api/auto-tagging/deals', {
      method: 'POST',
      body: dealData,
    }),
    
    getMerchantPatterns: () => apiRequest('/api/auto-tagging/merchant-patterns'),
    
    createMerchantPattern: (patternData) => apiRequest('/api/auto-tagging/merchant-patterns', {
      method: 'POST',
      body: patternData,
    }),
    
    updateMerchantPattern: (patternId, updates) => apiRequest(`/api/auto-tagging/merchant-patterns/${patternId}`, {
      method: 'PUT',
      body: updates,
    }),
    
    deleteMerchantPattern: (patternId) => apiRequest(`/api/auto-tagging/merchant-patterns/${patternId}`, {
      method: 'DELETE',
    }),
    
    getCategoryPatterns: () => apiRequest('/api/auto-tagging/category-patterns'),
    
    createCategoryPattern: (patternData) => apiRequest('/api/auto-tagging/category-patterns', {
      method: 'POST',
      body: patternData,
    }),
    
    updateCategoryPattern: (patternId, updates) => apiRequest(`/api/auto-tagging/category-patterns/${patternId}`, {
      method: 'PUT',
      body: updates,
    }),
    
    deleteCategoryPattern: (patternId) => apiRequest(`/api/auto-tagging/category-patterns/${patternId}`, {
      method: 'DELETE',
    }),
    
    getTaggingLog: (params = {}) => {
      const searchParams = new URLSearchParams(params)
      return apiRequest(`/api/auto-tagging/log?${searchParams}`)
    },
    
    getTaggingStats: () => apiRequest('/api/auto-tagging/stats'),
  },

  // Gamification
  gamification: {
    getUserXP: (userId) => apiRequest(`/api/gamification/users/${userId}/xp`),
    
    getUserLevel: (userId) => apiRequest(`/api/gamification/users/${userId}/level`),
    
    getUserAchievements: (userId) => apiRequest(`/api/gamification/users/${userId}/achievements`),
    
    getAchievements: () => apiRequest('/api/gamification/achievements'),
    
    getLeaderboard: (params = {}) => {
      const searchParams = new URLSearchParams(params)
      return apiRequest(`/api/gamification/leaderboard?${searchParams}`)
    },
    
    awardXP: (userId, xpData) => apiRequest(`/api/gamification/users/${userId}/xp`, {
      method: 'POST',
      body: xpData,
    }),
    
    checkAchievements: (userId) => apiRequest(`/api/gamification/users/${userId}/check-achievements`, {
      method: 'POST',
    }),
    
    getXPConfig: () => apiRequest('/api/gamification/xp-config'),
    
    updateXPConfig: (config) => apiRequest('/api/gamification/xp-config', {
      method: 'PUT',
      body: config,
    }),
  },
}
