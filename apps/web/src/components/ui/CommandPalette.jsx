/**
 * Command Palette - ⌘K Global Search
 * Premium command palette for quick navigation and actions
 */

import { useState, useEffect, useCallback } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search,
    Sparkles,
    TrendingUp,
    Plus,
    Home,
    Users,
    Bookmark,
    Settings,
    ArrowRight,
    Percent,
    Tag,
    Building2,
    User,
    Zap
} from 'lucide-react'

const QUICK_ACTIONS = [
    { id: 'home', label: 'Go to Home', icon: Home, action: 'navigate', path: '/' },
    { id: 'post', label: 'Post a Deal', icon: Plus, action: 'navigate', path: '/post' },
    { id: 'ai', label: 'Ask AI about deals', icon: Sparkles, action: 'ai' },
    { id: 'saved', label: 'View Saved Deals', icon: Bookmark, action: 'navigate', path: '/saved-items' },
    { id: 'community', label: 'Go to Community', icon: Users, action: 'navigate', path: '/forums' },
    { id: 'companies', label: 'Browse Companies', icon: Building2, action: 'navigate', path: '/companies' },
]

const FILTERS = [
    { id: 'trending', label: 'Show Trending Deals', icon: TrendingUp, filter: 'trending' },
    { id: '50-off', label: 'Deals 50%+ Off', icon: Percent, filter: '50-off' },
    { id: 'under-20', label: 'Deals Under $20', icon: Tag, filter: 'under-20' },
    { id: 'new', label: 'Newest Deals', icon: Zap, filter: 'new-arrivals' },
]

export function CommandPalette({ onFilterChange, onAskAI }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const navigate = useNavigate()

    // Toggle on ⌘K or Ctrl+K
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
            if (e.key === 'Escape') {
                setOpen(false)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    const handleSelect = useCallback((item) => {
        setOpen(false)
        setSearch('')

        if (item.action === 'navigate') {
            navigate(item.path)
        } else if (item.action === 'ai' && onAskAI) {
            onAskAI()
        } else if (item.filter && onFilterChange) {
            onFilterChange(item.filter)
            navigate('/')
        }
    }, [navigate, onFilterChange, onAskAI])

    return (
        <>
            {/* Command Palette Modal */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
                        />

                        {/* Command Dialog */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2"
                        >
                            <Command
                                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden border border-slate-200/50 dark:border-slate-700/50"
                                loop
                            >
                                {/* Input */}
                                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <Command.Input
                                        value={search}
                                        onValueChange={setSearch}
                                        placeholder="Search deals, navigate, or type a command..."
                                        className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                                    />
                                    <kbd className="px-2 py-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400">
                                        ESC
                                    </kbd>
                                </div>

                                {/* Results */}
                                <Command.List className="max-h-[400px] overflow-y-auto p-2">
                                    <Command.Empty className="py-8 text-center text-sm text-slate-400">
                                        No results found.
                                    </Command.Empty>

                                    {/* Quick Actions */}
                                    <Command.Group heading="Quick Actions" className="px-2">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 mt-2">
                                            Quick Actions
                                        </p>
                                        {QUICK_ACTIONS.map((item) => {
                                            const Icon = item.icon
                                            return (
                                                <Command.Item
                                                    key={item.id}
                                                    value={item.label}
                                                    onSelect={() => handleSelect(item)}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-200 cursor-pointer data-[selected=true]:bg-violet-50 dark:data-[selected=true]:bg-violet-900/20 data-[selected=true]:text-violet-700 dark:data-[selected=true]:text-violet-300 transition-colors"
                                                >
                                                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center group-data-[selected=true]:bg-violet-100">
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="flex-1">{item.label}</span>
                                                    <ArrowRight className="w-4 h-4 text-slate-300" />
                                                </Command.Item>
                                            )
                                        })}
                                    </Command.Group>

                                    {/* Filters */}
                                    <Command.Group heading="Filters" className="px-2 mt-4">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 mt-2">
                                            Filters
                                        </p>
                                        {FILTERS.map((item) => {
                                            const Icon = item.icon
                                            return (
                                                <Command.Item
                                                    key={item.id}
                                                    value={item.label}
                                                    onSelect={() => handleSelect(item)}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-200 cursor-pointer data-[selected=true]:bg-violet-50 dark:data-[selected=true]:bg-violet-900/20 data-[selected=true]:text-violet-700 dark:data-[selected=true]:text-violet-300 transition-colors"
                                                >
                                                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="flex-1">{item.label}</span>
                                                    <ArrowRight className="w-4 h-4 text-slate-300" />
                                                </Command.Item>
                                            )
                                        })}
                                    </Command.Group>
                                </Command.List>

                                {/* Footer */}
                                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded text-[9px] font-medium">↑↓</kbd>
                                                Navigate
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded text-[9px] font-medium">↵</kbd>
                                                Select
                                            </span>
                                        </div>
                                        <span>Powered by SaveBucks AI</span>
                                    </div>
                                </div>
                            </Command>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

export default CommandPalette
