import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Trophy,
  Building2,
  Sparkles,
  Crown,
  Users
} from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { Separator } from '../ui/Separator';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/Tooltip';

// Mini sparkline component
function MiniSparkline({ data, color, trend }) {
  const chartData = data.map((value, index) => ({ value, index }));
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-12 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RightSidebar() {
  return (
    <TooltipProvider delayDuration={300}>
      <aside className="space-y-4">
        <TrendingTagsWidget />
        <Separator className="bg-slate-200" />
        <LeaderboardWidget />
      </aside>
    </TooltipProvider>
  );
}


function TrendingTagsWidget() {
  // Simulated trend data (could come from API)
  const tags = [
    { name: 'Electronics', count: 124, trend: 'up', data: [45, 52, 38, 65, 78, 85, 95], color: '#8b5cf6' },
    { name: 'Fashion', count: 89, trend: 'up', data: [30, 42, 55, 48, 62, 70, 68], color: '#ec4899' },
    { name: 'Home', count: 67, trend: 'down', data: [80, 72, 68, 55, 45, 40, 35], color: '#ef4444' },
    { name: 'Beauty', count: 45, trend: 'up', data: [20, 25, 32, 38, 42, 48, 55], color: '#f59e0b' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl p-3 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          Trending
        </h3>
        <Link to="/tags" className="text-[10px] text-violet-600 hover:text-violet-700 flex items-center gap-0.5 font-medium">
          All <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      <div className="space-y-1.5">
        {tags.map((tag, index) => (
          <motion.div
            key={tag.name}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.03 }}
          >
            <Link
              to={`/tag/${tag.name.toLowerCase()}`}
              className="flex items-center gap-2 px-2.5 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-slate-700 transition-all duration-200"
            >
              <span className="flex-1 truncate">{tag.name}</span>
              <MiniSparkline data={tag.data} color={tag.color} trend={tag.trend} />
              <span className="text-slate-400 text-[10px] min-w-[24px] text-right">{tag.count}</span>
              {tag.trend === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function TopCompaniesWidget() {
  const { data: companies, isLoading } = useQuery({
    queryKey: ['top-companies'],
    queryFn: () => api.getCompanies({ limit: 6, sort: 'newest', verified: true }),
    staleTime: 10 * 60 * 1000,
  });

  const fallbackCompanies = [
    { id: 1, name: 'Amazon', slug: 'amazon', initial: 'A', gradient: 'from-orange-400 to-orange-600' },
    { id: 2, name: 'Target', slug: 'target', initial: 'T', gradient: 'from-red-400 to-red-600' },
    { id: 3, name: 'Best Buy', slug: 'best-buy', initial: 'B', gradient: 'from-blue-400 to-blue-600' },
    { id: 4, name: 'Walmart', slug: 'walmart', initial: 'W', gradient: 'from-sky-400 to-blue-500' },
    { id: 5, name: 'Sony', slug: 'sony', initial: 'S', gradient: 'from-slate-500 to-slate-700' },
    { id: 6, name: 'Nike', slug: 'nike', initial: 'N', gradient: 'from-slate-700 to-slate-900' },
  ];

  const displayCompanies = companies?.length > 0 ? companies : fallbackCompanies;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl p-3 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-violet-500" />
          Top Companies
        </h3>
        <Link to="/companies" className="text-[10px] text-violet-600 hover:text-violet-700 flex items-center gap-0.5 font-medium">
          View All <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {displayCompanies.slice(0, 6).map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + index * 0.04 }}
            >
              <Link
                to={`/company/${company.slug}?tab=coupons`}
                className="group flex items-center justify-center aspect-square bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title={company.name}
              >
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="max-h-7 max-w-full object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className={`w-8 h-8 bg-gradient-to-br ${company.gradient || 'from-slate-500 to-slate-700'} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                    {company.initial || company.name?.[0] || '?'}
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function LeaderboardWidget() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', 'weekly'],
    queryFn: () => api.getLeaderboard('weekly', 5),
    staleTime: 5 * 60 * 1000,
  });

  const rankColors = [
    'bg-yellow-400 text-yellow-900',
    'bg-slate-300 text-slate-700',
    'bg-amber-500 text-amber-900',
    'bg-slate-200 text-slate-600',
    'bg-slate-200 text-slate-600',
  ];

  const avatarGradients = [
    'from-violet-500 to-purple-600',
    'from-pink-500 to-rose-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-green-600',
    'from-orange-500 to-red-500',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl p-3 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-yellow-500" />
          Top Savers
        </h3>
        <Link to="/leaderboard" className="text-[10px] text-violet-600 hover:text-violet-700 flex items-center gap-0.5 font-medium">
          View All <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : leaderboard?.length > 0 ? (
        <div className="space-y-1.5">
          {leaderboard.slice(0, 5).map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + index * 0.05 }}
            >
              <Link
                to={`/u/${user.handle}`}
                className="flex items-center gap-2.5 px-2.5 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
              >
                <div className={`w-6 h-6 ${rankColors[index]} rounded-md flex items-center justify-center text-[10px] font-bold`}>
                  {index + 1}
                </div>

                <div className={`w-8 h-8 bg-gradient-to-br ${avatarGradients[index]} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                  {user.handle?.[0]?.toUpperCase() || 'U'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800 truncate group-hover:text-violet-600 transition-colors">
                    {user.handle || `User`}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {(user.points || user.karma || 0).toLocaleString()} pts
                  </div>
                </div>

                {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-slate-400">
          <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          No data yet
        </div>
      )}
    </motion.div>
  );
}
