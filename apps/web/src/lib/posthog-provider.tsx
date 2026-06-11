'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, capturePageview } from '@stackr/analytics';

/**
 * Initialises privacy-preserving analytics once in the browser. All of the
 * no-PII hardening (autocapture off, session replay off, Do Not Track
 * respected, anonymous-only profiles) lives in `@stackr/analytics`. When
 * `NEXT_PUBLIC_POSTHOG_KEY` is unset the package no-ops, so the app runs
 * unchanged in dev/CI/preview.
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return <>{children}</>;
}

/** Captures a pageview (path only) on App Router navigations. Renders nothing. */
export function PostHogPageview() {
  const pathname = usePathname();

  useEffect(() => {
    capturePageview(pathname);
  }, [pathname]);

  return null;
}
