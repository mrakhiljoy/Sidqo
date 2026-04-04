"use client";

import { useState } from "react";
import { Sparkles, Check, X, Loader2, Crown } from "lucide-react";

const features = [
  "Unlimited AI legal consultations",
  "Professional document generation",
  "Comprehensive case strategy analysis",
  "Priority response speed",
];

export default function UpgradeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        setLoading(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-0/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 rounded-3xl bg-surface-1 border border-white/[0.08] p-10 shadow-2xl">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center gold-glow">
            <Crown className="w-8 h-8 text-surface-0" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-display font-bold text-white text-center mb-2">
          Upgrade to Sidqo Pro
        </h2>
        <p className="text-sm text-white/40 text-center mb-2 leading-relaxed">
          You&apos;ve used your free messages. Unlock unlimited access to all features.
        </p>

        {/* Price */}
        <div className="text-center mb-6">
          <span className="text-3xl font-display font-bold gold-text">
            AED 49
          </span>
          <span className="text-white/30 text-sm ml-1">/month</span>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-gold-400/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-gold-400" />
              </div>
              <span className="text-sm text-white/70">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2.5 py-4 text-[15px] font-semibold rounded-2xl disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Redirecting...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Upgrade Now
            </>
          )}
        </button>

        {/* Dismiss */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full mt-3 py-2.5 text-sm text-white/30 hover:text-white/50 transition-colors"
          >
            Maybe later
          </button>
        )}

        {/* Trust */}
        <p className="mt-4 text-[11px] text-white/20 text-center leading-relaxed">
          Secure payment via Stripe. Cancel anytime from your account.
        </p>
      </div>
    </div>
  );
}
