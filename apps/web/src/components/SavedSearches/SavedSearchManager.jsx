import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

const SaveSearchModal = ({ isOpen, onClose, initialQuery = '', initialFilters = {} }) => {
  const [searchName, setSearchName] = useState('')
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState(initialFilters)
  const [alertSettings, setAlertSettings] = useState({
    email_alerts: true,
    push_alerts: true,
    alert_frequency: 'immediate'
  })

  const queryClient = useQueryClient()

  const createSearchMutation = useMutation({
    mutationFn: (searchData) => api.savedSearches.create(searchData),
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-searches'])
      onClose()
      setSearchName('')
      setQuery('')
      setFilters({})
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!searchName.trim()) {
      alert('Please enter a name for this search')
      return
    }

    createSearchMutation.mutate({
      name: searchName,
      query_text: query,
      filters: filters,
      ...alertSettings
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Save Search</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Name *
            </label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="e.g., Gaming Laptops Under $1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Query
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter keywords..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filters
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Category</label>
                <input
                  type="text"
                  value={filters.category || ''}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  placeholder="Any category"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Merchant</label>
                <input
                  type="text"
                  value={filters.merchant || ''}
                  onChange={(e) => setFilters({ ...filters, merchant: e.target.value })}
                  placeholder="Any merchant"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Alert Settings</h4>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email-alerts"
                  checked={alertSettings.email_alerts}
                  onChange={(e) => setAlertSettings({ ...alertSettings, email_alerts: e.target.checked })}
                  className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="email-alerts" className="text-sm text-gray-700">
                  Email alerts for new matches
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="push-alerts"
                  checked={alertSettings.push_alerts}
                  onChange={(e) => setAlertSettings({ ...alertSettings, push_alerts: e.target.checked })}
                  className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="push-alerts" className="text-sm text-gray-700">
                  Browser push notifications
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Frequency
                </label>
                <select
                  value={alertSettings.alert_frequency}
                  onChange={(e) => setAlertSettings({ ...alertSettings, alert_frequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly digest</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-50 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSearchMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createSearchMutation.isPending ? 'Saving...' : 'Save Search'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const SavedSearchItem = ({ search, onEdit, onDelete }) => {
  const queryClient = useQueryClient()

  const toggleMutation = useMutation({
    mutationFn: () => api.savedSearches.toggle(search.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-searches'])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.savedSearches.delete(search.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-searches'])
    },
  })

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this saved search?')) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-medium text-gray-900">{search.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs ${search.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-50 text-gray-800'
              }`}>
              {search.is_active ? 'Active' : 'Paused'}
            </span>
            {search.match_count > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {search.match_count} matches
              </span>
            )}
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            {search.query_text && (
              <div>Query: <span className="font-mono bg-gray-50 px-1 rounded">{search.query_text}</span></div>
            )}
            {search.filters && Object.keys(search.filters).length > 0 && (
              <div className="flex flex-wrap gap-1">
                Filters:
                {Object.entries(search.filters).map(([key, value]) => value && (
                  <span key={key} className="bg-gray-50 px-2 py-0.5 rounded text-xs">
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center space-x-4">
              <span>Created: {new Date(search.created_at).toLocaleDateString()}</span>
              {search.last_checked && (
                <span>Last checked: {new Date(search.last_checked).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            {search.email_alerts && <span>📧 Email alerts</span>}
            {search.push_alerts && <span>🔔 Push alerts</span>}
            <span>Frequency: {search.alert_frequency}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${search.is_active
              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
          >
            {search.is_active ? 'Pause' : 'Resume'}
          </button>

          <button
            onClick={() => onEdit(search)}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            Edit
          </button>

          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200 disabled:opacity-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SavedSearchManager() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingSearch, setEditingSearch] = useState(null)

  const { data: savedSearches, isLoading, error } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => api.savedSearches.list(),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        <p>Failed to load saved searches</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Saved Searches</h2>
          <p className="text-gray-600 text-sm">Get notified when new deals match your criteria</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Save New Search
        </button>
      </div>

      {!savedSearches || savedSearches.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved searches yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first saved search to get notified about deals that match your interests.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Your First Search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {savedSearches.map((search) => (
            <SavedSearchItem
              key={search.id}
              search={search}
              onEdit={setEditingSearch}
            />
          ))}
        </div>
      )}

      <SaveSearchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {editingSearch && (
        <SaveSearchModal
          isOpen={true}
          onClose={() => setEditingSearch(null)}
          initialQuery={editingSearch.query_text}
          initialFilters={editingSearch.filters}
        />
      )}
    </div>
  )
}

export { SaveSearchModal, SavedSearchItem }
