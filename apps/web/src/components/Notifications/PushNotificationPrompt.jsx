import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

/**
 * Push Notification Permission Prompt
 * 
 * A beautiful, non-intrusive prompt that asks users to enable push notifications.
 * Shows only when appropriate (supported browser, not yet granted, not denied).
 */
export function PushNotificationPrompt({ onClose }) {
    const {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        isDenied
    } = usePushNotifications();

    // Don't show if already subscribed or denied
    if (!isSupported || isSubscribed || isDenied) {
        return null;
    }

    const handleEnable = async () => {
        const success = await subscribe();
        if (success && onClose) {
            setTimeout(onClose, 1500); // Close after success animation
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="p-5">
                    {/* Icon */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Never miss a deal!</h3>
                            <p className="text-sm text-gray-500">Get instant alerts for price drops</p>
                        </div>
                    </div>

                    {/* Benefits */}
                    <ul className="space-y-2 mb-5 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>Price drop alerts on saved items</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>Expiring deal reminders</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>Flash sale announcements</span>
                        </li>
                    </ul>

                    {/* Error message */}
                    {error && (
                        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleEnable}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Enabling...</span>
                                </>
                            ) : (
                                <>
                                    <Bell className="w-4 h-4" />
                                    <span>Enable Notifications</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 font-medium rounded-xl transition-colors"
                        >
                            Later
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Notification Settings Toggle
 * 
 * A simple toggle for use in settings pages.
 */
export function NotificationToggle({ className = '' }) {
    const {
        isSupported,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe,
        isDenied
    } = usePushNotifications();

    if (!isSupported) {
        return (
            <div className={`flex items-center justify-between p-4 bg-gray-50 rounded-xl ${className}`}>
                <div className="flex items-center gap-3">
                    <BellOff className="w-5 h-5 text-gray-400" />
                    <div>
                        <p className="font-medium text-gray-700">Push Notifications</p>
                        <p className="text-sm text-gray-500">Not supported in this browser</p>
                    </div>
                </div>
            </div>
        );
    }

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            await subscribe();
        }
    };

    return (
        <div className={`flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl ${className}`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSubscribed ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </div>
                <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-500">
                        {isDenied
                            ? 'Blocked in browser settings'
                            : isSubscribed
                                ? 'You\'ll receive deal alerts'
                                : 'Get notified about deals'
                        }
                    </p>
                </div>
            </div>

            <button
                onClick={handleToggle}
                disabled={isLoading || isDenied}
                className={`
          relative w-12 h-7 rounded-full transition-colors duration-200
          ${isSubscribed ? 'bg-violet-600' : 'bg-gray-300'}
          ${isDenied ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          disabled:opacity-50
        `}
            >
                <span
                    className={`
            absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm
            transition-transform duration-200
            ${isSubscribed ? 'translate-x-5' : 'translate-x-0'}
          `}
                />
            </button>
        </div>
    );
}

export default PushNotificationPrompt;
