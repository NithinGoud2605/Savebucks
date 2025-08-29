/**
 * Professional toast notification system for SaveBucks
 */

let toastContainer = null
let toastId = 0

// Toast types with professional styling
const TOAST_TYPES = {
  success: {
    bgColor: 'bg-success-50',
    borderColor: 'border-success-200',
    textColor: 'text-success-800',
    iconColor: 'text-success-600',
    icon: 'SUCCESS'
  },
  error: {
    bgColor: 'bg-danger-50',
    borderColor: 'border-danger-200',
    textColor: 'text-danger-800',
    iconColor: 'text-danger-600',
    icon: 'ERROR'
  },
  warning: {
    bgColor: 'bg-warning-50',
    borderColor: 'border-warning-200',
    textColor: 'text-warning-800',
    iconColor: 'text-warning-600',
    icon: 'WARNING'
  },
  info: {
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
    textColor: 'text-primary-800',
    iconColor: 'text-primary-600',
    icon: 'INFO'
  }
}

function createToastContainer() {
  if (toastContainer) return toastContainer
  
  toastContainer = document.createElement('div')
  toastContainer.id = 'toast-container'
  toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2'
  document.body.appendChild(toastContainer)
  
  return toastContainer
}

function createToastElement(message, type, duration) {
  const container = createToastContainer()
  const id = ++toastId
  const config = TOAST_TYPES[type] || TOAST_TYPES.info
  
  const toast = document.createElement('div')
  toast.id = `toast-${id}`
  toast.className = `
    ${config.bgColor} ${config.borderColor} ${config.textColor}
    border rounded-xl shadow-medium p-4 max-w-sm
    transform transition-all duration-300 ease-out
    translate-x-full opacity-0
  `.trim()
  
  toast.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="${config.iconColor} font-bold text-sm mt-0.5">
        ${config.icon}
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium leading-relaxed">${message}</p>
      </div>
      <button 
        onclick="this.closest('[id^=toast-]').remove()"
        class="text-current opacity-60 hover:opacity-100 transition-opacity ml-2"
      >
        <span class="sr-only">Close</span>
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    </div>
  `
  
  container.appendChild(toast)
  
  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full', 'opacity-0')
  })
  
  // Auto remove
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast)
    }, duration)
  }
  
  return toast
}

function removeToast(toast) {
  if (!toast || !toast.parentNode) return
  
  toast.classList.add('translate-x-full', 'opacity-0')
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast)
    }
  }, 300)
}

export const toast = {
  success: (message, duration = 4000) => createToastElement(message, 'success', duration),
  error: (message, duration = 6000) => createToastElement(message, 'error', duration),
  warning: (message, duration = 5000) => createToastElement(message, 'warning', duration),
  info: (message, duration = 4000) => createToastElement(message, 'info', duration),
  
  // Remove all toasts
  clear: () => {
    if (toastContainer) {
      toastContainer.innerHTML = ''
    }
  }
}

// Global error handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  toast.error('An unexpected error occurred. Please try again.')
})

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  toast.error('An unexpected error occurred. Please try again.')
})
