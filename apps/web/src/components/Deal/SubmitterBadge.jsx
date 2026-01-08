import { UserIcon, ShieldCheckIcon, CogIcon } from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'

export default function SubmitterBadge({ submitter, submitter_id, created_at, showDate = true, size = 'sm' }) {
  // Handle case where deal was submitted by admin without user profile
  if (!submitter && !submitter_id) {
    return (
      <div className={`inline-flex items-center gap-2 ${size === 'lg' ? 'text-sm' : 'text-xs'} text-gray-500`}>
        <CogIcon className={`${size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} text-blue-600`} />
        <span className="font-medium text-blue-600">Official</span>
        {showDate && created_at && (
          <span className="text-gray-400">
            • {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
          </span>
        )}
      </div>
    )
  }

  // Handle case where submitter_id exists but no profile data
  if (!submitter && submitter_id) {
    return (
      <div className={`inline-flex items-center gap-2 ${size === 'lg' ? 'text-sm' : 'text-xs'} text-gray-500`}>
        <UserIcon className={`${size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} text-gray-400`} />
        <span>Community Member</span>
        {showDate && created_at && (
          <span className="text-gray-400">
            • {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
          </span>
        )}
      </div>
    )
  }

  // Regular user submission
  const isAdmin = submitter?.role === 'admin'
  const isModerator = submitter?.role === 'moderator'
  const isVerified = isAdmin || isModerator || (submitter?.karma && submitter.karma > 100)

  return (
    <div className={`inline-flex items-center gap-2 ${size === 'lg' ? 'text-sm' : 'text-xs'} text-gray-600`}>
      {/* Avatar */}
      {submitter?.avatar_url ? (
        <img
          src={submitter.avatar_url}
          alt={submitter.handle || 'User'}
          className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} rounded-full object-cover`}
        />
      ) : (
        <div className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} rounded-full bg-gray-200 flex items-center justify-center`}>
          <UserIcon className={`${size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'} text-gray-400`} />
        </div>
      )}

      {/* Name and badges */}
      <div className="flex items-center gap-1">
        <span className="font-medium text-gray-900">
          {submitter?.handle || 'Community Member'}
        </span>
        
        {/* Role badges */}
        {isAdmin && (
          <div className="inline-flex items-center gap-1">
            <ShieldCheckIcon className="w-3 h-3 text-red-500" />
            <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
              Admin
            </span>
          </div>
        )}
        
        {isModerator && !isAdmin && (
          <div className="inline-flex items-center gap-1">
            <ShieldCheckIcon className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              Mod
            </span>
          </div>
        )}
        
        {isVerified && !isAdmin && !isModerator && (
          <ShieldCheckIcon className="w-3 h-3 text-green-500" title="Verified Contributor" />
        )}

        {/* Karma display for regular users */}
        {!isAdmin && !isModerator && submitter?.karma && (
          <span className="text-xs text-gray-400">
            ({submitter.karma} karma)
          </span>
        )}
      </div>

      {/* Date */}
      {showDate && created_at && (
        <span className="text-gray-400">
          • {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
        </span>
      )}
    </div>
  )
}














