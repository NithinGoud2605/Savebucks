import React from 'react'
import { Link } from 'react-router-dom'
import { VoteButton } from './VoteButton'
import { formatPrice } from '../../lib/format'
import { clsx } from 'clsx'

export function CompactDealCard({ deal, className }) {
  const score = (deal.ups || 0) - (deal.downs || 0)

  return (
    <article className={clsx('bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-4 hover:shadow-medium transition-shadow', className)}>
      <div className="flex items-center gap-3">
        <VoteButton dealId={deal.id} votes={score} userVote={deal.user_vote} />
        <div className="min-w-0 flex-1">
          <Link to={`/deal/${deal.id}`} className="block text-sm sm:text-base font-semibold text-secondary-900 dark:text-secondary-50 hover:text-primary-600 truncate">
            {deal.title}
          </Link>
          <div className="mt-1 flex items-center gap-2 text-xs text-secondary-600 dark:text-secondary-400">
            {deal.merchant && <span className="truncate">{deal.merchant}</span>}
            {deal.price && (
              <span className="font-semibold text-green-600 dark:text-green-400">{formatPrice(deal.price, deal.currency)}</span>
            )}
          </div>
        </div>
        {deal.image_url && (
          <img src={deal.image_url} alt="" className="w-14 h-14 rounded-lg object-cover hidden sm:block" loading="lazy" />
        )}
      </div>
    </article>
  )
}

