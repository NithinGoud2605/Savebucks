import React from 'react'
import { clsx } from 'clsx'
import { cva } from 'class-variance-authority'
import { Icon } from './Icon'
import { motion } from 'framer-motion'

// Badge variants
const badgeVariants = cva(
  [
    'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200',
    'select-none whitespace-nowrap'
  ],
  {
    variants: {
      variant: {
        default: 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200',
        primary: 'bg-primary-100 text-primary-800 hover:bg-primary-200',
        secondary: 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200',
        success: 'bg-success-100 text-success-800 hover:bg-success-200',
        warning: 'bg-warning-100 text-warning-800 hover:bg-warning-200',
        danger: 'bg-danger-100 text-danger-800 hover:bg-danger-200',
        outline: 'border border-secondary-300 bg-transparent text-secondary-700 hover:bg-secondary-50',
        'outline-primary': 'border border-primary-300 bg-transparent text-primary-700 hover:bg-primary-50',
        'outline-success': 'border border-success-300 bg-transparent text-success-700 hover:bg-success-50',
        'outline-warning': 'border border-warning-300 bg-transparent text-warning-700 hover:bg-warning-50',
        'outline-danger': 'border border-danger-300 bg-transparent text-danger-700 hover:bg-danger-50',
        gradient: 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg hover:shadow-xl',
        glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
        solid: 'bg-secondary-900 text-white hover:bg-secondary-800'
      },
      size: {
        xs: 'px-2 py-0.5 text-xs h-5',
        sm: 'px-2.5 py-0.5 text-xs h-6',
        md: 'px-3 py-1 text-sm h-7',
        lg: 'px-4 py-1.5 text-sm h-8',
        xl: 'px-5 py-2 text-base h-10'
      },
      rounded: {
        sm: 'rounded-md',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        full: 'rounded-full'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      rounded: 'full'
    }
  }
)

// Main Badge component
export const Badge = React.forwardRef(({
  children,
  className,
  variant = 'default',
  size = 'md',
  rounded = 'full',
  leftIcon,
  rightIcon,
  removable = false,
  onRemove,
  animate = false,
  ...props
}, ref) => {
  const Component = animate ? motion.span : 'span'
  
  const motionProps = animate ? {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
    transition: { type: "spring", stiffness: 500, damping: 30 }
  } : {}

  return (
    <Component
      ref={ref}
      className={clsx(badgeVariants({ variant, size, rounded }), className)}
      {...motionProps}
      {...props}
    >
      {leftIcon && (
        <Icon 
          name={leftIcon} 
          size={size === 'xs' ? 'xs' : size === 'sm' ? 'xs' : 'sm'} 
          className="mr-1" 
        />
      )}
      
      {children}
      
      {rightIcon && !removable && (
        <Icon 
          name={rightIcon} 
          size={size === 'xs' ? 'xs' : size === 'sm' ? 'xs' : 'sm'} 
          className="ml-1" 
        />
      )}
      
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
        >
          <Icon 
            name="close" 
            size={size === 'xs' ? 'xs' : size === 'sm' ? 'xs' : 'sm'} 
          />
        </button>
      )}
    </Component>
  )
})

Badge.displayName = 'Badge'

// Status Badge component
export const StatusBadge = ({
  status,
  children,
  className,
  ...props
}) => {
  const statusConfig = {
    online: { variant: 'success', leftIcon: 'checkCircle', text: 'Online' },
    offline: { variant: 'danger', leftIcon: 'xCircle', text: 'Offline' },
    pending: { variant: 'warning', leftIcon: 'clock', text: 'Pending' },
    processing: { variant: 'primary', leftIcon: 'loader', text: 'Processing' },
    completed: { variant: 'success', leftIcon: 'check', text: 'Completed' },
    failed: { variant: 'danger', leftIcon: 'alertCircle', text: 'Failed' },
    draft: { variant: 'secondary', leftIcon: 'edit', text: 'Draft' },
    published: { variant: 'success', leftIcon: 'eye', text: 'Published' },
    archived: { variant: 'secondary', leftIcon: 'archive', text: 'Archived' }
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <Badge
      variant={config.variant}
      leftIcon={config.leftIcon}
      className={className}
      {...props}
    >
      {children || config.text}
    </Badge>
  )
}

// Notification Badge component (for counts, etc.)
export const NotificationBadge = ({
  count,
  max = 99,
  showZero = false,
  className,
  ...props
}) => {
  if (!showZero && (!count || count === 0)) return null

  const displayCount = count > max ? `${max}+` : count.toString()

  return (
    <Badge
      variant="danger"
      size="xs"
      className={clsx(
        'absolute -top-1 -right-1 min-w-[1.25rem] h-5',
        className
      )}
      animate
      {...props}
    >
      {displayCount}
    </Badge>
  )
}

// Trend Badge component
export const TrendBadge = ({
  trend,
  value,
  className,
  ...props
}) => {
  const trendConfig = {
    up: { variant: 'success', icon: 'trendingUp', color: 'text-success-600' },
    down: { variant: 'danger', icon: 'trendingDown', color: 'text-danger-600' },
    neutral: { variant: 'secondary', icon: 'minus', color: 'text-secondary-600' }
  }

  const config = trendConfig[trend] || trendConfig.neutral

  return (
    <Badge
      variant={config.variant}
      leftIcon={config.icon}
      className={className}
      {...props}
    >
      {value}
    </Badge>
  )
}

// Priority Badge component
export const PriorityBadge = ({
  priority,
  className,
  ...props
}) => {
  const priorityConfig = {
    low: { variant: 'secondary', text: 'Low', icon: 'minus' },
    medium: { variant: 'warning', text: 'Medium', icon: 'minus' },
    high: { variant: 'danger', text: 'High', icon: 'alertTriangle' },
    urgent: { variant: 'gradient', text: 'Urgent', icon: 'zap' }
  }

  const config = priorityConfig[priority] || priorityConfig.low

  return (
    <Badge
      variant={config.variant}
      leftIcon={config.icon}
      className={className}
      {...props}
    >
      {config.text}
    </Badge>
  )
}

// Tag Badge component (for categories, tags, etc.)
export const TagBadge = ({
  children,
  color,
  removable = false,
  onRemove,
  className,
  ...props
}) => {
  // Generate color based on string hash if color not provided
  const getColorFromString = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = ['primary', 'success', 'warning', 'danger', 'secondary']
    return colors[Math.abs(hash) % colors.length]
  }

  const badgeColor = color || getColorFromString(children?.toString() || '')

  return (
    <Badge
      variant={badgeColor}
      size="sm"
      removable={removable}
      onRemove={onRemove}
      className={clsx('font-medium', className)}
      {...props}
    >
      {children}
    </Badge>
  )
}

export default Badge
