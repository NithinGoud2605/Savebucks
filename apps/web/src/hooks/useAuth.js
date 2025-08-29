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
