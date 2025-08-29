import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Container } from '../../components/Layout/Container'
import { ThreadActions } from '../../components/Forums/ThreadActions'
import { ModActions } from '../../components/Forums/ModActions'
import { TagChips } from '../../components/Deal/TagChips'
import { Skeleton } from '../../components/Loader/Skeleton'
import { useToast } from '../../components/Toast'
import { forumService } from '../../forums/service'
import { parseMarkdown } from '../../lib/markdown'
import { setPageMeta, setArticleJsonLd } from '../../lib/head'
import { formatDate, dateAgo } from '../../lib/format'
import { clsx } from 'clsx'

export default function ThreadPage() {
  const { slug, id } = useParams()
  const queryClient = useQueryClient()
  const toast = useToast()
  
  // State for comments and interactions
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [showFullThread, setShowFullThread] = useState(false)
  const [sortComments, setSortComments] = useState('chronological')
  
  // Fetch thread data
  const { data: thread, isLoading, error } = useQuery({
    queryKey: ['thread', id],
    queryFn: () => forumService.getThread(id),
  })
  
  // Fetch forum data for context
  const { data: forum } = useQuery({
    queryKey: ['forum', slug],
    queryFn: () => forumService.getForum(slug),
    enabled: !!thread,
  })
  
  // Mark thread as read
  useEffect(() => {
    if (thread) {
      const readThreads = JSON.parse(localStorage.getItem('readThreads') || '[]')
      if (!readThreads.includes(thread.id)) {
        const updated = [...readThreads, thread.id]
        localStorage.setItem('readThreads', JSON.stringify(updated.slice(-100))) // Keep last 100
      }
    }
  }, [thread])
  
  // Set page meta and structured data
  useEffect(() => {
    if (thread && forum) {
      const url = window.location.href
      
      setPageMeta({
        title: thread.title,
        description: thread.body ? thread.body.substring(0, 160) + '...' : `Discussion thread in ${forum.name}`,
        url,
        type: 'article',
      })
      
      setArticleJsonLd({
        title: thread.title,
        description: thread.body,
        author: thread.author || 'Anonymous',
        datePublished: thread.created_at,
        url,
        image: forum.image || undefined,
      })
    }
  }, [thread, forum])
  
  // Vote thread mutation
  const voteMutation = useMutation({
    mutationFn: ({ value }) => forumService.voteThread(id, value),
    onMutate: async ({ value }) => {
      await queryClient.cancelQueries({ queryKey: ['thread', id] })
      
      const previousData = queryClient.getQueryData(['thread', id])
      if (previousData) {
        queryClient.setQueryData(['thread', id], (old) => ({
          ...old,
          votes: (old.votes || 0) + value,
        }))
      }
      
      return { previousData }
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['thread', id], context.previousData)
      }
      toast.error('Failed to vote. Please try again.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', id] })
    },
  })
  
  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: ({ body, parentId = null }) => forumService.createPost(id, { body, parent_id: parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', id] })
      setNewComment('')
      setReplyingTo(null)
      setReplyText('')
      toast.success('Comment posted!')
    },
    onError: () => {
      toast.error('Failed to post comment. Please try again.')
    }
  })
  
  // Handlers
  const handleVote = (value) => {
    const user = localStorage.getItem('demo_user')
    if (!user) {
      toast.error('Please sign in to vote')
      return
    }
    voteMutation.mutate({ value })
  }
  
  const handleComment = (body, parentId = null) => {
    const user = localStorage.getItem('demo_user')
    if (!user) {
      toast.error('Please sign in to comment')
      return
    }
    
    if (!body.trim()) {
      toast.error('Comment cannot be empty')
      return
    }
    
    createPostMutation.mutate({ body: body.trim(), parentId })
  }
  
  const handleReply = (postId) => {
    setReplyingTo(replyingTo === postId ? null : postId)
    setReplyText('')
  }
  
  // Organize comments into tree structure
  const organizeComments = (posts) => {
    const postMap = new Map()
    const rootPosts = []
    
    // Create map of all posts
    posts.forEach(post => {
      postMap.set(post.id, { ...post, replies: [] })
    })
    
    // Organize into tree
    posts.forEach(post => {
      if (post.parent_id) {
        const parent = postMap.get(post.parent_id)
        if (parent) {
          parent.replies.push(postMap.get(post.id))
        }
      } else {
        rootPosts.push(postMap.get(post.id))
      }
    })
    
    // Sort based on preference
    const sortPosts = (postList) => {
      return postList.sort((a, b) => {
        if (sortComments === 'votes') {
          return (b.votes || 0) - (a.votes || 0)
        }
        return new Date(a.created_at) - new Date(b.created_at)
      })
    }
    
    return sortPosts(rootPosts)
  }
  
  if (error) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Thread Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            This thread may have been deleted or doesn't exist.
          </p>
          <div className="space-x-4">
            <Link to={`/forums/${slug}`} className="btn-primary">
              Back to Forum
            </Link>
            <Link to="/forums" className="btn-secondary">
              All Forums
            </Link>
          </div>
        </div>
      </Container>
    )
  }
  
  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-6 w-1/3" />
          <div className="card p-8">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/4 mb-6" />
            <Skeleton className="h-32 w-full mb-6" />
            <div className="flex space-x-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </Container>
    )
  }
  
  const organizedPosts = organizeComments(thread.posts || [])
  const threadHtml = parseMarkdown(thread.body)
  
  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link 
            to="/forums" 
            className="text-blue-600 hover:text-blue-700"
          >
            Forums
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <Link 
            to={`/forums/${slug}`}
            className="text-blue-600 hover:text-blue-700"
          >
            {forum?.name || slug}
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-900">
            {thread.title}
          </span>
        </nav>
        
        {/* Thread Content */}
        <article className="card p-8 mb-6">
          {/* Thread Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  {/* Vote Button */}
                  <div className="flex flex-col items-center bg-gray-50 rounded-lg p-2">
                    <button
                      onClick={() => handleVote(1)}
                      disabled={voteMutation.isPending}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    <span className="text-sm font-bold text-gray-900 py-1">
                      {thread.votes || 0}
                    </span>
                    
                    <button
                      onClick={() => handleVote(-1)}
                      disabled={voteMutation.isPending}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Thread Title and Status */}
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {thread.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {thread.pinned && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          📌 Pinned
                        </span>
                      )}
                      {thread.locked && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          🔒 Locked
                        </span>
                      )}
                      {thread.nsfw && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          ⚠️ NSFW
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Thread Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {thread.author?.charAt(0).toUpperCase() || 'A'}
                      </span>
                    </div>
                    <span className="font-medium">{thread.author || 'Anonymous'}</span>
                  </div>
                  
                  <span>•</span>
                  <span title={formatDate(thread.created_at)}>
                    {dateAgo(thread.created_at)}
                  </span>
                  
                  <span>•</span>
                  <span>{thread.posts?.length || 0} replies</span>
                  
                  {thread.views && (
                    <>
                      <span>•</span>
                      <span>{thread.views.toLocaleString()} views</span>
                    </>
                  )}
                </div>
                
                {/* Tags */}
                {thread.tags && thread.tags.length > 0 && (
                  <TagChips tags={thread.tags} className="mb-4" />
                )}
              </div>
            </div>
          </div>
          
          {/* Thread Body */}
          <div className="prose prose-gray max-w-none mb-6">
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: threadHtml }}
            />
          </div>
          
          {/* Thread Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <ThreadActions thread={thread} />
            <ModActions thread={thread} />
          </div>
        </article>
        
        {/* Comments Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Replies {thread.posts?.length > 0 && `(${thread.posts.length})`}
            </h2>
            
            {/* Comment Sort */}
            {thread.posts?.length > 1 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortComments}
                  onChange={(e) => setSortComments(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="chronological">Oldest First</option>
                  <option value="votes">Top Voted</option>
                </select>
              </div>
            )}
          </div>
          
          {/* New Comment Form */}
          {!thread.locked ? (
            <div className="card p-6">
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                  {localStorage.getItem('demo_user')?.charAt(0).toUpperCase() || 'G'}
                </div>
                
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add your reply..."
                    className="textarea w-full"
                    rows={4}
                  />
                  
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Be respectful and constructive in your discussions.
                    </p>
                    
                    <button
                      onClick={() => handleComment(newComment)}
                      disabled={createPostMutation.isPending || !newComment.trim()}
                      className="btn-primary disabled:opacity-50"
                    >
                      {createPostMutation.isPending ? 'Posting...' : 'Post Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-6 text-center text-gray-600">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p>This thread has been locked and no longer accepts new replies.</p>
            </div>
          )}
          
          {/* Comments List */}
          {organizedPosts.length === 0 ? (
            <div className="card p-8 text-center text-gray-600">
              <p>No replies yet. Be the first to join the discussion!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {organizedPosts.map(post => (
                <ForumComment 
                  key={post.id} 
                  comment={post}
                  onReply={handleReply}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  onComment={handleComment}
                  isSubmitting={createPostMutation.isPending}
                  level={0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}

// Recursive comment component
function ForumComment({ 
  comment, 
  onReply, 
  replyingTo, 
  setReplyingTo, 
  replyText, 
  setReplyText, 
  onComment,
  isSubmitting,
  level = 0 
}) {
  const maxLevel = 5 // Maximum nesting level
  const isReplying = replyingTo === comment.id
  
  return (
    <div className={clsx(
      'border-l-2 border-gray-200',
      level > 0 && 'ml-6 pl-4'
    )}>
      <div className="py-4">
        {/* Comment Header */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
            {comment.author?.charAt(0).toUpperCase() || 'A'}
          </div>
          
          <span className="font-medium text-gray-900">
            {comment.author || 'Anonymous'}
          </span>
          
          <span className="text-sm text-gray-500">
            {dateAgo(comment.created_at)}
          </span>
          
          {comment.votes && comment.votes > 0 && (
            <span className="text-sm text-green-600">
              +{comment.votes}
            </span>
          )}
        </div>
        
        {/* Comment Body */}
        <div className="prose prose-sm prose-gray max-w-none mb-3">
          <p className="text-gray-800 whitespace-pre-wrap">
            {comment.body}
          </p>
        </div>
        
        {/* Comment Actions */}
        <div className="flex items-center space-x-4">
          {level < maxLevel && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded"
            >
              Reply
            </button>
          )}
          
          <button className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded">
            Vote
          </button>
          
          <button className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded">
            Share
          </button>
        </div>
        
        {/* Reply Form */}
        {isReplying && (
          <div className="mt-4 ml-10">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                {localStorage.getItem('demo_user')?.charAt(0).toUpperCase() || 'G'}
              </div>
              
              <div className="flex-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  className="textarea text-sm w-full"
                  rows={3}
                />
                
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    onClick={() => onComment(replyText, comment.id)}
                    disabled={isSubmitting || !replyText.trim()}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Posting...' : 'Reply'}
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
        
        {/* Nested Replies */}
        {comment.replies?.map(reply => (
          <ForumComment 
            key={reply.id}
            comment={reply}
            onReply={onReply}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            replyText={replyText}
            setReplyText={setReplyText}
            onComment={onComment}
            isSubmitting={isSubmitting}
            level={level + 1}
          />
        ))}
      </div>
    </div>
  )
}
