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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  // Fetch user profile data
  const { data: profile, isLoading: profileLoading, error } = useQuery({
    queryKey: ['user-profile', handle],
    queryFn: () => api.getUser(handle),
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
    mutationFn: () => {
      console.log(`Attempting to toggle follow for user: ${handle}`)
      return api.toggleFollow(handle)
    },
    onSuccess: (data) => {
      console.log('Follow toggle success:', data)
      queryClient.invalidateQueries(['follow-status', handle])
      queryClient.invalidateQueries(['user-profile', handle])
      toast.success(data.following ? 'Following user!' : 'Unfollowed user')
    },
    onError: (error) => {
      console.error('Follow error:', error)
      toast.error('Failed to update follow status')
    }
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData) => api.updateUserProfile(handle, profileData),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile', handle])
      queryClient.invalidateQueries(['user-profile', currentUser?.id]) // Update navbar profile
      setShowEditModal(false)
      setAvatarPreview(null)
      toast.success('Profile updated successfully!')
    },
    onError: (error) => {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
    }
  })

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: (file) => api.uploadAvatar(handle, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['user-profile', handle])
      queryClient.invalidateQueries(['user-profile', currentUser?.id]) // Update navbar profile
      setAvatarPreview(null)
      toast.success('Profile picture updated successfully!')
    },
    onError: (error) => {
      console.error('Avatar upload error:', error)
      toast.error('Failed to upload profile picture')
    }
  })

  // Form validation
  const validateForm = () => {
    const errors = {}
    
    if (editForm.display_name && editForm.display_name.length > 50) {
      errors.display_name = 'Display name must be less than 50 characters'
    }
    
    if (editForm.bio && editForm.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters'
    }
    
    if (editForm.website && editForm.website && !editForm.website.match(/^https?:\/\/.+/)) {
      errors.website = 'Please enter a valid URL starting with http:// or https://'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form input changes with validation
  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target.result)
    }
    reader.readAsDataURL(file)

    // Upload the file
    setIsUploadingAvatar(true)
    try {
      await uploadAvatarMutation.mutateAsync(file)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

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
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-8"
          >
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0 relative group">
                {avatarPreview || profile.avatar_url ? (
                  <img
                    src={avatarPreview || profile.avatar_url}
                    alt={profile.handle}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border-4 border-primary-100">
                    <User className="w-12 h-12 text-primary-600" />
                  </div>
                )}
                {isOwnProfile && (
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isUploadingAvatar ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploadingAvatar}
                    />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    {/* Display Name */}
                    {profile.display_name && (
                      <h1 className="text-3xl font-bold text-gray-900 mb-1">
                        {profile.display_name}
                      </h1>
                    )}
                    
                    {/* Handle */}
                    <div className="flex items-center gap-3 mb-3">
                      <p className="text-lg text-gray-600 font-medium">@{profile.handle}</p>
                      {getRoleIcon(profile.role)}
                      {profile.role && profile.role !== 'user' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(profile.role)}`}>
                          {profile.role}
                        </span>
                      )}
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                      <div className="mb-4">
                        <p className="text-gray-700 text-base leading-relaxed max-w-2xl">
                          {profile.bio}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <span className="font-semibold text-gray-900 text-lg">{profile.karma || 0}</span>
                      <span className="text-gray-600 ml-1">karma points</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <span className="text-gray-600 text-sm">Joined</span>
                      <div className="font-medium text-gray-900">{dateAgo(profile.created_at)}</div>
                    </div>
                  </div>

                  {profile.location && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-500" />
                      <div>
                        <span className="text-gray-600 text-sm">Location</span>
                        <div className="font-medium text-gray-900">{profile.location}</div>
                      </div>
                    </div>
                  )}

                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Globe className="w-5 h-5 text-purple-500" />
                      <div>
                        <span className="text-gray-600 text-sm">Website</span>
                        <div className="font-medium text-gray-900 truncate max-w-32">{profile.website.replace(/^https?:\/\//, '')}</div>
                      </div>
                    </a>
                  )}

                  {profile.last_active_at && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <div>
                        <span className="text-gray-600 text-sm">Last active</span>
                        <div className="font-medium text-gray-900">{dateAgo(profile.last_active_at)}</div>
                      </div>
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
                        className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm hover:shadow-md"
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
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md ${
                          followStatus?.following
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
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
                        {followMutation.isPending 
                          ? (followStatus?.following ? 'Unfollowing...' : 'Following...')
                          : (followStatus?.following ? 'Unfollow' : 'Follow')
                        }
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4">
                <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1 sm:gap-2 py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                          activeTab === tab.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{tab.name}</span>
                        <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
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
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Edit Profile</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setAvatarPreview(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (validateForm()) {
                    updateProfileMutation.mutate(editForm)
                  } else {
                    toast.error('Please fix the errors before saving')
                  }
                }}
                className="space-y-6"
              >
                {/* Profile Picture Section */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    {avatarPreview || profile.avatar_url ? (
                      <img
                        src={avatarPreview || profile.avatar_url}
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover border-4 border-primary-100"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center border-4 border-primary-100">
                        <User className="w-10 h-10 text-primary-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {isUploadingAvatar ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploadingAvatar}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Profile Picture</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Click on the image to upload a new profile picture. Max size: 5MB
                    </p>
                    {isUploadingAvatar && (
                      <p className="text-sm text-primary-600">Uploading...</p>
                    )}
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editForm.display_name}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      formErrors.display_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="How others will see your name"
                    maxLength={50}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      This is how your name will appear to other users
                    </p>
                    <span className="text-xs text-gray-400">
                      {editForm.display_name.length}/50
                    </span>
                  </div>
                  {formErrors.display_name && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.display_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none ${
                      formErrors.bio ? 'border-red-300' : 'border-gray-300'
                    }`}
                    rows={4}
                    placeholder="Tell us about yourself, your interests, or what you're passionate about..."
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      Share a bit about yourself with the community
                    </p>
                    <span className="text-xs text-gray-400">
                      {editForm.bio.length}/500
                    </span>
                  </div>
                  {formErrors.bio && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.bio}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="City, State, Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      formErrors.website ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="https://yourwebsite.com"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      Share your personal website, blog, or portfolio
                    </p>
                  </div>
                  {formErrors.website && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.website}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setAvatarPreview(null)
                    }}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending || isUploadingAvatar}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
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