import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api'
import { toast } from '../../lib/toast'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  TrophyIcon,
  StarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

const GamificationManagement = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAchievementForm, setShowAchievementForm] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState(null)
  const queryClient = useQueryClient()

  // Fetch gamification stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'gamification', 'stats'],
    queryFn: () => apiRequest('/api/admin/gamification/stats'),
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  // Fetch achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['admin', 'gamification', 'achievements'],
    queryFn: () => apiRequest('/api/admin/gamification/achievements')
  })

  // Fetch XP configuration
  const { data: xpConfig, isLoading: xpConfigLoading } = useQuery({
    queryKey: ['admin', 'gamification', 'xp-config'],
    queryFn: () => apiRequest('/api/admin/gamification/xp-config')
  })

  // Create achievement mutation
  const createAchievementMutation = useMutation({
    mutationFn: (data) => apiRequest('/api/admin/gamification/achievements', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'gamification', 'achievements'])
      setShowAchievementForm(false)
      setEditingAchievement(null)
      toast.success('Achievement created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create achievement')
    }
  })

  // Update achievement mutation
  const updateAchievementMutation = useMutation({
    mutationFn: ({ id, data }) => apiRequest(`/api/admin/gamification/achievements/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'gamification', 'achievements'])
      setShowAchievementForm(false)
      setEditingAchievement(null)
      toast.success('Achievement updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update achievement')
    }
  })

  // Update XP config mutation
  const updateXpConfigMutation = useMutation({
    mutationFn: ({ id, data }) => apiRequest(`/api/admin/gamification/xp-config/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'gamification', 'xp-config'])
      toast.success('XP configuration updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update XP configuration')
    }
  })

  const handleAchievementSubmit = (formData) => {
    if (editingAchievement) {
      updateAchievementMutation.mutate({ id: editingAchievement.id, data: formData })
    } else {
      createAchievementMutation.mutate(formData)
    }
  }

  const handleXpConfigUpdate = (id, updates) => {
    updateXpConfigMutation.mutate({ id, data: updates })
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'achievements', name: 'Achievements', icon: TrophyIcon },
    { id: 'xp-config', name: 'XP Configuration', icon: Cog6ToothIcon }
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
          <h1 className="text-2xl font-bold text-secondary-900">Gamification Management</h1>
          <p className="text-secondary-600 mt-1">
            Manage XP system, achievements, and user progression
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
                  <TrophyIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total XP Events</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stats?.stats?.totalXpEvents?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total Achievements</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stats?.stats?.totalAchievements || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">User Achievements</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stats?.stats?.totalUserAchievements || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-secondary-200">
              <h3 className="text-lg font-medium text-secondary-900">Top Users by XP</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Total XP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Badges
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Streak
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {stats?.topUsers?.map((user, index) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-secondary-900">
                            {user.handle}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {user.current_level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {user.total_xp?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {user.badges_earned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {user.streak_days} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent XP Events */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-secondary-200">
              <h3 className="text-lg font-medium text-secondary-900">Recent XP Events</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      XP Awarded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {stats?.recentXpEvents?.map((event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary-900">
                          {event.profiles?.handle}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {event.event_type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        +{event.final_xp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        {new Date(event.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-secondary-900">Achievements</h2>
            <button
              onClick={() => setShowAchievementForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Achievement
            </button>
          </div>

          {achievementsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements?.map((achievement) => (
                <div key={achievement.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xl">{achievement.badge_icon}</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-secondary-900">
                          {achievement.name}
                        </h3>
                        <p className="text-xs text-secondary-500 capitalize">
                          {achievement.category} • {achievement.rarity}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingAchievement(achievement)}
                      className="text-secondary-400 hover:text-secondary-600"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-secondary-600">
                    {achievement.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-secondary-500">
                      {achievement.criteria_type}: {achievement.criteria_value}
                    </span>
                    <span className="text-sm font-medium text-primary-600">
                      +{achievement.xp_reward} XP
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      achievement.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {achievement.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {achievement.is_hidden && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Hidden
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* XP Configuration Tab */}
      {activeTab === 'xp-config' && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-secondary-900">XP Configuration</h2>
          
          {xpConfigLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Event Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Base XP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Max Daily
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {xpConfig?.map((config) => (
                    <tr key={config.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary-900">
                          {config.event_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {config.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          value={config.base_xp}
                          onChange={(e) => handleXpConfigUpdate(config.id, { base_xp: parseInt(e.target.value) })}
                          className="w-20 px-2 py-1 border border-secondary-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          value={config.max_daily || ''}
                          onChange={(e) => handleXpConfigUpdate(config.id, { max_daily: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-20 px-2 py-1 border border-secondary-300 rounded text-sm"
                          placeholder="∞"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleXpConfigUpdate(config.id, { is_active: !config.is_active })}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            config.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {config.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                        <button
                          onClick={() => handleXpConfigUpdate(config.id, { is_active: !config.is_active })}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Toggle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Achievement Form Modal */}
      {showAchievementForm && (
        <AchievementForm
          achievement={editingAchievement}
          onSubmit={handleAchievementSubmit}
          onCancel={() => {
            setShowAchievementForm(false)
            setEditingAchievement(null)
          }}
          isLoading={createAchievementMutation.isPending || updateAchievementMutation.isPending}
        />
      )}
    </div>
  )
}

// Achievement Form Component
const AchievementForm = ({ achievement, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: achievement?.name || '',
    slug: achievement?.slug || '',
    description: achievement?.description || '',
    category: achievement?.category || 'posting',
    criteria_type: achievement?.criteria_type || 'count',
    criteria_value: achievement?.criteria_value || 1,
    xp_reward: achievement?.xp_reward || 0,
    badge_icon: achievement?.badge_icon || '🏆',
    badge_color: achievement?.badge_color || '#3B82F6',
    rarity: achievement?.rarity || 'common',
    is_hidden: achievement?.is_hidden || false
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">
            {achievement ? 'Edit Achievement' : 'Create Achievement'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-secondary-700">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="posting">Posting</option>
                  <option value="engagement">Engagement</option>
                  <option value="social">Social</option>
                  <option value="milestone">Milestone</option>
                  <option value="special">Special</option>
                  <option value="seasonal">Seasonal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">Criteria Type</label>
                <select
                  value={formData.criteria_type}
                  onChange={(e) => setFormData({ ...formData, criteria_type: e.target.value })}
                  className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="count">Count</option>
                  <option value="streak">Streak</option>
                  <option value="ratio">Ratio</option>
                  <option value="special">Special</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">Criteria Value</label>
                <input
                  type="number"
                  min="1"
                  value={formData.criteria_value}
                  onChange={(e) => setFormData({ ...formData, criteria_value: parseInt(e.target.value) })}
                  className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">XP Reward</label>
                <input
                  type="number"
                  min="0"
                  value={formData.xp_reward}
                  onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                  className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">Badge Icon</label>
                <input
                  type="text"
                  value={formData.badge_icon}
                  onChange={(e) => setFormData({ ...formData, badge_icon: e.target.value })}
                  className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700">Rarity</label>
                <select
                  value={formData.rarity}
                  onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                  className="mt-1 block w-full border border-secondary-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_hidden}
                  onChange={(e) => setFormData({ ...formData, is_hidden: e.target.checked })}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">Hidden Achievement</span>
              </label>
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
                {isLoading ? 'Saving...' : (achievement ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default GamificationManagement
