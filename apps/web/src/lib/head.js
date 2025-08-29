const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'SaveBucks'
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173'
const DEFAULT_IMAGE = import.meta.env.VITE_DEFAULT_IMAGE || `${SITE_URL}/og-default.jpg`

export function setPageMeta({
  title,
  description,
  image = DEFAULT_IMAGE,
  url = window.location.href,
  type = 'website',
  canonical,
}) {
  // Set title
  document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  
  // Set or update meta tags
  setMetaTag('description', description)
  setMetaTag('og:title', title || SITE_NAME)
  setMetaTag('og:description', description)
  setMetaTag('og:image', image)
  setMetaTag('og:url', url)
  setMetaTag('og:type', type)
  setMetaTag('og:site_name', SITE_NAME)
  
  // Twitter meta
  setMetaTag('twitter:card', 'summary_large_image')
  setMetaTag('twitter:title', title || SITE_NAME)
  setMetaTag('twitter:description', description)
  setMetaTag('twitter:image', image)
  
  // Canonical URL
  if (canonical || url) {
    setCanonical(canonical || url)
  }
}

export function setProductJsonLd({ deal, url }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": deal.title,
    "description": deal.description || deal.title,
    "image": deal.image_url || DEFAULT_IMAGE,
    "brand": {
      "@type": "Brand",
      "name": deal.merchant
    },
    "offers": {
      "@type": "Offer",
      "url": url,
      "priceCurrency": deal.currency || "USD",
      "price": deal.price,
      "availability": deal.status === 'expired' ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "priceValidUntil": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
  
  setJsonLd('product-json-ld', jsonLd)
}

export function setArticleJsonLd({ title, description, author, datePublished, url, image }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "author": {
      "@type": "Person",
      "name": author
    },
    "datePublished": datePublished,
    "url": url,
    "image": image || DEFAULT_IMAGE,
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/logo.png`
      }
    }
  }
  
  setJsonLd('article-json-ld', jsonLd)
}

function setMetaTag(property, content) {
  if (!content) return
  
  let meta = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    if (property.startsWith('og:') || property.startsWith('twitter:')) {
      meta.setAttribute('property', property)
    } else {
      meta.setAttribute('name', property)
    }
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

function setCanonical(url) {
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)
}

function setJsonLd(id, data) {
  let script = document.querySelector(`script[id="${id}"]`)
  if (!script) {
    script = document.createElement('script')
    script.setAttribute('type', 'application/ld+json')
    script.setAttribute('id', id)
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(data)
}
