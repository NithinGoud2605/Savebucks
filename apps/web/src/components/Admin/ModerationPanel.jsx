import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useToast } from '../Toast'
import { useConfirm } from '../ConfirmDialog'
import { formatPrice, formatDate } from '../../lib/format'
import { clsx } from 'clsx'

export function ModerationPanel({ deal, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: deal.title,
    price: deal.price || '',
    merchant: deal.merchant || '',
    description: deal.description || '',
  })
  const [rejectReason, setRejectReason] = useState('')

  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()

  const approveMutation = useMutation({
    mutationFn: (edits) => api.approveDeal(deal.id, edits),
    onSuccess: () => {
      toast.success('Deal approved successfully!')
      queryClient.invalidateQueries({ queryKey: ['admin', 'deals'] })
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      onUpdate?.()
    },
    onError: () => toast.error('Failed to approve deal')
  })

  const rejectMutation = useMutation({
    mutationFn: (reason) => api.rejectDeal(deal.id, reason),
    onSuccess: () => {
      toast.success('Deal rejected')
      queryClient.invalidateQueries({ queryKey: ['admin', 'deals'] })
      onUpdate?.()
    },
    onError: () => toast.error('Failed to reject deal')
  })

  const expireMutation = useMutation({
    mutationFn: () => api.expireDeal(deal.id),
    onSuccess: () => {
      toast.success('Deal marked as expired')
      queryClient.invalidateQueries({ queryKey: ['admin', 'deals'] })
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      onUpdate?.()
    },
    onError: () => toast.error('Failed to expire deal')
  })

  const handleApprove = async () => {
    const edits = isEditing ? {
      title: editData.title,
      price: editData.price ? parseFloat(editData.price) : null,
      merchant: editData.merchant,
      description: editData.description,
    } : {}

    const confirmed = await confirm({
      title: 'Approve Deal',
      message: isEditing
        ? 'Approve deal with your edits?'
        : 'Approve this deal as submitted?',
      confirmText: 'Approve',
    })

    if (confirmed) {
      approveMutation.mutate(edits)
    }
  }

  const handleReject = async () => {
    const reason = await new Promise((resolve) => {
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 z-50 overflow-y-auto'
      modal.innerHTML = `
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="fixed inset-0 bg-black bg-opacity-50"></div>
          <div class="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 class="text-lg font-semibold mb-4">Reject Deal</h3>
            <textarea id="reject-reason" placeholder="Reason for rejection..." class="w-full p-3 border rounded-lg mb-4" rows="4"></textarea>
            <div class="flex space-x-3 justify-end">
              <button id="cancel-reject" class="px-4 py-2 bg-gray-50 rounded-lg">Cancel</button>
              <button id="confirm-reject" class="px-4 py-2 bg-red-600 text-white rounded-lg">Reject</button>
            </div>
          </div>
        </div>
      `
      document.body.appendChild(modal)

      const reasonInput = modal.querySelector('#reject-reason')
      const cancelBtn = modal.querySelector('#cancel-reject')
      const confirmBtn = modal.querySelector('#confirm-reject')

      cancelBtn.onclick = () => {
        document.body.removeChild(modal)
        resolve(null)
      }

      confirmBtn.onclick = () => {
        const reason = reasonInput.value.trim()
        document.body.removeChild(modal)
        resolve(reason || 'No reason provided')
      }

      reasonInput.focus()
    })

    if (reason) {
      rejectMutation.mutate(reason)
    }
  }

  const handleExpire = async () => {
    const confirmed = await confirm({
      title: 'Mark as Expired',
      message: 'Mark this deal as expired? This cannot be undone.',
      confirmText: 'Mark Expired',
      type: 'danger',
    })

    if (confirmed) {
      expireMutation.mutate()
    }
  }

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="card p-6 space-y-6">
      {/* Deal Info */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <input
                value={editData.title}
                onChange={(e) => handleEditChange('title', e.target.value)}
                className="input text-lg font-semibold mb-2"
                placeholder="Deal title"
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {deal.title}
              </h3>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
              <span>Submitted {formatDate(deal.created_at)}</span>
              <span>Score: {(deal.ups || 0) - (deal.downs || 0)}</span>
              {deal.comments?.length > 0 && (
                <span>{deal.comments.length} comments</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.price}
                    onChange={(e) => handleEditChange('price', e.target.value)}
                    className="input"
                    placeholder="19.99"
                    step="0.01"
                  />
                ) : (
                  <p className="text-lg font-semibold text-green-600">
                    {deal.price ? formatPrice(deal.price, deal.currency) : 'No price'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Merchant</label>
                {isEditing ? (
                  <input
                    value={editData.merchant}
                    onChange={(e) => handleEditChange('merchant', e.target.value)}
                    className="input"
                    placeholder="Store name"
                  />
                ) : (
                  <p>{deal.merchant || 'Not specified'}</p>
                )}
              </div>
            </div>

            {(deal.description || isEditing) && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                {isEditing ? (
                  <textarea
                    value={editData.description}
                    onChange={(e) => handleEditChange('description', e.target.value)}
                    className="textarea"
                    rows={3}
                    placeholder="Deal description"
                  />
                ) : (
                  <p className="text-gray-800">
                    {deal.description}
                  </p>
                )}
              </div>
            )}

            <div className="mt-4">
              <a
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm break-all"
              >
                {deal.url}
              </a>
            </div>
          </div>

          {/* Get images array - prioritize deal_images, fallback to image_url */}
          {(deal.deal_images?.length > 0 ? deal.deal_images[0] : deal.image_url) && (
            <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-50 ml-4">
              <img
                src={deal.deal_images?.length > 0 ? deal.deal_images[0] : deal.image_url}
                alt={deal.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={clsx(
            'px-3 py-1 rounded-full text-sm font-medium',
            {
              'bg-yellow-100 text-yellow-800': deal.status === 'pending',
              'bg-green-100 text-green-800': deal.status === 'approved',
              'bg-red-100 text-red-800': deal.status === 'rejected',
              'bg-gray-50 text-gray-800': deal.status === 'expired',
            }
          )}>
            {deal.status?.charAt(0).toUpperCase() + deal.status?.slice(1) || 'Unknown'}
          </span>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-blue-600 hover:text-blue-700 focus-ring rounded"
          >
            {isEditing ? 'Cancel Edit' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleApprove}
          disabled={approveMutation.isPending}
          className="btn-primary disabled:opacity-50"
        >
          {approveMutation.isPending ? 'Approving...' : 'Approve'}
        </button>

        <button
          onClick={handleReject}
          disabled={rejectMutation.isPending}
          className="btn-danger disabled:opacity-50"
        >
          {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
        </button>

        <button
          onClick={handleExpire}
          disabled={expireMutation.isPending}
          className="btn-secondary disabled:opacity-50"
        >
          {expireMutation.isPending ? 'Expiring...' : 'Mark Expired'}
        </button>
      </div>

      {/* Last Action Info */}
      <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
        Last action: {formatDate(deal.updated_at || deal.created_at)} by moderator
      </div>
    </div>
  )
}
