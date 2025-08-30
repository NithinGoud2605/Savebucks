import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Container } from '../components/Layout/Container'
import { TagIcon, PhotoIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import AutoTagSuggestions from '../components/AutoTagging/TagSuggestions'

const PostDeal = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    price: '',
    original_price: '',
    description: '',
    company_id: '',
    category_id: '',
    deal_type: 'deal',
    coupon_code: '',
    coupon_type: '',
    discount_percentage: '',
    discount_amount: '',
    minimum_order_amount: '',
    maximum_discount_amount: '',
    terms_conditions: '',
    starts_at: '',
    expires_at: '',
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

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: api.createDeal,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      
      // Upload images if any
      if (images.length > 0) {
        api.uploadDealImages(data.id, images)
          .then(() => {
            navigate(`/deal/${data.id}`)
          })
          .catch((error) => {
            console.error('Error uploading images:', error)
            navigate(`/deal/${data.id}`)
          })
      } else {
        navigate(`/deal/${data.id}`)
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
    setImages(files.slice(0, 5)) // Limit to 5 images
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
    if (!formData.url.trim()) newErrors.url = 'URL is required'
    if (!formData.company_id) newErrors.company_id = 'Please select a company'
    
    // URL validation
    try {
      new URL(formData.url)
    } catch {
      newErrors.url = 'Please enter a valid URL'
    }

    // Price validation
    if (formData.price && formData.original_price) {
      if (parseFloat(formData.price) >= parseFloat(formData.original_price)) {
        newErrors.price = 'Sale price must be less than original price'
      }
    }

    // Date validation
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
    createDealMutation.mutate(formData)
  }

  const dealTypes = [
    { value: 'deal', label: 'Regular Deal' },
    { value: 'sale', label: 'Sale' },
    { value: 'clearance', label: 'Clearance' },
    { value: 'flash_sale', label: 'Flash Sale' },
    { value: 'bundle', label: 'Bundle Deal' },
    { value: 'cashback', label: 'Cashback Offer' }
  ]

  const couponTypes = [
    { value: '', label: 'No Coupon Required' },
    { value: 'percentage', label: 'Percentage Off' },
    { value: 'fixed_amount', label: 'Fixed Amount Off' },
    { value: 'free_shipping', label: 'Free Shipping' },
    { value: 'bogo', label: 'Buy One Get One' }
  ]

  return (
    <Container>
      <div className="py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Submit a Deal</h1>
          <p className="text-secondary-600">
            Share a great deal with the community and help others save money!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-6">Basic Information</h2>
            
            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Deal Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., 50% off Apple AirPods Pro"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.title ? 'border-red-300' : 'border-secondary-300'
                }`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Deal Type */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Deal Type
                </label>
                <select
                  name="deal_type"
                  value={formData.deal_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {dealTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Deal URL *
                </label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/product"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.url ? 'border-red-300' : 'border-secondary-300'
                  }`}
                />
                {errors.url && <p className="mt-1 text-sm text-red-600">{errors.url}</p>}
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
                placeholder="Describe this deal and why it's a good value..."
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Pricing Information */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-6">Pricing Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Price */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Current Price
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="99.99"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.price ? 'border-red-300' : 'border-secondary-300'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-secondary-500">$</span>
                  </div>
                </div>
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>

              {/* Original Price */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Original Price
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="original_price"
                    value={formData.original_price}
                    onChange={handleInputChange}
                    placeholder="199.99"
                    step="0.01"
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-secondary-500">$</span>
                  </div>
                </div>
              </div>

              {/* Calculated Discount */}
              {formData.price && formData.original_price && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Discount
                  </label>
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                    <span className="text-green-800 font-medium">
                      {Math.round(((formData.original_price - formData.price) / formData.original_price) * 100)}% OFF
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coupon Information */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-6">Coupon Information (Optional)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coupon Type */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Coupon Type
                </label>
                <select
                  name="coupon_type"
                  value={formData.coupon_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {couponTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Coupon Code */}
              {formData.coupon_type && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    name="coupon_code"
                    value={formData.coupon_code}
                    onChange={handleInputChange}
                    placeholder="SAVE20"
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}
            </div>

            {/* Discount Details */}
            {formData.coupon_type && formData.coupon_type !== 'free_shipping' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Discount Percentage/Amount */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    {formData.coupon_type === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name={formData.coupon_type === 'percentage' ? 'discount_percentage' : 'discount_amount'}
                      value={formData.coupon_type === 'percentage' ? formData.discount_percentage : formData.discount_amount}
                      onChange={handleInputChange}
                      placeholder={formData.coupon_type === 'percentage' ? '20' : '10'}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <span className="text-secondary-500">
                        {formData.coupon_type === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Minimum Order */}
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
              </div>
            )}
          </div>

          {/* Timing & Additional Details */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-6">Timing & Additional Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Terms & Conditions */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                name="terms_conditions"
                value={formData.terms_conditions}
                onChange={handleInputChange}
                rows={3}
                placeholder="Any restrictions or special conditions for this deal..."
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Auto-Tagging */}
            <div className="mt-6">
              <AutoTagSuggestions
                title={formData.title}
                description={formData.description}
                url={formData.url}
                selectedTags={formData.tags}
                onTagsChange={(tags) => setFormData({ ...formData, tags })}
                dealData={{
                  title: formData.title,
                  description: formData.description,
                  url: formData.url,
                  merchant: companies?.find(c => c.id === formData.company_id)?.name,
                  category: categories?.find(c => c.id === formData.category_id)?.name,
                  price: formData.price
                }}
              />
            </div>

            {/* Images */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Deal Images (Optional)
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-secondary-300 border-dashed rounded-lg cursor-pointer bg-secondary-50 hover:bg-secondary-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <PhotoIcon className="w-8 h-8 mb-2 text-secondary-400" />
                    <p className="mb-2 text-sm text-secondary-500">
                      <span className="font-semibold">Click to upload</span> deal images
                    </p>
                    <p className="text-xs text-secondary-500">PNG, JPG, WebP up to 10MB (Max 5 images)</p>
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
            <div className="mt-6 flex items-center">
              <input
                type="checkbox"
                name="is_exclusive"
                checked={formData.is_exclusive}
                onChange={handleInputChange}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <label className="ml-2 text-sm text-secondary-700">
                This is an exclusive deal
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-secondary-500">
              <InformationCircleIcon className="w-5 h-5 mr-2" />
              Your deal will be reviewed before being published
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Deal'}
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

export default PostDeal