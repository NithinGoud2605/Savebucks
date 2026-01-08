import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

const TagSuggestionChip = ({ tag, isSelected, onToggle, isAI = false }) => {
  return (
    <button
      type="button"
      onClick={() => onToggle(tag)}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${isSelected
        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
        : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-200'
        }`}
    >
      {isAI && <span className="mr-1">🤖</span>}
      <span style={{ color: tag.color }}>#</span>
      {tag.name}
      {isSelected && (
        <svg className="ml-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  )
}

const AutoTagSuggestions = ({ title, description, url, selectedTags = [], onTagsChange, dealData = null }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showAllTags, setShowAllTags] = useState(false)

  // Get AI suggestions when title/description changes
  const getSuggestionsMutation = useMutation({
    mutationFn: (data) => {
      if (dealData) {
        return api.autoTagging.autoTagDeal(data)
      } else {
        return api.suggestTags(data.title, data.description)
      }
    },
    onSuccess: (data) => {
      if (dealData) {
        setSuggestions(data.suggested_tags || [])
      } else {
        setSuggestions(data || [])
      }
    },
    onError: (error) => {
      console.error('Failed to get tag suggestions:', error)
      setSuggestions([])
    }
  })

  // Get popular tags
  const { data: popularTags = [] } = useQuery({
    queryKey: ['popular-tags'],
    queryFn: () => api.getPopularTags({ limit: 20 }),
  })

  // Auto-suggest when title or description changes
  useEffect(() => {
    if (title?.trim() && title.length > 3) {
      const timeoutId = setTimeout(() => {
        getSuggestionsMutation.mutate({
          title: title,
          description: description || '',
          url: url || '',
          ...dealData
        })
      }, 500) // Debounce

      return () => clearTimeout(timeoutId)
    }
  }, [title, description, url])

  const handleTagToggle = (tag) => {
    if (!tag || !tag.id) return

    const isSelected = selectedTags.some(t => t.id === tag.id)

    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const aiSuggestions = (suggestions || []).filter(tag =>
    tag && tag.id && !selectedTags.some(selected => selected.id === tag.id)
  ).slice(0, 5)

  const remainingPopularTags = (popularTags || []).filter(tag =>
    tag && tag.id &&
    !selectedTags.some(selected => selected.id === tag.id) &&
    !(suggestions || []).some(suggested => suggested.id === tag.id)
  )

  const displayedPopularTags = showAllTags
    ? remainingPopularTags
    : remainingPopularTags.slice(0, 10)

  return (
    <div className="space-y-4">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Tags ({selectedTags.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <TagSuggestionChip
                key={tag.id}
                tag={tag}
                isSelected={true}
                onToggle={handleTagToggle}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🤖 AI Suggestions
            {getSuggestionsMutation.isPending && (
              <span className="ml-2 text-xs text-blue-600">Analyzing...</span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.map(tag => (
              <TagSuggestionChip
                key={tag.id}
                tag={tag}
                isSelected={false}
                onToggle={handleTagToggle}
                isAI={true}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            AI analyzed your content and suggests these tags
          </p>
        </div>
      )}

      {/* Popular Tags */}
      {displayedPopularTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Popular Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {displayedPopularTags.map(tag => (
              <TagSuggestionChip
                key={tag.id}
                tag={tag}
                isSelected={false}
                onToggle={handleTagToggle}
              />
            ))}
          </div>
          {!showAllTags && remainingPopularTags.length > 10 && (
            <button
              type="button"
              onClick={() => setShowAllTags(true)}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2"
            >
              Show {remainingPopularTags.length - 10} more tags...
            </button>
          )}
        </div>
      )}

      {/* Manual Tag Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Custom Tag
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Type a tag name..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const value = e.target.value.trim()
                if (value) {
                  // Create a temporary tag object
                  const customTag = {
                    id: `custom-${Date.now()}`,
                    name: value,
                    color: '#6B7280',
                    slug: value.toLowerCase().replace(/\s+/g, '-')
                  }
                  handleTagToggle(customTag)
                  e.target.value = ''
                }
              }
            }}
          />
          <button
            type="button"
            className="px-4 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            onClick={(e) => {
              const input = e.target.previousElementSibling
              const value = input.value.trim()
              if (value) {
                const customTag = {
                  id: `custom-${Date.now()}`,
                  name: value,
                  color: '#6B7280',
                  slug: value.toLowerCase().replace(/\s+/g, '-')
                }
                handleTagToggle(customTag)
                input.value = ''
              }
            }}
          >
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Press Enter or click Add to create a custom tag
        </p>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Tag Tips
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Good tags help others find your deals</li>
                <li>Use specific tags like "gaming-laptop" rather than just "laptop"</li>
                <li>AI suggestions are based on your title and description</li>
                <li>Popular tags are commonly used by the community</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutoTagSuggestions
export { TagSuggestionChip }
