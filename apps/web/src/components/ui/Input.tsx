/**
 * Input Component  
 * Premium input with icons, error states, floating labels
 */

import * as React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    error?: string
    label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, leftIcon, rightIcon, error, label, ...props }, ref) => {
        return (
            <div className="relative w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            `flex h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm
               ring-offset-background transition-all duration-200
               file:border-0 file:bg-transparent file:text-sm file:font-medium 
               placeholder:text-gray-400
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0
               disabled:cursor-not-allowed disabled:opacity-50
               dark:bg-gray-900 dark:text-white`,
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            error
                                ? 'border-red-500 focus-visible:ring-red-500'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-1.5 text-xs text-red-500">{error}</p>
                )}
            </div>
        )
    }
)
Input.displayName = 'Input'

// Textarea Component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string
    label?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, label, ...props }, ref) => {
        return (
            <div className="relative w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {label}
                    </label>
                )}
                <textarea
                    className={cn(
                        `flex min-h-[100px] w-full rounded-xl border bg-white px-4 py-3 text-sm
               ring-offset-background transition-all duration-200
               placeholder:text-gray-400
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0
               disabled:cursor-not-allowed disabled:opacity-50
               dark:bg-gray-900 dark:text-white resize-y`,
                        error
                            ? 'border-red-500 focus-visible:ring-red-500'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="mt-1.5 text-xs text-red-500">{error}</p>
                )}
            </div>
        )
    }
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }
