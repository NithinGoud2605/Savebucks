import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { clsx } from 'clsx'
import {
  TagIcon,
  XMarkIcon,
  PlusIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

const TagSelector = ({
  selectedTags = [],
  onTagsChange,
  title = '',
  description = '',
  maxTags = 10,
  showSuggestions = true,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllTags, setShowAllTags] = useState(false)

  // Fetch all tags
  const { data: allTags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.getTags({ limit: 200 }),
  })

  // Fetch tag suggestions based on title/description
  const { data: suggestedTags = [] } = useQuery({
    queryKey: ['tag-suggestions', title, description],
    queryFn: () => api.suggestTags(title, description, 8),
    enabled: showSuggestions && (!!title || !!description),
  })

  // Filter tags based on search query
  const filteredTags = allTags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get display tags (featured first, then by category)
  const displayTags = showAllTags 
    ? filteredTags
    : filteredTags.filter(tag => tag.is_featured).slice(0, 20)

  // Group tags by category for better organization
  const tagsByCategory = displayTags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = []
    }
    acc[tag.category].push(tag)
    return acc
  }, {})

  const handleTagToggle = (tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id)
    
    if (isSelected) {
      // Remove tag
      onTagsChange(selectedTags.filter(t => t.id !== tag.id))
    } else if (selectedTags.length < maxTags) {
      // Add tag
      onTagsChange([...selectedTags, tag])
    }
  }

  const handleRemoveTag = (tagId) => {
    onTagsChange(selectedTags.filter(t => t.id !== tagId))
  }

  const applySuggestedTag = (suggestion) => {
    const tag = allTags.find(t => t.id === suggestion.tag_id)
    if (tag && !selectedTags.some(t => t.id === tag.id) && selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, tag])
    }
  }

  const categoryOrder = ['category', 'brand', 'feature', 'discount', 'price-range', 'seasonal', 'custom']
  const sortedCategories = Object.keys(tagsByCategory).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a)
    const bIndex = categoryOrder.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  if (isLoading) {
    return (
      <div className={clsx('animate-pulse', className)}>
        <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Selected Tags ({selectedTags.length}/{maxTags})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  border: `1px solid ${tag.color}40`
                }}
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {tag.name}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-2 p-0.5 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {showSuggestions && suggestedTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <LightBulbIcon className="h-4 w-4 text-yellow-500" />
            <label className="text-sm font-medium text-gray-700">
              Suggested Tags
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedTags
              .filter(suggestion => !selectedTags.some(t => t.tag_id === suggestion.tag_id))
              .slice(0, 5)
              .map((suggestion) => (
                <button
                  key={suggestion.tag_id}
                  type="button"
                  onClick={() => applySuggestedTag(suggestion)}
                  disabled={selectedTags.length >= maxTags}
                  className="inline-flex items-center px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-sm font-medium hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  {suggestion.tag_name}
                  <span className="ml-1 text-xs opacity-75">
                    {Math.round(suggestion.relevance_score * 100)}%
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Tag Search */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Add Tags
        </label>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tag Categories */}
      <div className="space-y-4">
        {sortedCategories.map((category) => (
          <div key={category} className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 capitalize flex items-center">
              {category === 'category' && <TagIcon className="h-4 w-4 mr-1" />}
              {category === 'brand' && <SparklesIcon className="h-4 w-4 mr-1" />}
              {category}
              <span className="ml-2 text-xs text-gray-500">
                ({tagsByCategory[category].length})
              </span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {tagsByCategory[category].map((tag) => {
                const isSelected = selectedTags.some(t => t.id === tag.id)
                const isDisabled = !isSelected && selectedTags.length >= maxTags
                
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    disabled={isDisabled}
                    className={clsx(
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all',
                      isSelected
                        ? 'ring-2 ring-offset-1'
                        : 'hover:scale-105',
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                    style={{
                      backgroundColor: isSelected ? `${tag.color}30` : `${tag.color}10`,
                      color: tag.color,
                      border: `1px solid ${tag.color}${isSelected ? '60' : '30'}`,
                      ...(isSelected && { ringColor: `${tag.color}60` })
                    }}
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag.name}
                    {tag.is_featured && (
                      <SparklesIcon className="h-3 w-3 ml-1 opacity-75" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Show More Tags */}
      {!showAllTags && filteredTags.length > displayTags.length && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowAllTags(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Show {filteredTags.length - displayTags.length} More Tags
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500">
        Select up to {maxTags} tags to help categorize your {title ? 'deal' : 'item'}. 
        Tags help users find relevant content and improve discoverability.
      </div>
    </div>
  )
}

export default TagSelector
