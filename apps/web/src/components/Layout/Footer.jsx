import React from 'react'
import { Link } from 'react-router-dom'
import { Container } from './Container'
import { getSiteName, getContactEmail } from '../../lib/affFlags'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <Container>
        <div className="py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {getSiteName()}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                The most trusted community-driven US deals platform. Find the best deals, save money, and join our community.
              </p>
              <p className="text-xs text-gray-500">
                We may earn commissions from qualifying purchases through affiliate links. This helps support our community at no extra cost to you.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="/" 
                    className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded"
                  >
                    Hot Deals
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/new" 
                    className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded"
                  >
                    New Deals
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/forums" 
                    className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded"
                  >
                    Forums
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/leaderboard" 
                    className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded"
                  >
                    Leaderboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Community
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="/about" 
                    className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/post" 
                    className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded"
                  >
                    Post a Deal
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/contact" 
                    className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Legal
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="/privacy" 
                    className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/terms" 
                    className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/disclosure" 
                    className="text-sm text-gray-600 hover:text-gray-900 focus-ring rounded"
                  >
                    Affiliate Disclosure
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
                         <p className="text-sm text-gray-600">
               © {currentYear} {getSiteName()}. All rights reserved.
             </p>
            <p className="text-sm text-gray-500 mt-2 sm:mt-0">
              Contact us at{' '}
              <a 
                href={`mailto:${getContactEmail()}`}
                className="text-blue-600 hover:text-blue-700 focus-ring rounded"
              >
                {getContactEmail()}
              </a>
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
