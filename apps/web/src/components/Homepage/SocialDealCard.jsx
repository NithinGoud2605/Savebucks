import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Heart,
  Clock,
  ArrowUp,
  Store,
  Sparkles
} from 'lucide-react';
import { formatPrice, dateAgo } from '../../lib/format';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';

export function SocialDealCard({ deal, index = 0 }) {
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!deal || typeof deal !== 'object') return null;

  const images = deal.deal_images?.length > 0 ? deal.deal_images : (deal.image_url ? [deal.image_url] : []);
  const currentImage = images[0] || deal.featured_image || deal.image_url;

  const company = deal.company || deal.companies || {
    name: deal.merchant || 'Store',
    is_verified: false
  };

  const discount = deal.discount_percentage ||
    (deal.price && deal.original_price && deal.original_price > deal.price
      ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
      : 0);

  const comments = deal.comments_count || 0;
  const votes = (deal.ups || 0) - (deal.downs || 0);

  const handleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Sign in to save deals');
      return;
    }
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from saved' : 'Deal saved!');
  };

  return (
    <article className="group h-[88px]">
      <Link to={`/deal/${deal.id}`} className="block h-full">
        {/* Ultra-compact card with fixed height */}
        <div
          className="relative bg-white rounded-lg p-2.5 border border-gray-100 h-full
                     transition-all duration-200 hover:shadow-md hover:border-gray-200"
        >
          <div className="flex gap-2.5 h-full">
            {/* Product Image - No padded box */}
            <div className="flex-shrink-0">
              {currentImage && !imageError ? (
                <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-50">
                  <img
                    src={currentImage}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </div>

            {/* Content - Vertically centered */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {/* Company + Title Row */}
              <div className="flex items-center gap-1 mb-0.5">
                <Store className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                <span className="text-[10px] text-gray-400 truncate max-w-[60px]">{company.name}</span>
                {company.is_verified && (
                  <svg className="w-2.5 h-2.5 text-violet-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Title - Single line */}
              <h3 className="text-xs font-medium text-gray-800 line-clamp-1 group-hover:text-violet-600 transition-colors mb-1">
                {deal.title}
              </h3>

              {/* Price Row */}
              <div className="flex items-center gap-1.5">
                {deal.price !== undefined && (
                  <span className="text-sm font-bold text-gray-900">
                    {deal.price === 0 ? 'FREE' : formatPrice(deal.price)}
                  </span>
                )}
                {deal.original_price && deal.original_price > deal.price && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {formatPrice(deal.original_price)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-[10px] font-semibold text-red-500">
                    -{discount}%
                  </span>
                )}
              </div>
            </div>

            {/* Right Side - Minimal meta */}
            <div className="flex flex-col items-end justify-between flex-shrink-0">
              {/* Vote */}
              <div className={`flex items-center gap-0.5 text-[10px] ${votes > 0 ? 'text-violet-600' : 'text-gray-400'}`}>
                <ArrowUp className="w-3 h-3" />
                <span>{votes}</span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <span className="flex items-center gap-0.5">
                  <MessageCircle className="w-2.5 h-2.5" />
                  {comments}
                </span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {dateAgo(deal.created_at)}
                </span>
              </div>

              {/* Bookmark */}
              <motion.button
                onClick={handleBookmark}
                whileTap={{ scale: 0.9 }}
                className={`p-1 rounded-full transition-opacity duration-200 opacity-0 group-hover:opacity-100
                           ${isBookmarked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`}
              >
                <Heart className={`w-3 h-3 ${isBookmarked ? 'fill-current' : ''}`} />
              </motion.button>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default SocialDealCard;
