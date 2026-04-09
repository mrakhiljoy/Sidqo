import Link from "next/link";
import { Scale, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-surface-1/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          {/* Brand — takes more space */}
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center">
                <Scale className="w-4 h-4 text-surface-0" />
              </div>
              <span className="text-lg font-display font-bold text-white">
                Sidqo
              </span>
            </Link>
            <p className="text-sm text-white/40 leading-relaxed mb-5 max-w-xs">
              AI-powered legal guidance for the UAE. Understand your rights,
              navigate complex cases, and take action with confidence.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/25">
              <Shield className="w-3.5 h-3.5 text-gold-400/40" />
              <span>Powered by Claude AI</span>
            </div>
          </div>

          {/* Services */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-display font-semibold text-white/50 mb-5 uppercase tracking-wider">
              Services
            </h4>
            <ul className="space-y-3">
              {[
                { href: "/chat", label: "AI Lawyer" },
                { href: "/documents", label: "Certified Translation" },
                { href: "/documents/generate", label: "Document Generator" },
                { href: "/cases", label: "Case Strategy" },
                { href: "/rights", label: "Know Your Rights" },
                { href: "/uae-gratuity-calculator", label: "UAE Gratuity Calculator" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/35 hover:text-gold-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Areas */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-display font-semibold text-white/50 mb-5 uppercase tracking-wider">
              Legal Areas
            </h4>
            <ul className="space-y-3">
              {[
                "Employment Law",
                "Business & Commercial",
                "Real Estate & Tenancy",
                "Family Law",
                "Criminal Defense",
                "Immigration & Visas",
              ].map((area) => (
                <li key={area}>
                  <Link
                    href="/chat"
                    className="text-sm text-white/35 hover:text-gold-400 transition-colors"
                  >
                    {area}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal notice */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-display font-semibold text-white/50 mb-5 uppercase tracking-wider">
              Important
            </h4>
            <p className="text-xs text-white/30 leading-relaxed mb-4">
              Sidqo provides AI-powered legal information for educational
              purposes. This is not a substitute for professional legal advice.
            </p>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-xs text-gold-400/60 font-display font-medium mb-1">
                UAE Legal Framework
              </p>
              <p className="text-xs text-white/30">
                Federal Decree-Laws, DIFC, ADGM & local regulations
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="divider-gold mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">
            © 2025 Sidqo. Built for UAE Legal Empowerment.
          </p>
          <div className="flex items-center gap-6 text-xs text-white/20">
            <Link
              href="#"
              className="hover:text-white/40 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="hover:text-white/40 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="#"
              className="hover:text-white/40 transition-colors"
            >
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
