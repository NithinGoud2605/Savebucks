/**
 * Saved Search Alert Service
 * 
 * Monitors new deals and matches them against users' saved searches.
 * Sends push/email notifications when matches are found.
 * 
 * This can be run:
 * - As a cron job (recommended: every 15-30 minutes)
 * - After each new deal is approved
 * - Manually via admin endpoint
 */

import { makeAdminClient } from './supa.js';
import pushService from './pushService.js';

const supabase = makeAdminClient();

/**
 * Check new deals against all saved searches and notify users
 * 
 * @param {number} minutesAgo - How far back to look for new deals (default: 30)
 * @returns {Promise<{processed: number, matches: number, notifications: number}>}
 */
export async function processNewDealAlerts(minutesAgo = 30) {
    console.log(`🔍 Processing saved search alerts (last ${minutesAgo} minutes)`);

    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - minutesAgo);

    try {
        // Get recently approved deals
        const { data: newDeals, error: dealsError } = await supabase
            .from('deals')
            .select(`
        id, title, description, price, original_price, discount_percentage,
        merchant, category_id, image_url, created_at
      `)
            .eq('status', 'approved')
            .gte('created_at', startTime.toISOString())
            .order('created_at', { ascending: false });

        if (dealsError) {
            console.error('Error fetching new deals:', dealsError);
            return { processed: 0, matches: 0, notifications: 0, error: dealsError.message };
        }

        if (!newDeals || newDeals.length === 0) {
            console.log('📭 No new deals to process');
            return { processed: 0, matches: 0, notifications: 0 };
        }

        console.log(`📦 Found ${newDeals.length} new deals to check`);

        // Get all active saved searches with alerts enabled
        const { data: savedSearches, error: searchError } = await supabase
            .from('saved_searches')
            .select('*')
            .eq('alert_enabled', true);

        if (searchError) {
            console.error('Error fetching saved searches:', searchError);
            return { processed: newDeals.length, matches: 0, notifications: 0, error: searchError.message };
        }

        if (!savedSearches || savedSearches.length === 0) {
            console.log('📭 No active saved searches with alerts');
            return { processed: newDeals.length, matches: 0, notifications: 0 };
        }

        console.log(`🔎 Checking against ${savedSearches.length} saved searches`);

        let totalMatches = 0;
        let totalNotifications = 0;

        // Group searches by user to batch notifications
        const userMatches = {};

        // Process each deal against each saved search
        for (const deal of newDeals) {
            for (const search of savedSearches) {
                if (matchesSavedSearch(deal, search)) {
                    totalMatches++;

                    if (!userMatches[search.user_id]) {
                        userMatches[search.user_id] = [];
                    }
                    userMatches[search.user_id].push({
                        deal,
                        search
                    });
                }
            }
        }

        // Send notifications to each user (batched by user)
        for (const [userId, matches] of Object.entries(userMatches)) {
            const notificationsSent = await sendSearchAlertNotifications(userId, matches);
            totalNotifications += notificationsSent;
        }

        console.log(`✅ Processed ${newDeals.length} deals, ${totalMatches} matches, ${totalNotifications} notifications`);

        return {
            processed: newDeals.length,
            matches: totalMatches,
            notifications: totalNotifications
        };

    } catch (error) {
        console.error('Error processing deal alerts:', error);
        return { processed: 0, matches: 0, notifications: 0, error: error.message };
    }
}

/**
 * Check if a deal matches a saved search
 */
