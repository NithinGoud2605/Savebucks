import React from 'react'
import { Container } from '../components/Layout/Container'
import { setPageMeta } from '../lib/head'
import { getSiteName, getContactEmail } from '../lib/affFlags'

export default function Terms() {
  React.useEffect(() => {
    setPageMeta({
      title: 'Terms of Service',
      description: 'Terms and conditions for using the SaveBucks platform.',
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
            Terms of Service
          </h1>
          <p className="text-gray-600">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="card p-8 prose prose-gray max-w-none">
          <h2>Agreement to Terms</h2>
          <p>
            By accessing and using {siteName}, you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to abide by the above, please 
            do not use this service.
          </p>

          <h2>Description of Service</h2>
          <p>
            {siteName} is a community-driven deals platform where users can:
          </p>
          <ul>
            <li>Discover and share deals and discounts</li>
            <li>Vote on deals and participate in discussions</li>
            <li>Connect with other deal hunters in our forums</li>
            <li>Access curated deal recommendations</li>
          </ul>

          <h2>User Accounts</h2>
          
          <h3>Registration</h3>
          <p>
            To access certain features, you must create an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your information</li>
            <li>Keep your login credentials secure</li>
            <li>Be responsible for all activity under your account</li>
          </ul>
          
          <h3>Account Termination</h3>
          <p>
            We reserve the right to terminate or suspend accounts that violate these terms 
            or engage in prohibited activities.
          </p>

          <h2>User Content and Conduct</h2>
          
          <h3>Content Guidelines</h3>
          <p>
            When posting deals, comments, or other content, you agree to:
          </p>
          <ul>
            <li>Post accurate and truthful information</li>
            <li>Respect intellectual property rights</li>
            <li>Not post spam, duplicate, or irrelevant content</li>
            <li>Not impersonate others or create fake accounts</li>
            <li>Follow community guidelines and moderation decisions</li>
          </ul>
          
          <h3>Prohibited Content</h3>
          <p>
            The following content is prohibited:
          </p>
          <ul>
            <li>Illegal, harmful, or offensive material</li>
            <li>Hate speech, harassment, or discriminatory content</li>
            <li>Spam, phishing, or fraudulent schemes</li>
            <li>Adult content or material harmful to minors</li>
            <li>Copyrighted material without permission</li>
            <li>Personal information of others</li>
          </ul>
          
          <h3>Content Ownership</h3>
          <p>
            You retain ownership of content you post, but grant {siteName} a license to use, 
            display, and distribute your content on our platform. We may remove content that 
            violates these terms.
          </p>

          <h2>Deals and Affiliate Links</h2>
          
          <h3>Deal Accuracy</h3>
          <p>
            While we strive to provide accurate deal information, we cannot guarantee the 
            availability, pricing, or terms of deals posted by users. Always verify deal 
            details before making purchases.
          </p>
          
          <h3>Affiliate Relationships</h3>
          <p>
            Some links on our site are affiliate links. We may earn commissions from purchases 
            made through these links at no additional cost to you. This helps support our platform.
          </p>
          
          <h3>Third-Party Merchants</h3>
          <p>
            We are not responsible for the practices, policies, or performance of third-party 
            merchants. Your transactions are with the merchants directly.
          </p>

          <h2>Community Guidelines</h2>
          
          <h3>Respectful Participation</h3>
          <p>
            We encourage constructive discussion and mutual respect among community members. 
            Harassment, bullying, or toxic behavior will not be tolerated.
          </p>
          
          <h3>Moderation</h3>
          <p>
            Our moderators work to maintain a positive community environment. Moderation 
            decisions are final, though you may appeal through our contact channels.
          </p>
          
          <h3>Voting and Karma</h3>
          <p>
            Vote on deals based on their quality and value. Do not manipulate voting through 
            multiple accounts, vote trading, or other artificial means.
          </p>

          <h2>Intellectual Property</h2>
          <p>
            The {siteName} website, including its design, code, trademarks, and content 
            (excluding user-generated content), is owned by us and protected by intellectual 
            property laws.
          </p>
          
          <p>
            You may not copy, modify, distribute, or reverse engineer our platform without 
            explicit permission.
          </p>

          <h2>Privacy</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy, which also 
            governs your use of the service, to understand our practices.
          </p>

          <h2>Disclaimers</h2>
          
          <h3>Service Availability</h3>
          <p>
            We strive to maintain service availability but cannot guarantee uninterrupted access. 
            We may suspend or terminate the service for maintenance, updates, or other reasons.
          </p>
          
          <h3>Content Accuracy</h3>
          <p>
            Information on our site is provided "as is" without warranties. We do not guarantee 
            the accuracy, completeness, or timeliness of deal information or user content.
          </p>
          
          <h3>External Links</h3>
          <p>
            Our site contains links to external websites. We are not responsible for the content, 
            privacy policies, or practices of these external sites.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, {siteName} shall not be liable for any 
            indirect, incidental, special, consequential, or punitive damages, including but 
            not limited to loss of profits, data, use, or goodwill.
          </p>
          
          <p>
            Our total liability to you for all claims arising from your use of the service 
            shall not exceed $100 or the amount you paid us in the past 12 months, whichever 
            is greater.
          </p>

          <h2>Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless {siteName}, its officers, directors, 
            employees, and agents from any claims, damages, or expenses arising from your use 
            of the service, violation of these terms, or infringement of others' rights.
          </p>

          <h2>Governing Law</h2>
          <p>
            These terms are governed by the laws of the United States and the state where 
            our company is incorporated. Any disputes shall be resolved in the appropriate 
            courts in that jurisdiction.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Material changes will be 
            communicated through our website or email. Your continued use of the service after 
            changes indicates acceptance of the new terms.
          </p>

          <h2>Severability</h2>
          <p>
            If any provision of these terms is found to be unenforceable, the remaining 
            provisions will continue in full force and effect.
          </p>

          <h2>Entire Agreement</h2>
          <p>
            These terms, along with our Privacy Policy and any other policies referenced herein, 
            constitute the entire agreement between you and {siteName} regarding your use of 
            the service.
          </p>

          <h2>Contact Information</h2>
          <p>
            Questions about these Terms of Service should be directed to{' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </p>
        </div>
      </div>
    </Container>
  )
}
