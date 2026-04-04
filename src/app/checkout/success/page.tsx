"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, Scale } from "lucide-react";

export default function CheckoutSuccessPage() {
  const { update } = useSession();
  const router = useRouter();
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    // Trigger JWT refresh immediately so subscriptionStatus updates to "active"
    // before the user lands back on /chat — this is what unblocks the pending message
    update();

    // Also hit the subscription endpoint to force a Stripe re-check
    fetch("/api/subscription?refresh=true").catch(() => {});

    // Trigger a second refresh after 2s to catch any timing delay from Stripe
    const secondRefresh = setTimeout(() => {
      update();
    }, 2000);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/chat");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearTimeout(secondRefresh);
    };
  }, []);

  return (
    <div className="min-h-screen bg-navy-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="relative mx-auto mb-8 w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-gold-400/20 animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center gold-glow">
            <Check className="w-12 h-12 text-surface-0" strokeWidth={3} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-display font-bold text-white mb-3">
          Welcome to <span className="gold-text">Sidqo Pro</span>
        </h1>
        <p className="text-white/50 text-base mb-8 leading-relaxed">
          Your subscription is active. Heading back to your conversation now.
        </p>

        {/* Redirect notice */}
        <div className="glass rounded-2xl px-6 py-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Scale className="w-4 h-4 text-gold-400" />
            <span>
              Returning in{" "}
              <span className="text-gold-400 font-semibold">{countdown}s</span>
            </span>
          </div>
        </div>

        {/* Manual link */}
        <a
          href="/chat"
          className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm"
        >
          Continue to Chat
        </a>
      </div>
    </div>
  );
}
