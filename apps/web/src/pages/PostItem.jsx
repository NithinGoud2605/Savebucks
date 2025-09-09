import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { toast } from '../lib/toast'
import { Input, Textarea } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import KarmaIndicator from '../components/Submission/KarmaIndicator'

export default function PostItemOrCoupon() {
  const navigate = useNavigate()
  const { isAuthenticated, isInitialized } = useAuth()
  
  const [postType, setPostType] = useState('deal') // 'deal' or 'coupon'
  const [isSubmitting, setIsSubmitting] = useState(false)
  
                // Deal form data
              const [dealData, setDealData] = useState({
                title: '',
                url: '',
                price: '',
                merchant: '',
                description: '',
                image_url: '',
                category_id: '',
                company_id: '',
                deal_type: 'deal',
                original_price: '',
                discount_percentage: '',
                discount_amount: '',
                coupon_code: '',
                coupon_type: 'none',
                minimum_order_amount: '',
                maximum_discount_amount: '',
                terms_conditions: '',
                starts_at: '',
                expires_at: '',
                tags: '',
                is_featured: false,
                is_exclusive: false,
                stock_status: 'unknown',
                stock_quantity: '',
                showAdvanced: false
              })
  
  // Coupon form data
                const [couponData, setCouponData] = useState({
                title: '',
                description: '',
                coupon_code: '',
                coupon_type: 'percentage',
                discount_value: '',
                minimum_order_amount: '',
                maximum_discount_amount: '',
                company_id: '',
                category_id: '',
                terms_conditions: '',
                usage_limit: '',
                usage_limit_per_user: '1',
                starts_at: '',
                expires_at: '',
                source_url: '',
                tags: [],
                showAdvanced: false
              })
  
                const [errors, setErrors] = useState({})
              const [companies, setCompanies] = useState([])
              const [categories, setCategories] = useState([])
              
              // Image upload state
              const [dealImages, setDealImages] = useState([])
              const [couponImages, setCouponImages] = useState([])
              const [isUploading, setIsUploading] = useState(false)

  // Redirect to sign in if not authenticated (only after auth is initialized)
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/signin', { state: { from: '/post-item' } })
    }
  }, [isInitialized, isAuthenticated, navigate])

  // Fetch companies and categories for forms
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          if (postType === 'coupon') {
            const [companiesRes, categoriesRes] = await Promise.all([
              api.getCompanies({ limit: 100 }),
              api.getCategories()
            ])
            setCompanies(companiesRes || [])
            setCategories(categoriesRes || [])
          } else {
            // Fetch categories for deals too
            const categoriesRes = await api.getCategories()
            setCategories(categoriesRes || [])
          }
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
      fetchData()
    }
  }, [isAuthenticated, postType])

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target
    
    // Handle date inputs - convert date to ISO string for storage
    let processedValue = value
    if ((name === 'starts_at' || name === 'expires_at') && value) {
      // Convert date input (YYYY-MM-DD) to ISO string for storage
      processedValue = new Date(value + 'T00:00:00').toISOString()
    }
    
    if (formType === 'deal') {
      setDealData(prev => ({ ...prev, [name]: processedValue }))
    } else {
      setCouponData(prev => ({ ...prev, [name]: processedValue }))
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateDealForm = () => {
    const newErrors = {}
    
    if (!dealData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (dealData.title.trim().length < 6) {
      newErrors.title = 'Title must be at least 6 characters'
    } else if (dealData.title.trim().length > 160) {
      newErrors.title = 'Title must be less than 160 characters'
    }
    
    if (!dealData.url.trim()) {
      newErrors.url = 'URL is required'
    } else {
      try {
        new URL(dealData.url.trim())
      } catch {
        newErrors.url = 'Please enter a valid URL'
      }
    }
    
    if (dealData.price && dealData.price.trim()) {
      const price = parseFloat(dealData.price)
      if (isNaN(price) || price <= 0) {
        newErrors.price = 'Price must be a positive number'
      } else if (price > 100000) {
        newErrors.price = 'Price must be less than $100,000'
      }
    }
    
    if (dealData.merchant && dealData.merchant.trim()) {
      if (dealData.merchant.trim().length < 2) {
        newErrors.merchant = 'Merchant name must be at least 2 characters'
      } else if (dealData.merchant.trim().length > 80) {
        newErrors.merchant = 'Merchant name must be less than 80 characters'
      }
    }
    
    if (dealData.description && dealData.description.trim().length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters'
    }
    
    if (dealData.image_url && dealData.image_url.trim()) {
      try {
        new URL(dealData.image_url.trim())
      } catch {
        newErrors.image_url = 'Please enter a valid image URL'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateCouponForm = () => {
    const newErrors = {}
    
    if (!couponData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (couponData.title.trim().length < 6) {
      newErrors.title = 'Title must be at least 6 characters'
    }
    
    if (!couponData.coupon_code.trim()) {
      newErrors.coupon_code = 'Coupon code is required'
    }
    
    if (!couponData.company_id) {
      newErrors.company_id = 'Company is required'
    }
    
    if (couponData.discount_value && couponData.discount_value.trim()) {
      const value = parseFloat(couponData.discount_value)
      if (isNaN(value) || value <= 0) {
        newErrors.discount_value = 'Discount value must be a positive number'
      }
    }
    
    if (couponData.minimum_order_amount && couponData.minimum_order_amount.trim()) {
      const amount = parseFloat(couponData.minimum_order_amount)
      if (isNaN(amount) || amount < 0) {
        newErrors.minimum_order_amount = 'Minimum order amount must be a non-negative number'
      }
    }
    
    if (couponData.maximum_discount_amount && couponData.maximum_discount_amount.trim()) {
      const amount = parseFloat(couponData.maximum_discount_amount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.maximum_discount_amount = 'Maximum discount amount must be a positive number'
      }
    }
    
    if (couponData.usage_limit && couponData.usage_limit.trim()) {
      const limit = parseInt(couponData.usage_limit)
      if (isNaN(limit) || limit <= 0) {
        newErrors.usage_limit = 'Usage limit must be a positive number'
      }
    }
    
    if (couponData.usage_limit_per_user && couponData.usage_limit_per_user.trim()) {
      const limit = parseInt(couponData.usage_limit_per_user)
      if (isNaN(limit) || limit <= 0) {
        newErrors.usage_limit_per_user = 'Per-user usage limit must be a positive number'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleDealSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateDealForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const dealPayload = {
        title: dealData.title.trim(),
        url: dealData.url.trim(),
        price: dealData.price ? parseFloat(dealData.price) : null,
        merchant: dealData.merchant.trim() || null,
        description: dealData.description.trim() || null,
        image_url: dealData.image_url.trim() || null,
        category_id: dealData.category_id ? parseInt(dealData.category_id) : null,
        company_id: dealData.company_id ? parseInt(dealData.company_id) : null,
        deal_type: dealData.deal_type,
        original_price: dealData.original_price ? parseFloat(dealData.original_price) : null,
        discount_percentage: dealData.discount_percentage ? parseInt(dealData.discount_percentage) : null,
        discount_amount: dealData.discount_amount ? parseFloat(dealData.discount_amount) : null,
        coupon_code: dealData.coupon_code.trim() || null,
        coupon_type: dealData.coupon_type,
        minimum_order_amount: dealData.minimum_order_amount ? parseFloat(dealData.minimum_order_amount) : null,
        maximum_discount_amount: dealData.maximum_discount_amount ? parseFloat(dealData.maximum_discount_amount) : null,
        terms_conditions: dealData.terms_conditions.trim() || null,
        starts_at: dealData.starts_at || null,
        expires_at: dealData.expires_at || null,
        tags: dealData.tags ? dealData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : null,
        is_featured: dealData.is_featured,
        is_exclusive: dealData.is_exclusive,
        stock_status: dealData.stock_status,
        stock_quantity: dealData.stock_quantity ? parseInt(dealData.stock_quantity) : null,
      }
      
      const result = await api.createDeal(dealPayload)
      
      // Upload images if any
      if (dealImages.length > 0) {
        try {
          await uploadImages(result.id, 'deal')
        } catch (error) {
          console.error('Error uploading images:', error)
          toast.warning('Deal created but image upload failed')
        }
      }
      
      toast.success('Deal submitted successfully! It will be reviewed by moderators and appear on the site once approved.')
      
      // Reset form
      setDealData({
        title: '',
        url: '',
        price: '',
        merchant: '',
        description: '',
        image_url: '',
        category_id: '',
        company_id: '',
        deal_type: 'deal',
        original_price: '',
        discount_percentage: '',
        discount_amount: '',
        coupon_code: '',
        coupon_type: 'none',
        minimum_order_amount: '',
        maximum_discount_amount: '',
        terms_conditions: '',
        starts_at: '',
        expires_at: '',
        tags: '',
        is_featured: false,
        is_exclusive: false,
        stock_status: 'unknown',
        stock_quantity: '',
        showAdvanced: false
      })
      setDealImages([])
      
      // Navigate to home page with success notification
      navigate('/', { 
        state: { 
          message: 'Deal submitted successfully! It will be reviewed by moderators and appear on the site once approved.',
          type: 'success'
        }
      })
      
    } catch (error) {
      console.error('Error submitting deal:', error)
      toast.error(error.message || 'Failed to submit deal. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCouponSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateCouponForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const couponPayload = {
        title: couponData.title.trim(),
        description: couponData.description.trim() || null,
        coupon_code: couponData.coupon_code.trim().toUpperCase(),
        coupon_type: couponData.coupon_type,
        discount_value: couponData.discount_value ? parseFloat(couponData.discount_value) : null,
        minimum_order_amount: couponData.minimum_order_amount ? parseFloat(couponData.minimum_order_amount) : null,
        maximum_discount_amount: couponData.maximum_discount_amount ? parseFloat(couponData.maximum_discount_amount) : null,
        company_id: parseInt(couponData.company_id),
        category_id: couponData.category_id ? parseInt(couponData.category_id) : null,
        terms_conditions: couponData.terms_conditions.trim() || null,
        usage_limit: couponData.usage_limit ? parseInt(couponData.usage_limit) : null,
        usage_limit_per_user: parseInt(couponData.usage_limit_per_user),
        starts_at: couponData.starts_at || null,
        expires_at: couponData.expires_at || null,
        source_url: couponData.source_url.trim() || null,
        tags: couponData.tags,
        is_exclusive: false
      }
      
      const result = await api.createCoupon(couponPayload)
      
      // Upload images if any
      if (couponImages.length > 0) {
        try {
          await uploadImages(result.id, 'coupon')
        } catch (error) {
          console.error('Error uploading images:', error)
          toast.warning('Coupon created but image upload failed')
        }
      }
      
      toast.success('Coupon submitted successfully! It will be reviewed by moderators and appear on the site once approved.')
      
      // Reset form
      setCouponData({
        title: '',
        description: '',
        coupon_code: '',
        coupon_type: 'percentage',
        discount_value: '',
        minimum_order_amount: '',
        maximum_discount_amount: '',
        company_id: '',
        category_id: '',
        terms_conditions: '',
        usage_limit: '',
        usage_limit_per_user: '1',
        starts_at: '',
        expires_at: '',
        source_url: '',
        tags: [],
        showAdvanced: false
      })
      setCouponImages([])
      
      // Navigate to home page with success notification
      navigate('/', { 
        state: { 
          message: 'Coupon submitted successfully! It will be reviewed by moderators and appear on the site once approved.',
          type: 'success'
        }
      })
      
    } catch (error) {
      console.error('Error submitting coupon:', error)
      toast.error(error.message || 'Failed to submit coupon. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Image upload functions
  const handleImageUpload = (e, formType) => {
    const files = Array.from(e.target.files)
    const maxFiles = formType === 'deal' ? 5 : 3
    const maxSize = formType === 'deal' ? 10 : 5 // MB
    const currentImages = formType === 'deal' ? dealImages.length : couponImages.length
    
    if (currentImages + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed. You can add ${maxFiles - currentImages} more.`)
      return
    }
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size: ${maxSize}MB`)
        return false
      }
      
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image type`)
        return false
      }
      
      return true
    })
    
    if (formType === 'deal') {
      setDealImages(prev => [...prev, ...validFiles])
      if (validFiles.length > 0) {
        toast.success(`Added ${validFiles.length} image${validFiles.length !== 1 ? 's' : ''}`)
      }
    } else {
      setCouponImages(prev => [...prev, ...validFiles])
      if (validFiles.length > 0) {
        toast.success(`Added ${validFiles.length} image${validFiles.length !== 1 ? 's' : ''}`)
      }
    }
  }

  const removeImage = (index, formType) => {
    if (formType === 'deal') {
      setDealImages(prev => prev.filter((_, i) => i !== index))
    } else {
      setCouponImages(prev => prev.filter((_, i) => i !== index))
    }
  }

  const uploadImages = async (entityId, formType) => {
    if (formType === 'deal' && dealImages.length === 0) return
    if (formType === 'coupon' && couponImages.length === 0) return
    
    setIsUploading(true)
    try {
      if (formType === 'deal') {
        await api.uploadDealImages(entityId, dealImages)
        setDealImages([])
      } else {
        await api.uploadCouponImages(entityId, couponImages)
        setCouponImages([])
      }
      toast.success('Images uploaded successfully!')
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
    } finally {
      setIsUploading(false)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.setAttribute('data-dragover', 'true')
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.currentTarget.setAttribute('data-dragover', 'false')
  }

  const handleDrop = (e, formType) => {
    e.preventDefault()
    e.currentTarget.setAttribute('data-dragover', 'false')
    
    const files = Array.from(e.dataTransfer.files)
    const maxFiles = formType === 'deal' ? 5 : 3
    const maxSize = formType === 'deal' ? 10 : 5 // MB
    const currentImages = formType === 'deal' ? dealImages.length : couponImages.length
    
    if (currentImages + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed. You can add ${maxFiles - currentImages} more.`)
      return
    }
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size: ${maxSize}MB`)
        return false
      }
      
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image type`)
        return false
      }
      
      return true
    })
    
    if (formType === 'deal') {
      setDealImages(prev => [...prev, ...validFiles])
      if (validFiles.length > 0) {
        toast.success(`Added ${validFiles.length} image${validFiles.length !== 1 ? 's' : ''}`)
      }
    } else {
      setCouponImages(prev => [...prev, ...validFiles])
      if (validFiles.length > 0) {
        toast.success(`Added ${validFiles.length} image${validFiles.length !== 1 ? 's' : ''}`)
      }
    }
  }

  // Utility function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Helper function to format date for input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString
      }
      // If it's an ISO string, extract the date part
      if (dateString.includes('T')) {
        return dateString.split('T')[0]
      }
      // Try to parse as date and format
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().split('T')[0]
    } catch (error) {
      return ''
    }
  }

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-secondary-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Don't render the form if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-white py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-secondary-900 mb-3">
            Share with the Community
          </h1>
          <p className="text-base text-secondary-600 max-w-2xl mx-auto">
            Found a great deal or have a coupon to share? Help others save money!
          </p>
        </div>

        {/* Type Selection */}
        <div className="bg-white rounded-xl shadow-lg border border-secondary-200 p-4 mb-6">
          <div className="flex space-x-3">
            <button
              onClick={() => setPostType('deal')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                postType === 'deal'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              <Icon name="tag" size="sm" className="mx-auto mb-1" />
              Post a Deal
            </button>
            <button
              onClick={() => setPostType('coupon')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                postType === 'coupon'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              <Icon name="ticket" size="sm" className="mx-auto mb-1" />
              Share a Coupon
            </button>
          </div>
        </div>

        {/* Deal Form */}
        {postType === 'deal' && (
          <div className="bg-white rounded-xl shadow-lg border border-secondary-200 p-6">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 text-center">
              Share a Great Deal
            </h2>
            
            {/* Karma Points Indicator */}
            <KarmaIndicator 
              submissionType="deal" 
              formData={dealData}
              className="mb-6"
            />
            
            <form onSubmit={handleDealSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Input
                  label="Deal Title *"
                  name="title"
                  value={dealData.title}
                  onChange={(e) => handleInputChange(e, 'deal')}
                  placeholder="e.g., 50% Off Gaming Laptop - Limited Time!"
                  required
                  error={errors.title}
                  description="Make it descriptive and compelling (6-160 characters)"
                  leftIcon="tag"
                  size="sm"
                />
                
                <Input
                  label="Deal URL *"
                  name="url"
                  type="url"
                  value={dealData.url}
                  onChange={(e) => handleInputChange(e, 'deal')}
                  placeholder="https://example.com/deal-page"
                  required
                  error={errors.url}
                  description="Direct link to the deal page"
                  leftIcon="link"
                  size="sm"
                />
              </div>

              {/* Basic Pricing */}
              <Input
                label="Sale Price"
                name="price"
                type="number"
                value={dealData.price}
                onChange={(e) => handleInputChange(e, 'deal')}
                placeholder="99.99"
                error={errors.price}
                description="Current deal price (optional)"
                leftIcon="dollarSign"
                step="0.01"
                min="0"
                max="100000"
                size="sm"
              />

              {/* Advanced Details Toggle */}
              <div className="border-t border-secondary-200 pt-4">
                <button
                  type="button"
                  onClick={() => setDealData(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
                  className="flex items-center space-x-2 text-secondary-600 hover:text-secondary-800 transition-colors w-full text-left"
                >
                  <Icon 
                    name={dealData.showAdvanced ? "chevronDown" : "chevronRight"} 
                    size="sm" 
                    className="transition-transform duration-200"
                  />
                  <span className="font-medium">
                    {dealData.showAdvanced ? 'Hide Advanced Details' : 'Add More Details'} 
                    <span className="text-sm font-normal text-secondary-500 ml-2">
                      (optional fields for better deal visibility)
                    </span>
                  </span>
                </button>
                {!dealData.showAdvanced && (
                  <p className="text-sm text-secondary-500 mt-2 ml-6">
                    💡 Adding more details like pricing, timing, and restrictions helps users make better decisions
                  </p>
                )}
              </div>

              {/* Advanced Details Section */}
              {dealData.showAdvanced && (
                <div className="space-y-4 bg-gradient-to-br from-secondary-50 to-blue-50 rounded-xl p-4 border border-secondary-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center space-x-2 mb-4">
                    <Icon name="settings" size="sm" className="text-secondary-600" />
                    <h3 className="text-lg font-semibold text-secondary-800">Advanced Deal Information</h3>
                    <span className="text-xs bg-secondary-200 text-secondary-700 px-2 py-1 rounded-full">Optional</span>
                  </div>
                  
                  {/* Advanced Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Original Price"
                      name="original_price"
                      type="number"
                      value={dealData.original_price}
                      onChange={(e) => handleInputChange(e, 'deal')}
                      placeholder="199.99"
                      error={errors.original_price}
                      description="Original list price"
                      leftIcon="dollarSign"
                      step="0.01"
                      min="0"
                      max="100000"
                      size="sm"
                    />
                    
                    <Input
                      label="Discount %"
                      name="discount_percentage"
                      type="number"
                      value={dealData.discount_percentage}
                      onChange={(e) => handleInputChange(e, 'deal')}
                      placeholder="50"
                      error={errors.discount_percentage}
                      description="Discount percentage"
                      leftIcon="percent"
                      min="0"
                      max="100"
                      size="sm"
                    />
                  </div>

                  {/* Store and Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Merchant/Store"
                      name="merchant"
                      value={dealData.merchant}
                      onChange={(e) => handleInputChange(e, 'deal')}
                      placeholder="e.g., Amazon, Best Buy"
                      error={errors.merchant}
                      description="Store name"
                      leftIcon="store"
                      size="sm"
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Category</label>
                      <select 
                        name="category_id" 
                        value={dealData.category_id} 
                        onChange={(e) => handleInputChange(e, 'deal')}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-xl bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                      >
                        <option value="">Select a category (optional)</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Deal Type and Coupon Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Deal Type</label>
                      <select 
                        name="deal_type" 
                        value={dealData.deal_type} 
                        onChange={(e) => handleInputChange(e, 'deal')}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-xl bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                      >
                        <option value="deal">General Deal</option>
                        <option value="sale">Sale</option>
                        <option value="clearance">Clearance</option>
                        <option value="flash_sale">Flash Sale</option>
                        <option value="bundle">Bundle</option>
                        <option value="cashback">Cashback</option>
                      </select>
                    </div>
                    
                    <Input
                      label="Coupon Code"
                      name="coupon_code"
                      value={dealData.coupon_code}
                      onChange={(e) => handleInputChange(e, 'deal')}
                      placeholder="SAVE20"
                      error={errors.coupon_code}
                      description="Coupon code if applicable"
                      leftIcon="hash"
                      size="sm"
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Coupon Type</label>
                      <select 
                        name="coupon_type" 
                        value={dealData.coupon_type} 
                        onChange={(e) => handleInputChange(e, 'deal')}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-xl bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                      >
                        <option value="none">No Coupon</option>
                        <option value="code">Coupon Code</option>
                        <option value="automatic">Automatic</option>
                        <option value="cashback">Cashback</option>
                      </select>
                    </div>
                  </div>

                  {/* Timing and Restrictions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Start Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="starts_at"
                          value={formatDateForInput(dealData.starts_at)}
                          onChange={(e) => handleInputChange(e, 'deal')}
                          className="w-full px-4 py-2 border border-secondary-300 rounded-xl bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-sm"
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <Icon name="calendar" size="sm" className="absolute right-3 top-2.5 text-secondary-400" />
                      </div>
                      <p className="mt-1 text-xs text-secondary-500">When the deal becomes active (optional)</p>
                      {errors.starts_at && <p className="mt-1 text-sm text-danger-600">{errors.starts_at}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Expiration Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="expires_at"
                          value={formatDateForInput(dealData.expires_at)}
                          onChange={(e) => handleInputChange(e, 'deal')}
                          className="w-full px-4 py-2 border border-secondary-300 rounded-xl bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-sm"
                          min={formatDateForInput(dealData.starts_at) || new Date().toISOString().split('T')[0]}
                        />
                        <Icon name="calendar" size="sm" className="absolute right-3 top-2.5 text-secondary-400" />
                      </div>
                      <p className="mt-1 text-xs text-secondary-500">When the deal expires (optional)</p>
                      {errors.expires_at && <p className="mt-1 text-sm text-danger-600">{errors.expires_at}</p>}
                    </div>
                  </div>

                  {/* Stock and Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Stock Status</label>
                      <select 
                        name="stock_status" 
                        value={dealData.stock_status} 
                        onChange={(e) => handleInputChange(e, 'deal')}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-xl bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                      >
                        <option value="unknown">Unknown</option>
                        <option value="in_stock">In Stock</option>
                        <option value="low_stock">Low Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>
                    
                    <Input
                      label="Stock Quantity"
                      name="stock_quantity"
                      type="number"
                      value={dealData.stock_quantity}
                      onChange={(e) => handleInputChange(e, 'deal')}
                      placeholder="100"
                      error={errors.stock_quantity}
                      description="Available quantity"
                      leftIcon="package"
                      min="0"
                      size="sm"
                    />
                    
                  </div>

                  {/* Additional Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Tags"
                      name="tags"
                      value={dealData.tags}
                      onChange={(e) => handleInputChange(e, 'deal')}
                      placeholder="electronics, gaming, laptop"
                      error={errors.tags}
                      description="Comma-separated tags"
                      leftIcon="hash"
                      size="sm"
                    />
                    
                    <Input
                      label="Image URL (Alternative)"
                      name="image_url"
                      type="url"
                      value={dealData.image_url}
                      onChange={(e) => handleInputChange(e, 'deal')}
                      placeholder="https://example.com/image.jpg"
                      error={errors.image_url}
                      description="Direct link to product image"
                      leftIcon="image"
                      size="sm"
                    />
                  </div>

                  {/* Description */}
                  <Textarea
                    label="Description"
                    name="description"
                    value={dealData.description}
                    onChange={(e) => handleInputChange(e, 'deal')}
                    placeholder="Tell us more about this deal... What makes it special? Any important details or restrictions?"
                    error={errors.description}
                    description="Additional details about the deal (max 2000 characters)"
                    rows={3}
                    leftIcon="messageSquare"
                  />

                  {/* Terms and Conditions */}
                  <Textarea
                    label="Terms & Conditions"
                    name="terms_conditions"
                    value={dealData.terms_conditions}
                    onChange={(e) => handleInputChange(e, 'deal')}
                    placeholder="Any restrictions, exclusions, or special terms users should know..."
                    error={errors.terms_conditions}
                    description="Important terms and conditions (optional)"
                    rows={2}
                    leftIcon="fileText"
                  />
                </div>
              )}

              {/* Image Upload Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-secondary-700">Product Images</label>
                <div 
                  className="border-2 border-dashed border-secondary-300 rounded-xl p-6 text-center hover:border-primary-400 transition-all duration-200 data-[dragover=true]:border-primary-400 data-[dragover=true]:bg-primary-50"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'deal')}
                  data-dragover="false"
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'deal')}
                    className="hidden"
                    id="deal-image-upload"
                  />
                  <label htmlFor="deal-image-upload" className="cursor-pointer">
                    <Icon name="upload" size="lg" className="mx-auto mb-2 text-secondary-400" />
                    <p className="text-secondary-600 mb-1">Click to upload images or drag and drop</p>
                    <p className="text-sm text-secondary-500">Up to 5 images, max 10MB each (JPEG, PNG, WebP, GIF)</p>
                  </label>
                </div>
                
                              {/* Image Preview */}
              {dealImages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">
                      {dealImages.length} image{dealImages.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setDealImages([])}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {dealImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-secondary-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(index, 'deal')}
                            className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <Icon name="x" size="sm" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                          <div className="truncate">{file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name}</div>
                          <div className="text-xs opacity-75">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>



              {/* Submit Button */}
              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  size="md"
                  loading={isSubmitting || isUploading}
                  disabled={isSubmitting || isUploading}
                  className="min-w-[180px]"
                >
                  {isSubmitting ? 'Submitting...' : isUploading ? 'Uploading Images...' : 'Submit Deal'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Coupon Form */}
        {postType === 'coupon' && (
          <div className="bg-white rounded-xl shadow-lg border border-secondary-200 p-6">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 text-center">
              Share a Coupon
            </h2>
            
            {/* Karma Points Indicator */}
            <KarmaIndicator 
              submissionType="coupon" 
              formData={couponData}
              className="mb-6"
            />
            
            <form onSubmit={handleCouponSubmit} className="space-y-4">
              {/* Title Field */}
              <Input
                label="Coupon Title *"
                name="title"
                value={couponData.title}
                onChange={(e) => handleInputChange(e, 'coupon')}
                placeholder="e.g., 20% Off Everything - New Customers Only"
                required
                error={errors.title}
                description="Describe what the coupon offers"
                leftIcon="ticket"
                size="sm"
              />

              {/* Coupon Code and Type Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Coupon Code *"
                  name="coupon_code"
                  value={couponData.coupon_code}
                  onChange={(e) => handleInputChange(e, 'coupon')}
                  placeholder="SAVE20"
                  required
                  error={errors.coupon_code}
                  description="The actual coupon code users enter"
                  leftIcon="hash"
                  size="sm"
                />
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Coupon Type *
                  </label>
                  <select
                    name="coupon_type"
                    value={couponData.coupon_type}
                    onChange={(e) => handleInputChange(e, 'coupon')}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-sm"
                  >
                    <option value="percentage">Percentage Discount</option>
                    <option value="fixed_amount">Fixed Amount Off</option>
                    <option value="free_shipping">Free Shipping</option>
                    <option value="bogo">Buy One Get One</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Discount Value and Company Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Discount Value"
                  name="discount_value"
                  type="number"
                  value={couponData.discount_value}
                  onChange={(e) => handleInputChange(e, 'coupon')}
                  placeholder={couponData.coupon_type === 'percentage' ? '20' : '10.00'}
                  error={errors.discount_value}
                  description={couponData.coupon_type === 'percentage' ? 'Percentage (e.g., 20 for 20%)' : 'Fixed amount (e.g., 10.00 for $10 off)'}
                  leftIcon="percent"
                  step="0.01"
                  min="0"
                  size="sm"
                />
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Company/Store *
                  </label>
                  <select
                    name="company_id"
                    value={couponData.company_id}
                    onChange={(e) => handleInputChange(e, 'coupon')}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-sm"
                    required
                  >
                    <option value="">Select a company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  {errors.company_id && (
                    <p className="mt-1 text-sm text-danger-600">{errors.company_id}</p>
                  )}
                </div>
              </div>

              {/* Advanced Details Toggle */}
              <div className="border-t border-secondary-200 pt-4">
                <button
                  type="button"
                  onClick={() => setCouponData(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
                  className="flex items-center space-x-2 text-secondary-600 hover:text-secondary-800 transition-colors w-full text-left"
                >
                  <Icon 
                    name={couponData.showAdvanced ? "chevronDown" : "chevronRight"} 
                    size="sm" 
                    className="transition-transform duration-200"
                  />
                  <span className="font-medium">
                    {couponData.showAdvanced ? 'Hide Advanced Details' : 'Add More Details'} 
                    <span className="text-sm font-normal text-secondary-500 ml-2">
                      (optional fields for better coupon visibility)
                    </span>
                  </span>
                </button>
                {!couponData.showAdvanced && (
                  <p className="text-sm text-secondary-500 mt-2 ml-6">
                    💡 Adding more details like restrictions, timing, and usage limits helps users understand the coupon better
                  </p>
                )}
              </div>

              {/* Advanced Details Section */}
              {couponData.showAdvanced && (
                <div className="space-y-4 bg-gradient-to-br from-secondary-50 to-blue-50 rounded-xl p-4 border border-secondary-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center space-x-2 mb-4">
                    <Icon name="settings" size="sm" className="text-secondary-600" />
                    <h3 className="text-lg font-semibold text-secondary-800">Advanced Coupon Information</h3>
                    <span className="text-xs bg-secondary-200 text-secondary-700 px-2 py-1 rounded-full">Optional</span>
                  </div>

              {/* Minimum Order and Max Discount Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Minimum Order Amount"
                  name="minimum_order_amount"
                  type="number"
                  value={couponData.minimum_order_amount}
                  onChange={(e) => handleInputChange(e, 'coupon')}
                  placeholder="50.00"
                  error={errors.minimum_order_amount}
                  description="Minimum purchase required (optional)"
                  leftIcon="dollarSign"
                  step="0.01"
                  min="0"
                  size="sm"
                />
                
                <Input
                  label="Maximum Discount Amount"
                  name="maximum_discount_amount"
                  type="number"
                  value={couponData.maximum_discount_amount}
                  onChange={(e) => handleInputChange(e, 'coupon')}
                  placeholder="25.00"
                  error={errors.maximum_discount_amount}
                  description="Maximum discount allowed (optional)"
                  leftIcon="dollarSign"
                  step="0.01"
                  min="0"
                  size="sm"
                />
              </div>

              {/* Usage Limits Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Total Usage Limit"
                  name="usage_limit"
                  type="number"
                  value={couponData.usage_limit}
                  onChange={(e) => handleInputChange(e, 'coupon')}
                  placeholder="1000"
                  error={errors.usage_limit}
                  description="How many times this coupon can be used total (optional)"
                  leftIcon="users"
                  min="1"
                  size="sm"
                />
                
                <Input
                  label="Per-User Usage Limit"
                  name="usage_limit_per_user"
                  type="number"
                  value={couponData.usage_limit_per_user}
                  onChange={(e) => handleInputChange(e, 'coupon')}
                  placeholder="1"
                  error={errors.usage_limit_per_user}
                  description="How many times each user can use this coupon"
                  leftIcon="user"
                  min="1"
                  size="sm"
                />
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="starts_at"
                      value={formatDateForInput(couponData.starts_at)}
                      onChange={(e) => handleInputChange(e, 'coupon')}
                      className="w-full px-4 py-2 border border-secondary-300 rounded-xl bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-sm"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Icon name="calendar" size="sm" className="absolute right-3 top-2.5 text-secondary-400" />
                  </div>
                  <p className="mt-1 text-xs text-secondary-500">When the coupon becomes valid (optional)</p>
                  {errors.starts_at && <p className="mt-1 text-sm text-danger-600">{errors.starts_at}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Expiration Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="expires_at"
                      value={formatDateForInput(couponData.expires_at)}
                      onChange={(e) => handleInputChange(e, 'coupon')}
                      className="w-full px-4 py-2 border border-secondary-300 rounded-xl bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-sm"
                      min={formatDateForInput(couponData.starts_at) || new Date().toISOString().split('T')[0]}
                    />
                    <Icon name="calendar" size="sm" className="absolute right-3 top-2.5 text-secondary-400" />
                  </div>
                  <p className="mt-1 text-xs text-secondary-500">When the coupon expires (optional)</p>
                  {errors.expires_at && <p className="mt-1 text-sm text-danger-600">{errors.expires_at}</p>}
                </div>
              </div>

              {/* Source URL and Category Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Source URL"
                  name="source_url"
                  type="url"
                  value={couponData.source_url}
                  onChange={(e) => handleInputChange(e, 'coupon')}
                  placeholder="https://example.com/coupon-page"
                  error={errors.source_url}
                  description="Where users can find/use this coupon (optional)"
                  leftIcon="link"
                  size="sm"
                />
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category_id"
                    value={couponData.category_id}
                    onChange={(e) => handleInputChange(e, 'coupon')}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg bg-white text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-sm"
                  >
                    <option value="">Select a category (optional)</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description and Terms Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                  label="Description"
                  name="description"
                  value={couponData.description}
                  onChange={(e) => handleInputChange(e, 'coupon')}
                  placeholder="Describe what this coupon offers and any important details..."
                  error={errors.description}
                  description="Additional details about the coupon (optional)"
                  rows={2}
                  leftIcon="messageSquare"
                />
                
                <Textarea
                  label="Terms & Conditions"
                  name="terms_conditions"
                  value={couponData.terms_conditions}
                  onChange={(e) => handleInputChange(e, 'coupon')}
                  placeholder="Any restrictions, exclusions, or special terms..."
                  error={errors.terms_conditions}
                  description="Important terms users should know (optional)"
                  rows={2}
                  leftIcon="fileText"
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-secondary-700">Coupon Images</label>
                <div 
                  className="border-2 border-dashed border-secondary-300 rounded-xl p-6 text-center hover:border-primary-400 transition-all duration-200 data-[dragover=true]:border-primary-400 data-[dragover=true]:bg-primary-50"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'coupon')}
                  data-dragover="false"
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'coupon')}
                    className="hidden"
                    id="coupon-image-upload"
                  />
                  <label htmlFor="coupon-image-upload" className="cursor-pointer">
                    <Icon name="upload" size="lg" className="mx-auto mb-2 text-secondary-400" />
                    <p className="text-secondary-600 mb-1">Click to upload images or drag and drop</p>
                    <p className="text-sm text-secondary-500">Up to 3 images, max 5MB each (JPEG, PNG, WebP, GIF)</p>
                  </label>
                </div>
                
                {/* Image Preview */}
                {couponImages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-600">
                        {couponImages.length} image{couponImages.length !== 1 ? 's' : ''} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => setCouponImages([])}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {couponImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-secondary-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeImage(index, 'coupon')}
                              className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <Icon name="x" size="sm" />
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                            <div className="truncate">{file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name}</div>
                            <div className="text-xs opacity-75">{formatFileSize(file.size)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  size="md"
                  loading={isSubmitting || isUploading}
                  disabled={isSubmitting || isUploading}
                  className="min-w-[180px]"
                >
                  {isSubmitting ? 'Submitting...' : isUploading ? 'Uploading Images...' : 'Submit Coupon'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-6 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-200">
          <h3 className="text-base font-semibold text-primary-900 mb-3 flex items-center">
            <Icon name="lightbulb" size="sm" className="mr-2" />
            Tips for Better {postType === 'deal' ? 'Deals' : 'Coupons'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-primary-800">
            {postType === 'deal' ? (
              <>
                <div>
                  <p className="font-medium mb-1">✓ Write clear, descriptive titles</p>
                  <p className="text-primary-700 text-xs">Include key details like brand, discount amount, and urgency</p>
                </div>
                <div>
                  <p className="font-medium mb-1">✓ Use direct product links</p>
                  <p className="text-primary-700 text-xs">Avoid affiliate or tracking links when possible</p>
                </div>
                <div>
                  <p className="font-medium mb-1">✓ Add high-quality images</p>
                  <p className="text-primary-700 text-xs">Clear product photos help users understand the deal</p>
                </div>
                <div>
                  <p className="font-medium mb-1">✓ Provide helpful descriptions</p>
                  <p className="text-primary-700 text-xs">Include important details like expiration dates or restrictions</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="font-medium mb-1">✓ Verify coupon codes work</p>
                  <p className="text-primary-700 text-xs">Test the coupon before sharing to ensure it's valid</p>
                </div>
                <div>
                  <p className="font-medium mb-1">✓ Include all restrictions</p>
                  <p className="text-primary-700 text-xs">Mention minimum orders, exclusions, and expiration dates</p>
                </div>
                <div>
                  <p className="font-medium mb-1">✓ Be specific about savings</p>
                  <p className="text-primary-700 text-xs">Clearly state the discount amount or percentage</p>
                </div>
                <div>
                  <p className="font-medium mb-1">✓ Provide source information</p>
                  <p className="text-primary-700 text-xs">Include where users can find and use the coupon</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
