import { useEffect } from 'react'
import { isAdsEnabled } from './affFlags'

export function useAdsense() {
  useEffect(() => {
    if (!isAdsEnabled()) return
    
    const pubId = import.meta.env.VITE_ADS_PUB_ID
    if (!pubId || pubId === 'ca-pub-placeholder') return
    
    // Only load once
    if (document.querySelector('script[src*="adsbygoogle"]')) return
    
    const script = document.createElement('script')
    script.async = true
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`
    script.crossOrigin = 'anonymous'
    
    script.onload = () => {
      console.log('AdSense script loaded')
    }
    
    script.onerror = () => {
      console.warn('Failed to load AdSense script')
    }
    
    document.head.appendChild(script)
  }, [])
}
