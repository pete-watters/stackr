import posthog from 'posthog-js';

import type { AnalyticsEventMap, AnalyticsEventName } from './events.js';

const DEFAULT_HOST = 'https://us.i.posthog.com';

let initialised = false;

// Read at call time (not module load) so the guard is testable and so Next can
// still statically inline the `NEXT_PUBLIC_*` literals at build time.
function posthogKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY;
}

function posthogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST ?? DEFAULT_HOST;
}

/**
 * Analytics is active only in the browser and only when a key is configured.
 * Without a key (local dev, CI, preview builds) every entry point no-ops:
 * no network, no errors, no data leaves the device.
 */
function isEnabled(): boolean {
  return typeof window !== 'undefined' && Boolean(posthogKey());
}

/**
 * Initialise PostHog once, in the browser, with privacy-hardened defaults.
 * Safe to call repeatedly and safe to call without a key (it no-ops).
 *
 * The config below is the enforcement point for the no-PII contract:
 * - `autocapture: false`     — never auto-collect clicks, inputs, or text.
 * - `disable_session_recording: true` — session replay is OFF.
 * - `respect_dnt: true`      — honour the browser Do Not Track signal.
 * - `person_profiles: 'identified_only'` — stay anonymous; we never call
 *   `identify()`, so no person profiles are ever created.
 * - `capture_pageview: false` — pageviews are captured explicitly via
 *   {@link capturePageview} so we control exactly what URL is sent.
 */
export function initAnalytics(): void {
  if (initialised || !isEnabled()) return;

  posthog.init(posthogKey() as string, {
    api_host: posthogHost(),
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
    respect_dnt: true,
    person_profiles: 'identified_only',
    // Error tracking: capture unhandled exceptions only (code-level stack
    // traces, never form/user data). Gated behind the same key + DNT checks.
    capture_exceptions: true,
    // Belt-and-braces: if replay is ever enabled at the project level, every
    // input value and text node is masked so nothing legible is recorded.
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '*',
    },
  });

  initialised = true;
}

/**
 * Emit a typed product event. No-ops unless analytics is enabled.
 *
 * The generic ties `props` to the event name via {@link AnalyticsEventMap}, so
 * the type system rejects any prop that isn't part of the PII-free contract.
 */
export function track<E extends AnalyticsEventName>(event: E, props: AnalyticsEventMap[E]): void {
  if (!isEnabled()) return;
  posthog.capture(event, props);
}

/**
 * Capture an App Router pageview. We pass the path only (no query string) and
 * prefix the current origin so PostHog never receives anything beyond the
 * route the user is on.
 */
export function capturePageview(pathname: string): void {
  if (!isEnabled()) return;
  posthog.capture('$pageview', { $current_url: window.location.origin + pathname });
}
