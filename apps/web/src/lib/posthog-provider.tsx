'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

// Initialise once in the browser, only when a key is configured — so the app
// runs unchanged (no network, no errors) until PostHog is wired up.
if (typeof window !== 'undefined' && posthogKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: false, // captured manually below for the App Router
    capture_pageleave: true,
    person_profiles: 'identified_only',
  });
}

/** Captures a pageview on App Router navigations. Renders nothing. */
export function PostHogPageview() {
  const pathname = usePathname();

  useEffect(() => {
    if (!posthogKey) return;
    posthog.capture('$pageview', { $current_url: window.origin + pathname });
  }, [pathname]);

  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  if (!posthogKey) return <>{children}</>;
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
