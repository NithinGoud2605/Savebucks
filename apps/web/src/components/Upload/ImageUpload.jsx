import React, { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { api } from '../../lib/api'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

const ImageUpload = ({ 
  entityType, 
  entityId, 
  maxFiles = 5, 
  maxSize = 10 * 1024 * 1024, // 10MB
  onUploadComplete,
  onUploadError,
  existingImages = [],
  className = '',
  accept = 'image/*'
}) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [previewUrls, setPreviewUrls] = useState([])
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        onUploadError?.(`File ${file.name} is too large. Max size is ${formatFileSize(maxSize)}.`)
        return false
      }
      
      if (!file.type.startsWith('image/')) {
        onUploadError?.(`File ${file.name} is not a valid image.`)
        return false
      }
      
      return true
    }).slice(0, entityType === 'company' ? 1 : maxFiles - existingImages.length)

    if (validFiles.length !== files.length) {
      onUploadError?.('Some files were rejected due to size or type restrictions.')
    }

    setSelectedFiles(validFiles)
    
    // Create preview URLs
    const urls = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }))
    
    setPreviewUrls(urls)
  }

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newUrls = previewUrls.filter((_, i) => i !== index)
    
    // Revoke URL to free memory
    URL.revokeObjectURL(previewUrls[index].url)
    
    setSelectedFiles(newFiles)
    setPreviewUrls(newUrls)
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress({})

    try {
      console.log('🚀 Starting upload for entity:', entityType, 'ID:', entityId)
      console.log('📁 Files to upload:', selectedFiles.length)
      
      let uploadResult
      
      switch (entityType) {
        case 'deal':
          uploadResult = await api.uploadDealImages(entityId, selectedFiles)
          break
        case 'coupon':
          uploadResult = await api.uploadCouponImages(entityId, selectedFiles)
          break
        case 'company':
          console.log('🏢 Company upload - maxFiles:', maxFiles, 'files:', selectedFiles.length)
          // For company, we only upload logo images
          if (maxFiles === 1) {
            console.log('📤 Uploading company logo:', selectedFiles[0].name)
            uploadResult = await api.uploadCompanyLogo(entityId, selectedFiles[0])
          } else {
            throw new Error('Company uploads only support single file (logo) uploads')
          }
          break
        case 'profile':
          // For profile, we typically upload one avatar at a time
          uploadResult = await api.uploadAvatar(entityId, selectedFiles[0])
          break
        default:
          throw new Error('Unsupported entity type')
      }

      console.log('✅ Upload successful:', uploadResult)

      // Clear selections
      setSelectedFiles([])
      setPreviewUrls([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      onUploadComplete?.(uploadResult)
    } catch (error) {
      console.error('❌ Upload error:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        entityType,
        entityId,
        fileCount: selectedFiles.length
      })
      onUploadError?.(error.message || 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress({})
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // For company logos, always allow upload (replacement)
  const canUploadMore = entityType === 'company' ? true : existingImages.length + selectedFiles.length < maxFiles

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {canUploadMore && (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            multiple={maxFiles > 1}
            accept={accept}
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={uploading}
          />
          
          <div className={`
            flex flex-col items-center justify-center w-full h-32 
            border-2 border-dashed rounded-lg cursor-pointer
            transition-colors duration-200
            ${uploading 
              ? 'border-secondary-300 bg-secondary-50 cursor-not-allowed' 
              : 'border-secondary-300 bg-secondary-50 hover:bg-secondary-100 hover:border-primary-400'
            }
          `}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <PhotoIcon className={`w-8 h-8 mb-2 ${uploading ? 'text-secondary-400' : 'text-secondary-500'}`} />
              <p className="mb-2 text-sm text-secondary-500">
                <span className="font-semibold">
                  {entityType === 'company' && existingImages.length > 0 ? 'Click to replace logo' : 'Click to upload'}
                </span> or drag and drop
              </p>
              <p className="text-xs text-secondary-500">
                PNG, JPG, WebP, GIF up to {formatFileSize(maxSize)}
              </p>
              <p className="text-xs text-secondary-500">
                {entityType === 'company' ? 'Single file (replaces current logo)' : maxFiles > 1 ? `Max ${maxFiles} files` : 'Single file'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files Preview */}
      {previewUrls.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-secondary-900">Selected Files</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previewUrls.map((item, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-secondary-100 rounded-lg overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {!uploading && (
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
                
                <div className="mt-1 text-xs text-secondary-500 truncate">
                  {item.name}
                </div>
                <div className="text-xs text-secondary-400">
                  {formatFileSize(item.size)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Upload Button */}
          <div className="flex justify-end">
            <button
              onClick={uploadFiles}
              disabled={uploading || selectedFiles.length === 0}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
                ${uploading || selectedFiles.length === 0
                  ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
                }
              `}
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-secondary-900">Current Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-secondary-100 rounded-lg overflow-hidden">
                  <img
                    src={image.public_url || image.url}
                    alt={image.original_name || `Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-secondary-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
            <span className="text-sm text-secondary-600">Uploading images...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpload
