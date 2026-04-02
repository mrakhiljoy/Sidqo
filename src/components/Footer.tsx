import Link from "next/link";
import { Scale, MessageSquare, FileText, Briefcase, BookOpen, Shield, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gold-400/10 bg-navy-800/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <Scale className="w-4 h-4 text-navy-900" />
              </div>
              <span className="text-lg font-bold gold-text">Sidqo</span>
            </Link>
            <p className="text-sm text-warm-white/50 leading-relaxed mb-4">
              Your intelligent AI legal companion for navigating UAE law with confidence and clarity.
            </p>
            <div className="flex items-center gap-2 text-xs text-warm-white/40">
              <Shield className="w-3.5 h-3.5 text-gold-400/60" />
              <span>Powered by Claude AI</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold text-gold-400 mb-4 uppercase tracking-wider">Services</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/chat", label: "AI Legal Consultation", icon: MessageSquare },
                { href: "/documents", label: "Legal Documents", icon: FileText },
                { href: "/cases", label: "Case Strategy", icon: Briefcase },
                { href: "/rights", label: "Know Your Rights", icon: BookOpen },
              ].map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-sm text-warm-white/50 hover:text-gold-400 transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Areas */}
          <div>
            <h4 className="text-sm font-semibold text-gold-400 mb-4 uppercase tracking-wider">Legal Areas</h4>
            <ul className="space-y-2.5">
              {[
                "Employment Law",
                "Business & Commercial",
                "Real Estate",
                "Family Law",
                "Criminal Defense",
                "Immigration & Visas",
              ].map((area) => (
                <li key={area}>
                  <Link
                    href="/chat"
                    className="text-sm text-warm-white/50 hover:text-gold-400 transition-colors"
                  >
                    {area}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h4 className="text-sm font-semibold text-gold-400 mb-4 uppercase tracking-wider">Important</h4>
            <p className="text-xs text-warm-white/40 leading-relaxed">
              Sidqo provides AI-powered legal information for educational purposes. This is not a substitute for professional legal advice. For specific legal matters, always consult a licensed UAE attorney.
            </p>
            <div className="mt-4 p-3 rounded-lg bg-gold-400/5 border border-gold-400/15">
              <p className="text-xs text-gold-400/70 font-medium">UAE Legal Framework</p>
              <p className="text-xs text-warm-white/40 mt-1">Based on UAE Federal Laws, DIFC, ADGM & local regulations.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gold-400/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-warm-white/30">
            © 2025 Sidqo. Built for UAE Legal Empowerment.
          </p>
          <div className="flex items-center gap-4 text-xs text-warm-white/30">
            <Link href="#" className="hover:text-gold-400 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-gold-400 transition-colors">Terms of Use</Link>
            <Link href="#" className="hover:text-gold-400 transition-colors">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
