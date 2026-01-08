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

  const isValidImageUrl = (url) => {
    if (!url) return false;

    try {
      const urlObj = new URL(url);

      // Check for obviously invalid URLs
      if (urlObj.hostname === 'localhost' && !urlObj.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        return false;
      }

      // Check for non-image file extensions
      const pathname = urlObj.pathname.toLowerCase();
      if (pathname.match(/\.(html|htm|php|asp|aspx|jsp|js|css|txt|pdf|doc|docx)$/)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  const getImageSrc = () => {
    if (imageError && !proxyError && isValidImageUrl(src)) {
      return `/api/proxy/image?url=${encodeURIComponent(src)}`
    }
    return src
  }

  if (proxyError || !src || !isValidImageUrl(src)) {
    if (showPlaceholder) {
      return (
        <div className={`flex items-center justify-center bg-gray-50 text-gray-400 ${fallbackClassName || className}`}>
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

