import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BuildingOfficeIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'

const CompanySubmissionForm = ({ onCompanyCreated, onCancel }) => {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website_url: '',
    category_id: '',
    headquarters: '',
    contact_info: {
      phone: '',
      email: ''
    }
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await api.getCompanyCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('contact_info.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        contact_info: {
          ...prev.contact_info,
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.name || !formData.category_id) {
        throw new Error('Please fill in all required fields')
      }

      // Generate slug from company name
      const slug = generateSlug(formData.name)
      const submissionData = {
        ...formData,
        slug
      }

      const response = await api.createCompany(submissionData)
      
      setIsSuccess(true)
      setTimeout(() => {
        if (onCompanyCreated) {
          onCompanyCreated(response)
        }
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to create company')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
      >
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-green-900 mb-2">
          Company Submitted Successfully!
        </h3>
        <p className="text-green-700">
          Your company submission has been received and is pending admin approval. 
          You'll be notified once it's reviewed.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-secondary-200 p-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <BuildingOfficeIcon className="w-8 h-8 text-primary-600" />
        <h2 className="text-2xl font-bold text-secondary-900">
          Add New Company
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleNameChange}
            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter company name"
            required
          />
        </div>

        {/* Generated URL Display */}
        {formData.name && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Company URL
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-secondary-400 text-sm">
                savebucks.com/company/
              </span>
              <div className="w-full pl-32 pr-3 py-2 border border-secondary-300 rounded-lg bg-secondary-50 text-secondary-700">
                {generateSlug(formData.name)}
              </div>
            </div>
            <p className="text-xs text-secondary-500 mt-1">
              This URL will be automatically generated from your company name
            </p>
          </div>
        )}

        {/* Category */}
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-secondary-700 mb-2">
            Company Category *
          </label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-secondary-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Brief description of the company"
          />
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website_url" className="block text-sm font-medium text-secondary-700 mb-2">
            Website URL
          </label>
          <div className="relative">
            <GlobeAltIcon className="absolute left-3 top-2.5 w-5 h-5 text-secondary-400" />
            <input
              type="url"
              id="website_url"
              name="website_url"
              value={formData.website_url}
              onChange={handleInputChange}
              className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Headquarters */}
        <div>
          <label htmlFor="headquarters" className="block text-sm font-medium text-secondary-700 mb-2">
            Headquarters
          </label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-2.5 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              id="headquarters"
              name="headquarters"
              value={formData.headquarters}
              onChange={handleInputChange}
              className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="City, State, Country"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-secondary-900">Contact Information</h3>
          
          <div>
            <label htmlFor="contact_info.phone" className="block text-sm font-medium text-secondary-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-2.5 w-5 h-5 text-secondary-400" />
              <input
                type="tel"
                id="contact_info.phone"
                name="contact_info.phone"
                value={formData.contact_info.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact_info.email" className="block text-sm font-medium text-secondary-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-2.5 w-5 h-5 text-secondary-400" />
              <input
                type="email"
                id="contact_info.email"
                name="contact_info.email"
                value={formData.contact_info.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="contact@company.com"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Submitting...' : 'Submit Company'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your company submission will be reviewed by our admin team</li>
          <li>• Once approved, you can submit deals and coupons for this company</li>
          <li>• The company will appear in our directory for other users to find</li>
          <li>• You'll receive an email notification when the review is complete</li>
        </ul>
      </div>
    </motion.div>
  )
}

export default CompanySubmissionForm
