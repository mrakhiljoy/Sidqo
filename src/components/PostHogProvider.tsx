"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";

// Initialize PostHog once
if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_POSTHOG_KEY
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false, // We handle this manually for SPA
    capture_pageleave: true,
    autocapture: true,
  });
}

// Page view tracker for SPA navigation
function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) url += `?${search}`;
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

// Identify logged-in users for cohort analysis
function PostHogIdentify() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.email) {
      posthog.identify(session.user.email, {
        email: session.user.email,
        name: session.user.name || undefined,
        subscription_status: session.user.subscriptionStatus || "free",
      });
    }
  }, [session?.user?.email, session?.user?.subscriptionStatus]);

  return null;
}

export default function PostHogProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      <PostHogIdentify />
      {children}
    </PHProvider>
  );
}

// ─── Event helpers ─────────────────────────────────────────
// Import these anywhere you need to track events

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  posthog.capture(event, properties);
}
