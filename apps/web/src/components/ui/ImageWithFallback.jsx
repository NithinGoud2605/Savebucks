import React, { useState } from 'react'
import { PhotoIcon } from '@heroicons/react/24/outline'

const ImageWithFallback = ({ 
  src, 
  alt, 
  className = '', 
  fallbackClassName = '',
  showPlaceholder = true,
  ...props 
}) => {
  const [imageError, setImageError] = useState(false)
  const [proxyError, setProxyError] = useState(false)

  const handleError = () => {
    if (!imageError) {
      // First error - try proxy
      setImageError(true)
    } else if (!proxyError) {
      // Second error - proxy failed, show placeholder
      setProxyError(true)
    }
  }

  const getImageSrc = () => {
    if (imageError && !proxyError) {
      return `/api/proxy/image?url=${encodeURIComponent(src)}`
    }
    return src
  }

  if (proxyError || !src) {
    if (showPlaceholder) {
      return (
        <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${fallbackClassName || className}`}>
          <div className="text-center">
            <PhotoIcon className="w-8 h-8 mx-auto mb-1" />
            <p className="text-xs">No image</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <img
      src={getImageSrc()}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  )
}

export default ImageWithFallback
