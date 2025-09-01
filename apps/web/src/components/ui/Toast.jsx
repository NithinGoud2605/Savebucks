import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { Icon } from './Icon'
import { Button, IconButton } from './Button'

// Toast context
const ToastContext = createContext()

// Toast types and their configurations
const toastTypes = {
  success: {
    icon: 'checkCircle',
    color: 'text-success-600',
    bg: 'bg-success-50',
    border: 'border-success-200',
    progress: 'bg-success-500'
  },
  error: {
    icon: 'xCircle',
    color: 'text-danger-600',
    bg: 'bg-danger-50',
    border: 'border-danger-200',
    progress: 'bg-danger-500'
  },
  warning: {
    icon: 'alertTriangle',
    color: 'text-warning-600',
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    progress: 'bg-warning-500'
  },
  info: {
    icon: 'info',
    color: 'text-primary-600',
    bg: 'bg-primary-50',
    border: 'border-primary-200',
    progress: 'bg-primary-500'
  },
  loading: {
    icon: 'loader',
    color: 'text-secondary-600',
    bg: 'bg-secondary-50',
    border: 'border-secondary-200',
    progress: 'bg-secondary-500'
  }
}

// Individual toast component
const ToastItem = ({ toast, onRemove }) => {
  const config = toastTypes[toast.type] || toastTypes.info
  const [progress, setProgress] = useState(100)

  React.useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (toast.duration / 100))
          if (newProgress <= 0) {
            onRemove(toast.id)
            return 0
          }
          return newProgress
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [toast.duration, toast.id, onRemove])

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={clsx(
        'relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm',
        'min-w-[320px] max-w-[480px] p-4',
        config.bg,
        config.border
      )}
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-black/10">
          <motion.div
            className={clsx('h-full', config.progress)}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={clsx('flex-shrink-0', config.color)}>
          <Icon 
            name={config.icon} 
            size="md" 
            animate={toast.type === 'loading'}
            className={toast.type === 'loading' ? 'animate-spin' : ''}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="font-semibold text-secondary-900 mb-1">
              {toast.title}
            </h4>
          )}
          <p className="text-sm text-secondary-700 leading-relaxed">
            {toast.message}
          </p>
          
          {/* Actions */}
          {toast.actions && toast.actions.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {toast.actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'ghost'}
                  size="sm"
                  onClick={() => {
                    action.onClick?.()
                    onRemove(toast.id)
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        {toast.dismissible !== false && (
          <IconButton
            icon="close"
            size="sm"
            variant="ghost"
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 text-secondary-400 hover:text-secondary-600"
          />
        )}
      </div>
    </motion.div>
  )
}

// Toast container component
const ToastContainer = ({ toasts, onRemove, position = 'top-right' }) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4'
  }

  return (
    <div className={clsx('fixed z-50 space-y-3', positionClasses[position])}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Toast provider component
export const ToastProvider = ({ children, maxToasts = 5, position = 'top-right' }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = {
      id,
      duration: 5000,
      dismissible: true,
      ...toast
    }

    setToasts((prev) => {
      const updated = [newToast, ...prev].slice(0, maxToasts)
      return updated
    })

    return id
  }, [maxToasts])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const removeAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const updateToast = useCallback((id, updates) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    )
  }, [])

  const value = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    updateToast
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
        position={position}
      />
    </ToastContext.Provider>
  )
}

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  const { addToast, removeToast, updateToast } = context

  // Helper methods for different toast types
  const toast = {
    success: (message, options = {}) =>
      addToast({ type: 'success', message, ...options }),
    
    error: (message, options = {}) =>
      addToast({ type: 'error', message, duration: 7000, ...options }),
    
    warning: (message, options = {}) =>
      addToast({ type: 'warning', message, ...options }),
    
    info: (message, options = {}) =>
      addToast({ type: 'info', message, ...options }),
    
    loading: (message, options = {}) =>
      addToast({ type: 'loading', message, duration: 0, dismissible: false, ...options }),
    
    custom: (options) => addToast(options),
    
    dismiss: removeToast,
    
    update: updateToast,

    // Convenience methods
    promise: async (promise, messages) => {
      const id = addToast({
        type: 'loading',
        message: messages.loading || 'Loading...',
        duration: 0,
        dismissible: false
      })

      try {
        const result = await promise
        updateToast(id, {
          type: 'success',
          message: messages.success || 'Success!',
          duration: 5000,
          dismissible: true
        })
        return result
      } catch (error) {
        updateToast(id, {
          type: 'error',
          message: messages.error || error.message || 'Something went wrong',
          duration: 7000,
          dismissible: true
        })
        throw error
      }
    }
  }

  return toast
}

// Export components
export { ToastProvider as default, ToastContainer, ToastItem }
export const Toast = {
  Provider: ToastProvider,
  Container: ToastContainer,
  Item: ToastItem
}
