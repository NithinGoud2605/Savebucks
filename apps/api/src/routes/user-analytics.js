/**
 * Analytics API Routes
 * 
 * Provides user engagement statistics and deal performance metrics.
 */

import express from 'express';
import { makeAdminClient } from '../lib/supa.js';

const router = express.Router();
const supabase = makeAdminClient();

// Helper: Check authentication
const requireAuth = (req, res, next) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

/**
 * GET /api/analytics/me
 * Get current user's analytics summary
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Get user's deals performance
        const { data: deals } = await supabase
            .from('deals')
            .select('id, title, created_at, views_count, clicks_count')
            .eq('submitter_id', userId)
            .gte('created_at', startDate.toISOString());

        const dealIds = deals?.map(d => d.id) || [];

        // Get votes on user's deals
        let totalUpvotes = 0;
        let totalDownvotes = 0;
        if (dealIds.length > 0) {
            const { data: votes } = await supabase
                .from('votes')
                .select('value')
                .in('deal_id', dealIds);

            votes?.forEach(v => {
                if (v.value === 1) totalUpvotes++;
                if (v.value === -1) totalDownvotes++;
            });
        }

        // Get comments on user's deals
        let commentsReceived = 0;
        if (dealIds.length > 0) {
            const { count } = await supabase
                .from('comments')
                .select('id', { count: 'exact', head: true })
                .in('deal_id', dealIds);
            commentsReceived = count || 0;
        }

        // Get saves on user's deals
        let savesReceived = 0;
        if (dealIds.length > 0) {
            const { count } = await supabase
                .from('saved_items')
                .select('id', { count: 'exact', head: true })
                .eq('item_type', 'deal')
                .in('item_id', dealIds);
            savesReceived = count || 0;
        }

        // Get user's comments count
        const { count: commentsMade } = await supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', startDate.toISOString());

        // Get user profile for karma
        const { data: profile } = await supabase
            .from('profiles')
            .select('karma, created_at')
            .eq('id', userId)
            .single();

        const totalViews = deals?.reduce((sum, d) => sum + (d.views_count || 0), 0) || 0;
        const totalClicks = deals?.reduce((sum, d) => sum + (d.clicks_count || 0), 0) || 0;

        res.json({
            period: `${days} days`,
            deals_posted: deals?.length || 0,
            total_views: totalViews,
            total_clicks: totalClicks,
            upvotes_received: totalUpvotes,
            downvotes_received: totalDownvotes,
            net_votes: totalUpvotes - totalDownvotes,
            comments_received: commentsReceived,
            comments_made: commentsMade || 0,
            saves_received: savesReceived,
            total_karma: profile?.karma || 0,
            engagement_rate: totalViews > 0
                ? ((totalUpvotes + commentsReceived + savesReceived) / totalViews * 100).toFixed(2)
                : 0,
            member_since: profile?.created_at
        });

    } catch (error) {
        console.error('Error fetching user analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/analytics/deals
 * Get performance analytics for user's deals
 */
router.get('/deals', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10, sort = 'views' } = req.query;

        // Get user's deals
        const { data: deals, error } = await supabase
            .from('deals')
            .select(`
        id, title, created_at, views_count, clicks_count, status,
        image_url, price, original_price, discount_percentage
      `)
            .eq('submitter_id', userId)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        if (!deals || deals.length === 0) {
            return res.json([]);
        }

        const dealIds = deals.map(d => d.id);

        // Get votes for all deals
        const { data: votes } = await supabase
            .from('votes')
            .select('deal_id, value')
            .in('deal_id', dealIds);

        // Get comment counts
        const { data: comments } = await supabase
            .from('comments')
            .select('deal_id')
            .in('deal_id', dealIds);

        // Get saves counts
        const { data: saves } = await supabase
            .from('saved_items')
            .select('item_id')
            .eq('item_type', 'deal')
            .in('item_id', dealIds);

        // Aggregate stats per deal
        const dealStats = deals.map(deal => {
            const dealVotes = votes?.filter(v => v.deal_id === deal.id) || [];
            const upvotes = dealVotes.filter(v => v.value === 1).length;
            const downvotes = dealVotes.filter(v => v.value === -1).length;
            const commentCount = comments?.filter(c => c.deal_id === deal.id).length || 0;
            const saveCount = saves?.filter(s => s.item_id === deal.id).length || 0;

            return {
                ...deal,
                upvotes,
                downvotes,
                net_votes: upvotes - downvotes,
                comments: commentCount,
                saves: saveCount,
                engagement_score: upvotes + commentCount * 2 + saveCount * 3
            };
        });

        // Sort by requested field
        const sortedDeals = dealStats.sort((a, b) => {
            switch (sort) {
                case 'votes': return b.net_votes - a.net_votes;
                case 'comments': return b.comments - a.comments;
                case 'saves': return b.saves - a.saves;
                case 'engagement': return b.engagement_score - a.engagement_score;
                default: return (b.views_count || 0) - (a.views_count || 0);
            }
        });

        res.json(sortedDeals);

    } catch (error) {
        console.error('Error fetching deal analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/analytics/timeline
 * Get user's activity over time (for charts)
 */
router.get('/timeline', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Get daily deal counts
        const { data: deals } = await supabase
            .from('deals')
            .select('created_at')
            .eq('submitter_id', userId)
            .gte('created_at', startDate.toISOString());

        // Get daily comment counts
        const { data: comments } = await supabase
            .from('comments')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', startDate.toISOString());

        // Aggregate by day
        const timeline = {};
        for (let i = 0; i < parseInt(days); i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            timeline[dateKey] = { date: dateKey, deals: 0, comments: 0 };
        }

        deals?.forEach(d => {
            const dateKey = d.created_at.split('T')[0];
            if (timeline[dateKey]) timeline[dateKey].deals++;
        });

        comments?.forEach(c => {
            const dateKey = c.created_at.split('T')[0];
            if (timeline[dateKey]) timeline[dateKey].comments++;
        });

        // Convert to sorted array
        const timelineArray = Object.values(timeline).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        res.json(timelineArray);

    } catch (error) {
        console.error('Error fetching timeline:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/analytics/top-categories
 * Get user's most active categories
 */
router.get('/top-categories', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: deals } = await supabase
            .from('deals')
            .select(`
        category_id,
        categories(id, name, slug, icon)
      `)
            .eq('submitter_id', userId)
            .not('category_id', 'is', null);

        // Aggregate by category
        const categoryCounts = {};
        deals?.forEach(d => {
            if (d.category_id && d.categories) {
                if (!categoryCounts[d.category_id]) {
                    categoryCounts[d.category_id] = {
                        ...d.categories,
                        count: 0
                    };
                }
                categoryCounts[d.category_id].count++;
            }
        });

        // Sort by count and take top 5
        const topCategories = Object.values(categoryCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json(topCategories);

    } catch (error) {
        console.error('Error fetching top categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
