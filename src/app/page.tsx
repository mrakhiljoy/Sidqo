"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  MessageSquare,
  FileText,
  Briefcase,
  BookOpen,
  Shield,
  ChevronRight,
  Star,
  CheckCircle,
  ArrowRight,
  Gavel,
  Globe,
  Clock,
  Lock,
  Users,
  Sparkles,
} from "lucide-react";
import Footer from "@/components/Footer";

const legalAreas = [
  { icon: "👔", title: "Employment Law", desc: "Wrongful termination, EOBI, gratuity, labor disputes" },
  { icon: "🏢", title: "Business & Commercial", desc: "Company formation, contracts, disputes, licensing" },
  { icon: "🏠", title: "Real Estate", desc: "Tenancy contracts, RERA, property disputes, Ejari" },
  { icon: "👨‍👩‍👧", title: "Family Law", desc: "Divorce, custody, alimony, inheritance under UAE law" },
  { icon: "⚖️", title: "Criminal Defense", desc: "Rights, procedures, bail, court representation" },
  { icon: "✈️", title: "Immigration & Visas", desc: "Residency, Golden Visa, work permits, status changes" },
  { icon: "💼", title: "Debt & Finance", desc: "Cheque cases, bank disputes, debt restructuring" },
  { icon: "🛡️", title: "Consumer Rights", desc: "Fraud protection, product liability, refunds" },
];

