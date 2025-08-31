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
    
    // Check for existing session on initialization
    this.initializeAuth()
  }
  
  async initializeAuth() {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const userData = await api.getCurrentUser()
        this.setUser(userData.user)
      } catch (error) {
        // Token is invalid, clear it
        this.clearAuth()
      }
    }
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
    localStorage.removeItem('demo_user') // Legacy cleanup
    localStorage.removeItem('demo_token') // Legacy cleanup
    this.notifyListeners()
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.user, this.isAuthenticated))
  }
  
  subscribe(callback) {
    this.listeners.add(callback)
    // Immediately call with current state
    callback(this.user, this.isAuthenticated)
    
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
