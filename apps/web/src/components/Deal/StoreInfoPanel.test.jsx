import React from 'react'
import { render, screen } from '@testing-library/react'
import StoreInfoPanel from './StoreInfoPanel'

// Mock company data
const mockCompany = {
  id: 1,
  name: 'Test Store',
  slug: 'test-store',
  logo_url: 'https://example.com/logo.png',
  website_url: 'https://teststore.com',
  is_verified: true,
  description: 'A great test store for testing purposes',
  rating: 4.5,
  total_reviews: 1250,
  founded_year: 2020,
  headquarters: 'San Francisco, CA',
  employee_count: '50-100',
  revenue_range: '$1M-$10M',
  trustpilot_rating: 4.2,
  trustpilot_reviews_count: 500,
  app_store_rating: 4.8,
  play_store_rating: 4.6,
  bbb_rating: 'A+',
  bbb_accreditation: true,
  social_media: {
    facebook: 'https://facebook.com/teststore',
    twitter: 'https://twitter.com/teststore',
    instagram: 'https://instagram.com/teststore'
  },
  contact_info: {
    phone: '+1-555-123-4567',
    email: 'support@teststore.com',
    address: '123 Test St, San Francisco, CA 94105'
  },
  business_hours: {
    monday: '9:00 AM - 6:00 PM',
    tuesday: '9:00 AM - 6:00 PM',
    wednesday: '9:00 AM - 6:00 PM',
    thursday: '9:00 AM - 6:00 PM',
    friday: '9:00 AM - 6:00 PM',
    saturday: '10:00 AM - 4:00 PM',
    sunday: 'Closed'
  },
  payment_methods: ['Visa', 'MasterCard', 'PayPal', 'Apple Pay'],
  shipping_info: {
    free_shipping_threshold: '$50',
    standard_shipping: '3-5 business days',
    express_shipping: '1-2 business days'
  },
  return_policy: '30-day return policy for all items',
  customer_service: 'https://teststore.com/support',
  faq_url: 'https://teststore.com/faq',
  blog_url: 'https://teststore.com/blog',
  newsletter_signup: 'https://teststore.com/newsletter',
  loyalty_program: 'Earn 1 point per dollar spent, redeem for discounts',
  mobile_app_url: 'https://apps.apple.com/teststore',
  certifications: ['ISO 9001', 'BBB Accredited'],
  awards: ['Best Customer Service 2023', 'Top Rated Store 2022']
}

const mockDeal = {
  id: 1,
  title: 'Test Deal',
  merchant: 'Test Store',
  price: 99.99
}

describe('StoreInfoPanel', () => {
  it('renders company information correctly', () => {
    render(<StoreInfoPanel company={mockCompany} deal={mockDeal} />)
    
    expect(screen.getByText('Test Store')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('A great test store for testing purposes')).toBeInTheDocument()
  })

  it('renders ratings correctly', () => {
    render(<StoreInfoPanel company={mockCompany} deal={mockDeal} />)
    
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('(1,250 reviews)')).toBeInTheDocument()
    expect(screen.getByText('Trustpilot')).toBeInTheDocument()
    expect(screen.getByText('App Store')).toBeInTheDocument()
    expect(screen.getByText('Play Store')).toBeInTheDocument()
  })

  it('renders company stats correctly', () => {
    render(<StoreInfoPanel company={mockCompany} deal={mockDeal} />)
    
    expect(screen.getByText('2020')).toBeInTheDocument()
    expect(screen.getByText('Founded')).toBeInTheDocument()
    expect(screen.getByText('50-100')).toBeInTheDocument()
    expect(screen.getByText('Employees')).toBeInTheDocument()
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
    expect(screen.getByText('Headquarters')).toBeInTheDocument()
  })

  it('renders action buttons correctly', () => {
    render(<StoreInfoPanel company={mockCompany} deal={mockDeal} />)
    
    expect(screen.getByText('Visit Website')).toBeInTheDocument()
    expect(screen.getByText('View All Deals')).toBeInTheDocument()
    expect(screen.getByText('Mobile App')).toBeInTheDocument()
  })

  it('handles missing company data gracefully', () => {
    render(<StoreInfoPanel company={null} deal={mockDeal} />)
    
    expect(screen.getByText('Store')).toBeInTheDocument()
    expect(screen.getByText('Store information is not available for this deal.')).toBeInTheDocument()
  })

  it('expands to show more details when clicked', () => {
    render(<StoreInfoPanel company={mockCompany} deal={mockDeal} />)
    
    const showMoreButton = screen.getByText('Show More Details')
    expect(showMoreButton).toBeInTheDocument()
    
    // Click to expand
    showMoreButton.click()
    
    expect(screen.getByText('Show Less')).toBeInTheDocument()
    expect(screen.getByText('Contact Information')).toBeInTheDocument()
    expect(screen.getByText('Business Hours')).toBeInTheDocument()
    expect(screen.getByText('Payment Methods')).toBeInTheDocument()
  })
})

