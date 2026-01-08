import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from '../../lib/toast'
import { clsx } from 'clsx'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  SparklesIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const TagManagement = () => {
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Fetch tags
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['admin-tags', selectedCategory],
    queryFn: () => api.getTags({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      limit: 200
    }),
  })

  // Fetch popular tags for insights
  const { data: popularTags = [] } = useQuery({
    queryKey: ['popular-tags'],
    queryFn: () => api.getPopularTags({ limit: 10 }),
  })

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: (tagData) => api.createTag(tagData),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tags'])
      queryClient.invalidateQueries(['popular-tags'])
      setShowCreateForm(false)
      toast.success('Tag created successfully!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create tag')
    }
  })

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: ({ id, ...tagData }) => api.updateTag(id, tagData),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tags'])
      queryClient.invalidateQueries(['popular-tags'])
      setEditingTag(null)
      toast.success('Tag updated successfully!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update tag')
    }
  })

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: (tagId) => api.deleteTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tags'])
      queryClient.invalidateQueries(['popular-tags'])
      toast.success('Tag deleted successfully!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete tag')
    }
  })

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'category', label: 'Categories' },
    { value: 'brand', label: 'Brands' },
    { value: 'feature', label: 'Features' },
    { value: 'price-range', label: 'Price Ranges' },
    { value: 'discount', label: 'Discounts' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'custom', label: 'Custom' },
  ]

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6366F1'
  ]

  const handleCreateTag = (formData) => {
    createTagMutation.mutate(formData)
  }

  const handleUpdateTag = (formData) => {
    updateTagMutation.mutate({ id: editingTag.id, ...formData })
  }

  const handleDeleteTag = (tagId) => {
    if (window.confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
      deleteTagMutation.mutate(tagId)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-300 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tag Management</h1>
          <p className="text-gray-600">Manage tags for deals and coupons categorization</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Tag
        </button>
      </div>

      {/* Popular Tags Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {popularTags.map((tag) => (
            <div key={tag.tag_id} className="text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                style={{ backgroundColor: `${tag.tag_color}20` }}
              >
                <TagIcon className="h-6 w-6" style={{ color: tag.tag_color }} />
              </div>
              <div className="text-sm font-medium text-gray-900">{tag.tag_name}</div>
              <div className="text-xs text-gray-500">{tag.usage_count} uses</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={clsx(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                selectedCategory === category.value
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-200 border border-gray-300'
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <div key={tag.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${tag.color}20` }}
                  >
                    <TagIcon className="h-4 w-4" style={{ color: tag.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{tag.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{tag.category}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {tag.is_featured && (
                    <SparklesIcon className="h-4 w-4 text-yellow-500" />
                  )}
                  <button
                    onClick={() => setEditingTag(tag)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {tag.description && (
                <p className="text-sm text-gray-600 mb-2">{tag.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>/{tag.slug}</span>
                <span>Created {new Date(tag.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Tag Modal */}
      {showCreateForm && (
        <TagFormModal
          title="Create New Tag"
          onSubmit={handleCreateTag}
          onCancel={() => setShowCreateForm(false)}
          colors={colors}
          categories={categories.filter(c => c.value !== 'all')}
          isLoading={createTagMutation.isPending}
        />
      )}

      {/* Edit Tag Modal */}
      {editingTag && (
        <TagFormModal
          title="Edit Tag"
          initialData={editingTag}
          onSubmit={handleUpdateTag}
          onCancel={() => setEditingTag(null)}
          colors={colors}
          categories={categories.filter(c => c.value !== 'all')}
          isLoading={updateTagMutation.isPending}
        />
      )}
    </div>
  )
}

const TagFormModal = ({
  title,
  initialData = {},
  onSubmit,
  onCancel,
  colors,
  categories,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    color: initialData.color || colors[0],
    category: initialData.category || 'custom',
    is_featured: initialData.is_featured || false,
    ...initialData
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tag Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tag Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter tag name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe this tag"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('color', color)}
                  className={clsx(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    formData.color === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Featured */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_featured"
              checked={formData.is_featured}
              onChange={(e) => handleChange('is_featured', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700">
              Featured tag (shown prominently)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TagManagement
