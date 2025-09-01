import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { setPageMeta } from '../lib/head.js'
import { api } from '../lib/api'
import { Card, CardContent, StatsCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Icon } from '../components/ui/Icon'
import { EnhancedDealCard } from '../components/Deal/EnhancedDealCard'
import { RightSidebar } from '../components/Layout/RightSidebar.jsx'

// Hero section with modern gradients and animations
const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const heroSlides = [
    {
      title: "Save Big on Every Purchase",
      subtitle: "Discover amazing deals, coupons, and discounts from top brands",
      cta: "Explore Deals",
      gradient: "from-blue-600 via-purple-600 to-blue-800",
      icon: "sparkles"
    },
    {
      title: "Hot Deals This Week",
      subtitle: "Up to 80% off on electronics, fashion, and home goods",
      cta: "Shop Now",
      gradient: "from-red-500 via-orange-500 to-yellow-500",
      icon: "fire"
    },
    {
      title: "Join Our Community",
      subtitle: "Share deals, save money, and help others find the best bargains",
      cta: "Get Started",
      gradient: "from-green-500 via-teal-500 to-blue-500",
      icon: "users"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-secondary-50 to-white">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400 to-purple-600 rounded-full blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex justify-center mb-6">
              <div className={`p-4 rounded-2xl bg-gradient-to-r ${heroSlides[currentSlide].gradient} shadow-2xl`}>
                <Icon name={heroSlides[currentSlide].icon} size="3xl" color="white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-secondary-900 mb-6 leading-tight">
              {heroSlides[currentSlide].title}
            </h1>
            
            <p className="text-xl md:text-2xl text-secondary-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              {heroSlides[currentSlide].subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="gradient"
                size="xl"
                leftIcon="arrowRight"
                className="shadow-2xl hover:shadow-3xl"
              >
                {heroSlides[currentSlide].cta}
              </Button>
              
              <Button
                variant="ghost"
                size="xl"
                leftIcon="play"
                className="text-secondary-700 hover:text-secondary-900"
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide indicators */}
        <div className="flex justify-center mt-12 gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-primary-600 w-8' 
                  : 'bg-secondary-300 hover:bg-secondary-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// Stats section with animated counters
const StatsSection = () => {
  const { data: stats } = useQuery({
    queryKey: ['navbar-stats'],
    queryFn: () => api.getNavbarStats(),
    refetchInterval: 60000
  })

  const statsData = [
    {
      title: "Active Deals",
      value: stats?.deals_today || "2.5K",
      description: "Updated daily",
      icon: <Icon name="tag" size="lg" color="primary" />,
      trend: "up",
      trendValue: "+12%",
      color: "primary"
    },
    {
      title: "Money Saved",
      value: "$1.2M",
      description: "By our community",
      icon: <Icon name="dollarSign" size="lg" color="success" />,
      trend: "up",
      trendValue: "+28%",
      color: "success"
    },
    {
      title: "Happy Users",
      value: stats?.users_online || "15K",
      description: "And growing",
      icon: <Icon name="users" size="lg" color="warning" />,
      trend: "up",
      trendValue: "+5%",
      color: "warning"
    },
    {
      title: "Coupons Available",
      value: stats?.coupons_today || "850",
      description: "Ready to use",
      icon: <Icon name="ticket" size="lg" color="danger" />,
      trend: "up",
      trendValue: "+18%",
      color: "danger"
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
            Join our growing community of smart shoppers who save money every day
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatsCard {...stat} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Featured deals section
const FeaturedDealsSection = () => {
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['featured-deals'],
    queryFn: () => api.getDeals({ featured: true, limit: 8 }),
    staleTime: 5 * 60 * 1000
  })

  return (
    <section className="py-16 bg-gradient-to-br from-secondary-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="gradient" size="lg" className="mb-4">
            ⭐ Featured
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            Editor's Choice Deals
          </h2>
          <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
            Hand-picked deals by our team of bargain hunters
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse h-96 bg-secondary-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {deals.map((deal, index) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <EnhancedDealCard 
                  deal={deal} 
                  variant="featured"
                  compact
                />
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Button
            variant="outline"
            size="lg"
            rightIcon="arrowRight"
          >
            View All Featured Deals
          </Button>
        </div>
      </div>
    </section>
  )
}

// Categories section
const CategoriesSection = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    staleTime: 10 * 60 * 1000
  })

  const featuredCategories = categories.slice(0, 8)

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
            Find deals in your favorite categories
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {featuredCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                hover
                clickable
                className="text-center p-6 group cursor-pointer"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                  {category.emoji || '🏷️'}
                </div>
                <h3 className="font-medium text-secondary-900 group-hover:text-primary-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-secondary-500 mt-1">
                  {category.deal_count || 0} deals
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Main homepage component
export default function EnhancedHomepage() {
  useEffect(() => {
    setPageMeta({
      title: 'SaveBucks - Best Deals, Coupons & Discounts',
      description: 'Find the best deals, coupons, and discounts from top brands. Save money on electronics, fashion, home goods, and more.',
      canonical: window.location.origin,
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <StatsSection />
      <FeaturedDealsSection />
      <CategoriesSection />
      
      {/* Newsletter section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-purple-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Never Miss a Deal
            </h2>
            <p className="text-lg text-primary-100 mb-8">
              Get the hottest deals delivered straight to your inbox
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-white/50 focus:outline-none"
              />
              <Button
                variant="secondary"
                size="lg"
                leftIcon="mail"
                className="bg-white text-primary-600 hover:bg-primary-50"
              >
                Subscribe
              </Button>
            </div>
            
            <p className="text-xs text-primary-200 mt-4">
              No spam, unsubscribe anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
