import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Cog6ToothIcon,
  BellIcon,
  EyeIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  TagIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { toast } from '../../lib/toast'

const UserPreferences = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState('general')

  // Fetch user preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: api.getUserPreferences,
    enabled: !!user
  })

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: api.updateUserPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries(['user-preferences'])
      toast.success('Preferences updated successfully!')
    },
    onError: (error) => {
      toast.error('Failed to update preferences')
    }
  })

  const handlePreferenceChange = (key, value) => {
    const updatedPreferences = {
      ...preferences,
      [key]: value
    }
    updatePreferencesMutation.mutate(updatedPreferences)
  }

  const sections = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon },
    { id: 'content', name: 'Content', icon: EyeIcon }
  ]

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Preferences</h1>
          <p className="text-gray-600">Please log in to manage your preferences.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Light', description: 'Clean and bright' },
            { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
            { value: 'auto', label: 'Auto', description: 'Follow system' }
          ].map((theme) => (
            <button
              key={theme.value}
              onClick={() => handlePreferenceChange('theme', theme.value)}
              className={`p-3 border rounded-lg text-left transition-colors ${preferences?.theme === theme.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
                }`}
            >
              <div className="font-medium text-gray-900">{theme.label}</div>
              <div className="text-sm text-gray-600">{theme.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
        <select
          value={preferences?.language || 'en'}
          onChange={(e) => handlePreferenceChange('language', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
        <select
          value={preferences?.currency || 'USD'}
          onChange={(e) => handlePreferenceChange('currency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="CAD">CAD (C$)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
        <select
          value={preferences?.timezone || 'UTC'}
          onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">London</option>
          <option value="Europe/Paris">Paris</option>
        </select>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        {[
          { key: 'email_notifications', label: 'Email Notifications', description: 'Receive notifications via email' },
          { key: 'push_notifications', label: 'Push Notifications', description: 'Receive browser push notifications' },
          { key: 'deal_alerts', label: 'Deal Alerts', description: 'Get notified about new deals' },
          { key: 'price_drop_alerts', label: 'Price Drop Alerts', description: 'Alert when prices drop' },
          { key: 'new_deal_notifications', label: 'New Deal Notifications', description: 'Notify about new deals in your interests' },
          { key: 'weekly_digest', label: 'Weekly Digest', description: 'Receive weekly summary emails' }
        ].map((setting) => (
          <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">{setting.label}</div>
              <div className="text-sm text-gray-600">{setting.description}</div>
            </div>
            <button
              onClick={() => handlePreferenceChange(setting.key, !preferences?.[setting.key])}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences?.[setting.key] ? 'bg-blue-600' : 'bg-gray-200'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences?.[setting.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Profile Visibility</label>
        <div className="space-y-2">
          {[
            { value: 'public', label: 'Public', description: 'Anyone can see your profile' },
            { value: 'friends', label: 'Friends Only', description: 'Only people you follow can see your profile' },
            { value: 'private', label: 'Private', description: 'Only you can see your profile' }
          ].map((option) => (
            <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="profile_visibility"
                value={option.value}
                checked={preferences?.profile_visibility === option.value}
                onChange={(e) => handlePreferenceChange('profile_visibility', e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {[
          { key: 'show_activity', label: 'Show Activity', description: 'Display your activity to other users' },
          { key: 'allow_data_collection', label: 'Allow Data Collection', description: 'Help improve our service by sharing usage data' }
        ].map((setting) => (
          <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">{setting.label}</div>
              <div className="text-sm text-gray-600">{setting.description}</div>
            </div>
            <button
              onClick={() => handlePreferenceChange(setting.key, !preferences?.[setting.key])}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences?.[setting.key] ? 'bg-blue-600' : 'bg-gray-200'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences?.[setting.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  const renderContentSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Content Filter Level</label>
        <div className="space-y-2">
          {[
            { value: 'strict', label: 'Strict', description: 'Show only family-friendly content' },
            { value: 'moderate', label: 'Moderate', description: 'Show most content with some filtering' },
            { value: 'lenient', label: 'Lenient', description: 'Show all content with minimal filtering' }
          ].map((option) => (
            <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="content_filter_level"
                value={option.value}
                checked={preferences?.content_filter_level === option.value}
                onChange={(e) => handlePreferenceChange('content_filter_level', e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div>
          <div className="font-medium text-gray-900">Show Adult Content</div>
          <div className="text-sm text-gray-600">Display deals and content marked as adult-oriented</div>
        </div>
        <button
          onClick={() => handlePreferenceChange('show_adult_content', !preferences?.show_adult_content)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences?.show_adult_content ? 'bg-blue-600' : 'bg-gray-200'
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences?.show_adult_content ? 'translate-x-6' : 'translate-x-1'
              }`}
          />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Price Range</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Minimum</label>
            <input
              type="number"
              value={preferences?.preferred_price_range?.min || 0}
              onChange={(e) => handlePreferenceChange('preferred_price_range', {
                ...preferences?.preferred_price_range,
                min: parseFloat(e.target.value) || 0
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Maximum</label>
            <input
              type="number"
              value={preferences?.preferred_price_range?.max || 10000}
              onChange={(e) => handlePreferenceChange('preferred_price_range', {
                ...preferences?.preferred_price_range,
                max: parseFloat(e.target.value) || 10000
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="10000"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Discount</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={preferences?.preferred_discount_minimum || 10}
            onChange={(e) => handlePreferenceChange('preferred_discount_minimum', parseFloat(e.target.value) || 10)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="10"
          />
          <span className="text-sm text-gray-600">%</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Only show deals with at least this discount percentage</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Preferences</h1>
        <p className="text-gray-600">Customize your experience and control your privacy settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${activeSection === section.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {section.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {activeSection === 'general' && renderGeneralSettings()}
            {activeSection === 'notifications' && renderNotificationSettings()}
            {activeSection === 'privacy' && renderPrivacySettings()}
            {activeSection === 'content' && renderContentSettings()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserPreferences
