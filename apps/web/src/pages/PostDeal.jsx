import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Container } from '../components/Layout/Container'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'
import { setPageMeta } from '../lib/head'

export default function PostDeal() {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    price: '',
    merchant: '',
    description: '',
    image_url: ''
  })
  const [errors, setErrors] = useState({})

  const queryClient = useQueryClient()
  const toast = useToast()

  React.useEffect(() => {
    setPageMeta({
      title: 'Post a Deal',
      description: 'Share a great deal with the SaveBucks community.',
    })
  }, [])

  const createDealMutation = useMutation({
    mutationFn: api.createDeal,
    onSuccess: () => {
      toast.success('Deal submitted successfully! It will be reviewed by moderators.')
      setFormData({
        title: '',
        url: '',
        price: '',
        merchant: '',
        description: '',
        image_url: ''
      })
      setErrors({})
      queryClient.invalidateQueries({ queryKey: ['deals'] })
    },
    onError: (error) => {
      toast.error('Failed to submit deal. Please try again.')
      console.error('Deal submission error:', error)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.url.trim()) newErrors.url = 'URL is required'
    
    // URL validation
    try {
      new URL(formData.url)
    } catch {
      newErrors.url = 'Please enter a valid URL'
    }

    // Price validation
    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Please enter a valid price'
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      // Check auth
      const user = localStorage.getItem('demo_user')
      if (!user) {
        toast.error('Please sign in to post deals')
        return
      }

      const dealData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
      }

      createDealMutation.mutate(dealData)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Post a Deal
          </h1>
          <p className="text-gray-600">
            Share a great deal with the community. All submissions are reviewed by moderators.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
              Deal Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`input ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="e.g., iPhone 15 Pro - $100 off at Amazon"
              required
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title}
              </p>
            )}
          </div>

          {/* URL */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-900 mb-2">
              Deal URL *
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className={`input ${errors.url ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="https://example.com/deal"
              required
            />
            {errors.url && (
              <p className="mt-1 text-sm text-red-600">
                {errors.url}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-900 mb-2">
                Price (USD)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={`input ${errors.price ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="19.99"
                step="0.01"
                min="0"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.price}
                </p>
              )}
            </div>

            {/* Merchant */}
            <div>
              <label htmlFor="merchant" className="block text-sm font-medium text-gray-900 mb-2">
                Store/Merchant
              </label>
              <input
                type="text"
                id="merchant"
                name="merchant"
                value={formData.merchant}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Amazon, Best Buy"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-900 mb-2">
              Product Image URL
            </label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="input"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="textarea"
              placeholder="Additional details about this deal..."
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              * Required fields
            </p>
            <button
              type="submit"
              disabled={createDealMutation.isPending}
              className="btn-primary disabled:opacity-50"
            >
              {createDealMutation.isPending ? 'Submitting...' : 'Submit Deal'}
            </button>
          </div>
        </form>
      </div>
    </Container>
  )
}
