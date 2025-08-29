import React, { useEffect, useRef } from 'react'
import { isAdsEnabled, shouldShowAdsPlaceholder } from '../lib/affFlags'
import { clsx } from 'clsx'

export function AdSlot({ 
  className,
  size = 'banner', // banner, rectangle, leaderboard
  label = 'Sponsored',
}) {
  const adRef = useRef(null)
  const adsEnabled = isAdsEnabled()
  const showPlaceholder = shouldShowAdsPlaceholder()

  useEffect(() => {
    if (!adsEnabled || !adRef.current) return

    // Push ad to queue when AdSense loads
    if (window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (error) {
        console.warn('AdSense error:', error)
      }
    }
  }, [adsEnabled])

  const sizeConfig = {
    banner: { width: 728, height: 90, style: 'display:inline-block;width:728px;height:90px;' },
    rectangle: { width: 300, height: 250, style: 'display:inline-block;width:300px;height:250px;' },
    leaderboard: { width: 970, height: 90, style: 'display:inline-block;width:970px;height:90px;' },
  }

  const config = sizeConfig[size] || sizeConfig.banner

  if (!adsEnabled && !showPlaceholder) {
    return null
  }

  return (
    <div className={clsx('my-8 flex flex-col items-center', className)}>
      <span className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
        {label}
      </span>
      
      {adsEnabled ? (
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={config.style}
          data-ad-client={import.meta.env.VITE_ADS_PUB_ID}
          data-ad-slot="auto"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center"
          style={{ width: `${config.width}px`, height: `${config.height}px`, maxWidth: '100%' }}
        >
          <div className="text-center text-gray-500">
            <div className="text-sm font-medium mb-1">Advertisement</div>
            <div className="text-xs">Placeholder - Ads disabled</div>
          </div>
        </div>
      )}
    </div>
  )
}
