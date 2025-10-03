/**
 * Advanced Feed Hooks
 * 
 * Industry-standard patterns from:
 * - React Query: Caching, background updates, optimistic updates
 * - SWR (Vercel): Revalidation strategies
 * - Apollo Client: Normalized cache, optimistic responses
 * - Redux Toolkit: Entity normalization
 * 
 * Features:
 * - Infinite scrolling with cursor pagination
 * - Optimistic updates
 * - Prefetching
 * - Real-time updates (ready)
 * - Request deduplication
 * - Automatic retries
 * - Background refetching
 */

import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { feedApi } from '../lib/feedApi';
import { api } from '../lib/api';

/**
 * Main feed hook with industry-standard patterns
 * Pattern: Twitter/Facebook infinite feed
 */
export function useFeed(options = {}) {
  const {
    filter = 'all',
    category = null,
    location = null,
    limit = 12,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['feed', { filter, category, location, limit }],
    
    queryFn: async ({ pageParam }) => {
      return feedApi.getFeed({
        cursor: pageParam,
        limit,
        filter,
        category,
        location,
      });
    },
    
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    
    // Caching strategy
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    
    // Refetch strategies
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
    
    // Error handling
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Enable/disable query
    enabled,
    
    // Placeholder data
    placeholderData: (previousData) => previousData,
  });

  // Flatten all pages
  const items = useMemo(() => {
    return query.data?.pages
      ?.flatMap((page) => page.items || [])
      .filter(Boolean) || [];
  }, [query.data?.pages]);

  // Prefetch next page
  const prefetchNextPage = useCallback(() => {
    const lastPage = query.data?.pages?.[query.data.pages.length - 1];
    if (lastPage?.nextCursor && !query.isFetchingNextPage) {
      queryClient.prefetchInfiniteQuery({
        queryKey: ['feed', { filter, category, location, limit }],
        initialPageParam: lastPage.nextCursor,
      });
    }
  }, [query.data?.pages, query.isFetchingNextPage, queryClient, filter, category, location, limit]);

  // Invalidate feed (for refresh)
  const invalidate = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: ['feed', { filter, category, location, limit }],
    });
  }, [queryClient, filter, category, location, limit]);

  return {
    ...query,
    items,
    prefetchNextPage,
    invalidate,
  };
}

/**
 * Vote on feed item with optimistic updates
 * Pattern: Reddit/Facebook optimistic voting
 */
export function useFeedVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, itemType, value }) => {
      const voteMethod = itemType === 'deal' ? 'voteDeal' : 'voteCoupon';
      return api[voteMethod](itemId, value);
    },
    
    // Optimistic update
    onMutate: async ({ itemId, value }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({ queryKey: ['feed'] });

      // Optimistically update cache
      queryClient.setQueriesData({ queryKey: ['feed'] }, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === itemId || item.content_id === itemId
                ? {
                    ...item,
                    engagement: {
                      ...item.engagement,
                      votes: item.engagement.votes + value,
                      ups: value > 0 ? item.engagement.ups + 1 : item.engagement.ups,
                      downs: value < 0 ? item.engagement.downs + 1 : item.engagement.downs,
                    },
                    user_actions: {
                      ...item.user_actions,
                      has_voted: true,
                      vote_value: value,
                    },
                  }
                : item
            ),
          })),
        };
      });

      return { previousData };
    },
    
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    
    // Refetch on success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

/**
 * Save/bookmark feed item with optimistic updates
 * Pattern: Instagram/Pinterest save functionality
 */
export function useFeedSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, itemType, save = true }) => {
      const method = itemType === 'deal'
        ? (save ? 'saveDeal' : 'unsaveDeal')
        : (save ? 'saveCoupon' : 'unsaveCoupon');
      
      return api[method](itemId);
    },
    
    // Optimistic update
    onMutate: async ({ itemId, save }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      
      const previousData = queryClient.getQueriesData({ queryKey: ['feed'] });

      queryClient.setQueriesData({ queryKey: ['feed'] }, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === itemId || item.content_id === itemId
                ? {
                    ...item,
                    engagement: {
                      ...item.engagement,
                      saves_count: save
                        ? item.engagement.saves_count + 1
                        : Math.max(0, item.engagement.saves_count - 1),
                    },
                    user_actions: {
                      ...item.user_actions,
                      has_saved: save,
                    },
                  }
                : item
            ),
          })),
        };
      });

      return { previousData };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
}

