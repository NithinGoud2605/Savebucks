export function formatPrice(price, currency = 'USD') {
  if (price === null || price === undefined) return ''
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price)
  } catch {
    return `$${price}`
  }
}

export function formatDate(date) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  } catch {
    return date
  }
}

export function dateAgo(date) {
  try {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now - past
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffSeconds < 60) return 'just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return formatDate(date)
  } catch {
    return date
  }
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : (plural || `${singular}s`)
}

export function truncate(str, length = 100) {
  if (!str || str.length <= length) return str
  return str.substring(0, length).trim() + '…'
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function capitalize(text) {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatPercentage(value, total) {
  if (!total || total === 0) return '0%'
  return Math.round((value / total) * 100) + '%'
}

export function timeUntil(date) {
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((target - now) / 1000)
  
  if (diffInSeconds <= 0) {
    return 'Expired'
  }
  
  const intervals = [
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ]
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (count >= 1) {
      return count === 1 ? `1 ${interval.label}` : `${count} ${interval.label}s`
    }
  }
  
  return `${diffInSeconds} seconds`
}

export function formatCompactNumber(num) {
  if (num < 1000) return num.toString()
  if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  if (num < 1000000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B'
}
