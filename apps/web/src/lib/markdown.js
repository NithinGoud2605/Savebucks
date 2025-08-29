import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

// Custom renderer to add classes
const renderer = new marked.Renderer()
renderer.link = function(href, title, text) {
  return `<a href="${href}" ${title ? `title="${title}"` : ''} target="_blank" rel="noopener noreferrer">${text}</a>`
}

export function parseMarkdown(content) {
  if (!content) return ''
  
  try {
    const html = marked(content, { renderer })
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote',
        'a',
      ],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
      ALLOWED_URI_REGEXP: /^https?:\/\//,
    })
  } catch (error) {
    console.warn('Failed to parse markdown:', error)
    return DOMPurify.sanitize(content)
  }
}

export function stripMarkdown(content) {
  if (!content) return ''
  
  return content
    .replace(/[#*_`~\[\]]/g, '')
    .replace(/\n/g, ' ')
    .trim()
}
