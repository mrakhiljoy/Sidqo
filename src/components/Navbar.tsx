"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Menu, X, MessageSquare, FileText, Briefcase, BookOpen } from "lucide-react";

const navLinks = [
  { href: "/chat", label: "AI Lawyer", icon: MessageSquare },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/cases", label: "Case Strategy", icon: Briefcase },
  { href: "/rights", label: "Know Your Rights", icon: BookOpen },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-navy-700/95 backdrop-blur-xl border-b border-gold-400/20 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg group-hover:shadow-gold-400/30 transition-all duration-300">
                <Scale className="w-5 h-5 text-navy-900" />
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight gold-text">Sidqo</span>
              <div className="text-[10px] text-gold-400/60 tracking-widest uppercase -mt-0.5 font-medium">
                UAE Legal AI
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-gold-400/15 text-gold-400 border border-gold-400/30"
                      : "text-warm-white/70 hover:text-gold-400/90 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/chat"
              className="btn-primary text-sm px-5 py-2.5 rounded-lg flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Get Legal Help
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 rounded-lg bg-white/5 border border-gold-400/20 flex items-center justify-center text-gold-400 hover:bg-white/10 transition-all"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-navy-700/98 backdrop-blur-xl border-t border-gold-400/15 px-4 py-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-gold-400/15 text-gold-400 border border-gold-400/30"
                    : "text-warm-white/70 hover:text-gold-400 hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
          <Link
            href="/chat"
            onClick={() => setMenuOpen(false)}
            className="btn-primary w-full text-sm py-3 flex items-center justify-center gap-2 mt-3"
          >
            <MessageSquare className="w-4 h-4" />
            Get Legal Help
          </Link>
        </div>
      )}
    </header>
  );
}
