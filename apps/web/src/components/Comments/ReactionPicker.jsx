import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';

/**
 * Reaction types with their emoji representations
 */
export const REACTIONS = {
    like: { emoji: '👍', label: 'Like' },
    love: { emoji: '❤️', label: 'Love' },
    laugh: { emoji: '😂', label: 'Haha' },
    fire: { emoji: '🔥', label: 'Fire' },
    wow: { emoji: '😮', label: 'Wow' },
    sad: { emoji: '😢', label: 'Sad' }
};

/**
 * Reaction Picker Component
 * 
 * Shows a row of emoji reactions that users can click to add/remove.
 */
export function ReactionPicker({
    commentId,
    reactions = {},
    userReactions = [],
    onReactionChange
}) {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [isHovered, setIsHovered] = useState(false);

    const toggleMutation = useMutation({
        mutationFn: ({ reaction }) =>
            apiRequest(`/api/reactions/comment/${commentId}/toggle`, {
                method: 'POST',
                body: { reaction }
            }),
        onSuccess: (data) => {
            // Optimistically update UI through callback
            if (onReactionChange) {
                onReactionChange(commentId, data.reaction, data.action);
            }
            // Invalidate related queries
            queryClient.invalidateQueries(['comment-reactions', commentId]);
        },
        onError: () => {
            toast.error('Failed to react');
        }
    });

    const handleReaction = (reactionType) => {
        if (!isAuthenticated) {
            toast.error('Please sign in to react');
            return;
        }
        toggleMutation.mutate({ reaction: reactionType });
    };

    // Get total reaction count
    const totalReactions = Object.values(reactions).reduce(
        (sum, r) => sum + (r.count || 0), 0
    );

    return (
        <div
            className="flex items-center gap-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Compact view - show existing reactions */}
            <div className="flex items-center gap-0.5">
                {Object.entries(REACTIONS).map(([type, { emoji }]) => {
                    const count = reactions[type]?.count || 0;
                    const hasReacted = userReactions.includes(type);

                    if (count === 0 && !isHovered) return null;

                    return (
                        <motion.button
                            key={type}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleReaction(type)}
                            disabled={toggleMutation.isPending}
                            className={`
                flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs
                transition-colors cursor-pointer
                ${hasReacted
                                    ? 'bg-violet-100 border border-violet-300'
                                    : 'bg-gray-100 hover:bg-gray-200 border border-transparent'
                                }
                ${toggleMutation.isPending ? 'opacity-50' : ''}
              `}
                            title={REACTIONS[type].label}
                        >
                            <span className="text-sm">{emoji}</span>
                            {count > 0 && (
                                <span className={`font-medium ${hasReacted ? 'text-violet-600' : 'text-gray-600'}`}>
                                    {count}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Add reaction button - shows on hover */}
            <AnimatePresence>
                {isHovered && totalReactions === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex gap-0.5 ml-1"
                    >
                        {Object.entries(REACTIONS).map(([type, { emoji, label }]) => (
                            <button
                                key={type}
                                onClick={() => handleReaction(type)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title={label}
                            >
                                <span className="text-sm opacity-50 hover:opacity-100">{emoji}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Compact Reactions Display
 * 
 * Shows a summary of reactions (for feed cards, etc.)
 */
export function ReactionsDisplay({ reactions = {} }) {
    const activeReactions = Object.entries(reactions)
        .filter(([_, data]) => data.count > 0)
        .sort((a, b) => b[1].count - a[1].count);

    if (activeReactions.length === 0) return null;

    const totalCount = activeReactions.reduce((sum, [_, data]) => sum + data.count, 0);

    return (
        <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
                {activeReactions.slice(0, 3).map(([type]) => (
                    <span key={type} className="text-sm">
                        {REACTIONS[type].emoji}
                    </span>
                ))}
            </div>
            <span className="text-xs text-gray-500">{totalCount}</span>
        </div>
    );
}

/**
 * Reaction Button (standalone)
 * 
 * Simple button that shows a quick reaction picker on click.
 */
export function ReactionButton({ commentId, size = 'sm' }) {
    const [showPicker, setShowPicker] = useState(false);
    const { isAuthenticated } = useAuth();

    const handleClick = () => {
        if (!isAuthenticated) {
            toast.error('Please sign in to react');
            return;
        }
        setShowPicker(!showPicker);
    };

    const sizeClasses = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2'
    };

    return (
        <div className="relative">
            <button
                onClick={handleClick}
                className={`
          flex items-center gap-1 rounded-full
          text-gray-500 hover:text-gray-700 hover:bg-gray-100
          transition-colors ${sizeClasses[size]}
        `}
            >
                <span>😀</span>
                <span>React</span>
            </button>

            <AnimatePresence>
                {showPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-50"
                    >
                        <div className="flex gap-1">
                            {Object.entries(REACTIONS).map(([type, { emoji, label }]) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        // Handle reaction
                                        setShowPicker(false);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title={label}
                                >
                                    <span className="text-xl">{emoji}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ReactionPicker;
