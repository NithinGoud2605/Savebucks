import React from 'react'
import { motion } from 'framer-motion'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-lg hover:shadow-xl",
        secondary: "bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500",
        outline: "border-2 border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500",
        ghost: "bg-transparent hover:bg-gray-50 focus:ring-gray-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl",
        success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-lg hover:shadow-xl",
        gradient: "bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700 focus:ring-primary-500 shadow-lg hover:shadow-xl",
        glassmorphism: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 focus:ring-white/50"
      },
      size: {
        xs: "text-xs px-2.5 py-1.5 rounded-lg",
        sm: "text-sm px-3 py-2 rounded-lg",
        md: "text-sm px-4 py-2.5 rounded-xl",
        lg: "text-base px-6 py-3 rounded-xl",
        xl: "text-lg px-8 py-4 rounded-2xl"
      },
      fullWidth: {
        true: "w-full",
        false: ""
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false
    }
  }
)

const iconSizeMap = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-4 h-4",
  lg: "w-5 h-5",
  xl: "w-6 h-6"
}

export const ModernButton = React.forwardRef(({
  className,
  variant,
  size,
  fullWidth,
  leftIcon,
  rightIcon,
  isLoading = false,
  loadingText,
  children,
  asChild = false,
  onClick,
  ...props
}, ref) => {
  const Comp = asChild ? motion.div : motion.button
  const iconSize = iconSizeMap[size || 'md']

  const handleClick = (e) => {
    if (!isLoading && onClick) {
      // Add ripple effect
      const button = e.currentTarget
      const ripple = document.createElement('span')
      const rect = button.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      ripple.style.width = ripple.style.height = size + 'px'
      ripple.style.left = x + 'px'
      ripple.style.top = y + 'px'
      ripple.classList.add('ripple')

      button.appendChild(ripple)

      setTimeout(() => {
        ripple.remove()
      }, 600)

      onClick(e)
    }
  }

  return (
    <Comp
      ref={ref}
      className={`${buttonVariants({ variant, size, fullWidth, className })} relative overflow-hidden`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className={`${iconSize} animate-spin mr-2`} />
      )}

      {!isLoading && leftIcon && (
        <span className={`${iconSize} mr-2`}>
          {leftIcon}
        </span>
      )}

      <span className="relative z-10">
        {isLoading && loadingText ? loadingText : children}
      </span>

      {!isLoading && rightIcon && (
        <span className={`${iconSize} ml-2`}>
          {rightIcon}
        </span>
      )}

      <style jsx>{`
        .ripple {
          position: absolute;
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 600ms ease-out;
          background-color: rgba(255, 255, 255, 0.3);
        }

        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </Comp>
  )
})

ModernButton.displayName = 'ModernButton'

// Button Group Component
export const ButtonGroup = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex rounded-xl shadow-sm ${className}`} role="group">
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return null

        const isFirst = index === 0
        const isLast = index === React.Children.count(children) - 1

        return React.cloneElement(child, {
          className: `${child.props.className || ''} ${!isFirst && !isLast ? 'rounded-none border-x-0' : ''
            } ${isFirst ? 'rounded-r-none' : ''} ${isLast ? 'rounded-l-none' : ''}`,
        })
      })}
    </div>
  )
}

// Icon Button Component
export const IconButton = React.forwardRef(({
  icon,
  size = 'md',
  variant = 'ghost',
  className = '',
  tooltip,
  ...props
}, ref) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14'
  }

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  }

  return (
    <div className="relative group">
      <ModernButton
        ref={ref}
        variant={variant}
        size="xs"
        className={`${sizeClasses[size]} !p-0 ${className}`}
        {...props}
      >
        <span className={iconSizes[size]}>
          {icon}
        </span>
      </ModernButton>

      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
})

IconButton.displayName = 'IconButton'

// Floating Action Button
export const FAB = ({ icon, onClick, className = '', ...props }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 w-14 h-14 
        bg-gradient-to-r from-primary-600 to-purple-600 
        text-white rounded-full shadow-lg hover:shadow-xl 
        flex items-center justify-center z-40
        ${className}
      `}
      {...props}
    >
      <span className="w-6 h-6">
        {icon}
      </span>
    </motion.button>
  )
}

// Toggle Button
export const ToggleButton = ({ isActive, onToggle, activeIcon, inactiveIcon, className = '' }) => {
  return (
    <motion.button
      onClick={onToggle}
      className={`
        relative w-14 h-8 rounded-full transition-colors duration-200
        ${isActive ? 'bg-primary-600' : 'bg-gray-300'}
        ${className}
      `}
    >
      <motion.div
        layout
        className={`
          absolute top-1 w-6 h-6 bg-white rounded-full shadow-md
          flex items-center justify-center
          ${isActive ? 'left-7' : 'left-1'}
        `}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {isActive ? activeIcon : inactiveIcon}
      </motion.div>
    </motion.button>
  )
}
