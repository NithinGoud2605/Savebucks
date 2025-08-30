import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Container } from '../../components/Layout/Container'
import { Skeleton } from '../../components/Loader/Skeleton'
import AdminDashboard from './AdminDashboard'
import PendingApprovals from './PendingApprovals'
import UserManagement from './UserManagement'
import Analytics from './Analytics'
import CompanyManagement from './CompanyManagement'
import {
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  ChartPieIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon
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
    }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || AdminDashboard

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
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
      <div className="bg-white border-b border-secondary-200">
        <Container>
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
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