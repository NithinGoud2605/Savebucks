import React, { useState, useEffect } from 'react';
import { setPageMeta } from '../lib/head';
import { Container } from '../components/Layout/Container';
import { FilterSidebar } from '../components/Homepage/FilterSidebar';
import { InfiniteFeed } from '../components/Homepage/InfiniteFeed';
import { RightSidebar } from '../components/Homepage/RightSidebar';
import { useLocation } from '../context/LocationContext';
import AdvancedSearchInterface from '../components/Search/AdvancedSearchInterface';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { UserIcon, FireIcon, TagIcon } from '@heroicons/react/24/outline';

export default function SocialHomepage() {
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState(null);
  const { location } = useLocation();

  // Get navbar stats
  const { data: navbarStats } = useQuery({
    queryKey: ['navbar-stats'],
    queryFn: () => api.getNavbarStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
    retry: 2
  });

  useEffect(() => {
    setPageMeta({
      title: 'SaveBucks - Discover Amazing Deals & Save Big',
      description:
        'Find the hottest deals, exclusive coupons, and biggest discounts on your favorite brands. Join thousands saving money every day!',
      canonical: window.location.origin,
    });
  }, []);

  // Prepare location for API (only if enabled)
  const locationParam = location?.latitude && location?.longitude
    ? { lat: location.latitude, lng: location.longitude }
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Secondary Navbar - Search Bar & Stats (Scrollable) */}
      <div className="bg-gradient-to-r from-primary-100/95 to-primary-200/95 border-b border-primary-300/60 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-3">
            {/* Left: Empty space for balance on desktop */}
            <div className="hidden lg:block w-[200px] flex-shrink-0"></div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-2xl mx-auto">
              <AdvancedSearchInterface
                showFilters={false}
                showSuggestions={true}
                compact={true}
                placeholder="Search deals, coupons, stores..."
                className="drop-shadow-sm"
              />
            </div>
            
            {/* Right: Stats */}
            <div className="hidden lg:flex items-center gap-4 text-xs text-secondary-700 flex-shrink-0 w-[200px]">
              <div className="flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-mint-600" />
                <span className="whitespace-nowrap font-medium">
                  <span className="text-mint-600 font-semibold">Users:</span> {navbarStats?.stats?.usersOnline?.toLocaleString() || '...'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <FireIcon className="w-3.5 h-3.5 text-orange-500" />
                <span className="whitespace-nowrap font-medium">
                  <span className="text-orange-500 font-semibold">Deals:</span> {navbarStats?.stats?.dealsToday?.toLocaleString() || '...'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TagIcon className="w-3.5 h-3.5 text-blue-500" />
                <span className="whitespace-nowrap font-medium">
                  <span className="text-blue-500 font-semibold">Coupons:</span> {navbarStats?.stats?.couponsToday?.toLocaleString() || '...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="w-full px-[2%]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 border-l border-r border-gray-200 bg-white max-w-full mx-auto rounded-lg shadow-sm">
          {/* Left Sidebar - Filters & Categories - Ultra Compact */}
          <div className="hidden lg:block lg:col-span-2 border-r border-gray-200 bg-gray-50 rounded-l-lg">
            <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden p-1.5 scrollbar-thin">
              <FilterSidebar
                activeFilter={filter}
                onFilterChange={setFilter}
                activeCategory={category}
                onCategoryChange={setCategory}
              />
            </div>
          </div>

          {/* Main Feed - Infinite Scroll - More Space */}
          <div className="lg:col-span-7 border-r border-gray-200 bg-white">
            {/* Mobile Filter Pills - More Options */}
            <div className="lg:hidden mb-3 p-3">
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'trending', 'under-20', 'under-50', '50-off', 'free-shipping', 'ending-soon', 'new-arrivals'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      filter === f
                        ? 'bg-gradient-to-r from-mint-500 to-emerald-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-mint-300'
                    }`}
                  >
                    {f.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            <InfiniteFeed
              filter={filter}
              category={category}
              location={locationParam}
            />
          </div>

          {/* Right Sidebar - More Options, Sticky */}
          <div className="lg:col-span-3 bg-gray-50 rounded-r-lg">
            <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden p-2 scrollbar-thin">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
