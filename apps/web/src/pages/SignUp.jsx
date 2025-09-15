import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supa } from '../lib/supa.js'
import { authService } from '../lib/auth.js'
import { toast } from '../lib/toast.js'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    handle: '',
  })
  const [errors, setErrors] = useState({})
  
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (formData.handle && formData.handle.length < 3) {
      newErrors.handle = 'Handle must be at least 3 characters long'
    } else if (formData.handle && !/^[a-zA-Z0-9_-]+$/.test(formData.handle)) {
      newErrors.handle = 'Handle can only contain letters, numbers, hyphens, and underscores'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      // Sign up with Supabase
      const { data, error } = await supa.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            handle: formData.handle || null,
          }
        }
      })
      
      if (error) throw error
      
      if (data.user) {
        // Update profile with handle if provided
        if (formData.handle) {
          const { error: profileError } = await supa
            .from('profiles')
            .update({ handle: formData.handle.toLowerCase() })
            .eq('id', data.user.id)
          
          if (profileError) {
            console.warn('Profile update error:', profileError)
          }
        }
        
        toast.success('Account created successfully! Please check your email to verify your account.')
        navigate('/signin', { 
          state: { 
            message: 'Please check your email to verify your account before signing in.' 
          }
        })
      }
    } catch (error) {
      console.error('Sign up error:', error)
      if (error.message.includes('User already registered')) {
        toast.error('An account with this email already exists')
      } else {
        toast.error(error.message || 'Failed to create account')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    
    try {
      const { data, error } = await supa.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
    } catch (error) {
      console.error('Google sign up error:', error)
      toast.error('Failed to sign up with Google')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center">
              <img 
                src="/logo.svg" 
                alt="SaveBucks Logo" 
                className="h-10 w-10 object-contain"
              />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              SaveBucks
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">Create your account</h1>
          <p className="text-secondary-600">Join thousands of users finding amazing deals</p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-white rounded-2xl border border-secondary-200 shadow-xl p-8">
          <div className="space-y-6">
            {/* Google Sign Up Button */}
            <button
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center space-x-3 bg-white border border-secondary-300 text-secondary-700 px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:bg-secondary-50 hover:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-secondary-300 border-t-primary-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>{isGoogleLoading ? 'Signing up...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-secondary-500">Or continue with email</span>
              </div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl bg-white text-secondary-900 placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 ${
                    errors.email ? 'border-danger-300 focus:border-danger-500' : 'border-secondary-300 focus:border-primary-500'
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-danger-600">{errors.email}</p>
                )}
              </div>

              {/* Handle Field */}
              <div>
                <label htmlFor="handle" className="block text-sm font-medium text-secondary-700 mb-2">
                  Username (optional)
                </label>
                <input
                  type="text"
                  id="handle"
                  name="handle"
                  value={formData.handle}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl bg-white text-secondary-900 placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 ${
                    errors.handle ? 'border-danger-300 focus:border-danger-500' : 'border-secondary-300 focus:border-primary-500'
                  }`}
                  placeholder="Choose a username"
                />
                {errors.handle && (
                  <p className="mt-1 text-sm text-danger-600">{errors.handle}</p>
                )}
                <p className="mt-1 text-xs text-secondary-500">
                  Letters, numbers, hyphens, and underscores only
                </p>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white text-secondary-900 placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 ${
                      errors.password ? 'border-danger-300 focus:border-danger-500' : 'border-secondary-300 focus:border-primary-500'
                    }`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-danger-600">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-secondary-500">
                  At least 6 characters
                </p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white text-secondary-900 placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 ${
                      errors.confirmPassword ? 'border-danger-300 focus:border-danger-500' : 'border-secondary-300 focus:border-primary-500'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating account...</span>
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            {/* Terms */}
            <p className="text-xs text-secondary-500 text-center">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-secondary-600">
            Already have an account?{' '}
            <Link
              to="/signin"
              className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
