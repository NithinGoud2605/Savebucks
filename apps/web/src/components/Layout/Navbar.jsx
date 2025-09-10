import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, apiRequest } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import * as Avatar from '@radix-ui/react-avatar'
import * as Separator from '@radix-ui/react-separator'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { 
  ChevronDownIcon, 
  Bars3Icon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  SparklesIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  BookmarkIcon,
  BellIcon,
  ShoppingBagIcon,
  StarIcon,
  PlusIcon,
  TagIcon,
  UserIcon,
  TrophyIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  HeartIcon,
  ClockIcon,
  BoltIcon,
  HomeIcon,
  GiftIcon,
  BuildingOfficeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { 
  FireIcon, 
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/solid'
import NotificationBell from '../User/NotificationBell'
import UnifiedSearch from '../Search/UnifiedSearch.jsx'
import LocationSearchBar from '../Search/LocationSearchBar'

// Utility function for class variants
const cn = (...classes) => classes.filter(Boolean).join(' ')

// Button variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700",
        secondary: "bg-secondary-100 text-secondary-900 hover:bg-secondary-200",
        ghost: "hover:bg-secondary-100 hover:text-secondary-900",
        outline: "border border-secondary-300 bg-transparent hover:bg-secondary-100",
        gradient: "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-sm hover:shadow-md"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

const Navbar = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef(null)

  // Get categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
    staleTime: 5 * 60 * 1000
  })

  // Get navbar stats (users online, deals today, coupons today)
  const { data: navbarStats, error: statsError } = useQuery({
    queryKey: ['navbar-stats'],
    queryFn: () => api.getNavbarStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
    retry: 2
  })

  // Track user session (heartbeat)
  useEffect(() => {
    if (user) {
      // Track initial session
      api.trackUserSession(location.pathname).catch(console.error)
      
      // Set up heartbeat interval
      const heartbeatInterval = setInterval(() => {
        api.trackUserSession(location.pathname).catch(console.error)
      }, 60000) // Every minute

      return () => clearInterval(heartbeatInterval)
    }
  }, [user, location.pathname])

  // Get current pathname for active state
  const currentPath = location.pathname

  // Filter tags for secondary navbar
  const filterTags = [
    {
      id: 'all',
      name: 'All Deals',
      icon: 'fire',
      path: '/',
      active: currentPath === '/',
      color: 'primary'
    },
    {
      id: 'trending',
      name: 'Trending Now',
      icon: 'bolt',
      path: '/trending',
      active: currentPath === '/trending',
      color: 'orange'
    },
    {
      id: 'under-20',
      name: 'Under $20',
      icon: 'star',
      path: '/under-20',
      active: currentPath === '/under-20',
      color: 'green'
    },
    {
      id: '50-percent-off',
      name: '50% Off+',
      icon: 'fire',
      path: '/50-percent-off',
      active: currentPath === '/50-percent-off',
      color: 'red'
    },
    {
      id: 'free-shipping',
      name: 'Free Shipping',
      icon: 'gift',
      path: '/free-shipping',
      active: currentPath === '/free-shipping',
      color: 'blue'
    },
    {
      id: 'new-arrivals',
      name: 'New Arrivals',
      icon: 'clock',
      path: '/new-arrivals',
      active: currentPath === '/new-arrivals',
      color: 'purple'
    },
    {
      id: 'hot-deals',
      name: 'Hot Deals',
      icon: 'fire',
      path: '/hot-deals',
      active: currentPath === '/hot-deals',
      color: 'red'
    },
    {
      id: 'ending-soon',
      name: 'Ending Soon',
      icon: 'clock',
      path: '/ending-soon',
      active: currentPath === '/ending-soon',
      color: 'orange'
    }
  ]

  const handleSignOut = () => {
    signOut()
    setIsMenuOpen(false)
    navigate('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  // Helper function to get icon component
  const getIconComponent = (iconName) => {
    const iconMap = {
      fire: FireIcon,
      bolt: BoltIcon,
      eye: EyeIcon,
      heart: HeartIcon,
      clock: ClockIcon,
      star: StarIcon,
      trophy: TrophyIcon,
      home: HomeIcon,
      gift: GiftIcon
    }
    return iconMap[iconName] || FireIcon
  }

  // Helper function to get color classes
  const getColorClasses = (color, isActive) => {
    if (isActive) {
      return 'bg-primary-600 text-white'
    }
    
    const colorMap = {
      primary: 'bg-white border-primary-200 text-primary-700 hover:bg-primary-50',
      orange: 'bg-white border-orange-200 text-orange-700 hover:bg-orange-50',
      blue: 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50',
      red: 'bg-white border-red-200 text-red-700 hover:bg-red-50',
      green: 'bg-white border-green-200 text-green-700 hover:bg-green-50',
      yellow: 'bg-white border-yellow-200 text-yellow-700 hover:bg-yellow-50',
      pink: 'bg-white border-pink-200 text-pink-700 hover:bg-pink-50',
      purple: 'bg-white border-purple-200 text-purple-700 hover:bg-purple-50'
    }
    
    return colorMap[color] || 'bg-white border-secondary-200 text-secondary-700 hover:bg-secondary-50'
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-secondary-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="flex h-16 w-16 items-center justify-center">
                <img 
                  src="/logo.svg" 
                  alt="SaveBucks Logo" 
                  className="h-16 w-16 object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:flex-1 lg:space-x-6 overflow-visible">
            
            {/* Search Bar - Full Width */}
            <div className="relative flex-1 overflow-visible">
              <LocationSearchBar
                placeholder="Search for deals, coupons, stores..."
                showLocationSelector={true}
                className="w-full"
              />
            </div>

            {/* Navigation Menu */}
            <NavigationMenu.Root className="relative z-10 flex max-w-max items-center justify-center flex-shrink-0">
              <NavigationMenu.List className="group flex list-none items-center justify-center space-x-1">
                
                {/* Categories Dropdown */}
                <NavigationMenu.Item>
                  <NavigationMenu.Trigger className="group inline-flex h-10 w-max items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-100 hover:text-primary-600 focus:bg-secondary-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-secondary-100 data-[active]:bg-secondary-100">
                    <ShoppingBagIcon className="mr-2 h-4 w-4" />
                    Categories
                    <ChevronDownIcon className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180" />
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content className="absolute top-0 left-0 w-full data-[motion=from-start]:animate-enterFromLeft data-[motion=from-end]:animate-enterFromRight data-[motion=to-start]:animate-exitToLeft data-[motion=to-end]:animate-exitToRight sm:w-auto">
                    <ul className="grid w-[440px] gap-3 p-4 md:w-[500px] md:grid-cols-[0.75fr_1fr] lg:w-[600px]">
                                            <li className="row-span-3">
                        <NavigationMenu.Link asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-end rounded-lg bg-gradient-to-b from-primary-500 to-primary-600 p-6 no-underline outline-none focus:shadow-md"
                            to="/categories"
                          >
                            <div className="mb-2 mt-4 text-lg font-medium text-white">
                              Browse All Categories
                            </div>
                            <p className="text-sm leading-tight text-primary-100">
                              Discover amazing deals across all categories
                            </p>
                          </Link>
                        </NavigationMenu.Link>
                      </li>
                      
                      {/* Electronics & Tech */}
                      <li>
                        <NavigationMenu.Link asChild>
                          <Link
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary-100 focus:bg-secondary-100"
                            to="/category/electronics"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <div className="text-sm font-medium leading-none text-secondary-900">
                                Electronics & Tech
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-secondary-600">
                              Phones, laptops, gadgets & more
                            </p>
                          </Link>
                        </NavigationMenu.Link>
                      </li>

                      {/* Fashion & Clothing */}
                      <li>
                        <NavigationMenu.Link asChild>
                          <Link
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary-100 focus:bg-secondary-100"
                            to="/category/fashion"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              <div className="text-sm font-medium leading-none text-secondary-900">
                                Fashion & Clothing
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-secondary-600">
                              Apparel, shoes & accessories
                            </p>
                          </Link>
                        </NavigationMenu.Link>
                      </li>

                      {/* Home & Garden */}
                      <li>
                        <NavigationMenu.Link asChild>
                          <Link
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary-100 focus:bg-secondary-100"
                            to="/category/home-garden"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                              <div className="text-sm font-medium leading-none text-secondary-900">
                                Home & Garden
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-secondary-600">
                              Furniture, decor & outdoor
                            </p>
                          </Link>
                        </NavigationMenu.Link>
                      </li>

                      {/* Sports & Outdoors */}
                      <li>
                        <NavigationMenu.Link asChild>
                          <Link
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary-100 focus:bg-secondary-100"
                            to="/category/sports-outdoors"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                              </svg>
                              <div className="text-sm font-medium leading-none text-secondary-900">
                                Sports & Outdoors
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-secondary-600">
                              Fitness, camping & recreation
                            </p>
                          </Link>
                        </NavigationMenu.Link>
                      </li>

                      {/* Beauty & Health */}
                      <li>
                        <NavigationMenu.Link asChild>
                          <Link
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary-100 focus:bg-secondary-100"
                            to="/category/beauty-health"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <div className="text-sm font-medium leading-none text-secondary-900">
                                Beauty & Health
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-secondary-600">
                              Cosmetics, wellness & personal care
                            </p>
                          </Link>
                        </NavigationMenu.Link>
                      </li>

                      {/* Toys & Games */}
                      <li>
                        <NavigationMenu.Link asChild>
                        <Link
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary-100 focus:bg-secondary-100"
                            to="/category/toys-games"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="text-sm font-medium leading-none text-secondary-900">
                                Toys & Games
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-secondary-600">
                              Board games, puzzles & entertainment
                            </p>
                        </Link>
                        </NavigationMenu.Link>
                      </li>

                      {/* Automotive */}
                      <li>
                        <NavigationMenu.Link asChild>
                          <Link
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary-100 focus:bg-secondary-100"
                            to="/category/automotive"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-8 0h8m-8 0a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2" />
                              </svg>
                              <div className="text-sm font-medium leading-none text-secondary-900">
                                Automotive
                    </div>
                  </div>
                            <p className="line-clamp-2 text-sm leading-snug text-secondary-600">
                              Car parts, accessories & tools
                            </p>
                          </Link>
                        </NavigationMenu.Link>
                      </li>

                      {/* Books & Media */}
                      <li>
                        <NavigationMenu.Link asChild>
                    <Link
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary-100 focus:bg-secondary-100"
                            to="/category/books-media"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <div className="text-sm font-medium leading-none text-secondary-900">
                                Books & Media
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-secondary-600">
                              Books, movies, music & more
                            </p>
                    </Link>
                        </NavigationMenu.Link>
                      </li>

                      {/* Food & Beverages */}
                      <li>
                        <NavigationMenu.Link asChild>
                          <Link
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary-100 focus:bg-secondary-100"
                            to="/category/food-beverages"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" />
                              </svg>
                              <div className="text-sm font-medium leading-none text-secondary-900">
                                Food & Beverages
                  </div>
                </div>
                            <p className="line-clamp-2 text-sm leading-snug text-secondary-600">
                              Groceries, snacks & drinks
                            </p>
                          </Link>
                        </NavigationMenu.Link>
                      </li>

                      {/* Pet Supplies */}
                      <li>
                        <NavigationMenu.Link asChild>
                          <Link
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary-100 focus:bg-secondary-100"
                            to="/category/pet-supplies"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <div className="text-sm font-medium leading-none text-secondary-900">
                                Pet Supplies
                              </div>
            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-secondary-600">
                              Pet food, toys & accessories
                            </p>
                          </Link>
                        </NavigationMenu.Link>
                      </li>

                      {/* Office & School */}
                      <li>
                        <NavigationMenu.Link asChild>
            <Link
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary-100 focus:bg-secondary-100"
                            to="/category/office-school"
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <div className="text-sm font-medium leading-none text-secondary-900">
                                Office & School
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-secondary-600">
                              Supplies, furniture & equipment
                            </p>
            </Link>
                        </NavigationMenu.Link>
                      </li>
                    </ul>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>

                {/* Coupons Link */}

                {/* Companies Link */}
                <NavigationMenu.Item>
                  <NavigationMenu.Link asChild>
            <Link
              to="/companies"
                      className="group inline-flex h-10 w-max items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-100 hover:text-primary-600 focus:bg-secondary-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-secondary-100"
            >
                      <BuildingOfficeIcon className="mr-2 h-4 w-4" />
                      Companies
            </Link>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>

                {/* Community Link */}
                <NavigationMenu.Item>
                  <NavigationMenu.Link asChild>
            <Link
              to="/forums"
                      className="group inline-flex h-10 w-max items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-100 hover:text-primary-600 focus:bg-secondary-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-secondary-100"
            >
                      <UserGroupIcon className="mr-2 h-4 w-4" />
                      Community
            </Link>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>


                {/* Saved Items Link */}
                <NavigationMenu.Item>
                  <NavigationMenu.Link asChild>
                    <Link
                      to="/saved-items"
                      className="group inline-flex h-10 w-max items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-100 hover:text-primary-600 focus:bg-secondary-100 focus:outline-none"
                    >
                      <BookmarkIcon className="mr-2 h-4 w-4" />
                      Saved Items
                    </Link>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              </NavigationMenu.List>

              <div className="absolute top-full flex justify-center">
                <NavigationMenu.Viewport className="origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-lg border border-secondary-200 bg-white text-secondary-900 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]" />
          </div>
            </NavigationMenu.Root>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Post Deal Button */}
              <Link
                to="/post"
                className="hidden lg:inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden xl:inline">Post Deal/Coupon</span>
                <span className="xl:hidden">Post</span>
              </Link>

              {/* User Menu */}
              {user ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full border border-secondary-200 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors">
                    <Avatar.Root className="flex h-8 w-8 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
                      {user.user_metadata?.avatar_url ? (
                        <Avatar.Image
                          className="h-full w-full object-cover"
                          src={user.user_metadata.avatar_url}
                          alt={user.user_metadata?.full_name || user.email}
                        />
                      ) : (
                        <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white">
                          {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                        </Avatar.Fallback>
                      )}
                    </Avatar.Root>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-[220px] overflow-hidden rounded-lg border border-secondary-200 bg-white p-1 text-secondary-900 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                    sideOffset={5}
                  >
                    <div className="flex items-center justify-start gap-2 p-2">
                      <Avatar.Root className="flex h-8 w-8 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
                  {user.user_metadata?.avatar_url ? (
                          <Avatar.Image
                            className="h-full w-full object-cover"
                      src={user.user_metadata.avatar_url}
                            alt={user.user_metadata?.full_name || user.email}
                    />
                  ) : (
                          <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white">
                            {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                          </Avatar.Fallback>
                        )}
                      </Avatar.Root>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-secondary-900">
                          {user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs leading-none text-secondary-500">
                        {user.email}
                      </p>
                    </div>
                    </div>
                    <Separator.Root className="mx-1 h-px bg-secondary-200" />
                    
                    <DropdownMenu.Item asChild>
                      <Link
                        to={`/user/${user?.user_metadata?.handle || user?.id}`}
                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-secondary-100 focus:text-secondary-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <UserIcon className="mr-2 h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenu.Item>
                    
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/achievements"
                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-secondary-100 focus:text-secondary-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <TrophyIcon className="mr-2 h-4 w-4" />
                        Achievements
                      </Link>
                    </DropdownMenu.Item>
                    
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/saved-searches"
                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-secondary-100 focus:text-secondary-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <BookmarkIcon className="mr-2 h-4 w-4" />
                        Saved Searches
                      </Link>
                    </DropdownMenu.Item>
                    
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/saved-items"
                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-secondary-100 focus:text-secondary-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <BookmarkIcon className="mr-2 h-4 w-4" />
                        Saved Items
                      </Link>
                    </DropdownMenu.Item>
                    
                    
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/settings"
                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-secondary-100 focus:text-secondary-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <CogIcon className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenu.Item>
                    
                    <Separator.Root className="mx-1 h-px bg-secondary-200" />
                    
                    <DropdownMenu.Item
                        onClick={handleSignOut}
                      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-secondary-100 focus:text-secondary-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                      <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                        Sign Out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/signin"
                  className="flex items-center space-x-2 text-secondary-700 hover:text-primary-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-secondary-100"
                >
                  <UserIcon className="h-5 w-5" />
                  <span>Log in/Sign Up</span>
                </Link>
              </div>
            )}
            </div>
          </div>

            {/* Mobile Menu Button */}
          <div className="flex lg:hidden flex-shrink-0">
            <Dialog.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <Dialog.Trigger asChild>
                <button className="inline-flex items-center justify-center rounded-lg p-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                  <Bars3Icon className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-0 top-0 z-50 h-full w-3/4 max-w-sm border-r border-secondary-200 bg-white p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-lg font-semibold">Menu</Dialog.Title>
                    <Dialog.Close asChild>
                      <button className="rounded-lg p-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                        <XMarkIcon className="h-6 w-6" />
                        <span className="sr-only">Close menu</span>
            </button>
                    </Dialog.Close>
        </div>

                  <div className="mt-6 space-y-4">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch}>
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search deals, coupons, stores..."
                          className="h-10 w-full rounded-lg border border-secondary-300 bg-white pl-10 pr-4 text-sm placeholder:text-secondary-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                    </form>

                    {/* Mobile Navigation */}
                    <nav className="space-y-2">
                    <Link
                        to="/categories"
                      onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-2 rounded-lg px-3 py-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                      >
                        <ShoppingBagIcon className="h-5 w-5" />
                        <span>Categories</span>
                    </Link>


                <Link
                  to="/companies"
                  onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-2 rounded-lg px-3 py-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                >
                        <BuildingOfficeIcon className="h-5 w-5" />
                  <span>Companies</span>
                </Link>

                <Link
                        to="/forums"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-2 rounded-lg px-3 py-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                      >
                        <UserGroupIcon className="h-5 w-5" />
                        <span>Community</span>
                      </Link>

                    </nav>

                                         {/* Mobile Post Deal Button */}
                     <Link
                       to="/post"
                       onClick={() => setIsMenuOpen(false)}
                       className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                     >
                       <PlusIcon className="h-5 w-5" />
                       <span>Post Deal/Coupon</span>
                     </Link>

                    {/* Mobile User Menu */}
                    {user ? (
                        <div className="space-y-2">
                        <Separator.Root className="h-px bg-secondary-200" />
                        <div className="flex items-center space-x-3 px-3 py-2">
                          <Avatar.Root className="flex h-8 w-8 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
                            {user.user_metadata?.avatar_url ? (
                              <Avatar.Image
                                className="h-full w-full object-cover"
                                src={user.user_metadata.avatar_url}
                                alt={user.user_metadata?.full_name || user.email}
                              />
                            ) : (
                              <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white">
                                {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                              </Avatar.Fallback>
                            )}
                          </Avatar.Root>
                          <div>
                            <p className="text-sm font-medium text-secondary-900">
                              {user.user_metadata?.full_name || 'User'}
                            </p>
                            <p className="text-xs text-secondary-500">{user.email}</p>
                          </div>
                        </div>
                        
                        <Link
                          to={`/user/${user?.user_metadata?.handle || user?.id}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 rounded-lg px-3 py-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                        >
                          <UserIcon className="h-5 w-5" />
                          <span>My Profile</span>
                        </Link>
                        
                        <Link
                          to="/achievements"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 rounded-lg px-3 py-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                        >
                          <TrophyIcon className="h-5 w-5" />
                          <span>Achievements</span>
                        </Link>
                        
                        <Link
                          to="/saved-searches"
                  onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 rounded-lg px-3 py-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                >
                          <BookmarkIcon className="h-5 w-5" />
                          <span>Saved Searches</span>
                </Link>

                <Link
                          to="/saved-items"
                  onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 rounded-lg px-3 py-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                >
                          <BookmarkIcon className="h-5 w-5" />
                          <span>Saved Items</span>
                </Link>


                <Link
                          to="/settings"
                  onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 rounded-lg px-3 py-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                >
                          <CogIcon className="h-5 w-5" />
                          <span>Settings</span>
                </Link>
                        
                        <Separator.Root className="h-px bg-secondary-200" />
                        
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5" />
                          <span>Sign Out</span>
                        </button>
              </div>
                                                              ) : (
                       <div className="space-y-3">
              <Link
                           to="/signin"
                  onClick={() => setIsMenuOpen(false)}
                           className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-secondary-700 hover:text-primary-600 font-medium transition-colors rounded-lg hover:bg-secondary-100"
                >
                           <UserIcon className="h-5 w-5" />
                           <span>Log in/Sign Up</span>
                </Link>
              </div>
        )}
      </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </div>
    </header>

    {/* Secondary Navbar - Filter Tags & Today's Stats */}
    <div className="bg-secondary-50 border-b border-secondary-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Filter Tags */}
          <div className="flex items-center flex-1 overflow-hidden">
            <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide">
              {filterTags.map((tag) => {
                const IconComponent = getIconComponent(tag.icon)
                const colorClasses = getColorClasses(tag.color, tag.active)
                
                return (
              <Link
                    key={tag.id}
                    to={tag.path}
                    className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors cursor-pointer border ${colorClasses}`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm font-medium">{tag.name}</span>
              </Link>
                )
              })}
            </div>
          </div>
          
          {/* Today's Stats */}
          <div className="hidden md:flex items-center space-x-4 text-xs text-secondary-600">
            <div className="flex items-center space-x-1">
              <UserIcon className="w-3 h-3" />
              <span>Users online: {navbarStats?.stats?.usersOnline?.toLocaleString() || '...'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FireIcon className="w-3 h-3" />
              <span>Deals today: {navbarStats?.stats?.dealsToday?.toLocaleString() || '...'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TagIcon className="w-3 h-3" />
              <span>Coupons today: {navbarStats?.stats?.couponsToday?.toLocaleString() || '...'}</span>
            </div>
          </div>
            </div>
          </div>
      </div>
    </>
  )
}

export default Navbar
