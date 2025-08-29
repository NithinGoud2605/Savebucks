import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { Container } from '../../components/Layout/Container'
import { ModerationPanel } from '../../components/Admin/ModerationPanel'
import { SkeletonList } from '../../components/Loader/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { api } from '../../lib/api'
import { setPageMeta } from '../../lib/head'
import { clsx } from 'clsx'

export default function AdminPage() {
  const [selectedStatus, setSelectedStatus] = useState('pending')

  React.useEffect(() => {
    setPageMeta({
      title: 'Admin Panel',
      description: 'Moderate deals and manage the community.',
    })
  }, [])

  // Check if user is admin
  const { data: adminCheck, isLoading: adminLoading } = useQuery({
    queryKey: ['admin', 'whoami'],
    queryFn: api.checkAdmin,
    retry: false,
  })

  const { data: deals = [], isLoading, refetch } = useQuery({
    queryKey: ['admin', 'deals', selectedStatus],
    queryFn: () => api.getAdminDeals(selectedStatus),
    enabled: adminCheck?.isAdmin,
  })

  if (adminLoading) {
    return (
      <Container className="py-8">
        <div className="text-center">Loading...</div>
      </Container>
    )
  }

  if (!adminCheck?.isAdmin) {
    return <Navigate to="/" replace />
  }

  const statusTabs = [
    { key: 'pending', label: 'Pending', count: deals.filter(d => d.status === 'pending').length },
    { key: 'approved', label: 'Approved', count: deals.filter(d => d.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: deals.filter(d => d.status === 'rejected').length },
    { key: 'expired', label: 'Expired', count: deals.filter(d => d.status === 'expired').length },
  ]

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Panel
        </h1>
        <p className="text-gray-600">
          Manage deals and moderate community submissions.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={clsx(
                'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-ring',
                selectedStatus === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={clsx(
                  'ml-2 px-2 py-0.5 text-xs rounded-full',
                  selectedStatus === tab.key
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-200 text-gray-600'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonList count={3} />
      ) : deals.length === 0 ? (
        <EmptyState
          icon={({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          title={`No ${selectedStatus} deals`}
          description={`There are currently no deals with ${selectedStatus} status.`}
        />
      ) : (
        <div className="space-y-6">
          {deals.map((deal) => (
            <ModerationPanel 
              key={deal.id} 
              deal={deal} 
              onUpdate={() => refetch()}
            />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusTabs.map((tab) => (
          <div key={tab.key} className="card p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {tab.count}
            </div>
            <div className="text-sm text-gray-600">
              {tab.label}
            </div>
          </div>
        ))}
      </div>
    </Container>
  )
}
