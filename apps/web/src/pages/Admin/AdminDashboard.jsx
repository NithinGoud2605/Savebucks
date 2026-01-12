import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  ClipboardDocumentListIcon,
  TagIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

const AdminDashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.getAdminDashboard(),
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          Error Loading Dashboard
        </h3>
        <p className="text-secondary-600">
          Unable to load dashboard data. Please try again.
        </p>
      </div>
    )
  }

  const stats = dashboardData?.stats || {}

  const statCards = [
    {
      title: 'Total Deals',
      value: stats.deals?.total || 0,
      icon: ClipboardDocumentListIcon,
      color: 'blue'
    },
    {
      title: 'Pending Deals',
      value: stats.deals?.pending || 0,
      icon: ClockIcon,
      color: 'yellow'
    },
    {
      title: 'Total Coupons',
      value: stats.coupons?.total || 0,
      icon: TagIcon,
      color: 'green'
    },
    {
      title: 'Pending Coupons',
      value: stats.coupons?.pending || 0,
      icon: ClockIcon,
      color: 'orange'
    },
    {
      title: 'Total Users',
      value: stats.users?.total || 0,
      icon: UsersIcon,
      color: 'purple'
    },
    {
      title: 'Companies',
      value: stats.companies?.total || 0,
      icon: BuildingOfficeIcon,
      color: 'indigo'
    },
    {
      title: 'Approved Deals',
      value: stats.deals?.approved || 0,
      icon: CheckCircleIcon,
      color: 'green'
    },
    {
      title: 'Approved Coupons',
      value: stats.coupons?.approved || 0,
      icon: CheckCircleIcon,
      color: 'green'
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      green: 'bg-green-50 text-green-600',
      orange: 'bg-orange-50 text-orange-600',
      purple: 'bg-purple-50 text-purple-600',
      indigo: 'bg-indigo-50 text-indigo-600',
      red: 'bg-red-50 text-red-600'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">{stat.title}</p>
                <p className="text-2xl font-bold text-secondary-900">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Deals */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6 border-b border-secondary-200">
            <h3 className="text-lg font-semibold text-secondary-900">Recent Deals</h3>
          </div>
          <div className="p-6">
            {dashboardData?.recentActivity?.deals?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentActivity.deals.map((deal) => {
                  const isIngested = !deal.submitter_id || deal.source
                  const companyName = deal.companies?.name || deal.merchant || 'Unknown'
                  const submitterName = isIngested ? 'Official' : (deal.profiles?.handle || 'Unknown')

                  return (
                    <div key={deal.id} className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-secondary-900 truncate">{deal.title}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-secondary-500">
                            {companyName}
                          </span>
                          <span className="text-secondary-300">•</span>
                          <span className={`text-sm ${isIngested ? 'text-blue-600 font-medium' : 'text-secondary-500'}`}>
                            {isIngested && '🤖 '}{submitterName}
                          </span>
                          {deal.quality_score !== undefined && (
                            <>
                              <span className="text-secondary-300">•</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${deal.quality_score >= 0.7 ? 'bg-green-100 text-green-700' :
                                deal.quality_score >= 0.4 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                QS: {Math.round(deal.quality_score * 100)}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end">
                        <StatusBadge status={deal.status} />
                        <span className="text-xs text-secondary-500 mt-1">
                          {new Date(deal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-secondary-500 text-center py-8">No recent deals</p>
            )}
          </div>
        </div>

        {/* Recent Coupons */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6 border-b border-secondary-200">
            <h3 className="text-lg font-semibold text-secondary-900">Recent Coupons</h3>
          </div>
          <div className="p-6">
            {dashboardData?.recentActivity?.coupons?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentActivity.coupons.map((coupon) => {
                  const isIngested = !coupon.submitter_id || coupon.source
                  const companyName = coupon.companies?.name || coupon.merchant || 'Unknown'
                  const submitterName = isIngested ? 'Official' : (coupon.profiles?.handle || 'Unknown')

                  return (
                    <div key={coupon.id} className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-secondary-900 truncate">{coupon.title}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-secondary-500">
                            {companyName}
                          </span>
                          <span className="text-secondary-300">•</span>
                          <span className={`text-sm ${isIngested ? 'text-blue-600 font-medium' : 'text-secondary-500'}`}>
                            {isIngested && '🤖 '}{submitterName}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end">
                        <StatusBadge status={coupon.status} />
                        <span className="text-xs text-secondary-500 mt-1">
                          {new Date(coupon.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-secondary-500 text-center py-8">No recent coupons</p>
            )}
          </div>
        </div>
      </div>

      {/* Pending Companies */}
      {dashboardData?.recentActivity?.pendingCompanies?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="p-6 border-b border-secondary-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary-900">Pending Company Approvals</h3>
              <span className="text-sm text-secondary-500">
                {dashboardData.recentActivity.pendingCompanies.length} companies waiting
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.recentActivity.pendingCompanies.slice(0, 5).map((company) => (
                <div key={company.id} className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-secondary-200 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="w-5 h-5 text-secondary-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-secondary-900">{company.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-secondary-500">
                          {company.company_categories?.name || 'Uncategorized'}
                        </span>
                        <span className="text-secondary-300">•</span>
                        <span className="text-sm text-secondary-500">
                          by {company.profiles?.handle || 'Unknown User'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end">
                    <StatusBadge status="pending" />
                    <span className="text-xs text-secondary-500 mt-1">
                      {new Date(company.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {dashboardData.recentActivity.pendingCompanies.length > 5 && (
              <div className="text-center pt-4">
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View All Pending Companies ({dashboardData.recentActivity.pendingCompanies.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors">
            <ClockIcon className="w-5 h-5 mr-2" />
            Review Pending ({(stats.deals?.pending || 0) + (stats.coupons?.pending || 0)})
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <UsersIcon className="w-5 h-5 mr-2" />
            Manage Users
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <BuildingOfficeIcon className="w-5 h-5 mr-2" />
            Add Company
          </button>
        </div>
      </div>
    </div>
  )
}

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: 'yellow', text: 'Pending' },
    approved: { color: 'green', text: 'Approved' },
    rejected: { color: 'red', text: 'Rejected' },
    expired: { color: 'gray', text: 'Expired' }
  }

  const config = statusConfig[status] || statusConfig.pending

  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-50 text-gray-800'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[config.color]}`}>
      {config.text}
    </span>
  )
}

export default AdminDashboard
