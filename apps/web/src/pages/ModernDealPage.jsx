import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  ExternalLink,
  Heart,
  Share2,
  Flag,
  Clock,
  Tag,
  Store,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Eye,
  Flame,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Star,
  TrendingUp,
  Calendar,
  User,
  ShoppingCart,
  Gift,
  Zap,
  Percent,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Loader2,
  MapPin,
  Globe,
  Shield,
  Award
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { setPageMeta } from '../lib/head'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

// Comment Component
const Comment = ({ comment, onReply, depth = 0 }) => {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isVoting, setIsVoting] = useState(false)
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const handleVote = async (value) => {
    if (!user) {
      window.location.href = '/signin'
      return
    }

    setIsVoting(true)
    try {
      await api.voteComment(comment.id, value)
      queryClient.invalidateQueries(['comments'])
    } catch (error) {
      console.error('Error voting on comment:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    await onReply(comment.id, replyContent)
    setReplyContent('')
    setShowReplyForm(false)
  }

  const timeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() / 1000) - timestamp)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''}`}
    >
      <div className="bg-white rounded-lg p-4 mb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {comment.user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">
                {comment.user?.username || 'Anonymous'}
              </span>
              <span className="text-xs text-gray-500">
                {timeAgo(comment.created_at)}
              </span>
              {comment.user?.is_verified && (
                <Shield className="w-4 h-4 text-blue-500" />
              )}
            </div>

            <p className="text-gray-700 mb-3 whitespace-pre-wrap">
              {comment.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleVote(1)}
                  disabled={isVoting}
                  className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                    comment.user_vote === 1 ? 'text-primary-600' : 'text-gray-500'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <span className={`font-medium ${
                  comment.vote_score > 0 ? 'text-green-600' : 
                  comment.vote_score < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {comment.vote_score || 0}
                </span>
                <button
                  onClick={() => handleVote(-1)}
                  disabled={isVoting}
                  className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                    comment.user_vote === -1 ? 'text-red-600' : 'text-gray-500'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>

              {user && depth < 3 && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-gray-500 hover:text-primary-600 transition-colors"
                >
                  Reply
                </button>
              )}

              <button className="text-gray-500 hover:text-red-600 transition-colors">
                Report
              </button>
            </div>

            {/* Reply Form */}
            {showReplyForm && (
              <form onSubmit={handleReply} className="mt-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows="3"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={!replyContent.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyForm(false)
                      setReplyContent('')
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.map((reply) => (
        <Comment
          key={reply.id}
          comment={reply}
          onReply={onReply}
          depth={depth + 1}
        />
      ))}
    </motion.div>
  )
}

// Price History Chart (Placeholder)
const PriceHistoryChart = ({ dealId }) => {
  // This is a placeholder - you would integrate with a real charting library
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Price History</h3>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>
      <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">Price tracking coming soon</p>
      </div>
    </div>
  )
}

