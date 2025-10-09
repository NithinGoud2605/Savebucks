import React from 'react'
import { Outlet } from 'react-router-dom'
import { SkipLink } from './components/Layout/SkipLink'
import Navbar from './components/Layout/Navbar'
import { LocationProvider } from './context/LocationContext'
import CompleteProfileModal from './components/Auth/CompleteProfileModal'

export function App() {
  return (
    <LocationProvider>
      <div className="min-h-screen bg-white text-secondary-900 relative">
        {/* Very light green background image with extremely low opacity */}
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Ccircle cx='40' cy='40' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}
        />
        <SkipLink />
        <Navbar />
        <main id="main" className="flex-1 relative z-10">
          <Outlet />
        </main>
        <CompleteProfileModal />
      </div>
    </LocationProvider>
  )
}
