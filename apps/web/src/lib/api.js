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
  getDeals: (params) => {
    const searchParams = new URLSearchParams(params)
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

  getUserFollowers: async (userId) => {
    return await apiRequest(`/api/users/${userId}/followers`)
  },
  
  getUserActivity: async (userId, options = {}) => {
    const params = new URLSearchParams(options)
    return await apiRequest(`/api/users/${userId}/activity?${params}`)
  },
  
  getUserStats: async (userId) => {
    return await apiRequest(`/api/users/${userId}/stats`)
  },
  
  getUserBadges: async (userId) => {
    return await apiRequest(`/api/users/${userId}/badges`)
  },
  
  getUserReputation: async (userId) => {
    return await apiRequest(`/api/users/${userId}/reputation`)
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
    return apiRequest(`/api/admin/deals${params}`)
  },
  
  approveDeal: (id, edits) => apiRequest(`/api/admin/deals/${id}/approve`, {
    method: 'POST',
    body: edits || {},
  }),
  
  rejectDeal: (id, reason) => apiRequest(`/api/admin/deals/${id}/reject`, {
    method: 'POST',
    body: { reason },
  }),
  
  expireDeal: (id) => apiRequest(`/api/admin/deals/${id}/expire`, {
    method: 'POST',
  }),
  
  checkAdmin: () => apiRequest('/api/admin/whoami'),
  
  getAdminAnalytics: (timeRange = '7d') => apiRequest(`/api/admin/analytics?range=${timeRange}`),
  
  getUserManagement: (filters = {}) => {
    const params = new URLSearchParams(filters)
    return apiRequest(`/api/admin/users?${params}`)
  },
  
  bulkModeratePosts: (action, postIds) => apiRequest('/api/admin/bulk-moderate', {
    method: 'POST',
    body: { action, postIds },
  }),
}
