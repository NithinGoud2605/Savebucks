import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Container } from '../../components/Layout/Container'
import { Skeleton } from '../../components/ui/Skeleton'
import AdminDashboard from './AdminDashboard'
import PendingApprovals from './PendingApprovals'
import UserManagement from './UserManagement'
import Analytics from './Analytics'
import CompanyManagement from './CompanyManagement'
import GamificationManagement from './GamificationManagement'
import AutoTaggingManagement from './AutoTaggingManagement'
import ApprovedItems from './ApprovedItems'
import SavedSearchesManagement from './SavedSearchesManagement'
import SystemHealth from './SystemHealth'
import {
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  ChartPieIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  TrophyIcon,
  TagIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

const AdminPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  // Check if user is admin
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => api.getCurrentUser(),
    enabled: !!user
  })

  if (isLoading) {
    return (
      <Container>
        <div className="py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Container>
    )
  }

  if (!profile || profile.user?.role !== 'admin') {
    return (
      <Container>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">Access Denied</h1>
          <p className="text-secondary-600">
            You don't have permission to access the admin panel.
          </p>
        </div>
      </Container>
    )
  }

  const tabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: ChartBarIcon,
      component: AdminDashboard
    },
    {
      id: 'approvals',
      name: 'Pending Approvals',
      icon: ClipboardDocumentCheckIcon,
      component: PendingApprovals
    },
    {
      id: 'approved-items',
      name: 'Approved Items',
      icon: ClipboardDocumentCheckIcon,
      component: ApprovedItems
    },
    {
      id: 'users',
      name: 'User Management',
      icon: UsersIcon,
      component: UserManagement
    },
    {
      id: 'companies',
      name: 'Companies',
      icon: BuildingOfficeIcon,
      component: CompanyManagement
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: ChartPieIcon,
      component: Analytics
    },
    {
      id: 'gamification',
      name: 'Gamification',
      icon: TrophyIcon,
      component: GamificationManagement
    },
    {
      id: 'auto-tagging',
      name: 'Auto-Tagging',
      icon: TagIcon,
      component: AutoTaggingManagement
    },
    {
      id: 'saved-searches',
      name: 'Saved Searches',
      icon: MagnifyingGlassIcon,
      component: SavedSearchesManagement
    },
    {
      id: 'system-health',
      name: 'System Health',
      icon: HeartIcon,
      component: SystemHealth
    }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || AdminDashboard

  return (
    <div className="min-h-screen bg-primary-50 pt-16">
      {/* Header */}
      <div className="bg-white border-b border-primary-200">
        <Container>
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">Admin Panel</h1>
                <p className="text-secondary-600 mt-1">
                  Manage deals, coupons, users, and analytics
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Cog6ToothIcon className="w-6 h-6 text-secondary-400" />
                <span className="text-sm text-secondary-600">
                  Welcome, {profile.handle || 'Admin'}
                </span>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-primary-200">
        <Container>
          <div className="relative">
            {/* Scroll fade indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10 sm:hidden" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 sm:hidden" />

            <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 rounded-t-lg transition-all
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </Container>
      </div>

      {/* Content */}
      <div className="py-8">
        <Container>
          <ActiveComponent />
        </Container>
      </div>
    </div>
  )
}

export default AdminPage
