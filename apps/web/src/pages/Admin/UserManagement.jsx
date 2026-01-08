import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  MagnifyingGlassIcon,
  UserIcon,
  ShieldCheckIcon,
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

const UserManagement = () => {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(false)

  const queryClient = useQueryClient()

  // Fetch users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', { search, roleFilter, page }],
    queryFn: () => api.getAdminUsers({ search, role: roleFilter, page }),
    keepPreviousData: true
  })

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => api.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setShowRoleModal(false)
      setSelectedUser(null)
    }
  })

  const handleRoleChange = (user, newRole) => {
    setSelectedUser({ ...user, newRole })
    setShowRoleModal(true)
  }

  const confirmRoleChange = () => {
    if (selectedUser) {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role: selectedUser.newRole
      })
    }
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { color: 'red', text: 'Admin' },
      mod: { color: 'blue', text: 'Moderator' },
      user: { color: 'gray', text: 'User' }
    }

    const config = roleConfig[role] || roleConfig.user

    const colorClasses = {
      red: 'bg-red-100 text-red-800',
      blue: 'bg-blue-100 text-blue-800',
      gray: 'bg-gray-50 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[config.color]}`}>
        {config.text}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-900">User Management</h2>
        <p className="text-secondary-600 mt-1">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="mod">Moderator</option>
            <option value="user">User</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearch('')
              setRoleFilter('')
              setPage(1)
            }}
            className="px-4 py-2 text-secondary-600 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <UserIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Error Loading Users
            </h3>
            <p className="text-secondary-600">
              Unable to load user data. Please try again.
            </p>
          </div>
        ) : users && users.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Karma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.handle}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium">
                                {user.handle?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-secondary-900">
                              {user.handle || 'Unknown User'}
                            </div>
                            <div className="text-sm text-secondary-500">
                              {user.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary-900">
                        {user.karma || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user, e.target.value)}
                            className="text-sm border border-secondary-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            disabled={updateRoleMutation.isLoading}
                          >
                            <option value="user">User</option>
                            <option value="mod">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-secondary-50 border-t border-secondary-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-secondary-700">
                  Showing page {page}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-secondary-600 border border-secondary-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!users || users.length < 50}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-secondary-600 border border-secondary-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <UserIcon className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No Users Found
            </h3>
            <p className="text-secondary-600">
              No users match your current filters.
            </p>
          </div>
        )}
      </div>

      {/* Role Change Confirmation Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <ShieldCheckIcon className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                Change User Role
              </h3>
            </div>

            <p className="text-secondary-600 mb-6">
              Are you sure you want to change <strong>{selectedUser.handle}</strong>'s role to{' '}
              <strong>{selectedUser.newRole}</strong>?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRoleModal(false)
                  setSelectedUser(null)
                }}
                className="px-4 py-2 text-secondary-700 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRoleChange}
                disabled={updateRoleMutation.isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updateRoleMutation.isLoading ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
