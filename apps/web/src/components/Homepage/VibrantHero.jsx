import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api'

export function VibrantHero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [animateStats, setAnimateStats] = useState(false)

  // Fetch real-time stats
  const { data: stats } = useQuery({
    queryKey: ['homepage-stats'],
    queryFn: () => apiRequest('/api/stats/homepage'),
    refetchInterval: 30000,
    initialData: {
      total_deals: 1250,
      active_deals: 890,
      total_savings: 125000,
      community_members: 5420
    }
  })

  const heroSlides = [
    {
      title: "💰 Save BIG with Community Power!",
      subtitle: "Join thousands of smart shoppers finding the best deals every day",
      gradient: "from-purple-600 via-pink-600 to-red-500",
      icon: "🚀",
      cta: "Start Saving Now"
    },
    {
      title: "🔥 Hot Deals Just Dropped!",
      subtitle: "Fresh deals added every minute by our amazing community",
      gradient: "from-orange-500 via-red-500 to-pink-500",
      icon: "⚡",
      cta: "Browse Hot Deals"
    },
    {
      title: "🎯 Never Miss a Deal Again!",
      subtitle: "Set up alerts and let the community notify you of great savings",
      gradient: "from-blue-600 via-purple-600 to-indigo-600",
      icon: "🎯",
      cta: "Set Up Alerts"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroSlides.length])

  useEffect(() => {
    setAnimateStats(true)
  }, [])

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const currentHero = heroSlides[currentSlide]

  return (
    <section className="relative min-h-[70vh] overflow-hidden">
      {/* Animated background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentHero.gradient} transition-all duration-1000`}>
        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float opacity-10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            >
              <div className="w-8 h-8 bg-white rounded-full" />
            </div>
          ))}
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10" 
             style={{
               backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
               backgroundSize: '40px 40px'
             }} 
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <div className="text-white">
            {/* Animated icon */}
            <div className="text-8xl mb-6 animate-bounce">
              {currentHero.icon}
            </div>
            
            {/* Main title */}
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-yellow-200 animate-pulse">
                {currentHero.title}
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              {currentHero.subtitle}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to="/deals"
                className="group relative overflow-hidden bg-white text-gray-900 font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {currentHero.cta}
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">🎯</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              
              <Link
                to="/signup"
                className="border-2 border-white text-white font-bold py-4 px-8 rounded-2xl hover:bg-white hover:text-gray-900 transition-all duration-300 backdrop-blur-sm bg-white/10"
              >
                Join Community 🚀
              </Link>
            </div>

            {/* Slide indicators */}
            <div className="flex space-x-2">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-white scale-125' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right side - Community stats */}
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-center text-white border border-white/30">
                <div className="text-3xl font-black mb-2">
                  {animateStats ? formatNumber(stats.total_deals) : '0'}
                </div>
                <div className="text-sm font-medium opacity-90">Total Deals</div>
                <div className="text-2xl mt-2">📦</div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-center text-white border border-white/30">
                <div className="text-3xl font-black mb-2">
                  {animateStats ? formatNumber(stats.active_deals) : '0'}
                </div>
                <div className="text-sm font-medium opacity-90">Active Now</div>
                <div className="text-2xl mt-2">🔥</div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-center text-white border border-white/30">
                <div className="text-3xl font-black mb-2">
                  ${animateStats ? formatNumber(stats.total_savings) : '0'}
                </div>
                <div className="text-sm font-medium opacity-90">Saved Today</div>
                <div className="text-2xl mt-2">💰</div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-center text-white border border-white/30">
                <div className="text-3xl font-black mb-2">
                  {animateStats ? formatNumber(stats.community_members) : '0'}
                </div>
                <div className="text-sm font-medium opacity-90">Members</div>
                <div className="text-2xl mt-2">👥</div>
              </div>
            </div>

            {/* Community highlight */}
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-white border border-white/30">
              <h3 className="text-lg font-bold mb-3 flex items-center">
                <span className="mr-2">🌟</span>
                Community Spotlight
              </h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  🏆
                </div>
                <div>
                  <div className="font-semibold">Deal Hunter of the Day</div>
                  <div className="text-sm opacity-90">@dealmaster found 15 hot deals today!</div>
                </div>
              </div>
            </div>

            {/* Live activity feed */}
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-white border border-white/30">
              <h3 className="text-lg font-bold mb-3 flex items-center">
                <span className="mr-2 animate-pulse">🔴</span>
                Live Activity
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>@sarah_saves posted a new deal</span>
                  <span className="text-green-300">Just now</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>@techdeals found 50% off electronics</span>
                  <span className="text-green-300">2m ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>@bargainhunter shared a coupon</span>
                  <span className="text-green-300">5m ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">Discover More</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  )
}

// Add custom CSS for floating animation
const style = document.createElement('style')
style.textContent = `
  @keyframes float {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    25% {
      transform: translateY(-20px) rotate(5deg);
    }
    50% {
      transform: translateY(-10px) rotate(-5deg);
    }
    75% {
      transform: translateY(-15px) rotate(3deg);
    }
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
`
document.head.appendChild(style)
