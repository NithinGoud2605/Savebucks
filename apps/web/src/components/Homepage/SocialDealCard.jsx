import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Bookmark,
  ExternalLink,
  Clock,
  ArrowUp
} from 'lucide-react';
import { formatPrice, dateAgo } from '../../lib/format';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { Badge } from '../ui/Badge';

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
  const isHot = votes > 50 || discount >= 50;

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
    <article className="group">
      <Link to={`/deal/${deal.id}`} className="block">
        {/* GPU-accelerated card with CSS transitions only */}
        <div
          className="relative bg-white rounded-xl p-3 shadow-sm hover:shadow-md 
                     transition-shadow duration-200 transform-gpu hover:-translate-y-0.5"
        >

          {isHot && (
            <div className="absolute -top-2 left-3">
              <Badge variant="hot">🔥 HOT</Badge>
            </div>
          )}

          <div className="flex gap-3">
            {/* Image - Smaller */}
            <div className="flex-shrink-0">
              {currentImage && !imageError ? (
                <div className="w-16 h-16 rounded-lg bg-gray-50 p-1.5 overflow-hidden">
                  <img
                    src={currentImage}
                    alt=""
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🛍️</span>
                </div>
              )}
            </div>

            {/* Content - Compact */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-medium text-slate-500 truncate max-w-[80px]">{company.name}</span>
                {company.is_verified && <Badge variant="verified">✓</Badge>}
              </div>

              <h3 className="text-xs font-semibold text-slate-800 mb-1.5 line-clamp-2 group-hover:text-violet-600 transition-colors leading-tight">
                {deal.title}
              </h3>

              <div className="flex items-center gap-2">
                {deal.price !== undefined && (
                  <span className="text-sm font-bold text-slate-900">
                    {deal.price === 0 ? 'FREE' : formatPrice(deal.price)}
                  </span>
                )}
                {deal.original_price && deal.original_price > deal.price && (
                  <span className="text-[10px] text-slate-400 line-through">
                    {formatPrice(deal.original_price)}
                  </span>
                )}
                {discount > 0 && <Badge variant="discount">-{discount}%</Badge>}
              </div>
            </div>

            {/* Right side - Vote count + meta */}
            <div className="flex flex-col items-end justify-between">
              {/* Vote count (display only) */}
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <ArrowUp className="w-3 h-3" />
                <span className={votes > 0 ? 'text-violet-600 font-medium' : ''}>{votes}</span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-0.5">
                  <MessageCircle className="w-2.5 h-2.5" />
                  {comments}
                </span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {dateAgo(deal.created_at)}
                </span>
              </div>

              {/* Bookmark - appears on hover */}
              <motion.button
                onClick={handleBookmark}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 ${isBookmarked
                  ? 'text-violet-500 bg-violet-100/80'
                  : 'text-slate-400 hover:text-violet-500 hover:bg-violet-50/80'
                  }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
              </motion.button>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default SocialDealCard;
