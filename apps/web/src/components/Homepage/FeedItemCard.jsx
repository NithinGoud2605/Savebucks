import React from 'react';
import { SocialDealCard } from './SocialDealCard';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { Tag, Clock, ExternalLink, Store, MapPin } from 'lucide-react';

/**
 * Renders different card types based on item.type
 */
export function FeedItemCard({ item, index }) {
  if (!item || typeof item !== 'object') {
    console.warn('FeedItemCard: Invalid item', item);
    return null;
  }

  // Default to 'deal' type if not specified
  const itemType = item.type || 'deal';

  switch (itemType) {
    case 'deal':
      return <SocialDealCard deal={item} index={index} />;
    
    case 'coupon':
      return <InlineCouponCard coupon={item} />;
    
    case 'company':
      return <FeaturedCompanyCard company={item} />;
    
    case 'restaurant_section':
      return <RestaurantSectionCard restaurants={item.items} />;
    
    default:
      // Fallback to deal card for unknown types
      return <SocialDealCard deal={item} index={index} />;
  }
}

/**
 * Inline Coupon Card for feed
 */
function InlineCouponCard({ coupon }) {
  const company = coupon.company || {};
  
  return (
    <Link
      to={`/company/${company.slug}?tab=coupons`}
      className="block bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-xl border border-amber-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        {company.logo_url && (
          <div className="flex-shrink-0">
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-12 h-12 rounded-lg object-contain bg-white p-1 border border-gray-200"
            />
          </div>
        )}

        {/* Coupon Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-900">
              {company.name || 'Coupon'}
            </span>
          </div>

          <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-900 transition-colors">
            {coupon.title}
          </h3>

          {/* Coupon Code */}
          {coupon.coupon_code && (
            <div className="bg-white border-2 border-dashed border-amber-400 rounded-lg px-3 py-2 mb-2 inline-block">
              <div className="text-xs text-gray-600 mb-0.5">Code:</div>
              <div className="font-mono text-sm font-bold text-amber-900">
                {coupon.coupon_code}
              </div>
            </div>
          )}

          {/* Expiry */}
          {coupon.expires_at && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              <span>Expires {new Date(coupon.expires_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          <ExternalLink className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

/**
 * Featured Company Card for feed
 */
function FeaturedCompanyCard({ company }) {
  return (
    <Link
      to={`/company/${company.slug}`}
      className="block bg-gradient-to-br from-white via-mint-50/30 to-emerald-50/40 rounded-xl border border-mint-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-center gap-4">
        {/* Company Logo */}
        {company.logo_url ? (
          <div className="flex-shrink-0">
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-16 h-16 rounded-lg object-contain bg-white p-2 border border-gray-200 shadow-sm"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-mint-100 to-emerald-100 rounded-lg flex items-center justify-center">
            <Store className="w-8 h-8 text-mint-600" />
          </div>
        )}

        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-gray-900 group-hover:text-mint-700 transition-colors">
              {company.name}
            </h3>
            {company.is_verified && (
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {company.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {company.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="font-medium text-mint-700">
              {company.active_deals_count || 0} active deals
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-r from-mint-500 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold group-hover:shadow-lg transition-all">
            View Deals
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Restaurant Section Card for feed
 */
function RestaurantSectionCard({ restaurants }) {
  if (!restaurants || restaurants.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-bold text-gray-900">Nearby Restaurants</h3>
      </div>

      <div className="space-y-2">
        {restaurants.slice(0, 3).map((restaurant) => (
          <Link
            key={restaurant.id}
            to={`/company/${restaurant.slug}`}
            className="block bg-white rounded-lg p-3 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {restaurant.name}
                </h4>
                {restaurant.cuisine_type && (
                  <span className="text-xs text-gray-600">{restaurant.cuisine_type}</span>
                )}
              </div>
              {restaurant.rating && (
                <div className="flex-shrink-0 bg-yellow-100 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
                  ⭐ {restaurant.rating}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

