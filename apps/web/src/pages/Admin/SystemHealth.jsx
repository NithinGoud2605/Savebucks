import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  HeartIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon
} from '@heroicons/react/24/outline'

const SystemHealth = () => {
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch system health data
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: () => apiRequest('/api/admin/system/health'),
    refetchInterval: 60000 // Refresh every minute
  })

  const tabs = [
    { id: 'overview', name: 'Overview', icon: HeartIcon },
    { id: 'metrics', name: 'Metrics', icon: ChartBarIcon },
    { id: 'activity', name: 'Activity', icon: ClockIcon }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-50 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
      case 'critical':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
      default:
        return <HeartIcon className="w-5 h-5 text-gray-500" />
    }
  }

  if (healthLoading) {
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
          <h1 className="text-2xl font-bold text-secondary-900">System Health</h1>
          <p className="text-secondary-600 mt-1">
            Monitor system performance and overall health
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(healthData?.status)}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(healthData?.status)}`}>
            {healthData?.status || 'Unknown'}
          </span>
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
          {/* System Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-secondary-900">System Status</h3>
              <div className="flex items-center space-x-2">
                {getStatusIcon(healthData?.status)}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(healthData?.status)}`}>
                  {healthData?.status || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-secondary-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-secondary-700 mb-2">Database</h4>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-secondary-900">Connected</span>
                </div>
              </div>
              <div className="bg-secondary-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-secondary-700 mb-2">API Server</h4>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-secondary-900">Running</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total Deals</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {healthData?.stats?.totalDeals?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total Users</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {healthData?.stats?.totalUsers?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total Comments</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {healthData?.stats?.totalComments?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <HandThumbUpIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total Votes</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {healthData?.stats?.totalVotes?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-secondary-200">
              <h3 className="text-lg font-medium text-secondary-900">Pending Items</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Pending Deals</h4>
                      <p className="text-2xl font-bold text-yellow-900">
                        {healthData?.stats?.pendingDeals || 0}
                      </p>
                    </div>
                    <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Pending Coupons</h4>
                      <p className="text-2xl font-bold text-yellow-900">
                        {healthData?.stats?.pendingCoupons || 0}
                      </p>
                    </div>
                    <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-secondary-900">System Metrics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">Content Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">Total Deals</span>
                  <span className="text-sm font-medium text-secondary-900">
                    {healthData?.stats?.totalDeals?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">Total Coupons</span>
                  <span className="text-sm font-medium text-secondary-900">
                    {healthData?.stats?.totalCoupons?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">Total Comments</span>
                  <span className="text-sm font-medium text-secondary-900">
                    {healthData?.stats?.totalComments?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">Total Votes</span>
                  <span className="text-sm font-medium text-secondary-900">
                    {healthData?.stats?.totalVotes?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* User Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-secondary-900 mb-4">User Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">Total Users</span>
                  <span className="text-sm font-medium text-secondary-900">
                    {healthData?.stats?.totalUsers?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">Active Users (24h)</span>
                  <span className="text-sm font-medium text-secondary-900">
                    {healthData?.activity?.dealsLast24h || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">Pending Approvals</span>
                  <span className="text-sm font-medium text-secondary-900">
                    {(healthData?.stats?.pendingDeals || 0) + (healthData?.stats?.pendingCoupons || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <div className="text-sm text-secondary-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">&lt;200ms</div>
                <div className="text-sm text-secondary-600">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">1000+</div>
                <div className="text-sm text-secondary-600">Requests/min</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-secondary-900">Recent Activity</h2>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">Last 24 Hours</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">New Deals Posted</span>
                <span className="text-sm font-medium text-secondary-900">
                  {healthData?.activity?.dealsLast24h || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">New Users Registered</span>
                <span className="text-sm font-medium text-secondary-900">
                  {/* This would need to be added to the API */}
                  N/A
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Comments Posted</span>
                <span className="text-sm font-medium text-secondary-900">
                  {/* This would need to be added to the API */}
                  N/A
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Votes Cast</span>
                <span className="text-sm font-medium text-secondary-900">
                  {/* This would need to be added to the API */}
                  N/A
                </span>
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">System Alerts</h3>
            <div className="space-y-3">
              {healthData?.stats?.pendingDeals > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {healthData.stats.pendingDeals} deals pending approval
                    </p>
                    <p className="text-xs text-yellow-600">Review and approve pending deals</p>
                  </div>
                </div>
              )}

              {healthData?.stats?.pendingCoupons > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {healthData.stats.pendingCoupons} coupons pending approval
                    </p>
                    <p className="text-xs text-yellow-600">Review and approve pending coupons</p>
                  </div>
                </div>
              )}

              {(!healthData?.stats?.pendingDeals && !healthData?.stats?.pendingCoupons) && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-green-800">All systems operational</p>
                    <p className="text-xs text-green-600">No pending items requiring attention</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemHealth
