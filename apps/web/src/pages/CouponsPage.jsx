import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Tag,
    Search,
    Filter,
    Copy,
    Check,
    Clock,
    Building2,
    ChevronRight,
    ChevronDown,
    Flame,
    Sparkles,
    BadgeCheck,
    ExternalLink,
    Calendar
} from 'lucide-react'
import { Container } from '../components/Layout/Container'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../lib/api'
import { setPageMeta } from '../lib/head'
import { toast } from '../lib/toast'
import { dateAgo, formatCompactNumber } from '../lib/format'

// Coupon card component
const CouponCard = ({ coupon, index }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(coupon.code)
        setCopied(true)
        toast.success('Code copied!')
        setTimeout(() => setCopied(false), 2000)
    }

    const isExpiringSoon = coupon.expires_at &&
        new Date(coupon.expires_at) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-violet-200 transition-all duration-300 group"
        >
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    {/* Company Logo */}
                    <Link to={`/company/${coupon.companies?.slug}`} className="flex-shrink-0">
                        {coupon.companies?.logo_url ? (
                            <motion.img
                                src={coupon.companies.logo_url}
                                alt={coupon.companies.name}
                                className="w-14 h-14 rounded-xl object-contain bg-white p-2 border border-slate-100 group-hover:scale-105 transition-transform"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center border border-slate-100">
                                <Building2 className="w-7 h-7 text-violet-600" />
                            </div>
                        )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                to={`/company/${coupon.companies?.slug}`}
                                className="font-semibold text-slate-900 hover:text-violet-700 transition-colors truncate"
                            >
                                {coupon.companies?.name || 'Unknown Store'}
                            </Link>
                            {coupon.companies?.is_verified && (
                                <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
                        </div>

                        <h3 className="text-sm text-slate-600 line-clamp-2">
                            {coupon.title || coupon.description}
                        </h3>
                    </div>

                    {/* Discount Badge */}
                    {coupon.discount_value && (
                        <div className={`px-3 py-1.5 rounded-full text-sm font-bold flex-shrink-0 ${coupon.discount_type === 'percentage'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                            : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                            }`}>
                            {coupon.discount_type === 'percentage'
                                ? `${coupon.discount_value}% OFF`
                                : `$${coupon.discount_value} OFF`
                            }
                        </div>
                    )}
                </div>

                {/* Code & Copy Button */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                        <Tag className="w-4 h-4 text-slate-400" />
                        <code className="flex-1 font-mono font-bold text-slate-900 text-sm tracking-wide">
                            {coupon.code}
                        </code>
                    </div>
                    <motion.button
                        onClick={handleCopy}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-3 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${copied
                            ? 'bg-emerald-500 text-white'
                            : 'bg-violet-600 hover:bg-violet-700 text-white'
                            }`}
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                Copy
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                        {coupon.expires_at && (
                            <span className={`flex items-center gap-1 ${isExpiringSoon ? 'text-red-500 font-medium' : ''}`}>
                                <Clock className="w-3.5 h-3.5" />
                                {isExpiringSoon ? 'Expiring soon' : `Expires ${dateAgo(coupon.expires_at)}`}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5" />
                            {coupon.uses_count || 0} uses
                        </span>
                    </div>

                    <a
                        href={coupon.url || coupon.companies?.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-violet-600 hover:text-violet-700 font-medium"
                    >
                        Visit Store <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>
        </motion.div>
    )
}

// Filter chip
const FilterChip = ({ label, onRemove }) => (
    <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-medium"
    >
        {label}
        <button onClick={onRemove} className="hover:text-violet-900">×</button>
    </motion.span>
)

// Main CouponsPage component
const CouponsPage = () => {
    const [filters, setFilters] = useState({
        search: '',
        company: '',
        sortBy: 'newest'
    })

    // Fetch coupons
    const { data: coupons, isLoading, error } = useQuery({
        queryKey: ['coupons', filters],
        queryFn: () => api.listCoupons(filters),
        staleTime: 5 * 60 * 1000
    })

    // Set page meta
    React.useEffect(() => {
        setPageMeta({
            title: 'Coupons & Promo Codes - Save Money | SaveBucks',
            description: 'Find the latest coupons, promo codes, and discounts from your favorite stores. Copy and save instantly!',
            canonical: '/coupons'
        })
    }, [])

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const clearFilters = () => {
        setFilters({ search: '', company: '', sortBy: 'newest' })
    }

    const hasActiveFilters = filters.search || filters.company

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 pt-16">
                <Container>
                    <div className="py-8">
                        <Skeleton className="h-10 w-72 mb-4" />
                        <Skeleton className="h-5 w-96 mb-8" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-48 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </Container>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 pt-16">
                <Container>
                    <div className="py-16 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Tag className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Coupons</h1>
                        <p className="text-slate-600 mb-6">Unable to load coupon data</p>
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
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white">
                <Container>
                    <div className="py-10 md:py-14">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-3xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <Tag className="w-6 h-6" />
                                </div>
                                <span className="text-amber-100 font-medium">Promo Codes & Discounts</span>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold mb-3">
                                Coupons & Promo Codes
                            </h1>
                            <p className="text-lg text-amber-100">
                                Browse verified coupon codes from top brands. Copy with one click and save instantly!
                            </p>
                        </motion.div>
                    </div>
                </Container>
            </div>

            <Container>
                <div className="py-6">
                    {/* Search & Filters */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search coupons or stores..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                                />
                            </div>

                            {/* Sort */}
                            <div className="relative">
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                    className="appearance-none w-full md:w-44 px-4 py-2.5 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-100 focus:border-violet-400 bg-white"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="popular">Most Popular</option>
                                    <option value="expiring">Expiring Soon</option>
                                    <option value="discount">Biggest Discount</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        {/* Active Filters */}
                        <AnimatePresence>
                            {hasActiveFilters && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 flex-wrap"
                                >
                                    <span className="text-sm text-slate-500">Active filters:</span>
                                    {filters.search && (
                                        <FilterChip
                                            label={`"${filters.search}"`}
                                            onRemove={() => handleFilterChange('search', '')}
                                        />
                                    )}
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-slate-500 hover:text-slate-700 font-medium ml-auto"
                                    >
                                        Clear all
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Results Count */}
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {coupons?.length || 0} Coupons Available
                        </h2>
                    </div>

                    {/* Coupons Grid */}
                    {coupons && coupons.length > 0 ? (
                        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <AnimatePresence>
                                {coupons.map((coupon, i) => (
                                    <CouponCard key={coupon.id} coupon={coupon} index={i} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Tag className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-2">No Coupons Found</h3>
                            <p className="text-slate-600 mb-6">
                                {hasActiveFilters
                                    ? 'Try adjusting your search to find more coupons.'
                                    : 'No coupons are available at the moment.'}
                            </p>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                                    Clear Filters
                                </button>
                            )}
                        </motion.div>
                    )}
                </div>
            </Container>
        </div>
    )
}

export default CouponsPage
