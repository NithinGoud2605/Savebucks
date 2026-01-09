/**
 * AI Tools Definition and Execution
 * Defines all tools the AI can use to query the database
 */

import { makeAdminClient } from '../supa.js';
import { AI_CONFIG } from './config.js';

const supabase = makeAdminClient();

/**
 * Tool definitions for OpenAI function calling
 * These are sent to OpenAI to tell it what functions are available
 */
export const TOOL_DEFINITIONS = [
    {
        type: 'function',
        function: {
            name: 'search_deals',
            description: 'Search for deals matching user criteria. Use when user wants to find products or deals.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search terms (product name, type, or description)'
                    },
                    category: {
                        type: 'string',
                        description: 'Product category filter',
                        enum: ['electronics', 'fashion', 'home', 'beauty', 'toys', 'food', 'travel', 'other']
                    },
                    max_price: {
                        type: 'number',
                        description: 'Maximum price in USD'
                    },
                    min_discount: {
                        type: 'number',
                        description: 'Minimum discount percentage (0-100)'
                    },
                    store: {
                        type: 'string',
                        description: 'Filter by specific store/merchant name'
                    },
                    sort_by: {
                        type: 'string',
                        description: 'How to sort results',
                        enum: ['relevance', 'price_low', 'price_high', 'discount', 'newest', 'popular'],
                        default: 'relevance'
                    },
                    exclude_ids: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Array of deal IDs to exclude (already shown deals)'
                    }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_coupons',
            description: 'Get active coupon codes for a store or category.',
            parameters: {
                type: 'object',
                properties: {
                    store: {
                        type: 'string',
                        description: 'Store name or domain to find coupons for'
                    },
                    category: {
                        type: 'string',
                        description: 'Optional category filter'
                    }
                },
                required: ['store']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_trending_deals',
            description: 'Get currently trending/hot deals with high community engagement.',
            parameters: {
                type: 'object',
                properties: {
                    category: {
                        type: 'string',
                        description: 'Optional category filter'
                    },
                    limit: {
                        type: 'integer',
                        description: 'Number of deals to return (max 10)',
                        default: 5
                    }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_deal_details',
            description: 'Get detailed information about a specific deal including price history.',
            parameters: {
                type: 'object',
                properties: {
                    deal_id: {
                        type: 'string',
                        description: 'Deal ID to get details for'
                    }
                },
                required: ['deal_id']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'compare_deals',
            description: 'Compare multiple deals side by side.',
            parameters: {
                type: 'object',
                properties: {
                    deal_ids: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Array of deal IDs to compare (2-5 deals)'
                    }
                },
                required: ['deal_ids']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_store_info',
            description: 'Get information about a retailer/store including ratings and available deals.',
            parameters: {
                type: 'object',
                properties: {
                    store: {
                        type: 'string',
                        description: 'Store name to get info about'
                    }
                },
                required: ['store']
            }
        }
    }
];

/**
 * Tool executors - actual implementation of each tool
 */
const TOOL_EXECUTORS = {
    /**
     * Search for deals
     */
    async search_deals({ query, category, max_price, min_discount, store, sort_by = 'relevance', exclude_ids = [] }) {
        try {
            let dbQuery = supabase
                .from('deals')
                .select(`
          id, title, url, price, original_price, merchant, description,
          image_url, views_count, clicks_count, created_at,
          expires_at, status
        `)
                .eq('status', 'approved')
                .limit(AI_CONFIG.limits.maxToolResults);

            // Text search
            if (query) {
                dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,merchant.ilike.%${query}%`);
            }

            // Price filter
            if (max_price) {
                dbQuery = dbQuery.lte('price', max_price);
            }

            // Store filter
            if (store) {
                dbQuery = dbQuery.ilike('merchant', `%${store}%`);
            }

            // Exclude already shown deals
            if (exclude_ids && exclude_ids.length > 0) {
                // Ensure IDs are valid format (UUIDs usually)
                const safeIds = exclude_ids.filter(id => typeof id === 'string' && id.length > 0);
                if (safeIds.length > 0) {
                    dbQuery = dbQuery.not('id', 'in', `(${safeIds.map(id => `"${id}"`).join(',')})`);
                }
            }

            // Sorting
            switch (sort_by) {
                case 'price_low':
                    dbQuery = dbQuery.order('price', { ascending: true });
                    break;
                case 'price_high':
                    dbQuery = dbQuery.order('price', { ascending: false });
                    break;
                case 'newest':
                    dbQuery = dbQuery.order('created_at', { ascending: false });
                    break;
                case 'popular':
                    dbQuery = dbQuery.order('views_count', { ascending: false });
                    break;
                default:
                    dbQuery = dbQuery.order('views_count', { ascending: false });
            }

            const { data: deals, error } = await dbQuery;

            if (error) {
                console.error('[Tools] search_deals error:', error.message);
                return { success: false, error: error.message, deals: [] };
            }

            // Calculate discount percentages and enrich with metadata
            const dealsWithDiscount = (deals || []).map(deal => {
                const discount_percent = deal.original_price && deal.price
                    ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
                    : null;

                const votes = 0; // Not available in schema
                const engagement = (deal.views_count || 0) + (deal.clicks_count || 0);
                const isUrgent = deal.expires_at && new Date(deal.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                // Value score for personalization (higher is better)
                let valueScore = 0;
                if (discount_percent) valueScore += discount_percent * 2;
                if (engagement > 20) valueScore += Math.min(engagement * 0.3, 15);
                if (isUrgent) valueScore += 10;

                return {
                    ...deal,
                    discount_percent,
                    votes_score: votes,
                    engagement_score: engagement,
                    is_urgent: isUrgent,
                    value_score: Math.round(valueScore),
                    urgency_days: deal.expires_at ? Math.ceil((new Date(deal.expires_at) - Date.now()) / (1000 * 60 * 60 * 24)) : null
                };
            });

            // Filter by discount if specified
            let filteredDeals = dealsWithDiscount;
            if (min_discount) {
                filteredDeals = dealsWithDiscount.filter(d => d.discount_percent && d.discount_percent >= min_discount);
            }

            return {
                success: true,
                deals: filteredDeals,
                count: filteredDeals.length,
                query: { query, category, max_price, min_discount, store, sort_by },
                metadata: {
                    avg_discount: filteredDeals.length > 0
                        ? Math.round(filteredDeals.reduce((sum, d) => sum + (d.discount_percent || 0), 0) / filteredDeals.length)
                        : 0,
                    total_engagement: filteredDeals.reduce((sum, d) => sum + d.engagement_score, 0),
                    urgent_count: filteredDeals.filter(d => d.is_urgent).length
                }
            };
        } catch (error) {
            console.error('[Tools] search_deals exception:', error.message);
            return { success: false, error: error.message, deals: [] };
        }
    },

    /**
     * Get coupons for a store
     */
    async get_coupons({ store, category }) {
        try {
            // First, find the company
            let companyQuery = supabase
                .from('companies')
                .select('id, name, domain, logo_url')
                .or(`name.ilike.%${store}%,domain.ilike.%${store}%`)
                .limit(1);

            const { data: companies } = await companyQuery;
            const company = companies?.[0];

            // Get coupons
            let couponQuery = supabase
                .from('coupons')
                .select(`
          id, title, description, coupon_code, discount_value, discount_type,
          min_purchase, expires_at, is_verified, usage_count,
          company:companies(id, name, logo_url)
        `)
                .eq('is_active', true)
                .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
                .order('is_verified', { ascending: false })
                .order('usage_count', { ascending: false })
                .limit(AI_CONFIG.limits.maxToolResults);

            if (company) {
                couponQuery = couponQuery.eq('company_id', company.id);
            } else {
                // Search by store name in coupon title/description
                couponQuery = couponQuery.or(`title.ilike.%${store}%,description.ilike.%${store}%`);
            }

            const { data: coupons, error } = await couponQuery;

            if (error) {
                console.error('[Tools] get_coupons error:', error.message);
                return { success: false, error: error.message, coupons: [] };
            }

            return {
                success: true,
                coupons: coupons || [],
                count: coupons?.length || 0,
                store: company?.name || store
            };
        } catch (error) {
            console.error('[Tools] get_coupons exception:', error.message);
            return { success: false, error: error.message, coupons: [] };
        }
    },

    /**
     * Get trending deals
     */
    async get_trending_deals({ category, limit = 5 }) {
        try {
            const safeLimit = Math.min(limit, AI_CONFIG.limits.maxToolResults);

            let query = supabase
                .from('deals')
                .select(`
          id, title, url, price, original_price, merchant, description,
          image_url, views_count, clicks_count, created_at
        `)
                .eq('status', 'approved')
                .order('views_count', { ascending: false })
                .limit(safeLimit);

            // TODO: Add category filter when category_id is available

            const { data: deals, error } = await query;

            if (error) {
                console.error('[Tools] get_trending_deals error:', error.message);
                return { success: false, error: error.message, deals: [] };
            }

            const dealsWithDiscount = (deals || []).map(deal => {
                const discount_percent = deal.original_price && deal.price
                    ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
                    : null;

                const votes = (deal.votes_up || 0) - (deal.votes_down || 0);
                const engagement = (deal.votes_up || 0) + (deal.comment_count || 0);

                return {
                    ...deal,
                    discount_percent,
                    votes_score: votes,
                    engagement_score: engagement,
                    is_trending: engagement > 30 || votes > 20,
                    value_score: Math.round((discount_percent || 0) * 2 + Math.min(votes * 0.5, 20) + Math.min(engagement * 0.3, 15))
                };
            });

            return {
                success: true,
                deals: dealsWithDiscount,
                count: dealsWithDiscount.length,
                metadata: {
                    trending_count: dealsWithDiscount.filter(d => d.is_trending).length,
                    avg_engagement: dealsWithDiscount.length > 0
                        ? Math.round(dealsWithDiscount.reduce((sum, d) => sum + d.engagement_score, 0) / dealsWithDiscount.length)
                        : 0
                }
            };
        } catch (error) {
            console.error('[Tools] get_trending_deals exception:', error.message);
            return { success: false, error: error.message, deals: [] };
        }
    },

    /**
     * Get deal details with price history
     */
    async get_deal_details({ deal_id }) {
        try {
            const { data: deal, error } = await supabase
                .from('deals')
                .select(`
          id, title, url, price, original_price, merchant, description,
          image_url, votes_up, votes_down, comment_count, created_at,
          expires_at, status,
          company:companies(id, name, logo_url, domain)
        `)
                .eq('id', deal_id)
                .single();

            if (error || !deal) {
                return { success: false, error: 'Deal not found', deal: null };
            }

            // Get price history if available
            let priceHistory = [];
            try {
                const { data: history } = await supabase
                    .from('price_history')
                    .select('price, recorded_at')
                    .eq('deal_id', deal_id)
                    .order('recorded_at', { ascending: false })
                    .limit(30);
                priceHistory = history || [];
            } catch (e) {
                // Price history table might not exist
            }

            return {
                success: true,
                deal: {
                    ...deal,
                    discount_percent: deal.original_price && deal.price
                        ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
                        : null,
                    price_history: priceHistory
                }
            };
        } catch (error) {
            console.error('[Tools] get_deal_details exception:', error.message);
            return { success: false, error: error.message, deal: null };
        }
    },

    /**
     * Compare multiple deals
     */
    async compare_deals({ deal_ids }) {
        try {
            if (!deal_ids || deal_ids.length < 2) {
                return { success: false, error: 'Need at least 2 deals to compare', deals: [] };
            }

            const { data: deals, error } = await supabase
                .from('deals')
                .select(`
          id, title, url, price, original_price, merchant, description,
          image_url, votes_up, votes_down, comment_count
        `)
                .in('id', deal_ids.slice(0, 5)); // Max 5 deals

            if (error) {
                return { success: false, error: error.message, deals: [] };
            }

            const dealsWithDiscount = (deals || []).map(deal => ({
                ...deal,
                discount_percent: deal.original_price && deal.price
                    ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
                    : null,
                score: (deal.votes_up || 0) - (deal.votes_down || 0)
            }));

            return {
                success: true,
                deals: dealsWithDiscount,
                count: dealsWithDiscount.length
            };
        } catch (error) {
            console.error('[Tools] compare_deals exception:', error.message);
            return { success: false, error: error.message, deals: [] };
        }
    },

    /**
     * Get store/company information
     */
    async get_store_info({ store }) {
        try {
            const { data: company, error } = await supabase
                .from('companies')
                .select(`
          id, name, domain, logo_url, description, website,
          is_verified, rating, review_count
        `)
                .or(`name.ilike.%${store}%,domain.ilike.%${store}%`)
                .limit(1)
                .single();

            if (error || !company) {
                return { success: false, error: 'Store not found', store: null };
            }

            // Get deal and coupon counts
            const [{ count: dealCount }, { count: couponCount }] = await Promise.all([
                supabase.from('deals').select('id', { count: 'exact', head: true })
                    .ilike('merchant', `%${company.name}%`).eq('status', 'approved'),
                supabase.from('coupons').select('id', { count: 'exact', head: true })
                    .eq('company_id', company.id).eq('is_active', true)
            ]);

            return {
                success: true,
                store: {
                    ...company,
                    active_deals: dealCount || 0,
                    active_coupons: couponCount || 0
                }
            };
        } catch (error) {
            console.error('[Tools] get_store_info exception:', error.message);
            return { success: false, error: error.message, store: null };
        }
    }
};

/**
 * Execute a tool by name
 * @param {string} name - Tool name
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} Tool execution result
 */
export async function executeTool(name, args) {
    const executor = TOOL_EXECUTORS[name];

    if (!executor) {
        console.error(`[Tools] Unknown tool: ${name}`);
        return { success: false, error: `Unknown tool: ${name}` };
    }

    const startTime = Date.now();

    try {
        const result = await executor(args);
        result.executionTime = Date.now() - startTime;
        return result;
    } catch (error) {
        console.error(`[Tools] Error executing ${name}:`, error);
        return {
            success: false,
            error: error.message,
            executionTime: Date.now() - startTime
        };
    }
}

/**
 * Execute multiple tool calls in parallel
 * @param {Array} toolCalls - Array of {name, arguments} objects
 * @returns {Promise<Object>} Object with tool name as key, result as value
 */
export async function executeToolCalls(toolCalls) {
    if (!toolCalls || toolCalls.length === 0) {
        return {};
    }

    const results = await Promise.all(
        toolCalls.map(async (call) => {
            const args = typeof call.function.arguments === 'string'
                ? JSON.parse(call.function.arguments)
                : call.function.arguments;

            const result = await executeTool(call.function.name, args);
            return {
                id: call.id,
                name: call.function.name,
                result
            };
        })
    );

    // Convert to object keyed by call ID
    return results.reduce((acc, { id, name, result }) => {
        acc[id] = { name, ...result };
        return acc;
    }, {});
}

export default {
    TOOL_DEFINITIONS,
    executeTool,
    executeToolCalls
};
