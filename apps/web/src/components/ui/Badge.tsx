/**
 * Badge Component
 * Premium badges for status, discounts, categories
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900',
                secondary: 'border-transparent bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
                outline: 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
                success: 'border-transparent bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                warning: 'border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                destructive: 'border-transparent bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                discount: 'border-transparent bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm',
                hot: 'border-transparent bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse',
                new: 'border-transparent bg-gradient-to-r from-blue-500 to-purple-500 text-white',
                verified: 'border-transparent bg-gradient-to-r from-green-500 to-emerald-500 text-white',
                ai: 'border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            }
        },
        defaultVariants: {
            variant: 'default'
        }
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
