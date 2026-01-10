import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  User,
  Shield,
  Settings as SettingsIcon,
  Mail,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Check,
  ChevronRight,
  LogOut,
  Trash2,
  AlertTriangle,
  Lock,
  CreditCard,
  HelpCircle
} from 'lucide-react'
import { Container } from '../components/Layout/Container'
import { useAuth } from '../hooks/useAuth'
import { Skeleton } from '../components/ui/Skeleton'
import { toast } from '../lib/toast'
import { supa } from '../lib/supa'

// Tab navigation items
const TABS = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'account', label: 'Account', icon: SettingsIcon },
]

// Toggle switch component
const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <motion.button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${checked ? 'bg-violet-600' : 'bg-slate-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
  >
    <motion.span
      className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
      animate={{ x: checked ? 22 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  </motion.button>
)

// Setting row component
const SettingRow = ({ icon: Icon, iconColor, title, description, children }) => (
  <div className="flex items-start justify-between gap-4 py-4">
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="font-medium text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
    {children}
  </div>
)

// Section component
const Section = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
    {title && (
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
    )}
    <div className="px-6">{children}</div>
  </div>
)

// Main Settings Component
const Settings = () => {
  const { user, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('notifications')
  const [isSaving, setIsSaving] = useState(false)

  // Local state for settings
  const [prefs, setPrefs] = useState({
    push_notifications: true,
    email_notifications: true,
    in_app_notifications: true,
    price_drop_alerts: true,
    new_deal_alerts: true,
    deal_expiry_alerts: false,
    followed_merchant_alerts: true,
    max_daily_notifications: 10,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
  })

  // Handle logout
  const handleLogout = async () => {
    try {
      await supa.auth.signOut()
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      toast.success('Logged out successfully')
      navigate('/signin')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  // Handle preference change
  const handlePrefChange = (key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }))
  }

  // Save preferences
  const savePreferences = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      toast.success('Settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16">
        <Container>
          <div className="py-8 max-w-4xl mx-auto">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </Container>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  // Tab content components
  const NotificationSettings = () => (
    <div className="space-y-6">
      <Section title="Notification Channels">
        <SettingRow
          icon={Smartphone}
          iconColor="bg-gradient-to-br from-blue-500 to-cyan-600"
          title="Push Notifications"
          description="Receive notifications on your device"
        >
          <ToggleSwitch
            checked={prefs.push_notifications}
            onChange={(v) => handlePrefChange('push_notifications', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Mail}
          iconColor="bg-gradient-to-br from-emerald-500 to-teal-600"
          title="Email Notifications"
          description="Get deal alerts via email"
        >
          <ToggleSwitch
            checked={prefs.email_notifications}
            onChange={(v) => handlePrefChange('email_notifications', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Bell}
          iconColor="bg-gradient-to-br from-purple-500 to-violet-600"
          title="In-App Notifications"
          description="Show notifications within the app"
        >
          <ToggleSwitch
            checked={prefs.in_app_notifications}
            onChange={(v) => handlePrefChange('in_app_notifications', v)}
          />
        </SettingRow>
      </Section>

      <Section title="Alert Preferences">
        <SettingRow
          icon={Bell}
          iconColor="bg-gradient-to-br from-rose-500 to-pink-600"
          title="Price Drop Alerts"
          description="When prices drop on tracked items"
        >
          <ToggleSwitch
            checked={prefs.price_drop_alerts}
            onChange={(v) => handlePrefChange('price_drop_alerts', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Bell}
          iconColor="bg-gradient-to-br from-amber-500 to-orange-600"
          title="New Deal Alerts"
          description="When new deals match your interests"
        >
          <ToggleSwitch
            checked={prefs.new_deal_alerts}
            onChange={(v) => handlePrefChange('new_deal_alerts', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Bell}
          iconColor="bg-gradient-to-br from-red-500 to-rose-600"
          title="Expiring Deals"
          description="When deals are about to expire"
        >
          <ToggleSwitch
            checked={prefs.deal_expiry_alerts}
            onChange={(v) => handlePrefChange('deal_expiry_alerts', v)}
          />
        </SettingRow>
      </Section>

      <Section title="Quiet Hours">
        <div className="py-4">
          <p className="text-sm text-slate-600 mb-4">
            Pause notifications during these hours to avoid disturbances.
          </p>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
              <input
                type="time"
                value={prefs.quiet_hours_start}
                onChange={(e) => handlePrefChange('quiet_hours_start', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
              />
            </div>
            <span className="text-slate-400 mt-6">to</span>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
              <input
                type="time"
                value={prefs.quiet_hours_end}
                onChange={(e) => handlePrefChange('quiet_hours_end', e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
              />
            </div>
          </div>
        </div>
      </Section>
    </div>
  )

  const ProfileSettings = () => (
    <Section>
      <div className="py-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">Profile Settings</h3>
        <p className="text-slate-500 mb-4">
          Profile customization is coming soon. You'll be able to update your avatar, bio, and personal info.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          Coming Soon
        </div>
      </div>
    </Section>
  )

  const PrivacySettings = () => (
    <Section>
      <div className="py-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">Privacy Controls</h3>
        <p className="text-slate-500 mb-4">
          Advanced privacy settings are in development. Soon you can manage data sharing and visibility.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          Coming Soon
        </div>
      </div>
    </Section>
  )

  const AccountSettings = () => (
    <div className="space-y-6">
      <Section title="Account">
        <SettingRow
          icon={Mail}
          iconColor="bg-gradient-to-br from-slate-500 to-slate-600"
          title="Email Address"
          description={user?.email || 'Not set'}
        >
          <button className="text-sm text-violet-600 hover:text-violet-700 font-medium">
            Change
          </button>
        </SettingRow>

        <SettingRow
          icon={Lock}
          iconColor="bg-gradient-to-br from-slate-500 to-slate-600"
          title="Password"
          description="Last changed: Unknown"
        >
          <button className="text-sm text-violet-600 hover:text-violet-700 font-medium">
            Update
          </button>
        </SettingRow>
      </Section>

      <Section title="Session">
        <div className="py-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </Section>

      <Section title="Danger Zone">
        <div className="py-4">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
          <p className="text-xs text-slate-500 mt-2">
            This action is irreversible. All your data will be permanently deleted.
          </p>
        </div>
      </Section>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notifications': return <NotificationSettings />
      case 'profile': return <ProfileSettings />
      case 'privacy': return <PrivacySettings />
      case 'account': return <AccountSettings />
      default: return <NotificationSettings />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-14">
      <Container>
        <div className="max-w-4xl mx-auto py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
            <p className="text-slate-600">
              Manage your account preferences and notifications
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl border border-slate-200 p-1.5 mb-6">
            <nav className="flex gap-1">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${isActive
                        ? 'bg-violet-100 text-violet-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>

          {/* Save Button (for notifications) */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex justify-end"
            >
              <motion.button
                onClick={savePreferences}
                disabled={isSaving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium shadow-lg disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </div>
      </Container>
    </div>
  )
}

export default Settings
