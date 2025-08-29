import React from 'react'
import { TagChips } from '../Deal/TagChips'

export function ForumSidebar({ forum }) {
  const forumRules = [
    'Be respectful and civil in all interactions',
    'Stay on topic and contribute meaningfully',
    'No spam, self-promotion, or affiliate links',
    'Use the search function before posting',
    'Follow community guidelines and ToS',
  ]

  const moderators = [
    { name: 'Admin', avatar: 'A' },
    { name: 'ModUser1', avatar: 'M1' },
    { name: 'ModUser2', avatar: 'M2' },
  ]

  return (
    <div className="space-y-6">
      {/* Forum Info */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          About {forum.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {forum.description}
        </p>
        
        {forum.tags && forum.tags.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-900 mb-2 uppercase tracking-wide">
              Common Topics
            </h4>
            <TagChips tags={forum.tags} />
          </div>
        )}
      </div>

      {/* Forum Rules */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Forum Rules
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          {forumRules.map((rule, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                {index + 1}
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Moderators */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Moderators
        </h3>
        <div className="space-y-2">
          {moderators.map((mod) => (
            <div key={mod.name} className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                {mod.avatar}
              </div>
              <span className="text-sm text-gray-900">{mod.name}</span>
              <span className="text-xs text-green-600">Moderator</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Forum Stats
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Threads</span>
            <span className="font-medium text-gray-900">{forum.threadCount || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Posts</span>
            <span className="font-medium text-gray-900">{forum.postCount || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Members</span>
            <span className="font-medium text-gray-900">{forum.memberCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
