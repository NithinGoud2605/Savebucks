import React from 'react'
import { clsx } from 'clsx'
import { cva } from 'class-variance-authority'
import { Icon, LoadingIcon } from './Icon'
import { motion } from 'framer-motion'

// Button variants using CVA for type-safe styling
const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:scale-95 transform'
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-r from-primary-600 to-primary-700',
          'text-white shadow-lg hover:shadow-xl',
          'hover:from-primary-700 hover:to-primary-800',
          'border border-primary-600'
        ],
        secondary: [
          'bg-secondary-100 text-secondary-900',
          'hover:bg-secondary-200 border border-secondary-200',
          'shadow-sm hover:shadow-md'
        ],
        outline: [
          'bg-transparent border-2 border-primary-600',
          'text-primary-600 hover:bg-primary-50',
          'hover:border-primary-700 hover:text-primary-700'
        ],
        ghost: [
          'bg-transparent text-secondary-700',
          'hover:bg-secondary-100 hover:text-secondary-900'
        ],
        danger: [
          'bg-gradient-to-r from-danger-600 to-danger-700',
          'text-white shadow-lg hover:shadow-xl',
          'hover:from-danger-700 hover:to-danger-800',
          'border border-danger-600'
        ],
        success: [
          'bg-gradient-to-r from-success-600 to-success-700',
          'text-white shadow-lg hover:shadow-xl',
          'hover:from-success-700 hover:to-success-800',
          'border border-success-600'
        ],
        warning: [
          'bg-gradient-to-r from-warning-500 to-warning-600',
          'text-white shadow-lg hover:shadow-xl',
          'hover:from-warning-600 hover:to-warning-700',
          'border border-warning-500'
        ],
        gradient: [
          'bg-gradient-to-r from-purple-600 via-primary-600 to-blue-600',
          'text-white shadow-lg hover:shadow-xl',
          'hover:from-purple-700 hover:via-primary-700 hover:to-blue-700',
          'animate-gradient-x bg-[length:200%_200%]'
        ],
        glass: [
          'bg-white/10 backdrop-blur-md border border-white/20',
          'text-white hover:bg-white/20',
          'shadow-lg hover:shadow-xl'
        ]
      },
      size: {
        xs: 'h-7 px-2.5 text-xs',
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10'
      },
      fullWidth: {
        true: 'w-full'
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
        full: 'rounded-full'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      rounded: 'md'
    }
  }
)

export const Button = React.forwardRef(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  rounded = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  animate = true,
  ...props
}, ref) => {
  const MotionComponent = animate ? motion.button : 'button'
  
  const motionProps = animate ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring", stiffness: 400, damping: 17 }
  } : {}

  return (
    <MotionComponent
      ref={ref}
      className={clsx(
        buttonVariants({ variant, size, fullWidth, rounded }),
        className
      )}
      disabled={disabled || loading}
      {...motionProps}
      {...props}
    >
      {loading && (
        <LoadingIcon size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md'} className="mr-2" />
      )}
      
      {leftIcon && !loading && (
        <Icon 
          name={leftIcon} 
          size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md'} 
          className="mr-2" 
        />
      )}
      
      {children}
      
      {rightIcon && (
        <Icon 
          name={rightIcon} 
          size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md'} 
          className="ml-2" 
        />
      )}
    </MotionComponent>
  )
})

Button.displayName = 'Button'

// Specialized button components
export const IconButton = React.forwardRef(({
  icon,
  variant = 'ghost',
  size = 'md',
  loading = false,
  className,
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      className={clsx(
        size === 'xs' && 'h-6 w-6',
        size === 'sm' && 'h-8 w-8',
        size === 'md' && 'h-10 w-10',
        size === 'lg' && 'h-12 w-12',
        size === 'xl' && 'h-14 w-14',
        className
      )}
      loading={loading}
      {...props}
    >
      {!loading && <Icon name={icon} size={size} />}
    </Button>
  )
})

IconButton.displayName = 'IconButton'

export const FloatingActionButton = React.forwardRef(({
  icon,
  children,
  className,
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      variant="primary"
      size="lg"
      rounded="full"
      className={clsx(
        'fixed bottom-6 right-6 z-50 shadow-2xl hover:shadow-3xl',
        'bg-gradient-to-r from-primary-600 to-primary-700',
        'hover:from-primary-700 hover:to-primary-800',
        className
      )}
      leftIcon={icon}
      animate={true}
      {...props}
    >
      {children}
    </Button>
  )
})

FloatingActionButton.displayName = 'FloatingActionButton'

// Button group component
export const ButtonGroup = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        'inline-flex rounded-xl border border-secondary-200 overflow-hidden',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            className: clsx(
              child.props.className,
              'rounded-none border-0',
              index > 0 && 'border-l border-secondary-200'
            )
          })
        }
        return child
      })}
    </div>
  )
}

export default Button
