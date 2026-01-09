import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Clock, Mail, Smartphone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { NotificationToggle } from '../components/Notifications/PushNotificationPrompt';
import { Skeleton } from '../components/ui/Skeleton';

/**
 * Notification Settings Page
 * 
 * Comprehensive notification preferences management.
 */
export default function NotificationSettings() {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    // Fetch preferences
    const { data: prefs, isLoading } = useQuery({
        queryKey: ['notification-preferences'],
        queryFn: () => apiRequest('/api/saved-searches/notification-preferences'),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000
    });

    // Update preferences
    const updateMutation = useMutation({
        mutationFn: (updates) => apiRequest('/api/saved-searches/notification-preferences', {
            method: 'PUT',
            body: updates
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['notification-preferences']);
            toast.success('Preferences saved!');
        },
        onError: () => {
            toast.error('Failed to save preferences');
        }
    });

    const handleToggle = (key) => {
        if (!prefs) return;
        updateMutation.mutate({ [key]: !prefs[key] });
    };

    if (!isAuthenticated) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-gray-50 rounded-2xl p-8 text-center">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Notification Settings</h1>
                    <p className="text-gray-600 mb-6">Sign in to manage your notification preferences.</p>
                    <a href="/signin" className="btn-primary">Sign In</a>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h1>
                    <p className="text-gray-600">Control how and when you receive notifications.</p>
                </motion.div>

                {/* Push Notifications */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-violet-500" />
                        Push Notifications
                    </h2>
                    <NotificationToggle className="mb-4" />
                </motion.section>

                {/* Notification Types */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mb-8"
                >
                    <h2 className="text-lg font-semibold text-gray-900 p-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-violet-500" />
                        Alert Types
                    </h2>

                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : (
                        <>
                            <SettingRow
                                title="Price Drop Alerts"
                                description="Get notified when prices drop on saved items"
                                enabled={prefs?.price_drop_alerts}
                                onToggle={() => handleToggle('price_drop_alerts')}
                                loading={updateMutation.isPending}
                            />
                            <SettingRow
                                title="New Deal Alerts"
                                description="Notifications for new deals matching your saved searches"
                                enabled={prefs?.new_deal_alerts}
                                onToggle={() => handleToggle('new_deal_alerts')}
                                loading={updateMutation.isPending}
                            />
                            <SettingRow
                                title="Expiring Deal Reminders"
                                description="Reminders before deals expire"
                                enabled={prefs?.deal_expiry_alerts}
                                onToggle={() => handleToggle('deal_expiry_alerts')}
                                loading={updateMutation.isPending}
                            />
                            <SettingRow
                                title="Followed Merchant Alerts"
                                description="New deals from merchants you follow"
                                enabled={prefs?.followed_merchant_alerts}
                                onToggle={() => handleToggle('followed_merchant_alerts')}
                                loading={updateMutation.isPending}
                            />
                        </>
                    )}
                </motion.section>

                {/* Delivery Channels */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mb-8"
                >
                    <h2 className="text-lg font-semibold text-gray-900 p-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-violet-500" />
                        Delivery Channels
                    </h2>

                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : (
                        <>
                            <SettingRow
                                title="Push Notifications"
                                description="Browser and mobile push notifications"
                                enabled={prefs?.push_notifications_enabled}
                                onToggle={() => handleToggle('push_notifications_enabled')}
                                loading={updateMutation.isPending}
                            />
                            <SettingRow
                                title="Email Notifications"
                                description="Receive notifications via email"
                                enabled={prefs?.email_notifications_enabled}
                                onToggle={() => handleToggle('email_notifications_enabled')}
                                loading={updateMutation.isPending}
                            />
                            <SettingRow
                                title="In-App Notifications"
                                description="Show notifications inside the app"
                                enabled={prefs?.in_app_notifications_enabled}
                                onToggle={() => handleToggle('in_app_notifications_enabled')}
                                loading={updateMutation.isPending}
                            />
                        </>
                    )}
                </motion.section>

                {/* Quiet Hours */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-xl border border-gray-200 p-4"
                >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-violet-500" />
                        Quiet Hours
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        No notifications will be sent during quiet hours.
                    </p>
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                            <input
                                type="time"
                                value={prefs?.quiet_hours_start || '22:00'}
                                onChange={(e) => updateMutation.mutate({ quiet_hours_start: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                        <span className="text-gray-400 mt-6">to</span>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Until</label>
                            <input
                                type="time"
                                value={prefs?.quiet_hours_end || '08:00'}
                                onChange={(e) => updateMutation.mutate({ quiet_hours_end: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}

function SettingRow({ title, description, enabled, onToggle, loading }) {
    return (
        <div className="flex items-center justify-between p-4">
            <div>
                <p className="font-medium text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <button
                onClick={onToggle}
                disabled={loading}
                className={`
          relative w-12 h-7 rounded-full transition-colors duration-200
          ${enabled ? 'bg-violet-600' : 'bg-gray-300'}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
            >
                <span
                    className={`
            absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm
            transition-transform duration-200
            ${enabled ? 'translate-x-5' : 'translate-x-0'}
          `}
                />
            </button>
        </div>
    );
}
