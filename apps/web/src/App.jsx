import React from 'react'
import { Outlet } from 'react-router-dom'
import { SkipLink } from './components/Layout/SkipLink'
import Navbar from './components/Layout/Navbar'
import { LocationProvider } from './context/LocationContext'
import CompleteProfileModal from './components/Auth/CompleteProfileModal'
import { CommandMenu } from './components/CommandMenu/CommandMenu'
import { Toaster } from 'sonner'

export function App() {
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
        </div>
        <Toaster />
      </LocationProvider>
    </CommandMenu>
  )
}
