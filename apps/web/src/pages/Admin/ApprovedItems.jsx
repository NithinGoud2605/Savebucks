import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Skeleton } from '../../components/ui/Skeleton'
import AdminEditModal from '../../components/Admin/AdminEditModal'
import { ConfirmModal } from '../../components/ui/Dialog'
import { toast } from '../../lib/toast'
import {
  CheckCircleIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  TagIcon,
  TrashIcon,
  EyeIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'

const SearchBar = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="w-5 h-5 text-secondary-400 absolute left-3 top-2.5" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>
  )
}

const ItemRow = ({ item, type, onEdit, onDelete, onView }) => {
  const currentImage = item.featured_image || item.deal_images?.[0] || item.coupon_images?.[0] || item.image_url

  return (
    <div className="bg-white border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-secondary-100 rounded overflow-hidden flex items-center justify-center">
          {currentImage ? (
            <img
              src={currentImage}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div className="w-full h-full flex items-center justify-center" style={{ display: currentImage ? 'none' : 'flex' }}>
            <TagIcon className="w-6 h-6 text-secondary-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-secondary-900 truncate">{item.title}</h3>
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 inline-flex items-center gap-1">
              <CheckCircleIcon className="w-3 h-3" /> Approved
            </span>
          </div>
          <div className="text-xs text-secondary-600 mb-2">
            {type === 'deals' ? (item.merchant || item.companies?.name) : item.companies?.name} • {new Date(item.created_at).toLocaleDateString()}
          </div>
          {type === 'deals' && (
            <div className="text-sm text-secondary-800 mb-2">
              {item.price != null && <span className="font-semibold">${item.price}</span>}
              {item.original_price && <span className="line-through text-secondary-500 ml-2">${item.original_price}</span>}
            </div>
          )}
          {type === 'coupons' && item.coupon_code && (
            <div className="text-sm text-secondary-800 mb-2">
              <span className="font-semibold">Code: {item.coupon_code}</span>
            </div>
          )}
          <div className="text-sm text-secondary-700 line-clamp-2">{item.description}</div>

          {/* Tags */}
          {item.deal_tags && item.deal_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.deal_tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {tag.tags?.name || tag}
                </span>
              ))}
              {item.deal_tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-600 rounded-full">
                  +{item.deal_tags.length - 3} more
                </span>
              )}
            </div>
          )}
          {item.coupon_tags && item.coupon_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.coupon_tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {tag.tags?.name || tag}
                </span>
              ))}
              {item.coupon_tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-600 rounded-full">
                  +{item.coupon_tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 flex gap-2">
          <button
            onClick={onView}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-secondary-300 rounded-lg hover:bg-secondary-50 text-secondary-700"
          >
            <EyeIcon className="w-4 h-4" /> View
          </button>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-primary-300 rounded-lg hover:bg-primary-50 text-primary-700"
          >
            <PencilSquareIcon className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-red-300 rounded-lg hover:bg-red-50 text-red-700"
          >
            <TrashIcon className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  )
}

const ApprovedItems = () => {
  const [activeTab, setActiveTab] = useState('deals')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showEditModal, setShowEditModal] = useState(false)
  const [itemToEdit, setItemToEdit] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

  const queryClient = useQueryClient()

  // Fetch approved deals
  const { data: approvedDeals, isLoading: dealsLoading } = useQuery({
    queryKey: ['admin', 'approved', 'deals', search, page],
    queryFn: () => api.listAdminDeals({ status: 'approved', search, page, limit: 20 }),
    enabled: activeTab === 'deals'
  })

  // Fetch approved coupons
  const { data: approvedCoupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['admin', 'approved', 'coupons', search, page],
    queryFn: () => api.listAdminCoupons({ status: 'approved', search, page, limit: 20 }),
    enabled: activeTab === 'coupons'
  })

  // Delete deal mutation
  const deleteDealMutation = useMutation({
    mutationFn: (dealId) => api.deleteDeal(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'approved', 'deals'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      toast.success('Deal deleted successfully')
      setShowDeleteDialog(false)
      setItemToDelete(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete deal')
    }
  })

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: (couponId) => api.deleteCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'approved', 'coupons'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      toast.success('Coupon deleted successfully')
      setShowDeleteDialog(false)
      setItemToDelete(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete coupon')
    }
  })

  const handleEdit = (item) => {
    setItemToEdit(item)
    setShowEditModal(true)
  }

  const handleDelete = (item) => {
    setItemToDelete(item)
    setShowDeleteDialog(true)
  }

  const handleView = (item) => {
    if (activeTab === 'deals') {
      window.open(`/deal/${item.id}`, '_blank')
    } else {
      window.open(`/company/${item.companies?.slug}`, '_blank')
    }
  }

  const confirmDelete = () => {
    if (itemToDelete) {
      if (activeTab === 'deals') {
        deleteDealMutation.mutate(itemToDelete.id)
      } else {
        deleteCouponMutation.mutate(itemToDelete.id)
      }
    }
  }

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'approved', activeTab] })
    setShowEditModal(false)
    setItemToEdit(null)
    toast.success(`${activeTab.slice(0, -1)} updated successfully!`)
  }

  const items = activeTab === 'deals' ? (approvedDeals || []) : (approvedCoupons || [])
  const loading = activeTab === 'deals' ? dealsLoading : couponsLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">Approved Items</h2>
          <p className="text-secondary-600 mt-1">Manage and edit approved deals and coupons</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('deals'); setPage(1) }}
            className={`px-3 py-2 rounded-lg border ${activeTab === 'deals'
              ? 'border-primary-300 bg-primary-50 text-primary-700'
              : 'border-secondary-200 text-secondary-700'
              }`}
          >
            Deals
          </button>
          <button
            onClick={() => { setActiveTab('coupons'); setPage(1) }}
            className={`px-3 py-2 rounded-lg border ${activeTab === 'coupons'
              ? 'border-primary-300 bg-primary-50 text-primary-700'
              : 'border-secondary-200 text-secondary-700'
              }`}
          >
            Coupons
          </button>
        </div>
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={`Search approved ${activeTab}`}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              type={activeTab}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
              onView={() => handleView(item)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-secondary-600">
          <ClipboardDocumentListIcon className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
          <p>No approved {activeTab} found.</p>
          {search && (
            <p className="text-sm mt-2">Try adjusting your search terms.</p>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && itemToEdit && (
        <AdminEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setItemToEdit(null)
          }}
          item={itemToEdit}
          type={activeTab}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false)
            setItemToDelete(null)
          }
        }}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false)
          setItemToDelete(null)
        }}
        title={`Delete ${activeTab.slice(0, -1)}`}
        description={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone and will also remove all associated images, tags, and votes.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteDealMutation.isPending || deleteCouponMutation.isPending}
      />
    </div>
  )
}

export default ApprovedItems
