import React from 'react'
import { Container } from '../components/Layout/Container'
import { setPageMeta } from '../lib/head'
import { getSiteName, getContactEmail } from '../lib/affFlags'

export default function Disclosure() {
  React.useEffect(() => {
    setPageMeta({
      title: 'Affiliate Disclosure',
      description: 'How SaveBucks uses affiliate marketing and partnerships to support our platform.',
    })
  }, [])

  const siteName = getSiteName()
  const contactEmail = getContactEmail()

  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Affiliate Disclosure
          </h1>
          <p className="text-gray-600">
            Transparency in our partnerships and monetization
          </p>
        </div>

        <div className="card p-8 prose prose-gray max-w-none">
          <h2>FTC Compliance Statement</h2>
          <p>
            In accordance with the Federal Trade Commission (FTC) guidelines, {siteName} 
            discloses that we may receive financial compensation when you click on certain 
            links and make purchases from our retail partners.
          </p>

          <h2>How Affiliate Marketing Works</h2>
          
          <h3>What Are Affiliate Links?</h3>
          <p>
            Affiliate links are special URLs that contain tracking codes. When you click on 
            these links and make a purchase, the merchant pays us a small commission at no 
            additional cost to you.
          </p>
          
          <h3>Why We Use Affiliate Marketing</h3>
          <p>
            Affiliate commissions help us:
          </p>
          <ul>
            <li>Keep our platform free for all users</li>
            <li>Pay for hosting, development, and maintenance costs</li>
            <li>Compensate our team and moderators</li>
            <li>Invest in new features and improvements</li>
          </ul>
          
          <h3>How Links Are Marked</h3>
          <p>
            We clearly identify affiliate relationships through:
          </p>
          <ul>
            <li>"Sponsored" or "Affiliate" labels on links</li>
            <li>Disclosure notices near affiliate content</li>
            <li>This dedicated disclosure page</li>
            <li>Proper HTML rel attributes (rel="sponsored")</li>
          </ul>

          <h2>Our Affiliate Partners</h2>
          
          <h3>Major Retail Partners</h3>
          <p>
            We have affiliate relationships with many popular retailers, including:
          </p>
          <ul>
            <li><strong>Amazon Associates:</strong> General merchandise and electronics</li>
            <li><strong>Commission Junction (CJ):</strong> Various retail partners</li>
            <li><strong>ShareASale:</strong> Fashion, home goods, and specialty retailers</li>
            <li><strong>Impact Radius:</strong> Major brand partnerships</li>
            <li><strong>Direct partnerships:</strong> With select merchants</li>
          </ul>
          
          <h3>Categories We Cover</h3>
          <p>
            Our affiliate partnerships span various categories:
          </p>
          <ul>
            <li>Electronics and Technology</li>
            <li>Fashion and Apparel</li>
            <li>Home and Garden</li>
            <li>Health and Beauty</li>
            <li>Sports and Outdoors</li>
            <li>Books and Media</li>
            <li>Travel and Services</li>
          </ul>

          <h2>Editorial Independence</h2>
          
          <h3>Our Promise to You</h3>
          <p>
            Despite our affiliate relationships, we maintain editorial independence:
          </p>
          <ul>
            <li><strong>Honest Reviews:</strong> We provide unbiased opinions about deals and products</li>
            <li><strong>User-First:</strong> Deal quality and value come before potential commissions</li>
            <li><strong>Community-Driven:</strong> Our users vote on and discuss deals openly</li>
            <li><strong>Transparent Moderation:</strong> We don't manipulate rankings for higher commissions</li>
          </ul>
          
          <h3>Deal Selection Process</h3>
          <p>
            Deals are featured based on:
          </p>
          <ul>
            <li>Community votes and engagement</li>
            <li>Actual value and savings offered</li>
            <li>Product quality and merchant reputation</li>
            <li>User feedback and reviews</li>
          </ul>
          
          <p>
            Affiliate potential does not influence our algorithmic ranking or editorial decisions.
          </p>

          <h2>Advertising Disclosure</h2>
          
          <h3>Display Advertising</h3>
          <p>
            In addition to affiliate marketing, we may display advertisements from:
          </p>
          <ul>
            <li><strong>Google AdSense:</strong> Contextual advertising network</li>
            <li><strong>Direct advertisers:</strong> Relevant brands and services</li>
            <li><strong>Sponsored content:</strong> Clearly marked promotional material</li>
          </ul>
          
          <h3>Ad Policies</h3>
          <p>
            Our advertising follows strict guidelines:
          </p>
          <ul>
            <li>All ads are clearly labeled as "Advertisement" or "Sponsored"</li>
            <li>We don't accept ads for illegal, harmful, or deceptive products</li>
            <li>Ad content doesn't influence our editorial decisions</li>
            <li>User experience takes priority over ad revenue</li>
          </ul>

          <h2>User Rights and Choices</h2>
          
          <h3>Your Control</h3>
          <p>
            As a user, you have complete control:
          </p>
          <ul>
            <li><strong>No Obligation:</strong> You're never required to use affiliate links</li>
            <li><strong>Direct Navigation:</strong> You can always navigate to stores directly</li>
            <li><strong>Price Comparison:</strong> We encourage comparing prices across retailers</li>
            <li><strong>Ad Blocking:</strong> You may use ad blockers if preferred</li>
          </ul>
          
          <h3>Alternative Access</h3>
          <p>
            For every affiliate link, you can:
          </p>
          <ul>
            <li>Visit the merchant's website directly</li>
            <li>Search for the product independently</li>
            <li>Use cashback or coupon services</li>
            <li>Compare prices on other platforms</li>
          </ul>

          <h2>Commission Structure</h2>
          
          <h3>Typical Commission Rates</h3>
          <p>
            Commission rates vary by merchant and category, typically ranging from:
          </p>
          <ul>
            <li><strong>Electronics:</strong> 1-4% of purchase price</li>
            <li><strong>Fashion:</strong> 3-8% of purchase price</li>
            <li><strong>Home & Garden:</strong> 2-6% of purchase price</li>
            <li><strong>Services:</strong> Fixed fees or percentage rates</li>
          </ul>
          
          <h3>Payment Processing</h3>
          <p>
            Commissions are typically:
          </p>
          <ul>
            <li>Tracked automatically through affiliate networks</li>
            <li>Subject to return and cancellation policies</li>
            <li>Paid monthly or quarterly by merchants</li>
            <li>Used to support platform operations and growth</li>
          </ul>

          <h2>Data and Privacy</h2>
          
          <h3>Tracking and Cookies</h3>
          <p>
            Affiliate links may set cookies to:
          </p>
          <ul>
            <li>Track purchases for commission attribution</li>
            <li>Remember your shopping sessions</li>
            <li>Provide relevant recommendations</li>
          </ul>
          
          <p>
            You can control cookies through your browser settings. See our Privacy Policy 
            for more details on data collection and usage.
          </p>

          <h2>International Users</h2>
          <p>
            Affiliate programs and commissions may vary by country. Some features or partnerships 
            may not be available in all regions due to local regulations or merchant policies.
          </p>

          <h2>Updates to This Disclosure</h2>
          <p>
            We may update this disclosure as our affiliate partnerships change. Material updates 
            will be noted on this page and communicated to our community when significant.
          </p>

          <h2>Questions and Concerns</h2>
          <p>
            If you have questions about our affiliate relationships or disclosure practices, 
            please contact us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </p>
          
          <p>
            We're committed to transparency and will address any concerns about our monetization 
            practices promptly and openly.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              The Bottom Line
            </h3>
            <p className="text-blue-800 mb-0">
              We make money when you save money, but only through transparent affiliate partnerships 
              that never compromise our commitment to finding you the best deals. Your trust is more 
              valuable than any commission.
            </p>
          </div>
        </div>
      </div>
    </Container>
  )
}
