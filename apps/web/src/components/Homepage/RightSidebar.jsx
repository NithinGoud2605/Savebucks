import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { clsx } from 'clsx';
import { 
  Flame, 
  TrendingUp, 
  Tag, 
  ArrowRight, 
  Loader2,
  Trophy,
  Store,
  Hash,
  TrendingDown
} from 'lucide-react';

export function RightSidebar() {
  return (
    <aside className="space-y-3">
      <TrendingTagsWidget />
      <LeaderboardWidget />
    </aside>
  );
}

/**
 * HOT Community Highlight
 */
function HotCommunityBox() {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-2 border-orange-300 p-2 shadow-sm">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1 shadow-sm">
          <Flame className="w-2.5 h-2.5" />
          HOT
        </div>
      </div>

      <div className="flex items-start gap-1.5">
        {/* Avatar */}
        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
          JD
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 text-xs mb-0.5">john_doe</div>
          <div className="text-xs text-gray-700 leading-tight">
            Shared a whipping <span className="font-bold text-orange-900">70% off</span> on tech products 🌟
          </div>
        </div>
      </div>

      <Link
        to="/forums"
        className="mt-1.5 block text-center bg-white hover:bg-gray-50 text-orange-900 font-semibold py-1 rounded text-xs transition-all duration-200 shadow-sm"
      >
        View Community
      </Link>
    </div>
  );
}

/**
 * Quick Stats Widget
 */
function QuickStatsWidget() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['quick-stats'],
    queryFn: () => api.getQuickStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">
        Quick Stats
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-mint-600" />
        </div>
      ) : (
        <div className="space-y-1">
          <StatItem
            label="Live deals"
            value={stats?.liveDeals?.toLocaleString() || '0'}
            icon={TrendingUp}
            color="text-blue-600"
          />
          <StatItem
            label="Average savings"
            value={`$${stats?.avgSavings || '0'}`}
            icon={Tag}
            color="text-green-600"
          />
          <StatItem
            label="Coupons"
            value={stats?.couponsRedeemed?.toLocaleString() || '0'}
            icon={Tag}
            color="text-orange-600"
          />
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, icon: Icon, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className={clsx('w-2.5 h-2.5', color)} />
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <span className="text-xs font-bold text-gray-900">{value}</span>
    </div>
  );
}

/**
 * Leaderboard Widget
 */
function LeaderboardWidget() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', 'weekly'],
    queryFn: () => api.getLeaderboard('weekly', 5),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
          Leaderboard
        </h3>
        <Link
          to="/leaderboard"
          className="text-xs text-mint-600 hover:text-mint-700 font-medium flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-mint-600" />
        </div>
      ) : leaderboard && leaderboard.length > 0 ? (
        <div className="space-y-1">
          {leaderboard.slice(0, 5).map((user, index) => (
            <LeaderboardItem key={user.id} user={user} rank={index + 1} />
          ))}
        </div>
      ) : (
        <div className="text-center py-3 text-xs text-gray-500">
          No data yet
        </div>
      )}
    </div>
  );
}

function LeaderboardItem({ user, rank }) {
  const rankIcons = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  };

  return (
    <Link
      to={`/u/${user.handle}`}
      className="flex items-center gap-1.5 p-1 rounded-md hover:bg-gray-50 transition-colors"
    >
      <div className="flex-shrink-0 text-xs">
        {rankIcons[rank] || `${rank}️⃣`}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-900 truncate">
          {user.handle || `User ${user.id}`}
        </div>
      </div>
      <div className="flex-shrink-0 bg-mint-100 text-mint-700 px-1 py-0.5 rounded text-xs font-bold">
        {user.points || user.karma || 0}
      </div>
    </Link>
  );
}

/**
 * Top Companies Widget - 8 Companies Grid
 */
function TopCompaniesWidget() {
  const { data: companies, isLoading } = useQuery({
    queryKey: ['top-companies'],
    queryFn: () => api.getCompanies({ limit: 8, sort: 'newest', verified: true }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <Store className="w-3 h-3 text-mint-600" />
        Top Companies
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-mint-600" />
        </div>
      ) : companies && companies.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {companies.slice(0, 8).map((company, index) => (
            <Link
              key={company.id}
              to={`/company/${company.slug}`}
              className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-2 hover:from-mint-50 hover:to-emerald-50 transition-all duration-200 border border-gray-200 hover:border-mint-300 hover:shadow-md"
              title={company.name}
            >
              {/* Rank Badge */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-mint-500 to-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                {index + 1}
              </div>
              
              {/* Company Logo/Icon */}
              <div className="flex items-center justify-center h-8 mb-1">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <Store className="w-6 h-6 text-gray-400 group-hover:text-mint-600 transition-colors" />
                )}
              </div>
              
              {/* Company Name */}
              <div className="text-xs font-medium text-gray-900 text-center truncate group-hover:text-mint-700 transition-colors">
                {company.name}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-xs text-gray-500">
          No companies yet
        </div>
      )}
    </div>
  );
}

/**
 * Hot Coupons Widget
 */
function HotCouponsWidget() {
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['hot-coupons'],
    queryFn: () => api.listCoupons({ limit: 5, sort: 'newest' }),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
          Hot Coupons
        </h3>
        <Link
          to="/companies"
          className="text-xs text-mint-600 hover:text-mint-700 font-medium flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-mint-600" />
        </div>
      ) : coupons && coupons.length > 0 ? (
        <div className="space-y-1">
          {coupons.slice(0, 5).map((coupon) => (
            <HotCouponItem key={coupon.id} coupon={coupon} />
          ))}
        </div>
      ) : (
        <div className="text-center py-3 text-xs text-gray-500">
          No coupons yet
        </div>
      )}
    </div>
  );
}

function HotCouponItem({ coupon }) {
  const company = coupon.companies || {};

  return (
    <Link
      to={`/company/${company.slug}?tab=coupons`}
      className="block p-1.5 rounded-md hover:bg-amber-50 transition-colors group"
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <Tag className="w-2.5 h-2.5 text-amber-600" />
        <span className="text-xs font-semibold text-gray-900 truncate">
          {company.name || 'Store'}
        </span>
      </div>
      <div className="text-xs text-gray-600 line-clamp-2 mb-0.5">
        {coupon.title}
      </div>
      {coupon.coupon_code && (
        <div className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-xs font-mono font-bold inline-block">
          {coupon.coupon_code}
        </div>
      )}
    </Link>
  );
}

/**
 * Trending Tags Widget
 */
function TrendingTagsWidget() {
  const trendingTags = [
    { name: 'Electronics', count: 124, trend: 'up' },
    { name: 'Fashion', count: 89, trend: 'up' },
    { name: 'Home & Garden', count: 67, trend: 'down' },
    { name: 'Beauty', count: 45, trend: 'up' },
    { name: 'Sports', count: 32, trend: 'up' },
    { name: 'Books', count: 28, trend: 'down' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
          Trending Tags
        </h3>
        <Link
          to="/tags"
          className="text-xs text-mint-600 hover:text-mint-700 font-medium flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      <div className="space-y-1">
        {trendingTags.map((tag, index) => (
          <Link
            key={tag.name}
            to={`/tag/${tag.name.toLowerCase().replace(/\s+/g, '-')}`}
            className="flex items-center justify-between p-1 rounded-md hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Hash className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">{tag.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">{tag.count}</span>
              {tag.trend === 'up' ? (
                <TrendingUp className="w-2.5 h-2.5 text-green-500" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5 text-red-500" />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
