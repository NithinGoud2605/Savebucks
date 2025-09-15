import React from 'react'
import { Link } from 'react-router-dom'
import { VoteButton } from './VoteButton'
import { formatPrice } from '../../lib/format'
import { getCompanyName } from '../../lib/companyUtils'
import { clsx } from 'clsx'

export function CompactDealCard({ deal, className }) {
  const score = (deal.ups || 0) - (deal.downs || 0)
  
  // Get images array - prioritize deal_images, fallback to image_url
  const images = deal.deal_images?.length > 0 ? deal.deal_images : (deal.image_url ? [deal.image_url] : [])
  const currentImage = images[0] || deal.image_url

  return (
    <article className={clsx('bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-md p-2 hover:shadow-medium transition-shadow', className)}>
      <div className="flex items-center gap-2">
        <VoteButton dealId={deal.id} votes={score} userVote={deal.user_vote} />
        <div className="min-w-0 flex-1">
          <Link to={`/deal/${deal.id}`} className="block text-xs font-semibold text-secondary-900 dark:text-secondary-50 hover:text-primary-600 line-clamp-2">
            {deal.title}
          </Link>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-secondary-600 dark:text-secondary-400">
            {getCompanyName(deal) && <span className="truncate">{getCompanyName(deal)}</span>}
            {deal.price && (
              <span className="font-semibold text-teal-600 dark:text-teal-400">{formatPrice(deal.price, deal.currency)}</span>
            )}
          </div>
        </div>
        {currentImage && (
          <img src={currentImage} alt="" className="w-10 h-10 rounded-md object-cover hidden sm:block" loading="lazy" />
        )}
      </div>
    </article>
  )
}

