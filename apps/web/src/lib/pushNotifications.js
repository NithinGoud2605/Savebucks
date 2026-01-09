/**
 * Push Notification Utilities
 * 
 * Handles service worker registration, push subscription,
 * and browser notification permissions.
 */

// Check if push notifications are supported
export function isPushSupported() {
    return 'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
}

// Check current notification permission
export function getNotificationPermission() {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission; // 'granted', 'denied', or 'default'
}

// Request notification permission
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        return { granted: false, reason: 'unsupported' };
    }

    try {
        const permission = await Notification.requestPermission();
        return {
            granted: permission === 'granted',
            permission,
            reason: permission === 'denied' ? 'denied' : null
        };
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return { granted: false, reason: 'error', error };
    }
}

// Register service worker
export async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service workers not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });

        console.log('✅ Service worker registered:', registration.scope);
        return registration;
    } catch (error) {
        console.error('Service worker registration failed:', error);
        return null;
    }
}

// Get or create push subscription
export async function subscribeToPush(registration) {
    if (!registration) {
        console.warn('No service worker registration');
        return null;
    }

    try {
        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            console.log('📬 Existing push subscription found');
            return subscription;
        }

        // Get VAPID public key from server
        const response = await fetch('/api/notifications/vapid-key');
        if (!response.ok) {
            throw new Error('Failed to get VAPID key');
        }
        const { publicKey } = await response.json();

        // Convert VAPID key to Uint8Array
        const vapidKey = urlBase64ToUint8Array(publicKey);

        // Create new subscription
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey
        });

        console.log('✅ Push subscription created');
        return subscription;

    } catch (error) {
        console.error('Error subscribing to push:', error);
        return null;
    }
}

// Send subscription to server
export async function saveSubscriptionToServer(subscription, authToken) {
    if (!subscription) {
        return { success: false, reason: 'no_subscription' };
    }

    try {
        const response = await fetch('/api/notifications/push-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken ? `Bearer ${authToken}` : ''
            },
            body: JSON.stringify({
                subscription: subscription.toJSON()
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save subscription');
        }

        const data = await response.json();
        console.log('✅ Subscription saved to server');
        return { success: true, data };

    } catch (error) {
        console.error('Error saving subscription:', error);
        return { success: false, reason: 'server_error', error };
    }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(registration) {
    if (!registration) {
        return { success: false, reason: 'no_registration' };
    }

    try {
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();

            // Also remove from server
            await fetch('/api/notifications/push-subscription', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint
                })
            });

            console.log('✅ Unsubscribed from push notifications');
            return { success: true };
        }

        return { success: true, reason: 'no_subscription' };

    } catch (error) {
        console.error('Error unsubscribing:', error);
        return { success: false, reason: 'error', error };
    }
}

// Show a test notification (for debugging)
export async function showTestNotification() {
    if (getNotificationPermission() !== 'granted') {
        return { success: false, reason: 'permission_not_granted' };
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('SaveBucks Test', {
            body: '🎉 Push notifications are working!',
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            tag: 'test-notification',
            data: { url: '/' }
        });
        return { success: true };
    } catch (error) {
        console.error('Error showing test notification:', error);
        return { success: false, reason: 'error', error };
    }
}

// Helper: Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
