import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
    isPushSupported,
    getNotificationPermission,
    requestNotificationPermission,
    registerServiceWorker,
    subscribeToPush,
    saveSubscriptionToServer,
    unsubscribeFromPush
} from '../lib/pushNotifications';

/**
 * Hook for managing push notification state and subscriptions
 * 
 * Usage:
 * const { isSupported, permission, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
 */
export function usePushNotifications() {
    const { user, isAuthenticated } = useAuth();
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [registration, setRegistration] = useState(null);

    // Initialize on mount
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);

            // Check browser support
            const supported = isPushSupported();
            setIsSupported(supported);

            if (!supported) {
                setIsLoading(false);
                return;
            }

            // Get current permission
            setPermission(getNotificationPermission());

            // Register service worker
            const reg = await registerServiceWorker();
            setRegistration(reg);

            // Check existing subscription
            if (reg) {
                try {
                    const subscription = await reg.pushManager.getSubscription();
                    setIsSubscribed(!!subscription);
                } catch (e) {
                    console.error('Error checking subscription:', e);
                }
            }

            setIsLoading(false);
        };

        init();
    }, []);

    // Subscribe to push notifications
    const subscribe = useCallback(async () => {
        if (!isSupported) {
            setError('Push notifications are not supported in this browser');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Request permission first
            const { granted, reason } = await requestNotificationPermission();
            setPermission(getNotificationPermission());

            if (!granted) {
                setError(reason === 'denied'
                    ? 'Notification permission was denied. Please enable in browser settings.'
                    : 'Could not get notification permission'
                );
                setIsLoading(false);
                return false;
            }

            // Get or register service worker
            let reg = registration;
            if (!reg) {
                reg = await registerServiceWorker();
                setRegistration(reg);
            }

            if (!reg) {
                setError('Could not register service worker');
                setIsLoading(false);
                return false;
            }

            // Subscribe to push
            const subscription = await subscribeToPush(reg);

            if (!subscription) {
                setError('Could not create push subscription');
                setIsLoading(false);
                return false;
            }

            // Save to server if authenticated
            if (isAuthenticated && user) {
                const authToken = localStorage.getItem('access_token');
                const result = await saveSubscriptionToServer(subscription, authToken);

                if (!result.success) {
                    console.warn('Could not save subscription to server:', result.reason);
                    // Don't fail - subscription still works for this session
                }
            }

            setIsSubscribed(true);
            setIsLoading(false);
            return true;

        } catch (e) {
            console.error('Error subscribing to push:', e);
            setError('An error occurred while enabling notifications');
            setIsLoading(false);
            return false;
        }
    }, [isSupported, registration, isAuthenticated, user]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async () => {
        if (!registration) {
            return true;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await unsubscribeFromPush(registration);

            if (result.success) {
                setIsSubscribed(false);
            } else {
                setError('Could not unsubscribe from notifications');
            }

            setIsLoading(false);
            return result.success;

        } catch (e) {
            console.error('Error unsubscribing:', e);
            setError('An error occurred while disabling notifications');
            setIsLoading(false);
            return false;
        }
    }, [registration]);

    return {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe,
        // Derived states
        canSubscribe: isSupported && permission !== 'denied' && !isSubscribed,
        isDenied: permission === 'denied'
    };
}
