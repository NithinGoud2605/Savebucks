/**
 * Service Worker for SaveBucks Push Notifications
 * 
 * Handles:
 * - Push notification events
 * - Notification click events
 * - Background sync (optional)
 */

// Cache version for service worker updates
const CACHE_VERSION = 'savebucks-v1';

// Handle push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    let data = {
        title: 'SaveBucks',
        body: 'New deal available!',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'savebucks-notification',
        data: {}
    };

    try {
        if (event.data) {
            const payload = event.data.json();
            data = {
                title: payload.title || data.title,
                body: payload.body || payload.message || data.body,
                icon: payload.icon || data.icon,
                badge: payload.badge || data.badge,
                tag: payload.tag || `notification-${Date.now()}`,
                data: {
                    url: payload.action_url || payload.url || '/',
                    notificationId: payload.id,
                    type: payload.type || payload.notification_type,
                    dealId: payload.deal_id,
                    couponId: payload.coupon_id
                },
                // Rich notification options
                image: payload.image_url,
                vibrate: [100, 50, 100],
                requireInteraction: payload.priority === 'high',
                actions: getNotificationActions(payload)
            };
        }
    } catch (e) {
        console.error('[SW] Error parsing push data:', e);
    }

    const showNotification = self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        data: data.data,
        image: data.image,
        vibrate: data.vibrate,
        requireInteraction: data.requireInteraction,
        actions: data.actions
    });

    event.waitUntil(showNotification);
});

// Generate notification actions based on type
function getNotificationActions(payload) {
    const type = payload.type || payload.notification_type;

    switch (type) {
        case 'price_drop':
        case 'deal':
            return [
                { action: 'view', title: '👀 View Deal', icon: '/icon-view.png' },
                { action: 'save', title: '💾 Save', icon: '/icon-save.png' }
            ];
        case 'coupon':
            return [
                { action: 'view', title: '🎟️ Get Code', icon: '/icon-code.png' },
                { action: 'dismiss', title: '✕ Dismiss', icon: '/icon-dismiss.png' }
            ];
        case 'expiring':
            return [
                { action: 'view', title: '⏰ View Now', icon: '/icon-urgent.png' }
            ];
        default:
            return [
                { action: 'view', title: 'View', icon: '/icon-view.png' }
            ];
    }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);

    event.notification.close();

    const data = event.notification.data || {};
    let targetUrl = data.url || '/';

    // Handle specific actions
    if (event.action === 'save' && data.dealId) {
        targetUrl = `/deal/${data.dealId}?action=save`;
    } else if (event.action === 'view') {
        targetUrl = data.url || '/';
    } else if (event.action === 'dismiss') {
        // Just close, don't navigate
        return;
    }

    // Focus existing window or open new one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Try to focus an existing window
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        client.navigate(targetUrl);
                        return;
                    }
                }
                // Open new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );

    // Track notification click (send to analytics)
    if (data.notificationId) {
        fetch('/api/notifications/' + data.notificationId + '/read', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => { });
    }
});

// Handle notification close without click
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification dismissed');
    // Could track dismissal analytics here
});

// Service worker install
self.addEventListener('install', (event) => {
    console.log('[SW] Service worker installing...');
    self.skipWaiting();
});

// Service worker activate
self.addEventListener('activate', (event) => {
    console.log('[SW] Service worker activating...');
    event.waitUntil(clients.claim());
});
