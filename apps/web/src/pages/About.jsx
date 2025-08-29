import React from 'react'
import { Container } from '../components/Layout/Container'
import { setPageMeta } from '../lib/head'
import { getSiteName } from '../lib/affFlags'

export default function About() {
  React.useEffect(() => {
    setPageMeta({
      title: 'About Us',
      description: 'Learn about SaveBucks mission, vision, and commitment to helping you save money.',
    })
  }, [])

  const siteName = getSiteName()

  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            About {siteName}
          </h1>
          <p className="text-xl text-gray-600">
            Building the most trusted community-driven deals platform
          </p>
        </div>

        {/* Mission Statement */}
        <div className="card p-8 mb-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7L12 2zm0 2.18L18.18 7 12 10.82 5.82 7 12 4.18zm6 10.82c0 4.25-2.53 7.1-6 7.1s-6-2.85-6-7.1V8.82l6 3.63 6-3.63V15z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Our Mission
            </h2>
          </div>
          
          <p className="text-lg text-gray-700 text-center max-w-3xl mx-auto">
            To build the most trusted community-driven US deals platform where users post, vote, discuss, 
            and save — while monetizing via affiliate links and advertising without harming the user experience. 
            Our north star: fast, clean, fair ranking, friendly community, and compliant monetization.
          </p>
        </div>

        {/* Vision & Goals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fast & Clean
            </h3>
            <p className="text-gray-600 text-sm">
              Lightning-fast performance with a clean, intuitive interface that puts deals first.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Community Driven
            </h3>
            <p className="text-gray-600 text-sm">
              Real people sharing real deals with fair voting and transparent moderation.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Trusted & Transparent
            </h3>
            <p className="text-gray-600 text-sm">
              Clear affiliate disclosures and ethical monetization that benefits everyone.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Join Our Community
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Whether you're looking to save money or help others find great deals, 
            there's a place for you in the {siteName} community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/post" className="btn-primary">
              Post Your First Deal
            </a>
            <a href="/forums" className="btn-secondary">
              Join the Discussion
            </a>
          </div>
        </div>
      </div>
    </Container>
  )
}
