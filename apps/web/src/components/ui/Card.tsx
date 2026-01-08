/**
 * Card Component
 * Premium card with variants for deals, coupons, etc.
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const cardVariants = cva(
    'rounded-2xl border bg-white dark:bg-gray-900 transition-all duration-300',
    {
        variants: {
            variant: {
                default: `
          border-gray-200 dark:border-gray-800
          shadow-sm hover:shadow-lg
        `,
                elevated: `
          border-gray-100 dark:border-gray-800
          shadow-lg hover:shadow-xl
          hover:-translate-y-1
        `,
                outline: `
          border-2 border-gray-200 dark:border-gray-700
          hover:border-blue-500
        `,
                ghost: `
          border-transparent
          hover:bg-gray-50 dark:hover:bg-gray-800
        `,
                deal: `
          border-gray-200 dark:border-gray-800
          shadow-sm hover:shadow-xl
          hover:-translate-y-1 hover:border-blue-500
        `,
                coupon: `
          border-2 border-dashed border-amber-400 dark:border-amber-600
          bg-gradient-to-br from-amber-50 to-orange-50
          dark:from-amber-900/20 dark:to-orange-900/20
        `,
                ai: `
          border-purple-200 dark:border-purple-800
          bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50
          dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20
          shadow-lg shadow-purple-500/10
        `
            },
            padding: {
                none: 'p-0',
                sm: 'p-3',
                default: 'p-4',
                lg: 'p-6'
            }
        },
        defaultVariants: {
            variant: 'default',
            padding: 'default'
        }
    }
)

export interface CardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
    interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant, padding, interactive, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                cardVariants({ variant, padding }),
                interactive && 'cursor-pointer',
                className
            )}
            {...props}
        />
    )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5', className)}
        {...props}
    />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            'text-lg font-semibold leading-tight tracking-tight text-gray-900 dark:text-white',
            className
        )}
        {...props}
    />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
        {...props}
    />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex items-center pt-4', className)}
        {...props}
    />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
