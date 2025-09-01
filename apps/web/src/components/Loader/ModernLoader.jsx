import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, ShoppingBag, Tag, Sparkles } from 'lucide-react'

// Full Page Loader
export const PageLoader = () => {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
          >
            <ShoppingBag className="w-10 h-10 text-white" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-primary-600/20 rounded-full blur-xl"
          />
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-gray-600 font-medium"
        >
          Loading amazing deals...
        </motion.p>
      </motion.div>
    </div>
  )
}

// Inline Spinner
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  )
}

// Content Loader (Skeleton)
export const ContentLoader = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        )
      
      case 'list':
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="animate-pulse flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="flex gap-4">
                  <div className="h-8 bg-gray-200 rounded w-20" />
                  <div className="h-8 bg-gray-200 rounded w-32" />
                </div>
              </div>
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  )
}

// Loading Button
export const LoadingButton = ({ children, isLoading, className = '', ...props }) => {
  return (
    <button
      disabled={isLoading}
      className={`relative ${className} ${isLoading ? 'cursor-not-allowed' : ''}`}
      {...props}
    >
      <span className={`flex items-center justify-center gap-2 ${isLoading ? 'opacity-0' : ''}`}>
        {children}
      </span>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" />
        </div>
      )}
    </button>
  )
}

// Deal Loading Animation
export const DealLoader = () => {
  const icons = [ShoppingBag, Tag, Sparkles]
  
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex gap-4">
        {icons.map((Icon, index) => (
          <motion.div
            key={index}
            initial={{ y: 0 }}
            animate={{ y: [-10, 0, -10] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
            className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center"
          >
            <Icon className="w-6 h-6 text-primary-600" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Loading Overlay
export const LoadingOverlay = ({ isLoading, children }) => {
  if (!isLoading) return children

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    </div>
  )
}

// Progress Bar
export const ProgressBar = ({ progress = 0, className = '' }) => {
  return (
    <div className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
        className="h-full bg-gradient-to-r from-primary-600 to-purple-600"
      />
    </div>
  )
}