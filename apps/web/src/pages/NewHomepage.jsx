import React from 'react'
import { HeroBanners } from '../components/Homepage/HeroBanners.jsx'
import { SecondaryBanners } from '../components/Homepage/SecondaryBanners.jsx'
import { 
  TrendingDeals, 
  AmazonBestSellers, 
  Over50PercentOff, 
  Under20Dollars, 
  ElectronicsDeals, 
  FashionFinds 
} from '../components/Homepage/DealCollection.jsx'
import { TrendingStats } from '../components/Homepage/TrendingStats.jsx'
import { FloatingSearchButton } from '../components/Homepage/FloatingSearchButton.jsx'
import Leaderboard from '../components/Community/Leaderboard'
import { setPageMeta } from '../lib/head.js'

export default function NewHomepage() {
  React.useEffect(() => {
    setPageMeta({
      title: 'SaveBucks - Best Deals, Coupons & Discounts',
      description: 'Find the best deals, coupons, and discounts from top brands. Save money on electronics, fashion, home goods, and more.',
      canonical: window.location.origin,
    })
  }, [])

  return (
    <div className="min-h-screen bg-secondary-50">

      {/* Hero Banners Section */}
      <section className="py-6 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Hero Banner */}
            <div className="lg:col-span-2">
              <HeroBanners />
            </div>

            {/* Side Banners/Quick Links */}
            <div className="space-y-4">
              {/* Quick Deal Categories */}
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">Quick Finds</h3>
                <div className="grid grid-cols-2 gap-3">
                  <a href="/collections/over-50-off" className="bg-white bg-opacity-20 rounded-lg p-3 text-center hover:bg-opacity-30 transition-colors">
                    <div className="text-2xl mb-1">🔥</div>
                    <div className="text-sm font-medium">Over 50% Off</div>
                  </a>
                  <a href="/collections/under-20" className="bg-white bg-opacity-20 rounded-lg p-3 text-center hover:bg-opacity-30 transition-colors">
                    <div className="text-2xl mb-1">💰</div>
                    <div className="text-sm font-medium">Under $20</div>
                  </a>
                  <a href="/electronics" className="bg-white bg-opacity-20 rounded-lg p-3 text-center hover:bg-opacity-30 transition-colors">
                    <div className="text-2xl mb-1">📱</div>
                    <div className="text-sm font-medium">Electronics</div>
                  </a>
                  <a href="/fashion" className="bg-white bg-opacity-20 rounded-lg p-3 text-center hover:bg-opacity-30 transition-colors">
                    <div className="text-2xl mb-1">👕</div>
                    <div className="text-sm font-medium">Fashion</div>
                  </a>
                </div>
              </div>

              {/* Trending Stats */}
              <TrendingStats />

              {/* Newsletter Signup */}
              <div className="bg-white rounded-2xl p-6 shadow-soft border border-secondary-200">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">Never Miss a Deal</h3>
                <p className="text-sm text-secondary-600 mb-4">Get the best deals delivered to your inbox</p>
                <form className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="input w-full text-sm"
                  />
                  <button className="btn btn-primary w-full text-sm py-2">
                    Subscribe
                  </button>
                </form>
                <p className="text-xs text-secondary-500 mt-2">
                  No spam, unsubscribe anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Now Section */}
      <TrendingDeals maxItems={8} />

      {/* Secondary Banners */}
      <SecondaryBanners />

      {/* Amazon Best Sellers */}
      <AmazonBestSellers maxItems={12} />

      {/* Over 50% Off Section */}
      <section className="py-8 bg-gradient-to-r from-danger-50 to-warning-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-secondary-900 mb-2">
              🔥 Massive Savings
            </h2>
            <p className="text-secondary-600">Deals with over 50% off - limited time only!</p>
          </div>
          <Over50PercentOff maxItems={8} showViewAll={true} />
        </div>
      </section>

      {/* Electronics & Fashion with Leaderboard */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div>
              <ElectronicsDeals maxItems={6} />
            </div>
            <div>
              <FashionFinds maxItems={6} />
            </div>
            <div className="xl:row-span-1">
              <Leaderboard compact={true} showViewMore={true} />
            </div>
          </div>
        </div>
      </section>

      {/* Under $20 Section */}
      <section className="py-8 bg-success-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-secondary-900 mb-2">
              💰 Budget Friendly
            </h2>
            <p className="text-secondary-600">Great deals under twenty dollars</p>
          </div>
          <Under20Dollars maxItems={8} showViewAll={true} />
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-secondary-900 mb-2">
              Shop by Category
            </h2>
            <p className="text-secondary-600">Find deals in your favorite categories</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[
              { name: 'Electronics', slug: 'electronics', icon: '📱', color: 'from-blue-400 to-blue-600' },
              { name: 'Fashion', slug: 'fashion', icon: '👕', color: 'from-pink-400 to-pink-600' },
              { name: 'Home & Garden', slug: 'home-garden', icon: '🏠', color: 'from-green-400 to-green-600' },
              { name: 'Health & Beauty', slug: 'health-beauty', icon: '💄', color: 'from-purple-400 to-purple-600' },
              { name: 'Sports', slug: 'sports-outdoors', icon: '⚽', color: 'from-orange-400 to-orange-600' },
              { name: 'Books & Media', slug: 'books-media', icon: '📚', color: 'from-indigo-400 to-indigo-600' },
              { name: 'Food & Grocery', slug: 'food-grocery', icon: '🛒', color: 'from-red-400 to-red-600' },
              { name: 'Travel', slug: 'travel', icon: '✈️', color: 'from-cyan-400 to-cyan-600' },
              { name: 'Automotive', slug: 'automotive', icon: '🚗', color: 'from-gray-400 to-gray-600' },
              { name: 'Services', slug: 'services', icon: '⚙️', color: 'from-yellow-400 to-yellow-600' }
            ].map((category) => (
              <a
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group"
              >
                <div className={`bg-gradient-to-br ${category.color} rounded-2xl p-6 text-white text-center shadow-soft hover:shadow-medium transition-all duration-300 group-hover:scale-105`}>
                  <div className="text-3xl mb-3">{category.icon}</div>
                  <h3 className="font-semibold text-sm">{category.name}</h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-12 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of smart shoppers who save money every day with SaveBucks
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="inline-flex items-center px-8 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-md"
            >
              Sign Up Free
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <a
              href="/trending"
              className="inline-flex items-center px-8 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-primary-600 transition-colors"
            >
              Browse Deals
            </a>
          </div>
        </div>
      </section>

      {/* Floating Search Button */}
      <FloatingSearchButton />
    </div>
  )
}
