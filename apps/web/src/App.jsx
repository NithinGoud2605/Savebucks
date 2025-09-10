import React from 'react'
import { Outlet } from 'react-router-dom'
import { SkipLink } from './components/Layout/SkipLink'
import Navbar from './components/Layout/Navbar'
import { ToastProvider } from './components/ui/Toast'
import { LocationProvider } from './context/LocationContext'

export function App() {
  return (
    <LocationProvider>
      <ToastProvider position="top-right" maxToasts={5}>
        <div className="min-h-screen bg-secondary-50 text-secondary-900">
          <SkipLink />
          <Navbar />
          <main id="main" className="flex-1">
            <Outlet />
          </main>
        </div>
      </ToastProvider>
    </LocationProvider>
  )
}
