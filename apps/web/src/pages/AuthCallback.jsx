import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supa } from '../lib/supa.js'
import { authService } from '../lib/auth.js'
import { toast } from '../lib/toast.js'

export default function AuthCallback() {
  const [status, setStatus] = useState('processing') // processing, success, error
  const [message, setMessage] = useState('Processing authentication...')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have a code parameter (OAuth callback)
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        
        if (error) {
          throw new Error(`OAuth error: ${error}`)
        }
        
        if (code) {
          // Handle OAuth callback with code
          const { data, error: exchangeError } = await supa.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            throw exchangeError
          }
          
          if (data.session && data.session.user) {
            const user = data.session.user
            
            // Store tokens
            localStorage.setItem('access_token', data.session.access_token)
            localStorage.setItem('refresh_token', data.session.refresh_token)
            
            // Get or create user profile
            let { data: profile, error: profileError } = await supa
              .from('profiles')
              .select('handle, karma, role, created_at')
              .eq('id', user.id)
              .single()
            
            // If profile doesn't exist, it should be created by the trigger
            // But let's wait a moment and try again if it's not there
            if (profileError && profileError.code === 'PGRST116') {
              await new Promise(resolve => setTimeout(resolve, 1000))
              const { data: retryProfile } = await supa
                .from('profiles')
                .select('handle, karma, role, created_at')
                .eq('id', user.id)
                .single()
              profile = retryProfile
            }
            
            // Update auth service state
            authService.setUser({
              id: user.id,
              email: user.email,
              handle: profile?.handle || null,
              karma: profile?.karma || 0,
              role: profile?.role || 'user',
              created_at: profile?.created_at,
              avatar_url: user.user_metadata?.avatar_url || null,
            })
            
            setStatus('success')
            setMessage(`Welcome${profile?.handle ? ', ' + profile.handle : ''}!`)
            
            // Get redirect destination
            const from = searchParams.get('from') || '/'
            
            // Redirect after a short delay
            setTimeout(() => {
              navigate(decodeURIComponent(from), { replace: true })
            }, 1500)
            
            return
          }
        }
        
        // Fallback: try to get existing session
        const { data, error } = await supa.auth.getSession()
        
        if (error) {
          throw error
        }
        
        if (data.session && data.session.user) {
          const user = data.session.user
          
          // Store tokens
          localStorage.setItem('access_token', data.session.access_token)
          localStorage.setItem('refresh_token', data.session.refresh_token)
          
          // Get or create user profile
          let { data: profile, error: profileError } = await supa
            .from('profiles')
            .select('handle, karma, role, created_at')
            .eq('id', user.id)
            .single()
          
          // If profile doesn't exist, it should be created by the trigger
          // But let's wait a moment and try again if it's not there
          if (profileError && profileError.code === 'PGRST116') {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const { data: retryProfile } = await supa
              .from('profiles')
              .select('handle, karma, role, created_at')
              .eq('id', user.id)
              .single()
            profile = retryProfile
          }
          
          // Update auth service state
          authService.setUser({
            id: user.id,
            email: user.email,
            handle: profile?.handle || null,
            karma: profile?.karma || 0,
            role: profile?.role || 'user',
            created_at: profile?.created_at,
            avatar_url: user.user_metadata?.avatar_url || null,
          })
          
          setStatus('success')
          setMessage(`Welcome${profile?.handle ? ', ' + profile.handle : ''}!`)
          
          // Get redirect destination
          const from = searchParams.get('from') || '/'
          
          // Redirect after a short delay
          setTimeout(() => {
            navigate(decodeURIComponent(from), { replace: true })
          }, 1500)
          
        } else {
          throw new Error('No session found')
        }
        
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage(error.message || 'Authentication failed')
        
        // Redirect to sign in page after a delay
        setTimeout(() => {
          navigate('/signin', { replace: true })
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-soft p-8 border border-secondary-200">
          {/* Loading Spinner */}
          {status === 'processing' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-secondary-900">
                Completing Sign In
              </h2>
              <p className="text-secondary-600">
                {message}
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-secondary-900">
                Sign In Successful!
              </h2>
              <p className="text-secondary-600">
                {message}
              </p>
              <p className="text-sm text-secondary-500">
                Redirecting you now...
              </p>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-secondary-900">
                Sign In Failed
              </h2>
              <p className="text-secondary-600">
                {message}
              </p>
              <p className="text-sm text-secondary-500">
                Redirecting to sign in page...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
