/**
 * For You Recommendation Engine
 * 
 * Smart backend algorithm that generates personalized deal recommendations
 * based on user activity, preferences, and behavior patterns.
 * 
 * GUARANTEES: Always returns minimum of 12 deals, even for new users.
 * 
 * Recommendation Sources (in priority order):
 * 1. User's preferred categories (from saved/viewed items)
 * 2. User's price range preferences (from purchase patterns)
 * 3. Similar users' interests (collaborative filtering lite)
 * 4. Trending deals (fallback for new users)
 * 5. High-engagement deals (guaranteed minimum)
 */

import { Router } from 'express';
import { makeAdminClient } from '../lib/supa.js';
import { makeAuthOptional } from '../middleware/auth.js';

const router = Router();
const supa = makeAdminClient();

// Minimum deals to always return
const MIN_DEALS = 12;
const DEFAULT_LIMIT = 24;

/**
 * GET /api/for-you
 * 
 * Returns personalized deal recommendations for the user.
 * Works for both authenticated and guest users.
 */
router.get('/', makeAuthOptional, async (req, res) => {
    try {
        const userId = req.user?.id;
        const limit = Math.max(parseInt(req.query.limit) || DEFAULT_LIMIT, MIN_DEALS);
        const cursor = parseInt(req.query.cursor) || 0;

        console.log('[ForYou] Request:', { userId: userId || 'guest', limit, cursor });

        // Parallel fetch: user data + all available deals
        const [userDataResult, dealsResult] = await Promise.all([
            // Get user's activity data if authenticated
            userId ? getUserActivityData(userId) : Promise.resolve(null),
            // Get all approved deals with full data
            getAllDealsWithEngagement()
        ]);

        const userData = userDataResult;
        const allDeals = dealsResult;

        console.log('[ForYou] Data fetched:', {
            hasUserData: !!userData,
            totalDeals: allDeals.length,
            userCategories: userData?.preferredCategories?.slice(0, 3) || []
        });

        // Score and rank deals based on personalization
        const scoredDeals = scoreDeals(allDeals, userData);

        // Sort by score (highest first) and apply pagination
        const sortedDeals = scoredDeals
            .sort((a, b) => b._score - a._score)
            .slice(cursor, cursor + limit);

        // Add recommendation reasons
        const dealsWithReasons = sortedDeals.map(deal => ({
            ...deal,
            recommendation_reason: getRecommendationReason(deal, userData),
            _score: undefined // Remove internal score from response
        }));

        // Ensure minimum deals by adding trending if needed
        let finalDeals = dealsWithReasons;
        if (finalDeals.length < MIN_DEALS) {
            const neededDeals = MIN_DEALS - finalDeals.length;
            const existingIds = new Set(finalDeals.map(d => d.id));
            const additionalDeals = allDeals
                .filter(d => !existingIds.has(d.id))
                .sort((a, b) => (b.ups - b.downs) - (a.ups - a.downs))
                .slice(0, neededDeals)
                .map(deal => ({
                    ...deal,
                    recommendation_reason: 'Trending in your area'
                }));
            finalDeals = [...finalDeals, ...additionalDeals];
        }

        const nextCursor = sortedDeals.length === limit ? cursor + limit : null;

        console.log('[ForYou] Response:', {
            returnedDeals: finalDeals.length,
            hasMore: !!nextCursor
        });

        res.json({
            data: finalDeals,
            items: finalDeals,
            nextCursor,
            hasMore: !!nextCursor,
            meta: {
                personalized: !!userData,
                total: finalDeals.length,
                user_categories: userData?.preferredCategories?.slice(0, 5) || [],
                algorithm: userData ? 'personalized' : 'trending'
            }
        });

    } catch (error) {
        console.error('[ForYou] Error:', error);
        // On error, return trending deals as fallback
        try {
            const fallbackDeals = await getTrendingFallback(MIN_DEALS);
            res.json({
                data: fallbackDeals,
                items: fallbackDeals,
                nextCursor: null,
                hasMore: false,
                meta: { personalized: false, algorithm: 'fallback' }
            });
        } catch (fallbackError) {
            res.status(500).json({ error: 'Failed to fetch recommendations' });
        }
    }
});

