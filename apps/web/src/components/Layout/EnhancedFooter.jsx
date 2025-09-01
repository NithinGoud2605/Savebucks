import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export const EnhancedFooter = ({ className }) => {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'For Shoppers',
      links: [
        { label: 'Browse Deals', href: '/deals' },
        { label: 'Coupons', href: '/coupons' },
        { label: 'Categories', href: '/categories' },
        { label: 'Price Alerts', href: '/price-alerts' },
        { label: 'Saved Searches', href: '/saved-searches' },
        { label: 'Mobile App', href: '/mobile' }
      ]
    },
    {
      title: 'For Businesses',
      links: [
        { label: 'Submit Deals', href: '/submit-deal' },
        { label: 'Business Account', href: '/business' },
        { label: 'Affiliate Program', href: '/affiliate' },
        { label: 'API Access', href: '/api-docs' },
        { label: 'Advertise', href: '/advertise' },
        { label: 'Brand Partnerships', href: '/partnerships' }
      ]
    },
    {
      title: 'Community',
      links: [
        { label: 'Forums', href: '/forums' },
        { label: 'Leaderboard', href: '/leaderboard' },
        { label: 'User Guidelines', href: '/guidelines' },
        { label: 'Success Stories', href: '/stories' },
        { label: 'Blog', href: '/blog' },
        { label: 'Newsletter', href: '/newsletter' }
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/help' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Report Issue', href: '/report' },
        { label: 'Bug Bounty', href: '/security' },
        { label: 'Status Page', href: '/status' },
        { label: 'Feedback', href: '/feedback' }
      ]
    }
  ]

  const socialLinks = [
    { icon: 'twitter', href: 'https://twitter.com/savebucks', label: 'Twitter' },
    { icon: 'facebook', href: 'https://facebook.com/savebucks', label: 'Facebook' },
    { icon: 'instagram', href: 'https://instagram.com/savebucks', label: 'Instagram' },
    { icon: 'youtube', href: 'https://youtube.com/savebucks', label: 'YouTube' },
    { icon: 'discord', href: 'https://discord.gg/savebucks', label: 'Discord' },
    { icon: 'reddit', href: 'https://reddit.com/r/savebucks', label: 'Reddit' }
  ]

  const stats = [
    { label: 'Active Users', value: '2.5M+', icon: 'users' },
    { label: 'Deals Posted', value: '500K+', icon: 'tag' },
    { label: 'Money Saved', value: '$50M+', icon: 'dollarSign' },
    { label: 'Countries', value: '25+', icon: 'globe' }
  ]

  return (
    <footer className={clsx('bg-secondary-900 text-white', className)}>
      {/* Stats section */}
      <div className="border-b border-secondary-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Trusted by Millions of Smart Shoppers
            </h2>
            <p className="text-secondary-400 max-w-2xl mx-auto">
              Join our growing community and start saving money on every purchase
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-primary-600">
                  <Icon name={stat.icon} size="lg" color="white" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-secondary-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter section */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">
              Never Miss a Great Deal Again
            </h3>
            <p className="text-primary-100 mb-6 text-lg">
              Get personalized deal alerts, exclusive coupons, and insider tips delivered to your inbox
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-6">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-xl border-0 text-secondary-900 placeholder:text-secondary-500 focus:ring-2 focus:ring-white/50 focus:outline-none"
              />
              <Button
                variant="secondary"
                size="lg"
                leftIcon="mail"
                className="bg-white text-primary-600 hover:bg-primary-50 whitespace-nowrap"
              >
                Subscribe Free
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-sm text-primary-200">
              <div className="flex items-center gap-1">
                <Icon name="check" size="sm" />
                <span>No spam</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="check" size="sm" />
                <span>Unsubscribe anytime</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="check" size="sm" />
                <span>100% free</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
                <span className="text-xl font-bold text-white">SB</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                SaveBucks
              </span>
            </Link>
            
            <p className="text-secondary-400 mb-6 leading-relaxed">
              Your ultimate destination for finding the best deals, coupons, and discounts. 
              Save money on everything you love with our community-driven platform.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-800 hover:bg-primary-600 transition-colors group"
                  aria-label={social.label}
                >
                  <Icon name={social.icon} size="sm" className="group-hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h4 className="text-lg font-semibold text-white mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-secondary-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-secondary-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-secondary-400">
              <span>© {currentYear} SaveBucks. All rights reserved.</span>
              <div className="flex items-center gap-4">
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <Link to="/cookies" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="success" size="sm" leftIcon="shield">
                SSL Secured
              </Badge>
              <Badge variant="primary" size="sm" leftIcon="star">
                Trusted Platform
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default EnhancedFooter
