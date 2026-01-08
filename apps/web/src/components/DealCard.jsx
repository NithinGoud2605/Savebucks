import React from 'react';
import { NewDealCard } from './Deal/NewDealCard';

export default function DealCard({ deal, variant = 'default', index = 0 }) {
  return <NewDealCard deal={deal} variant={variant} index={index} />
}