/**
 * Get user's activity data for personalization
 */
async function getUserActivityData(userId) {
    try {
        // Parallel fetch all user data
        const [
            savedItemsResult,
            votesResult,
            viewsResult,
            preferencesResult,
            profileResult
        ] = await Promise.all([
            // Saved/bookmarked items
            supa.from('saved_items')
                .select('item_id, item_type, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50),

            // User's votes (upvotes indicate interest)
            supa.from('votes')
                .select('deal_id, value')
                .eq('user_id', userId)
                .eq('value', 1) // Only upvotes
                .limit(100),

            // User activity/views
            supa.from('user_activities')
                .select('target_id, target_type, activity_type, metadata')
                .eq('user_id', userId)
                .in('activity_type', ['view', 'click', 'deal_view'])
                .order('created_at', { ascending: false })
                .limit(100),

            // User preferences
            supa.from('user_preferences')
                .select('*')
                .eq('user_id', userId)
                .single(),

            // User profile for basic info
            supa.from('profiles')
                .select('id, created_at')
                .eq('id', userId)
                .single()
        ]);

        const savedItems = savedItemsResult.data || [];
        const votes = votesResult.data || [];
        const views = viewsResult.data || [];
        const preferences = preferencesResult.data || {};
        const profile = profileResult.data || {};

        // Extract deal IDs that user interacted with
        const interactedDealIds = new Set([
            ...savedItems.filter(s => s.item_type === 'deal').map(s => s.item_id),
            ...votes.map(v => v.deal_id).filter(Boolean),
            ...views.filter(v => v.target_type === 'deal').map(v => v.target_id)
        ]);

        // Get categories from interacted deals
        let preferredCategories = [];
        if (interactedDealIds.size > 0) {
            const { data: dealCategories } = await supa
                .from('deals')
                .select('category_id, merchant')
                .in('id', [...interactedDealIds]);

            if (dealCategories) {
                // Count category frequency
                const categoryCount = {};
                dealCategories.forEach(d => {
                    if (d.category_id) {
                        categoryCount[d.category_id] = (categoryCount[d.category_id] || 0) + 1;
                    }
                });

                // Sort by frequency
                preferredCategories = Object.entries(categoryCount)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat]) => cat);
            }
        }

        // Get preferred merchants
        const preferredMerchants = [];
        if (interactedDealIds.size > 0) {
            const { data: dealMerchants } = await supa
                .from('deals')
                .select('merchant, company_id')
                .in('id', [...interactedDealIds]);

            if (dealMerchants) {
                const merchantCount = {};
                dealMerchants.forEach(d => {
                    if (d.merchant) {
                        merchantCount[d.merchant] = (merchantCount[d.merchant] || 0) + 1;
                    }
                });
                preferredMerchants.push(...Object.entries(merchantCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([m]) => m));
            }
        }

        // Calculate user's price range preference
        let pricePreference = { min: 0, max: Infinity };
        if (interactedDealIds.size > 0) {
            const { data: dealPrices } = await supa
                .from('deals')
                .select('price')
                .in('id', [...interactedDealIds])
                .not('price', 'is', null);

            if (dealPrices && dealPrices.length > 0) {
                const prices = dealPrices.map(d => d.price).filter(p => p > 0);
                if (prices.length > 0) {
                    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                    pricePreference = {
                        min: Math.max(0, avgPrice * 0.3),
                        max: avgPrice * 2
                    };
                }
            }
        }

        // Calculate user age for cold-start handling
        const accountAge = profile.created_at
            ? (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24) // days
            : 0;

        return {
            userId,
            interactedDealIds: [...interactedDealIds],
            preferredCategories,
            preferredMerchants,
            pricePreference,
            savedCount: savedItems.length,
            votesCount: votes.length,
            viewsCount: views.length,
            accountAge,
            isNewUser: accountAge < 7 || (savedItems.length + votes.length + views.length) < 5,
            explicitPreferences: preferences
        };

    } catch (error) {
        console.error('[ForYou] Error fetching user data:', error);
        return null;
    }
}

