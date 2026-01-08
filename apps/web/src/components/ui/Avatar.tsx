/**
 * Avatar Component
 * Premium avatar with fallback initials
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { User } from 'lucide-react'

const avatarVariants = cva(
    'relative flex shrink-0 overflow-hidden rounded-full bg-gradient-to-br',
    {
        variants: {
            size: {
                xs: 'h-6 w-6 text-xs',
                sm: 'h-8 w-8 text-sm',
                default: 'h-10 w-10 text-sm',
                lg: 'h-12 w-12 text-base',
                xl: 'h-16 w-16 text-lg'
            },
            gradient: {
                default: 'from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600',
                blue: 'from-blue-400 to-blue-600',
                purple: 'from-purple-400 to-purple-600',
                green: 'from-green-400 to-green-600',
                orange: 'from-orange-400 to-orange-600',
                pink: 'from-pink-400 to-pink-600',
                rainbow: 'from-purple-500 via-pink-500 to-orange-500'
            }
        },
        defaultVariants: {
            size: 'default',
            gradient: 'default'
        }
    }
)

export interface AvatarProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
    src?: string | null
    alt?: string
    fallback?: string
}

function Avatar({
    className,
    size,
    gradient,
    src,
    alt,
    fallback,
    ...props
}: AvatarProps) {
    const [imageError, setImageError] = React.useState(false)

    const getInitials = (name?: string) => {
        if (!name) return null
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const initials = getInitials(fallback)

    return (
        <div className={cn(avatarVariants({ size, gradient }), className)} {...props}>
            {src && !imageError ? (
                <img
                    src={src}
                    alt={alt || fallback || 'Avatar'}
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover"
                />
            ) : initials ? (
                <span className="flex h-full w-full items-center justify-center font-medium text-white">
                    {initials}
                </span>
            ) : (
                <span className="flex h-full w-full items-center justify-center text-gray-500 dark:text-gray-400">
                    <User className="h-1/2 w-1/2" />
                </span>
            )}
        </div>
    )
}

export { Avatar, avatarVariants }
