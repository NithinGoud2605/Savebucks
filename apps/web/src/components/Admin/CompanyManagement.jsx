import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  GlobeAltIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import ImageUpload from '../Upload/ImageUpload'

const CompanyManagement = () => {
  const { user } = useAuth()
  const [pendingCompanies, setPendingCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [editingCompany, setEditingCompany] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  })

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    category_id: '',
    founded_year: '',
    employee_count: '',
    revenue_range: '',
    headquarters: '',
    contact_info: {
      phone: '',
      email: ''
    },
    social_media: {
      twitter: '',
      facebook: '',
      instagram: '',
      linkedin: ''
    },
    business_hours: {
      online: '',
      customer_service: ''
    },
    payment_methods: [],
    shipping_info: {
      free_shipping: '',
      standard: '',
      express: ''
    },
    return_policy: '',
    customer_service: '',
    mobile_app_url: '',
    app_store_rating: '',
    play_store_rating: '',
    trustpilot_rating: '',
    trustpilot_reviews_count: '',
    bbb_rating: '',
    rating: '',
    total_reviews: '',
    bbb_accreditation: false,
    certifications: [],
    awards: [],
    meta_title: '',
    meta_description: '',
    canonical_url: '',
    status: 'pending',
    priority: 'normal',
    review_notes: '',
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

  // Categories for the form
  const categories = [
    { id: 1, name: 'E-commerce', slug: 'ecommerce' },
    { id: 2, name: 'Technology', slug: 'technology' },
    { id: 3, name: 'Restaurant', slug: 'restaurant' },
    { id: 4, name: 'Travel', slug: 'travel' },
    { id: 5, name: 'Fashion', slug: 'fashion' },
    { id: 6, name: 'Health & Beauty', slug: 'health-beauty' },
    { id: 7, name: 'Home & Garden', slug: 'home-garden' },
    { id: 8, name: 'Automotive', slug: 'automotive' },
    { id: 9, name: 'Entertainment', slug: 'entertainment' },
    { id: 10, name: 'Education', slug: 'education' },
    { id: 11, name: 'Finance', slug: 'finance' },
    { id: 12, name: 'Sports & Fitness', slug: 'sports-fitness' },
    { id: 13, name: 'Pets', slug: 'pets' },
    { id: 14, name: 'Books & Media', slug: 'books-media' }
  ]

  // Payment methods options
  const paymentMethods = [
    'Credit Card', 'Debit Card', 'PayPal', 'Apple Pay', 'Google Pay', 
    'Bank Transfer', 'Cash', 'Check', 'Gift Card', 'Cryptocurrency'
  ]

  useEffect(() => {
    fetchPendingCompanies()
  }, [pagination.page])

  const fetchPendingCompanies = async () => {
    try {
      setIsLoading(true)
      const response = await api.getPendingCompanies({
        page: pagination.page,
        limit: pagination.limit
      })
      setPendingCompanies(response.companies || [])
      setPagination(response.pagination || pagination)
    } catch (err) {
      setError(err.message || 'Failed to fetch pending companies')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReview = async (companyId, action, notes = '') => {
    try {
      const updateData = {
        status: action,
        review_notes: notes,
        reviewed_by: user?.id || 'admin',
        reviewed_at: new Date().toISOString()
      }

      await api.updateCompany(companyId, updateData)
      
      // Remove the reviewed company from the list
      setPendingCompanies(prev => prev.filter(company => company.id !== companyId))
      
      // Refresh the list
      fetchPendingCompanies()
    } catch (err) {
      setError(err.message || 'Failed to review company')
    }
  }

  const handleViewCompany = async (slug) => {
    try {
      const company = await api.getCompanyForAdmin(slug)
      setSelectedCompany(company)
    } catch (err) {
      setError(err.message || 'Failed to fetch company details')
    }
  }

  const handleEditCompany = (company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name || '',
      description: company.description || '',
      website_url: company.website_url || '',
      category_id: company.category_id || company.category_info?.id || '',
      founded_year: company.founded_year || '',
      employee_count: company.employee_count || '',
      revenue_range: company.revenue_range || '',
      headquarters: company.headquarters || '',
      contact_info: {
        phone: company.contact_info?.phone || '',
        email: company.contact_info?.email || ''
      },
      social_media: {
        twitter: company.social_media?.twitter || '',
        facebook: company.social_media?.facebook || '',
        instagram: company.social_media?.instagram || '',
        linkedin: company.social_media?.linkedin || ''
      },
      business_hours: {
        online: company.business_hours?.online || '',
        customer_service: company.business_hours?.customer_service || ''
      },
      payment_methods: company.payment_methods || [],
      shipping_info: {
        free_shipping: company.shipping_info?.free_shipping || '',
        standard: company.shipping_info?.standard || '',
        express: company.shipping_info?.express || ''
      },
      return_policy: company.return_policy || '',
      customer_service: company.customer_service || '',
      mobile_app_url: company.mobile_app_url || '',
      app_store_rating: company.app_store_rating || '',
      play_store_rating: company.play_store_rating || '',
      trustpilot_rating: company.trustpilot_rating || '',
      trustpilot_reviews_count: company.trustpilot_reviews_count || '',
      bbb_rating: company.bbb_rating || '',
      rating: company.rating || '',
      total_reviews: company.total_reviews || '',
      bbb_accreditation: company.bbb_accreditation || false,
      certifications: company.certifications || [],
      awards: company.awards || [],
      meta_title: company.meta_title || '',
      meta_description: company.meta_description || '',
      canonical_url: company.canonical_url || '',
      status: company.status || 'pending',
      priority: company.priority || 'normal',
      review_notes: company.review_notes || '',
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
  }

  const handleArrayChange = (field, value, action = 'toggle') => {
    if (action === 'toggle') {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].includes(value)
          ? prev[field].filter(item => item !== value)
          : [...prev[field], value]
      }))
    } else if (action === 'add') {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value]
      }))
    } else if (action === 'remove') {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter(item => item !== value)
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      console.log('🚀 Submitting company update for ID:', editingCompany.id)
      console.log('📝 Form data:', formData)
      
      const updateData = {
        ...formData,
        reviewed_by: user?.id || 'admin',
        reviewed_at: new Date().toISOString()
      }

      console.log('📤 Sending update data:', updateData)
      
      const result = await api.updateCompanyAdmin(editingCompany.id, updateData)
      console.log('✅ Update successful:', result)
      
      // Refresh the company data
      if (selectedCompany?.id === editingCompany.id) {
        const updatedCompany = await api.getCompanyForAdmin(editingCompany.slug)
        setSelectedCompany(updatedCompany)
      }
      
      // Refresh the pending companies list
      await fetchPendingCompanies()
      
      setEditingCompany(null)
      setFormData({})
      
      // Show success message
      setError('') // Clear any previous errors
      setSuccessMessage('Company updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('❌ Update failed:', err)
      setError(err.message || 'Failed to update company')
      setSuccessMessage('') // Clear success message on error
    }
  }

  const closeModal = () => {
    setSelectedCompany(null)
    setEditingCompany(null)
    setFormData({})
    setError('')
    setSuccessMessage('')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading && pendingCompanies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BuildingOfficeIcon className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-secondary-900">
            Company Management
          </h1>
        </div>
        <div className="text-sm text-secondary-500">
          {pagination.total} pending companies
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircleIcon className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            <span className="text-green-700">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Companies List */}
      {pendingCompanies.length === 0 ? (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            No Pending Companies
          </h3>
          <p className="text-secondary-500">
            All company submissions have been reviewed.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {pendingCompanies.map((company) => (
                  <motion.tr
                    key={company.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-secondary-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {company.logo_url ? (
                          <img
                            src={company.logo_url}
                            alt={company.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-secondary-200 rounded-lg flex items-center justify-center">
                            <BuildingOfficeIcon className="w-6 h-6 text-secondary-500" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-secondary-900">
                            {company.name}
                          </div>
                          <div className="text-sm text-secondary-500">
                            {company.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {company.company_categories && (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${company.company_categories.color}20`,
                            color: company.company_categories.color
                          }}
                        >
                          {company.company_categories.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {company.profiles && (
                        <div className="flex items-center space-x-2">
                          {company.profiles.avatar_url ? (
                            <img
                              src={company.profiles.avatar_url}
                              alt={company.profiles.handle}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <UserIcon className="w-6 h-6 text-secondary-400" />
                          )}
                          <span className="text-sm text-secondary-900">
                            {company.profiles.handle}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {formatDate(company.submitted_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewCompany(company.slug)}
                          className="text-primary-600 hover:text-primary-900 p-1"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditCompany(company)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit Company"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReview(company.id, 'approved')}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Approve"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt('Rejection reason (optional):')
                            if (notes !== null) {
                              handleReview(company.id, 'rejected', notes)
                            }
                          }}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Reject"
                        >
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-secondary-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-secondary-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
            >
              Previous
            </button>
            <span className="text-sm text-secondary-700">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.total_pages}
              className="px-3 py-1 border border-secondary-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Company Details Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-secondary-900">
                  Company Details
                </h2>
                <button
                  onClick={closeModal}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex items-center space-x-4">
                  {selectedCompany.logo_url ? (
                    <img
                      src={selectedCompany.logo_url}
                      alt={selectedCompany.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-secondary-200 rounded-lg flex items-center justify-center">
                      <BuildingOfficeIcon className="w-8 h-8 text-secondary-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900">
                      {selectedCompany.name}
                    </h3>
                    <p className="text-secondary-500">{selectedCompany.slug}</p>
                    {selectedCompany.company_categories && (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1"
                        style={{
                          backgroundColor: `${selectedCompany.company_categories.color}20`,
                          color: selectedCompany.company_categories.color
                        }}
                      >
                        {selectedCompany.company_categories.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedCompany.description && (
                  <div>
                    <h4 className="text-sm font-medium text-secondary-700 mb-2">Description</h4>
                    <p className="text-secondary-900">{selectedCompany.description}</p>
                  </div>
                )}

                {/* Website */}
                {selectedCompany.website_url && (
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="w-5 h-5 text-secondary-400" />
                    <a
                      href={selectedCompany.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800"
                    >
                      {selectedCompany.website_url}
                    </a>
                  </div>
                )}

                {/* Headquarters */}
                {selectedCompany.headquarters && (
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="w-5 h-5 text-secondary-400" />
                    <span className="text-secondary-900">{selectedCompany.headquarters}</span>
                  </div>
                )}

                {/* Contact Info */}
                {selectedCompany.contact_info && Object.keys(selectedCompany.contact_info).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-secondary-700 mb-2">Contact Information</h4>
                    <div className="space-y-2">
                      {selectedCompany.contact_info.phone && (
                        <div className="text-secondary-900">
                          Phone: {selectedCompany.contact_info.phone}
                        </div>
                      )}
                      {selectedCompany.contact_info.email && (
                        <div className="text-secondary-900">
                          Email: {selectedCompany.contact_info.email}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submission Info */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-secondary-700 mb-2">Submission Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-secondary-500">Submitted by:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        {selectedCompany.profiles?.avatar_url ? (
                          <img
                            src={selectedCompany.profiles.avatar_url}
                            alt={selectedCompany.profiles.handle}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <UserIcon className="w-6 h-6 text-secondary-400" />
                        )}
                        <span className="text-secondary-900">{selectedCompany.profiles?.handle}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-secondary-500">Submitted:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <ClockIcon className="w-4 h-4 text-secondary-400" />
                        <span className="text-secondary-900">
                          {formatDate(selectedCompany.submitted_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-secondary-200">
                  <button
                    onClick={() => handleEditCompany(selectedCompany)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Company
                  </button>
                  <button
                    onClick={() => handleReview(selectedCompany.id, 'approved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve Company
                  </button>
                  <button
                    onClick={() => {
                      const notes = prompt('Rejection reason (optional):')
                      if (notes !== null) {
                        handleReview(selectedCompany.id, 'rejected', notes)
                        closeModal()
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject Company
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Company Edit Modal */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-secondary-900">
                  Edit Company: {editingCompany.name}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
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
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Website URL
                      </label>
                      <input
                        type="url"
                        name="website_url"
                        value={formData.website_url}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Founded Year
                      </label>
                      <input
                        type="number"
                        name="founded_year"
                        value={formData.founded_year}
                        onChange={handleInputChange}
                        min="1800"
                        max="2030"
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Company Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Employee Count
                      </label>
                      <input
                        type="text"
                        name="employee_count"
                        value={formData.employee_count}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 100-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Revenue Range
                      </label>
                      <input
                        type="text"
                        name="revenue_range"
                        value={formData.revenue_range}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., $1M-$10M"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Headquarters
                      </label>
                      <input
                        type="text"
                        name="headquarters"
                        value={formData.headquarters}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="City, State, Country"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="contact_info.phone"
                        value={formData.contact_info.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                        value={formData.contact_info.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>
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

                {/* Social Media */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Social Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Twitter
                      </label>
                      <input
                        type="url"
                        name="social_media.twitter"
                        value={formData.social_media.twitter}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://twitter.com/company"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Facebook
                      </label>
                      <input
                        type="url"
                        name="social_media.facebook"
                        value={formData.social_media.facebook}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://facebook.com/company"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Instagram
                      </label>
                      <input
                        type="url"
                        name="social_media.instagram"
                        value={formData.social_media.instagram}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://instagram.com/company"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        name="social_media.linkedin"
                        value={formData.social_media.linkedin}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://linkedin.com/company/company"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Payment Methods</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {paymentMethods.map(method => (
                      <label key={method} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.payment_methods.includes(method)}
                          onChange={() => handleArrayChange('payment_methods', method)}
                          className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-secondary-700">{method}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Company Logo Section */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Company Logo</h3>
                  
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Company Logo *
                    </label>
                    <ImageUpload
                      entityType="company"
                      entityId={editingCompany.id}
                      maxFiles={1}
                      existingImages={editingCompany.logo_url ? [{ url: editingCompany.logo_url }] : []}
                      onUploadComplete={() => {
                        // Refresh company data after upload
                        fetchPendingCompanies()
                      }}
                      className="max-w-md"
                    />
                  </div>

                </div>

                {/* Business Hours & Shipping */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Business Hours & Shipping</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Online Hours
                      </label>
                      <input
                        type="text"
                        name="business_hours.online"
                        value={formData.business_hours.online}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 24/7"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Customer Service Hours
                      </label>
                      <input
                        type="text"
                        name="business_hours.customer_service"
                        value={formData.business_hours.customer_service}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., Mon-Fri 9AM-6PM"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Free Shipping Policy
                      </label>
                      <input
                        type="text"
                        name="shipping_info.free_shipping"
                        value={formData.shipping_info.free_shipping}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., Orders over $50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Standard Shipping
                      </label>
                      <input
                        type="text"
                        name="shipping_info.standard"
                        value={formData.shipping_info.standard}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 3-5 business days"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Company Information */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Return Policy
                      </label>
                      <textarea
                        name="return_policy"
                        value={formData.return_policy}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 30-day return policy for most items"
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
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 24/7 customer support via phone, chat, and email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Mobile App URL
                      </label>
                      <input
                        type="url"
                        name="mobile_app_url"
                        value={formData.mobile_app_url}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://apps.apple.com/app/company"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        BBB Rating
                      </label>
                      <input
                        type="text"
                        name="bbb_rating"
                        value={formData.bbb_rating}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., A+"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        App Store Rating
                      </label>
                      <input
                        type="number"
                        name="app_store_rating"
                        value={formData.app_store_rating}
                        onChange={handleInputChange}
                        min="0"
                        max="5"
                        step="0.1"
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 4.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Play Store Rating
                      </label>
                      <input
                        type="number"
                        name="play_store_rating"
                        value={formData.play_store_rating}
                        onChange={handleInputChange}
                        min="0"
                        max="5"
                        step="0.1"
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 4.3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Trustpilot Rating
                      </label>
                      <input
                        type="number"
                        name="trustpilot_rating"
                        value={formData.trustpilot_rating}
                        onChange={handleInputChange}
                        min="0"
                        max="5"
                        step="0.1"
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 4.2"
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
                        min="0"
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 1250"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Overall Rating
                      </label>
                      <input
                        type="number"
                        name="rating"
                        value={formData.rating}
                        onChange={handleInputChange}
                        min="0"
                        max="5"
                        step="0.1"
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 4.4"
                      />
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
                        min="0"
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., 2500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="bbb_accreditation"
                          checked={formData.bbb_accreditation}
                          onChange={handleInputChange}
                          className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-secondary-700">
                          BBB Accredited Business
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* SEO & Metadata */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">SEO & Metadata</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        name="meta_title"
                        value={formData.meta_title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                        rows={3}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://example.com/canonical-page"
                      />
                    </div>
                  </div>
                </div>

                {/* Review Information */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Review Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="request_changes">Request Changes</option>
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
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Review Notes
                      </label>
                      <textarea
                        name="review_notes"
                        value={formData.review_notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Add any notes about this company..."
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-secondary-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Update Company
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default CompanyManagement
