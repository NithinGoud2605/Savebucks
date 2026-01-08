/**
 * Skeleton Component
 * Premium loading placeholder with shimmer animation
 */

import * as React from 'react'
import { cn } from '../../lib/utils'

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-shimmer',
                className
            )}
            {...props}
        />
    )
}

// Pre-built skeleton variants
function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
            <Skeleton className="h-40 w-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
            </div>
        </div>
    )
}

function SkeletonDeal() {
    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex gap-4">
                <Skeleton className="h-24 w-24 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-12" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function SkeletonMessage() {
    return (
        <div className="flex gap-3 p-4">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        </div>
    )
}

function SkeletonAvatar({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
    const sizeClasses = {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        lg: 'h-12 w-12'
    }
    return <Skeleton className={cn('rounded-full', sizeClasses[size])} />
}

function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {[...Array(count)].map((_, i) => (
                <SkeletonDeal key={i} />
            ))}
        </div>
    )
}

// Aliases for backwards compatibility
const DealCardSkeleton = SkeletonDeal
const CouponCardSkeleton = SkeletonCard
const UserCardSkeleton = SkeletonMessage
const FeedSkeleton = SkeletonList

export {
    Skeleton,
    SkeletonCard,
    SkeletonDeal,
    SkeletonMessage,
    SkeletonAvatar,
    SkeletonList,
    DealCardSkeleton,
    CouponCardSkeleton,
    UserCardSkeleton,
    FeedSkeleton
}
