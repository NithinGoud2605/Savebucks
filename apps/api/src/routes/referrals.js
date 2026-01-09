/**
 * Referral System API Routes
 * 
 * Handles:
 * - Generating unique referral codes
 * - Tracking referrals on signup
 * - Claiming rewards
 * - Referral stats dashboard
 */

import express from 'express';
import { makeAdminClient } from '../lib/supa.js';
import crypto from 'crypto';

const router = express.Router();
const supabase = makeAdminClient();

// Helper: Check authentication
const requireAuth = (req, res, next) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

// Generate a unique referral code
function generateReferralCode() {
    // Format: 6 alphanumeric characters (easy to share)
    return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
}

/**
 * GET /api/referrals/my-code
 * Get or create user's referral code
 */
router.get('/my-code', requireAuth, async (req, res) => {
    try {
        // Check for existing code
        let { data: existingCode, error } = await supabase
            .from('referral_codes')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') {
            return res.status(400).json({ error: error.message });
        }

        // If no code exists, create one
        if (!existingCode) {
            let code = generateReferralCode();
            let attempts = 0;

            // Ensure uniqueness
            while (attempts < 5) {
                const { data: duplicate } = await supabase
                    .from('referral_codes')
                    .select('id')
                    .eq('code', code)
                    .single();

                if (!duplicate) break;
                code = generateReferralCode();
                attempts++;
            }

            const { data: newCode, error: createError } = await supabase
                .from('referral_codes')
                .insert({
                    user_id: req.user.id,
                    code,
                    reward_per_referral: 100 // Default: 100 points
                })
                .select()
                .single();

            if (createError) {
                return res.status(400).json({ error: createError.message });
            }

            existingCode = newCode;
        }

        // Get referral link
        const baseUrl = process.env.VITE_SITE_URL || 'http://localhost:5173';
        const referralLink = `${baseUrl}/signup?ref=${existingCode.code}`;

        res.json({
            code: existingCode.code,
            link: referralLink,
            uses_count: existingCode.uses_count,
            reward_per_referral: existingCode.reward_per_referral,
            is_active: existingCode.is_active,
            created_at: existingCode.created_at
        });

    } catch (error) {
        console.error('Error getting referral code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/referrals/stats
 * Get user's referral statistics
 */
router.get('/stats', requireAuth, async (req, res) => {
    try {
        // Get all referrals made by user
        const { data: referrals, error } = await supabase
            .from('referrals')
            .select(`
        id, status, referrer_reward, created_at, completed_at,
        referred:profiles!referrals_referred_id_fkey(
          id, handle, display_name, avatar_url
        )
      `)
            .eq('referrer_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Calculate stats
        const stats = {
            total_referrals: referrals?.length || 0,
            pending: referrals?.filter(r => r.status === 'pending').length || 0,
            completed: referrals?.filter(r => r.status === 'completed' || r.status === 'rewarded').length || 0,
            total_earned: referrals?.reduce((sum, r) => sum + (r.referrer_reward || 0), 0) || 0,
            referrals: referrals || []
        };

        res.json(stats);

    } catch (error) {
        console.error('Error getting referral stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/referrals/validate
 * Validate a referral code (for signup page)
 */
router.post('/validate', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }

        const { data: referralCode, error } = await supabase
            .from('referral_codes')
            .select(`
        id, code, is_active, uses_count, max_uses,
        user:profiles!referral_codes_user_id_fkey(
          handle, display_name, avatar_url
        )
      `)
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error || !referralCode) {
            return res.status(404).json({ valid: false, error: 'Invalid referral code' });
        }

        // Check if max uses reached
        if (referralCode.max_uses && referralCode.uses_count >= referralCode.max_uses) {
            return res.status(400).json({ valid: false, error: 'Referral code has reached maximum uses' });
        }

        res.json({
            valid: true,
            referrer: referralCode.user
        });

    } catch (error) {
        console.error('Error validating referral code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/referrals/apply
 * Apply a referral code during/after signup
 * Called internally when a new user signs up with a referral code
 */
router.post('/apply', requireAuth, async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Referral code is required' });
        }

        // Check if user already has a referrer
        const { data: existingReferral } = await supabase
            .from('referrals')
            .select('id')
            .eq('referred_id', req.user.id)
            .single();

        if (existingReferral) {
            return res.status(400).json({ error: 'You have already been referred' });
        }

        // Get the referral code
        const { data: referralCode, error: codeError } = await supabase
            .from('referral_codes')
            .select('id, user_id, reward_per_referral')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (codeError || !referralCode) {
            return res.status(404).json({ error: 'Invalid referral code' });
        }

        // Can't refer yourself
        if (referralCode.user_id === req.user.id) {
            return res.status(400).json({ error: 'Cannot use your own referral code' });
        }

        // Create the referral record
        const { data: referral, error: referralError } = await supabase
            .from('referrals')
            .insert({
                referrer_id: referralCode.user_id,
                referred_id: req.user.id,
                referral_code_id: referralCode.id,
                status: 'pending',
                referrer_reward: referralCode.reward_per_referral,
                referred_reward: 50 // Bonus for new user
            })
            .select()
            .single();

        if (referralError) {
            console.error('Error creating referral:', referralError);
            return res.status(400).json({ error: referralError.message });
        }

        // Increment the code's use count
        await supabase
            .from('referral_codes')
            .update({ uses_count: referralCode.uses_count + 1 })
            .eq('id', referralCode.id);

        res.json({
            success: true,
            message: 'Referral applied successfully!',
            bonus: 50, // Points bonus for being referred
            referral
        });

    } catch (error) {
        console.error('Error applying referral:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/referrals/complete/:referralId
 * Mark a referral as completed and award points
 * Called when referred user completes a qualifying action
 */
router.post('/complete/:referralId', async (req, res) => {
    try {
        const { referralId } = req.params;

        // Get the referral
        const { data: referral, error } = await supabase
            .from('referrals')
            .select('*')
            .eq('id', referralId)
            .eq('status', 'pending')
            .single();

        if (error || !referral) {
            return res.status(404).json({ error: 'Referral not found or already completed' });
        }

        // Update referral status
        const { error: updateError } = await supabase
            .from('referrals')
            .update({
                status: 'rewarded',
                completed_at: new Date().toISOString(),
                rewarded_at: new Date().toISOString()
            })
            .eq('id', referralId);

        if (updateError) {
            return res.status(400).json({ error: updateError.message });
        }

        // Award karma to referrer
        await supabase.rpc('increment_karma', {
            user_id: referral.referrer_id,
            amount: referral.referrer_reward
        });

        // Award karma to referred user
        await supabase.rpc('increment_karma', {
            user_id: referral.referred_id,
            amount: referral.referred_reward
        });

        res.json({
            success: true,
            message: 'Referral completed and rewards distributed!'
        });

    } catch (error) {
        console.error('Error completing referral:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/referrals/leaderboard
 * Get top referrers
 */
router.get('/leaderboard', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const { data, error } = await supabase
            .from('referrals')
            .select(`
        referrer_id,
        referrer:profiles!referrals_referrer_id_fkey(
          id, handle, display_name, avatar_url, karma
        )
      `)
            .eq('status', 'rewarded');

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Aggregate by referrer
        const leaderboard = {};
        data?.forEach(r => {
            if (r.referrer) {
                const id = r.referrer_id;
                if (!leaderboard[id]) {
                    leaderboard[id] = {
                        ...r.referrer,
                        referral_count: 0
                    };
                }
                leaderboard[id].referral_count++;
            }
        });

        // Sort by referral count
        const sorted = Object.values(leaderboard)
            .sort((a, b) => b.referral_count - a.referral_count)
            .slice(0, parseInt(limit));

        res.json(sorted);

    } catch (error) {
        console.error('Error getting referral leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
