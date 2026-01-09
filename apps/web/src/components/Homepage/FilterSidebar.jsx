import React from 'react';
import {
  Flame,
  Clock,
  Smartphone,
  Home,
  Sparkles,
  DollarSign,
  Truck,
  Gift,
  Zap,
  Gamepad2,
  Book,
  Dumbbell,
  Heart,
  PawPrint,
  Percent,
  Coffee,
  Star
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/Tooltip';
import { Separator } from '../ui/Separator';

const FILTERS = [
  { id: 'all', label: 'All Deals', icon: Sparkles, hint: 'Browse all available deals' },
  { id: 'for-you', label: 'For You', icon: Star, hint: 'Personalized recommendations based on your activity', special: true },
  { id: 'trending', label: 'Trending', icon: Flame, hint: 'Hot deals right now' },
  { id: '50-off', label: '50%+ Off', icon: Percent, hint: 'Half price or more' },
  { id: 'under-20', label: 'Under $20', icon: DollarSign, hint: 'Budget-friendly finds' },
  { id: 'under-50', label: 'Under $50', icon: DollarSign, hint: 'Affordable options' },
  { id: 'free-shipping', label: 'Free Ship', icon: Truck, hint: 'No shipping fees' },
  { id: 'ending-soon', label: 'Ending Soon', icon: Clock, hint: 'Expiring deals' },
  { id: 'new-arrivals', label: 'New', icon: Zap, hint: 'Latest additions' },
  { id: 'freebies', label: 'Free Stuff', icon: Gift, hint: 'Completely free items' },
];


const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', icon: Smartphone },
  { id: 'fashion', label: 'Fashion', icon: Heart },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'toys', label: 'Toys & Games', icon: Gamepad2 },
  { id: 'sports', label: 'Sports', icon: Dumbbell },
  { id: 'books', label: 'Books', icon: Book },
  { id: 'food', label: 'Food', icon: Coffee },
  { id: 'pets', label: 'Pets', icon: PawPrint },
];

export function FilterSidebar({ activeFilter = 'all', onFilterChange, activeCategory, onCategoryChange }) {
  return (
    <TooltipProvider delayDuration={300}>
      <aside className="space-y-4">
        {/* Filters */}
        <div>
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Filters
          </h3>
          <div className="space-y-0.5">
            {FILTERS.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              const isForYou = filter.id === 'for-you';

              return (
                <Tooltip key={filter.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onFilterChange(filter.id)}
                      className={`
                        w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium 
                        transition-all duration-200 transform-gpu
                        ${isActive
                          ? isForYou
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/25'
                            : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20'
                          : isForYou
                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 hover:shadow-sm hover:translate-x-0.5'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm hover:translate-x-0.5'
                        }
                      `}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isForYou && !isActive ? 'text-amber-500' : ''}`} />
                      <span>{filter.label}</span>
                      {isForYou && (
                        <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-amber-100 text-amber-600'
                          }`}>
                          ✨
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {filter.hint}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        <Separator className="bg-slate-200" />

        {/* Categories */}
        <div>
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Categories
          </h3>
          <div className="space-y-0.5">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <Tooltip key={category.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onCategoryChange(isActive ? null : category.id)}
                      className={`
                        w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium 
                        transition-all duration-200 transform-gpu
                        ${isActive
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm hover:translate-x-0.5'
                        }
                      `}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{category.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    Browse {category.label.toLowerCase()} deals
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
