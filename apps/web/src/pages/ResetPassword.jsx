import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supa } from '../lib/supa.js'
import { toast } from '../lib/toast.js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  Shield,
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
    transition={{ duration: 15, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
)

// Animated input
const AnimatedInput = ({ label, name, value, onChange, error, placeholder, showPassword, onTogglePassword }) => {
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
      <div className="relative">
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-violet-500' : 'text-slate-400'
          }`}>
          <Lock className="w-5 h-5" />
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoComplete="new-password"
          className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl bg-white text-slate-900 placeholder-slate-400 transition-all outline-none ${error
              ? 'border-red-300 focus:border-red-500'
              : isFocused
                ? 'border-violet-400 ring-4 ring-violet-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-sm text-red-600"
          >
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
      className="mt-3 space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength - 1] : 'bg-slate-200'
                }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${strength === 4 ? 'text-emerald-600' :
            strength >= 2 ? 'text-yellow-600' : 'text-red-600'
          }`}>
          {strengthLabels[strength - 1] || 'Too weak'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {checks.map((check, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 text-xs ${check.valid ? 'text-emerald-600' : 'text-slate-400'
              }`}
          >
            {check.valid ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Check for valid reset session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supa.auth.getSession()

        if (error || !session) {
          toast.error('Invalid or expired reset link')
          navigate('/forgot-password')
          return
        }

        setIsValidSession(true)
      } catch (error) {
        console.error('Session check error:', error)
        navigate('/forgot-password')
      } finally {
        setIsChecking(false)
      }
    }

    checkSession()
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)

    try {
      const { error } = await supa.auth.updateUser({
        password: formData.password
      })

      if (error) throw error

      setIsSuccess(true)
      toast.success('Password updated successfully!')

      // Redirect to sign in after delay
      setTimeout(() => {
        navigate('/signin')
      }, 3000)
    } catch (error) {
      console.error('Password update error:', error)
      toast.error(error.message || 'Failed to update password')
      setErrors({ password: 'Failed to update password. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Verifying reset link...</p>
        </motion.div>
      </div>
    )
  }

  if (!isValidSession) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/50 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Floating shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingShape delay={0} x={-100} y={-100} size={400} color="bg-violet-300" />
        <FloatingShape delay={2} x={800} y={100} size={300} color="bg-purple-300" />
        <FloatingShape delay={4} x={400} y={500} size={350} color="bg-pink-300" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg">
              <img src="/logo.svg" alt="SaveBucks" className="w-8 h-8" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              SaveBucks
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-8">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </motion.div>

                <h2 className="text-2xl font-bold text-slate-900 mb-2">Password updated!</h2>
                <p className="text-slate-600 mb-6">
                  Your password has been changed successfully.<br />
                  Redirecting you to sign in...
                </p>

                <Link
                  to="/signin"
                  className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium"
                >
                  <ArrowRight className="w-4 h-4" />
                  Sign in now
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-violet-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Set new password</h2>
                  <p className="text-slate-600">
                    Create a strong password for your account.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <AnimatedInput
                      label="New password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                      placeholder="••••••••"
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                    />
                    <PasswordStrength password={formData.password} />
                  </div>

                  <AnimatedInput
                    label="Confirm new password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    placeholder="••••••••"
                    showPassword={showConfirmPassword}
                    onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  />

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-4 py-3.5 rounded-xl font-semibold shadow-lg disabled:opacity-50 group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          Update password
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>

                <div className="text-center mt-6">
                  <Link
                    to="/signin"
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
