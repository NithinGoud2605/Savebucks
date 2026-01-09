import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Gift,
    Copy,
    Check,
    Users,
    Trophy,
    Share2,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { api, apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { Skeleton } from '../ui/Skeleton';

/**
 * Referral Dashboard Component
 * 
 * Shows user's referral code, stats, and referral history.
 * Premium design with share functionality.
 */
export default function ReferralDashboard() {
    const { user, isAuthenticated } = useAuth();
    const [copied, setCopied] = useState(false);

    // Fetch referral code
    const { data: codeData, isLoading: codeLoading } = useQuery({
        queryKey: ['my-referral-code'],
        queryFn: () => apiRequest('/api/referrals/my-code'),
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000
    });

    // Fetch referral stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['referral-stats'],
        queryFn: () => apiRequest('/api/referrals/stats'),
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000
    });

    // Fetch leaderboard
    const { data: leaderboard } = useQuery({
        queryKey: ['referral-leaderboard'],
        queryFn: () => apiRequest('/api/referrals/leaderboard?limit=5'),
        staleTime: 5 * 60 * 1000
    });

    const handleCopy = async () => {
        if (codeData?.link) {
            await navigator.clipboard.writeText(codeData.link);
            setCopied(true);
            toast.success('Referral link copied!');
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const handleShare = async () => {
        if (navigator.share && codeData?.link) {
            try {
                await navigator.share({
                    title: 'Join SaveBucks!',
                    text: 'Get amazing deals and save money with SaveBucks. Use my referral link to get bonus points!',
                    url: codeData.link
                });
            } catch (e) {
                handleCopy();
            }
        } else {
            handleCopy();
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-2xl p-8 text-center">
                <Gift className="w-16 h-16 text-violet-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Invite Friends, Earn Rewards!</h2>
                <p className="text-gray-600 mb-6">Sign in to get your unique referral code and start earning.</p>
                <a href="/signin" className="btn-primary">Sign In</a>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Hero Section - Referral Code */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-8 text-white"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Gift className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Invite & Earn</h1>
                            <p className="text-white/80">Get 100 points for every friend who joins!</p>
                        </div>
                    </div>

                    {/* Referral Code */}
                    {codeLoading ? (
                        <Skeleton className="h-16 w-full bg-white/20 rounded-xl" />
                    ) : (
                        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-4">
                            <p className="text-xs text-white/70 mb-1">Your referral code</p>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-mono font-bold tracking-wider">
                                    {codeData?.code || '------'}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Share Link */}
                    <div className="flex gap-3">
                        <input
                            type="text"
                            readOnly
                            value={codeData?.link || 'Loading...'}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm"
                        />
                        <button
                            onClick={handleCopy}
                            className="px-6 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-white/90 transition-colors"
                        >
                            Copy Link
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={Users}
                    label="Total Referrals"
                    value={stats?.total_referrals || 0}
                    color="blue"
                    loading={statsLoading}
                />
                <StatCard
                    icon={Check}
                    label="Completed"
                    value={stats?.completed || 0}
                    color="green"
                    loading={statsLoading}
                />
                <StatCard
                    icon={Sparkles}
                    label="Pending"
                    value={stats?.pending || 0}
                    color="yellow"
                    loading={statsLoading}
                />
                <StatCard
                    icon={Trophy}
                    label="Points Earned"
                    value={stats?.total_earned || 0}
                    color="purple"
                    loading={statsLoading}
                />
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Referrals */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-violet-500" />
                        Recent Referrals
                    </h3>

                    {statsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : stats?.referrals?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.referrals.slice(0, 5).map(referral => (
                                <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                                            {referral.referred?.avatar_url ? (
                                                <img src={referral.referred.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                                            ) : (
                                                <span className="text-violet-600 font-medium">
                                                    {referral.referred?.display_name?.[0] || '?'}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {referral.referred?.display_name || referral.referred?.handle || 'New User'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(referral.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${referral.status === 'rewarded'
                                            ? 'bg-green-100 text-green-700'
                                            : referral.status === 'completed'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {referral.status === 'rewarded' ? `+${referral.referrer_reward}` : referral.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>No referrals yet. Share your code!</p>
                        </div>
                    )}
                </div>

                {/* Leaderboard */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Top Referrers
                    </h3>

                    {leaderboard?.length > 0 ? (
                        <div className="space-y-3">
                            {leaderboard.map((user, index) => (
                                <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                            index === 1 ? 'bg-gray-300 text-gray-700' :
                                                index === 2 ? 'bg-orange-300 text-orange-800' :
                                                    'bg-gray-100 text-gray-600'
                                        }`}>
                                        {index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{user.display_name || user.handle}</p>
                                        <p className="text-xs text-gray-500">{user.referral_count} referrals</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Be the first on the leaderboard!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">How It Works</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <Step
                        number={1}
                        title="Share Your Code"
                        description="Copy your unique referral link and share it with friends"
                    />
                    <Step
                        number={2}
                        title="Friends Sign Up"
                        description="When they create an account using your link, they get 50 bonus points"
                    />
                    <Step
                        number={3}
                        title="Earn Rewards"
                        description="You earn 100 points for each friend who joins!"
                    />
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, loading }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600'
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
            </div>
            {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
            ) : (
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            )}
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    );
}

function Step({ number, title, description }) {
    return (
        <div className="flex gap-4">
            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                {number}
            </div>
            <div>
                <h4 className="font-semibold text-gray-900">{title}</h4>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </div>
    );
}
