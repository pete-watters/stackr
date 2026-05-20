'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * True when running inside the Capacitor native shell (iOS/Android WebView).
 *
 * Starts `false` so server render and the first client paint match the web
 * experience, then resolves on mount. Used to hide wallet-connect UI on
 * mobile — browser-extension wallets (MetaMask/Phantom/Leather) don't exist
 * in a WebView, so the native app is watch-only.
 */
export function useIsNativePlatform(): boolean {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  return isNative;
}
