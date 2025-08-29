export function isAffEnabled() {
  return import.meta.env.VITE_AFF_ENABLED === 'true'
}

export function isAdsEnabled() {
  return import.meta.env.VITE_ADS_ENABLED === 'true'
}

export function shouldShowAdsPlaceholder() {
  return import.meta.env.VITE_ADS_PLACEHOLDER === 'true'
}

export function getAffiliateLink(dealId) {
  const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
  return `${baseUrl}/go/${dealId}`
}

export function getContactEmail() {
  return import.meta.env.VITE_CONTACT_EMAIL || 'hello@savebucks.com'
}

export function getSiteName() {
  return import.meta.env.VITE_SITE_NAME || 'SaveBucks'
}