const features = [
  {
    icon: MessageSquare,
    title: "AI Legal Consultation",
    desc: "Chat with our AI trained on UAE federal laws, DIFC regulations, and local court precedents. Get instant, accurate legal guidance 24/7.",
    color: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: FileText,
    title: "Legal Document Generator",
    desc: "Create professional legal memorandums, demand letters, contract templates, and court submissions tailored to UAE legal standards.",
    color: "from-gold-400/20 to-gold-600/5",
    border: "border-gold-400/20",
    iconColor: "text-gold-400",
  },
  {
    icon: Briefcase,
    title: "Case Strategy Builder",
    desc: "Get a complete roadmap for your case — evidence checklist, timeline, legal arguments, and step-by-step action plan.",
    color: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: BookOpen,
    title: "Know Your Rights",
    desc: "Instantly understand your rights in any situation. Employment termination, tenant rights, arrest procedures, consumer protections.",
    color: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
];

const stats = [
  { value: "1,500+", label: "UAE Laws Covered" },
  { value: "24/7", label: "Always Available" },
  { value: "6", label: "Emirates Supported" },
  { value: "< 10s", label: "Response Time" },
];

const testimonials = [
  {
    text: "Sidqo helped me understand my rights when my employer wrongfully terminated me. The step-by-step guidance was incredibly clear.",
    name: "Ahmed Al-Rashidi",
    role: "IT Professional, Dubai",
    rating: 5,
  },
  {
    text: "Generated a complete legal memorandum for my tenancy dispute in minutes. Saved me thousands in lawyer consultation fees.",
    name: "Sarah Johnson",
    role: "Expat Resident, Abu Dhabi",
    rating: 5,
  },
  {
    text: "The case strategy builder laid out exactly what I needed to do for my business dispute. Incredibly thorough and accurate.",
    name: "Mohammed Al-Khalidi",
    role: "Business Owner, Sharjah",
    rating: 5,
  },
];

const quickActions = [
  { label: "Was my termination legal?", href: "/chat?q=termination" },
  { label: "Tenant rights in UAE", href: "/chat?q=tenant" },
  { label: "Golden Visa eligibility", href: "/chat?q=golden-visa" },
  { label: "Start a business in UAE", href: "/chat?q=business" },
];

export default function HomePage() {
  const [typedText, setTypedText] = useState("");
  const phrases = [
    "Know Your Rights in UAE",
    "Navigate Complex Legal Cases",
    "Create Legal Memorandums",
    "Get Step-by-Step Guidance",
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setTypedText(currentPhrase.substring(0, charIndex + 1));
          setCharIndex((c) => c + 1);
          if (charIndex + 1 === currentPhrase.length) {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          setTypedText(currentPhrase.substring(0, charIndex - 1));
          setCharIndex((c) => c - 1);
          if (charIndex - 1 === 0) {
            setIsDeleting(false);
            setPhraseIndex((p) => (p + 1) % phrases.length);
          }
        }
      },
      isDeleting ? 40 : 80
    );
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 mesh-bg pattern-overlay" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold-400/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-navy-400/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gold-400/3 blur-3xl" />
        </div>

        {/* Decorative scale icon */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-5 hidden xl:block">
          <Scale className="w-96 h-96 text-gold-400" strokeWidth={0.5} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/25 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-gold-400 font-medium">UAE's Most Advanced AI Legal Platform</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Main heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-slide-up">
              <span className="text-warm-white/95">Your AI Lawyer</span>
              <br />
              <span className="text-warm-white/95">to Help You </span>
              <span className="gold-text inline-block min-w-[14ch] text-left">
                {typedText}
                <span className="inline-block w-0.5 h-[1.1em] bg-gold-400 ml-1 align-middle animate-pulse" />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-warm-white/60 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up">
              Navigate UAE law with confidence. Get instant legal guidance, generate professional documents, build case strategies, and understand your rights — powered by advanced AI trained on UAE legislation.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up">
              <Link
                href="/chat"
                className="btn-primary flex items-center gap-3 text-base px-8 py-4 rounded-xl group"
              >
                <MessageSquare className="w-5 h-5" />
                Talk to AI Lawyer
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/rights"
                className="btn-secondary flex items-center gap-3 text-base px-8 py-4 rounded-xl"
              >
                <BookOpen className="w-5 h-5" />
                Know Your Rights
              </Link>
            </div>

            {/* Quick action chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
              <span className="text-xs text-warm-white/30 mr-1">Quick questions:</span>
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-warm-white/50 hover:border-gold-400/40 hover:text-gold-400 transition-all"
                >
                  {action.label}
                </Link>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-warm-white/40">
              {[
                { icon: Shield, text: "UAE Federal Law Compliant" },
                { icon: Lock, text: "Confidential & Secure" },
                { icon: Clock, text: "24/7 Available" },
                { icon: Globe, text: "All 7 Emirates" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-gold-400/50" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-warm-white/20 animate-bounce">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-gold-400/30" />
          <div className="w-1 h-1 rounded-full bg-gold-400/30" />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gold-400/10 bg-navy-700/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold gold-text mb-1">{value}</div>
                <div className="text-sm text-warm-white/50">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 pattern-overlay opacity-50" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/20 mb-4">
              <Gavel className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-gold-400 font-medium">Complete Legal Suite</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-warm-white mb-4">
              Everything You Need to
              <span className="gold-text"> Win Your Case</span>
            </h2>
            <p className="text-lg text-warm-white/50 max-w-2xl mx-auto">
              From understanding your rights to building a complete legal strategy — Sidqo guides you through every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc, color, border, iconColor }) => (
              <div
                key={title}
                className={`glass glass-hover rounded-2xl p-8 bg-gradient-to-br ${color} border ${border}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5 ${iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-warm-white mb-3">{title}</h3>
                <p className="text-warm-white/60 leading-relaxed mb-5">{desc}</p>
                <Link
                  href={title === "AI Legal Consultation" ? "/chat" : title === "Legal Document Generator" ? "/documents" : title === "Case Strategy Builder" ? "/cases" : "/rights"}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-300 transition-colors"
                >
                  Get Started
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Areas */}
      <section className="py-20 border-y border-gold-400/10 bg-navy-700/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-warm-white mb-3">
              All Areas of
              <span className="gold-text"> UAE Law</span>
            </h2>
            <p className="text-warm-white/50">Comprehensive coverage across every legal domain in the UAE</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {legalAreas.map(({ icon, title, desc }) => (
              <Link
                key={title}
                href="/chat"
                className="glass glass-hover rounded-xl p-5 text-center group"
              >
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="text-sm font-semibold text-warm-white mb-1.5 group-hover:text-gold-400 transition-colors">
                  {title}
                </h3>
                <p className="text-xs text-warm-white/40 leading-relaxed">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-warm-white mb-4">
              Get Legal Help in
              <span className="gold-text"> 3 Simple Steps</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-gold-400/30 via-gold-400/60 to-gold-400/30" />
            {[
              {
                step: "01",
                icon: MessageSquare,
                title: "Describe Your Situation",
                desc: "Tell Sidqo about your legal issue in plain language. No legal jargon required.",
              },
              {
                step: "02",
                icon: Scale,
                title: "AI Analyzes UAE Law",
                desc: "Our AI instantly cross-references your situation against UAE federal and local laws.",
              },
              {
                step: "03",
                icon: Gavel,
                title: "Get Your Legal Strategy",
                desc: "Receive a complete action plan, documents, and step-by-step guidance tailored to your case.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 border border-gold-400/30 flex items-center justify-center mx-auto gold-glow">
                    <Icon className="w-8 h-8 text-gold-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gold-400 text-navy-900 text-xs font-bold flex items-center justify-center">
                    {step.replace("0", "")}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-warm-white mb-3">{title}</h3>
                <p className="text-warm-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-navy-700/20 border-y border-gold-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-warm-white mb-3">
              Trusted by <span className="gold-text">UAE Residents</span>
            </h2>
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-gold-400 fill-current" />
              ))}
              <span className="ml-2 text-warm-white/50 text-sm">4.9/5 from 2,400+ users</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ text, name, role, rating }) => (
              <div key={name} className="glass rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gold-400 fill-current" />
                  ))}
                </div>
                <p className="text-warm-white/70 text-sm leading-relaxed mb-5 italic">"{text}"</p>
                <div>
                  <div className="text-sm font-semibold text-warm-white">{name}</div>
                  <div className="text-xs text-warm-white/40 mt-0.5">{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-xl border border-gold-400/20 bg-gold-400/5 p-5 flex gap-4">
            <Shield className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gold-400 mb-1">Important Legal Disclaimer</p>
              <p className="text-xs text-warm-white/50 leading-relaxed">
                Sidqo is an AI-powered legal information platform for educational and informational purposes only. The information provided does not constitute legal advice and should not be relied upon as such. For specific legal matters, always consult a licensed attorney qualified to practice in the UAE. Sidqo is not a law firm and does not create an attorney-client relationship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-navy-700 via-navy-600 to-navy-700" />
          <div className="absolute inset-0 bg-gradient-radial from-gold-400/10 via-transparent to-transparent" />
          <div className="absolute inset-0 pattern-overlay" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-8 gold-glow-intense">
            <Scale className="w-8 h-8 text-navy-900" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-warm-white mb-5">
            Ready to Understand
            <span className="gold-text"> Your Rights?</span>
          </h2>
          <p className="text-lg text-warm-white/60 mb-10 max-w-xl mx-auto">
            Join thousands of UAE residents who use Sidqo to navigate legal challenges with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/chat"
              className="btn-primary flex items-center gap-3 text-base px-8 py-4 rounded-xl group"
            >
              <MessageSquare className="w-5 h-5" />
              Start Free Consultation
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/documents"
              className="btn-secondary flex items-center gap-3 text-base px-8 py-4 rounded-xl"
            >
              <FileText className="w-5 h-5" />
              Generate Legal Document
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-warm-white/40">
            {["No signup required", "Free to use", "Instant responses", "UAE law expert"].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-gold-400/50" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
