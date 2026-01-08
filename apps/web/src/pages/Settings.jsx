import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Container } from '../components/Layout/Container'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import { Switch } from '../components/ui/Switch'
import { Input } from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { Separator } from '../components/ui/Separator'
import {
  BellIcon,
  UserIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline'

const Settings = () => {
  const { user, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('notifications')
  const queryClient = useQueryClient()

  // Fetch notification preferences
  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => apiRequest('/api/notification-preferences'),
    enabled: !!user
  })

  // Update notification preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (updates) => apiRequest('/api/notification-preferences', { method: 'PUT', body: updates }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-preferences'])
      toast.success('Preferences updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update preferences')
    }
  })

  if (authLoading) {
    return (
      <Container>
        <div className="py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Container>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  const tabs = [
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon },
    { id: 'account', name: 'Account', icon: Cog6ToothIcon }
  ]

  const handlePreferenceChange = (key, value) => {
    updatePreferencesMutation.mutate({
      ...preferences,
      [key]: value
    })
  }

  const NotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>

        {/* Global Notification Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <DevicePhoneMobileIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-600">Receive notifications on your device</p>
              </div>
            </div>
            <Switch
              checked={preferences?.push_notifications_enabled ?? true}
              onCheckedChange={(checked) => handlePreferenceChange('push_notifications_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              checked={preferences?.email_notifications_enabled ?? true}
              onCheckedChange={(checked) => handlePreferenceChange('email_notifications_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <BellIcon className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium text-gray-900">In-App Notifications</p>
                <p className="text-sm text-gray-600">Show notifications within the app</p>
              </div>
            </div>
            <Switch
              checked={preferences?.in_app_notifications_enabled ?? true}
              onCheckedChange={(checked) => handlePreferenceChange('in_app_notifications_enabled', checked)}
            />
          </div>
        </div>

        {/* Content Preferences */}
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-900 mb-4">Content Preferences</h4>
          <div className="space-y-3">
            {[
              { key: 'price_drop_alerts', label: 'Price Drop Alerts', description: 'Get notified when prices drop on items you\'re tracking' },
              { key: 'new_deal_alerts', label: 'New Deal Alerts', description: 'Get notified about new deals matching your saved searches' },
              { key: 'deal_expiry_alerts', label: 'Deal Expiry Alerts', description: 'Get notified when deals are about to expire' },
              { key: 'followed_merchant_alerts', label: 'Followed Merchant Alerts', description: 'Get notified about deals from merchants you follow' },
              { key: 'followed_category_alerts', label: 'Followed Category Alerts', description: 'Get notified about deals in categories you follow' }
            ].map(({ key, label, description }) => (
              <label key={key} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.[key] ?? true}
                  onChange={(e) => handlePreferenceChange(key, e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Frequency Limits */}
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-900 mb-4">Frequency Limits</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Daily Notifications
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={preferences?.max_daily_notifications ?? 10}
                onChange={(e) => handlePreferenceChange('max_daily_notifications', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Weekly Notifications
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={preferences?.max_weekly_notifications ?? 50}
                onChange={(e) => handlePreferenceChange('max_weekly_notifications', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-900 mb-4">Quiet Hours</h4>
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={preferences?.quiet_hours_start ?? '22:00'}
                onChange={(e) => handlePreferenceChange('quiet_hours_start', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={preferences?.quiet_hours_end ?? '08:00'}
                onChange={(e) => handlePreferenceChange('quiet_hours_end', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Notifications will be paused during these hours to avoid disturbing you
          </p>
        </div>
      </div>
    </div>
  )

  const ProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Settings</h3>
        <p className="text-gray-600 mb-6">
          Manage your profile information and preferences
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Profile settings coming soon
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Profile customization features are being developed. You'll soon be able to update your avatar, bio, and other profile information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const PrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
        <p className="text-gray-600 mb-6">
          Control your privacy and data settings
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Privacy settings coming soon
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Advanced privacy controls are being developed. You'll soon be able to manage data sharing, visibility settings, and account security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const AccountSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
        <p className="text-gray-600 mb-6">
          Manage your account and security settings
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Account settings coming soon
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Account management features are being developed. You'll soon be able to change your password, manage connected accounts, and control account security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notifications':
        return <NotificationSettings />
      case 'profile':
        return <ProfileSettings />
      case 'privacy':
        return <PrivacySettings />
      case 'account':
        return <AccountSettings />
      default:
        return <NotificationSettings />
    }
  }

  return (
    <Container>
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account preferences and notification settings
          </p>
        </div>

        <Card>
          <Tabs defaultValue="notifications" className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.name}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              {prefsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <>
                  <TabsContent value="notifications">
                    <NotificationSettings />
                  </TabsContent>
                  <TabsContent value="profile">
                    <ProfileSettings />
                  </TabsContent>
                  <TabsContent value="privacy">
                    <PrivacySettings />
                  </TabsContent>
                  <TabsContent value="account">
                    <AccountSettings />
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </Container>
  )
}

export default Settings
