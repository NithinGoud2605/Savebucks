import React from 'react'
import { Link } from 'react-router-dom'
import { TagChips } from '../Deal/TagChips'
import { dateAgo, pluralize } from '../../lib/format'

export function ForumCard({ forum }) {
  return (
    <Link 
      to={`/forums/${forum.slug}`}
      className="card p-6 hover:shadow-lg transition-shadow focus-ring rounded-2xl block"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {forum.name}
          </h3>
          <p className="text-gray-600 mb-3">
            {forum.description}
          </p>
          
          {forum.tags && forum.tags.length > 0 && (
            <TagChips tags={forum.tags} className="mb-4" />
          )}
        </div>

        {/* Forum Icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center ml-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-6 text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span>{forum.threadCount || 0} {pluralize(forum.threadCount || 0, 'thread')}</span>
        </div>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1M15 8V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586" />
          </svg>
          <span>{forum.postCount || 0} {pluralize(forum.postCount || 0, 'post')}</span>
        </div>
      </div>
    </Link>
  )
}
