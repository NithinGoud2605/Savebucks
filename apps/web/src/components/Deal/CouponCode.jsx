import React, { useState } from 'react'
import { toast } from '../../lib/toast.js'

export function CouponCode({ 
  code, 
  type = 'code', 
  dealUrl, 
  merchant,
  discount,
  expiresAt,
  className = '',
  size = 'default' // 'small', 'default', 'large'
}) {
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success(`Coupon code "${code}" copied to clipboard!`)
      
      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000)
      
      // Track coupon usage
      if (window.gtag) {
        window.gtag('event', 'coupon_copy', {
          coupon_code: code,
          merchant: merchant
        })
      }
    } catch (error) {
      toast.error('Failed to copy coupon code')
    }
  }

  const handleRevealCode = () => {
    setRevealed(true)
    
    // Track coupon reveal
    if (window.gtag) {
      window.gtag('event', 'coupon_reveal', {
        coupon_code: code,
        merchant: merchant
      })
    }
  }

  const handleGoToStore = () => {
    if (dealUrl) {
      // Track click
      if (window.gtag) {
        window.gtag('event', 'coupon_click', {
          coupon_code: code,
          merchant: merchant,
          deal_url: dealUrl
        })
      }
      
      window.open(dealUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Automatic coupon (no code needed)
  if (type === 'automatic') {
    return (
      <div className={`bg-success-50 border border-success-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-success-800">
                Automatic Discount
              </div>
              <div className="text-xs text-success-600">
                {discount ? `${discount}% off` : 'Discount applied at checkout'}
              </div>
            </div>
          </div>
          <button
            onClick={handleGoToStore}
            className="btn btn-success text-sm px-4 py-2"
          >
            Shop Now
          </button>
        </div>
      </div>
    )
  }

  // Cashback offer
  if (type === 'cashback') {
    return (
      <div className={`bg-purple-50 border border-purple-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-purple-800">
                Cashback Offer
              </div>
              <div className="text-xs text-purple-600">
                {discount ? `${discount}% cashback` : 'Earn cashback on your purchase'}
              </div>
            </div>
          </div>
          <button
            onClick={handleGoToStore}
            className="btn text-sm px-4 py-2 bg-purple-600 text-white hover:bg-purple-700"
          >
            Earn Cashback
          </button>
        </div>
      </div>
    )
  }

  // Regular coupon code
  const sizeClasses = {
    small: 'p-2 text-xs',
    default: 'p-3 text-sm',
    large: 'p-4 text-base'
  }

  const buttonSizeClasses = {
    small: 'text-xs px-3 py-1',
    default: 'text-sm px-4 py-2',
    large: 'text-base px-6 py-3'
  }

  return (
    <div className={`bg-primary-50 border border-primary-200 rounded-lg ${sizeClasses[size]} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Coupon Icon */}
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 011-1V5a2 2 0 00-2-2H5zM5 14H4a1 1 0 00-1 1v3a2 2 0 002 2h1V14z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            {/* Coupon Code */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-primary-600 uppercase tracking-wide">
                Coupon Code
              </span>
              {discount && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                  {discount}% OFF
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-1">
              {!revealed ? (
                <button
                  onClick={handleRevealCode}
                  className="font-mono text-lg font-bold text-primary-800 bg-primary-100 px-3 py-1 rounded border-2 border-dashed border-primary-300 hover:bg-primary-200 transition-colors"
                >
                  Click to Reveal
                </button>
              ) : (
                <div className="font-mono text-lg font-bold text-primary-800 bg-white px-3 py-1 rounded border-2 border-primary-300 select-all">
                  {code}
                </div>
              )}
            </div>

            {/* Expiration */}
            {expiresAt && (
              <div className="text-xs text-primary-600 mt-1">
                Expires: {new Date(expiresAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-3">
          {revealed && (
            <button
              onClick={handleCopyCode}
              disabled={copied}
              className={`btn ${buttonSizeClasses[size]} ${
                copied 
                  ? 'bg-success-600 text-white' 
                  : 'btn-primary'
              } transition-colors`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          )}
          
          <button
            onClick={handleGoToStore}
            className={`btn btn-secondary ${buttonSizeClasses[size]}`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Shop Now
          </button>
        </div>
      </div>

      {/* Instructions */}
      {revealed && (
        <div className="mt-3 pt-3 border-t border-primary-200">
          <div className="text-xs text-primary-600">
            <strong>How to use:</strong> Copy the code above, click "Shop Now", and paste it at checkout to save {discount ? `${discount}%` : 'money'}!
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for deal cards
export function CompactCouponCode({ code, type, discount, className = '' }) {
  if (!code && type !== 'automatic' && type !== 'cashback') return null

  if (type === 'automatic') {
    return (
      <div className={`inline-flex items-center px-2 py-1 bg-success-100 text-success-800 text-xs font-medium rounded ${className}`}>
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Auto Discount
      </div>
    )
  }

  if (type === 'cashback') {
    return (
      <div className={`inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded ${className}`}>
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        {discount ? `${discount}% Cashback` : 'Cashback'}
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded ${className}`}>
      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 011-1V5a2 2 0 00-2-2H5zM5 14H4a1 1 0 00-1 1v3a2 2 0 002 2h1V14z" />
      </svg>
      Coupon: {code}
    </div>
  )
}

