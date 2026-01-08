/**
 * Button Component
 * Premium button with variants using CVA (class-variance-authority)
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
    // Base styles
    `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold
   ring-offset-background transition-all duration-200 
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
   disabled:pointer-events-none disabled:opacity-50
   active:scale-[0.98]`,
    {
        variants: {
            variant: {
                default: `
          bg-gradient-to-r from-blue-500 to-blue-600 text-white 
          hover:from-blue-600 hover:to-blue-700 
          shadow-md hover:shadow-lg
        `,
                secondary: `
          bg-gray-50 text-gray-900 
          hover:bg-gray-200 
          dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700
        `,
                outline: `
          border-2 border-gray-200 bg-transparent text-gray-900
          hover:bg-gray-50 hover:border-gray-300
          dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800
        `,
                ghost: `
          bg-transparent text-gray-600 
          hover:bg-gray-50 hover:text-gray-900
          dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100
        `,
                destructive: `
          bg-gradient-to-r from-red-500 to-red-600 text-white 
          hover:from-red-600 hover:to-red-700
          shadow-md hover:shadow-lg
        `,
                success: `
          bg-gradient-to-r from-green-500 to-green-600 text-white 
          hover:from-green-600 hover:to-green-700
          shadow-md hover:shadow-lg
        `,
                link: `
          text-blue-500 underline-offset-4 hover:underline
          p-0 h-auto
        `,
                premium: `
          bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white 
          hover:from-purple-600 hover:via-pink-600 hover:to-orange-600
          shadow-lg hover:shadow-xl
        `
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-8 rounded-lg px-3 text-xs',
                lg: 'h-12 rounded-xl px-6 text-base',
                xl: 'h-14 rounded-2xl px-8 text-lg',
                icon: 'h-10 w-10 p-0'
            }
        },
        defaultVariants: {
            variant: 'default',
            size: 'default'
        }
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {!isLoading && leftIcon}
                {children}
                {!isLoading && rightIcon}
            </button>
        )
    }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
