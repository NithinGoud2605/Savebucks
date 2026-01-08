import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Skeleton } from '../../components/ui/Skeleton'
import ImageUpload from '../../components/Upload/ImageUpload'
import { useAuth } from '../../hooks/useAuth'
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  CheckBadgeIcon,
  PhotoIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  XCircleIcon,
  EyeIcon,
  FlagIcon,
  StarIcon,
  CalendarIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

const CompanyManagement = () => {
  const { user, isAdmin } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [showApprovalQueue, setShowApprovalQueue] = useState(false)
  const [selectedCompanyForReview, setSelectedCompanyForReview] = useState(null)
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, company: null })
  const [reviewForm, setReviewForm] = useState({
    action: 'approve',
    notes: '',
    priority: 'normal',
    flags: []
  })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    category_id: '',
    is_verified: false,
    status: 'pending',
    priority: 'normal',
    flags: [],
    headquarters: '',
    founded_year: '',
    employee_count: '',
    revenue_range: '',
    rating: '',
    total_reviews: '',
    review_notes: '',
    // Additional company fields
    social_media: { twitter: '', facebook: '', instagram: '', linkedin: '' },
    contact_info: { phone: '', email: '', website: '' },
    business_hours: { online: '', customer_service: '' },
    payment_methods: [],
    shipping_info: { free_shipping: '', standard: '', express: '' },
    return_policy: '',
    customer_service: '',
    mobile_app_url: '',
    app_store_rating: '',
    play_store_rating: '',
    trustpilot_rating: '',
    trustpilot_reviews_count: '',
    bbb_rating: '',
    bbb_accreditation: false,
    certifications: [],
    awards: [],
    meta_title: '',
    meta_description: '',
    meta_keywords: [],
    canonical_url: '',
    // Restaurant-specific fields
    is_restaurant: false,
    latitude: '',
    longitude: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US',
    phone: '',
    website: '',
    cuisine_type: '',
    price_range: '',
    restaurant_hours: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: ''
    }
  })

  const queryClient = useQueryClient()

  // Fetch companies
  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.getCompanies({ limit: 100 })
  })

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: (companyId) => api.deleteCompanyAdmin(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries(['companies'])
      setDeleteConfirmModal({ show: false, company: null })
    },
    onError: (error) => {
      console.error('Error deleting company:', error)
    }
  })

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: api.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setShowCreateModal(false)
      resetForm()
      // Reload the page to show updated data
      window.location.reload()
    }
  })

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateCompanyAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setEditingCompany(null)
      resetForm()
      setShowCreateModal(false)
      // Reload the page to show updated data
      window.location.reload()
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      website_url: '',
      category_id: '',
      is_verified: false,
      status: 'pending',
      priority: 'normal',
      flags: [],
      headquarters: '',
      founded_year: '',
      employee_count: '',
      revenue_range: '',
      rating: '',
      total_reviews: '',
      review_notes: '',
      // Additional company fields
      social_media: { twitter: '', facebook: '', instagram: '', linkedin: '' },
      contact_info: { phone: '', email: '', website: '' },
      business_hours: { online: '', customer_service: '' },
      payment_methods: [],
      shipping_info: { free_shipping: '', standard: '', express: '' },
      return_policy: '',
      customer_service: '',
      mobile_app_url: '',
      app_store_rating: '',
      play_store_rating: '',
      trustpilot_rating: '',
      trustpilot_reviews_count: '',
      bbb_rating: '',
      bbb_accreditation: false,
      certifications: [],
      awards: [],
      meta_title: '',
      meta_description: '',
      meta_keywords: [],
      canonical_url: '',
      // Restaurant-specific fields
      is_restaurant: false,
      latitude: '',
      longitude: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'US',
      phone: '',
      website: '',
      cuisine_type: '',
      price_range: '',
      restaurant_hours: {
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: ''
      }
    })
    setShowAdditionalDetails(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    console.log('🔧 Form submission data:', formData)
    console.log('🔧 Category ID being sent:', formData.category_id)

    if (editingCompany) {
      updateCompanyMutation.mutate({ id: editingCompany.id, data: formData })
    } else {
      createCompanyMutation.mutate(formData)
    }
  }

  // Helper function to get category ID from category name
  const getCategoryIdFromName = (categoryName) => {
    const categoryMap = {
      'E-commerce': 1,
      'Technology': 2,
      'Restaurant': 3,
      'Travel': 4,
      'Fashion': 5,
      'Health & Beauty': 6,
      'Home & Garden': 7,
      'Automotive': 8,
      'Entertainment': 9,
      'Education': 10,
      'Finance': 11,
      'Sports & Fitness': 12,
      'Pets': 13,
      'Books & Media': 14
    }
    return categoryMap[categoryName] || ''
  }

  const startEdit = (company) => {
    console.log('🔧 Starting edit for company:', company)
    console.log('🔧 Company category:', company.category)
    console.log('🔧 Mapped category_id:', getCategoryIdFromName(company.category))

    setEditingCompany(company)
    setFormData({
      name: company.name || '',
      description: company.description || '',
      website_url: company.website_url || '',
      category_id: company.category_id || getCategoryIdFromName(company.category) || '',
      is_verified: company.is_verified || false,
      status: company.status || 'pending',
      priority: company.priority || 'normal',
      flags: company.flags || [],
      headquarters: company.headquarters || '',
      founded_year: company.founded_year || '',
      employee_count: company.employee_count || '',
      revenue_range: company.revenue_range || '',
      rating: company.rating || '',
      total_reviews: company.total_reviews || '',
      review_notes: company.review_notes || '',
      // Additional company fields
      social_media: company.social_media || { twitter: '', facebook: '', instagram: '', linkedin: '' },
      contact_info: company.contact_info || { phone: '', email: '', website: '' },
      business_hours: company.business_hours || { online: '', customer_service: '' },
      payment_methods: company.payment_methods || [],
      shipping_info: company.shipping_info || { free_shipping: '', standard: '', express: '' },
      return_policy: company.return_policy || '',
      customer_service: company.customer_service || '',
      mobile_app_url: company.mobile_app_url || '',
      app_store_rating: company.app_store_rating || '',
      play_store_rating: company.play_store_rating || '',
      trustpilot_rating: company.trustpilot_rating || '',
      trustpilot_reviews_count: company.trustpilot_reviews_count || '',
      bbb_rating: company.bbb_rating || '',
      bbb_accreditation: company.bbb_accreditation || false,
      certifications: company.certifications || [],
      awards: company.awards || [],
      meta_title: company.meta_title || '',
      meta_description: company.meta_description || '',
      meta_keywords: company.meta_keywords || [],
      canonical_url: company.canonical_url || '',
      // Restaurant-specific fields
      is_restaurant: company.is_restaurant || false,
      latitude: company.latitude || '',
      longitude: company.longitude || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      zip_code: company.zip_code || '',
      country: company.country || 'US',
      phone: company.phone || '',
      website: company.website || '',
      cuisine_type: company.cuisine_type || '',
      price_range: company.price_range || '',
      restaurant_hours: company.restaurant_hours || {
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: ''
      }
    })
    setShowCreateModal(true)
  }

  const handleDeleteClick = (company) => {
    setDeleteConfirmModal({ show: true, company })
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirmModal.company) {
      deleteCompanyMutation.mutate(deleteConfirmModal.company.id)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmModal({ show: false, company: null })
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    // Handle nested object fields (e.g., contact_info.phone)
    if (name.includes('.')) {
      const [parentKey, childKey] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parentKey]: {
          ...prev[parentKey],
          [childKey]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleQuickApprove = async (companyId) => {
    try {
      console.log('Approving company:', companyId, 'User:', user)
      const updateData = {
        status: 'approved',
        is_verified: true,
        reviewed_by: user?.id || 'admin',
        reviewed_at: new Date().toISOString(),
        review_notes: 'Quick approved by admin'
      }
      console.log('Sending update data:', updateData)
      const result = await api.updateCompany(companyId, updateData)
      console.log('Approval result:', result)
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      // Show success feedback and reload
      alert('Company approved successfully!')
      window.location.reload()
    } catch (err) {
      console.error('Failed to approve company:', err)
      alert(`Failed to approve company: ${err.message}`)
    }
  }

  const handleQuickReject = async (companyId) => {
    const notes = prompt('Rejection reason (optional):')
    if (notes !== null) {
      try {
        console.log('Rejecting company:', companyId, 'with notes:', notes, 'User:', user)
        const updateData = {
          status: 'rejected',
          review_notes: notes || 'Rejected by admin',
          reviewed_by: user?.id || 'admin',
          reviewed_at: new Date().toISOString()
        }
        console.log('Sending reject data:', updateData)
        const result = await api.updateCompany(companyId, updateData)
        console.log('Rejection result:', result)
        queryClient.invalidateQueries({ queryKey: ['companies'] })
        // Show success feedback and reload
        alert('Company rejected successfully!')
        window.location.reload()
      } catch (err) {
        console.error('Failed to reject company:', err)
        alert(`Failed to reject company: ${err.message}`)
      }
    }
  }

  // Enhanced approval workflow functions
  const openReviewModal = (company) => {
    setSelectedCompanyForReview(company)
    setReviewForm({
      action: 'approve',
      notes: company.review_notes || '',
      priority: company.priority || 'normal',
      flags: company.flags || []
    })
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCompanyForReview) return

    try {
      const updateData = {
        status: reviewForm.action,
        review_notes: reviewForm.notes,
        priority: reviewForm.priority,
        flags: reviewForm.flags,
        reviewed_by: user?.id || 'admin',
        reviewed_at: new Date().toISOString()
      }

      if (reviewForm.action === 'approve') {
        updateData.is_verified = true
      }

      await api.updateCompany(selectedCompanyForReview.id, updateData)
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setSelectedCompanyForReview(null)
      setReviewForm({ action: 'approve', notes: '', priority: 'normal', flags: [] })
      // Reload the page to show updated data
      window.location.reload()
    } catch (err) {
      console.error('Failed to review company:', err)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-orange-600 bg-orange-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getDaysPending = (submittedAt) => {
    const days = Math.floor((new Date() - new Date(submittedAt)) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }

  const getUrgencyIndicator = (submittedAt, priority) => {
    const days = Math.floor((new Date() - new Date(submittedAt)) / (1000 * 60 * 60 * 24))

    if (priority === 'high' && days >= 2) return 'urgent'
    if (priority === 'medium' && days >= 5) return 'warning'
    if (days >= 7) return 'overdue'
    return 'normal'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">Company Management</h2>
          <p className="text-secondary-600 mt-1">
            Manage companies and merchants on the platform
          </p>
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-2">
            User: {user?.id || 'Not authenticated'} | Admin: {isAdmin ? 'Yes' : 'No'}
            <button
              onClick={() => console.log('Current state:', { user, isAdmin, companies: companies?.length })}
              className="ml-2 text-blue-500 hover:text-blue-700"
            >
              Debug
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-secondary-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={() => setStatusFilter('')}
            className="text-sm text-secondary-600 hover:text-secondary-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Summary */}
      {companies && companies.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-secondary-600">
              Showing {companies.filter(company => !statusFilter || company.status === statusFilter).length} of {companies.length} companies
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-yellow-600">
                {companies.filter(c => c.status === 'pending').length} Pending
              </span>
              <span className="text-green-600">
                {companies.filter(c => c.status === 'approved').length} Approved
              </span>
              <span className="text-red-600">
                {companies.filter(c => c.status === 'rejected').length} Rejected
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Approval Queue */}
      {companies && companies.filter(c => c.status === 'pending').length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-800">Approval Queue</h3>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium">
                {companies.filter(c => c.status === 'pending').length} pending
              </span>
            </div>
            <button
              onClick={() => setShowApprovalQueue(!showApprovalQueue)}
              className="text-yellow-700 hover:text-yellow-900 text-sm font-medium"
            >
              {showApprovalQueue ? 'Hide Queue' : 'Show Queue'}
            </button>
          </div>

          {showApprovalQueue && (
            <div className="space-y-3">
              {companies
                .filter(c => c.status === 'pending')
                .sort((a, b) => {
                  // Sort by priority and then by submission date
                  const priorityOrder = { high: 3, medium: 2, low: 1, normal: 0 }
                  const aPriority = priorityOrder[a.priority || 'normal']
                  const bPriority = priorityOrder[b.priority || 'normal']

                  if (aPriority !== bPriority) return bPriority - aPriority
                  return new Date(a.submitted_at) - new Date(b.submitted_at)
                })
                .map((company) => {
                  const urgency = getUrgencyIndicator(company.submitted_at, company.priority)
                  return (
                    <div key={company.id} className="bg-white rounded-lg border border-yellow-200 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">{company.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(company.priority || 'normal')}`}>
                              {company.priority || 'normal'}
                            </span>
                            {urgency !== 'normal' && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                                urgency === 'warning' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {urgency === 'urgent' ? 'Urgent' : urgency === 'warning' ? 'Warning' : 'Overdue'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center space-x-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{getDaysPending(company.submitted_at)}</span>
                            </span>
                            {company.company_categories && (
                              <span>Category: {company.company_categories.name}</span>
                            )}
                            {company.headquarters && (
                              <span>Location: {company.headquarters}</span>
                            )}
                          </div>

                          {company.description && (
                            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                              {company.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => openReviewModal(company)}
                            className="flex items-center space-x-1 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                          >
                            <EyeIcon className="w-4 h-4" />
                            <span>Review</span>
                          </button>
                          <button
                            onClick={() => {
                              console.log('Quick approve clicked for company:', company.id, company.name)
                              handleQuickApprove(company.id)
                            }}
                            className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Quick Approve</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* Companies List */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Error Loading Companies
            </h3>
            <p className="text-secondary-600">
              Unable to load company data. Please try again.
            </p>
          </div>
        ) : companies && companies.length > 0 ? (
          <div className="divide-y divide-secondary-200">
            {companies
              .filter(company => !statusFilter || company.status === statusFilter)
              .map((company) => (
                <div key={company.id} className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={company.name}
                          className="w-16 h-16 rounded-lg object-cover border border-secondary-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-secondary-100 flex items-center justify-center border border-secondary-200">
                          <BuildingOfficeIcon className="w-8 h-8 text-secondary-400" />
                        </div>
                      )}
                    </div>

                    {/* Company Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-secondary-900">
                              {company.name}
                            </h3>
                            {company.is_verified && (
                              <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
                            )}
                          </div>

                          <p className="text-sm text-secondary-600 mb-2">
                            /{company.slug}
                          </p>

                          {company.description && (
                            <p className="text-sm text-secondary-700 mb-2 line-clamp-2">
                              {company.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-secondary-500">
                            {company.website && (
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700"
                              >
                                Website
                              </a>
                            )}
                            {company.company_categories && (
                              <span>Category: {company.company_categories.name}</span>
                            )}
                            <span>
                              Created: {new Date(company.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Review History */}
                          {(company.review_notes || company.reviewed_at || company.flags?.length > 0) && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Review History</h5>
                              <div className="space-y-2 text-sm">
                                {company.review_notes && (
                                  <div className="flex items-start space-x-2">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                                    <span className="text-gray-600">{company.review_notes}</span>
                                  </div>
                                )}
                                {company.reviewed_at && (
                                  <div className="flex items-center space-x-2 text-gray-500">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span>Reviewed: {new Date(company.reviewed_at).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {company.flags && company.flags.length > 0 && (
                                  <div className="flex items-center space-x-2">
                                    <FlagIcon className="w-4 h-4 text-gray-500" />
                                    <div className="flex flex-wrap gap-1">
                                      {company.flags.map((flag, index) => (
                                        <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                                          {flag.replace('_', ' ')}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Status and Quick Actions */}
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${company.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : company.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {company.status === 'approved' ? 'Approved' :
                                  company.status === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>

                              {company.status === 'pending' && company.priority && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(company.priority)}`}>
                                  {company.priority}
                                </span>
                              )}

                              {company.status === 'pending' && (
                                <span className="text-xs text-gray-500">
                                  {getDaysPending(company.submitted_at)}
                                </span>
                              )}
                            </div>

                            {company.status === 'pending' && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => openReviewModal(company)}
                                  className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 transition-colors"
                                >
                                  Review
                                </button>
                                <button
                                  onClick={() => {
                                    console.log('Quick approve clicked for company:', company.id, company.name)
                                    handleQuickApprove(company.id)
                                  }}
                                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    console.log('Quick reject clicked for company:', company.id, company.name)
                                    handleQuickReject(company.id)
                                  }}
                                  className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEdit(company)}
                            className="flex items-center space-x-1 px-3 py-1 text-sm text-secondary-600 border border-secondary-300 rounded hover:bg-secondary-50 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteClick(company)}
                            className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No Companies Yet
            </h3>
            <p className="text-secondary-600 mb-4">
              Get started by adding your first company.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Company</span>
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary-200">
              <h3 className="text-lg font-semibold text-secondary-900">
                {editingCompany ? 'Edit Company' : 'Add New Company'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Essential Fields Only */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select a category</option>
                    <option value="1">E-commerce</option>
                    <option value="2">Technology</option>
                    <option value="3">Restaurant</option>
                    <option value="4">Fashion</option>
                    <option value="5">Home & Garden</option>
                    <option value="6">Health & Beauty</option>
                    <option value="7">Automotive</option>
                    <option value="8">Travel</option>
                    <option value="9">Entertainment</option>
                    <option value="10">Sports</option>
                    <option value="11">Education</option>
                    <option value="12">Finance</option>
                    <option value="13">Real Estate</option>
                    <option value="14">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Brief description of the company"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Headquarters
                  </label>
                  <input
                    type="text"
                    name="headquarters"
                    value={formData.headquarters}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="City, State, Country"
                  />
                </div>
              </div>

              {/* Admin Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_verified"
                      checked={formData.is_verified}
                      onChange={handleInputChange}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label className="ml-2 text-sm text-secondary-700">
                      Verified Company
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Review Notes
                </label>
                <textarea
                  name="review_notes"
                  value={formData.review_notes}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Admin notes about this company..."
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Restaurant Information */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-secondary-900">Restaurant Information</h3>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="is_restaurant"
                      checked={formData.is_restaurant}
                      onChange={handleInputChange}
                      className="rounded border-secondary-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-secondary-700">
                      This is a restaurant
                    </span>
                  </label>
                </div>

                {formData.is_restaurant && (
                  <div className="space-y-6">
                    {/* Location Information */}
                    <div>
                      <h4 className="text-md font-medium text-secondary-800 mb-3">Location Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Address *
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="123 Main Street"
                            required={formData.is_restaurant}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="San Francisco"
                            required={formData.is_restaurant}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="CA"
                            required={formData.is_restaurant}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            name="zip_code"
                            value={formData.zip_code}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="94102"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Country
                          </label>
                          <select
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="UK">United Kingdom</option>
                            <option value="AU">Australia</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Coordinates */}
                    <div>
                      <h4 className="text-md font-medium text-secondary-800 mb-3">Coordinates (for location-based search)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Latitude *
                          </label>
                          <input
                            type="number"
                            name="latitude"
                            value={formData.latitude}
                            onChange={handleInputChange}
                            step="any"
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="37.7749"
                            required={formData.is_restaurant}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Longitude *
                          </label>
                          <input
                            type="number"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleInputChange}
                            step="any"
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="-122.4194"
                            required={formData.is_restaurant}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Restaurant Details */}
                    <div>
                      <h4 className="text-md font-medium text-secondary-800 mb-3">Restaurant Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Cuisine Type
                          </label>
                          <select
                            name="cuisine_type"
                            value={formData.cuisine_type}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="">Select cuisine type</option>
                            <option value="Italian">Italian</option>
                            <option value="American">American</option>
                            <option value="Chinese">Chinese</option>
                            <option value="Mexican">Mexican</option>
                            <option value="Japanese">Japanese</option>
                            <option value="Indian">Indian</option>
                            <option value="Thai">Thai</option>
                            <option value="French">French</option>
                            <option value="Mediterranean">Mediterranean</option>
                            <option value="Korean">Korean</option>
                            <option value="Vietnamese">Vietnamese</option>
                            <option value="Greek">Greek</option>
                            <option value="Middle Eastern">Middle Eastern</option>
                            <option value="Seafood">Seafood</option>
                            <option value="Steakhouse">Steakhouse</option>
                            <option value="Fast Food">Fast Food</option>
                            <option value="Pizza">Pizza</option>
                            <option value="Burgers">Burgers</option>
                            <option value="Cafe">Cafe</option>
                            <option value="Bakery">Bakery</option>
                            <option value="Dessert">Dessert</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Price Range
                          </label>
                          <select
                            name="price_range"
                            value={formData.price_range}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="">Select price range</option>
                            <option value="$">$ - Budget friendly</option>
                            <option value="$$">$$ - Moderate</option>
                            <option value="$$$">$$$ - Expensive</option>
                            <option value="$$$$">$$$$ - Very expensive</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Restaurant Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Restaurant Website
                          </label>
                          <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="https://restaurant.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Restaurant Hours */}
                    <div>
                      <h4 className="text-md font-medium text-secondary-800 mb-3">Restaurant Hours</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(formData.restaurant_hours).map(([day, hours]) => (
                          <div key={day}>
                            <label className="block text-sm font-medium text-secondary-700 mb-2 capitalize">
                              {day}
                            </label>
                            <input
                              type="text"
                              name={`restaurant_hours.${day}`}
                              value={hours}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              placeholder="9:00-22:00 or Closed"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Details Toggle */}
              <div className="border-t border-secondary-200 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
                  className="flex items-center justify-between w-full p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <PlusIcon className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-medium text-secondary-900">Additional Company Details</h4>
                      <p className="text-xs text-secondary-600">Add more detailed information about the company</p>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-secondary-500 transition-transform duration-200 ${showAdditionalDetails ? 'rotate-180' : ''
                      }`}
                  />
                </button>
              </div>

              {/* Additional Details Section */}
              {showAdditionalDetails && (
                <div className="space-y-6 bg-secondary-50 p-6 rounded-lg border border-secondary-200">
                  <h4 className="text-lg font-medium text-secondary-900 border-b pb-2">Company Details</h4>

                  {/* Company Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Founded Year
                      </label>
                      <input
                        type="number"
                        name="founded_year"
                        value={formData.founded_year}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 1994"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Employee Count
                      </label>
                      <input
                        type="text"
                        name="employee_count"
                        value={formData.employee_count}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 1000+"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Revenue Range
                      </label>
                      <input
                        type="text"
                        name="revenue_range"
                        value={formData.revenue_range}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., $100M+"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Company Rating
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        name="rating"
                        value={formData.rating}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 4.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Total Reviews
                    </label>
                    <input
                      type="number"
                      name="total_reviews"
                      value={formData.total_reviews}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., 1000"
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="border-t border-secondary-200 pt-6">
                    <h5 className="text-md font-medium text-secondary-900 mb-4">Contact Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="contact_info.phone"
                          value={formData.contact_info?.phone || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="contact_info.email"
                          value={formData.contact_info?.email || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="contact@company.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="border-t border-secondary-200 pt-6">
                    <h5 className="text-md font-medium text-secondary-900 mb-4">Business Information</h5>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Return Policy
                        </label>
                        <textarea
                          name="return_policy"
                          value={formData.return_policy}
                          onChange={handleInputChange}
                          rows={2}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Company's return policy details..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Customer Service
                        </label>
                        <textarea
                          name="customer_service"
                          value={formData.customer_service}
                          onChange={handleInputChange}
                          rows={2}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Customer service information..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ratings & Reviews */}
                  <div className="border-t border-secondary-200 pt-6">
                    <h5 className="text-md font-medium text-secondary-900 mb-4">Ratings & Reviews</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          App Store Rating
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          name="app_store_rating"
                          value={formData.app_store_rating}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., 4.2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Play Store Rating
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          name="play_store_rating"
                          value={formData.play_store_rating}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., 4.3"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Trustpilot Rating
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          name="trustpilot_rating"
                          value={formData.trustpilot_rating}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., 4.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Trustpilot Reviews Count
                        </label>
                        <input
                          type="number"
                          name="trustpilot_reviews_count"
                          value={formData.trustpilot_reviews_count}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., 500"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Mobile App URL
                      </label>
                      <input
                        type="url"
                        name="mobile_app_url"
                        value={formData.mobile_app_url}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://apps.apple.com/app/company-app"
                      />
                    </div>
                  </div>

                  {/* SEO & Metadata */}
                  <div className="border-t border-secondary-200 pt-6">
                    <h5 className="text-md font-medium text-secondary-900 mb-4">SEO & Metadata</h5>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Meta Title
                        </label>
                        <input
                          type="text"
                          name="meta_title"
                          value={formData.meta_title}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="SEO title for search engines"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Meta Description
                        </label>
                        <textarea
                          name="meta_description"
                          value={formData.meta_description}
                          onChange={handleInputChange}
                          rows={2}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="SEO description for search engines"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Canonical URL
                        </label>
                        <input
                          type="url"
                          name="canonical_url"
                          value={formData.canonical_url}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="https://example.com/canonical-page"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Logo Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-secondary-900 border-b pb-2">Company Logo</h4>

                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Company Logo
                  </label>
                  {editingCompany ? (
                    <ImageUpload
                      entityType="company"
                      entityId={editingCompany.id}
                      maxFiles={1}
                      existingImages={editingCompany.logo_url ? [{ url: editingCompany.logo_url }] : []}
                      onUploadComplete={() => {
                        queryClient.invalidateQueries({ queryKey: ['companies'] })
                        // Show success message
                        alert('Logo updated successfully!')
                      }}
                      onUploadError={(error) => {
                        alert(`Logo upload failed: ${error}`)
                      }}
                      className="max-w-md"
                    />
                  ) : (
                    <div className="max-w-md p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <p className="text-gray-500 text-sm">
                        Logo upload will be available after creating the company
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingCompany(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-secondary-700 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCompanyMutation.isLoading || updateCompanyMutation.isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {(createCompanyMutation.isLoading || updateCompanyMutation.isLoading)
                    ? 'Saving...'
                    : editingCompany
                      ? 'Update Company'
                      : 'Create Company'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Review Modal */}
      {selectedCompanyForReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-secondary-900">
                  Review Company: {selectedCompanyForReview.name}
                </h3>
                <button
                  onClick={() => setSelectedCompanyForReview(null)}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-secondary-900 border-b pb-2">Company Details</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-secondary-700">Company Name</label>
                      <p className="text-secondary-900">{selectedCompanyForReview.name}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-secondary-700">Slug</label>
                      <p className="text-secondary-900">/{selectedCompanyForReview.slug}</p>
                    </div>

                    {selectedCompanyForReview.description && (
                      <div>
                        <label className="text-sm font-medium text-secondary-700">Description</label>
                        <p className="text-secondary-900">{selectedCompanyForReview.description}</p>
                      </div>
                    )}

                    {selectedCompanyForReview.website && (
                      <div>
                        <label className="text-sm font-medium text-secondary-700">Website</label>
                        <a
                          href={selectedCompanyForReview.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800"
                        >
                          {selectedCompanyForReview.website}
                        </a>
                      </div>
                    )}

                    {selectedCompanyForReview.headquarters && (
                      <div>
                        <label className="text-sm font-medium text-secondary-700">Headquarters</label>
                        <p className="text-secondary-900">{selectedCompanyForReview.headquarters}</p>
                      </div>
                    )}

                    {selectedCompanyForReview.company_categories && (
                      <div>
                        <label className="text-sm font-medium text-secondary-700">Category</label>
                        <p className="text-secondary-900">{selectedCompanyForReview.company_categories.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Form */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-secondary-900 border-b pb-2">Review Decision</h4>

                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Action *
                      </label>
                      <select
                        value={reviewForm.action}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, action: e.target.value }))}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="approve">Approve Company</option>
                        <option value="reject">Reject Company</option>
                        <option value="request_changes">Request Changes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Priority Level
                      </label>
                      <select
                        value={reviewForm.priority}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Flags
                      </label>
                      <div className="space-y-2">
                        {['suspicious', 'incomplete', 'duplicate', 'spam'].map((flag) => (
                          <label key={flag} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={reviewForm.flags.includes(flag)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setReviewForm(prev => ({ ...prev, flags: [...prev.flags, flag] }))
                                } else {
                                  setReviewForm(prev => ({ ...prev, flags: prev.flags.filter(f => f !== flag) }))
                                }
                              }}
                              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-secondary-700 capitalize">{flag}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Review Notes *
                      </label>
                      <textarea
                        value={reviewForm.notes}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows="4"
                        placeholder="Provide detailed notes about your decision..."
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setSelectedCompanyForReview(null)}
                        className="px-4 py-2 text-secondary-700 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`px-4 py-2 text-white rounded-lg transition-colors ${reviewForm.action === 'approve'
                          ? 'bg-green-600 hover:bg-green-700'
                          : reviewForm.action === 'reject'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-yellow-600 hover:bg-yellow-700'
                          }`}
                      >
                        {reviewForm.action === 'approve' ? 'Approve Company' :
                          reviewForm.action === 'reject' ? 'Reject Company' : 'Request Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Delete Company
                  </h3>
                  <p className="text-sm text-secondary-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-secondary-700">
                  Are you sure you want to delete <strong>{deleteConfirmModal.company?.name}</strong>?
                </p>
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This will permanently delete:
                  </p>
                  <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                    <li>The company and all its information</li>
                    <li>All deals associated with this company</li>
                    <li>All coupons associated with this company</li>
                    <li>The company logo (if uploaded)</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-secondary-700 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                  disabled={deleteCompanyMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteCompanyMutation.isPending}
                >
                  {deleteCompanyMutation.isPending ? 'Deleting...' : 'Delete Company'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompanyManagement
