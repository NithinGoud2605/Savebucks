import { toast } from './toast'

/**
 * Centralized error handling utilities for the SaveBucks application
 */

export class AppError extends Error {
  constructor(message, code, status) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
  }
}

/**
 * Handle API errors consistently across the application
 */
export function handleApiError(error, context = '') {
  console.error(`API Error ${context ? `in ${context}` : ''}:`, error)
  
  let message = 'Something went wrong. Please try again.'
  
  if (error instanceof AppError) {
    message = error.message
  } else if (error.status) {
    switch (error.status) {
      case 400:
        message = 'Invalid request. Please check your input.'
        break
      case 401:
        message = 'Please sign in to continue.'
        break
      case 403:
        message = 'You do not have permission to perform this action.'
        break
      case 404:
        message = 'The requested resource was not found.'
        break
      case 429:
        message = 'Too many requests. Please wait a moment and try again.'
        break
      case 500:
        message = 'Server error. Please try again later.'
        break
      default:
        message = `Request failed with status ${error.status}`
    }
  } else if (error.message) {
    message = error.message
  }
  
  toast.error(message)
  return message
}

/**
 * Async error boundary for handling promise rejections
 */
export function withErrorHandling(asyncFn, context = '') {
  return async (...args) => {
    try {
      return await asyncFn(...args)
    } catch (error) {
      handleApiError(error, context)
      throw error
    }
  }
}

/**
 * Retry mechanism for failed operations
 */
export async function withRetry(asyncFn, maxRetries = 3, delay = 1000) {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError
}

/**
 * Validate required fields
 */
export function validateRequired(data, fields) {
  const errors = {}
  
  fields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
    }
  })
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL format
 */
export function validateUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors) {
  return Object.entries(errors)
    .map(([field, message]) => message)
    .join(', ')
}
