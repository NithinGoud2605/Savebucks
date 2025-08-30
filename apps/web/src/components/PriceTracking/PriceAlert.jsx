import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { formatPrice } from '../../lib/format'

const PriceAlertModal = ({ dealId, currentPrice, isOpen, onClose }) => {
  const [alertPrice, setAlertPrice] = useState('')
  const [alertType, setAlertType] = useState('below') // 'below' or 'above'
  const queryClient = useQueryClient()

  const createAlertMutation = useMutation({
    mutationFn: (alertData) => api.priceTracking.createAlert(alertData),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-price-alerts'])
      onClose()
      setAlertPrice('')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const price = parseFloat(alertPrice)
    
    if (!price || price <= 0) {
      alert('Please enter a valid price')
      return
    }

    createAlertMutation.mutate({
      deal_id: dealId,
      target_price: price,
      alert_type: alertType,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Set Price Alert</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Price: {formatPrice(currentPrice)}
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Type
            </label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="below">Alert me when price drops below</option>
              <option value="above">Alert me when price goes above</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              placeholder="Enter target price"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAlertMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const UserPriceAlerts = () => {
  const queryClient = useQueryClient()
  
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['user-price-alerts'],
    queryFn: () => api.priceTracking.getUserAlerts(),
  })

  const deleteAlertMutation = useMutation({
    mutationFn: (alertId) => api.priceTracking.deleteAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-price-alerts'])
    },
  })

  const updateAlertMutation = useMutation({
    mutationFn: ({ alertId, updates }) => api.priceTracking.updateAlert(alertId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-price-alerts'])
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-md"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No price alerts set up yet.</p>
        <p className="text-sm">Create alerts on deal pages to get notified of price changes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div key={alert.id} className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">
                {alert.deal_title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>
                  Alert when price {alert.alert_type === 'below' ? 'drops below' : 'goes above'} {formatPrice(alert.target_price)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  alert.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {alert.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {alert.current_price && (
                <div className="mt-2 text-sm">
                  Current price: <span className="font-medium">{formatPrice(alert.current_price)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => updateAlertMutation.mutate({
                  alertId: alert.id,
                  updates: { is_active: !alert.is_active }
                })}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  alert.is_active
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {alert.is_active ? 'Pause' : 'Resume'}
              </button>
              
              <button
                onClick={() => deleteAlertMutation.mutate(alert.id)}
                disabled={deleteAlertMutation.isPending}
                className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200 disabled:opacity-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export { PriceAlertModal, UserPriceAlerts }
export default PriceAlertModal
