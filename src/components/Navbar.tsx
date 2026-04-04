"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Scale, Menu, X, ArrowRight, LogOut, Crown, CreditCard } from "lucide-react";

const navLinks = [
  { href: "/chat", label: "AI Lawyer" },
  { href: "/documents", label: "Documents" },
  { href: "/cases", label: "Case Strategy" },
  { href: "/rights", label: "Know Your Rights" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-surface-0/90 backdrop-blur-2xl border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center shadow-lg group-hover:shadow-gold-400/20 transition-all duration-300">
                <Scale className="w-5 h-5 text-surface-0" />
              </div>
            </div>
            <span className="text-xl font-display font-bold tracking-tight text-white">
              Sidqo
            </span>
          </Link>

          {/* Desktop nav — clean, no icons, just typography */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-white/[0.08] text-white"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* CTA / User */}
          <div className="hidden md:flex items-center">
            {session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-white/[0.06] transition-all"
                >
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gold-400/20 flex items-center justify-center text-gold-400 text-sm font-semibold">
                      {session.user.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <span className="text-sm text-white/70 font-medium max-w-[120px] truncate">
                    {session.user.name?.split(" ")[0]}
                  </span>
                  {session.user.subscriptionStatus === "active" && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gold-400/20 text-gold-400 uppercase tracking-wider">
                      Pro
                    </span>
                  )}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-surface-1 border border-white/[0.08] shadow-2xl p-2">
                    <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white font-medium truncate">{session.user.name}</p>
                        {session.user.subscriptionStatus === "active" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gold-400/20 text-gold-400">
                            PRO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 truncate">{session.user.email}</p>
                    </div>
                    {session.user.subscriptionStatus === "active" ? (
                      <button
                        onClick={async () => {
                          const res = await fetch("/api/billing-portal", { method: "POST" });
                          const data = await res.json();
                          if (data.url) window.location.href = data.url;
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
                      >
                        <CreditCard className="w-4 h-4" />
                        Manage Subscription
                      </button>
                    ) : (
                      <Link
                        href="/chat"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gold-400 hover:bg-gold-400/10 transition-all"
                      >
                        <Crown className="w-4 h-4" />
                        Upgrade to Pro
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/chat"
                className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.1] transition-all"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-surface-0/98 backdrop-blur-2xl border-t border-white/[0.06] px-6 py-6 space-y-1">
          {navLinks.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3.5 rounded-2xl text-[15px] font-medium transition-all ${
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <div className="pt-3">
            <Link
              href="/chat"
              onClick={() => setMenuOpen(false)}
              className="btn-primary w-full text-sm py-3.5 flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
