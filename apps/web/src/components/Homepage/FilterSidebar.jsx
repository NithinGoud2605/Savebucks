import React from 'react';
import { clsx } from 'clsx';
import { 
  Flame, 
  Percent, 
  Clock,
  Grid3x3,
  Smartphone,
  ShoppingBag,
  Home,
  Sparkles,
  DollarSign,
  Truck,
  Gift,
  TrendingUp,
  Zap,
  Package,
  Gamepad2,
  Book,
  Car,
  Utensils,
  Dumbbell,
  Baby,
  PawPrint
} from 'lucide-react';

// Comprehensive filter options
const FILTERS = [
  { id: 'all', label: 'All Deals', icon: Grid3x3, color: 'text-blue-600' },
  { id: 'trending', label: 'Trending', icon: Flame, color: 'text-cyan-600' },
  { id: 'hot', label: 'Hot Deals', icon: TrendingUp, color: 'text-indigo-600' },
  { id: '50-off', label: '50% Off+', icon: Percent, color: 'text-blue-700' },
  { id: 'under-10', label: 'Under $10', icon: DollarSign, color: 'text-cyan-700' },
  { id: 'under-25', label: 'Under $25', icon: DollarSign, color: 'text-indigo-700' },
  { id: 'under-50', label: 'Under $50', icon: DollarSign, color: 'text-blue-800' },
  { id: 'free-shipping', label: 'Free Shipping', icon: Truck, color: 'text-cyan-800' },
  { id: 'ending-soon', label: 'Ending Soon', icon: Clock, color: 'text-indigo-800' },
  { id: 'new-arrivals', label: 'New Arrivals', icon: Sparkles, color: 'text-blue-900' },
  { id: 'freebies', label: 'Free Stuff', icon: Gift, color: 'text-cyan-900' },
  { id: 'flash-sale', label: 'Flash Sales', icon: Zap, color: 'text-indigo-900' },
];

// Comprehensive categories
const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', icon: Smartphone, color: 'text-blue-600' },
  { id: 'fashion', label: 'Fashion', icon: ShoppingBag, color: 'text-cyan-600' },
  { id: 'home', label: 'Home & Garden', icon: Home, color: 'text-indigo-600' },
  { id: 'beauty', label: 'Beauty & Health', icon: Sparkles, color: 'text-blue-700' },
  { id: 'toys', label: 'Toys & Games', icon: Gamepad2, color: 'text-cyan-700' },
  { id: 'sports', label: 'Sports & Fitness', icon: Dumbbell, color: 'text-indigo-700' },
  { id: 'books', label: 'Books & Media', icon: Book, color: 'text-blue-800' },
  { id: 'automotive', label: 'Automotive', icon: Car, color: 'text-cyan-800' },
  { id: 'food', label: 'Food & Grocery', icon: Utensils, color: 'text-indigo-800' },
  { id: 'baby', label: 'Baby & Kids', icon: Baby, color: 'text-blue-900' },
  { id: 'pets', label: 'Pet Supplies', icon: PawPrint, color: 'text-cyan-900' },
  { id: 'office', label: 'Office Supplies', icon: Package, color: 'text-indigo-900' },
];

export function FilterSidebar({ activeFilter = 'all', onFilterChange, activeCategory, onCategoryChange }) {
  return (
    <aside className="space-y-2 py-1">
      {/* Quick Filters - Ultra Compact */}
      <div className="bg-white rounded-md border border-gray-200 p-2 shadow-sm">
        <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 text-blue-600" />
          Filters
        </h3>
        <div className="space-y-0.5">
          {FILTERS.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            
            return (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={clsx(
                  'w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 active:bg-gray-100'
                )}
              >
                <Icon className={clsx('w-3 h-3 flex-shrink-0', isActive ? 'text-white' : filter.color)} />
                <span className="truncate text-left flex-1">{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories - Ultra Compact */}
      <div className="bg-white rounded-md border border-gray-200 p-2 shadow-sm">
        <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          <Grid3x3 className="w-2.5 h-2.5 text-blue-600" />
          Categories
        </h3>
        <div className="space-y-0.5">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(isActive ? null : category.id)}
                className={clsx(
                  'w-full flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 active:bg-gray-100'
                )}
              >
                <Icon className={clsx('w-3 h-3 flex-shrink-0', isActive ? 'text-white' : category.color)} />
                <span className="truncate text-left flex-1">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
