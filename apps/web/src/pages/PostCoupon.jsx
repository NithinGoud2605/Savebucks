import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Container } from '../components/Layout/Container'
import { TagIcon, PhotoIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

const PostCoupon = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
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
    is_exclusive: false
  })

  const [images, setImages] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch companies and categories
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.getCompanies({ limit: 1000 })
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories()
  })

  // Create coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: api.createCoupon,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      
      // Upload images if any
      if (images.length > 0) {
        api.uploadCouponImages(data.id, images)
          .then(() => {
            navigate(`/coupon/${data.id}`)
          })
          .catch((error) => {
            console.error('Error uploading images:', error)
            navigate(`/coupon/${data.id}`)
          })
      } else {
        navigate(`/coupon/${data.id}`)
      }
    },
    onError: (error) => {
      setErrors({ submit: error.message })
      setIsSubmitting(false)
    }
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setImages(files.slice(0, 3)) // Limit to 3 images
  }

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase()
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }))
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.coupon_code.trim()) newErrors.coupon_code = 'Coupon code is required'
    if (!formData.company_id) newErrors.company_id = 'Please select a company'
    if (!formData.coupon_type) newErrors.coupon_type = 'Please select a coupon type'
    
    if (formData.coupon_type !== 'free_shipping' && formData.coupon_type !== 'other') {
      if (!formData.discount_value) {
        newErrors.discount_value = 'Discount value is required'
      } else if (formData.coupon_type === 'percentage' && (formData.discount_value < 1 || formData.discount_value > 100)) {
        newErrors.discount_value = 'Percentage must be between 1 and 100'
      }
    }

    if (formData.expires_at && new Date(formData.expires_at) <= new Date()) {
      newErrors.expires_at = 'Expiration date must be in the future'
    }

    if (formData.starts_at && formData.expires_at && new Date(formData.starts_at) >= new Date(formData.expires_at)) {
      newErrors.starts_at = 'Start date must be before expiration date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      navigate('/signin')
      return
    }

    if (!validateForm()) return

    setIsSubmitting(true)
    createCouponMutation.mutate(formData)
  }

  const couponTypes = [
    { value: 'percentage', label: 'Percentage Off (e.g., 20% off)' },
    { value: 'fixed_amount', label: 'Fixed Amount Off (e.g., $10 off)' },
    { value: 'free_shipping', label: 'Free Shipping' },
    { value: 'bogo', label: 'Buy One Get One' },
    { value: 'other', label: 'Other' }
  ]

  return (
    <Container>
      <div className="py-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Submit a Coupon</h1>
          <p className="text-secondary-600">
            Share a great coupon with the community and help others save money!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Coupon Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., 20% off all electronics"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.title ? 'border-red-300' : 'border-secondary-300'
                  }`}
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Company *
                </label>
                <select
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.company_id ? 'border-red-300' : 'border-secondary-300'
                  }`}
                >
                  <option value="">Select a company</option>
                  {companies?.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name} {company.is_verified && '✓'}
                    </option>
                  ))}
                </select>
                {errors.company_id && <p className="mt-1 text-sm text-red-600">{errors.company_id}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Category
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a category</option>
                  {categories?.filter(cat => !cat.parent_id).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Coupon Code */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  name="coupon_code"
                  value={formData.coupon_code}
                  onChange={handleInputChange}
                  placeholder="e.g., SAVE20"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.coupon_code ? 'border-red-300' : 'border-secondary-300'
                  }`}
                />
                {errors.coupon_code && <p className="mt-1 text-sm text-red-600">{errors.coupon_code}</p>}
              </div>

              {/* Coupon Type */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Coupon Type *
                </label>
                <select
                  name="coupon_type"
                  value={formData.coupon_type}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.coupon_type ? 'border-red-300' : 'border-secondary-300'
                  }`}
                >
                  {couponTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.coupon_type && <p className="mt-1 text-sm text-red-600">{errors.coupon_type}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Describe what this coupon offers and any special conditions..."
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Discount Details */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Discount Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Discount Value */}
              {formData.coupon_type !== 'free_shipping' && formData.coupon_type !== 'other' && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Discount Value *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="discount_value"
                      value={formData.discount_value}
                      onChange={handleInputChange}
                      placeholder={formData.coupon_type === 'percentage' ? '20' : '10'}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.discount_value ? 'border-red-300' : 'border-secondary-300'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-secondary-500">
                        {formData.coupon_type === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                  </div>
                  {errors.discount_value && <p className="mt-1 text-sm text-red-600">{errors.discount_value}</p>}
                </div>
              )}

              {/* Minimum Order Amount */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Minimum Order Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="minimum_order_amount"
                    value={formData.minimum_order_amount}
                    onChange={handleInputChange}
                    placeholder="50"
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-secondary-500">$</span>
                  </div>
                </div>
              </div>

              {/* Maximum Discount Amount */}
              {formData.coupon_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Maximum Discount Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="maximum_discount_amount"
                      value={formData.maximum_discount_amount}
                      onChange={handleInputChange}
                      placeholder="100"
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-secondary-500">$</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Usage & Timing */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Usage & Timing</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Usage Limit */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Total Usage Limit
                </label>
                <input
                  type="number"
                  name="usage_limit"
                  value={formData.usage_limit}
                  onChange={handleInputChange}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-secondary-500">
                  Maximum number of times this coupon can be used by all users
                </p>
              </div>

              {/* Usage Limit Per User */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Usage Limit Per User
                </label>
                <input
                  type="number"
                  name="usage_limit_per_user"
                  value={formData.usage_limit_per_user}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  name="starts_at"
                  value={formData.starts_at}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.starts_at ? 'border-red-300' : 'border-secondary-300'
                  }`}
                />
                {errors.starts_at && <p className="mt-1 text-sm text-red-600">{errors.starts_at}</p>}
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Expiration Date
                </label>
                <input
                  type="datetime-local"
                  name="expires_at"
                  value={formData.expires_at}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.expires_at ? 'border-red-300' : 'border-secondary-300'
                  }`}
                />
                {errors.expires_at && <p className="mt-1 text-sm text-red-600">{errors.expires_at}</p>}
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Additional Details</h2>
            
            {/* Source URL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Where to Use This Coupon
              </label>
              <input
                type="url"
                name="source_url"
                value={formData.source_url}
                onChange={handleInputChange}
                placeholder="https://example.com/checkout"
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-secondary-500">
                URL where users can apply this coupon
              </p>
            </div>

            {/* Terms & Conditions */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                name="terms_conditions"
                value={formData.terms_conditions}
                onChange={handleInputChange}
                rows={4}
                placeholder="Any restrictions, limitations, or special conditions for this coupon..."
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    <TagIcon className="w-3 h-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Type a tag and press Enter"
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Images */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Images (Optional)
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-secondary-300 border-dashed rounded-lg cursor-pointer bg-secondary-50 hover:bg-secondary-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <PhotoIcon className="w-8 h-8 mb-2 text-secondary-400" />
                    <p className="mb-2 text-sm text-secondary-500">
                      <span className="font-semibold">Click to upload</span> coupon images
                    </p>
                    <p className="text-xs text-secondary-500">PNG, JPG, WebP up to 5MB (Max 3 images)</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              {images.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-secondary-600">
                    {images.length} image(s) selected
                  </p>
                </div>
              )}
            </div>

            {/* Exclusive */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_exclusive"
                checked={formData.is_exclusive}
                onChange={handleInputChange}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <label className="ml-2 text-sm text-secondary-700">
                This is an exclusive coupon
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-secondary-500">
              <InformationCircleIcon className="w-5 h-5 mr-2" />
              Your coupon will be reviewed before being published
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Coupon'}
            </button>
          </div>

          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{errors.submit}</p>
            </div>
          )}
        </form>
      </div>
    </Container>
  )
}

export default PostCoupon
