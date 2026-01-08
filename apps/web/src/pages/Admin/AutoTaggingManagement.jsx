import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api'
import { toast } from '../../lib/toast'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  TagIcon,
  BuildingStorefrontIcon,
  FolderIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const AutoTaggingManagement = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [showMerchantForm, setShowMerchantForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingMerchant, setEditingMerchant] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const queryClient = useQueryClient()

  // Fetch auto-tagging stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'auto-tagging', 'stats'],
    queryFn: () => apiRequest('/api/admin/auto-tagging/stats'),
    refetchInterval: 30000
  })

  // Fetch merchant patterns
  const { data: merchantPatterns, isLoading: merchantPatternsLoading } = useQuery({
    queryKey: ['admin', 'auto-tagging', 'merchant-patterns'],
    queryFn: () => apiRequest('/api/admin/auto-tagging/merchant-patterns')
  })

  // Fetch category patterns
  const { data: categoryPatterns, isLoading: categoryPatternsLoading } = useQuery({
    queryKey: ['admin', 'auto-tagging', 'category-patterns'],
    queryFn: () => apiRequest('/api/admin/auto-tagging/category-patterns')
  })

  // Create merchant pattern mutation
  const createMerchantPatternMutation = useMutation({
    mutationFn: (data) => apiRequest('/api/admin/auto-tagging/merchant-patterns', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'auto-tagging', 'merchant-patterns'])
      setShowMerchantForm(false)
      setEditingMerchant(null)
      toast.success('Merchant pattern created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create merchant pattern')
    }
  })

  // Create category pattern mutation
  const createCategoryPatternMutation = useMutation({
    mutationFn: (data) => apiRequest('/api/admin/auto-tagging/category-patterns', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'auto-tagging', 'category-patterns'])
      setShowCategoryForm(false)
      setEditingCategory(null)
      toast.success('Category pattern created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create category pattern')
    }
  })

  const handleMerchantPatternSubmit = (formData) => {
    createMerchantPatternMutation.mutate(formData)
  }

  const handleCategoryPatternSubmit = (formData) => {
    createCategoryPatternMutation.mutate(formData)
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: TagIcon },
    { id: 'merchant-patterns', name: 'Merchant Patterns', icon: BuildingStorefrontIcon },
    { id: 'category-patterns', name: 'Category Patterns', icon: FolderIcon },
    { id: 'logs', name: 'Tagging Logs', icon: ClockIcon }
  ]

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
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
          <h1 className="text-2xl font-bold text-secondary-900">Auto-Tagging Management</h1>
          <p className="text-secondary-600 mt-1">
            Manage automatic tagging patterns for merchants and categories
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }
              `}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TagIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total Patterns</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stats?.stats?.totalPatterns?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingStorefrontIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Merchant Patterns</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stats?.stats?.totalMerchantPatterns || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FolderIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Category Patterns</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stats?.stats?.totalCategoryPatterns || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tagging Logs */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-secondary-200">
              <h3 className="text-lg font-medium text-secondary-900">Recent Tagging Activity</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Detected Merchant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Detected Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {stats?.recentLogs?.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary-900">
                          {log.deals?.title || log.coupons?.title || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {log.detected_merchant || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {log.detected_category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.status === 'applied' ? 'bg-green-100 text-green-800' :
                          log.status === 'suggested' ? 'bg-yellow-100 text-yellow-800' :
                            log.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-50 text-gray-800'
                          }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {new Date(log.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Merchant Patterns Tab */}
      {activeTab === 'merchant-patterns' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-secondary-900">Merchant Patterns</h2>
            <button
              onClick={() => setShowMerchantForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Merchant Pattern
            </button>
          </div>

          {merchantPatternsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {merchantPatterns?.map((pattern) => (
                <div key={pattern.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-secondary-900">
                          {pattern.merchant_name}
                        </h3>
                        <p className="text-xs text-secondary-500">
                          Confidence: {Math.round(pattern.confidence_score * 100)}%
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingMerchant(pattern)}
                      className="text-secondary-400 hover:text-secondary-600"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-secondary-700">Domain Patterns:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pattern.domain_patterns?.map((domain, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>

                    {pattern.title_patterns?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-secondary-700">Title Patterns:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pattern.title_patterns.map((title, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              {title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pattern.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {pattern.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Patterns Tab */}
      {activeTab === 'category-patterns' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-secondary-900">Category Patterns</h2>
            <button
              onClick={() => setShowCategoryForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Category Pattern
            </button>
          </div>

          {categoryPatternsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryPatterns?.map((pattern) => (
                <div key={pattern.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <FolderIcon className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-secondary-900">
                          {pattern.category_name}
                        </h3>
                        <p className="text-xs text-secondary-500">
                          Priority: {pattern.priority} • Confidence: {Math.round(pattern.confidence_score * 100)}%
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingCategory(pattern)}
                      className="text-secondary-400 hover:text-secondary-600"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-secondary-700">Keyword Patterns:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pattern.keyword_patterns?.map((keyword, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    {pattern.title_patterns?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-secondary-700">Title Patterns:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pattern.title_patterns.map((title, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pattern.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {pattern.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tagging Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-secondary-900">Tagging Logs</h2>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Detected Merchant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Detected Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {stats?.recentLogs?.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">
                        {log.deals?.title || log.coupons?.title || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                      {log.detected_merchant || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                      {log.detected_category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.status === 'applied' ? 'bg-green-100 text-green-800' :
                        log.status === 'suggested' ? 'bg-yellow-100 text-yellow-800' :
                          log.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-50 text-gray-800'
                        }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {new Date(log.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Merchant Pattern Form Modal */}
      {showMerchantForm && (
        <MerchantPatternForm
          pattern={editingMerchant}
          onSubmit={handleMerchantPatternSubmit}
          onCancel={() => {
            setShowMerchantForm(false)
            setEditingMerchant(null)
          }}
          isLoading={createMerchantPatternMutation.isPending}
        />
      )}

      {/* Category Pattern Form Modal */}
      {showCategoryForm && (
        <CategoryPatternForm
          pattern={editingCategory}
          onSubmit={handleCategoryPatternSubmit}
          onCancel={() => {
            setShowCategoryForm(false)
            setEditingCategory(null)
          }}
          isLoading={createCategoryPatternMutation.isPending}
        />
      )}
    </div>
  )
}

// Merchant Pattern Form Component
const MerchantPatternForm = ({ pattern, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    merchant_name: pattern?.merchant_name || '',
    domain_patterns: pattern?.domain_patterns || [],
    title_patterns: pattern?.title_patterns || [],
    auto_apply_tags: pattern?.auto_apply_tags || [],
    confidence_score: pattern?.confidence_score || 0.95
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const addDomainPattern = () => {
    const newPattern = prompt('Enter domain pattern (e.g., amazon.com):')
    if (newPattern) {
      setFormData({
        ...formData,
        domain_patterns: [...formData.domain_patterns, newPattern]
      })
    }
  }

  const addTitlePattern = () => {
    const newPattern = prompt('Enter title pattern:')
    if (newPattern) {
      setFormData({
        ...formData,
        title_patterns: [...formData.title_patterns, newPattern]
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">
            {pattern ? 'Edit Merchant Pattern' : 'Create Merchant Pattern'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700">Merchant Name</label>
              <input
                type="text"
                value={formData.merchant_name}
                onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
                className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700">Confidence Score</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.confidence_score}
                onChange={(e) => setFormData({ ...formData, confidence_score: parseFloat(e.target.value) })}
                className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700">Domain Patterns</label>
              <div className="mt-1 space-y-2">
                {formData.domain_patterns.map((pattern, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="flex-1 text-sm bg-secondary-100 px-2 py-1 rounded">
                      {pattern}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        domain_patterns: formData.domain_patterns.filter((_, i) => i !== index)
                      })}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDomainPattern}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  + Add Domain Pattern
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700">Title Patterns</label>
              <div className="mt-1 space-y-2">
                {formData.title_patterns.map((pattern, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="flex-1 text-sm bg-secondary-100 px-2 py-1 rounded">
                      {pattern}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        title_patterns: formData.title_patterns.filter((_, i) => i !== index)
                      })}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTitlePattern}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  + Add Title Pattern
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : (pattern ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Category Pattern Form Component
const CategoryPatternForm = ({ pattern, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    category_name: pattern?.category_name || '',
    category_id: pattern?.category_id || null,
    keyword_patterns: pattern?.keyword_patterns || [],
    title_patterns: pattern?.title_patterns || [],
    confidence_score: pattern?.confidence_score || 0.8,
    priority: pattern?.priority || 1
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const addKeywordPattern = () => {
    const newPattern = prompt('Enter keyword pattern:')
    if (newPattern) {
      setFormData({
        ...formData,
        keyword_patterns: [...formData.keyword_patterns, newPattern]
      })
    }
  }

  const addTitlePattern = () => {
    const newPattern = prompt('Enter title pattern:')
    if (newPattern) {
      setFormData({
        ...formData,
        title_patterns: [...formData.title_patterns, newPattern]
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">
            {pattern ? 'Edit Category Pattern' : 'Create Category Pattern'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700">Category Name</label>
              <input
                type="text"
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">Confidence Score</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={formData.confidence_score}
                  onChange={(e) => setFormData({ ...formData, confidence_score: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">Priority</label>
                <input
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700">Keyword Patterns</label>
              <div className="mt-1 space-y-2">
                {formData.keyword_patterns.map((pattern, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="flex-1 text-sm bg-secondary-100 px-2 py-1 rounded">
                      {pattern}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        keyword_patterns: formData.keyword_patterns.filter((_, i) => i !== index)
                      })}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addKeywordPattern}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  + Add Keyword Pattern
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700">Title Patterns</label>
              <div className="mt-1 space-y-2">
                {formData.title_patterns.map((pattern, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="flex-1 text-sm bg-secondary-100 px-2 py-1 rounded">
                      {pattern}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        title_patterns: formData.title_patterns.filter((_, i) => i !== index)
                      })}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTitlePattern}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  + Add Title Pattern
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : (pattern ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AutoTaggingManagement
