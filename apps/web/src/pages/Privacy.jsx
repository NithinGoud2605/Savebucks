import React from 'react'
import { Container } from '../components/Layout/Container'
import { setPageMeta } from '../lib/head'
import { getSiteName, getContactEmail } from '../lib/affFlags'

export default function Privacy() {
  React.useEffect(() => {
    setPageMeta({
      title: 'Privacy Policy',
      description: 'How SaveBucks collects, uses, and protects your personal information.',
    })
  }, [])

  const siteName = getSiteName()
  const contactEmail = getContactEmail()
  const lastUpdated = 'January 15, 2024'

  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="card p-8 prose prose-gray max-w-none">
          <h2>Overview</h2>
          <p>
            At {siteName}, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you visit our website and use our services.
          </p>

          <h2>Information We Collect</h2>
          
          <h3>Personal Information</h3>
          <p>
            We may collect personal information that you voluntarily provide to us when you:
          </p>
          <ul>
            <li>Create an account</li>
            <li>Post deals or comments</li>
            <li>Subscribe to our newsletter</li>
            <li>Contact us</li>
          </ul>
          
          <p>This information may include:</p>
          <ul>
            <li>Name and username</li>
            <li>Email address</li>
            <li>Profile information</li>
            <li>Communication preferences</li>
          </ul>

          <h3>Automatically Collected Information</h3>
          <p>
            When you visit our website, we automatically collect certain information, including:
          </p>
          <ul>
            <li>IP address and location data</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Pages viewed and time spent</li>
            <li>Referring website</li>
            <li>Device information</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul>
            <li>Provide and maintain our services</li>
            <li>Process your transactions and requests</li>
            <li>Send you updates and notifications</li>
            <li>Improve our website and services</li>
            <li>Personalize your experience</li>
            <li>Prevent fraud and enhance security</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>Information Sharing and Disclosure</h2>
          
          <h3>We Do Not Sell Your Data</h3>
          <p>
            We do not sell, rent, or trade your personal information to third parties for their 
            marketing purposes.
          </p>
          
          <h3>When We May Share Information</h3>
          <p>
            We may share your information in the following circumstances:
          </p>
          <ul>
            <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
            <li><strong>Service Providers:</strong> With trusted third parties who help us operate our website</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfer:</strong> In connection with a merger, sale, or asset transfer</li>
            <li><strong>Public Posts:</strong> Information in your public posts and profile</li>
          </ul>

          <h2>Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar technologies to:
          </p>
          <ul>
            <li>Remember your preferences</li>
            <li>Analyze website traffic</li>
            <li>Improve our services</li>
            <li>Provide targeted advertising</li>
          </ul>
          
          <p>
            You can control cookie settings in your browser. However, disabling cookies may affect 
            your ability to use certain features of our website.
          </p>

          <h2>Third-Party Services</h2>
          
          <h3>Analytics</h3>
          <p>
            We use Google Analytics to understand how visitors use our site. Google Analytics 
            collects information anonymously and reports website trends without identifying 
            individual visitors.
          </p>
          
          <h3>Advertising</h3>
          <p>
            We may display advertisements from third parties, including Google AdSense. These 
            advertisers may use cookies to serve ads based on your visits to our site and other sites.
          </p>
          
          <h3>Affiliate Links</h3>
          <p>
            Our website contains affiliate links. When you click on these links, the merchant may 
            collect information about your visit. Please review the privacy policies of our affiliate 
            partners.
          </p>

          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your 
            personal information, including:
          </p>
          <ul>
            <li>Encryption of sensitive data</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication</li>
            <li>Secure data transmission</li>
          </ul>
          
          <p>
            However, no method of transmission over the Internet is 100% secure. We cannot guarantee 
            absolute security of your information.
          </p>

          <h2>Your Rights and Choices</h2>
          
          <h3>Account Information</h3>
          <p>
            You can review and update your account information at any time through your profile settings.
          </p>
          
          <h3>Communication Preferences</h3>
          <p>
            You can opt out of promotional emails by following the unsubscribe link in any email 
            or updating your preferences in your account settings.
          </p>
          
          <h3>Data Access and Deletion</h3>
          <p>
            You have the right to:
          </p>
          <ul>
            <li>Access your personal information</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and data</li>
            <li>Export your data in a portable format</li>
          </ul>

          <h2>Children's Privacy</h2>
          <p>
            Our services are not intended for children under 13 years of age. We do not knowingly 
            collect personal information from children under 13. If you believe we have collected 
            information from a child under 13, please contact us immediately.
          </p>

          <h2>International Users</h2>
          <p>
            If you are visiting from outside the United States, please be aware that your information 
            may be transferred to, stored, and processed in the United States where our servers are 
            located.
          </p>

          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material 
            changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
          
          <p>
            Your continued use of our services after any changes indicates your acceptance of the 
            updated Privacy Policy.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </p>
          
          <p>
            We will respond to your inquiry within a reasonable timeframe.
          </p>
        </div>
      </div>
    </Container>
  )
}
