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

  // Handle keyboard navigation for images
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    } else if (e.key === 'ArrowRight' && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

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

  // Social metrics with fallbacks
  const votes = (deal.ups || 0) - (deal.downs || 0);
  const comments = deal.comments_count || 0;
  const views = deal.views_count || 0;
  
  // Debug logging for engagement data
  if (typeof window !== 'undefined' && !window._engagementDebugLogged) {
    console.log('[SocialDealCard] Engagement data:', {
      dealId: deal.id,
      dealTitle: deal.title,
      rawDealData: {
        ups: deal.ups,
        downs: deal.downs,
        comments_count: deal.comments_count,
        views_count: deal.views_count,
        saves_count: deal.saves_count
      },
      finalValues: { votes, comments, views },
      fullDeal: deal
    });
    window._engagementDebugLogged = true;
  }

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
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          {/* Company Info */}
          <div className="flex items-center gap-2">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-6 h-6 rounded object-contain bg-gray-50 p-0.5 border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 bg-gradient-to-br from-mint-100 to-emerald-100 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-mint-700">
                  {company.name?.charAt(0) || 'S'}
                </span>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-sm text-gray-900">
                {company.name}
              </h3>
              <span className="text-xs text-gray-500">{dateAgo(deal.created_at)}</span>
            </div>
          </div>

          {/* Hot Badge */}
          {votes > 20 && (
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-0.5">
              <Flame className="w-3 h-3" />
              HOT
            </div>
          )}
        </div>
      </div>

      {/* Deal Content */}
      <Link to={`/deal/${deal.id}`} className="block">
        {/* Image - Fit to window with all available images */}
        <div 
          className="relative bg-gradient-to-br from-gray-100 to-gray-200 aspect-[16/9] overflow-hidden focus:outline-none"
          tabIndex={images.length > 1 ? 0 : -1}
          onKeyDown={handleKeyDown}
        >
          {currentImage && !imageError ? (
            <img
              src={currentImage}
              alt={deal.title}
              className="w-full h-full object-contain bg-white"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            // Placeholder when no image
            <div className="w-full h-full flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="text-6xl mb-2">🎁</div>
                <div className="text-sm font-medium text-gray-500">
                  {company.name}
                </div>
              </div>
            </div>
          )}


            {/* Image Navigation - Enhanced for multiple images */}
            {images.length > 1 && (
              <>
                {/* Previous Image Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
                  }}
                  disabled={selectedImageIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-95 rounded-full shadow-lg disabled:opacity-50 hover:bg-opacity-100 transition-all hover:scale-110"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                
                {/* Next Image Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1));
                  }}
                  disabled={selectedImageIndex === images.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white bg-opacity-95 rounded-full shadow-lg disabled:opacity-50 hover:bg-opacity-100 transition-all hover:scale-110"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>

                {/* Image Counter */}
                <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {selectedImageIndex + 1} / {images.length}
                </div>

                {/* Image Dots Indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedImageIndex(idx);
                      }}
                      className={clsx(
                        'w-2 h-2 rounded-full transition-all duration-200',
                        idx === selectedImageIndex
                          ? 'bg-white w-6'
                          : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                      )}
                    />
                  ))}
                </div>
              </>
            )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Title and Price - Compact Layout */}
        <div className="px-3 pt-2 pb-3">
          <h2 className="text-sm font-semibold text-gray-900 leading-tight mb-2 group-hover:text-mint-700 transition-colors line-clamp-2">
            {deal.title}
          </h2>
          
          {/* Price and Discount */}
          {deal.price !== undefined && (
            <div className="flex items-center gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-mint-700">
                  {deal.price === 0 ? 'FREE' : formatPrice(deal.price)}
                </span>
                {deal.original_price && deal.original_price > deal.price && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(deal.original_price)}
                  </span>
                )}
              </div>
              
              {/* Discount Badge */}
              {discount > 0 && (
                <div className={clsx(
                  'px-2 py-0.5 rounded font-bold text-white text-xs',
                  discount >= 50 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600'
                    : discount >= 30
                    ? 'bg-gradient-to-r from-orange-500 to-red-500'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                )}>
                  {discount}% OFF
                </div>
              )}
            </div>
          )}
        </div>

      </Link>

      {/* Compact Footer - User Details & Actions */}
      <div className="px-3 py-3 border-t border-gray-100">
        {/* User Upload Details */}
        <div className="flex items-center gap-2 mb-2">
          <Link 
            to={`/u/${submitter.handle}`}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            {submitter.avatar_url ? (
              <img 
                src={submitter.avatar_url} 
                alt={submitter.handle}
                className="w-5 h-5 rounded-full border border-gray-200"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {submitter.handle?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <span className="text-xs font-medium text-gray-900">@{submitter.handle || 'user'}</span>
            {submitter.karma > 50 && (
              <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-xs font-semibold">
                ⭐ {submitter.karma}
              </span>
            )}
          </Link>
        </div>

        <div className="flex items-center justify-between">
          {/* Social Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-gray-600">
              <ArrowUp className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{votes >= 0 ? votes : 0}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{comments}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{views > 0 ? views.toLocaleString() : 0}</span>
            </div>
          </div>

          {/* Get Deal Button */}
          <Link
            to={`/deal/${deal.id}`}
            className="bg-gradient-to-r from-mint-500 to-emerald-600 hover:from-mint-600 hover:to-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all"
          >
            <span>Get Deal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
