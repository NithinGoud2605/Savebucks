import React, { createContext, useContext } from 'react';
const AdsCtx = createContext(true);
export function AdsProvider({ enabled = true, children }) {
  return <AdsCtx.Provider value={enabled}>{children}</AdsCtx.Provider>;
}
export function useAdsEnabled() {
  return useContext(AdsCtx);
}
