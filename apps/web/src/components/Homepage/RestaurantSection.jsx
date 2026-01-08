import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MapPin,
  Star,
  Clock,
  Phone,
  Globe,
  Navigation,
  ChevronRight,
  Utensils,
  Tag,
  ExternalLink,
  Eye,
  Gift,
  Zap,
  ArrowRight
} from 'lucide-react'
import { useLocation } from '../../context/LocationContext'
import { api } from '../../lib/api'
import { Link } from 'react-router-dom'

const RestaurantSection = () => {
  const { location } = useLocation()
  const [showAll, setShowAll] = useState(false)

  // Fetch nearby restaurants
  const { data: restaurantsData, isLoading, error } = useQuery({
    queryKey: ['nearby-restaurants', location?.latitude, location?.longitude],
    queryFn: async () => {
      if (!location?.latitude || !location?.longitude) {
        throw new Error('Location not available')
      }
      console.log('🍽️ Fetching restaurants for location:', location.latitude, location.longitude)
      const result = await api.restaurants.getNearby({
        lat: location.latitude,
        lng: location.longitude,
        radius: 10,
        limit: showAll ? 20 : 6
      })
      console.log('🍽️ Restaurant API result:', result)
      return result
    },
    enabled: !!location?.latitude && !!location?.longitude,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  const restaurants = restaurantsData?.data || []

  console.log('🍽️ RestaurantSection: restaurants data:', restaurants)
  console.log('🍽️ RestaurantSection: isLoading:', isLoading)
  console.log('🍽️ RestaurantSection: error:', error)

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code)
    // You could add a toast notification here
  }

  const getDirections = (restaurant) => {
    if (restaurant.latitude && restaurant.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`, '_blank')
    } else if (restaurant.address) {
      const encodedAddress = encodeURIComponent(restaurant.address)
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank')
    }
  }

  // Don't render if no location
  if (!location) {
    console.log('🍽️ RestaurantSection: No location available')
    return null
  }

  console.log('🍽️ RestaurantSection: Location available:', location)

  // Don't render if loading and no data yet
  if (isLoading && !restaurants.length) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Don't render if error and no data
  if (error && !restaurants.length) {
    return null
  }

  // Show section even if no restaurants found (for debugging)
  if (!restaurants.length && !isLoading) {
    console.log('🍽️ RestaurantSection: No restaurants found, but showing section for debugging')
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              🍽️ Restaurants Near You
            </h2>
            <p className="text-gray-600 mb-4">
              No restaurants found within 10 miles of your location.
            </p>
            <p className="text-sm text-gray-500">
              Location: {location?.latitude}, {location?.longitude}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              🍽️ Restaurants Near You
            </h2>
            <p className="text-gray-600">
              Discover great food deals at restaurants in {location.address.display}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{restaurants.length} restaurants found</span>
          </div>
        </div>

        {/* Restaurants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {restaurants.map((restaurant, index) => (
            <motion.div
              key={restaurant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/company/${restaurant.slug}`}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group"
              >
                {/* Restaurant Image/Logo */}
                <div className="relative h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                  {restaurant.logo_url ? (
                    <img
                      src={restaurant.logo_url}
                      alt={`${restaurant.name} logo`}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center">
                      <Utensils className="w-10 h-10 text-white" />
                    </div>
                  )}

                  {/* Distance Badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    {restaurant.distance_miles?.toFixed(1)} mi
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {restaurant.name}
                    </h3>
                    {restaurant.is_verified && (
                      <div className="flex-shrink-0 ml-2">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cuisine & Price */}
                  <div className="flex items-center gap-2 mb-3">
                    {restaurant.cuisine_type && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {restaurant.cuisine_type}
                      </span>
                    )}
                    {restaurant.price_range && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-800">
                        {restaurant.price_range}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {restaurant.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {restaurant.description}
                    </p>
                  )}

                  {/* Recent Deals & Coupons */}
                  {(restaurant.deals?.length > 0 || restaurant.coupons?.length > 0) && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Current Offers</span>
                      </div>

                      {/* Show recent deals */}
                      {restaurant.deals?.slice(0, 1).map((deal, dealIndex) => (
                        <div key={`deal-${dealIndex}`} className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-green-800 text-sm line-clamp-1">
                                {deal.title}
                              </p>
                              {deal.discount_percentage && (
                                <p className="text-xs text-green-600">
                                  {deal.discount_percentage}% off
                                </p>
                              )}
                            </div>
                            {deal.coupon_code && (
                              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded font-mono">
                                {deal.coupon_code}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Show recent coupons */}
                      {restaurant.coupons?.slice(0, 1).map((coupon, couponIndex) => (
                        <div key={`coupon-${couponIndex}`} className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-blue-800 text-sm line-clamp-1">
                                {coupon.title}
                              </p>
                              {coupon.discount_percentage && (
                                <p className="text-xs text-blue-600">
                                  {coupon.discount_percentage}% off
                                </p>
                              )}
                            </div>
                            {coupon.code && (
                              <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded font-mono">
                                {coupon.code}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Show count if more offers */}
                      {(restaurant.deals?.length > 1 || restaurant.coupons?.length > 1) && (
                        <p className="text-xs text-gray-500 text-center mt-1">
                          +{(restaurant.deals?.length || 0) + (restaurant.coupons?.length || 0) - 2} more offers
                        </p>
                      )}
                    </div>
                  )}

                  {/* Location */}
                  {restaurant.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{restaurant.address}</span>
                    </div>
                  )}

                  {/* View Restaurant Link */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-primary-600 font-medium group-hover:text-primary-700">
                      View Restaurant
                    </span>
                    <ArrowRight className="w-4 h-4 text-primary-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {restaurants.length > 6 && (
          <div className="text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              {showAll ? 'Show Less' : 'Show More Restaurants'}
              <ChevronRight className={`w-4 h-4 transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </button>
          </div>
        )}

        {/* View All Link */}
        <div className="text-center mt-6">
          <Link
            to="/companies?category=restaurants"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            <Utensils className="w-4 h-4" />
            View All Restaurant Companies
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default RestaurantSection
