import React from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../components/Layout/Container'
import { setPageMeta } from '../lib/head'

export default function NotFound() {
  React.useEffect(() => {
    setPageMeta({
      title: 'Page Not Found',
      description: 'The page you are looking for could not be found.',
    })
  }, [])

  return (
    <Container className="py-16">
      <div className="text-center max-w-lg mx-auto">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-3-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved,
            deleted, or the URL might be incorrect.
          </p>
        </div>

        <div className="space-y-4">
          <Link to="/" className="btn-primary block sm:inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    </Container>
  )
}