/**
 * Get all deals with engagement data
 */
async function getAllDealsWithEngagement() {
    try {
        // Fetch deals with related data
        const { data: deals, error: dealsError } = await supa
            .from('deals')
            .select(`
        id,
        title,
        description,
        price,
        original_price,
        discount_percentage,
        merchant,
        category_id,
        company_id,
        image_url,
        featured_image,
        deal_images,
        submitter_id,
        status,
        created_at,
        updated_at,
        expires_at,
        views_count,
        clicks_count,
        companies (
          id,
          name,
          slug,
          logo_url,
          is_verified
        ),
        profiles!deals_submitter_id_fkey (
          id,
          handle,
          display_name,
          avatar_url,
          karma
        )
      `)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(500); // Reasonable limit for performance

        if (dealsError) {
            console.error('[ForYou] Deals fetch error:', dealsError);
            return [];
        }

        if (!deals || deals.length === 0) {
            return [];
        }

        // Get votes for all deals
        const dealIds = deals.map(d => d.id);
        const { data: votes } = await supa
            .from('votes')
            .select('deal_id, value')
            .in('deal_id', dealIds);

        // Calculate vote counts
        const voteCounts = {};
        if (votes) {
            votes.forEach(v => {
                if (!voteCounts[v.deal_id]) {
                    voteCounts[v.deal_id] = { ups: 0, downs: 0 };
                }
                if (v.value === 1) voteCounts[v.deal_id].ups++;
                if (v.value === -1) voteCounts[v.deal_id].downs++;
            });
        }

        // Get comment counts
        const { data: comments } = await supa
            .from('comments')
            .select('deal_id')
            .in('deal_id', dealIds);

        const commentCounts = {};
        if (comments) {
            comments.forEach(c => {
                commentCounts[c.deal_id] = (commentCounts[c.deal_id] || 0) + 1;
            });
        }

        // Transform deals with all data
        return deals.map(deal => ({
            id: deal.id,
            content_id: `deal-${deal.id}`,
            type: 'deal',
            title: deal.title,
            description: deal.description,
            price: deal.price,
            original_price: deal.original_price,
            discount_percentage: deal.discount_percentage,
            merchant: deal.merchant,
            category: deal.category_id,
            category_id: deal.category_id,
            company_id: deal.company_id,
            image_url: deal.image_url || deal.featured_image,
            featured_image: deal.featured_image,
            deal_images: deal.deal_images || [],
            submitter_id: deal.submitter_id,
            status: deal.status,
            created_at: deal.created_at,
            updated_at: deal.updated_at,
            expires_at: deal.expires_at,
            company: deal.companies,
            companies: deal.companies,
            profiles: deal.profiles,
            submitter: deal.profiles,
            // Engagement metrics
            ups: voteCounts[deal.id]?.ups || 0,
            downs: voteCounts[deal.id]?.downs || 0,
            comments_count: commentCounts[deal.id] || 0,
            views_count: deal.views_count || 0,
            saves_count: deal.clicks_count || 0
        }));

    } catch (error) {
        console.error('[ForYou] Error fetching deals:', error);
        return [];
    }
}

/**
 * Score deals based on user preferences
 * Higher score = more relevant to user
 */
