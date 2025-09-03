import React from 'react'
import { authService } from '../lib/auth.js'

export function useAuth() {
  const [user, setUser] = React.useState(null)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [isInitialized, setIsInitialized] = React.useState(false)
  
  React.useEffect(() => {
    // Check if auth service is already initialized
    if (authService.getInitializationStatus()) {
      setUser(authService.getUser())
      setIsAuthenticated(authService.isSignedIn())
      setIsInitialized(true)
    }
    
    // Subscribe to auth changes
    return authService.subscribe((user, isAuthenticated) => {
      setUser(user)
      setIsAuthenticated(isAuthenticated)
      setIsInitialized(true)
    })
  }, [])
  
  return {
    user,
    isAuthenticated,
    isInitialized,
    signIn: authService.signIn.bind(authService),
    signUp: authService.signUp.bind(authService),
    signOut: authService.signOut.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    requireAuth: authService.requireAuth.bind(authService),
    hasRole: authService.hasRole.bind(authService),
    isAdmin: authService.isAdmin.bind(authService),
    isModerator: authService.isModerator.bind(authService),
    syncToken: authService.syncSupabaseToken.bind(authService),
    forceInitialize: authService.forceInitialize.bind(authService),
  }
}
