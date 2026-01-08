/**
 * Premium Progress Component
 * With animated fill and gradient options
 */

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '../../lib/utils'

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'gradient'
    size?: 'sm' | 'md' | 'lg'
}

const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    ProgressProps
>(({ className, value, variant = 'default', size = 'md', ...props }, ref) => {
    const sizeClasses = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
    }

    const indicatorClasses = {
        default: 'bg-blue-600',
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        danger: 'bg-red-500',
        gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
    }

    return (
        <ProgressPrimitive.Root
            ref={ref}
            className={cn(
                'relative w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700',
                sizeClasses[size],
                className
            )}
            {...props}
        >
            <ProgressPrimitive.Indicator
                className={cn(
                    'h-full w-full flex-1 transition-all duration-500 ease-out',
                    indicatorClasses[variant]
                )}
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            />
        </ProgressPrimitive.Root>
    )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