// Similar Deals Component
const SimilarDeals = ({ currentDealId, category }) => {
  const { data: similarDeals, isLoading } = useQuery({
    queryKey: ['similar-deals', category],
    queryFn: () => api.getDeals({ 
      category, 
      limit: 4,
      exclude: currentDealId 
    }),
    enabled: !!category
  })

  if (isLoading || !similarDeals?.length) return null

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Deals</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {similarDeals.map((deal) => (
          <Link
            key={deal.id}
            to={`/deal/${deal.id}`}
            className="group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all"
          >
            <div className="flex gap-4">
              {deal.image_url ? (
                <img
                  src={deal.image_url}
                  alt={deal.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-gray-300" />
                </div>
              )}
              
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 group-hover:text-primary-600 line-clamp-2 transition-colors">
                  {deal.title}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  {deal.price && (
                    <span className="text-lg font-bold text-primary-600">
                      ${deal.price}
                    </span>
                  )}
                  {deal.discount_percentage && (
                    <span className="text-sm text-red-600 font-medium">
                      {deal.discount_percentage}% OFF
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// Main Deal Page Component
export default function ModernDealPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [isVoting, setIsVoting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [copied, setCopied] = useState(false)

  // Fetch deal data
  const { data: deal, isLoading, error } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => api.getDeal(id),
    staleTime: 5 * 60 * 1000
  })

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => api.getDealComments(id),
    staleTime: 1 * 60 * 1000
  })

  // Update page meta
  useEffect(() => {
    if (deal) {
      setPageMeta({
        title: `${deal.title} - SaveBucks`,
        description: deal.description || `Save ${deal.discount_percentage || ''}% on ${deal.title}`,
        canonical: `${window.location.origin}/deal/${id}`,
      })
      setIsSaved(deal.is_saved || false)
    }
  }, [deal, id])

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: ({ dealId, vote }) => api.voteDeal(dealId, vote),
    onSuccess: () => {
      queryClient.invalidateQueries(['deal', id])
      queryClient.invalidateQueries(['deals'])
    }
  })

  // Handle voting
  const handleVote = async (value) => {
    if (!user) {
      navigate('/signin')
      return
    }

    if (isVoting || !deal) return
    setIsVoting(true)

    try {
      const newVote = deal.user_vote === value ? 0 : value
      await voteMutation.mutateAsync({ dealId: id, vote: newVote })
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setIsVoting(false)
    }
  }

  // Handle save
  const handleSave = () => {
    if (!user) {
      navigate('/signin')
      return
    }
    setIsSaved(!isSaved)
    // TODO: Implement save functionality
  }

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: deal.title,
      text: `Check out this deal: ${deal.title}`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/signin')
      return
    }

    if (!commentContent.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      await api.postComment(id, commentContent)
      setCommentContent('')
      queryClient.invalidateQueries(['comments', id])
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Handle reply
  const handleReply = async (parentId, content) => {
    if (!user) {
      navigate('/signin')
      return
    }

    try {
      await api.postComment(id, content, parentId)
      queryClient.invalidateQueries(['comments', id])
    } catch (error) {
      console.error('Error posting reply:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Deal not found</h2>
          <p className="text-gray-600 mb-4">This deal may have expired or been removed.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to deals
          </Link>
        </div>
      </div>
    )
  }

  const discountPercentage = deal.discount_percentage || 
    (deal.price && deal.original_price 
      ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
      : null)

  const isExpired = deal.expires_at && new Date(deal.expires_at) < new Date()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          {deal.category && (
            <>
              <Link to={`/category/${deal.category_slug}`} className="hover:text-primary-600 transition-colors">
                {deal.category}
              </Link>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          <span className="text-gray-900 font-medium truncate">{deal.title}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Deal Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6"
            >
              {/* Image Gallery */}
              {deal.image_url && (
                <div className="aspect-video relative overflow-hidden bg-gray-100">
                  <img
                    src={deal.image_url}
                    alt={deal.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {isExpired ? (
                      <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
                        Expired
                      </span>
                    ) : (
                      <>
                        {deal.is_featured && (
                          <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            Featured
                          </span>
                        )}
                        {deal.deal_type === 'lightning' && (
                          <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full flex items-center gap-1 animate-pulse">
                            <Zap className="w-4 h-4" />
                            Lightning Deal
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Discount Badge */}
                  {discountPercentage && discountPercentage > 0 && !isExpired && (
                    <div className="absolute bottom-4 right-4 bg-red-500 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-xl">
                      <div className="text-center">
                        <div className="text-2xl font-bold leading-none">{discountPercentage}%</div>
                        <div className="text-xs">OFF</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6 lg:p-8">
                {/* Store & Category */}
                <div className="flex items-center gap-4 mb-4">
                  <Link
                    to={`/store/${deal.store_slug}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    <Store className="w-4 h-4" />
                    {deal.store || 'Unknown Store'}
                  </Link>
                  {deal.category && (
                    <Link
                      to={`/category/${deal.category_slug}`}
                      className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      <Tag className="w-4 h-4" />
                      {deal.category}
                    </Link>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  {deal.title}
                </h1>

                {/* Price Section */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
                  {deal.price ? (
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-gray-900">
                        ${deal.price}
                      </span>
                      {deal.original_price && (
                        <>
                          <span className="text-xl text-gray-400 line-through">
                            ${deal.original_price}
                          </span>
                          <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-semibold rounded-full">
                            Save ${(deal.original_price - deal.price).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-primary-600">
                      See Price at Store
                    </span>
                  )}

                  {/* Additional Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {deal.free_shipping && (
                      <span className="inline-flex items-center gap-1">
                        <Gift className="w-4 h-4" />
                        Free Shipping
                      </span>
                    )}
                    {deal.expires_at && !isExpired && (
                      <span className="inline-flex items-center gap-1 text-orange-600">
                        <Clock className="w-4 h-4" />
                        Expires {new Date(deal.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <motion.a
                    href={deal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all ${
                      isExpired
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white hover:shadow-xl'
                    }`}
                    onClick={isExpired ? (e) => e.preventDefault() : undefined}
                  >
                    {isExpired ? 'Deal Expired' : 'Get This Deal'}
                    <ExternalLink className="w-5 h-5" />
                  </motion.a>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        isSaved
                          ? 'bg-red-50 border-red-200 text-red-500'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={handleShare}
                      className="p-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Share2 className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={() => setShowReportModal(true)}
                      className="p-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                    >
                      <Flag className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {deal.description && (
                  <div className="prose prose-gray max-w-none mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">About this deal</h3>
                    <div 
                      className="text-gray-700"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(marked(deal.description)) 
                      }}
                    />
                  </div>
                )}

                {/* Terms */}
                {deal.terms && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Terms & Conditions</h3>
                    <p className="text-sm text-gray-600">{deal.terms}</p>
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Posted by {deal.user?.username || 'Anonymous'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(deal.created_at * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {deal.view_count || 0} views
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {comments.length} comments
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Comments Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 lg:p-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Discussion ({comments.length})
              </h2>

              {/* Comment Form */}
              {user ? (
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Share your thoughts about this deal..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows="4"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={!commentContent.trim() || isSubmittingComment}
                      className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      {isSubmittingComment && <Loader2 className="w-4 h-4 animate-spin" />}
                      Post Comment
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl mb-6">
                  <p className="text-gray-600 mb-4">Join the discussion!</p>
                  <Link
                    to="/signin"
                    className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
                  >
                    Sign in to comment
                  </Link>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <Comment
                      key={comment.id}
                      comment={comment}
                      onReply={handleReply}
                    />
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Vote Widget */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">Is this a good deal?</p>
                  
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                      onClick={() => handleVote(1)}
                      disabled={isVoting}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        deal.user_vote === 1
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                      }`}
                    >
                      <ChevronUp className="w-6 h-6" />
                      <span className="text-xs font-medium">Hot</span>
                    </button>

                    <div className="text-center">
                      <div className={`text-3xl font-bold ${
                        deal.vote_score > 0 ? 'text-orange-500' : 'text-gray-500'
                      }`}>
                        {deal.vote_score || 0}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Flame className="w-3 h-3" />
                        <span>Heat</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleVote(-1)}
                      disabled={isVoting}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        deal.user_vote === -1
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <ChevronDown className="w-6 h-6" />
                      <span className="text-xs font-medium">Cold</span>
                    </button>
                  </div>

                  <p className="text-xs text-gray-500">
                    {deal.vote_count || 0} votes from the community
                  </p>
                </div>
              </motion.div>

              {/* Store Info */}
              {deal.store && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Details</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Store className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{deal.store}</p>
                        <p className="text-sm text-gray-500">Official Store</p>
                      </div>
                    </div>

                    {deal.store_rating && (
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="font-medium text-gray-900">{deal.store_rating}/5</p>
                          <p className="text-sm text-gray-500">Store Rating</p>
                        </div>
                      </div>
                    )}

                    <Link
                      to={`/store/${deal.store_slug}`}
                      className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      View All {deal.store} Deals
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Price History */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <PriceHistoryChart dealId={id} />
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Why SaveBucks?</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Verified Deals</p>
                      <p className="text-sm text-gray-600">All deals are tested and verified</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Community Driven</p>
                      <p className="text-sm text-gray-600">Voted by thousands of users</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Always Free</p>
                      <p className="text-sm text-gray-600">No fees or hidden costs</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Similar Deals */}
        <SimilarDeals currentDealId={id} category={deal.category_slug} />
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Deal</h3>
              <p className="text-gray-600 mb-4">
                Please let us know why you're reporting this deal:
              </p>
              
              <div className="space-y-2 mb-4">
                {['Expired', 'Incorrect price', 'Broken link', 'Spam', 'Other'].map((reason) => (
                  <label key={reason} className="flex items-center">
                    <input
                      type="radio"
                      name="report-reason"
                      value={reason}
                      className="mr-2 text-primary-600"
                    />
                    <span className="text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>

              <textarea
                placeholder="Additional details (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-4"
                rows="3"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // TODO: Implement report submission
                    setShowReportModal(false)
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Submit Report
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}