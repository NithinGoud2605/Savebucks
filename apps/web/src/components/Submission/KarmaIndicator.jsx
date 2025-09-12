import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  StarIcon, 
  SparklesIcon, 
  TrophyIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline'

export default function KarmaIndicator({ 
  submissionType = 'deal', 
  formData = {}, 
  className = '' 
}) {
  const [karmaPoints, setKarmaPoints] = useState(3)
  const [fieldCount, setFieldCount] = useState(0)
  const [totalFields, setTotalFields] = useState(15)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    calculateKarma()
  }, [formData, submissionType])

  const calculateKarma = () => {
    let count = 0
    let total = submissionType === 'deal' ? 15 : 10

    if (submissionType === 'deal') {
      if (formData.original_price) count++
      if (formData.discount_percentage) count++
      if (formData.merchant) count++
      if (formData.category_id) count++
      if (formData.deal_type && formData.deal_type !== 'deal') count++
      if (formData.coupon_code) count++
      if (formData.coupon_type && formData.coupon_type !== 'none') count++
      if (formData.starts_at) count++
      if (formData.expires_at) count++
      if (formData.stock_status && formData.stock_status !== 'unknown') count++
      if (formData.stock_quantity) count++
      if (formData.tags) count++
      if (formData.image_url) count++
      if (formData.description) count++
      if (formData.terms_conditions) count++
    } else {
      if (formData.minimum_order_amount) count++
      if (formData.maximum_discount_amount) count++
      if (formData.usage_limit) count++
      if (formData.usage_limit_per_user) count++
      if (formData.starts_at) count++
      if (formData.expires_at) count++
      if (formData.source_url) count++
      if (formData.category_id) count++
      if (formData.description) count++
      if (formData.terms_conditions) count++
    }

    setFieldCount(count)
    setTotalFields(total)

    // Calculate karma points
    let points = 3
    if (count === 0) {
      points = 3
    } else if (count <= total * 0.3) {
      points = 5
    } else if (count <= total * 0.7) {
      points = 8
    } else {
      points = 10
    }

    setKarmaPoints(points)
  }

  const getKarmaLevel = () => {
    if (karmaPoints === 3) return { level: 'Basic', color: 'text-gray-600', bg: 'bg-gray-100' }
    if (karmaPoints === 5) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (karmaPoints === 8) return { level: 'Great', color: 'text-green-600', bg: 'bg-green-100' }
    if (karmaPoints === 10) return { level: 'Excellent', color: 'text-purple-600', bg: 'bg-purple-100' }
    return { level: 'Basic', color: 'text-gray-600', bg: 'bg-gray-100' }
  }

  const getIcon = () => {
    if (karmaPoints === 3) return StarIcon
    if (karmaPoints === 5) return SparklesIcon
    if (karmaPoints === 8) return TrophyIcon
    if (karmaPoints === 10) return TrophyIcon
    return StarIcon
  }

  const karmaLevel = getKarmaLevel()
  const Icon = getIcon()
  const completionPercentage = Math.round((fieldCount / totalFields) * 100)

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${karmaLevel.bg}`}>
            <Icon className={`w-5 h-5 ${karmaLevel.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Karma Points</h3>
            <p className="text-sm text-gray-600">Earn points for detailed submissions</p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <InformationCircleIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-gray-900">{karmaPoints}</span>
          <span className="text-sm text-gray-500">points</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">{karmaLevel.level} Submission</span>
            <span className="text-gray-500">{fieldCount}/{totalFields} fields</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full ${karmaLevel.bg.replace('bg-', 'bg-').replace('-100', '-500')}`}
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Basic (3 points):</span>
                <span className="text-gray-900">Required fields only</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Good (5 points):</span>
                <span className="text-gray-900">≤30% optional fields</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Great (8 points):</span>
                <span className="text-gray-900">30-70% optional fields</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Excellent (10 points):</span>
                <span className="text-gray-900">70%+ optional fields</span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Pro tip:</strong> More detailed submissions get more karma points and better visibility!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}




