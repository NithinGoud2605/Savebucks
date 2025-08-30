import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api.js'

export function SecondaryBanners() {
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['banners', 'secondary'],
    queryFn: () => api.getBanners({ position: 'secondary' }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const secondaryBanners = banners.filter(banner => banner.position === 'secondary')

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-48 bg-secondary-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (secondaryBanners.length === 0) {
    return null
  }

  return (
    <section className="py-8 bg-secondary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {secondaryBanners.map((banner) => (
            <div
              key={banner.id}
              className="relative h-48 md:h-56 rounded-2xl overflow-hidden shadow-soft group"
              style={{
                backgroundColor: banner.background_color || '#f3f4f6',
                color: banner.text_color || '#1f2937'
              }}
            >
              {/* Background Image */}
              {banner.image_url && (
                <div className="absolute inset-0">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                </div>
              )}

              {/* Content */}
              <div className="relative h-full flex items-center p-6 md:p-8">
                <div className="max-w-sm">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-sm md:text-base mb-4 opacity-90">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.description && (
                    <p className="text-xs md:text-sm mb-4 opacity-80">
                      {banner.description}
                    </p>
                  )}
                  {banner.link_url && (
                    <Link
                      to={banner.link_url}
                      className="inline-flex items-center px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-sm shadow-md group-hover:shadow-lg"
                    >
                      {banner.link_text || 'Shop now'}
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

