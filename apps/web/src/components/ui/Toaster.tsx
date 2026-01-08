/**
 * Toaster Component
 * Premium toast notifications using Sonner
 */

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
    return (
        <SonnerToaster
            position="bottom-right"
            toastOptions={{
                style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '16px',
                    fontSize: '14px'
                },
                classNames: {
                    toast: 'group toast',
                    description: 'text-gray-500',
                    actionButton: 'bg-blue-500 text-white',
                    cancelButton: 'bg-gray-50 text-gray-600',
                    success: 'border-l-4 border-l-green-500',
                    error: 'border-l-4 border-l-red-500',
                    warning: 'border-l-4 border-l-yellow-500',
                    info: 'border-l-4 border-l-blue-500'
                }
            }}
            expand={false}
            richColors
            closeButton
        />
    )
}

export { toast } from 'sonner'
