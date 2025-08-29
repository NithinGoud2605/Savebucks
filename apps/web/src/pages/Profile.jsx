import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from '../components/Layout/Container'
import { DealCard } from '../components/Deal/DealCard'
import { ActivityFeed } from '../components/User/ActivityFeed'
import { FollowButton } from '../components/User/FollowButton'
import { MessageButton } from '../components/User/MessageButton'
import { UserStats } from '../components/User/UserStats'
import { ReputationBadges } from '../components/User/ReputationBadges'
import { Skeleton } from '../components/Loader/Skeleton'
import { api } from '../lib/api'
import { setPageMeta } from '../lib/head'
import { dateAgo, formatCompactNumber, pluralize } from '../lib/format'
import { clsx } from 'clsx'

export default function Profile() {
  const { handle } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const currentUser = localStorage.getItem('demo_user') // Mock auth

  // Fetch user profile data
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user-profile', handle],
    queryFn: () => api.getUserProfile(handle),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Check if viewing own profile
  useEffect(() => {
    if (profile && currentUser) {
      setIsOwnProfile(profile.handle === currentUser || profile.id === currentUser)
    }
  }, [profile, currentUser])

  // Set page meta
  useEffect(() => {
    if (profile) {
      setPageMeta({
        title: `${profile.handle} (@${profile.handle}) - SaveBucks Profile`,
        description: `View ${profile.handle}'s deals, activity, and reputation on SaveBucks. ${profile.bio || 'Active community member sharing great deals.'}`,
        image: profile.avatar_url,
        keywords: `${profile.handle}, user profile, deals, savings, community`
      })
    }
  }, [profile])

  if (error) {
    return (
      <Container className="py-8">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-8">
            This user doesn't exist or their profile is private.
          </p>
          <Link to="/" className="btn-primary">Browse Deals</Link>
        </div>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="card p-8">
            <div className="flex items-start space-x-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <div className="flex space-x-6">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-18 rounded-full" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3 space-y-6">
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </Container>
    )
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊', count: null },
    { key: 'deals', label: 'Deals', icon: '🎯', count: profile?.stats?.deals_posted },
    { key: 'activity', label: 'Activity', icon: '📈', count: null },
    { key: 'stats', label: 'Statistics', icon: '📋', count: null },
    { key: 'badges', label: 'Badges', icon: '🏆', count: profile?.badges?.filter(b => b.earned_at).length },
  ]

  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Profile Header */}
        <div className="card p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Avatar and Basic Info */}
            <div className="flex items-start space-x-6">
              <div className="relative">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`${profile.handle}'s avatar`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {profile.handle[0].toUpperCase()}
                  </div>
                )}
                
                {/* Online status indicator */}
                {profile.is_online && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile.display_name || profile.handle}
                  </h1>
                  {profile.is_verified && (
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20" title="Verified User">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                <div className="text-gray-600 mb-1">
                  @{profile.handle}
                </div>

                {profile.bio && (
                  <p className="text-gray-700 mb-4 max-w-2xl">
                    {profile.bio}
                  </p>
                )}

                {/* Quick Stats */}
                <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-2xl font-bold text-green-600">
                      {formatCompactNumber(profile.karma || 0)}
                    </span>
                    <span className="text-sm">karma</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-semibold text-blue-600">
                      {formatCompactNumber(profile.stats?.deals_posted || 0)}
                    </span>
                    <span className="text-sm">{pluralize(profile.stats?.deals_posted || 0, 'deal')}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-semibold text-purple-600">
                      {formatCompactNumber(profile.stats?.comments_made || 0)}
                    </span>
                    <span className="text-sm">{pluralize(profile.stats?.comments_made || 0, 'comment')}</span>
                  </div>
                  
                  {profile.stats?.followers && (
                    <div className="flex items-center space-x-1">
                      <span className="text-lg font-semibold text-indigo-600">
                        {formatCompactNumber(profile.stats.followers)}
                      </span>
                      <span className="text-sm">{pluralize(profile.stats.followers, 'follower')}</span>
                    </div>
                  )}
                  
                  <div className="text-sm">
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Member since {dateAgo(profile.created_at)}
                  </div>
                  
                  {profile.location && (
                    <div className="text-sm">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profile.location}
                    </div>
                  )}
                  
                  {profile.website && (
                    <div className="text-sm">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <a 
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>

                {/* Compact Reputation Display */}
                <ReputationBadges userId={profile.id} variant="compact" limit={5} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-3 lg:min-w-[200px]">
              {!isOwnProfile && (
                <>
                  <FollowButton 
                    userId={profile.id}
                    size="lg" 
                    showFollowerCount={true}
                    className="w-full"
                  />
                  <MessageButton 
                    userId={profile.id}
                    userName={profile.handle}
                    size="lg"
                    variant="outline"
                    className="w-full"
                  />
                </>
              )}
              
              {isOwnProfile && (
                <Link
                  to="/settings/profile"
                  className="btn-secondary text-center"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </Link>
              )}
              
              <button className="btn-ghost text-sm">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share Profile
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="card p-0 mb-8">
          <nav className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  'flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                )}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                    {formatCompactNumber(tab.count)}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Recent Activity Preview */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Recent Activity
                    </h2>
                    <button
                      onClick={() => setActiveTab('activity')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View All Activity →
                    </button>
                  </div>
                  <ActivityFeed userId={profile.id} limit={5} showControls={false} />
                </div>

                {/* Recent Deals */}
                {profile.recent_deals && profile.recent_deals.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Recent Deals
                      </h2>
                      <button
                        onClick={() => setActiveTab('deals')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View All Deals →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.recent_deals.slice(0, 4).map(deal => (
                        <DealCard key={deal.id} deal={deal} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistics Preview */}
                <UserStats userId={profile.id} variant="compact" />
              </div>
            )}

            {activeTab === 'deals' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  All Deals ({formatCompactNumber(profile.stats?.deals_posted || 0)})
                </h2>
                {/* Would implement deal filtering and pagination here */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(profile.deals || []).map(deal => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
                {(!profile.deals || profile.deals.length === 0) && (
                  <div className="card p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 0a.5.5 0 11-1 0 .5.5 0 011 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Deals Posted Yet
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {isOwnProfile 
                        ? "You haven't posted any deals yet. Share your first deal with the community!"
                        : `${profile.handle} hasn't posted any deals yet.`}
                    </p>
                    {isOwnProfile && (
                      <Link to="/post" className="btn-primary">
                        Post Your First Deal
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Activity Feed
                </h2>
                <ActivityFeed userId={profile.id} />
              </div>
            )}

            {activeTab === 'stats' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Detailed Statistics
                </h2>
                <UserStats userId={profile.id} />
              </div>
            )}

            {activeTab === 'badges' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Badges & Achievements
                </h2>
                <ReputationBadges userId={profile.id} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <UserStats userId={profile.id} variant="compact" />

            {/* Top Badges */}
            <ReputationBadges userId={profile.id} variant="compact" limit={3} />

            {/* Social Connections */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Social
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Followers</span>
                  <span className="font-medium">{formatCompactNumber(profile.stats?.followers || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Following</span>
                  <span className="font-medium">{formatCompactNumber(profile.stats?.following || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profile Views</span>
                  <span className="font-medium">{formatCompactNumber(profile.stats?.profile_views || 0)}</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            {(profile.website || profile.social_links) && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Links
                </h3>
                <div className="space-y-3">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span>Website</span>
                    </a>
                  )}
                  {/* Add more social links as needed */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  )
}
