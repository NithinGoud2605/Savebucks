import React from 'react'
import { Outlet } from 'react-router-dom'
import { SkipLink } from './components/Layout/SkipLink'
import Navbar from './components/Layout/Navbar'
import { Footer } from './components/Layout/Footer'
import { Toast } from './components/Toast'

export function App() {
  return (
    <div className="min-h-screen bg-secondary-50 text-secondary-900">
      <SkipLink />
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
