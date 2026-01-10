import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  Tag,
  Sparkles,
  TrendingUp,
  ShoppingBag,
  Laptop,
  Shirt,
  Home,
  Car,
  Gamepad2,
  Heart,
  UtensilsCrossed,
  Plane,
  Baby,
  Dumbbell,
  PawPrint
} from 'lucide-react'
import { api } from '../lib/api'
import { Container } from '../components/Layout/Container'
import { Skeleton } from '../components/ui/Skeleton'
import { setPageMeta } from '../lib/head'

// Icon map for categories
const CATEGORY_ICONS = {
  'electronics': Laptop,
  'fashion': Shirt,
  'home': Home,
  'automotive': Car,
  'gaming': Gamepad2,
  'health': Heart,
  'food': UtensilsCrossed,
  'travel': Plane,
  'baby': Baby,
  'sports': Dumbbell,
  'pets': PawPrint,
  'default': Tag
}

// Get icon for category
const getCategoryIcon = (slug) => {
  return CATEGORY_ICONS[slug?.toLowerCase()] || CATEGORY_ICONS.default
}

// Animated category card
const CategoryCard = ({ category, featured, index }) => {
  const Icon = getCategoryIcon(category.slug)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to={`/category/${category.slug}`}
        className={`group block h-full ${featured
          ? 'bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-violet-200 transition-all duration-300'
          : 'bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:border-violet-200 transition-all duration-300'
          }`}
      >
        <div className={`flex ${featured ? 'flex-col items-center text-center' : 'items-center gap-4'}`}>
          {/* Icon */}
          <motion.div
            className={`${featured ? 'w-16 h-16 mb-4' : 'w-12 h-12 flex-shrink-0'
              } rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110`}
            style={{
              background: `linear-gradient(135deg, ${category.color || '#8B5CF6'}22, ${category.color || '#8B5CF6'}44)`
            }}
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.4 }}
          >
            <Icon
              className={`${featured ? 'w-8 h-8' : 'w-6 h-6'}`}
              style={{ color: category.color || '#8B5CF6' }}
            />
          </motion.div>

          {/* Content */}
          <div className={featured ? 'text-center' : 'flex-1 min-w-0'}>
            <h3 className={`font-semibold text-slate-900 group-hover:text-violet-700 transition-colors ${featured ? 'text-lg mb-2' : 'text-base mb-0.5'
              }`}>
              {category.name}
            </h3>

            {category.description && (
              <p className={`text-slate-500 ${featured ? 'text-sm mb-3' : 'text-sm truncate'
                }`}>
                {category.description}
              </p>
            )}

            {/* Deal count badge */}
            {category.deal_count > 0 && (
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium ${featured ? 'mt-1' : ''
                }`}>
                <TrendingUp className="w-3 h-3" />
                {category.deal_count} active deals
              </div>
            )}
          </div>

          {/* Arrow for non-featured */}
          {!featured && (
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
          )}
        </div>

        {/* Gradient border effect on hover */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
      </Link>
    </motion.div>
  )
}

// Stats card
const StatsCard = ({ icon: Icon, value, label, color }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-xl border border-slate-200 p-5 text-center"
  >
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    <div className="text-sm text-slate-500">{label}</div>
  </motion.div>
)

const CategoriesPage = () => {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    setPageMeta({
      title: 'Browse Categories - Find Deals by Category | SaveBucks',
      description: 'Explore deals organized by category. From electronics to fashion, find the best discounts.',
      canonical: '/categories'
    })
  }, [])

  const featuredCategories = categories?.filter(cat => cat.is_featured && !cat.parent_id) || []
  const otherCategories = categories?.filter(cat => !cat.is_featured && !cat.parent_id) || []
  const totalDeals = categories?.reduce((sum, cat) => sum + (cat.deal_count || 0), 0) || 0

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16">
        <Container>
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Categories</h1>
            <p className="text-slate-600 mb-6">We couldn't load the categories.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              Try Again
            </button>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-14">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 text-white">
        <Container>
          <div className="py-10 md:py-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-violet-200 mb-4">
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white font-medium">Categories</span>
              </nav>

              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                Browse by Category
              </h1>
              <p className="text-lg text-violet-100 max-w-2xl">
                Find the best deals organized by category. From electronics to fashion, we've got you covered.
              </p>
            </motion.div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-8">
          {isLoading ? (
            <div className="space-y-8">
              <div>
                <Skeleton className="h-7 w-48 mb-5" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatsCard
                  icon={Tag}
                  value={categories?.length || 0}
                  label="Categories"
                  color="bg-gradient-to-br from-violet-500 to-purple-600"
                />
                <StatsCard
                  icon={TrendingUp}
                  value={totalDeals}
                  label="Active Deals"
                  color="bg-gradient-to-br from-emerald-500 to-teal-600"
                />
                <StatsCard
                  icon={Sparkles}
                  value={featuredCategories.length}
                  label="Featured"
                  color="bg-gradient-to-br from-amber-500 to-orange-600"
                />
              </div>

              {/* Featured Categories */}
              {featuredCategories.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Featured Categories</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {featuredCategories.map((category, i) => (
                      <CategoryCard key={category.id} category={category} featured index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* All Categories */}
              {otherCategories.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center">
                      <Tag className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">All Categories</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {otherCategories.map((category, i) => (
                      <CategoryCard key={category.id} category={category} featured={false} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {categories && categories.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Tag className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Categories Available</h3>
                  <p className="text-slate-600">
                    Categories will appear here once they've been added.
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}

export default CategoriesPage
