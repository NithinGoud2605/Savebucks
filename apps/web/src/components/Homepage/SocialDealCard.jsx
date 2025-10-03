import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowUp, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  Eye, 
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Flame
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatPrice, dateAgo } from '../../lib/format';
import { useAuth } from '../../hooks/useAuth';

/**
 * Social-style deal card optimized for feed
 * Clean, modern design with social interactions
 */
export function SocialDealCard({ deal, index = 0 }) {
  const { user } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Safety check
  if (!deal || typeof deal !== 'object') {
    console.warn('SocialDealCard: Invalid deal object', deal);
    return null;
  }

  // Get images with debug logging
  const images = deal.deal_images?.length > 0
    ? deal.deal_images
    : (deal.image_url ? [deal.image_url] : []);
  const currentImage = images[selectedImageIndex] || deal.featured_image || deal.image_url;
  
  // Debug: Log image availability for first render
  if (typeof window !== 'undefined' && !window._imageDebugLogged) {
    console.log('[SocialDealCard] Image data:', {
      dealId: deal.id,
      dealTitle: deal.title,
      deal_images: deal.deal_images,
      image_url: deal.image_url,
      featured_image: deal.featured_image,
      currentImage,
      hasImages: images.length > 0
    });
    window._imageDebugLogged = true;
  }

  // Company info with safety checks
  const company = deal.company || deal.companies || { 
    name: deal.merchant || 'Store',
    slug: deal.merchant?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'store',
    logo_url: null,
    is_verified: false
  };

  // Ensure company has required fields
  if (!company.name) company.name = 'Store';
  if (!company.slug) company.slug = 'store';

  // Submitter info with safety checks
  const submitter = deal.profiles || deal.submitter || {
    handle: 'user',
    avatar_url: null,
    karma: 0
  };

  // Ensure submitter has required fields
  if (!submitter.handle) submitter.handle = 'user';

  // Calculate discount
  const discount = deal.discount_percentage || 
    (deal.price && deal.original_price && deal.original_price > deal.price
      ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
      : 0);

  // Social metrics
  const votes = (deal.ups || 0) - (deal.downs || 0);
  const comments = deal.comments_count || 0;
  const views = deal.views_count || 0;

  // Animation
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { delay: index * 0.05, duration: 0.3 }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group hover:border-mint-300"
    >
      {/* Compact Header - Company & Time */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          {/* Company Info */}
          <Link 
            to={`/company/${company.slug}`}
            className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-8 h-8 rounded-lg object-contain bg-gray-50 p-1 border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-mint-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-mint-700">
                  {company.name?.charAt(0) || 'S'}
                </span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-gray-900 truncate">
                  {company.name}
                </h3>
                {company.is_verified && (
                  <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </Link>

          {/* Time and Hot Badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-500">{dateAgo(deal.created_at)}</span>
            {votes > 20 && (
              <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-1.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                <Flame className="w-3 h-3" />
                HOT
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deal Content */}
      <Link to={`/deal/${deal.id}`} className="block">
        {/* Image - Always show (with placeholder if needed) */}
        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 aspect-[16/9]">
          {currentImage && !imageError ? (
            <img
              src={currentImage}
              alt={deal.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            // Placeholder when no image
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2">🎁</div>
                <div className="text-sm font-medium text-gray-500">
                  {company.name}
                </div>
              </div>
            </div>
          )}

            {/* Discount Badge */}
            {discount > 0 && (
              <div className="absolute top-3 left-3">
                <div className={clsx(
                  'px-3 py-1.5 rounded-lg font-bold text-white shadow-lg text-sm',
                  discount >= 50 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600'
                    : discount >= 30
                    ? 'bg-gradient-to-r from-orange-500 to-red-500'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                )}>
                  {discount}% OFF
                </div>
              </div>
            )}

            {/* Save Badge if available */}
            {deal.original_price && deal.price !== undefined && deal.original_price > deal.price && (
              <div className="absolute top-3 right-3">
                <div className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg text-sm">
                  Save ${(deal.original_price - deal.price).toFixed(2)}
                </div>
              </div>
            )}

            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
                  }}
                  disabled={selectedImageIndex === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white bg-opacity-90 rounded-full shadow-lg disabled:opacity-50 hover:bg-opacity-100 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1));
                  }}
                  disabled={selectedImageIndex === images.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white bg-opacity-90 rounded-full shadow-lg disabled:opacity-50 hover:bg-opacity-100 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Image indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      className={clsx(
                        'w-1.5 h-1.5 rounded-full transition-all',
                        idx === selectedImageIndex
                          ? 'bg-white w-4'
                          : 'bg-white bg-opacity-50'
                      )}
                    />
                  ))}
                </div>
              </>
            )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Title After Image */}
        <div className="px-4 pt-3 pb-2">
          <h2 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-mint-700 transition-colors">
            {deal.title}
          </h2>
        </div>

        {/* Price Section */}
        {deal.price !== undefined && (
          <div className="px-4 py-3 bg-gradient-to-r from-mint-50 to-emerald-50 border-y border-mint-100">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-mint-700">
                  {deal.price === 0 ? 'FREE' : formatPrice(deal.price)}
                </span>
                {deal.original_price && deal.original_price > deal.price && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(deal.original_price)}
                  </span>
                )}
              </div>

              {/* Expiry Timer */}
              {deal.expires_at && (
                <div className="flex items-center gap-1 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">
                    Ends {new Date(deal.expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description (if exists) */}
        {deal.description && (
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {deal.description}
            </p>
          </div>
        )}
      </Link>

      {/* Compact Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2.5">
          {/* Left - Social Engagement */}
          <div className="flex items-center gap-3">
            {/* Upvote */}
            <button className="flex items-center gap-1 text-gray-600 hover:text-mint-600 transition-colors">
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-medium">{votes >= 0 ? votes : 0}</span>
            </button>

            {/* Comments */}
            <Link 
              to={`/deal/${deal.id}#comments`}
              className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{comments}</span>
            </Link>

            {/* Views */}
            <div className="flex items-center gap-1 text-gray-500">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">{views > 0 ? views.toLocaleString() : 0}</span>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {/* Bookmark */}
            <button className="p-1.5 rounded-lg text-gray-600 hover:text-amber-600 hover:bg-amber-50 transition-colors">
              <Bookmark className="w-4 h-4" />
            </button>

            {/* Get Deal CTA */}
            <Link
              to={`/deal/${deal.id}`}
              className="bg-gradient-to-r from-mint-500 to-emerald-600 hover:from-mint-600 hover:to-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all"
            >
              <span>Get Deal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Submitter info - Compact */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link 
            to={`/u/${submitter.handle}`}
            className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
          >
            {submitter.avatar_url ? (
              <img 
                src={submitter.avatar_url} 
                alt={submitter.handle}
                className="w-4 h-4 rounded-full border border-gray-200"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold">
                {submitter.handle?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <span>@{submitter.handle || 'user'}</span>
          </Link>
          {submitter.karma > 50 && (
            <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5">
              ⭐ {submitter.karma}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
