import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { CompactDealCard } from '../Deal/CompactDealCard'
import { SkeletonList } from '../Loader/Skeleton'

export function DealsFeed({ query = {}, pageSize = 30 }) {
  const { data, isLoading } = useQuery({
    queryKey: ['deals-feed', query],
    queryFn: () => api.getDeals({ limit: pageSize, sort: 'hot', ...query }),
    staleTime: 60_000,
  })

  if (isLoading) return <SkeletonList count={8} />

  const deals = Array.isArray(data?.deals) ? data.deals : (Array.isArray(data) ? data : [])

  return (
    <div className="space-y-3">
      {deals.map((deal) => (
        <CompactDealCard key={deal.id} deal={deal} />
      ))}
    </div>
  )
}

