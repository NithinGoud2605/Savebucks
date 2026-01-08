import React from 'react'
import { Link } from 'react-router-dom'
import { TagChips } from '../Deal/TagChips'
import { dateAgo, truncate } from '../../lib/format'
import { clsx } from 'clsx'

export function ThreadRow({ thread, compact = false, showForum = false }) {
  return (
    <div className={clsx(
      'card p-4 hover:shadow-md transition-shadow',
      compact ? 'border border-gray-200' : ''
    )}>
      <div className="flex items-start space-x-3">
        {/* Vote Score */}
        <div className="flex-shrink-0 flex flex-col items-center bg-gray-50 rounded-lg p-2 min-w-[3rem]">
          <svg className="w-4 h-4 text-gray-400 mb-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-gray-900">
            {thread.votes || 0}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className={clsx(
                'font-semibold text-gray-900 hover:text-blue-600',
                compact ? 'text-sm' : 'text-lg'
              )}>
                <Link
                  to={`/forums/${thread.forumSlug}/thread/${thread.id}`}
                  className="focus-ring rounded"
                >
                  {thread.title}
                </Link>
              </h3>

              {/* Status badges */}
              <div className="flex items-center space-x-2 mt-1">
                {thread.pinned && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Pinned
                  </span>
                )}
                {thread.locked && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    Locked
                  </span>
                )}
              </div>
            </div>

            {!compact && (
              <div className="flex-shrink-0 text-right text-sm text-gray-600">
                <div>{thread.postCount || 0} replies</div>
                <div>{dateAgo(thread.lastActivity || thread.created_at)}</div>
              </div>
            )}
          </div>

          {!compact && thread.body && (
            <p className="text-gray-600 text-sm mb-3">
              {truncate(thread.body, 120)}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">
                  {thread.author?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <span>{thread.author || 'Anonymous'}</span>
            </div>
            <span>•</span>
            <span>{dateAgo(thread.created_at)}</span>

            {showForum && (
              <>
                <span>•</span>
                <span>in {thread.forumSlug}</span>
              </>
            )}

            {compact && (
              <>
                <span>•</span>
                <span>{thread.postCount || 0} replies</span>
              </>
            )}
          </div>

          {/* Tags */}
          {thread.tags && thread.tags.length > 0 && (
            <TagChips tags={thread.tags} className="mt-3" />
          )}
        </div>
      </div>
    </div>
  )
}
