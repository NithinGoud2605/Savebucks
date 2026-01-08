import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Settings,
  Bookmark,
  Plus,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Building2,
  Sparkles
} from 'lucide-react'
import NotificationBell from '../User/NotificationBell'
import { Avatar } from '../ui/Avatar'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/Tooltip'
import { Separator } from '../ui/Separator'


const Navbar = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => api.getUser(user?.user_metadata?.handle || user?.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000
  })

  const handleSignOut = () => {
    signOut()
    setIsMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 lg:h-16">
      {/* Glassmorphism background - no border */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl" />

      <div className="relative h-full max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <motion.img
            src="/logo.png"
            alt="SaveBucks"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="h-10 w-auto"
          />
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <div className="hidden lg:flex items-center">
            <Link
              to="/forums"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 transition-all duration-200"
            >
              <Users className="w-4 h-4" />
              <span>Community</span>
            </Link>
            <Link
              to="/saved-items"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 transition-all duration-200"
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved</span>
            </Link>
          </div>

          {/* Post Button - Gradient with glow */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/post"
              className="hidden sm:flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-full text-sm font-semibold shadow-lg shadow-violet-500/25 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">Post Deal</span>
            </Link>
          </motion.div>

          {user && <NotificationBell />}

          {user ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-900/5 transition-colors"
                >
                  <Avatar
                    className="w-9 h-9 shadow-lg shadow-violet-500/20"
                    gradient="purple"
                    fallback={userProfile?.display_name || user.email || 'U'}
                  />
                </motion.button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[220px] bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-slate-900/10 p-2 animate-in fade-in-0 zoom-in-95"
                  sideOffset={8}
                  align="end"
                >
                  <div className="px-3 py-3 mb-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {userProfile?.display_name || userProfile?.handle || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {userProfile?.karma ? `${userProfile.karma} karma` : user.email}
                    </p>
                  </div>

                  <DropdownMenu.Item asChild>
                    <Link
                      to={`/user/${userProfile?.handle || user?.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-900/5 rounded-xl outline-none cursor-pointer transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                  </DropdownMenu.Item>

                  {userProfile?.role === 'admin' && (
                    <DropdownMenu.Item asChild>
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-900/5 rounded-xl outline-none cursor-pointer transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Admin
                      </Link>
                    </DropdownMenu.Item>
                  )}

                  <div className="h-px bg-slate-900/5 my-1.5" />

                  <DropdownMenu.Item
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-500/10 rounded-xl outline-none cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/signin"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-900/5 rounded-full transition-all duration-200"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            </motion.div>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-white/80 backdrop-blur-2xl shadow-2xl shadow-slate-900/5"
          >
            <nav className="p-3 space-y-1">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-900/5 transition-colors">
                <Home className="w-5 h-5" /> Home
              </Link>
              <Link to="/forums" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-900/5 transition-colors">
                <Users className="w-5 h-5" /> Community
              </Link>
              <Link to="/companies" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-900/5 transition-colors">
                <Building2 className="w-5 h-5" /> Companies
              </Link>
              <Link to="/saved-items" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-900/5 transition-colors">
                <Bookmark className="w-5 h-5" /> Saved
              </Link>
              <Link to="/post" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 mt-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-violet-500/25">
                <Plus className="w-5 h-5" /> Post Deal
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
