import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Heart, 
  ExternalLink, 
  Flag, 
  TrendingUp, 
  Clock, 
  Tag, 
  ShoppingCart,
  Star,
  Zap,
  Gift,
  Flame,
  Eye,
  ArrowUpRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function DealCard({ deal, variant = 'default', index = 0 }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [localVoteScore, setLocalVoteScore] = useState(deal.vote_score || 0);
  const [userVote, setUserVote] = useState(deal.user_vote || 0);
  const [isSaved, setIsSaved] = useState(deal.is_saved || false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  // Get images array - prioritize deal_images, fallback to image_url
  const images = deal.deal_images?.length > 0 ? deal.deal_images : (deal.image_url ? [deal.image_url] : [])
  const currentImage = images[selectedImageIndex] || deal.image_url
  
  const discountPercentage = deal.discount_percentage || 
    (deal.price && deal.original_price 
      ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
      : null);

  async function handleVote(value) {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    const previousVote = userVote;
    const previousScore = localVoteScore;
    
    // Optimistic update
    if (previousVote === value) {
      // Remove vote
      setUserVote(0);
      setLocalVoteScore(previousScore - value);
    } else {
      // Add or change vote
      setUserVote(value);
      setLocalVoteScore(previousScore - previousVote + value);
    }

    try {
      await api.voteDeal(deal.id, previousVote === value ? 0 : value);
      
      // Invalidate queries
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['deal', deal.id] });
    } catch (error) {
      // Revert on error
      setUserVote(previousVote);
      setLocalVoteScore(previousScore);
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  }

  async function handleSave() {
    if (!user) {
      navigate('/signin');
      return;
    }

    setIsSaved(!isSaved);
    // TODO: Implement save functionality
  }

  async function handleReport() {
    if (!user) {
      navigate('/signin');
      return;
    }

    const reason = window.prompt('Why are you reporting this deal? (3-500 characters)');
    if (!reason || reason.length < 3) return;
    
    try {
      await api.reportDeal(deal.id, reason);
      alert('Report submitted. Thank you!');
    } catch (error) {
      alert('Error submitting report: ' + error.message);
    }
  }

  const timeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() / 1000) - timestamp);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (variant === 'compact') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ y: -4 }}
        className="group relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
      >
        <Link to={`/deal/${deal.id}`} className="block">
          {/* Image */}
          <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
            {currentImage ? (
              <>
                <img 
                  src={currentImage} 
                  alt={deal.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                
                {/* Image Navigation for multiple images */}
                {images.length > 1 && (
                  <>
                    {/* Previous button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))
                      }}
                      disabled={selectedImageIndex === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full shadow-lg disabled:opacity-50 hover:bg-opacity-90 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* Next button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))
                      }}
                      disabled={selectedImageIndex === images.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full shadow-lg disabled:opacity-50 hover:bg-opacity-90 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Image counter */}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-gray-300" />
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              {deal.is_featured && (
                <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                  Featured
                </span>
              )}
              {discountPercentage && discountPercentage >= 50 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {deal.title}
            </h3>
            
            <div className="flex items-center justify-between mt-3">
              <div>
                {deal.price ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-900">${deal.price}</span>
                    {deal.original_price && (
                      <span className="text-sm text-gray-400 line-through">${deal.original_price}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-primary-600 font-semibold">See Deal</span>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-semibold">{localVoteScore}</span>
              </div>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden"
    >
      <div className="flex">
        {/* Vote Section */}
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border-r border-gray-200">
          <button
            onClick={() => handleVote(1)}
            disabled={isVoting}
            className={`p-2 rounded-lg transition-all ${
              userVote === 1 
                ? 'bg-primary-100 text-primary-600' 
                : 'hover:bg-gray-200 text-gray-500'
            }`}
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          
          <div className={`text-2xl font-bold my-2 ${
            localVoteScore > 0 ? 'text-orange-500' : 'text-gray-500'
          }`}>
            {localVoteScore}
          </div>
          
          <button
            onClick={() => handleVote(-1)}
            disabled={isVoting}
            className={`p-2 rounded-lg transition-all ${
              userVote === -1 
                ? 'bg-red-100 text-red-600' 
                : 'hover:bg-gray-200 text-gray-500'
            }`}
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                  {deal.category?.name || deal.category || 'Deals'}
                </span>
                {deal.store && (
                  <span className="text-xs text-gray-500">
                    from {deal.store}
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary-600 transition-colors">
                <Link to={`/deal/${deal.id}`}>
                  {deal.title}
                </Link>
              </h3>
              
              {deal.description && (
                <p className="text-gray-600 line-clamp-2 mb-3">
                  {deal.description}
                </p>
              )}
            </div>

            {/* Image Thumbnail */}
            {currentImage && (
              <div className="ml-4 flex-shrink-0">
                <img 
                  src={currentImage} 
                  alt={deal.title}
                  className="w-24 h-24 object-cover rounded-lg"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Price and Badges */}
          <div className="flex items-center gap-4 mb-4">
            {deal.price ? (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  ${deal.price}
                </span>
                {deal.original_price && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      ${deal.original_price}
                    </span>
                    {discountPercentage && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-semibold rounded-full">
                        {discountPercentage}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>
            ) : (
              <span className="text-2xl font-bold text-primary-600">
                See Deal
              </span>
            )}

            {/* Badges */}
            <div className="flex gap-2">
              {deal.is_featured && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold rounded-full">
                  <Star className="w-3 h-3" />
                  Featured
                </span>
              )}
              {deal.free_shipping && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  <Gift className="w-3 h-3" />
                  Free Shipping
                </span>
              )}
              {deal.deal_type === 'lightning' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full animate-pulse">
                  <Zap className="w-3 h-3" />
                  Lightning Deal
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Get Deal
                <ExternalLink className="w-4 h-4" />
              </motion.a>

              <button
                onClick={handleSave}
                className={`p-2.5 rounded-xl border transition-all ${
                  isSaved 
                    ? 'bg-red-50 border-red-200 text-red-500' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleReport}
                className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
              >
                <Flag className="w-5 h-5" />
              </button>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{timeAgo(deal.created)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{deal.view_count || 0} views</span>
              </div>
              {deal.expires_at && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Clock className="w-4 h-4" />
                  <span>Expires {new Date(deal.expires_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}