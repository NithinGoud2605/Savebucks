import React from 'react'
import { clsx } from 'clsx'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div className={clsx('text-center py-12', className)}>
      {Icon && (
        <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action}
    </div>
  )
}

export function NoDealsFound({ searchQuery }) {
  return (
    <EmptyState
      icon={({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )}
      title={searchQuery ? "No deals found" : "No deals yet"}
      description={
        searchQuery 
          ? "Try adjusting your search or check back later for new deals."
          : "Be the first to share a great deal with the community!"
      }
    />
  )
}
