import React, { useState, useMemo } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Container } from '../../components/Layout/Container'
import { ThreadRow } from '../../components/Forums/ThreadRow'
import { ForumSidebar } from '../../components/Forums/ForumSidebar'
import { TagChips } from '../../components/Deal/TagChips'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { useToast } from '../../components/Toast'
import { forumService } from '../../forums/service'
import { setPageMeta } from '../../lib/head'
import { THREAD_SORT } from '../../forums/forumTypes'
import { clsx } from 'clsx'

// Sort options for threads
const SORT_OPTIONS = [
  { value: THREAD_SORT.NEW, label: 'New 🆕', description: 'Most recent threads' },
  { value: THREAD_SORT.TOP, label: 'Top ⭐', description: 'Highest voted threads' },
  { value: THREAD_SORT.HOT, label: 'Hot 🔥', description: 'Trending discussions' },
]

// Time filters
const TIME_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
]

export default function ForumThreads() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const toast = useToast()

  // State management with URL sync
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || THREAD_SORT.NEW)
  const [timeFilter, setTimeFilter] = useState(searchParams.get('time') || 'all')
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [showSticky, setShowSticky] = useState(true)

  // Advanced filters
  const [filters, setFilters] = useState({
    minVotes: parseInt(searchParams.get('minVotes')) || 0,
    hasReplies: searchParams.get('hasReplies') === 'true',
    authorOnly: searchParams.get('author') || '',
    unreadOnly: searchParams.get('unread') === 'true',
  })

  // User preferences
  const [userPrefs, setUserPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('forumPrefs') || '{}')
    } catch {
      return {}
    }
  })

  // Fetch forum data
  const { data: forum, isLoading: forumLoading, error: forumError } = useQuery({
    queryKey: ['forum', slug],
    queryFn: () => forumService.getForum(slug),
  })

  // Fetch threads with advanced filtering
  const { data: threads = [], isLoading: threadsLoading, error: threadsError, refetch } = useQuery({
    queryKey: ['threads', slug, sortBy, selectedTag, searchQuery, timeFilter, filters],
    queryFn: () => forumService.getThreads(slug, {
      sort: sortBy,
      tag: selectedTag || null,
      search: searchQuery || null,
      timeFilter,
      ...filters
    }),
    enabled: !!forum,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Get unique tags from threads
  const allTags = useMemo(() => {
    const tagCounts = new Map()
    threads.forEach(thread => {
      thread.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
  }, [threads])

  // Filter threads based on current filters
  const filteredThreads = useMemo(() => {
    let filtered = threads

    // Separate pinned/sticky threads
    const pinnedThreads = filtered.filter(t => t.pinned && showSticky)
    const regularThreads = filtered.filter(t => !t.pinned)

    // Apply additional filters
    const applyFilters = (threadList) => {
      let result = threadList

      if (filters.minVotes > 0) {
        result = result.filter(t => (t.votes || 0) >= filters.minVotes)
      }

      if (filters.hasReplies) {
        result = result.filter(t => (t.postCount || 0) > 0)
      }

      if (filters.authorOnly) {
        result = result.filter(t => t.author?.toLowerCase().includes(filters.authorOnly.toLowerCase()))
      }

      if (filters.unreadOnly) {
        // Check localStorage for read threads
        const readThreads = JSON.parse(localStorage.getItem('readThreads') || '[]')
        result = result.filter(t => !readThreads.includes(t.id))
      }

      return result
    }

    return [...pinnedThreads, ...applyFilters(regularThreads)]
  }, [threads, showSticky, filters])

  // Update URL when filters change
  React.useEffect(() => {
    const params = new URLSearchParams()

    if (sortBy !== THREAD_SORT.NEW) params.set('sort', sortBy)
    if (timeFilter !== 'all') params.set('time', timeFilter)
    if (selectedTag) params.set('tag', selectedTag)
    if (searchQuery) params.set('q', searchQuery)
    if (filters.minVotes > 0) params.set('minVotes', filters.minVotes.toString())
    if (filters.hasReplies) params.set('hasReplies', 'true')
    if (filters.authorOnly) params.set('author', filters.authorOnly)
    if (filters.unreadOnly) params.set('unread', 'true')

    const newSearch = params.toString()
    if (newSearch !== searchParams.toString()) {
      navigate(`/forums/${slug}${newSearch ? '?' + newSearch : ''}`, { replace: true })
    }
  }, [sortBy, timeFilter, selectedTag, searchQuery, filters, slug, navigate, searchParams])

  // Set page meta
  React.useEffect(() => {
    if (forum) {
      setPageMeta({
        title: `${forum.name} - Forum`,
        description: `${forum.description} Browse threads, start discussions, and connect with the community.`,
      })
    }
  }, [forum])

  // Handlers
  const handleSortChange = (newSort) => {
    setSortBy(newSort)
  }

  const handleTagClick = (tag) => {
    setSelectedTag(selectedTag === tag ? '' : tag)
  }

  const handleClearFilters = () => {
    setSelectedTag('')
    setSearchQuery('')
    setTimeFilter('all')
    setFilters({
      minVotes: 0,
      hasReplies: false,
      authorOnly: '',
      unreadOnly: false,
    })
    toast.success('Filters cleared')
  }

  // Subscribe to forum
  const subscribeMutation = useMutation({
    mutationFn: () => {
      // Mock subscription
      const subscriptions = JSON.parse(localStorage.getItem('forumSubscriptions') || '[]')
      const isSubscribed = subscriptions.includes(slug)

      if (isSubscribed) {
        const updated = subscriptions.filter(s => s !== slug)
        localStorage.setItem('forumSubscriptions', JSON.stringify(updated))
        return { subscribed: false }
      } else {
        localStorage.setItem('forumSubscriptions', JSON.stringify([...subscriptions, slug]))
        return { subscribed: true }
      }
    },
    onSuccess: (data) => {
      toast.success(data.subscribed ? 'Subscribed to forum notifications' : 'Unsubscribed from forum')
    }
  })

  const isSubscribed = JSON.parse(localStorage.getItem('forumSubscriptions') || '[]').includes(slug)

  if (forumError) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Forum Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The forum you're looking for doesn't exist or has been moved.
          </p>
          <Link to="/forums" className="btn-primary">
            Browse All Forums
          </Link>
        </div>
      </Container>
    )
  }

  if (forumLoading) {
    return (
      <Container className="py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 text-sm">
          <Link
            to="/forums"
            className="text-blue-600 hover:text-blue-700"
          >
            Forums
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-900">
            {forum.name}
          </span>
        </nav>

        {/* Forum Header */}
        <div className="card p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {forum.name}
                  </h1>
                  <p className="text-gray-600">
                    {forum.description}
                  </p>
                </div>
              </div>

              {forum.tags && forum.tags.length > 0 && (
                <TagChips tags={forum.tags} className="mb-4" />
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span>{threads.length} threads</span>
                <span>•</span>
                <span>{threads.reduce((acc, t) => acc + (t.postCount || 0), 0)} posts</span>
                {isSubscribed && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">Subscribed</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => subscribeMutation.mutate()}
                disabled={subscribeMutation.isPending}
                className={clsx(
                  'btn flex items-center space-x-2',
                  isSubscribed ? 'btn-secondary' : 'btn-primary'
                )}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h6a2 2 0 012 2v8a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2z" />
                </svg>
                <span>{isSubscribed ? 'Unsubscribe' : 'Subscribe'}</span>
              </button>

              <Link
                to={`/forums/${slug}/new`}
                className="btn-primary flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Thread</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Controls */}
            <div className="card p-4 mb-6">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search threads..."
                    className="input pl-10 w-full"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Sort & Filter Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="input text-sm pr-8"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Filter */}
                  <div className="relative">
                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="input text-sm"
                    >
                      {TIME_FILTERS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* View Options */}
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={showSticky}
                        onChange={(e) => setShowSticky(e.target.checked)}
                        className="mr-1"
                      />
                      <span className="text-gray-700">Show Pinned</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">
                    {filteredThreads.length} threads
                  </span>

                  {(selectedTag || searchQuery || filters.minVotes > 0 || filters.hasReplies || filters.authorOnly || filters.unreadOnly) && (
                    <button
                      onClick={handleClearFilters}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Filter by Topic
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(({ tag, count }) => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={clsx(
                        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors',
                        selectedTag === tag
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      <span>{tag}</span>
                      <span className="ml-1 text-xs opacity-60">({count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Thread List */}
            {threadsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <EmptyState
                icon={({ className }) => (
                  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
                title={searchQuery || selectedTag ? "No threads found" : "No threads yet"}
                description={
                  searchQuery || selectedTag
                    ? "Try adjusting your search or filters."
                    : "Be the first to start a discussion in this forum!"
                }
                action={
                  <Link to={`/forums/${slug}/new`} className="btn-primary">
                    Start a Thread
                  </Link>
                }
              />
            ) : (
              <div className="space-y-4">
                {filteredThreads.map((thread) => (
                  <ThreadRow key={thread.id} thread={thread} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <ForumSidebar forum={forum} />
          </div>
        </div>
      </div>
    </Container>
  )
}
