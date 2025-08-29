import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useToast } from '../Toast'
import { dateAgo } from '../../lib/format'
import { clsx } from 'clsx'

export function CommentThread({ dealId, comments = [] }) {
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')

  const queryClient = useQueryClient()
  const toast = useToast()

  const commentMutation = useMutation({
    mutationFn: ({ body, parentId }) => api.commentDeal(dealId, body, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] })
      setNewComment('')
      setReplyingTo(null)
      setReplyText('')
      toast.success('Comment posted!')
    },
    onError: () => {
      toast.error('Failed to post comment. Please try again.')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const user = localStorage.getItem('demo_user')
    if (!user) {
      toast.error('Please sign in to comment')
      return
    }

    if (!newComment.trim()) return

    commentMutation.mutate({ body: newComment.trim(), parentId: null })
  }

  const handleReply = (parentId) => {
    const user = localStorage.getItem('demo_user')
    if (!user) {
      toast.error('Please sign in to reply')
      return
    }

    if (!replyText.trim()) return

    commentMutation.mutate({ body: replyText.trim(), parentId })
  }

  // Organize comments into tree structure
  const organizeComments = (comments) => {
    const commentMap = new Map()
    const rootComments = []

    // Create map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Organize into tree
    comments.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.replies.push(commentMap.get(comment.id))
        }
      } else {
        rootComments.push(commentMap.get(comment.id))
      }
    })

    return rootComments
  }

  const organizedComments = organizeComments(comments)

  const Comment = ({ comment, level = 0 }) => (
    <div className={clsx('border-l-2 border-gray-200', level > 0 && 'ml-6 pl-4')}>
      <div className="py-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
            {comment.user_id ? comment.user_id.charAt(0).toUpperCase() : 'A'}
          </div>
          <span className="font-medium text-gray-900">
            {comment.user_id || 'Anonymous'}
          </span>
          <span className="text-sm text-gray-500">
            {dateAgo(comment.created_at)}
          </span>
        </div>

        <div className="prose prose-sm max-w-none text-gray-800 mb-3">
          {comment.body}
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded"
          >
            Reply
          </button>
        </div>

        {replyingTo === comment.id && (
          <div className="mt-4 ml-10">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                D
              </div>
              <div className="flex-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="textarea text-sm"
                  rows={3}
                />
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    onClick={() => handleReply(comment.id)}
                    disabled={commentMutation.isPending || !replyText.trim()}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyText('')
                    }}
                    className="btn-ghost text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {comment.replies.map(reply => (
          <Comment key={reply.id} comment={reply} level={level + 1} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="card p-6">
        <div className="flex space-x-4">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
            D
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this deal..."
              className="textarea"
              rows={4}
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Be respectful and helpful to fellow deal hunters!
              </p>
              <button
                type="submit"
                disabled={commentMutation.isPending || !newComment.trim()}
                className="btn-primary disabled:opacity-50"
              >
                {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments */}
      {organizedComments.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {organizedComments.map(comment => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  )
}
