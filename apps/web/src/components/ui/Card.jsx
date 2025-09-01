import React from 'react'
import { clsx } from 'clsx'
import { cva } from 'class-variance-authority'
import { motion } from 'framer-motion'

// Card variants
const cardVariants = cva(
  [
    'bg-white rounded-2xl border transition-all duration-200',
    'overflow-hidden'
  ],
  {
    variants: {
      variant: {
        default: [
          'border-secondary-200 shadow-soft',
          'hover:shadow-medium hover:border-secondary-300'
        ],
        elevated: [
          'border-secondary-200 shadow-medium',
          'hover:shadow-strong hover:-translate-y-1'
        ],
        outlined: [
          'border-2 border-secondary-300 shadow-none',
          'hover:border-primary-400 hover:shadow-soft'
        ],
        filled: [
          'border-0 bg-secondary-50 shadow-none',
          'hover:bg-secondary-100 hover:shadow-soft'
        ],
        ghost: [
          'border-0 bg-transparent shadow-none',
          'hover:bg-secondary-50'
        ],
        gradient: [
          'border-0 bg-gradient-to-br from-white to-secondary-50',
          'shadow-soft hover:shadow-medium'
        ],
        glass: [
          'border border-white/20 bg-white/10 backdrop-blur-md',
          'shadow-lg hover:shadow-xl hover:bg-white/20'
        ]
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10'
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-lg',
        md: 'rounded-2xl',
        lg: 'rounded-3xl',
        xl: 'rounded-[2rem]'
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      rounded: 'md'
    }
  }
)

// Main Card component
export const Card = React.forwardRef(({
  children,
  className,
  variant = 'default',
  padding = 'md',
  rounded = 'md',
  hover = false,
  clickable = false,
  animate = true,
  ...props
}, ref) => {
  const Component = animate && (hover || clickable) ? motion.div : 'div'
  
  const motionProps = animate && (hover || clickable) ? {
    whileHover: hover ? { scale: 1.02, y: -2 } : undefined,
    whileTap: clickable ? { scale: 0.98 } : undefined,
    transition: { type: "spring", stiffness: 400, damping: 17 }
  } : {}

  return (
    <Component
      ref={ref}
      className={clsx(
        cardVariants({ variant, padding, rounded }),
        (hover || clickable) && 'cursor-pointer',
        className
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  )
})

Card.displayName = 'Card'

// Card Header component
export const CardHeader = React.forwardRef(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        'flex flex-col space-y-1.5 p-6 pb-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

CardHeader.displayName = 'CardHeader'

// Card Title component
export const CardTitle = React.forwardRef(({
  children,
  className,
  as: Component = 'h3',
  ...props
}, ref) => {
  return (
    <Component
      ref={ref}
      className={clsx(
        'text-2xl font-semibold leading-none tracking-tight text-secondary-900',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
})

CardTitle.displayName = 'CardTitle'

// Card Description component
export const CardDescription = React.forwardRef(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <p
      ref={ref}
      className={clsx(
        'text-sm text-secondary-600 leading-relaxed',
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
})

CardDescription.displayName = 'CardDescription'

// Card Content component
export const CardContent = React.forwardRef(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  )
})

CardContent.displayName = 'CardContent'

// Card Footer component
export const CardFooter = React.forwardRef(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        'flex items-center p-6 pt-0 border-t border-secondary-100 mt-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

CardFooter.displayName = 'CardFooter'

// Specialized card components
export const StatsCard = ({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  color = 'primary',
  className,
  ...props
}) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    warning: 'text-warning-600 bg-warning-50',
    danger: 'text-danger-600 bg-danger-50',
    secondary: 'text-secondary-600 bg-secondary-50'
  }

  return (
    <Card
      variant="elevated"
      hover
      className={clsx('relative overflow-hidden', className)}
      {...props}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-gradient-to-br opacity-10" 
           style={{ background: `var(--color-${color}-500)` }} />
      
      <CardContent className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-secondary-600 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-secondary-900 mb-2">
              {value}
            </p>
            {description && (
              <p className="text-sm text-secondary-500">
                {description}
              </p>
            )}
          </div>
          
          {icon && (
            <div className={clsx(
              'flex items-center justify-center w-12 h-12 rounded-xl',
              colorClasses[color]
            )}>
              {icon}
            </div>
          )}
        </div>
        
        {trend && trendValue && (
          <div className="flex items-center mt-4 pt-4 border-t border-secondary-100">
            <div className={clsx(
              'flex items-center text-sm font-medium',
              trend === 'up' ? 'text-success-600' : 
              trend === 'down' ? 'text-danger-600' : 'text-secondary-600'
            )}>
              {trend === 'up' && '↗'}
              {trend === 'down' && '↘'}
              {trend === 'neutral' && '→'}
              <span className="ml-1">{trendValue}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const FeatureCard = ({
  title,
  description,
  icon,
  image,
  badge,
  action,
  className,
  ...props
}) => {
  return (
    <Card
      variant="elevated"
      hover
      padding="none"
      className={clsx('group', className)}
      {...props}
    >
      {/* Image or icon header */}
      {image || icon ? (
        <div className="relative h-48 bg-gradient-to-br from-secondary-50 to-secondary-100">
          {image ? (
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-4xl">
              {icon}
            </div>
          )}
          
          {badge && (
            <div className="absolute top-4 right-4">
              {badge}
            </div>
          )}
        </div>
      ) : null}
      
      <CardHeader>
        <CardTitle className="group-hover:text-primary-600 transition-colors">
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      
      {action && (
        <CardFooter>
          {action}
        </CardFooter>
      )}
    </Card>
  )
}

export default Card
