import React from 'react'
import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  Search, 
  Tag, 
  AlertCircle, 
  Package,
  FileX,
  Users,
  Heart,
  Inbox,
  Filter,
  Sparkles
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ModernButton } from '../ui/ModernButton'

const emptyStateConfigs = {
  noDeals: {
    icon: ShoppingCart,
    title: "No deals found",
    description: "We couldn't find any deals matching your criteria. Try adjusting your filters or check back later!",
    action: {
      label: "Clear Filters",
      variant: "primary"
    },
    illustration: "shopping"
  },
  noResults: {
    icon: Search,
    title: "No results found",
    description: "We couldn't find anything matching your search. Try different keywords or browse our categories.",
    action: {
      label: "Browse All Deals",
      href: "/",
      variant: "primary"
    },
    illustration: "search"
  },
  noCoupons: {
    icon: Tag,
    title: "No coupons available",
    description: "There are no coupons matching your criteria right now. New coupons are added daily!",
    action: {
      label: "View All Coupons",
      href: "/companies",
      variant: "primary"
    },
    illustration: "coupon"
  },
  error: {
    icon: AlertCircle,
    title: "Something went wrong",
    description: "We encountered an error while loading the content. Please try again later.",
    action: {
      label: "Try Again",
      variant: "primary"
    },
    illustration: "error"
  },
  noSaved: {
    icon: Heart,
    title: "No saved items yet",
    description: "Start saving your favorite deals to access them quickly later!",
    action: {
      label: "Explore Deals",
      href: "/",
      variant: "primary"
    },
    illustration: "saved"
  },
  noNotifications: {
    icon: Inbox,
    title: "All caught up!",
    description: "You don't have any notifications right now. We'll let you know when something important happens.",
    illustration: "notifications"
  },
  maintenance: {
    icon: Package,
    title: "Under maintenance",
    description: "We're making some improvements to serve you better. Please check back in a few minutes!",
    illustration: "maintenance"
  }
}

const Illustration = ({ type }) => {
  const illustrations = {
    shopping: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <motion.circle
          cx="100"
          cy="100"
          r="80"
          fill="#e0e7ff"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        />
        <motion.path
          d="M60 80 L140 80 L130 120 L70 120 Z"
          fill="#6366f1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <motion.circle
          cx="80"
          cy="140"
          r="8"
          fill="#4f46e5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        />
        <motion.circle
          cx="120"
          cy="140"
          r="8"
          fill="#4f46e5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <motion.circle
          cx="90"
          cy="90"
          r="50"
          fill="none"
          stroke="#6366f1"
          strokeWidth="8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.line
          x1="125"
          y1="125"
          x2="150"
          y2="150"
          stroke="#4f46e5"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        />
      </svg>
    )
  }

  return illustrations[type] || illustrations.shopping
}

export const ModernEmptyState = ({ 
  type = 'noDeals',
  title,
  description,
  action,
  icon,
  children,
  className = ''
}) => {
  const config = emptyStateConfigs[type] || {}
  const Icon = icon || config.icon || ShoppingCart
  const finalTitle = title || config.title
  const finalDescription = description || config.description
  const finalAction = action || config.action

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}
    >
      {/* Illustration */}
      <div className="relative w-48 h-48 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full blur-2xl opacity-50" />
        <Illustration type={config.illustration} />
        
        {/* Floating Icon */}
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center"
        >
          <Icon className="w-8 h-8 text-primary-600" />
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-md"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {finalTitle}
        </h3>
        <p className="text-gray-600 mb-6">
          {finalDescription}
        </p>

        {/* Action Button */}
        {finalAction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {finalAction.href ? (
              <Link to={finalAction.href}>
                <ModernButton
                  variant={finalAction.variant || 'primary'}
                  size="lg"
                  leftIcon={<Sparkles className="w-5 h-5" />}
                >
                  {finalAction.label}
                </ModernButton>
              </Link>
            ) : (
              <ModernButton
                variant={finalAction.variant || 'primary'}
                size="lg"
                onClick={finalAction.onClick}
                leftIcon={<Sparkles className="w-5 h-5" />}
              >
                {finalAction.label}
              </ModernButton>
            )}
          </motion.div>
        )}

        {/* Custom Children */}
        {children && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            {children}
          </motion.div>
        )}
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            x: [0, 20, 0],
            y: [0, -20, 0]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-20 w-20 h-20 bg-primary-200 rounded-full blur-2xl opacity-20"
        />
        <motion.div
          animate={{ 
            x: [0, -20, 0],
            y: [0, 20, 0]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-20 left-20 w-32 h-32 bg-purple-200 rounded-full blur-2xl opacity-20"
        />
      </div>
    </motion.div>
  )
}

// Mini Empty State for smaller areas
export const MiniEmptyState = ({ icon: Icon = Inbox, message = "No items" }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <Icon className="w-8 h-8 mb-2 text-gray-400" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
