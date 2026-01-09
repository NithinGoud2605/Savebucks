/**
 * Comment Reactions API Routes
 * 
 * Handles adding/removing emoji reactions on comments.
 */

import express from 'express';
import { makeAdminClient } from '../lib/supa.js';

const router = express.Router();
const supabase = makeAdminClient();

// Available reactions
const VALID_REACTIONS = ['like', 'love', 'laugh', 'fire', 'sad', 'wow'];

// Helper: Check authentication
const requireAuth = (req, res, next) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

/**
 * GET /api/reactions/comment/:commentId
 * Get reactions for a comment
 */
router.get('/comment/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;

        const { data: reactions, error } = await supabase
            .from('comment_reactions')
            .select(`
        reaction,
        user_id,
        user:profiles!comment_reactions_user_id_fkey(
          id, handle, display_name, avatar_url
        )
      `)
            .eq('comment_id', commentId);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Group by reaction type
        const grouped = {};
        VALID_REACTIONS.forEach(r => grouped[r] = []);

        reactions?.forEach(r => {
            if (grouped[r.reaction]) {
                grouped[r.reaction].push({
                    user_id: r.user_id,
                    user: r.user
                });
            }
        });

        // Count and format
        const summary = VALID_REACTIONS.reduce((acc, r) => {
            acc[r] = {
                count: grouped[r].length,
                users: grouped[r].slice(0, 5) // First 5 users
            };
            return acc;
        }, {});

        res.json(summary);

    } catch (error) {
        console.error('Error fetching reactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/reactions/comment/:commentId
 * Add a reaction to a comment
 */
router.post('/comment/:commentId', requireAuth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { reaction } = req.body;

        if (!reaction || !VALID_REACTIONS.includes(reaction)) {
            return res.status(400).json({
                error: 'Invalid reaction',
                valid_reactions: VALID_REACTIONS
            });
        }

        // Check if reaction already exists
        const { data: existing } = await supabase
            .from('comment_reactions')
            .select('id')
            .eq('comment_id', commentId)
            .eq('user_id', req.user.id)
            .eq('reaction', reaction)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Already reacted with this emoji' });
        }

        // Add reaction
        const { data, error } = await supabase
            .from('comment_reactions')
            .insert({
                comment_id: commentId,
                user_id: req.user.id,
                reaction
            })
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ success: true, reaction: data });

    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/reactions/comment/:commentId
 * Remove a reaction from a comment
 */
router.delete('/comment/:commentId', requireAuth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { reaction } = req.body;

        if (!reaction) {
            return res.status(400).json({ error: 'Reaction type required' });
        }

        const { error } = await supabase
            .from('comment_reactions')
            .delete()
            .eq('comment_id', commentId)
            .eq('user_id', req.user.id)
            .eq('reaction', reaction);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Error removing reaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/reactions/comment/:commentId/toggle
 * Toggle a reaction (add if not exists, remove if exists)
 */
router.post('/comment/:commentId/toggle', requireAuth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { reaction } = req.body;

        if (!reaction || !VALID_REACTIONS.includes(reaction)) {
            return res.status(400).json({
                error: 'Invalid reaction',
                valid_reactions: VALID_REACTIONS
            });
        }

        // Check if reaction exists
        const { data: existing } = await supabase
            .from('comment_reactions')
            .select('id')
            .eq('comment_id', commentId)
            .eq('user_id', req.user.id)
            .eq('reaction', reaction)
            .single();

        if (existing) {
            // Remove reaction
            await supabase
                .from('comment_reactions')
                .delete()
                .eq('id', existing.id);

            return res.json({ action: 'removed', reaction });
        } else {
            // Add reaction
            await supabase
                .from('comment_reactions')
                .insert({
                    comment_id: commentId,
                    user_id: req.user.id,
                    reaction
                });

            return res.json({ action: 'added', reaction });
        }

    } catch (error) {
        console.error('Error toggling reaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/reactions/user
 * Get user's reactions (for highlighting their reactions)
 */
router.get('/user', requireAuth, async (req, res) => {
    try {
        const { comment_ids } = req.query;

        if (!comment_ids) {
            return res.status(400).json({ error: 'comment_ids required' });
        }

        const ids = comment_ids.split(',');

        const { data, error } = await supabase
            .from('comment_reactions')
            .select('comment_id, reaction')
            .eq('user_id', req.user.id)
            .in('comment_id', ids);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Group by comment
        const byComment = {};
        data?.forEach(r => {
            if (!byComment[r.comment_id]) {
                byComment[r.comment_id] = [];
            }
            byComment[r.comment_id].push(r.reaction);
        });

        res.json(byComment);

    } catch (error) {
        console.error('Error fetching user reactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
