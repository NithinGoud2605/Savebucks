import { api } from './api.js'
import { toast } from './toast.js'

/**
 * Authentication service for SaveBucks
 */

class AuthService {
  constructor() {
    this.user = null
    this.isAuthenticated = false
    this.listeners = new Set()
    this.isInitialized = false
    
    // Check for existing session on initialization
    this.initializeAuth()
    
    // Listen for storage changes to sync Supabase token updates
    this.setupStorageListener()
  }
  
  async initializeAuth() {
    console.log('🔐 Initializing authentication...')
    
    // Check for Supabase token first
    const supabaseToken = localStorage.getItem('sb-ixkhkzjhelyumdplutbz-auth-token')
    if (supabaseToken) {
      console.log('📦 Found Supabase token, processing...')
      try {
        const tokenData = JSON.parse(supabaseToken)
        if (tokenData.access_token) {
          console.log('✅ Valid Supabase token found')
          // Store in the format our API expects
          localStorage.setItem('access_token', tokenData.access_token)
          localStorage.setItem('refresh_token', tokenData.refresh_token)
          
          // Try to get user data from our API
          try {
            console.log('🌐 Attempting to fetch user data from API...')
            const userData = await api.getCurrentUser()
            console.log('✅ API user data received:', userData)
            this.setUser(userData.user)
          } catch (error) {
            console.log('⚠️ API call failed, falling back to JWT decode:', error.message)
            // If API call fails, try to decode the JWT to get basic user info
            const userInfo = this.decodeJWT(tokenData.access_token)
            if (userInfo) {
              console.log('🔓 JWT decoded successfully:', userInfo)
              this.setUser({
                id: userInfo.sub,
                email: userInfo.email,
                role: userInfo.role || 'authenticated',
                handle: userInfo.email?.split('@')[0] || 'user'
              })
            }
          }
        }
      } catch (error) {
        console.warn('❌ Failed to parse Supabase token:', error)
        this.clearAuth()
      }
    } else {
      console.log('🔍 No Supabase token found, checking direct access_token...')
      // Fallback to direct access_token check
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          console.log('🔑 Direct access_token found, validating...')
          const userData = await api.getCurrentUser()
          console.log('✅ Direct token validation successful:', userData)
          this.setUser(userData.user)
        } catch (error) {
          console.log('❌ Direct token validation failed:', error.message)
          // Try to refresh the token before giving up
          if (error.message?.includes('JWT expired') || error.message?.includes('expired')) {
            console.log('🔄 JWT expired, attempting token refresh...')
            const refreshSuccess = await this.refreshSession()
            if (refreshSuccess) {
              console.log('✅ Token refresh successful')
              // Try to get user data again
              try {
                const userData = await api.getCurrentUser()
                this.setUser(userData.user)
              } catch (refreshError) {
                console.log('❌ Still failed after refresh:', refreshError.message)
                this.clearAuth()
              }
            } else {
              this.clearAuth()
            }
          } else {
            // Token is invalid, clear it
            this.clearAuth()
          }
        }
      } else {
        console.log('❌ No authentication tokens found')
      }
    }
    
    this.isInitialized = true
    console.log('🔐 Authentication initialization complete. User:', this.user, 'Authenticated:', this.isAuthenticated)
  }
  
  setUser(user) {
    this.user = user
    this.isAuthenticated = !!user
    this.notifyListeners()
  }
  
  clearAuth() {
    this.user = null
    this.isAuthenticated = false
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('sb-ixkhkzjhelyumdplutbz-auth-token') // Clear Supabase token
    localStorage.removeItem('demo_user') // Legacy cleanup
    localStorage.removeItem('demo_token') // Legacy cleanup
    this.notifyListeners()
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.user, this.isAuthenticated)
      } catch (error) {
        console.error('Error in auth listener callback:', error)
      }
    })
  }
  
  subscribe(callback) {
    this.listeners.add(callback)
    
    // If already initialized, call immediately with current state
    if (this.isInitialized) {
      try {
        callback(this.user, this.isAuthenticated)
      } catch (error) {
        console.error('Error in auth subscription callback:', error)
      }
    }
    
    // Return unsubscribe function
    return () => this.listeners.delete(callback)
  }
  
  async signUp(email, password, handle) {
    try {
      const response = await api.signUp({ email, password, handle })
      toast.success('Account created successfully! Please sign in.')
      return response
    } catch (error) {
      const message = error.message || 'Failed to create account'
      toast.error(message)
      throw error
    }
  }
  
  async signIn(email, password) {
    try {
      const response = await api.signIn({ email, password })
      
      // Store tokens and lightweight user info for convenience
      localStorage.setItem('access_token', response.session.access_token)
      localStorage.setItem('refresh_token', response.session.refresh_token)
      if (response.user?.handle) {
        localStorage.setItem('user_handle', response.user.handle)
      } else if (response.user?.email) {
        localStorage.setItem('user_handle', response.user.email.split('@')[0])
      }
      
      // Set user state
      this.setUser(response.user)
      
      toast.success(`Welcome back, ${response.user.handle || response.user.email}!`)
      return response
    } catch (error) {
      const message = error.message || 'Failed to sign in'
      toast.error(message)
      throw error
    }
  }
  
  async signOut() {
    try {
      await api.signOut()
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Sign out API call failed:', error)
    }
    
    this.clearAuth()
    toast.success('Signed out successfully')
  }
  
  async refreshSession() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      this.clearAuth()
      return false
    }
    
    try {
      const response = await api.refreshToken(refreshToken)
      localStorage.setItem('access_token', response.session.access_token)
      localStorage.setItem('refresh_token', response.session.refresh_token)
      return true
    } catch (error) {
      console.warn('Token refresh failed:', error)
      this.clearAuth()
      return false
    }
  }
  
  async updateProfile(profileData) {
    try {
      const response = await api.updateAuthProfile(profileData)
      this.setUser(response.user)
      toast.success('Profile updated successfully')
      return response
    } catch (error) {
      const message = error.message || 'Failed to update profile'
      toast.error(message)
      throw error
    }
  }
  
  getUser() {
    return this.user
  }
  
  isSignedIn() {
    return this.isAuthenticated
  }
  
  getInitializationStatus() {
    return this.isInitialized
  }
  
  // Method to manually trigger initialization (useful for testing)
  async forceInitialize() {
    if (!this.getInitializationStatus()) {
      await this.initializeAuth()
    }
  }
  
  requireAuth() {
    if (!this.isAuthenticated) {
      toast.error('Please sign in to continue')
      throw new Error('Authentication required')
    }
    return this.user
  }
  
  hasRole(role) {
    return this.user?.role === role
  }
  
  isAdmin() {
    return this.hasRole('admin')
  }
  
  isModerator() {
    return this.hasRole('mod') || this.isAdmin()
  }
  
  // Helper method to decode JWT tokens
  decodeJWT(token) {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.warn('Failed to decode JWT:', error)
      return null
    }
  }
  
  // Method to sync Supabase token updates
  syncSupabaseToken() {
    const supabaseToken = localStorage.getItem('sb-ixkhkzjhelyumdplutbz-auth-token')
    if (supabaseToken) {
      try {
        const tokenData = JSON.parse(supabaseToken)
        if (tokenData.access_token) {
          localStorage.setItem('access_token', tokenData.access_token)
          localStorage.setItem('refresh_token', tokenData.refresh_token)
          
          // Update user info if we have it
          if (tokenData.user) {
            this.setUser(tokenData.user)
          } else {
            // Try to decode JWT for user info
            const userInfo = this.decodeJWT(tokenData.access_token)
            if (userInfo) {
              this.setUser({
                id: userInfo.sub,
                email: userInfo.email,
                role: userInfo.role || 'authenticated',
                handle: userInfo.email?.split('@')[0] || 'user'
              })
            }
          }
        }
      } catch (error) {
        console.warn('Failed to sync Supabase token:', error)
      }
    }
  }
  
  // Setup storage event listener for cross-tab synchronization
  setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'sb-ixkhkzjhelyumdplutbz-auth-token') {
        if (event.newValue) {
          // Token was added or updated
          this.syncSupabaseToken()
        } else {
          // Token was removed
          this.clearAuth()
        }
      }
    })
  }
}

// Create singleton instance
export const authService = new AuthService()

// Export for backward compatibility
export const auth = authService

// React hook for using auth in components (to be used in a separate file)
// This would typically be in a separate hooks file with React imports
export const useAuthHook = `
import React from 'react'
import { authService } from '../lib/auth.js'

export function useAuth() {
  const [user, setUser] = React.useState(authService.getUser())
  const [isAuthenticated, setIsAuthenticated] = React.useState(authService.isSignedIn())
  
  React.useEffect(() => {
    return authService.subscribe((user, isAuthenticated) => {
      setUser(user)
      setIsAuthenticated(isAuthenticated)
    })
  }, [])
  
  return {
    user,
    isAuthenticated,
    signIn: authService.signIn.bind(authService),
    signUp: authService.signUp.bind(authService),
    signOut: authService.signOut.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    requireAuth: authService.requireAuth.bind(authService),
    hasRole: authService.hasRole.bind(authService),
    isAdmin: authService.isAdmin.bind(authService),
    isModerator: authService.isModerator.bind(authService),
  }
}
`
