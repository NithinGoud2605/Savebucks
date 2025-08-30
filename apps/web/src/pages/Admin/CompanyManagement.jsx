import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Skeleton } from '../../components/Loader/Skeleton'
import ImageUpload from '../../components/Upload/ImageUpload'
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  CheckBadgeIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

const CompanyManagement = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    website: '',
    category: '',
    is_verified: false
  })

  const queryClient = useQueryClient()

  // Fetch companies
  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.getCompanies({ limit: 100 })
  })

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: api.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setShowCreateModal(false)
      resetForm()
    }
  })

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setEditingCompany(null)
      resetForm()
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      website: '',
      category: '',
      is_verified: false
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (editingCompany) {
      updateCompanyMutation.mutate({ id: editingCompany.id, data: formData })
    } else {
      createCompanyMutation.mutate(formData)
    }
  }

  const startEdit = (company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name || '',
      slug: company.slug || '',
      description: company.description || '',
      website: company.website || '',
      category: company.category || '',
      is_verified: company.is_verified || false
    })
    setShowCreateModal(true)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">Company Management</h2>
          <p className="text-secondary-600 mt-1">
            Manage companies and merchants on the platform
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Company</span>
        </button>
      </div>

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
            {companies.map((company) => (
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
                          {company.category && (
                            <span>Category: {company.category}</span>
                          )}
                          <span>
                            Created: {new Date(company.created_at).toLocaleDateString()}
                          </span>
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
              {/* Basic Info */}
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
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
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

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

              {/* Logo Upload (for existing companies) */}
              {editingCompany && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Company Logo
                  </label>
                  <ImageUpload
                    entityType="company"
                    entityId={editingCompany.id}
                    maxFiles={1}
                    existingImages={editingCompany.logo_url ? [{ url: editingCompany.logo_url }] : []}
                    onUploadComplete={() => {
                      queryClient.invalidateQueries({ queryKey: ['companies'] })
                    }}
                    className="max-w-md"
                  />
                </div>
              )}

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
    </div>
  )
}

export default CompanyManagement
