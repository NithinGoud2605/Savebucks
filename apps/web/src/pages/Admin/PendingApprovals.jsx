import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Skeleton } from '../../components/Loader/Skeleton'
import EnhancedPendingItem from '../../components/Admin/EnhancedPendingItem'
import AdminEditModal from '../../components/Admin/AdminEditModal'
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  EyeIcon,
  TagIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'

const PendingApprovals = () => {
  const [activeTab, setActiveTab] = useState('deals')
  const [selectedItems, setSelectedItems] = useState([])
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [itemToReject, setItemToReject] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [itemToEdit, setItemToEdit] = useState(null)

  const queryClient = useQueryClient()

  // Fetch pending deals
  const { data: pendingDeals, isLoading: dealsLoading } = useQuery({
    queryKey: ['admin', 'deals', 'pending'],
    queryFn: () => api.getPendingDeals(),
    enabled: activeTab === 'deals'
  })

  // Fetch pending coupons
  const { data: pendingCoupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['admin', 'coupons', 'pending'],
    queryFn: () => api.getPendingCoupons(),
    enabled: activeTab === 'coupons'
  })

  // Review deal mutation
  const reviewDealMutation = useMutation({
    mutationFn: ({ dealId, action, reason }) => api.reviewDeal({ dealId, action, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'deals', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      setSelectedItems([])
    }
  })

  // Review coupon mutation
  const reviewCouponMutation = useMutation({
    mutationFn: ({ couponId, action, reason }) => api.reviewCoupon({ couponId, action, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      setSelectedItems([])
    }
  })

  const handleApprove = (item) => {
    if (activeTab === 'deals') {
      reviewDealMutation.mutate({ dealId: item.id, action: 'approve' })
    } else {
      reviewCouponMutation.mutate({ couponId: item.id, action: 'approve' })
    }
  }

  const handleReject = (item) => {
    setItemToReject(item)
    setShowRejectModal(true)
  }

  const handleEdit = (item) => {
    setItemToEdit(item)
    setShowEditModal(true)
  }

  const confirmReject = () => {
    if (!itemToReject || !rejectionReason.trim()) return

    if (activeTab === 'deals') {
      reviewDealMutation.mutate({
        dealId: itemToReject.id,
        action: 'reject',
        reason: rejectionReason
      })
    } else {
      reviewCouponMutation.mutate({
        couponId: itemToReject.id,
        action: 'reject',
        reason: rejectionReason
      })
    }

    setShowRejectModal(false)
    setItemToReject(null)
    setRejectionReason('')
  }

  // Bulk actions
  const handleBulkApprove = () => {
    if (selectedItems.length === 0) return

    selectedItems.forEach(item => {
      if (activeTab === 'deals') {
        reviewDealMutation.mutate({ dealId: item.id, action: 'approve' })
      } else {
        reviewCouponMutation.mutate({ couponId: item.id, action: 'approve' })
      }
    })
  }

  const handleBulkReject = () => {
    if (selectedItems.length === 0) return
    setItemToReject({ id: 'bulk', items: selectedItems })
    setShowRejectModal(true)
  }

  const confirmBulkReject = () => {
    if (!rejectionReason.trim()) return

    selectedItems.forEach(item => {
      if (activeTab === 'deals') {
        reviewDealMutation.mutate({
          dealId: item.id,
          action: 'reject',
          reason: rejectionReason
        })
      } else {
        reviewCouponMutation.mutate({
          couponId: item.id,
          action: 'reject',
          reason: rejectionReason
        })
      }
    })

    setShowRejectModal(false)
    setItemToReject(null)
    setRejectionReason('')
  }


  const toggleSelection = (item) => {
    setSelectedItems(prev => 
      prev.find(i => i.id === item.id)
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item]
    )
  }

  const isLoading = activeTab === 'deals' ? dealsLoading : couponsLoading
  const items = activeTab === 'deals' ? pendingDeals : pendingCoupons

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">Pending Approvals</h2>
          <p className="text-secondary-600 mt-1">
            Review and approve submitted {activeTab}
          </p>
        </div>

        {selectedItems.length > 0 && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-secondary-600">
              {selectedItems.length} selected
            </span>
            <button
              onClick={handleBulkReject}
              disabled={reviewDealMutation.isLoading || reviewCouponMutation.isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-red-700 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Reject Selected</span>
            </button>
            <button
              onClick={handleBulkApprove}
              disabled={reviewDealMutation.isLoading || reviewCouponMutation.isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              <span>Approve Selected</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('deals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'deals'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ClipboardDocumentListIcon className="w-5 h-5" />
              <span>Deals</span>
              {pendingDeals && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  {pendingDeals.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'coupons'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <TagIcon className="w-5 h-5" />
              <span>Coupons</span>
              {pendingCoupons && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  {pendingCoupons.length}
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <EnhancedPendingItem
              key={item.id}
              item={item}
              type={activeTab}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
              onEdit={() => handleEdit(item)}
              onToggleSelection={() => toggleSelection(item)}
              isSelected={selectedItems.some(i => i.id === item.id)}
              isLoading={reviewDealMutation.isLoading || reviewCouponMutation.isLoading}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ClockIcon className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            No pending {activeTab}
          </h3>
          <p className="text-secondary-600">
            All {activeTab} have been reviewed. Great job!
          </p>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              {itemToReject?.id === 'bulk' 
                ? `Reject ${selectedItems.length} ${activeTab}` 
                : `Reject ${activeTab.slice(0, -1)}`
              }
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Reason for rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Please provide a clear reason for rejecting this submission..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setItemToReject(null)
                  setRejectionReason('')
                }}
                className="px-4 py-2 text-secondary-700 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={itemToReject?.id === 'bulk' ? confirmBulkReject : confirmReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {itemToReject?.id === 'bulk' ? 'Reject All' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <AdminEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setItemToEdit(null)
        }}
        item={itemToEdit}
        type={activeTab}
        onSuccess={() => {
          // Refresh the data after successful edit
          queryClient.invalidateQueries({ queryKey: ['admin', activeTab, 'pending'] })
        }}
      />
    </div>
  )
}


export default PendingApprovals
