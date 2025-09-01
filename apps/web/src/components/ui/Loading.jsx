import React from 'react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { Icon, LoadingIcon } from './Icon'

// Skeleton loader component
export const Skeleton = ({ 
  className,
  width,
  height,
  rounded = 'md',
  animate = true,
  ...props 
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  }

  return (
    <div
      className={clsx(
        'bg-secondary-200',
        animate && 'animate-shimmer',
        roundedClasses[rounded],
        className
      )}
      style={{ width, height }}
      {...props}
    />
  )
}

// Card skeleton
export const CardSkeleton = ({ className, compact = false }) => {
  return (
    <div className={clsx('bg-white rounded-2xl border border-secondary-200 p-6', className)}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton width="80px" height="20px" rounded="full" />
          <Skeleton width="60px" height="20px" rounded="full" />
        </div>
        
        {/* Title */}
        <Skeleton width="100%" height="24px" className="mb-3" />
        <Skeleton width="70%" height="16px" className="mb-4" />
        
        {/* Image */}
        {!compact && (
          <Skeleton width="100%" height="200px" rounded="lg" className="mb-4" />
        )}
        
        {/* Content */}
        <Skeleton width="100%" height="16px" className="mb-2" />
        <Skeleton width="80%" height="16px" className="mb-4" />
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton width="60px" height="16px" />
            <Skeleton width="40px" height="16px" />
          </div>
          <Skeleton width="80px" height="32px" rounded="lg" />
        </div>
      </div>
    </div>
  )
}

// List skeleton
export const ListSkeleton = ({ items = 5, className }) => {
  return (
    <div className={clsx('space-y-4', className)}>
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-secondary-200">
          <Skeleton width="60px" height="60px" rounded="lg" />
          <div className="flex-1 space-y-2">
            <Skeleton width="100%" height="20px" />
            <Skeleton width="70%" height="16px" />
            <div className="flex items-center gap-2">
              <Skeleton width="40px" height="12px" />
              <Skeleton width="40px" height="12px" />
            </div>
          </div>
          <Skeleton width="80px" height="32px" rounded="lg" />
        </div>
      ))}
    </div>
  )
}

// Loading spinner component
export const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary',
  className,
  ...props 
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    danger: 'text-danger-600',
    white: 'text-white'
  }

  return (
    <LoadingIcon
      size={size}
      className={clsx(
        colorClasses[color],
        className
      )}
      {...props}
    />
  )
}

// Dots loading animation
export const LoadingDots = ({ className, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
    white: 'bg-white'
  }

  return (
    <div className={clsx('flex items-center space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={clsx('w-2 h-2 rounded-full', colorClasses[color])}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  )
}

// Pulse loading animation
export const LoadingPulse = ({ className, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-200',
    secondary: 'bg-secondary-200',
    success: 'bg-success-200',
    warning: 'bg-warning-200',
    danger: 'bg-danger-200',
    white: 'bg-white/20'
  }

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <motion.div
        className={clsx('w-16 h-16 rounded-full', colorClasses[color])}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}

// Loading overlay
export const LoadingOverlay = ({ 
  show = true, 
  message = 'Loading...', 
  variant = 'spinner',
  className 
}) => {
  if (!show) return null

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <LoadingDots color="white" />
      case 'pulse':
        return <LoadingPulse color="white" />
      default:
        return <LoadingSpinner size="lg" color="white" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        className
      )}
    >
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="text-center">
          <div className="mb-4">
            {renderLoader()}
          </div>
          {message && (
            <p className="text-white font-medium">{message}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Page loading component
export const PageLoading = ({ message = 'Loading page...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="text-center">
        <div className="mb-6">
          <LoadingSpinner size="xl" />
        </div>
        <h2 className="text-xl font-semibold text-secondary-900 mb-2">
          {message}
        </h2>
        <p className="text-secondary-600">
          Please wait while we load the content
        </p>
      </div>
    </div>
  )
}

// Button loading state
export const ButtonLoading = ({ children, loading = false, ...props }) => {
  return (
    <button disabled={loading} {...props}>
      <div className="flex items-center justify-center">
        {loading && <LoadingSpinner size="sm" className="mr-2" />}
        {children}
      </div>
    </button>
  )
}

// Progress bar
export const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  color = 'primary',
  size = 'md',
  showLabel = false,
  className 
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600'
  }

  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm text-secondary-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-secondary-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <motion.div
          className={clsx('h-full rounded-full', colorClasses[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

export default LoadingSpinner
