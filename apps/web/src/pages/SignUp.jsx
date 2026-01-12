import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supa } from '../lib/supa.js'
import { toast } from '../lib/toast.js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Gift,
  Zap,
  Heart,
  CheckCircle,
  Loader2,
  Check,
  X
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

// Feature card with animation
const FeatureCard = ({ icon: Icon, title, description, delay, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-start gap-4 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30"
  >
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
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
  autoComplete,
  hint
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
          className={`w-full pl-12 ${showPasswordToggle ? 'pr-12' : 'pr-4'} py-3.5 border-2 rounded-xl bg-white text-slate-900 placeholder-slate-400 transition-all duration-200 outline-none ${error
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
      </div>

      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}

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

// Password strength indicator
const PasswordStrength = ({ password }) => {
  const checks = [
    { label: 'At least 6 characters', valid: password.length >= 6 },
    { label: 'Contains a number', valid: /\d/.test(password) },
    { label: 'Contains uppercase', valid: /[A-Z]/.test(password) },
    { label: 'Contains special char', valid: /[!@#$%^&*]/.test(password) },
  ]

  const strength = checks.filter(c => c.valid).length
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500']
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']

  if (!password) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 space-y-3"
    >
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < strength ? strengthColors[strength - 1] : 'bg-slate-200'
                }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${strength === 4 ? 'text-emerald-600' :
          strength === 3 ? 'text-yellow-600' :
            strength === 2 ? 'text-orange-600' : 'text-red-600'
          }`}>
          {strengthLabels[strength - 1] || 'Too weak'}
        </span>
      </div>

      {/* Check list */}
      <div className="grid grid-cols-2 gap-2">
        {checks.map((check, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-1.5 text-xs ${check.valid ? 'text-emerald-600' : 'text-slate-400'
              }`}
          >
            {check.valid ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            <span>{check.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// Main SignUp Component
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
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const navigate = useNavigate()

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supa.auth.getSession()
      if (session) {
        navigate('/', { replace: true })
      }
    }
    checkSession()
  }, [navigate])

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (formData.handle && formData.handle.length < 3) {
      newErrors.handle = 'Username must be at least 3 characters'
    } else if (formData.handle && !/^[a-zA-Z0-9_-]+$/.test(formData.handle)) {
      newErrors.handle = 'Only letters, numbers, hyphens, and underscores'
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
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
        if (formData.handle) {
          const { error: profileError } = await supa
            .from('profiles')
            .update({ handle: formData.handle.toLowerCase() })
            .eq('id', data.user.id)

          if (profileError) {
            console.warn('Profile update error:', profileError)
          }
        }

        toast.success('Account created! Please check your email to verify.')
        navigate('/signin', {
          state: { message: 'Please check your email to verify your account.' }
        })
      }
    } catch (error) {
      console.error('Sign up error:', error)
      if (error.message.includes('User already registered')) {
        toast.error('An account with this email already exists')
        setErrors({ email: 'This email is already registered' })
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
      const { error } = await supa.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (error) {
      console.error('Google sign up error:', error)
      toast.error('Failed to sign up with Google')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Floating background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingShape delay={0} x={-100} y={-100} size={400} color="bg-emerald-300" />
        <FloatingShape delay={2} x={800} y={100} size={300} color="bg-teal-300" />
        <FloatingShape delay={4} x={400} y={500} size={350} color="bg-cyan-300" />
      </div>

      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md my-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                <img src="/logo.svg" alt="SaveBucks" className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                SaveBucks
              </span>
            </Link>
          </div>

          {/* Sign Up Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Create your account</h2>
              <p className="text-slate-600">Join thousands finding amazing deals</p>
            </div>

            <div className="space-y-5">
              {/* Google Sign Up */}
              <motion.button
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
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
                <span>{isGoogleLoading ? 'Signing up...' : 'Continue with Google'}</span>
              </motion.button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">or sign up with email</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  label="Username (optional)"
                  type="text"
                  name="handle"
                  value={formData.handle}
                  onChange={handleInputChange}
                  error={errors.handle}
                  placeholder="coolsaver123"
                  icon={User}
                  autoComplete="username"
                  hint="Letters, numbers, hyphens, and underscores only"
                />

                <div>
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
                    autoComplete="new-password"
                  />
                  <PasswordStrength password={formData.password} />
                </div>

                <AnimatedInput
                  label="Confirm password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  error={errors.confirmPassword}
                  placeholder="••••••••"
                  icon={Lock}
                  showPasswordToggle
                  showPassword={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  autoComplete="new-password"
                />

                {/* Terms Agreement */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => {
                          setAgreedToTerms(e.target.checked)
                          if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }))
                        }}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${agreedToTerms
                        ? 'bg-emerald-600 border-emerald-600'
                        : errors.terms
                          ? 'border-red-300'
                          : 'border-slate-300 group-hover:border-emerald-400'
                        }`}>
                        {agreedToTerms && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                    <span className="text-sm text-slate-600">
                      I agree to the{' '}
                      <Link to="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {errors.terms && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-sm text-red-600"
                    >
                      {errors.terms}
                    </motion.p>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-emerald-200 hover:shadow-xl disabled:opacity-50 group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>

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

          {/* Sign In Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6 text-slate-600"
          >
            Already have an account?{' '}
            <Link to="/signin" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/" className="inline-flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <img src="/logo.svg" alt="SaveBucks" className="w-8 h-8" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                SaveBucks
              </span>
            </Link>

            <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
              Start saving<br />
              <span className="text-emerald-600">smarter</span> today
            </h1>

            <p className="text-lg text-slate-600 mb-8">
              Create your free account and join our community of deal hunters who save thousands every month.
            </p>

            <div className="space-y-4">
              <FeatureCard
                icon={Gift}
                title="Exclusive Deals"
                description="Access deals you won't find anywhere else"
                delay={0.2}
                color="bg-gradient-to-br from-rose-500 to-pink-600"
              />
              <FeatureCard
                icon={Zap}
                title="Real-time Alerts"
                description="Get notified instantly when prices drop"
                delay={0.4}
                color="bg-gradient-to-br from-amber-500 to-orange-600"
              />
              <FeatureCard
                icon={Heart}
                title="Community Picks"
                description="See what deals other members love"
                delay={0.6}
                color="bg-gradient-to-br from-emerald-500 to-teal-600"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
