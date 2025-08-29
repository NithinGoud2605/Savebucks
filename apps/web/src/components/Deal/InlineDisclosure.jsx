import React from 'react'
import { isAffEnabled } from '../../lib/affFlags'

export function InlineDisclosure({ className }) {
  if (!isAffEnabled()) return null

  return (
    <p className={`text-xs text-gray-500 ${className || ''}`}>
      We may earn a commission from this link at no extra cost to you.
    </p>
  )
}
