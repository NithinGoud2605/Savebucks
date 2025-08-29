import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../Toast'
import { api } from '../../lib/api'
import { formatPrice, dateAgo } from '../../lib/format'
import { clsx } from 'clsx'

export function DealAlerts({ dealId, currentPrice }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [alertData, setAlertData] = useState({
    targetPrice: Math.floor(currentPrice * 0.9), // 10% discount suggestion
    alertType: 'price_drop',
    notificationMethod: 'browser',
  })
  
  const queryClient = useQueryClient()
  const toast = useToast()

  // Fetch existing alerts
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['deal-alerts', dealId],
    queryFn: () => api.getDealAlerts(dealId),
    enabled: !!dealId && !!localStorage.getItem('demo_user'),
  })

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: (data) => api.createDealAlert({ ...data, dealId }),
    onSuccess: () => {
      toast.success('Price alert created! We\'ll notify you when conditions are met.')
      queryClient.invalidateQueries(['deal-alerts', dealId])
      setShowCreateForm(false)
      resetForm()
    },
    onError: () => toast.error('Failed to create alert')
  })

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: (alertId) => api.deleteDealAlert(alertId),
    onSuccess: () => {
      toast.success('Alert deleted successfully')
      queryClient.invalidateQueries(['deal-alerts', dealId])
    },
    onError: () => toast.error('Failed to delete alert')
  })

  const resetForm = () => {
    setAlertData({
      targetPrice: Math.floor(currentPrice * 0.9),
      alertType: 'price_drop',
      notificationMethod: 'browser',
    })
  }

  const handleCreateAlert = () => {
    if (!localStorage.getItem('demo_user')) {
      toast.error('Please sign in to create price alerts')
      return
    }
    
    if (alertData.targetPrice >= currentPrice) {
      toast.error('Target price must be lower than current price')
      return
    }
    
    createAlertMutation.mutate(alertData)
  }

  const alertTypes = [
    { value: 'price_drop', label: 'Price Drop', description: 'Alert when price falls below target' },
    { value: 'back_in_stock', label: 'Back in Stock', description: 'Alert when deal becomes available again' },
    { value: 'deal_expires', label: 'Expiration Warning', description: 'Alert before deal expires' },
    { value: 'any_change', label: 'Any Change', description: 'Alert on any deal updates' },
  ]

  const notificationMethods = [
    { value: 'browser', label: '🔔 Browser', description: 'Browser notifications' },
    { value: 'email', label: '📧 Email', description: 'Email notifications' },
    { value: 'both', label: '🔔📧 Both', description: 'Browser and email' },
  ]

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Existing Alerts */}
      {alerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Alerts ({alerts.length})
          </h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="card p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={clsx(
                      'w-2 h-2 rounded-full',
                      alert.isActive ? 'bg-green-500' : 'bg-gray-400'
                    )}></span>
                    <span className="font-medium text-gray-900">
                      {alertTypes.find(t => t.value === alert.type)?.label || alert.type}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {alert.type === 'price_drop' && `Target: ${formatPrice(alert.targetPrice)}`}
                    {alert.type === 'back_in_stock' && 'Waiting for availability'}
                    {alert.type === 'deal_expires' && 'Expiration reminder'}
                    {alert.type === 'any_change' && 'Any updates'}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    Created {dateAgo(alert.createdAt)} • {alert.notificationMethod}
                  </div>
                </div>
                
                <button
                  onClick={() => deleteAlertMutation.mutate(alert.id)}
                  disabled={deleteAlertMutation.isPending}
                  className="text-red-600 hover:text-red-700 p-2"
                  title="Delete alert"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create New Alert */}
      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Price Alert</span>
        </button>
      ) : (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Create New Alert
            </h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Alert Type */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Alert Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alertTypes.map((type) => (
                  <label key={type.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="alertType"
                      value={type.value}
                      checked={alertData.alertType === type.value}
                      onChange={(e) => setAlertData(prev => ({ ...prev, alertType: e.target.value }))}
                      className="sr-only"
                    />
                    <div className={clsx(
                      'border-2 rounded-lg p-3 transition-colors',
                      alertData.alertType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Target Price (for price drop alerts) */}
            {alertData.alertType === 'price_drop' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Target Price
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={currentPrice - 0.01}
                    value={alertData.targetPrice}
                    onChange={(e) => setAlertData(prev => ({ ...prev, targetPrice: parseFloat(e.target.value) || 0 }))}
                    className="input pl-7"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Current price: {formatPrice(currentPrice)} • 
                  Save: {formatPrice(Math.max(0, currentPrice - alertData.targetPrice))} ({Math.round(Math.max(0, (currentPrice - alertData.targetPrice) / currentPrice * 100))}%)
                </p>
              </div>
            )}

            {/* Notification Method */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                How should we notify you?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {notificationMethods.map((method) => (
                  <label key={method.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="notificationMethod"
                      value={method.value}
                      checked={alertData.notificationMethod === method.value}
                      onChange={(e) => setAlertData(prev => ({ ...prev, notificationMethod: e.target.value }))}
                      className="sr-only"
                    />
                    <div className={clsx(
                      'border-2 rounded-lg p-3 text-center transition-colors',
                      alertData.notificationMethod === method.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}>
                      <div className="font-medium text-gray-900">{method.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{method.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleCreateAlert}
                disabled={createAlertMutation.isPending}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              How Alerts Work
            </h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• We check deal prices multiple times per day</li>
              <li>• You'll be notified instantly when conditions are met</li>
              <li>• Alerts remain active for 30 days by default</li>
              <li>• You can manage all alerts from your profile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
