import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { SkipLink } from './components/Layout/SkipLink'
import Navbar from './components/Layout/Navbar'
import { LocationProvider } from './context/LocationContext'
import CompleteProfileModal from './components/Auth/CompleteProfileModal'
import { CommandMenu } from './components/CommandMenu/CommandMenu'
import { Toaster } from 'sonner'
import { PushNotificationPrompt } from './components/Notifications/PushNotificationPrompt'
import { AnimatePresence } from 'framer-motion'

export function App() {
  const [showPushPrompt, setShowPushPrompt] = useState(false)

  // Show push notification prompt after a delay (non-intrusive)
  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('push_prompt_dismissed')
    const hasSubscribed = localStorage.getItem('push_subscribed')

    if (!hasSeenPrompt && !hasSubscribed) {
      // Show prompt after 5 seconds of page load
      const timer = setTimeout(() => {
        setShowPushPrompt(true)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismissPrompt = () => {
    setShowPushPrompt(false)
    localStorage.setItem('push_prompt_dismissed', Date.now().toString())
  }

  return (
    <CommandMenu>
      <LocationProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100 transition-colors duration-300">
          <SkipLink />
          <Navbar />
          <main id="main" className="flex-1">
            <Outlet />
          </main>
          <CompleteProfileModal />

          {/* Push Notification Prompt */}
          <AnimatePresence>
            {showPushPrompt && (
              <PushNotificationPrompt onClose={handleDismissPrompt} />
            )}
          </AnimatePresence>
        </div>
        <Toaster />
      </LocationProvider>
    </CommandMenu>
  )
}
