import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from '../../lib/toast'
import {
  XMarkIcon,
  PencilIcon,
  BuildingOfficeIcon,
  TagIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  PhotoIcon,
  LinkIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

export default function AdminEditModal({
  isOpen,
  onClose,
  item,
  type,
  onSuccess
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    price: '',
    original_price: '',
    merchant: '',
    company_id: '',
    company_name: '',
    company_website: '',
    category_id: '',
    quality_score: 0.65,
    deal_type: '',
    discount_percentage: '',
    discount_amount: '',
    coupon_code: '',
    expires_at: '',
    deal_images: [],
    featured_image: '',
    starts_at: '',
    stock_status: 'unknown',
    stock_quantity: '',
    is_featured: false,
    is_exclusive: false,
    terms_conditions: '',
    discount_value: '',
    discount_type: 'percentage',
    minimum_order_amount: '',
    maximum_discount_amount: '',
    usage_limit: '',
    new_image_url: '',
    new_featured_url: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [selectedTags, setSelectedTags] = useState([])
  const [tagSearch, setTagSearch] = useState('')
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const queryClient = useQueryClient()

  const isDeal = type === 'deals'
  const isCoupon = type === 'coupons'

  // Fetch companies and categories for dropdowns
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.getCompanies({ limit: 100 }),
    enabled: isOpen
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    enabled: isOpen
  })

  // Fetch available tags for tag management
  const { data: availableTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.getTags(),
    enabled: isOpen
  })

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && item) {
      setFormData(prev => ({
        ...prev,
        title: item.title || '',
        description: item.description || '',
        url: item.url || '',
        price: item.price || '',
        original_price: item.original_price || '',
        merchant: item.merchant || '',
        company_id: item.company_id || '',
        company_name: item.companies?.name || '',
        company_website: item.companies?.website_url || '',
        category_id: item.category_id || '',
        quality_score: item.quality_score ?? 0.65,
        deal_type: item.deal_type || '',
        discount_percentage: item.discount_percentage || '',
        discount_amount: item.discount_amount || '',
        coupon_code: item.coupon_code || '',
        expires_at: item.expires_at ? item.expires_at.split('T')[0] : '',
        deal_images: item.deal_images?.length > 0
          ? item.deal_images
          : (item.images?.length > 0
            ? item.images
            : (item.image_url ? [item.image_url] : [])),
        featured_image: item.featured_image || item.image_url || '',
        // Additional deal fields
        starts_at: item.starts_at ? item.starts_at.split('T')[0] : '',
        stock_status: item.stock_status || 'unknown',
        stock_quantity: item.stock_quantity || '',
        is_featured: item.is_featured || false,
        is_exclusive: item.is_exclusive || false,
        terms_conditions: item.terms_conditions || '',
        // Coupon specific fields
        discount_value: item.discount_value || '',
        discount_type: item.coupon_type || 'percentage',
        minimum_order_amount: item.minimum_order_amount || '',
        maximum_discount_amount: item.maximum_discount_amount || '',
        usage_limit: item.usage_limit || ''
      }))

      // Initialize selected tags - handle both direct tags array and nested deal_tags/coupon_tags structure
      let itemTags = []
      if (item.tags && Array.isArray(item.tags)) {
        // Direct tags array (if available)
        itemTags = item.tags
      } else if (item.deal_tags && Array.isArray(item.deal_tags)) {
        // Deal tags structure: [{ tag_id: 11, tags: { id: 11, name: "Beauty", slug: "beauty" } }]
        itemTags = item.deal_tags.map(dt => dt.tags).filter(Boolean)
      } else if (item.coupon_tags && Array.isArray(item.coupon_tags)) {
        // Coupon tags structure: [{ tag_id: 11, tags: { id: 11, name: "Beauty", slug: "beauty" } }]
        itemTags = item.coupon_tags.map(ct => ct.tags).filter(Boolean)
      }
      setSelectedTags(itemTags)
      setErrors({})
    }
  }, [isOpen, item])

  // Close tag dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTagDropdown && !event.target.closest('.tag-search-container')) {
        setShowTagDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTagDropdown])

  // Tag management functions
  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
    !selectedTags.some(selected => selected.id === tag.id)
  )

  const handleTagAdd = (tag) => {
    setSelectedTags(prev => [...prev, tag])
    setTagSearch('')
    setShowTagDropdown(false)
  }

  const handleTagRemove = (tagId) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId))
  }

  const handleCreateNewTag = () => {
    if (tagSearch.trim()) {
      const newTag = {
        id: `new-${Date.now()}`,
        name: tagSearch.trim(),
        slug: tagSearch.trim().toLowerCase().replace(/\s+/g, '-'),
        isNew: true
      }
      setSelectedTags(prev => [...prev, newTag])
      setTagSearch('')
      setShowTagDropdown(false)
    }
  }

  // File upload handler
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    // Validate file sizes and types
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 5MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Upload files one by one
    for (const file of validFiles) {
      try {
        const response = await api.uploadImage(file)
        if (response.success) {
          const currentImages = formData.deal_images || []
          handleInputChange('deal_images', [...currentImages, response.imageUrl])
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        alert(`Failed to upload ${file.name}: ${error.message}`)
      }
    }

    // Clear the input
    event.target.value = ''
  }

  // Featured image upload handler
  const handleFeaturedUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert(`${file.name} is not an image file`)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} is too large. Maximum size is 5MB`)
      return
    }

    try {
      const response = await api.uploadImage(file)
      if (response.success) {
        handleInputChange('featured_image', response.imageUrl)
      }
    } catch (error) {
      console.error('Error uploading featured image:', error)
      alert(`Failed to upload ${file.name}: ${error.message}`)
    }

    // Clear the input
    event.target.value = ''
  }

  const editMutation = useMutation({
    mutationFn: (updates) => {
      if (isDeal) {
        return api.editDeal(item.id, updates)
      } else {
        return api.editCoupon(item.id, updates)
      }
    },
    onSuccess: (data) => {
      toast.success(`${type.slice(0, -1)} updated successfully!`)
      queryClient.invalidateQueries({ queryKey: ['admin', type, 'pending'] })
      onSuccess?.(data)
      onClose()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update item')
      setErrors({ submit: error.message })
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      // Validate required fields
      const newErrors = {}

      if (!formData.title.trim()) {
        newErrors.title = 'Title is required'
      }

      if (isDeal && !formData.url.trim()) {
        newErrors.url = 'URL is required'
      }

      if (isCoupon && !formData.coupon_code.trim()) {
        newErrors.coupon_code = 'Coupon code is required'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setIsSubmitting(false)
        return
      }

      // Prepare update data
      const updates = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        url: formData.url.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        merchant: formData.merchant.trim() || null,
        company_id: formData.company_id || null,
        company_name: formData.company_name.trim() || null,
        company_website: formData.company_website.trim() || null,
        category_id: formData.category_id || null,
        quality_score: formData.quality_score !== undefined ? parseFloat(formData.quality_score) : null,
        deal_type: formData.deal_type || null,
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
        coupon_code: formData.coupon_code.trim() || null,
        expires_at: formData.expires_at || null,
        starts_at: formData.starts_at || null,
        deal_images: formData.deal_images || null,
        featured_image: formData.featured_image || null,
        stock_status: formData.stock_status || 'unknown',
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        is_featured: formData.is_featured || false,
        is_exclusive: formData.is_exclusive || false,
        terms_conditions: formData.terms_conditions.trim() || null,
        tags: selectedTags.map(tag => tag.isNew ? tag.name : tag.id)
      }

      // Add coupon-specific fields
      if (isCoupon) {
        updates.discount_value = formData.discount_value ? parseFloat(formData.discount_value) : null
        updates.coupon_type = formData.discount_type || 'percentage'
        updates.minimum_order_amount = formData.minimum_order_amount ? parseFloat(formData.minimum_order_amount) : null
        updates.maximum_discount_amount = formData.maximum_discount_amount ? parseFloat(formData.maximum_discount_amount) : null
        updates.usage_limit = formData.usage_limit ? parseInt(formData.usage_limit) : null
        updates.terms_conditions = formData.terms_conditions.trim() || null
      }

      const result = await editMutation.mutateAsync(updates)

      toast.success(`${type === 'deals' ? 'Deal' : 'Coupon'} updated successfully!`)
      onSuccess?.(result.deal || result.coupon)
      onClose()
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error(error.message || 'Failed to update item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <PencilIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Edit {isDeal ? 'Deal' : 'Coupon'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Enter title"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter description"
                />
              </div>

              {/* URL (Deals only) */}
              {isDeal && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    <LinkIcon className="w-4 h-4 inline mr-1" />
                    Deal URL *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.url ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="https://example.com/deal"
                  />
                  {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url}</p>}
                </div>
              )}

              {/* Coupon Code (Optional for Deals, Required for Coupons) */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Coupon Code {isCoupon && '*'}
                </label>
                <input
                  type="text"
                  value={formData.coupon_code}
                  onChange={(e) => handleInputChange('coupon_code', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${errors.coupon_code ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder={isCoupon ? "SAVE20" : "Optional Coupon Code"}
                />
                {errors.coupon_code && <p className="text-red-500 text-sm mt-1">{errors.coupon_code}</p>}
              </div>

              {/* Price (Deals) */}
              {isDeal && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="99.99"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Original Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.original_price}
                      onChange={(e) => handleInputChange('original_price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="199.99"
                    />
                  </div>
                </>
              )}

              {/* Discount Value (Coupons) */}
              {isCoupon && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => handleInputChange('discount_value', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Discount Type
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => handleInputChange('discount_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                </>
              )}

              {/* Company Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <BuildingOfficeIcon className="w-4 h-4 inline mr-1" />
                  Company
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <select
                      value={formData.company_id}
                      onChange={(e) => {
                        const selectedCompany = companies.find(c => c.id === parseInt(e.target.value))
                        handleInputChange('company_id', e.target.value)
                        if (selectedCompany) {
                          handleInputChange('company_name', selectedCompany.name)
                          handleInputChange('company_website', selectedCompany.website_url || '')
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="">Select existing company</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => {
                        handleInputChange('company_name', e.target.value)
                        handleInputChange('company_id', '') // Clear selection when typing new name
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Or enter new company name"
                    />
                  </div>
                </div>
                {formData.company_name && !formData.company_id && (
                  <div className="mt-2">
                    <input
                      type="url"
                      value={formData.company_website}
                      onChange={(e) => handleInputChange('company_website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Company website (optional)"
                    />
                  </div>
                )}
              </div>

              {/* Merchant (Deals) */}
              {isDeal && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Merchant
                  </label>
                  <input
                    type="text"
                    value={formData.merchant}
                    onChange={(e) => handleInputChange('merchant', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Store Name"
                  />
                </div>
              )}

              {/* Deal Type (Deals) */}
              {isDeal && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    <TagIcon className="w-4 h-4 inline mr-1" />
                    Deal Type
                  </label>
                  <select
                    value={formData.deal_type}
                    onChange={(e) => handleInputChange('deal_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="discount">Discount</option>
                    <option value="free_shipping">Free Shipping</option>
                    <option value="cashback">Cashback</option>
                    <option value="bogo">Buy One Get One</option>
                    <option value="clearance">Clearance</option>
                  </select>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  <TagIcon className="w-4 h-4 inline mr-1" />
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Quality Score */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Quality Score
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${(formData.quality_score || 0) >= 0.7 ? 'bg-green-100 text-green-800' :
                    (formData.quality_score || 0) >= 0.4 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                    {Math.round((formData.quality_score || 0) * 100)}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((formData.quality_score || 0.65) * 100)}
                  onChange={(e) => handleInputChange('quality_score', parseFloat(e.target.value) / 100)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low (0%)</span>
                  <span>Medium (50%)</span>
                  <span>High (100%)</span>
                </div>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Expires At
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => handleInputChange('expires_at', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Additional Deal Fields */}
              {isDeal && (
                <>
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CalendarIcon className="w-4 h-4 inline mr-1" />
                      Starts At
                    </label>
                    <input
                      type="date"
                      value={formData.starts_at}
                      onChange={(e) => handleInputChange('starts_at', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Stock Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Status
                    </label>
                    <select
                      value={formData.stock_status}
                      onChange={(e) => handleInputChange('stock_status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="unknown">Unknown</option>
                      <option value="in_stock">In Stock</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="100"
                      min="0"
                    />
                  </div>

                  {/* Featured & Exclusive */}
                  <div className="md:col-span-2">
                    <div className="flex space-x-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_featured}
                          onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Featured Deal</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_exclusive}
                          onChange={(e) => handleInputChange('is_exclusive', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Exclusive Deal</span>
                      </label>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terms & Conditions
                    </label>
                    <textarea
                      value={formData.terms_conditions}
                      onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter terms and conditions"
                    />
                  </div>
                </>
              )}

              {/* Additional Coupon Fields */}
              {isCoupon && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Order Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minimum_order_amount}
                      onChange={(e) => handleInputChange('minimum_order_amount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="50.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Discount Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.maximum_discount_amount}
                      onChange={(e) => handleInputChange('maximum_discount_amount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="100.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) => handleInputChange('usage_limit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="1000"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Terms & Conditions (Coupons) */}
            {isCoupon && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  value={formData.terms_conditions}
                  onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter terms and conditions"
                />
              </div>
            )}

            {/* Tag Management */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TagIcon className="w-4 h-4 inline mr-1" />
                Tags
              </label>

              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map(tag => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag.name}
                      {tag.isNew && <span className="ml-1 text-xs">(new)</span>}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag.id)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Tag Search */}
              <div className="relative tag-search-container">
                <div className="flex">
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => {
                      setTagSearch(e.target.value)
                      setShowTagDropdown(true)
                    }}
                    onFocus={() => setShowTagDropdown(true)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search or add tags..."
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewTag}
                    disabled={!tagSearch.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title="Create new tag"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Tag Dropdown */}
                {showTagDropdown && (tagSearch || filteredTags.length > 0) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredTags.length > 0 ? (
                      filteredTags.map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleTagAdd(tag)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>{tag.name}</span>
                          <span className="text-xs text-gray-500">#{tag.slug}</span>
                        </button>
                      ))
                    ) : tagSearch.trim() ? (
                      <div className="px-3 py-2 text-gray-500">
                        No matching tags found. Click + to create "{tagSearch.trim()}"
                      </div>
                    ) : (
                      <div className="px-3 py-2 text-gray-500">
                        Start typing to search tags...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Image Management */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PhotoIcon className="w-4 h-4 inline mr-1" />
                Images
              </label>

              {/* Current Images */}
              {(formData.deal_images?.length > 0 || formData.featured_image) && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Featured Image */}
                    {formData.featured_image && (
                      <div className="relative group">
                        <img
                          src={formData.featured_image}
                          alt="Featured"
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleInputChange('featured_image', '')}
                            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Remove featured image"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs p-1 rounded-b-lg text-center">
                          Featured
                        </div>
                      </div>
                    )}

                    {/* Deal Images */}
                    {formData.deal_images?.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Deal ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = [...(formData.deal_images || [])]
                                newImages.splice(index, 1)
                                handleInputChange('deal_images', newImages)
                              }}
                              className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              title="Remove image"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                            {!formData.featured_image && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleInputChange('featured_image', image)
                                  const newImages = [...(formData.deal_images || [])]
                                  newImages.splice(index, 1)
                                  handleInputChange('deal_images', newImages)
                                }}
                                className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
                                title="Set as featured"
                              >
                                ⭐
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Images */}
              <div className="space-y-3">
                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload images
                        </span>
                        <span className="mt-1 block text-sm text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </span>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="sr-only"
                      />
                    </div>
                  </div>
                </div>

                {/* URL Input */}
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={formData.new_image_url || ''}
                    onChange={(e) => handleInputChange('new_image_url', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Or add image URL..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newImageUrl = formData.new_image_url?.trim()
                      if (newImageUrl) {
                        try {
                          new URL(newImageUrl) // Validate URL
                          const currentImages = formData.deal_images || []
                          handleInputChange('deal_images', [...currentImages, newImageUrl])
                          handleInputChange('new_image_url', '')
                        } catch (error) {
                          alert('Please enter a valid URL')
                        }
                      }
                    }}
                    disabled={!formData.new_image_url?.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Featured Image Section */}
                {!formData.featured_image && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Set Featured Image</h4>

                    {/* Featured Image Upload */}
                    <div className="border-2 border-dashed border-green-300 rounded-lg p-3">
                      <div className="text-center">
                        <PhotoIcon className="mx-auto h-6 w-6 text-green-400" />
                        <div className="mt-1">
                          <label htmlFor="featured-upload" className="cursor-pointer">
                            <span className="text-sm font-medium text-green-700">
                              Upload featured image
                            </span>
                          </label>
                          <input
                            id="featured-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFeaturedUpload}
                            className="sr-only"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Featured Image URL Input */}
                    <div className="flex gap-3">
                      <input
                        type="url"
                        value={formData.new_featured_url || ''}
                        onChange={(e) => handleInputChange('new_featured_url', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Or add featured image URL..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFeaturedUrl = formData.new_featured_url?.trim()
                          if (newFeaturedUrl) {
                            try {
                              new URL(newFeaturedUrl) // Validate URL
                              handleInputChange('featured_image', newFeaturedUrl)
                              handleInputChange('new_featured_url', '')
                            } catch (error) {
                              alert('Please enter a valid URL')
                            }
                          }
                        }}
                        disabled={!formData.new_featured_url?.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title="Set as featured image"
                      >
                        ⭐
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
