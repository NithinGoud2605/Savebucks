import React, { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'

const ConfirmContext = createContext()

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    // Fallback if not in provider
    return async () => window.confirm('Are you sure?')
  }
  return context.confirm
}

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)

  const confirm = useCallback(async (options) => {
    return new Promise((resolve) => {
      setDialog({
        ...options,
        onConfirm: () => {
          resolve(true)
          setDialog(null)
        },
        onCancel: () => {
          resolve(false)
          setDialog(null)
        },
      })
    })
  }, [])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && createPortal(<ConfirmDialog {...dialog} />, document.body)}
    </ConfirmContext.Provider>
  )
}

function ConfirmDialog({
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default', // default, danger
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onCancel}
        />
        
        {/* Dialog */}
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600">
              {message}
            </p>
          </div>
          
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onCancel}
              className="btn-secondary"
              autoFocus
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={clsx(
                'btn',
                type === 'danger' ? 'btn-danger' : 'btn-primary'
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
