import React from 'react'
import { Outlet } from 'react-router-dom'
import { SkipLink } from './components/Layout/SkipLink'
import Navbar from './components/Layout/Navbar'
import { LocationProvider } from './context/LocationContext'
import CompleteProfileModal from './components/Auth/CompleteProfileModal'

export function App() {
  return (
    <LocationProvider>
      <div className="min-h-screen bg-secondary-50 text-secondary-900">
        <SkipLink />
        <Navbar />
        <main id="main" className="flex-1">
          <Outlet />
        </main>
        <CompleteProfileModal />
      </div>
    </LocationProvider>
  )
}
