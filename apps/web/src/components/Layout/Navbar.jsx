import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, apiRequest } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { useLocation as useUserLocation } from '../../context/LocationContext'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import * as Avatar from '@radix-ui/react-avatar'
import * as Separator from '@radix-ui/react-separator'
import { 
  UserGroupIcon,
  Cog6ToothIcon,
  BookmarkIcon,
  BellIcon,
  PlusIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FireIcon,
  TagIcon,
  HeartIcon,
  ClockIcon,
  StarIcon,
  GiftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { 
  FireIcon as FireIconSolid, 
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/solid'
import NotificationBell from '../User/NotificationBell'

const Navbar = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { location: userLocation } = useUserLocation?.() || {}

  // Get navbar stats
  const { data: navbarStats } = useQuery({
    queryKey: ['navbar-stats'],
    queryFn: () => api.getNavbarStats(),
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 2
  })

  // Get user profile data
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => api.getUser(user?.user_metadata?.handle || user?.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000
  })

  // Track user session
  useEffect(() => {
    if (user) {
      api.trackUserSession(location.pathname).catch(console.error)
      
      const heartbeatInterval = setInterval(() => {
        api.trackUserSession(location.pathname).catch(console.error)
      }, 60000)

      return () => clearInterval(heartbeatInterval)
    }
  }, [user, location.pathname])

  const handleSignOut = () => {
    signOut()
    setIsMenuOpen(false)
    navigate('/')
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-blue-300/60 bg-gradient-to-r from-blue-500/95 to-cyan-600/95 backdrop-blur-md supports-[backdrop-filter]:bg-gradient-to-r supports-[backdrop-filter]:from-blue-500/90 supports-[backdrop-filter]:to-cyan-600/90 shadow-lg">
        <div className="w-full px-2 sm:px-4 lg:px-8 max-w-full">
          <div className="flex h-12 sm:h-14 lg:h-16 items-center justify-between gap-2 max-w-full overflow-hidden">
            
            {/* Logo - Left Side */}
            <Link to="/" className="flex items-center flex-shrink-0 group">
              <img 
                src="/logo.png" 
                alt="SaveBucks Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 lg:h-14 lg:w-14 object-contain group-hover:scale-105 transition-transform duration-200"
              />
            </Link>

            {/* Center - Empty space for balance on desktop */}
            <div className="hidden lg:flex lg:items-center lg:flex-1 lg:justify-center">
              {/* Empty space for balance */}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-3 flex-shrink-0 ml-auto min-w-0">
              
              {/* Location Display - Desktop Only */}
              {userLocation?.address?.display && (
                <div className="hidden lg:flex items-center space-x-1.5 px-2 py-1 bg-blue-900/50 border border-blue-700 rounded-lg text-xs flex-shrink-0">
                  <MapPinIcon className="w-3 h-3 text-blue-300 flex-shrink-0" />
                  <span className="text-blue-200 font-medium truncate max-w-24">
                    {userLocation.address.display}
                  </span>
                </div>
              )}

              {/* Community Link - Desktop Only */}
              <Link
                to="/forums"
                className="hidden lg:flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-blue-600/30 hover:text-cyan-100 flex-shrink-0"
              >
                <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                <span>Community</span>
              </Link>

              {/* Saved Items Link - Desktop Only */}
              <Link
                to="/saved-items"
                className="hidden lg:flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:bg-blue-600/30 hover:text-cyan-100 flex-shrink-0"
              >
                <BookmarkIcon className="h-4 w-4 flex-shrink-0" />
                <span>Saved</span>
              </Link>
              
              {/* Post Deal Button - Desktop Only */}
              <Link
                to="/post"
                className="hidden lg:inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md text-sm flex-shrink-0"
              >
                <PlusIcon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden xl:inline whitespace-nowrap">Post Deal/Coupon</span>
                <span className="xl:hidden whitespace-nowrap">Post</span>
              </Link>

              {/* Notification Bell - Always Visible with consistent size */}
              {user && (
                <div className="flex-shrink-0">
                  <NotificationBell />
                </div>
              )}

              {/* User Menu - Always Visible */}
              {user ? (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full border border-secondary-200 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors flex-shrink-0">
                      <Avatar.Root className="flex h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
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
                      className="z-[60] min-w-[220px] overflow-hidden rounded-lg border border-secondary-200 bg-white p-1 text-secondary-900 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                      sideOffset={5}
                    >
                      <div className="flex items-center justify-start gap-2 p-2">
                        <Avatar.Root className="flex h-8 w-8 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
                          {userProfile?.avatar_url ? (
                            <Avatar.Image
                              className="h-full w-full object-cover"
                              src={userProfile.avatar_url}
                              alt={userProfile.display_name || userProfile.handle || user.email}
                            />
                          ) : (
                            <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white">
                            {(userProfile?.display_name || userProfile?.handle || user.email)?.[0]?.toUpperCase() || 'U'}
                          </Avatar.Fallback>
                          )}
                        </Avatar.Root>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none text-secondary-900">
                            {userProfile?.display_name || userProfile?.handle || user.user_metadata?.full_name || 'User'}
                          </p>
                          <p className="text-xs leading-none text-secondary-500">
                            {userProfile?.karma ? `${userProfile.karma} karma` : user.email}
                          </p>
                        </div>
                      </div>
                      <Separator.Root className="mx-1 h-px bg-secondary-200" />
                      
                      <DropdownMenu.Item asChild>
                        <Link
                          to={`/user/${userProfile?.handle || user?.user_metadata?.handle || user?.id}`}
                          className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-secondary-100 focus:text-secondary-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                          <UserIcon className="mr-2 h-4 w-4" />
                          My Profile
                        </Link>
                      </DropdownMenu.Item>
                      
                      {/* Admin Panel Link */}
                      {userProfile?.role === 'admin' && (
                        <DropdownMenu.Item asChild>
                          <Link
                            to="/admin"
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-secondary-100 focus:text-secondary-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                          >
                            <Cog6ToothIcon className="mr-2 h-4 w-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenu.Item>
                      )}
                      
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
                <Link
                  to="/signin"
                  className="flex items-center justify-center h-7 w-7 sm:h-auto sm:w-auto sm:gap-1.5 text-white hover:text-cyan-100 font-medium transition-colors sm:px-2 sm:py-1.5 rounded-lg hover:bg-blue-600/30 text-sm flex-shrink-0"
                  title="Log in"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline whitespace-nowrap">Log in</span>
                </Link>
              )}

              {/* Mobile Menu Button - Moved to right side */}
              <Dialog.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <Dialog.Trigger asChild>
                  <button className="flex lg:hidden items-center justify-center h-7 w-7 rounded-lg text-white hover:bg-blue-600/30 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors flex-shrink-0">
                    <Bars3Icon className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                  <Dialog.Content className="fixed left-0 top-0 z-[70] h-full w-4/5 max-w-sm border-r border-secondary-200 bg-white p-4 sm:p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
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
                      {/* Mobile Navigation */}
                      <nav className="space-y-2">
                        <Link
                          to="/"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 rounded-lg px-3 py-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                        >
                          <HomeIcon className="h-5 w-5" />
                          <span>Home</span>
                        </Link>

                        <Link
                          to="/forums"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 rounded-lg px-3 py-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                        >
                          <UserGroupIcon className="h-5 w-5" />
                          <span>Community</span>
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
                          to="/saved-items"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 rounded-lg px-3 py-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                        >
                          <BookmarkIcon className="h-5 w-5" />
                          <span>Saved Items</span>
                        </Link>
                      </nav>

                      {/* Mobile Post Deal Button */}
                      <Link
                        to="/post"
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
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
                              {userProfile?.avatar_url ? (
                                <Avatar.Image
                                  className="h-full w-full object-cover"
                                  src={userProfile.avatar_url}
                                  alt={userProfile.display_name || userProfile.handle || user.email}
                                />
                              ) : (
                                <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white">
                                  {(userProfile?.display_name || userProfile?.handle || user.email)?.[0]?.toUpperCase() || 'U'}
                                </Avatar.Fallback>
                              )}
                            </Avatar.Root>
                            <div>
                              <p className="text-sm font-medium text-secondary-900">
                                {userProfile?.display_name || userProfile?.handle || user.user_metadata?.full_name || 'User'}
                              </p>
                              <p className="text-xs text-secondary-500">
                                {userProfile?.karma ? `${userProfile.karma} karma` : user.email}
                              </p>
                            </div>
                          </div>
                          
                          <Link
                            to={`/user/${userProfile?.handle || user?.user_metadata?.handle || user?.id}`}
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center space-x-2 rounded-lg px-3 py-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                          >
                            <UserIcon className="h-5 w-5" />
                            <span>My Profile</span>
                          </Link>
                          
                          {/* Admin Panel Link */}
                          {userProfile?.role === 'admin' && (
                            <Link
                              to="/admin"
                              onClick={() => setIsMenuOpen(false)}
                              className="flex items-center space-x-2 rounded-lg px-3 py-2 text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                            >
                              <Cog6ToothIcon className="h-5 w-5" />
                              <span>Admin Panel</span>
                            </Link>
                          )}
                          
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
    </>
  )
}

export default Navbar