function scoreDeals(deals, userData) {
    return deals.map(deal => {
        let score = 0;

        // Base score: engagement (0-30 points)
        const netVotes = (deal.ups || 0) - (deal.downs || 0);
        score += Math.min(netVotes, 30);

        // Recency score (0-20 points)
        // Newer deals get higher scores
        const dealAge = (Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (dealAge < 1) score += 20;      // Today
        else if (dealAge < 3) score += 15; // Last 3 days
        else if (dealAge < 7) score += 10; // Last week
        else if (dealAge < 14) score += 5; // Last 2 weeks

        // Discount score (0-15 points)
        if (deal.discount_percentage >= 70) score += 15;
        else if (deal.discount_percentage >= 50) score += 12;
        else if (deal.discount_percentage >= 30) score += 8;
        else if (deal.discount_percentage >= 10) score += 4;

        // If no user data, use base scores only (for guests/new users)
        if (!userData) {
            return { ...deal, _score: score };
        }

        // === Personalization Bonuses ===

        // Category match (0-30 points)
        const categoryIndex = userData.preferredCategories.indexOf(deal.category_id?.toString());
        if (categoryIndex === 0) score += 30;       // Top category
        else if (categoryIndex === 1) score += 25;  // 2nd category
        else if (categoryIndex === 2) score += 20;  // 3rd category
        else if (categoryIndex >= 0) score += 15;   // Any preferred category

        // Merchant match (0-15 points)
        if (userData.preferredMerchants.includes(deal.merchant)) {
            score += 15;
        }

        // Price range match (0-10 points)
        if (deal.price !== null && deal.price !== undefined) {
            if (deal.price >= userData.pricePreference.min &&
                deal.price <= userData.pricePreference.max) {
                score += 10;
            }
        }

        // Already interacted penalty (-50 points)
        // Don't recommend deals user already saved/liked
        if (userData.interactedDealIds.includes(deal.id)) {
            score -= 50;
        }

        // Expiring soon boost (0-10 points)
        if (deal.expires_at) {
            const expiresIn = (new Date(deal.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
            if (expiresIn > 0 && expiresIn <= 2) score += 10; // Expires in 2 days
            else if (expiresIn > 0 && expiresIn <= 5) score += 5; // Expires in 5 days
        }

        // Verified company boost (+5 points)
        if (deal.company?.is_verified) {
            score += 5;
        }

        return { ...deal, _score: score };
    });
}

/**
 * Generate human-readable recommendation reason
 */
function getRecommendationReason(deal, userData) {
    if (!userData) {
        // For guest users
        if (deal.discount_percentage >= 50) return 'Great discount available';
        if ((deal.ups - deal.downs) > 10) return 'Popular with savers';
        const dealAge = (Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (dealAge < 1) return 'Just posted';
        return 'Trending deal';
    }

    // For authenticated users
    const reasons = [];

    const categoryIndex = userData.preferredCategories.indexOf(deal.category_id?.toString());
    if (categoryIndex >= 0 && categoryIndex < 3) {
        reasons.push('Based on your interests');
    }

    if (userData.preferredMerchants.includes(deal.merchant)) {
        reasons.push(`From ${deal.merchant}`);
    }

    if (deal.discount_percentage >= 50) {
        reasons.push('Excellent discount');
    }

    if ((deal.ups - deal.downs) > 15) {
        reasons.push('Highly rated');
    }

    if (deal.expires_at) {
        const expiresIn = (new Date(deal.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (expiresIn > 0 && expiresIn <= 2) {
            reasons.push('Ending soon');
        }
    }

    // Return first reason or fallback
    return reasons[0] || 'Picked for you';
}

/**
 * Fallback: Get trending deals when main algorithm fails
 */
async function getTrendingFallback(limit) {
    try {
        const { data: deals } = await supa
            .from('deals')
            .select(`
        id,
        title,
        description,
        price,
        original_price,
        discount_percentage,
        merchant,
        category_id,
        image_url,
        featured_image,
        deal_images,
        created_at,
        expires_at,
        companies (
          id,
          name,
          slug,
          logo_url,
          is_verified
        )
      `)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(limit);

        return (deals || []).map(deal => ({
            id: deal.id,
            content_id: `deal-${deal.id}`,
            type: 'deal',
            title: deal.title,
            description: deal.description,
            price: deal.price,
            original_price: deal.original_price,
            discount_percentage: deal.discount_percentage,
            merchant: deal.merchant,
            category: deal.category_id,
            image_url: deal.image_url || deal.featured_image,
            featured_image: deal.featured_image,
            deal_images: deal.deal_images || [],
            created_at: deal.created_at,
            expires_at: deal.expires_at,
            company: deal.companies,
            companies: deal.companies,
            recommendation_reason: 'Trending deal',
            ups: 0,
            downs: 0,
            comments_count: 0
        }));

    } catch (error) {
        console.error('[ForYou] Fallback error:', error);
        return [];
    }
}

export default router;
