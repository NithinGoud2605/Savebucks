const API_BASE = import.meta.env.VITE_API_BASE || ''

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

export async function apiRequest(endpoint, options = {}, retryCount = 0) {
  const url = `${API_BASE}${endpoint}`

  const config = {
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  }

  // Only set Content-Type and stringify if it's not FormData
  if (config.body && !(config.body instanceof FormData)) {
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }
    if (typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body)
    }
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.text()

      // Check if it's a JWT expiration error and we haven't retried yet
      if ((error.includes('JWT expired') || error.includes('expired') || error.includes('invalid JWT') || error.includes('token is expired')) && retryCount === 0) {
        console.log('🔄 JWT expired, attempting token refresh...')

        // Try to refresh the token
        try {
          const refreshToken = localStorage.getItem('refresh_token')
          if (refreshToken) {
            const refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refresh_token: refreshToken }),
            })

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              localStorage.setItem('access_token', refreshData.session.access_token)
              localStorage.setItem('refresh_token', refreshData.session.refresh_token)

              // Also update Supabase token if it exists
              const supabaseToken = localStorage.getItem('sb-ixkhkzjhelyumdplutbz-auth-token')
              if (supabaseToken) {
                try {
                  const tokenData = JSON.parse(supabaseToken)
                  tokenData.access_token = refreshData.session.access_token
                  tokenData.refresh_token = refreshData.session.refresh_token
                  localStorage.setItem('sb-ixkhkzjhelyumdplutbz-auth-token', JSON.stringify(tokenData))
                } catch (e) {
                  console.warn('Failed to update Supabase token:', e)
                }
              }

              console.log('✅ Token refresh successful, retrying request...')
              // Retry the original request with new token
              return apiRequest(endpoint, options, retryCount + 1)
            } else {
              console.error('❌ Token refresh failed:', await refreshResponse.text())
              // Clear invalid tokens
              localStorage.removeItem('access_token')
              localStorage.removeItem('refresh_token')
              localStorage.removeItem('sb-ixkhkzjhelyumdplutbz-auth-token')
              // Show user-friendly error message
              throw new ApiError('Session expired. Please login again.', 401)
            }
          } else {
            console.error('❌ No refresh token available')
            // Clear invalid tokens
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('sb-ixkhkzjhelyumdplutbz-auth-token')
            throw new ApiError('Session expired. Please login again.', 401)
          }
        } catch (refreshError) {
          console.error('❌ Token refresh error:', refreshError)
          // Clear invalid tokens
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('sb-ixkhkzjhelyumdplutbz-auth-token')
          throw new ApiError('Session expired. Please login again.', 401)
        }
      }

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

  updateAuthProfile: (profileData) => apiRequest('/api/auth/profile', {
    method: 'PUT',
    body: profileData,
  }),

  // Password Reset
  requestPasswordReset: (email) => apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: { email },
  }),

  updatePassword: (password) => apiRequest('/api/auth/update-password', {
    method: 'PUT',
    body: { password },
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

  getDeal: (id) => {
    const normalizedId = String(id)
    return apiRequest(`/api/deals/${normalizedId}`)
  },
  getRelatedDeals: (categoryId, excludeId) => apiRequest(`/api/deals?category_id=${categoryId}&exclude=${excludeId}&limit=6&sort=popular`),
  getDealComments: (id) => apiRequest(`/api/deals/${id}/comments`),

  // Reviews
  getDealReviews: (dealId, options = {}) => {
    const normalizedDealId = String(dealId)

    const params = new URLSearchParams()
    if (options.sort) params.append('sort', options.sort)
    if (options.limit) params.append('limit', options.limit)
    if (options.page) params.append('page', options.page)
    if (options.filter) params.append('filter', options.filter)

    const url = `/api/reviews/deals/${normalizedDealId}/reviews?${params}`
    return apiRequest(url)
  },
  submitDealReview: (reviewData) => apiRequest('/api/reviews', {
    method: 'POST',
    body: reviewData,
  }),
  getUserReviewVote: (reviewId) => apiRequest(`/api/reviews/${reviewId}/vote`),
  reportReview: (reviewId, reason, description = '') => apiRequest(`/api/reviews/${reviewId}/report`, {
    method: 'POST',
    body: { reason, description },
  }),
  incrementReviewViews: (reviewId) => apiRequest(`/api/reviews/${reviewId}/view`, {
    method: 'POST',
  }),

  // Personalization
  getUserPreferences: () => apiRequest('/api/personalization/preferences'),
  updateUserPreferences: (preferences) => apiRequest('/api/personalization/preferences', {
    method: 'PUT',
    body: preferences,
  }),
  trackUserActivity: (activity) => apiRequest('/api/personalization/activity', {
    method: 'POST',
    body: activity,
  }),
  getUserRecommendations: (options = {}) => {
    const params = new URLSearchParams()
    if (options.type) params.append('type', options.type)
    if (options.limit) params.append('limit', options.limit)
    return apiRequest(`/api/personalization/recommendations?${params}`)
  },

  generateRecommendations: () => apiRequest('/api/personalization/recommendations/generate', {
    method: 'POST',
  }),
  getUserInterests: () => apiRequest('/api/personalization/interests'),
  getUserActivity: (options = {}) => {
    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit)
    if (options.offset) params.append('offset', options.offset)
    if (options.type) params.append('type', options.type)
    return apiRequest(`/api/personalization/activity?${params}`)
  },
  getSavedSearches: () => apiRequest('/api/personalization/saved-searches'),
  saveSearch: (searchData) => apiRequest('/api/personalization/saved-searches', {
    method: 'POST',
    body: searchData,
  }),
  updateSavedSearch: (id, updates) => apiRequest(`/api/personalization/saved-searches/${id}`, {
    method: 'PUT',
    body: updates,
  }),
  deleteSavedSearch: (id) => apiRequest(`/api/personalization/saved-searches/${id}`, {
    method: 'DELETE',
  }),
  getUserFollows: (type = 'user') => apiRequest(`/api/personalization/follows?type=${type}`),
  followUser: (followingId, followType = 'user') => apiRequest('/api/personalization/follows', {
    method: 'POST',
    body: { following_id: followingId, follow_type: followType },
  }),
  unfollowUser: (followingId) => apiRequest(`/api/personalization/follows/${followingId}`, {
    method: 'DELETE',
  }),
  getPersonalizedDashboard: () => apiRequest('/api/personalization/dashboard'),

  // Saved Items
  getSavedItems: (type = 'all') => apiRequest(`/api/saved-items?type=${type}`),

  saveDeal: (dealId) => apiRequest(`/api/saved-items/deals/${dealId}`, {
    method: 'POST',
  }),

  saveCoupon: (couponId) => apiRequest(`/api/saved-items/coupons/${couponId}`, {
    method: 'POST',
  }),

  unsaveDeal: (dealId) => apiRequest(`/api/saved-items/deals/${dealId}`, {
    method: 'DELETE',
  }),

  unsaveCoupon: (couponId) => apiRequest(`/api/saved-items/coupons/${couponId}`, {
    method: 'DELETE',
  }),

  checkSavedItems: (dealIds = [], couponIds = []) => {
    const params = new URLSearchParams()
    if (dealIds.length > 0) params.append('deal_ids', dealIds.join(','))
    if (couponIds.length > 0) params.append('coupon_ids', couponIds.join(','))
    return apiRequest(`/api/saved-items/check?${params}`)
  },

  createDeal: (deal) => apiRequest('/api/deals', {
    method: 'POST',
    body: deal,
  }),

  voteDeal: (id, value) => apiRequest(`/api/deals/${id}/vote`, {
    method: 'POST',
    body: { value },
  }),
  bookmarkDeal: (id) => apiRequest(`/api/deals/${id}/bookmark`, { method: 'POST' }),

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
  getUser: (handle) => apiRequest(`/api/users/${handle}/profile`),

  updateUserProfile: (handle, profileData) => apiRequest(`/api/users/${handle}/profile`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),

  uploadAvatar: (handle, file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiRequest(`/api/users/${handle}/avatar`, {
      method: 'POST',
      body: formData
      // Don't override headers - let apiRequest handle auth headers
      // Content-Type will be automatically set by browser for FormData
    })
  },

  toggleFollowUser: (handle) => apiRequest(`/api/users/${handle}/follow`, {
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

  // Leaderboard (normalized to gamification endpoint with legacy fallback)
  getLeaderboard: async (period = 'all_time', limit = 50) => {
    const normalized = (() => {
      if (period === 'today' || period === 'daily' || period === 'day') return 'daily'
      if (period === 'week' || period === 'weekly') return 'weekly'
      if (period === 'month' || period === 'monthly') return 'monthly'
      if (period === 'alltime' || period === 'all_time' || period === 'all-time') return 'all_time'
      return 'all_time'
    })()

    try {
      const params = new URLSearchParams({ period: normalized, limit: String(limit) })
      const primary = await apiRequest(`/api/gamification/leaderboard?${params}`)
      if (Array.isArray(primary) && primary.length > 0) return primary
    } catch (e) {
      // Fall through to legacy
    }

    // If daily (today), do not fallback to legacy which would misrepresent as all_time
    if (normalized === 'daily') {
      return []
    }

    // Legacy fallback: /api/users/leaderboard/:period (week|month|year|all_time)
    const legacyPeriod = normalized === 'weekly' ? 'week' : normalized === 'monthly' ? 'month' : 'all_time'
    const legacyParams = new URLSearchParams({ limit: String(limit) })
    const legacy = await apiRequest(`/api/users/leaderboard/${legacyPeriod}?${legacyParams}`)
    if (legacy && Array.isArray(legacy.leaderboard)) {
      return legacy.leaderboard.map((u, idx) => ({
        user_id: u.id,
        handle: u.handle,
        avatar_url: u.avatar_url,
        points: u.karma ?? 0,
        total_posts: u.total_posts ?? 0,
        karma: u.karma ?? 0,
        rank: idx + 1,
      }))
    }
    return []
  },

  // Deal Images
  uploadDealImages: (dealId, files) => {
    console.log('🖼️ Uploading deal images:', { dealId, fileCount: files.length, files })
    const formData = new FormData()
    files.forEach((file, index) => {
      console.log(`📎 Appending file ${index}:`, { name: file.name, size: file.size, type: file.type })
      formData.append('images', file)
    })

    // Debug FormData contents
    for (let [key, value] of formData.entries()) {
      console.log(`🔍 FormData entry: ${key} =`, value)
    }

    return apiRequest(`/api/deals/${dealId}/images`, {
      method: 'POST',
      body: formData,
      // Don't override headers - let apiRequest handle auth and Content-Type
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
    console.log('🖼️ Uploading coupon images:', { couponId, fileCount: files.length, files })
    const formData = new FormData()
    files.forEach((file, index) => {
      console.log(`📎 Appending file ${index}:`, { name: file.name, size: file.size, type: file.type })
      formData.append('images', file)
    })

    // Debug FormData contents
    for (let [key, value] of formData.entries()) {
      console.log(`🔍 FormData entry: ${key} =`, value)
    }

    return apiRequest(`/api/coupons/${couponId}/images`, {
      method: 'POST',
      body: formData,
      // Don't override headers - let apiRequest handle auth and Content-Type
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

  getCompanyFull: (slug) => apiRequest(`/api/companies/${slug}/full`),

  searchCompanies: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    return apiRequest(`/api/companies/search?${searchParams}`)
  },

  getCompanyListings: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    return apiRequest(`/api/companies/listings?${searchParams}`)
  },

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

  createCompany: (companyData) => apiRequest('/api/companies', {
    method: 'POST',
    body: companyData,
  }),

  searchCompaniesByName: (query, limit = 10) => {
    const params = new URLSearchParams({ q: query, limit: limit.toString() })
    return apiRequest(`/api/companies/search/name?${params}`)
  },

  // Admin APIs
  getAdminDashboard: () => apiRequest('/api/admin/dashboard'),

  getPendingDeals: (page = 1) => {
    const params = new URLSearchParams({ page: page.toString(), status: 'pending' })
    return apiRequest(`/api/admin/deals?${params}`)
  },

  getPendingCoupons: (page = 1) => {
    const params = new URLSearchParams({ page: page.toString() })
    return apiRequest(`/api/admin/coupons/pending?${params}`)
  },

  reviewDeal: ({ dealId, action, reason }) => apiRequest(`/api/admin/deals/${dealId}/review`, {
    method: 'POST',
    body: { action, rejection_reason: reason },
  }),

  reviewCoupon: ({ couponId, action, reason }) => apiRequest(`/api/admin/coupons/${couponId}/review`, {
    method: 'POST',
    body: { action, rejection_reason: reason },
  }),

  editDeal: (dealId, updates) => apiRequest(`/api/admin/deals/${dealId}/edit`, {
    method: 'PUT',
    body: updates,
  }),

  editCoupon: (couponId, updates) => apiRequest(`/api/admin/coupons/${couponId}/edit`, {
    method: 'PUT',
    body: updates,
  }),

  // Delete functions
  deleteDeal: (dealId) => apiRequest(`/api/admin/deals/${dealId}`, {
    method: 'DELETE',
  }),

  deleteCoupon: (couponId) => apiRequest(`/api/admin/coupons/${couponId}`, {
    method: 'DELETE',
  }),

  // Upload image for admin use
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return fetch(`${API_BASE}/api/admin/upload-image`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.error || 'Upload failed', response.status);
      }
      return response.json();
    });
  },

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

  // Admin Company Management
  getPendingCompanies: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    return apiRequest(`/api/companies/admin/pending?${searchParams}`)
  },

  getCompanyForAdmin: (slug) => apiRequest(`/api/companies/admin/${slug}`),

  // Company management APIs
  createCompany: (companyData) => apiRequest('/api/companies', {
    method: 'POST',
    body: companyData,
  }),

  updateCompany: (companyId, companyData) => apiRequest(`/api/companies/${companyId}`, {
    method: 'PUT',
    body: companyData,
  }),

  updateCompanyAdmin: (companyId, companyData) => apiRequest(`/api/companies/admin/${companyId}/update`, {
    method: 'PUT',
    body: companyData,
  }),

  featureDeal: (dealId, featured) => apiRequest(`/api/admin/deals/${dealId}/feature`, {
    method: 'POST',
    body: { featured },
  }),

  featureCoupon: (couponId, featured) => apiRequest(`/api/admin/coupons/${couponId}/feature`, {
    method: 'POST',
    body: { featured },
  }),

  uploadCompanyLogo: (companyId, logoFile) => {
    console.log('🔧 API: uploadCompanyLogo called with:', { companyId, logoFile: logoFile.name })
    const formData = new FormData()
    formData.append('logo', logoFile)

    console.log('🔧 API: Making request to:', `${API_BASE}/api/companies/${companyId}/logo`)
    console.log('🔧 API: Authorization header present:', !!localStorage.getItem('access_token'))

    return fetch(`${API_BASE}/api/companies/${companyId}/logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    }).then(async response => {
      console.log('🔧 API: Response status:', response.status)
      if (!response.ok) {
        const error = await response.json()
        console.error('🔧 API: Upload failed:', error)
        throw new Error(error.message || 'Upload failed')
      }
      const result = await response.json()
      console.log('🔧 API: Upload successful:', result)
      return result
    }).catch(error => {
      console.error('🔧 API: Fetch error:', error)
      throw error
    })
  },


  // Enhanced deal features
  getSimilarDeals: async (dealId, params = {}) => {
    const searchParams = new URLSearchParams(params)
    return await apiRequest(`/api/deals/${dealId}/similar?${searchParams}`)
  },

  // Unified Search
  search: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (key === 'tags' && Array.isArray(value)) {
          // Handle tag arrays
          value.forEach(tag => searchParams.append('tags', tag.toString()))
        } else {
          searchParams.append(key, value.toString())
        }
      }
    })
    return apiRequest(`/api/search?${searchParams}`)
  },

  getSearchSuggestions: (query, type = 'all') => {
    const params = new URLSearchParams({ q: query, type })
    return apiRequest(`/api/search/suggestions?${params}`)
  },

  getPopularSearches: (limit = 10) => {
    const params = new URLSearchParams({ limit: limit.toString() })
    return apiRequest(`/api/search/popular?${params}`)
  },

  // User Profile
  getUserProfile: (handle) => {
    return apiRequest(`/api/users/${handle}/profile`)
  },

  getUserDeals: (handle, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    return apiRequest(`/api/users/${handle}/deals?${params}`)
  },

  getUserCoupons: (handle, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    return apiRequest(`/api/users/${handle}/coupons?${params}`)
  },

  getUserActivity: (handle, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    return apiRequest(`/api/users/${handle}/activity?${params}`)
  },

  // Follow/Unfollow functionality
  getFollowStatus: (handle) => {
    return apiRequest(`/api/users/${handle}/follow-status`)
  },

  toggleFollow: (handle) => {
    return apiRequest(`/api/users/${handle}/follow`, {
      method: 'POST'
    })
  },

  // User followers/following
  getUserFollowers: (handle, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    return apiRequest(`/api/users/${handle}/followers?${params}`)
  },

  getUserFollowing: (handle, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    return apiRequest(`/api/users/${handle}/following?${params}`)
  },

  // User achievements
  getUserAchievements: (handle) => {
    return apiRequest(`/api/users/${handle}/achievements`)
  },

  // User leaderboard position
  getUserLeaderboard: (handle) => {
    return apiRequest(`/api/users/${handle}/leaderboard`)
  },


  // Update user avatar
  updateUserAvatar: (handle, avatarUrl) => {
    return apiRequest(`/api/users/${handle}/avatar`, {
      method: 'POST',
      body: JSON.stringify({ avatar_url: avatarUrl })
    })
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
  submitDealReview: (dealId, reviewData) => {
    const normalizedDealId = String(dealId)

    // Add deal_id to the reviewData since the backend expects it
    const reviewDataWithDealId = {
      ...reviewData,
      deal_id: normalizedDealId
    }

    const url = `/api/reviews`
    return apiRequest(url, {
      method: 'POST',
      body: reviewDataWithDealId,
    })
  },

  voteOnReview: (reviewId, isHelpful) => {
    return apiRequest(`/api/reviews/${reviewId}/vote`, {
      method: 'POST',
      body: { isHelpful },
    })
  },

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

  // Filter Categories
  getTrendingDeals: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value)
      }
    })
    return apiRequest(`/api/filters/trending?${searchParams}`)
  },

  getUnder20Deals: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value)
      }
    })
    return apiRequest(`/api/filters/under-20?${searchParams}`)
  },

  get50OffDeals: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value)
      }
    })
    return apiRequest(`/api/filters/50-off?${searchParams}`)
  },

  getFreeShippingDeals: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value)
      }
    })
    return apiRequest(`/api/filters/free-shipping?${searchParams}`)
  },

  getNewArrivalsDeals: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value)
      }
    })
    return apiRequest(`/api/filters/new-arrivals?${searchParams}`)
  },

  getHotDeals: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value)
      }
    })
    return apiRequest(`/api/filters/hot-deals?${searchParams}`)
  },

  getEndingSoonDeals: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value)
      }
    })
    return apiRequest(`/api/filters/ending-soon?${searchParams}`)
  },

  // Users
  getUserProfile: async (handle) => {
    return await apiRequest(`/api/users/${handle}/profile`)
  },

  getUserDeals: async (handle, status = 'all') => {
    const params = new URLSearchParams()
    if (status !== 'all') {
      params.append('status', status)
    }
    return await apiRequest(`/api/users/${handle}/deals?${params}`)
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

  // Admin - advanced list with search/pagination
  listAdminDeals: ({ status = 'approved', search = '', page = 1, limit = 20 } = {}) => {
    const sp = new URLSearchParams()
    if (status) sp.append('status', status)
    if (search) sp.append('search', search)
    if (page) sp.append('page', page.toString())
    if (limit) sp.append('limit', limit.toString())
    return apiAuth(`/api/admin/deals?${sp.toString()}`)
  },

  listAdminCoupons: ({ status = 'approved', search = '', page = 1, limit = 20 } = {}) => {
    const sp = new URLSearchParams()
    if (status) sp.append('status', status)
    if (search) sp.append('search', search)
    if (page) sp.append('page', page.toString())
    if (limit) sp.append('limit', limit.toString())
    return apiAuth(`/api/admin/coupons?${sp.toString()}`)
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

  // Admin - update entities
  updateDealAdmin: (id, updates) => apiAuth(`/api/admin/deals/${id}`, {
    method: 'PUT',
    body: updates,
  }),

  updateCouponAdmin: (id, updates) => apiAuth(`/api/admin/coupons/${id}`, {
    method: 'PUT',
    body: updates,
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

  // ===== TRACKING & ANALYTICS APIs =====

  // Deal tracking
  trackDealClick: (dealId, source = 'unknown') => apiRequest(`/api/deals/${dealId}/click`, {
    method: 'POST',
    body: { source }
  }),

  // Coupon tracking
  trackCouponClick: (couponId, source = 'unknown') => apiRequest(`/api/coupons/${couponId}/click`, {
    method: 'POST',
    body: { source }
  }),

  // User session tracking
  trackUserSession: (page = 'unknown') => apiRequest('/api/users/session/heartbeat', {
    method: 'POST',
    body: {
      page,
      user_agent: navigator.userAgent
    }
  }),

  // Navbar stats
  getNavbarStats: () => apiRequest('/api/navbar/stats'),

  // Analytics tracking
  trackEvent: (eventName, properties = {}) => apiRequest('/api/analytics/track', {
    method: 'POST',
    body: {
      event_name: eventName,
      properties
    }
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
    getPreferences: () => apiRequest('/api/notifications/preferences'),

    updatePreferences: (preferences) => apiRequest('/api/notifications/preferences', {
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

  // Restaurants
  restaurants: {
    getNearby: (params = {}) => {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value)
        }
      })
      return apiRequest(`/api/restaurants/nearby?${searchParams}`)
    },

    getDeals: (restaurantId, params = {}) => {
      const searchParams = new URLSearchParams(params)
      return apiRequest(`/api/restaurants/${restaurantId}/deals?${searchParams}`)
    },

    search: (params = {}) => {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value)
        }
      })
      return apiRequest(`/api/restaurants/search?${searchParams}`)
    },

    create: (restaurantData) => apiRequest('/api/restaurants', {
      method: 'POST',
      body: restaurantData,
    }),

    update: (restaurantId, restaurantData) => apiRequest(`/api/restaurants/${restaurantId}`, {
      method: 'PUT',
      body: restaurantData,
    }),
  },

  // Unified Feed API
  getFeed: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          searchParams.append(key, JSON.stringify(value))
        } else {
          searchParams.append(key, value.toString())
        }
      }
    })
    return apiRequest(`/api/feed?${searchParams}`)
  },

  // Quick Stats
  getQuickStats: () => apiRequest('/api/stats/quick'),

  // Generic HTTP methods for enterprise search
  get: (url, options = {}) => apiRequest(url, { method: 'GET', ...options }),
  post: (url, data, options = {}) => apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }),
  put: (url, data, options = {}) => apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }),
  delete: (url, options = {}) => apiRequest(url, { method: 'DELETE', ...options }),

  // ─────────────────────────────────────────────────────────────────────────
  // AI Chat APIs
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Send a chat message to the AI (non-streaming)
   * @param {Object} params - Chat parameters
   * @param {string} params.message - User message
   * @param {string} [params.conversationId] - Continue existing conversation
   * @param {Object} [params.context] - Additional context
   * @returns {Promise<Object>} AI response with content and optional deals
   */
  aiChat: ({ message, conversationId, context }) => {
    // Build body - only include optional fields if they have values
    const body = { message }
    if (conversationId) body.conversationId = conversationId
    if (context) body.context = context

    return apiRequest('/api/ai/chat', {
      method: 'POST',
      body,
    })
  },

  /**
   * Create an SSE stream for AI chat (streaming responses)
   * Uses fetch with ReadableStream for proper auth support
   * @param {Object} params - Chat parameters
   * @param {string} params.message - User message
   * @param {string} [params.conversationId] - Continue existing conversation
   * @param {Function} onEvent - Callback for each SSE event
   * @param {Function} [onError] - Error callback
   * @returns {Function} Cleanup function to abort the connection
   */
  aiChatStream: ({ message, conversationId }, onEvent, onError) => {
    const controller = new AbortController()
    const token = localStorage.getItem('access_token')

    async function startStream() {
      try {
        // Build request body - only include conversationId if it has a value
        const requestBody = { message }
        if (conversationId) {
          requestBody.conversationId = conversationId
        }

        const response = await fetch(`${API_BASE}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            // Process any remaining buffer
            if (buffer.trim()) {
              processSSEData(buffer, onEvent)
            }
            break
          }

          buffer += decoder.decode(value, { stream: true })

          // Process complete SSE messages
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              processSSEData(data, onEvent)
            }
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          // Intentionally aborted
          return
        }
        console.error('SSE stream error:', error)
        if (onError) onError(error)
        onEvent({ type: 'error', error: error.message || 'Stream failed' })
      }
    }

    function processSSEData(data, callback) {
      try {
        const parsed = JSON.parse(data)
        callback(parsed)
      } catch (e) {
        // Ignore parse errors for empty/invalid chunks
        if (data.trim()) {
          console.warn('Failed to parse SSE data:', data)
        }
      }
    }

    // Start the stream
    startStream()

    // Return cleanup function
    return () => controller.abort()
  },

  /**
   * Get user's AI conversation history
   * @returns {Promise<Object>} List of conversations
   */
  getAIConversations: () => apiRequest('/api/ai/conversations'),

  /**
   * Get a specific conversation with messages
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Conversation with messages
   */
  getAIConversation: (conversationId) => apiRequest(`/api/ai/conversations/${conversationId}`),

  /**
   * Create a new AI conversation
   * @returns {Promise<Object>} New conversation
   */
  createAIConversation: () => apiRequest('/api/ai/conversations', {
    method: 'POST',
  }),

  /**
   * Delete an AI conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Success response
   */
  deleteAIConversation: (conversationId) => apiRequest(`/api/ai/conversations/${conversationId}`, {
    method: 'DELETE',
  }),

  /**
   * Submit feedback on an AI response
   * @param {Object} params - Feedback parameters
   * @param {string} params.messageId - Message ID
   * @param {string} params.rating - 'positive' or 'negative'
   * @param {string} [params.comment] - Optional comment
   * @returns {Promise<Object>} Success response
   */
  submitAIFeedback: ({ messageId, rating, comment }) => apiRequest('/api/ai/feedback', {
    method: 'POST',
    body: { messageId, rating, comment },
  }),

  /**
   * Check AI service health
   * @returns {Promise<Object>} Health status
   */
  getAIHealth: () => apiRequest('/api/ai/health'),

  /**
   * Get AI usage statistics (admin)
   * @returns {Promise<Object>} Usage stats
   */
  getAIStats: () => apiRequest('/api/ai/stats'),

  /**
   * Get AI chat logs with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of logs per page
   * @param {string} params.cursor - Cursor for pagination
   * @returns {Promise<Object>} Paginated logs
   */
  getAILogs: ({ limit = 50, cursor = null } = {}) => {
    const params = new URLSearchParams()
    if (limit) params.set('limit', limit)
    if (cursor) params.set('cursor', cursor)
    return apiRequest(`/api/ai/logs?${params.toString()}`)
  },
}
