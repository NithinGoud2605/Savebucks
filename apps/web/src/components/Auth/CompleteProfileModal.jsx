import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../lib/api'

export default function CompleteProfileModal() {
  const { user, isAuthenticated, updateProfile } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [handle, setHandle] = React.useState('')
  const [checking, setChecking] = React.useState(false)
  const [available, setAvailable] = React.useState(null)
  const [error, setError] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  // Open when logged in and missing handle
  React.useEffect(() => {
    if (isAuthenticated && user && (!user.handle || user.handle.trim() === '')) {
      setOpen(true)
    }
  }, [isAuthenticated, user])

  const validateLocal = (value) => {
    if (!value || value.length < 3) return 'Username must be at least 3 characters'
    if (value.length > 24) return 'Username must be at most 24 characters'
    if (!/^[a-z0-9_]+$/i.test(value)) return 'Use letters, numbers, and underscores only'
    return ''
  }

  const checkAvailability = React.useCallback(async (value) => {
    const localErr = validateLocal(value)
    setError(localErr)
    if (localErr) {
      setAvailable(null)
      return
    }
    setChecking(true)
    setAvailable(null)
    try {
      await api.getUser(value)
      // If no error, user exists
      setAvailable(false)
    } catch (e) {
      // If 404, it's available
      if (e.status === 404) {
        setAvailable(true)
      } else {
        setAvailable(null)
      }
    } finally {
      setChecking(false)
    }
  }, [])

  // Debounce availability check
  const debouncedValue = useDebouncedValue(handle, 300)
  React.useEffect(() => {
    if (open && debouncedValue) {
      checkAvailability(debouncedValue)
    } else {
      setAvailable(null)
    }
  }, [debouncedValue, open, checkAvailability])

  async function onSubmit(e) {
    e.preventDefault()
    const localErr = validateLocal(handle)
    if (localErr) {
      setError(localErr)
      return
    }
    if (available === false) {
      setError('That username is taken')
      return
    }
    try {
      setSaving(true)
      await updateProfile({ handle })
      setOpen(false)
    } catch (e) {
      setError(e.message || 'Failed to save username')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Complete your profile</h2>
        <p className="text-sm text-gray-600 mb-4">Choose a unique username so others can find you.</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="flex items-center gap-2">
              <input
                id="username"
                type="text"
                value={handle}
                onChange={(e) => { setHandle(e.target.value.trim()); setError('') }}
                className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mint-500"
                placeholder="e.g. deal_hunter"
                autoFocus
              />
              <span className="text-xs min-w-[72px] text-right">
                {checking ? 'Checking…' : available === true ? 'Available' : available === false ? 'Taken' : ''}
              </span>
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-sm rounded-md border"
              disabled={saving}
            >
              Not now
            </button>
            <button
              type="submit"
              className="px-3 py-2 text-sm rounded-md bg-mint-600 text-white disabled:opacity-60"
              disabled={saving || checking || available === false}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}


