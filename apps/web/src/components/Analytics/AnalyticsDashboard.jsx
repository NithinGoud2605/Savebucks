import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    Eye,
    ThumbsUp,
    MessageCircle,
    Bookmark,
    Award,
    Calendar,
    Tag
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Skeleton } from '../ui/Skeleton';

/**
 * User Analytics Dashboard
 * 
 * Shows engagement stats, deal performance, and activity timeline.
 */
export default function AnalyticsDashboard() {
    const { user, isAuthenticated } = useAuth();

    // Fetch user analytics
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['user-analytics-me'],
        queryFn: () => apiRequest('/api/user-analytics/me?days=30'),
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000
    });

    // Fetch deal performance
    const { data: deals, isLoading: dealsLoading } = useQuery({
        queryKey: ['user-analytics-deals'],
        queryFn: () => apiRequest('/api/user-analytics/deals?limit=5&sort=engagement'),
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000
    });

    // Fetch top categories
    const { data: categories } = useQuery({
        queryKey: ['user-analytics-categories'],
        queryFn: () => apiRequest('/api/user-analytics/top-categories'),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000
    });

    // Fetch timeline
    const { data: timeline } = useQuery({
        queryKey: ['user-analytics-timeline'],
        queryFn: () => apiRequest('/api/user-analytics/timeline?days=14'),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000
    });

    if (!isAuthenticated) {
        return (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
                <p className="text-gray-600 mb-6">Sign in to view your engagement statistics.</p>
                <a href="/signin" className="btn-primary">Sign In</a>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-500">Your engagement stats from the last 30 days</p>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={Eye}
                    label="Total Views"
                    value={stats?.total_views || 0}
                    color="blue"
                    loading={statsLoading}
                />
                <StatCard
                    icon={ThumbsUp}
                    label="Net Votes"
                    value={stats?.net_votes || 0}
                    color="green"
                    loading={statsLoading}
                    showSign
                />
                <StatCard
                    icon={MessageCircle}
                    label="Comments"
                    value={stats?.comments_received || 0}
                    color="purple"
                    loading={statsLoading}
                />
                <StatCard
                    icon={Bookmark}
                    label="Saves"
                    value={stats?.saves_received || 0}
                    color="yellow"
                    loading={statsLoading}
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={Tag}
                    label="Deals Posted"
                    value={stats?.deals_posted || 0}
                    color="indigo"
                    loading={statsLoading}
                />
                <StatCard
                    icon={MessageCircle}
                    label="Comments Made"
                    value={stats?.comments_made || 0}
                    color="pink"
                    loading={statsLoading}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Engagement Rate"
                    value={`${stats?.engagement_rate || 0}%`}
                    color="emerald"
                    loading={statsLoading}
                />
                <StatCard
                    icon={Award}
                    label="Total Karma"
                    value={stats?.total_karma || 0}
                    color="orange"
                    loading={statsLoading}
                />
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Top Deals */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Top Performing Deals
                    </h3>

                    {dealsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-16 w,full" />
                            ))}
                        </div>
                    ) : deals?.length > 0 ? (
                        <div className="space-y-3">
                            {deals.map((deal, index) => (
                                <motion.a
                                    key={deal.id}
                                    href={`/deal/${deal.id}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-gray-100 text-gray-600' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-50 text-gray-500'
                                        }`}>
                                        #{index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{deal.title}</p>
                                        <div className="flex gap-3 text-xs text-gray-500">
                                            <span>👁 {deal.views_count || 0}</span>
                                            <span>👍 {deal.upvotes || 0}</span>
                                            <span>💬 {deal.comments || 0}</span>
                                            <span>🔖 {deal.saves || 0}</span>
                                        </div>
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Tag className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>No deals posted yet</p>
                        </div>
                    )}
                </div>

                {/* Activity Timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Activity (Last 14 Days)
                    </h3>

                    {timeline?.length > 0 ? (
                        <div className="space-y-2">
                            {timeline.slice(-7).map((day, index) => (
                                <div key={day.date} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500 w-12">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                    <div className="flex-1 flex gap-1 h-6">
                                        {/* Deals bar */}
                                        <div
                                            className="bg-violet-400 rounded-sm transition-all"
                                            style={{ width: `${Math.min(day.deals * 20, 50)}%` }}
                                            title={`${day.deals} deals`}
                                        />
                                        {/* Comments bar */}
                                        <div
                                            className="bg-blue-400 rounded-sm transition-all"
                                            style={{ width: `${Math.min(day.comments * 10, 50)}%` }}
                                            title={`${day.comments} comments`}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 w-16 text-right">
                                        {day.deals}D / {day.comments}C
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-4 mt-4 pt-4 border-t text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-violet-400 rounded-sm" /> Deals
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-blue-400 rounded-sm" /> Comments
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>No activity data yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Categories */}
            {categories?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-violet-500" />
                        Your Top Categories
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {categories.map((cat, index) => (
                            <div
                                key={cat.id}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full"
                            >
                                <span className="text-lg">{cat.icon || '📦'}</span>
                                <span className="font-medium text-gray-900">{cat.name}</span>
                                <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">
                                    {cat.count} deals
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, loading, showSign }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        pink: 'bg-pink-50 text-pink-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        orange: 'bg-orange-50 text-orange-600'
    };

    const displayValue = showSign && typeof value === 'number' && value > 0 ? `+${value}` : value;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-4"
        >
            <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
            </div>
            {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
            ) : (
                <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
            )}
            <p className="text-sm text-gray-500">{label}</p>
        </motion.div>
    );
}
