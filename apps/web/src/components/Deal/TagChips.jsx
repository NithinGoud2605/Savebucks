import React from 'react'
import { clsx } from 'clsx'

export function TagChips({ tags = [], onTagClick, selectedTags = [], className }) {
  if (!tags.length) return null

  return (
    <div className={clsx('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag)
        return (
          <button
            key={tag}
            onClick={() => onTagClick?.(tag)}
            className={clsx(
              'px-2 py-1 rounded-full text-xs font-medium transition-colors focus-ring',
              onTagClick ? 'cursor-pointer' : 'cursor-default',
              isSelected
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-50 text-gray-700',
              onTagClick && !isSelected && 'hover:bg-gray-200'
            )}
            disabled={!onTagClick}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}
