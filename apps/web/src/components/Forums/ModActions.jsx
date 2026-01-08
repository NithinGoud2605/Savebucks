import React, { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '../Toast'
import { useConfirm } from '../ConfirmDialog'
import { forumService } from '../../forums/service'
import { api } from '../../lib/api'
import { dateAgo } from '../../lib/format'
import { clsx } from 'clsx'

export function ModActions({ thread, post = null, compact = false }) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [moderationReason, setModerationReason] = useState('')

  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()

  // Enhanced permission checking
  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions'],
    queryFn: () => api.getUserPermissions(),
  })

  const isMod = userPermissions?.can_moderate || localStorage.getItem('demo_user') === 'demo'
  const isAdmin = userPermissions?.is_admin || false

  // Enhanced mutations
  const pinMutation = useMutation({
    mutationFn: () => forumService.pinThread(thread.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', thread.id] })
      queryClient.invalidateQueries({ queryKey: ['threads'] })
      toast.success(thread.pinned ? 'Thread unpinned' : 'Thread pinned')
      logModerationAction('pin', thread.pinned ? 'unpinned' : 'pinned')
    },
    onError: () => toast.error('Failed to update thread')
  })

  const lockMutation = useMutation({
    mutationFn: ({ reason }) => forumService.lockThread(thread.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', thread.id] })
      queryClient.invalidateQueries({ queryKey: ['threads'] })
      toast.success(thread.locked ? 'Thread unlocked' : 'Thread locked')
      logModerationAction('lock', thread.locked ? 'unlocked' : 'locked')
    },
    onError: () => toast.error('Failed to update thread')
  })

  const deleteMutation = useMutation({
    mutationFn: ({ reason }) => forumService.deleteThread(thread.id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] })
      toast.success(post ? 'Post deleted' : 'Thread deleted')
      logModerationAction('delete', 'deleted')
    },
    onError: () => toast.error('Failed to delete')
  })

  const moveThreadMutation = useMutation({
    mutationFn: ({ forumId, reason }) => forumService.moveThread(thread.id, forumId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] })
      toast.success('Thread moved successfully')
      setShowMoveModal(false)
      logModerationAction('move', 'moved')
    },
    onError: () => toast.error('Failed to move thread')
  })

  const banUserMutation = useMutation({
    mutationFn: ({ userId, reason, duration }) => api.banUser(userId, { reason, duration }),
    onSuccess: () => {
      toast.success('User banned successfully')
      setShowBanModal(false)
      logModerationAction('ban', 'banned')
    },
    onError: () => toast.error('Failed to ban user')
  })

  const warnUserMutation = useMutation({
    mutationFn: ({ userId, reason }) => api.warnUser(userId, reason),
    onSuccess: () => {
      toast.success('Warning sent to user')
      logModerationAction('warn', 'warned')
    },
    onError: () => toast.error('Failed to send warning')
  })

  const logModerationAction = (action, status) => {
    api.logModerationAction({
      action,
      status,
      target_type: post ? 'post' : 'thread',
      target_id: post?.id || thread.id,
      reason: moderationReason,
      thread_id: thread.id
    }).catch(() => { })
  }

  const handleAction = async (actionType, requiresReason = false) => {
    let reason = ''
    if (requiresReason || showAdvanced) {
      reason = await new Promise(resolve => {
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
        modal.innerHTML = `
          <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 class="text-lg font-semibold mb-4">Moderation Reason</h3>
            <textarea id="reason-input" class="w-full p-3 border rounded-lg h-24 resize-none" 
                     placeholder="Enter reason for this action (optional)"></textarea>
            <div class="flex justify-end space-x-3 mt-4">
              <button id="cancel-btn" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
              <button id="confirm-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Confirm</button>
            </div>
          </div>
        `
        document.body.appendChild(modal)

        modal.querySelector('#cancel-btn').onclick = () => {
          document.body.removeChild(modal)
          resolve(null)
        }

        modal.querySelector('#confirm-btn').onclick = () => {
          const reasonValue = modal.querySelector('#reason-input').value
          document.body.removeChild(modal)
          resolve(reasonValue)
        }
      })

      if (reason === null) return
    }

    setModerationReason(reason)

    switch (actionType) {
      case 'pin':
        pinMutation.mutate()
        break
      case 'lock':
        lockMutation.mutate({ reason })
        break
      case 'delete':
        const confirmed = await confirm({
          title: `Delete ${post ? 'Post' : 'Thread'}`,
          message: `Are you sure you want to delete this ${post ? 'post' : 'thread'}? This action cannot be undone.`,
          confirmText: 'Delete',
          type: 'danger'
        })
        if (confirmed) {
          deleteMutation.mutate({ reason })
        }
        break
      case 'warn':
        if (reason.trim()) {
          warnUserMutation.mutate({
            userId: post?.author_id || thread.author_id,
            reason
          })
        }
        break
    }
  }

  if (!isMod) return null

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
          title="Moderation actions"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {showAdvanced && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowAdvanced(false)} />
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => handleAction('warn', true)}
                  className="w-full px-3 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 rounded"
                >
                  Warn User
                </button>
                <button
                  onClick={() => handleAction('delete', true)}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Delete {post ? 'Post' : 'Thread'}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setShowBanModal(true)}
                    className="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 rounded"
                  >
                    Ban User
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">MOD:</span>

        <button
          onClick={() => handleAction('pin')}
          disabled={pinMutation.isPending}
          className={clsx(
            'flex items-center space-x-1 text-sm px-3 py-1.5 rounded-lg transition-colors',
            thread.pinned
              ? 'bg-green-100 text-green-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span>{thread.pinned ? 'Unpin' : 'Pin'}</span>
        </button>

        <button
          onClick={() => handleAction('lock')}
          disabled={lockMutation.isPending}
          className={clsx(
            'flex items-center space-x-1 text-sm px-3 py-1.5 rounded-lg transition-colors',
            thread.locked
              ? 'bg-red-100 text-red-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {thread.locked ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            )}
          </svg>
          <span>{thread.locked ? 'Unlock' : 'Lock'}</span>
        </button>

        <button
          onClick={() => setShowMoveModal(true)}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span>Move</span>
        </button>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
          <span>More</span>
        </button>
      </div>

      {/* Advanced Actions */}
      {showAdvanced && (
        <div className="card p-4 bg-yellow-50 border-yellow-200">
          <h4 className="font-medium text-gray-900 mb-3">Advanced Moderation</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAction('warn', true)}
              className="flex items-center space-x-1 text-sm text-yellow-700 hover:text-yellow-800 px-3 py-1.5 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Warn Author</span>
            </button>

            <button
              onClick={() => handleAction('delete', true)}
              className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete {post ? 'Post' : 'Thread'}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowBanModal(true)}
                className="flex items-center space-x-1 text-sm text-red-700 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
                <span>Ban User</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Move Thread Modal */}
      {showMoveModal && (
        <MoveThreadModal
          threadId={thread.id}
          onClose={() => setShowMoveModal(false)}
          onMove={(forumId, reason) => moveThreadMutation.mutate({ forumId, reason })}
        />
      )}

      {/* Ban User Modal */}
      {showBanModal && (
        <BanUserModal
          userId={post?.author_id || thread.author_id}
          userName={post?.author || thread.author}
          onClose={() => setShowBanModal(false)}
          onBan={(reason, duration) => banUserMutation.mutate({
            userId: post?.author_id || thread.author_id,
            reason,
            duration
          })}
        />
      )}
    </div>
  )
}

// Move Thread Modal Component
function MoveThreadModal({ threadId, onClose, onMove }) {
  const [selectedForum, setSelectedForum] = useState('')
  const [reason, setReason] = useState('')

  const { data: forums = [] } = useQuery({
    queryKey: ['forums'],
    queryFn: () => api.getForums(),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold mb-4">Move Thread</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Destination Forum</label>
            <select
              value={selectedForum}
              onChange={(e) => setSelectedForum(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="">Select a forum...</option>
              {forums.map(forum => (
                <option key={forum.id} value={forum.id}>{forum.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border rounded-lg h-24 resize-none"
              placeholder="Explain why this thread is being moved..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={() => selectedForum && onMove(selectedForum, reason)}
            disabled={!selectedForum}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Move Thread
          </button>
        </div>
      </div>
    </div>
  )
}

// Ban User Modal Component
function BanUserModal({ userId, userName, onClose, onBan }) {
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('7d')

  const banDurations = [
    { value: '1h', label: '1 Hour' },
    { value: '1d', label: '1 Day' },
    { value: '7d', label: '1 Week' },
    { value: '30d', label: '1 Month' },
    { value: 'permanent', label: 'Permanent' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold mb-4 text-red-600">Ban User: {userName}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              {banDurations.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border rounded-lg h-24 resize-none"
              placeholder="Explain why this user is being banned..."
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onBan(reason, duration)}
            disabled={!reason.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Ban User
          </button>
        </div>
      </div>
    </div>
  )
}
