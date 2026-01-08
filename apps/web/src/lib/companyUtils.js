/**
 * Utility functions for handling company data in deals
 */

/**
 * Get the company name from a deal object
 * Prioritizes the companies relationship, falls back to merchant field
 * @param {Object} deal - The deal object
 * @returns {string} - The company name
 */
export function getCompanyName(deal) {
  // First priority: company name from companies relationship
  if (deal?.companies?.name) {
    return deal.companies.name
  }
  
  // Second priority: merchant field (legacy support)
  if (deal?.merchant) {
    return deal.merchant
  }
  
  // Fallback
  return 'Company'
}

/**
 * Get the company slug from a deal object
 * Used for linking to company pages
 * @param {Object} deal - The deal object
 * @returns {string|null} - The company slug or null
 */
export function getCompanySlug(deal) {
  // First priority: company slug from companies relationship
  if (deal?.companies?.slug) {
    return deal.companies.slug
  }
  
  // Second priority: generate slug from merchant name
  if (deal?.merchant) {
    return deal.merchant.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-')
  }
  
  return null
}

/**
 * Get the company logo URL from a deal object
 * @param {Object} deal - The deal object
 * @returns {string|null} - The company logo URL or null
 */
export function getCompanyLogo(deal) {
  // First priority: company logo from companies relationship
  if (deal?.companies?.logo_url) {
    return deal.companies.logo_url
  }
  
  return null
}

/**
 * Check if a deal has company information
 * @param {Object} deal - The deal object
 * @returns {boolean} - True if deal has company info
 */
export function hasCompanyInfo(deal) {
  return !!(deal?.companies?.name || deal?.merchant)
}

/**
 * Get company link URL for a deal
 * @param {Object} deal - The deal object
 * @returns {string} - The company page URL
 */
export function getCompanyLink(deal) {
  const slug = getCompanySlug(deal)
  return slug ? `/company/${slug}` : '#'
}














