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
  Flame,
  Tag
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
      className="bg-gradient-to-br from-cream-50 via-yellow-50/30 to-amber-50/40 rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group hover:border-mint-300 h-24"
    >
      <Link to={`/deal/${deal.id}`} className="block h-full p-3">
        <div className="flex items-center h-full gap-3">
          {/* Deal Photo - Properly sized and fitted */}
          <div className="flex-shrink-0">
            {currentImage && !imageError ? (
              <div className="w-20 h-20 rounded-lg bg-white border border-gray-200 p-2 flex items-center justify-center">
                <img
                  src={currentImage}
                  alt={deal.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-mint-100 to-emerald-100 rounded-lg flex items-center justify-center border border-gray-200">
                <span className="text-xl">🎁</span>
              </div>
            )}
          </div>

          {/* Deal Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 min-w-0">
                {/* Brand Name with Tag Icon */}
                <div className="flex items-center gap-1 mb-1">
                  <Tag className="w-3 h-3 text-mint-600" />
                  <span className="text-xs font-medium text-gray-700">
                    {company.name}
                  </span>
                </div>

                {/* Deal Title */}
                <h3 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-mint-700 transition-colors">
                  {deal.title}
                </h3>

                {/* Price and Discount */}
                {deal.price !== undefined && (
                  <div className="flex items-center gap-1 mb-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-mint-700">
                        {deal.price === 0 ? 'FREE' : formatPrice(deal.price)}
                      </span>
                      {deal.original_price && deal.original_price > deal.price && (
                        <span className="text-xs text-gray-500 line-through">
                          {formatPrice(deal.original_price)}
                        </span>
                      )}
                    </div>
                    
                    {/* Discount Badge */}
                    {discount > 0 && (
                      <div className={clsx(
                        'px-1.5 py-0.5 rounded font-bold text-white text-xs',
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

                {/* Expiration */}
                {deal.expires_at && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>Expires {new Date(deal.expires_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* External Link Icon */}
              <div className="flex-shrink-0 ml-2">
                <ExternalLink className="w-5 h-5 text-mint-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