/**
 * Track feed item view with debouncing
 * Pattern: Facebook/LinkedIn analytics
 */
export function useFeedItemView(itemId, itemType = 'deal') {
  const viewedRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!itemId || viewedRef.current) return;

    // Mark as viewed after 2 seconds
    timerRef.current = setTimeout(() => {
      feedApi.trackItemView(itemId, itemType, 2000);
      viewedRef.current = true;
    }, 2000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [itemId, itemType]);
}

/**
 * Prefetch item details on hover
 * Pattern: YouTube/Netflix hover prediction
 */
export function useFeedItemPrefetch(itemId, itemType = 'deal', delay = 300) {
  const timeoutRef = useRef(null);

  const prefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      feedApi.prefetchItem(itemId, itemType);
    }, delay);
  }, [itemId, itemType, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { prefetch, cancel };
}

/**
 * Get feed statistics
 * Pattern: Twitter/Reddit feed analytics
 */
export function useFeedStats(filter = 'all', category = null) {
  return useQuery({
    queryKey: ['feed-stats', filter, category],
    queryFn: () => api.get('/api/feed/stats', {
      params: { filter, category },
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Subscribe to real-time feed updates
 * Pattern: Twitter/Facebook real-time updates (WebSocket ready)
 */
export function useRealtimeFeed(options = {}) {
  const { filter, category, enabled = false } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    // WebSocket connection would go here
    // For now, use polling as fallback
    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: ['feed', { filter, category }],
        refetchType: 'none', // Don't refetch immediately
      });
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [enabled, filter, category, queryClient]);
}

/**
 * Batch operations for multiple feed items
 * Pattern: Reddit batch voting, Gmail bulk actions
 */
export function useFeedBatchActions() {
  const queryClient = useQueryClient();

  const batchVote = useMutation({
    mutationFn: async (votes) => {
      return feedApi.batchVote(votes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const batchSave = useMutation({
    mutationFn: async (items) => {
      return Promise.all(
        items.map(({ itemId, itemType }) =>
          api[itemType === 'deal' ? 'saveDeal' : 'saveCoupon'](itemId)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return {
    batchVote,
    batchSave,
  };
}

/**
 * Feed sorting and filtering utilities
 * Pattern: Reddit/Hacker News sorting algorithms
 */
export function useFeedSorting(items, sortBy = 'hot') {
  return useMemo(() => {
    if (!items || items.length === 0) return [];

    const sorted = [...items];

    switch (sortBy) {
      case 'hot':
        // Wilson score interval (Reddit algorithm)
        return sorted.sort((a, b) => {
          const scoreA = calculateHotScore(a);
          const scoreB = calculateHotScore(b);
          return scoreB - scoreA;
        });

      case 'top':
        return sorted.sort((a, b) =>
          (b.engagement?.votes || 0) - (a.engagement?.votes || 0)
        );

      case 'new':
        return sorted.sort((a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
        );

      case 'controversial':
        return sorted.sort((a, b) => {
          const controversyA = calculateControversy(a);
          const controversyB = calculateControversy(b);
          return controversyB - controversyA;
        });

      default:
        return sorted;
    }
  }, [items, sortBy]);
}

/**
 * Calculate "hot" score (Reddit algorithm)
 */
function calculateHotScore(item) {
  const ups = item.engagement?.ups || 0;
  const downs = item.engagement?.downs || 0;
  const score = ups - downs;
  const ageInHours = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
  
  // Time decay
  return score / Math.pow(ageInHours + 2, 1.5);
}

/**
 * Calculate controversy score
 */
function calculateControversy(item) {
  const ups = item.engagement?.ups || 0;
  const downs = item.engagement?.downs || 0;
  
  if (ups + downs === 0) return 0;
  
  const magnitude = ups + downs;
  const balance = ups > downs ? downs / ups : ups / downs;
  
  return magnitude * balance;
}

