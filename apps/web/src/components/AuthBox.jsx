import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function AuthBox() {
  const { user, isAuthenticated, signOut } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-secondary-200 p-6">
        <div className="flex items-center space-x-4">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.handle || user.email}
                className="w-12 h-12 rounded-full border-2 border-primary-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">
                <span className="text-primary-600 font-semibold text-lg">
                  {(user.handle || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-secondary-900 truncate">
                {user.handle || user.email.split('@')[0]}
              </h3>
              {user.role !== 'user' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {user.role === 'admin' ? 'Admin' : 'Moderator'}
                </span>
              )}
            </div>
            <p className="text-sm text-secondary-600 truncate">{user.email}</p>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-secondary-500">
                Karma: <span className="font-medium text-primary-600">{user.karma || 0}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex space-x-3">
          <Link
            to={`/profile/${user.handle || user.id}`}
            className="btn btn-secondary text-sm px-4 py-2 flex-1"
          >
            View Profile
          </Link>
          <button
            onClick={signOut}
            className="btn text-sm px-4 py-2 bg-secondary-100 text-secondary-700 hover:bg-secondary-200 border border-secondary-300"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-secondary-200 p-6">
      <div className="text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-secondary-900 mb-2">
          Join SaveBucks
        </h3>
        <p className="text-sm text-secondary-600 mb-6">
          Sign in to post deals, vote, and join the community
        </p>

        <div className="space-y-3">
          <Link
            to="/signin"
            className="btn btn-primary w-full py-2.5 text-sm font-medium"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="btn btn-secondary w-full py-2.5 text-sm font-medium"
          >
            Create Account
          </Link>
        </div>

        <div className="mt-4 pt-4 border-t border-secondary-200">
          <p className="text-xs text-secondary-500">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-500">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
