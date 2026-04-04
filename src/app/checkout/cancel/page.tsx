"use client";

import { Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-navy-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <Scale className="w-10 h-10 text-white/30" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-display font-bold text-white mb-3">
          No worries
        </h1>
        <p className="text-white/40 text-sm mb-8 leading-relaxed">
          You can upgrade to Sidqo Pro anytime. Your free messages are still
          available.
        </p>

        {/* Link back */}
        <Link
          href="/chat"
          className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </Link>
      </div>
    </div>
  );
}
