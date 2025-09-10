import React, { useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  User, 
  MapPin, 
  Globe, 
  Calendar,
  Star,
  TrendingUp,
  Tag,
  Eye,
  MessageSquare,
  Shield,
  Crown,
  Clock,
  Users,
  BarChart3,
  Grid3X3,
  List,
  UserPlus,
  UserMinus,
  Edit3,
  Camera
} from 'lucide-react'
import { Container } from '../components/Layout/Container'
import { Skeleton } from '../components/Loader/Skeleton'
import NewDealCard from '../components/Deal/NewDealCard'
import CouponCard from '../components/Coupon/CouponCard'
import { api } from '../lib/api'
import { dateAgo } from '../lib/format'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'

const UserProfile = () => {
  const { handle } = useParams()
  const [searchParams] = useSearchParams()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    display_name: '',
    bio: '',
    location: '',
    website: ''
  })

  // Fetch user profile data
  const { data: profile, isLoading: profileLoading, error } = useQuery({
    queryKey: ['user-profile', handle],
    queryFn: () => api.getUserProfile(handle),
    enabled: !!handle
  })

  // Fetch user's deals
  const { data: userDealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['user-deals', handle, sortBy],
    queryFn: () => api.getUserDeals(handle, 1, 20, sortBy),
    enabled: !!handle && (activeTab === 'deals' || activeTab === 'overview')
  })

  // Fetch user's coupons
  const { data: userCouponsData, isLoading: couponsLoading } = useQuery({
    queryKey: ['user-coupons', handle, sortBy],
    queryFn: () => api.getUserCoupons(handle, 1, 20, sortBy),
    enabled: !!handle && (activeTab === 'coupons' || activeTab === 'overview')
  })

  // Calculate if this is the user's own profile
  const isOwnProfile = currentUser && profile && currentUser.id === profile.id

  // Fetch follow status
  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', handle],
    queryFn: () => api.getFollowStatus(handle),
    enabled: !!handle && !!currentUser && !isOwnProfile
  })

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: () => api.toggleFollow(handle),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['follow-status', handle])
      queryClient.invalidateQueries(['user-profile', handle])
      toast.success(data.following ? 'Following user!' : 'Unfollowed user')
    },
    onError: () => {
      toast.error('Failed to update follow status')
    }
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData) => api.updateUserProfile(handle, profileData),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile', handle])
      setShowEditModal(false)
      toast.success('Profile updated successfully!')
    },
    onError: () => {
      toast.error('Failed to update profile')
    }
  })

  const userDeals = userDealsData?.deals || []
  const userCoupons = userCouponsData?.coupons || []

  if (profileLoading) {
    return (
      <Container>
        <div className="py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-6">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    )
  }

  if (error || !profile) {
    return (
      <Container>
        <div className="py-16 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600 mb-6">
            The user you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </Container>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'deals', name: `Deals (${profile?.stats?.deals_count || 0})`, icon: TrendingUp },
    { id: 'coupons', name: `Coupons (${profile?.stats?.coupons_count || 0})`, icon: Tag },
    { id: 'followers', name: `Followers (${profile?.stats?.followers_count || 0})`, icon: Users }
  ]

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-red-500" />
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700'
      case 'moderator':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Container>
      <div className="py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
          >
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0 relative group">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.handle}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border-4 border-primary-100">
                    <User className="w-12 h-12 text-primary-600" />
                  </div>
                )}
                {isOwnProfile && (
                  <button
                    className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile.display_name || `@${profile.handle}`}
                  </h1>
                  {profile.display_name && (
                    <p className="text-gray-500">@{profile.handle}</p>
                  )}
                  {getRoleIcon(profile.role)}
                  {profile.role && profile.role !== 'user' && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(profile.role)}`}>
                      {profile.role}
                    </span>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-gray-600 text-lg mb-4 max-w-2xl">
                    {profile.bio}
                  </p>
                )}

                {/* User Details */}
                <div className="flex flex-wrap items-center gap-6 text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-gray-900">{profile.karma || 0}</span>
                    <span>karma</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {dateAgo(profile.created_at)}</span>
                  </div>

                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}

                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Website</span>
                    </a>
                  )}


                  {profile.last_active_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Last active {dateAgo(profile.last_active_at)}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={() => {
                          setEditForm({
                            first_name: profile?.first_name || '',
                            last_name: profile?.last_name || '',
                            display_name: profile?.display_name || '',
                            bio: profile?.bio || '',
                            location: profile?.location || '',
                            website: profile?.website || ''
                          })
                          setShowEditModal(true)
                        }}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Profile
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => followMutation.mutate()}
                        disabled={followMutation.isPending}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          followStatus?.following
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {followMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : followStatus?.following ? (
                          <UserMinus className="w-4 h-4" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        {followStatus?.following ? 'Unfollow' : 'Follow'}
                      </button>
                      
                      <button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{profile.stats?.deals_count || 0}</p>
                  <p className="text-gray-600">Deals Posted</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Tag className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{profile.stats?.coupons_count || 0}</p>
                  <p className="text-gray-600">Coupons Posted</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{(profile.stats?.total_views || 0).toLocaleString()}</p>
                  <p className="text-gray-600">Total Views</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{profile.stats?.followers_count || 0}</p>
                  <p className="text-gray-600">Followers</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{profile.karma || 0}</p>
                  <p className="text-gray-600">Karma Points</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="border-b border-gray-200">
              <div className="flex items-center justify-between px-6 py-4">
                <nav className="flex space-x-8">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.name}
                      </button>
                    )
                  })}
                </nav>

                {(activeTab === 'deals' || activeTab === 'coupons') && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-primary-100 text-primary-600'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list'
                          ? 'bg-primary-100 text-primary-600'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Recent Deals */}
                  {userDeals && userDeals.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Deals</h3>
                        <Link
                          to={`/user/${handle}?tab=deals`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View all deals →
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userDeals.slice(0, 6).map((deal) => (
                          <NewDealCard key={deal.id} deal={deal} variant="compact" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Coupons */}
                  {userCoupons && userCoupons.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Coupons</h3>
                        <Link
                          to={`/user/${handle}?tab=coupons`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View all coupons →
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userCoupons.slice(0, 6).map((coupon) => (
                          <CouponCard key={coupon.id} coupon={coupon} variant="compact" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {(!userDeals || userDeals.length === 0) && (!userCoupons || userCoupons.length === 0) && (
                    <div className="text-center py-12">
                      <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                      <p className="text-gray-600">
                        {isOwnProfile 
                          ? "You haven't posted any deals or coupons yet. Start sharing great deals with the community!"
                          : `@${profile.handle} hasn't posted any deals or coupons yet.`
                        }
                      </p>
                      {isOwnProfile && (
                        <Link
                          to="/post"
                          className="inline-flex items-center gap-2 mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <TrendingUp className="w-4 h-4" />
                          Post Your First Deal
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'deals' && (
                <div>
                  {dealsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48" />
                      ))}
                    </div>
                  ) : userDeals && userDeals.length > 0 ? (
                    <div className={`grid gap-6 ${
                      viewMode === 'grid' 
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                        : 'grid-cols-1'
                    }`}>
                      {userDeals.map((deal) => (
                        <NewDealCard 
                          key={deal.id} 
                          deal={deal} 
                          variant={viewMode === 'list' ? 'compact' : 'default'} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No deals posted</h3>
                      <p className="text-gray-600">
                        {isOwnProfile 
                          ? "You haven't posted any deals yet."
                          : `@${profile.handle} hasn't posted any deals yet.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'coupons' && (
                <div>
                  {couponsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48" />
                      ))}
                    </div>
                  ) : userCoupons && userCoupons.length > 0 ? (
                    <div className={`grid gap-6 ${
                      viewMode === 'grid' 
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                        : 'grid-cols-1'
                    }`}>
                      {userCoupons.map((coupon) => (
                        <CouponCard 
                          key={coupon.id} 
                          coupon={coupon} 
                          variant={viewMode === 'list' ? 'compact' : 'default'} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons posted</h3>
                      <p className="text-gray-600">
                        {isOwnProfile 
                          ? "You haven't posted any coupons yet."
                          : `@${profile.handle} hasn't posted any coupons yet.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'followers' && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Followers coming soon</h3>
                  <p className="text-gray-600">
                    We're working on a followers system to show who's following this user.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  updateProfileMutation.mutate(editForm)
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Display name (how others see you)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Your location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </Container>
  )
}

export default UserProfile