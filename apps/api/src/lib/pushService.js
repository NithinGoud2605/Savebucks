/**
 * Push Notification Service
 * 
 * Handles sending Web Push notifications to users.
 * Uses the web-push library with VAPID authentication.
 */

import webpush from 'web-push';
import { makeAdminClient } from './supa.js';

const supabase = makeAdminClient();

// Configure web-push with VAPID credentials
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@savebucks.com';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        vapidSubject,
        vapidPublicKey,
        vapidPrivateKey
    );
    console.log('✅ Web Push configured with VAPID keys');
} else {
    console.warn('⚠️ VAPID keys not configured - push notifications disabled');
}

/**
 * Send a push notification to a specific user
 * 
 * @param {string} userId - User ID to send notification to
 * @param {object} payload - Notification payload
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body/message
 * @param {string} [payload.icon] - Icon URL
 * @param {string} [payload.image] - Large image URL
 * @param {string} [payload.url] - Click action URL
 * @param {string} [payload.tag] - Notification tag (for grouping)
 * @param {string} [payload.type] - Notification type (deal, coupon, price_drop, etc.)
 * @returns {Promise<{success: boolean, sent: number, failed: number, errors: array}>}
 */
export async function sendPushToUser(userId, payload) {
    if (!vapidPublicKey || !vapidPrivateKey) {
        return { success: false, error: 'VAPID keys not configured', sent: 0, failed: 0 };
    }

    try {
        // Get user's push subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh_key, auth_key')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching subscriptions:', error);
            return { success: false, error: error.message, sent: 0, failed: 0 };
        }

        if (!subscriptions || subscriptions.length === 0) {
            return { success: true, message: 'No subscriptions found', sent: 0, failed: 0 };
        }

        // Prepare the notification payload
        const notificationPayload = JSON.stringify({
            title: payload.title || 'SaveBucks',
            body: payload.body || payload.message,
            icon: payload.icon || '/icon-192.png',
            badge: payload.badge || '/badge-72.png',
            image: payload.image || payload.image_url,
            tag: payload.tag || `notification-${Date.now()}`,
            data: {
                url: payload.url || payload.action_url || '/',
                id: payload.id,
                type: payload.type || payload.notification_type,
                deal_id: payload.deal_id,
                coupon_id: payload.coupon_id
            }
        });

        // Send to all subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(sub => {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh_key,
                        auth: sub.auth_key
                    }
                };
                return webpush.sendNotification(pushSubscription, notificationPayload);
            })
        );

        // Count successes and failures
        let sent = 0;
        let failed = 0;
        const errors = [];
        const expiredEndpoints = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                sent++;
            } else {
                failed++;
                const error = result.reason;
                errors.push(error.message);

                // If subscription is expired/invalid, mark for removal
                if (error.statusCode === 404 || error.statusCode === 410) {
                    expiredEndpoints.push(subscriptions[index].endpoint);
                }
            }
        });

        // Clean up expired subscriptions
        if (expiredEndpoints.length > 0) {
            await supabase
                .from('push_subscriptions')
                .delete()
                .in('endpoint', expiredEndpoints);
            console.log(`🧹 Cleaned up ${expiredEndpoints.length} expired subscriptions`);
        }

        console.log(`📬 Push sent to user ${userId}: ${sent} success, ${failed} failed`);
        return { success: true, sent, failed, errors };

    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error: error.message, sent: 0, failed: 0 };
    }
}

/**
 * Send push notification to multiple users
 * 
 * @param {string[]} userIds - Array of user IDs
 * @param {object} payload - Notification payload
 * @returns {Promise<{success: boolean, totalSent: number, totalFailed: number}>}
 */
export async function sendPushToUsers(userIds, payload) {
    let totalSent = 0;
    let totalFailed = 0;

    const results = await Promise.allSettled(
        userIds.map(userId => sendPushToUser(userId, payload))
    );

    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
            totalSent += result.value.sent;
            totalFailed += result.value.failed;
        }
    });

    return { success: true, totalSent, totalFailed };
}

/**
 * Send push notification to all users with push enabled
 * (Use with caution - for announcements only!)
 * 
 * @param {object} payload - Notification payload
 * @returns {Promise<{success: boolean, totalSent: number, totalFailed: number}>}
 */
export async function sendPushToAll(payload) {
    try {
        // Get all unique user IDs with push subscriptions
        const { data, error } = await supabase
            .from('push_subscriptions')
            .select('user_id')
            .not('user_id', 'is', null);

        if (error) {
            return { success: false, error: error.message };
        }

        const userIds = [...new Set(data.map(d => d.user_id))];
        console.log(`📢 Broadcasting push to ${userIds.length} users`);

        return await sendPushToUsers(userIds, payload);

    } catch (error) {
        console.error('Error broadcasting push:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send price drop notification
 */
export async function sendPriceDropNotification(userId, deal) {
    return sendPushToUser(userId, {
        title: '💰 Price Drop Alert!',
        body: `${deal.title} is now ${deal.price}!`,
        icon: deal.image_url || '/icon-192.png',
        url: `/deal/${deal.id}`,
        type: 'price_drop',
        deal_id: deal.id,
        tag: `price-drop-${deal.id}`
    });
}

/**
 * Send deal expiring notification
 */
export async function sendExpiringDealNotification(userId, deal) {
    return sendPushToUser(userId, {
        title: '⏰ Deal Expiring Soon!',
        body: `${deal.title} expires in 24 hours - grab it now!`,
        icon: deal.image_url || '/icon-192.png',
        url: `/deal/${deal.id}`,
        type: 'expiring',
        deal_id: deal.id,
        tag: `expiring-${deal.id}`
    });
}

/**
 * Send new deal notification (for followed categories/brands)
 */
export async function sendNewDealNotification(userId, deal) {
    return sendPushToUser(userId, {
        title: '🔥 New Deal Alert!',
        body: deal.title,
        icon: deal.image_url || '/icon-192.png',
        image: deal.featured_image,
        url: `/deal/${deal.id}`,
        type: 'new_deal',
        deal_id: deal.id,
        tag: `new-deal-${deal.id}`
    });
}

export default {
    sendPushToUser,
    sendPushToUsers,
    sendPushToAll,
    sendPriceDropNotification,
    sendExpiringDealNotification,
    sendNewDealNotification
};
