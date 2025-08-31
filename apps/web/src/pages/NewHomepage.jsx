import React from 'react'
import { setPageMeta } from '../lib/head.js'
import { DealsFeed } from '../components/Homepage/DealsFeed.jsx'
import { RightSidebar } from '../components/Layout/RightSidebar.jsx'

export default function NewHomepage() {
  React.useEffect(() => {
    setPageMeta({
      title: 'SaveBucks - Best Deals, Coupons & Discounts',
      description: 'Find the best deals, coupons, and discounts from top brands. Save money on electronics, fashion, home goods, and more.',
      canonical: window.location.origin,
    })
  }, [])

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <section className="py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DealsFeed />
            </div>
            <RightSidebar />
          </div>
        </div>
      </section>
    </div>
  )
}
