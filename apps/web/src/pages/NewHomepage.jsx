import React from 'react'
import { AnimatedCategoryNav } from '../components/Homepage/AnimatedCategoryNav.jsx'
import { VibrantHero } from '../components/Homepage/VibrantHero.jsx'
import { 
  TrendingDeals,
  FeaturedDeals, 
  NewDeals,
  TopRatedDeals
} from '../components/Homepage/EnhancedDealCollection.jsx'
import { VibrantLeaderboard } from '../components/Community/VibrantLeaderboard.jsx'
import { FloatingSearchButton } from '../components/Homepage/FloatingSearchButton.jsx'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Animated Category Navigation */}
      <AnimatedCategoryNav />

      {/* Vibrant Hero Section */}
      <VibrantHero />

      {/* Trending Deals Section */}
      <TrendingDeals maxItems={8} />

      {/* Featured Deals Section */}
      <FeaturedDeals maxItems={6} />

      {/* Community Section with Leaderboard */}
      <section className="py-16 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
          <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '4s' }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Community Champions
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Meet our top deal hunters who are saving the community thousands every day!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* New Deals */}
            <div className="lg:col-span-2">
              <NewDeals maxItems={6} />
            </div>
            
            {/* Leaderboard */}
            <div>
              <VibrantLeaderboard compact={true} showViewMore={true} />
            </div>
          </div>
        </div>
      </section>

      {/* Top Rated Deals */}
      <TopRatedDeals maxItems={8} />

      {/* Interactive Categories Section */}
      <section className="py-16 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-4xl font-black mb-4">
              Explore Every Category
            </h2>
            <p className="text-xl text-indigo-200 max-w-2xl mx-auto">
              From tech gadgets to fashion finds - discover amazing deals in every category
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[
              { name: 'Electronics', slug: 'electronics', icon: '📱', color: 'from-blue-400 to-cyan-400', deals: '245+' },
              { name: 'Fashion', slug: 'fashion', icon: '👗', color: 'from-pink-400 to-rose-400', deals: '189+' },
              { name: 'Home & Garden', slug: 'home-garden', icon: '🏠', color: 'from-green-400 to-emerald-400', deals: '156+' },
              { name: 'Health & Beauty', slug: 'health-beauty', icon: '💄', color: 'from-purple-400 to-violet-400', deals: '134+' },
              { name: 'Sports', slug: 'sports-outdoors', icon: '⚽', color: 'from-orange-400 to-amber-400', deals: '98+' },
              { name: 'Books & Media', slug: 'books-media', icon: '📚', color: 'from-indigo-400 to-blue-400', deals: '87+' },
              { name: 'Food & Grocery', slug: 'food-grocery', icon: '🛒', color: 'from-red-400 to-pink-400', deals: '76+' },
              { name: 'Travel', slug: 'travel', icon: '✈️', color: 'from-sky-400 to-blue-400', deals: '65+' },
              { name: 'Gaming', slug: 'gaming', icon: '🎮', color: 'from-violet-400 to-purple-400', deals: '89+' },
              { name: 'Toys & Kids', slug: 'toys', icon: '🧸', color: 'from-pink-300 to-rose-300', deals: '67+' }
            ].map((category, index) => (
              <a
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group relative"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both'
                }}
              >
                <div className={`relative bg-gradient-to-br ${category.color} rounded-3xl p-6 text-center shadow-2xl hover:shadow-3xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-2 transform`}>
                  <div className="text-4xl mb-3 group-hover:animate-bounce">{category.icon}</div>
                  <h3 className="font-bold text-white text-sm mb-2 leading-tight">{category.name}</h3>
                  <div className="text-xs text-white/80 font-medium">{category.deals} deals</div>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  
                  {/* Sparkle effect */}
                  <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-float" />
          <div className="absolute top-32 right-20 w-16 h-16 bg-white/10 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-white/10 rounded-full animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-32 right-1/3 w-12 h-12 bg-white/10 rounded-full animate-float" style={{ animationDelay: '3s' }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="text-8xl mb-8 animate-bounce">🚀</div>
          <h2 className="text-5xl font-black mb-6">
            Ready to Join the Savings Revolution?
          </h2>
          <p className="text-2xl mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of smart shoppers who save money every day with SaveBucks. 
            Find deals, share discoveries, and build wealth together!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a
              href="/signup"
              className="group relative overflow-hidden bg-white text-gray-900 font-black text-lg px-10 py-5 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="relative z-10 flex items-center">
                🎯 Start Saving Now
                <svg className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>
            
            <a
              href="/deals"
              className="border-3 border-white text-white font-black text-lg px-10 py-5 rounded-2xl hover:bg-white hover:text-gray-900 transition-all duration-300 backdrop-blur-sm bg-white/10"
            >
              🔥 Browse Hot Deals
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6">
              <div className="text-3xl font-black mb-2">10K+</div>
              <div className="text-sm font-medium">Happy Members</div>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6">
              <div className="text-3xl font-black mb-2">$2M+</div>
              <div className="text-sm font-medium">Money Saved</div>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6">
              <div className="text-3xl font-black mb-2">50K+</div>
              <div className="text-sm font-medium">Deals Posted</div>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6">
              <div className="text-3xl font-black mb-2">24/7</div>
              <div className="text-sm font-medium">New Deals</div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Search Button */}
      <FloatingSearchButton />
    </div>
  )
}
