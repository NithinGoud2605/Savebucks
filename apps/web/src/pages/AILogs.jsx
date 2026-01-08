import React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useIntersection } from '../hooks/useIntersection'
import { api } from '../lib/api'
import { Loader2, MessageSquare, User, Clock, DollarSign, Zap } from 'lucide-react'
import { Skeleton } from '../components/ui/Skeleton'

function LogCard({ log, index }) {
  const isStreamStart = log.type === 'stream_start'
  const isStreamEnd = log.type === 'stream_end'
  const isComplete = !isStreamStart && !isStreamEnd

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Truncate long content
  const truncate = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isStreamStart ? 'bg-blue-100 text-blue-600' :
            isStreamEnd ? 'bg-green-100 text-green-600' :
            'bg-purple-100 text-purple-600'
          }`}>
            {isStreamStart ? <Zap className="w-4 h-4" /> :
             isStreamEnd ? <MessageSquare className="w-4 h-4" /> :
             <MessageSquare className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {isStreamStart ? 'Stream Start' :
                 isStreamEnd ? 'Stream End' :
                 'Chat Interaction'}
              </span>
              {log.success !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {log.success ? 'Success' : 'Error'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <User className="w-3 h-3" />
                <span>{log.userId || 'guest'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{formatTime(log.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
        {log.requestId && (
          <span className="text-xs font-mono text-slate-400">
            {log.requestId.substring(0, 8)}...
          </span>
        )}
      </div>

      {/* Input */}
      {log.input && (
        <div className="mb-4">
          <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
            Input
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-sm text-slate-900 whitespace-pre-wrap">
              {log.input}
            </p>
          </div>
        </div>
      )}

      {/* Output */}
      {log.output && (
        <div className="mb-4">
          <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
            Output
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
            <p className="text-sm text-slate-900 whitespace-pre-wrap">
              {truncate(log.output, 500)}
            </p>
            {log.outputLength > 500 && (
              <div className="mt-2 text-xs text-slate-500">
                ... ({log.outputLength} characters total)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      {(log.model || log.tokensUsed || log.cost || log.latencyMs || log.cached) && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap gap-3 text-xs">
            {log.model && (
              <div className="flex items-center gap-1 text-slate-600">
                <Zap className="w-3 h-3" />
                <span className="font-medium">Model:</span>
                <span className="font-mono">{log.model}</span>
              </div>
            )}
            {log.tokensUsed && (
              <div className="flex items-center gap-1 text-slate-600">
                <span className="font-medium">Tokens:</span>
                <span>{log.tokensUsed.toLocaleString()}</span>
              </div>
            )}
            {log.cost !== undefined && log.cost > 0 && (
              <div className="flex items-center gap-1 text-slate-600">
                <DollarSign className="w-3 h-3" />
                <span className="font-medium">Cost:</span>
                <span>${log.cost.toFixed(4)}</span>
              </div>
            )}
            {log.latencyMs && (
              <div className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3 h-3" />
                <span className="font-medium">Latency:</span>
                <span>{log.latencyMs}ms</span>
              </div>
            )}
            {log.cached && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                Cached
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LogSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-20 w-full mb-4" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}

export default function AILogs() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['ai-logs'],
    queryFn: ({ pageParam }) => 
      api.getAILogs({ limit: 20, cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      if (lastPage?.hasMore && lastPage?.nextCursor) {
        return lastPage.nextCursor
      }
      return undefined
    },
    staleTime: 30 * 1000, // 30 seconds
  })

  // Flatten all pages
  const allLogs = React.useMemo(() => {
    return data?.pages?.flatMap(page => page?.logs || []) || []
  }, [data])

  // Intersection observer for infinite scroll
  const loadMoreRef = useIntersection(
    () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    {
      threshold: 0.1,
      rootMargin: '200px'
    }
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 pt-16 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            AI Chat Logs
          </h1>
          <p className="text-slate-600">
            View all AI chat interactions and responses
            {data?.pages[0]?.total && (
              <span className="ml-2 text-slate-500">
                ({data.pages[0].total} total entries)
              </span>
            )}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <LogSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && allLogs.length === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-900 font-semibold mb-2">
              Failed to load logs
            </div>
            <div className="text-red-700 text-sm">
              {error?.message || 'Something went wrong. Please try again.'}
            </div>
          </div>
        )}

        {/* Logs List */}
        {allLogs.length > 0 && (
          <div className="space-y-4">
            {allLogs.map((log, index) => (
              <LogCard key={log.requestId || log.timestamp || index} log={log} index={index} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && allLogs.length === 0 && !isError && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No logs found
            </h3>
            <p className="text-slate-600">
              AI chat logs will appear here once users start interacting with the AI.
            </p>
          </div>
        )}

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="py-8">
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 text-purple-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading more logs...</span>
            </div>
          )}

          {!hasNextPage && allLogs.length > 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-slate-500 text-sm bg-slate-100 px-4 py-2 rounded-full">
                <span>✨</span>
                <span>You've reached the end!</span>
                <span>✨</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



