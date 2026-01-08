/**
 * KBar Command Menu
 * Premium command palette for power users (⌘K)
 */

import {
    KBarProvider,
    KBarPortal,
    KBarPositioner,
    KBarAnimator,
    KBarSearch,
    KBarResults,
    useMatches,
    useKBar
} from 'kbar'
import { useNavigate } from 'react-router-dom'
import {
    Search,
    Sparkles,
    Tag,
    TrendingUp,
    Bell,
    Settings,
    User,
    Home,
    Heart,
    Bookmark,
    MessageSquare,
    PlusCircle,
    Moon
} from 'lucide-react'
import { forwardRef, useMemo, useEffect } from 'react'

// Action types
function useInitialActions() {
    const navigate = useNavigate()

    return useMemo(() => [
        // AI Actions
        {
            id: 'ai',
            name: 'Ask AI',
            shortcut: ['a'],
            keywords: 'ai assistant chat help',
            icon: <Sparkles className="w-4 h-4" />,
            subtitle: 'Ask SaveBucks AI anything',
            section: 'AI'
        },
        {
            id: 'ai-deals',
            name: 'Find Deals with AI',
            parent: 'ai',
            perform: () => navigate('/chat?q=hot deals'),
            icon: <Sparkles className="w-4 h-4" />
        },
        {
            id: 'ai-coupons',
            name: 'Find Coupons with AI',
            parent: 'ai',
            perform: () => navigate('/chat?q=best coupons'),
            icon: <Tag className="w-4 h-4" />
        },

        // Search Actions
        {
            id: 'search',
            name: 'Search Deals',
            shortcut: ['s'],
            keywords: 'find search deals products',
            icon: <Search className="w-4 h-4" />,
            subtitle: 'Search for deals and products',
            section: 'Search'
        },
        {
            id: 'search-trending',
            name: 'Trending Deals',
            shortcut: ['t'],
            keywords: 'hot trending popular',
            icon: <TrendingUp className="w-4 h-4" />,
            perform: () => navigate('/?filter=trending'),
            section: 'Search'
        },
        {
            id: 'search-coupons',
            name: 'Browse Coupons',
            shortcut: ['c'],
            keywords: 'coupon codes promo',
            icon: <Tag className="w-4 h-4" />,
            perform: () => navigate('/coupons'),
            section: 'Search'
        },

        // Navigation Actions
        {
            id: 'home',
            name: 'Home',
            shortcut: ['g', 'h'],
            keywords: 'home main feed',
            icon: <Home className="w-4 h-4" />,
            perform: () => navigate('/'),
            section: 'Navigation'
        },
        {
            id: 'saved',
            name: 'Saved Deals',
            shortcut: ['g', 's'],
            keywords: 'saved bookmarks favorites',
            icon: <Bookmark className="w-4 h-4" />,
            perform: () => navigate('/saved'),
            section: 'Navigation'
        },
        {
            id: 'liked',
            name: 'Liked Deals',
            shortcut: ['g', 'l'],
            keywords: 'liked upvoted',
            icon: <Heart className="w-4 h-4" />,
            perform: () => navigate('/liked'),
            section: 'Navigation'
        },
        {
            id: 'chat',
            name: 'AI Chat',
            shortcut: ['g', 'a'],
            keywords: 'ai chat conversation',
            icon: <MessageSquare className="w-4 h-4" />,
            perform: () => navigate('/chat'),
            section: 'Navigation'
        },

        // Actions
        {
            id: 'post-deal',
            name: 'Post a Deal',
            shortcut: ['n'],
            keywords: 'new create post submit deal',
            icon: <PlusCircle className="w-4 h-4" />,
            perform: () => navigate('/submit'),
            section: 'Actions'
        },
        {
            id: 'alerts',
            name: 'Price Alerts',
            shortcut: ['p'],
            keywords: 'alerts notifications price',
            icon: <Bell className="w-4 h-4" />,
            perform: () => navigate('/alerts'),
            section: 'Actions'
        },

        // Settings
        {
            id: 'profile',
            name: 'Profile',
            shortcut: ['g', 'p'],
            keywords: 'account profile user',
            icon: <User className="w-4 h-4" />,
            perform: () => navigate('/profile'),
            section: 'Settings'
        },
        {
            id: 'settings',
            name: 'Settings',
            shortcut: [','],
            keywords: 'settings preferences config',
            icon: <Settings className="w-4 h-4" />,
            perform: () => navigate('/settings'),
            section: 'Settings'
        },
        {
            id: 'theme-toggle',
            name: 'Toggle Theme',
            shortcut: ['d'],
            keywords: 'dark light mode theme',
            icon: <Moon className="w-4 h-4" />,
            perform: () => document.documentElement.classList.toggle('dark'),
            section: 'Settings'
        }
    ], [navigate])
}

// Result item renderer
const ResultItem = forwardRef(({ action, active, currentRootActionId }, ref) => {
    const ancestors = useMemo(() => {
        if (!currentRootActionId) return action.ancestors
        const index = action.ancestors.findIndex(a => a.id === currentRootActionId)
        return action.ancestors.slice(index + 1)
    }, [action.ancestors, currentRootActionId])

    return (
        <div
            ref={ref}
            className={`
        px-3 py-2.5 flex items-center justify-between cursor-pointer
        transition-colors duration-100
        ${active
                    ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-l-2 border-blue-500'
                    : 'border-l-2 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }
      `}
        >
            <div className="flex items-center gap-3">
                {action.icon && (
                    <span className={`${active ? 'text-blue-500' : 'text-gray-400'}`}>
                        {action.icon}
                    </span>
                )}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        {ancestors.length > 0 && ancestors.map(ancestor => (
                            <span key={ancestor.id} className="text-xs text-gray-400">
                                {ancestor.name} ›
                            </span>
                        ))}
                        <span className={`text-sm font-medium ${active ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                            {action.name}
                        </span>
                    </div>
                    {action.subtitle && (
                        <span className="text-xs text-gray-400">{action.subtitle}</span>
                    )}
                </div>
            </div>
            {action.shortcut?.length && (
                <div className="flex gap-1">
                    {action.shortcut.map((sc, i) => (
                        <kbd
                            key={i}
                            className="px-1.5 py-0.5 text-xs font-medium bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded"
                        >
                            {sc}
                        </kbd>
                    ))}
                </div>
            )}
        </div>
    )
})

ResultItem.displayName = 'ResultItem'

// Results component
function RenderResults() {
    const { results, rootActionId } = useMatches()

    return (
        <KBarResults
            items={results}
            onRender={({ item, active }) =>
                typeof item === 'string' ? (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                        {item}
                    </div>
                ) : (
                    <ResultItem
                        action={item}
                        active={active}
                        currentRootActionId={rootActionId}
                    />
                )
            }
        />
    )
}

// Command menu component
export function CommandMenu({ children }) {
    const actions = useInitialActions()

    return (
        <KBarProvider actions={actions}>
            <KBarPortal>
                <KBarPositioner className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
                    <KBarAnimator className="w-full max-w-xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        {/* Search input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <Search className="w-5 h-5 text-gray-400" />
                            <KBarSearch
                                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                                defaultPlaceholder="Type a command or search..."
                            />
                            <kbd className="px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 text-gray-400 rounded">
                                esc
                            </kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-[400px] overflow-y-auto">
                            <RenderResults />
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>↑↓ Navigate</span>
                                <span>↵ Select</span>
                                <span>esc Close</span>
                            </div>
                        </div>
                    </KBarAnimator>
                </KBarPositioner>
            </KBarPortal>
            {children}
        </KBarProvider>
    )
}

export default CommandMenu
