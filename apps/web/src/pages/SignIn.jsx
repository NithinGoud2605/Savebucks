import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supa } from '../lib/supa.js'
import { authService } from '../lib/auth.js'
import { toast } from '../lib/toast.js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Shield,
  Users,
  TrendingUp,
  CheckCircle,
  Loader2
} from 'lucide-react'

// Animated background shapes
const FloatingShape = ({ delay, x, y, size, color }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-30 ${color}`}
    style={{ width: size, height: size }}
    initial={{ x, y, scale: 0.8 }}
    animate={{
      x: [x, x + 30, x - 20, x],
      y: [y, y - 40, y + 20, y],
      scale: [0.8, 1.1, 0.9, 0.8],
    }}
    transition={{
      duration: 15,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
)

// Trust indicator with animation
const TrustIndicator = ({ icon: Icon, text, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-2 text-sm text-slate-600"
  >
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
      <Icon className="w-4 h-4 text-violet-600" />
    </div>
    <span>{text}</span>
  </motion.div>
)

// Animated input field
const AnimatedInput = ({
  label,
  type,
  name,
  value,
  onChange,
  error,
  placeholder,
  icon: Icon,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
  autoComplete
}) => {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <div className="relative group">
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused ? 'text-violet-500' : 'text-slate-400'
          }`}>
          <Icon className="w-5 h-5" />
        </div>
        <input
          type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoComplete={autoComplete}
          className={`w-full pl-12 pr-${showPasswordToggle ? '12' : '4'} py-3.5 border-2 rounded-xl bg-white text-slate-900 placeholder-slate-400 transition-all duration-200 outline-none ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50'
            : isFocused
              ? 'border-violet-400 ring-4 ring-violet-50'
              : 'border-slate-200 hover:border-slate-300'
            }`}
          placeholder={placeholder}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        {/* Focus ring animation */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: isFocused && !error
              ? '0 0 0 4px rgba(139, 92, 246, 0.1)'
              : '0 0 0 0px rgba(139, 92, 246, 0)'
          }}
          transition={{ duration: 0.2 }}
        />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-sm text-red-600 flex items-center gap-1"
          >
            <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Main SignIn Component
export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [rememberMe, setRememberMe] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supa.auth.getSession()
      if (session) {
        navigate(from, { replace: true })
      }
    }
    checkSession()
  }, [navigate, from])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const { data, error } = await supa.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      if (data.user && data.session) {
        localStorage.setItem('access_token', data.session.access_token)
        localStorage.setItem('refresh_token', data.session.refresh_token)

        const { data: profile } = await supa
          .from('profiles')
          .select('handle, karma, role, created_at')
          .eq('id', data.user.id)
          .single()

        authService.setUser({
          id: data.user.id,
          email: data.user.email,
          handle: profile?.handle || null,
          karma: profile?.karma || 0,
          role: profile?.role || 'user',
          created_at: profile?.created_at,
        })

        toast.success(`Welcome back${profile?.handle ? ', ' + profile.handle : ''}!`)
        navigate(from, { replace: true })
      }
    } catch (error) {
      console.error('Sign in error:', error)
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password')
        setErrors({ password: 'Invalid email or password' })
      } else {
        toast.error(error.message || 'Failed to sign in')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)

    try {
      const { error } = await supa.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (error) {
      console.error('Google sign in error:', error)
      toast.error('Failed to sign in with Google')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Floating background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingShape delay={0} x={-100} y={-100} size={400} color="bg-violet-300" />
        <FloatingShape delay={2} x={800} y={100} size={300} color="bg-purple-300" />
        <FloatingShape delay={4} x={400} y={500} size={350} color="bg-pink-300" />
      </div>

      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/" className="inline-flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
                <img src="/logo.svg" alt="SaveBucks" className="w-8 h-8" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                SaveBucks
              </span>
            </Link>

            <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
              Discover amazing deals,<br />
              <span className="text-violet-600">save big</span> every day
            </h1>

            <p className="text-lg text-slate-600 mb-8">
              Join thousands of smart shoppers finding the best discounts, coupons, and deals from their favorite stores.
            </p>

            <div className="space-y-4">
              <TrustIndicator icon={Users} text="50,000+ active deal hunters" delay={0.2} />
              <TrustIndicator icon={TrendingUp} text="$2M+ saved by our community" delay={0.4} />
              <TrustIndicator icon={Shield} text="Verified deals, no spam" delay={0.6} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <img src="/logo.svg" alt="SaveBucks" className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                SaveBucks
              </span>
            </Link>
          </div>

          {/* Sign In Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back</h2>
              <p className="text-slate-600">Sign in to your account to continue</p>
            </div>

            <div className="space-y-6">
              {/* Google Sign In */}
              <motion.button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                <span>{isGoogleLoading ? 'Signing in...' : 'Continue with Google'}</span>
              </motion.button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">or continue with email</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatedInput
                  label="Email address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={errors.email}
                  placeholder="you@example.com"
                  icon={Mail}
                  autoComplete="email"
                />

                <AnimatedInput
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={errors.password}
                  placeholder="••••••••"
                  icon={Lock}
                  showPasswordToggle
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  autoComplete="current-password"
                />

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${rememberMe
                        ? 'bg-violet-600 border-violet-600'
                        : 'border-slate-300 group-hover:border-violet-400'
                        }`}>
                        {rememberMe && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">Remember me</span>
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-4 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-violet-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>

                  {/* Button shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.button>
              </form>
            </div>
          </div>

          {/* Sign Up Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6 text-slate-600"
          >
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-violet-600 hover:text-violet-700 font-semibold transition-colors"
            >
              Sign up for free
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
