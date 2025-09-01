import React, { useState, forwardRef } from 'react'
import { clsx } from 'clsx'
import { cva } from 'class-variance-authority'
import { Icon } from './Icon'
import { motion, AnimatePresence } from 'framer-motion'

// Input variants
const inputVariants = cva(
  [
    'flex w-full rounded-xl border transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'placeholder:text-secondary-400'
  ],
  {
    variants: {
      variant: {
        default: [
          'border-secondary-300 bg-white text-secondary-900',
          'focus:border-primary-500 focus:ring-primary-500/20',
          'hover:border-secondary-400'
        ],
        filled: [
          'border-transparent bg-secondary-100 text-secondary-900',
          'focus:bg-white focus:border-primary-500 focus:ring-primary-500/20',
          'hover:bg-secondary-50'
        ],
        flushed: [
          'border-0 border-b-2 border-secondary-300 bg-transparent rounded-none',
          'focus:border-primary-500 focus:ring-0',
          'hover:border-secondary-400'
        ],
        unstyled: 'border-0 bg-transparent p-0 focus:ring-0'
      },
      size: {
        xs: 'h-7 px-2.5 text-xs',
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-4 text-base',
        xl: 'h-14 px-6 text-lg'
      },
      state: {
        default: '',
        error: 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
        success: 'border-success-500 focus:border-success-500 focus:ring-success-500/20',
        warning: 'border-warning-500 focus:border-warning-500 focus:ring-warning-500/20'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default'
    }
  }
)

// Input component
export const Input = forwardRef(({
  className,
  variant = 'default',
  size = 'md',
  state = 'default',
  leftIcon,
  rightIcon,
  leftElement,
  rightElement,
  error,
  success,
  warning,
  label,
  description,
  required,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false)
  
  // Determine state based on props
  const inputState = error ? 'error' : success ? 'success' : warning ? 'warning' : state

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Left element/icon */}
        {(leftIcon || leftElement) && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            {leftIcon ? (
              <Icon 
                name={leftIcon} 
                size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md'} 
                color="muted" 
              />
            ) : leftElement}
          </div>
        )}

        {/* Input field */}
        <input
          ref={ref}
          className={clsx(
            inputVariants({ variant, size, state: inputState }),
            leftIcon || leftElement ? 'pl-10' : '',
            rightIcon || rightElement ? 'pr-10' : '',
            className
          )}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />

        {/* Right element/icon */}
        {(rightIcon || rightElement) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
            {rightIcon ? (
              <Icon 
                name={rightIcon} 
                size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md'} 
                color="muted" 
              />
            ) : rightElement}
          </div>
        )}

        {/* Floating label animation */}
        {variant === 'filled' && focused && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -top-2 left-2 px-2 bg-white text-xs font-medium text-primary-600 z-20"
          >
            {label}
          </motion.div>
        )}
      </div>

      {/* Helper text */}
      <AnimatePresence mode="wait">
        {(description || error || success || warning) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 text-sm"
          >
            {error && (
              <div className="flex items-center text-danger-600">
                <Icon name="alertCircle" size="xs" className="mr-1" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center text-success-600">
                <Icon name="checkCircle" size="xs" className="mr-1" />
                {success}
              </div>
            )}
            {warning && (
              <div className="flex items-center text-warning-600">
                <Icon name="alertTriangle" size="xs" className="mr-1" />
                {warning}
              </div>
            )}
            {description && !error && !success && !warning && (
              <div className="text-secondary-500">{description}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

Input.displayName = 'Input'

// Textarea component
export const Textarea = forwardRef(({
  className,
  variant = 'default',
  state = 'default',
  error,
  success,
  warning,
  label,
  description,
  required,
  rows = 4,
  resize = true,
  ...props
}, ref) => {
  const inputState = error ? 'error' : success ? 'success' : warning ? 'warning' : state

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      {/* Textarea */}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          inputVariants({ variant, size: 'md', state: inputState }),
          'py-3 min-h-[80px]',
          !resize && 'resize-none',
          className
        )}
        {...props}
      />

      {/* Helper text */}
      <AnimatePresence mode="wait">
        {(description || error || success || warning) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 text-sm"
          >
            {error && (
              <div className="flex items-center text-danger-600">
                <Icon name="alertCircle" size="xs" className="mr-1" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center text-success-600">
                <Icon name="checkCircle" size="xs" className="mr-1" />
                {success}
              </div>
            )}
            {warning && (
              <div className="flex items-center text-warning-600">
                <Icon name="alertTriangle" size="xs" className="mr-1" />
                {warning}
              </div>
            )}
            {description && !error && !success && !warning && (
              <div className="text-secondary-500">{description}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

Textarea.displayName = 'Textarea'

// Search input component
export const SearchInput = forwardRef(({
  onSearch,
  placeholder = "Search...",
  className,
  ...props
}, ref) => {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch?.(query)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Input
        ref={ref}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        leftIcon="search"
        className={className}
        {...props}
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </form>
  )
})

SearchInput.displayName = 'SearchInput'

export default Input
