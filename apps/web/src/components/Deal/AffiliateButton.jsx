import React from 'react'
import { getAffiliateLink, isAffEnabled } from '../../lib/affFlags'
import { clsx } from 'clsx'

export function AffiliateButton({ dealId, className, children = "Go to Deal" }) {
  const affiliateUrl = getAffiliateLink(dealId)
  const isAffiliate = isAffEnabled()

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel={isAffiliate ? "nofollow noopener sponsored" : "nofollow noopener"}
      className={clsx(
        'btn-primary inline-flex items-center space-x-2',
        className
      )}
    >
      <span>{children}</span>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  )
}