function matchesSavedSearch(deal, search) {
    const { search_type, query_text, merchant_domain, category_id, filters = {} } = search;

    switch (search_type) {
        case 'keyword':
            // Match by keyword in title or description
            if (query_text) {
                const keywords = query_text.toLowerCase().split(/\s+/);
                const searchText = `${deal.title} ${deal.description || ''}`.toLowerCase();
                return keywords.some(kw => searchText.includes(kw));
            }
            return false;

        case 'merchant':
            // Match by merchant
            if (merchant_domain) {
                const dealMerchant = (deal.merchant || '').toLowerCase();
                return dealMerchant.includes(merchant_domain.toLowerCase());
            }
            return false;

        case 'category':
            // Match by category
            if (category_id) {
                return deal.category_id === category_id;
            }
            return false;

        case 'price':
            // Match by price range
            if (filters.min_price || filters.max_price) {
                const price = deal.price || 0;
                if (filters.min_price && price < filters.min_price) return false;
                if (filters.max_price && price > filters.max_price) return false;
                return true;
            }
            return false;

        case 'discount':
            // Match by minimum discount
            if (filters.min_discount) {
                return (deal.discount_percentage || 0) >= filters.min_discount;
            }
            return false;

        default:
            return false;
    }
}

/**
 * Send notifications for matched deals
 * 
 * @param {string} userId - User ID to notify
 * @param {Array} matches - Array of {deal, search} objects
 * @returns {Promise<number>} Number of notifications sent
 */
async function sendSearchAlertNotifications(userId, matches) {
    let sent = 0;

    // Limit to 5 notifications per batch to avoid spam
    const limitedMatches = matches.slice(0, 5);

    for (const { deal, search } of limitedMatches) {
        try {
            // Check user's notification preferences
            const { data: prefs } = await supabase
                .from('user_notification_preferences')
                .select('push_notifications_enabled, new_deal_alerts')
                .eq('user_id', userId)
                .single();

            // Skip if user has disabled notifications
            if (prefs && (!prefs.push_notifications_enabled || !prefs.new_deal_alerts)) {
                continue;
            }

            // Send push notification
            const result = await pushService.sendPushToUser(userId, {
                title: `🔔 Match: ${search.name || 'Saved Search'}`,
                body: deal.title,
                icon: deal.image_url || '/icon-192.png',
                url: `/deal/${deal.id}`,
                type: 'saved_search_match',
                deal_id: deal.id,
                tag: `search-match-${deal.id}`
            });

            if (result.success && result.sent > 0) {
                sent++;
            }

            // Also queue in-app notification
            await supabase
                .from('notification_queue')
                .insert({
                    user_id: userId,
                    notification_type: 'saved_search_match',
                    title: `Match for "${search.name || 'Saved Search'}"`,
                    message: deal.title,
                    action_url: `/deal/${deal.id}`,
                    image_url: deal.image_url,
                    deal_id: deal.id,
                    saved_search_id: search.id,
                    status: 'pending',
                    priority: 'normal'
                });

        } catch (error) {
            console.error(`Error sending notification to user ${userId}:`, error);
        }
    }

    return sent;
}

/**
 * Process alerts for a specific deal (called when deal is approved)
 */
export async function processAlertsForDeal(dealId) {
    try {
        // Get the deal
        const { data: deal, error } = await supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();

        if (error || !deal) {
            console.error('Deal not found:', dealId);
            return { matches: 0, notifications: 0 };
        }

        // Get all active saved searches
        const { data: savedSearches } = await supabase
            .from('saved_searches')
            .select('*')
            .eq('alert_enabled', true);

        if (!savedSearches || savedSearches.length === 0) {
            return { matches: 0, notifications: 0 };
        }

        const userMatches = {};

        for (const search of savedSearches) {
            if (matchesSavedSearch(deal, search)) {
                if (!userMatches[search.user_id]) {
                    userMatches[search.user_id] = [];
                }
                userMatches[search.user_id].push({ deal, search });
            }
        }

        let totalNotifications = 0;
        for (const [userId, matches] of Object.entries(userMatches)) {
            const sent = await sendSearchAlertNotifications(userId, matches);
            totalNotifications += sent;
        }

        return {
            matches: Object.keys(userMatches).length,
            notifications: totalNotifications
        };

    } catch (error) {
        console.error('Error processing alerts for deal:', error);
        return { matches: 0, notifications: 0, error: error.message };
    }
}

export default {
    processNewDealAlerts,
    processAlertsForDeal
};
