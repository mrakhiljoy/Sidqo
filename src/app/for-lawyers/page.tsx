"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  Scale,
  Search,
  BookOpen,
  Clock,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  ChevronRight,
  FileText,
  Globe,
  MessageSquare,
  Briefcase,
  Plus,
} from "lucide-react";
import Footer from "@/components/Footer";

/* ─── Scroll Reveal ──────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${delay > 0 ? `reveal-delay-${delay}` : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ─── FAQ ─────────────────────────────────────── */
const faqs = [
  {
    q: "Is Sidqo a replacement for legal research databases like LexisNexis or Westlaw?",
    a: "No — Sidqo is a fast preliminary research tool, not a primary legal database. It's best used to quickly cross-reference UAE statutes, understand legislative frameworks, and get oriented on a jurisdiction before deeper research. Think of it as a highly capable associate who knows UAE law inside out.",
  },
  {
    q: "Which UAE legal sources does Sidqo cover?",
    a: "Sidqo covers UAE Federal Decree-Laws including the Labour Law (No. 33 of 2021), Civil Code, Penal Code, Commercial Companies Law, Consumer Protection Law, Cybercrime Law, DIFC regulations, ADGM frameworks, MOHRE procedures, RERA tenancy rules, and other key federal and emirate-specific legislation.",
  },
  {
    q: "How accurate are the legal citations?",
    a: "Sidqo provides specific law numbers, article references, and regulatory citations where available. As with any AI tool, you should verify citations against primary sources before relying on them in filings or client advice. Use Sidqo to get to the right law fast — then verify.",
  },
  {
    q: "Can I use Sidqo for client consultations?",
    a: "Many attorneys use Sidqo to quickly orient themselves before calls with clients on UAE matters outside their primary practice area. It's particularly useful for cross-border practitioners who need to quickly understand UAE law in the context of a broader matter.",
  },
  {
    q: "Is client information secure?",
    a: "Sidqo does not store conversation history or share data with third parties. Do not enter identifying client information — use Sidqo for statute lookup and general legal framework research only.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 px-2 text-left group"
      >
        <span className="text-[17px] font-display font-semibold text-white/90 group-hover:text-white transition-colors pr-8">
          {q}
        </span>
        <span className={`faq-toggle text-white/40 group-hover:text-gold-400 flex-shrink-0 transition-all ${open ? "open" : ""}`}>
          <Plus className="w-5 h-5" />
        </span>
      </button>
      <div className={`faq-content ${open ? "open" : ""}`}>
        <p className="text-[15px] text-white/50 leading-relaxed px-2 pb-6">{a}</p>
      </div>
    </div>
  );
}

/* ─── JSON-LD Schema ──────────────────────────── */
const professionalServiceSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Sidqo for Legal Professionals",
  description:
    "AI-powered UAE law research tool for practicing attorneys. Cross-reference federal statutes, DIFC regulations, ADGM rules, and local legislation instantly.",
  url: "https://sidqo.com/for-lawyers",
  areaServed: { "@type": "Country", name: "United Arab Emirates" },
  serviceType: "Legal Research Tool",
  audience: {
    "@type": "Audience",
    audienceType: "Legal Professionals",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

/* ─── Page ──────────────────────────────────────── */
export default function ForLawyersPage() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden hero-gradient pt-24">
        <div className="absolute inset-0 geo-pattern opacity-30" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/[0.04] blur-[100px]" />
          <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-gold-400/[0.04] blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-10 animate-fade-in">
            <Scale className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-medium text-white/60">
              Built for Legal Professionals
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          </div>

          {/* Headline */}
          <h1 className="font-display text-display-lg sm:text-display-xl font-bold mb-8 leading-[1.05] animate-slide-up opacity-0 text-white">
            Cross-reference UAE law{" "}
            <span className="gold-text italic">in seconds.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/45 mb-8 max-w-2xl mx-auto leading-relaxed font-body animate-slide-up-delay-1 opacity-0">
            Practicing attorneys use Sidqo to quickly locate statutes, understand regulatory frameworks, and prepare for UAE matters — without hours of manual research.
          </p>

          {/* Trustpilot social proof strip */}
          <div className="flex items-center justify-center gap-2 mb-12 animate-slide-up-delay-1 opacity-0">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 text-[#00b67a] fill-[#00b67a]" />
              ))}
            </div>
            <span className="text-sm font-semibold text-white/70">4.3 / 5</span>
            <span className="text-sm text-white/40">on Trustpilot</span>
            <span className="text-white/20 mx-1">·</span>
            <a
              href="https://www.trustpilot.com/review/sidqo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/40 hover:text-teal-400 transition-colors underline underline-offset-2"
            >
              Read reviews
            </a>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up-delay-2 opacity-0">
            <Link
              href="/chat"
              className="btn-primary flex items-center gap-3 text-[15px] px-8 py-4 group"
            >
              <Search className="w-4 h-4" />
              Try Free — No Sign-up
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="btn-secondary flex items-center gap-3 text-[15px] px-8 py-4"
            >
              <BookOpen className="w-4 h-4" />
              See Use Cases
            </a>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/30 mt-12 animate-slide-up-delay-3 opacity-0">
            {[
              { icon: Shield, text: "1,500+ UAE Laws Indexed" },
              { icon: Zap, text: "< 10s Response" },
              { icon: Globe, text: "DIFC & ADGM Covered" },
              { icon: Clock, text: "Available 24/7" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-teal-400/40" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TRUSTPILOT REVIEW SPOTLIGHT ═══════ */}
      <section className="py-16 border-y border-white/[0.04] bg-surface-1/40">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="relative rounded-2xl bg-surface-1 border border-teal-500/20 p-8 sm:p-10">
              {/* Trustpilot badge */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 text-[#00b67a] fill-[#00b67a]" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-white/60">Verified Trustpilot Review</span>
              </div>

              {/* Quote */}
              <blockquote className="text-xl sm:text-2xl font-display font-semibold text-white leading-relaxed mb-6">
                &ldquo;As a practicing attorney who occasionally handles out-of-state matters, I use this to{" "}
                <span className="text-teal-400">quickly cross-reference</span>{" "}
                specific statutes outside my primary jurisdiction. It&rsquo;s incredibly fast and reliable for preliminary research.&rdquo;
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm">
                  BM
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Brian Metwood</p>
                  <p className="text-xs text-white/40">Practicing Attorney · Verified Review · April 2026</p>
                </div>
              </div>

              {/* Decorative */}
              <div className="absolute top-8 right-8 text-6xl text-teal-500/10 font-display font-bold leading-none select-none">
                &ldquo;
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ VALUE PROPS ═══════ */}
      <section className="py-24 sm:py-32 section-gradient">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-teal-400 font-display tracking-wide uppercase mb-4">
                Why Legal Professionals Use Sidqo
              </p>
              <h2 className="font-display text-display-sm sm:text-display-md font-bold text-white mb-5">
                Research that used to take{" "}
                <span className="gold-text italic">hours</span>, in seconds
              </h2>
              <p className="text-lg text-white/40 max-w-2xl mx-auto">
                Whether you&rsquo;re handling a cross-border matter or need to quickly orient a client on UAE law, Sidqo has you covered.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Search,
                accent: "teal",
                title: "Instant Statute Lookup",
                desc: "Find the exact UAE law, article number, and regulatory provision in seconds. No more searching through PDFs or government portals.",
              },
              {
                icon: Globe,
                accent: "gold",
                title: "All UAE Jurisdictions",
                desc: "Federal law, DIFC regulations, ADGM frameworks, MOHRE procedures, RERA rules — unified in one interface.",
              },
              {
                icon: FileText,
                accent: "teal",
                title: "Precise Citations",
                desc: "Get specific Decree-Law numbers, article references, and regulatory citations — ready to verify and cite in your work.",
              },
              {
                icon: Zap,
                accent: "gold",
                title: "Billable Hour Efficiency",
                desc: "Stop billing six-minute increments for statute searches. Get oriented on UAE law in under 10 seconds and focus your time on higher-value legal analysis.",
              },
              {
                icon: BookOpen,
                accent: "teal",
                title: "Out-of-Jurisdiction Matters",
                desc: "Handling a UAE component in an international matter? Cross-reference local law without needing to retain local counsel just for basic statutory research.",
              },
              {
                icon: Shield,
                accent: "gold",
                title: "Always Up-to-Date",
                desc: "UAE law changes frequently. Sidqo is trained on current legislation including the 2022 Labour Law changes, updated tenancy regulations, and recent DIFC reforms.",
              },
            ].map(({ icon: Icon, accent, title, desc }, i) => (
              <Reveal key={title} delay={Math.min(i + 1, 3)}>
                <div className="bento-card p-8 h-full">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${accent === "teal" ? "bg-teal-500/10" : "bg-gold-400/10"}`}>
                    <Icon className={`w-5 h-5 ${accent === "teal" ? "text-teal-400" : "text-gold-400"}`} />
                  </div>
                  <h3 className="font-display font-bold text-white text-lg mb-2">{title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how-it-works" className="py-24 sm:py-32 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-20">
              <h2 className="font-display text-display-sm sm:text-display-md font-bold text-white mb-5">
                How attorneys{" "}
                <span className="gold-text italic">use Sidqo</span>
              </h2>
              <p className="text-lg text-white/40 max-w-xl mx-auto">
                Three research workflows that save hours per UAE matter
              </p>
            </div>
          </Reveal>

          <div className="space-y-6">
            {[
              {
                number: "01",
                title: "Statutory Cross-Reference",
                scenario: "Client situation",
                example: "\"My client signed a limited-term employment contract in Dubai and was terminated without notice. What are the compensation provisions?\"",
                result: "Sidqo surfaces the exact articles from Federal Decree-Law No. 33 of 2021, including compensation formulas, notice period requirements, and MOHRE complaint procedures — in under 10 seconds.",
                accent: "teal",
              },
              {
                number: "02",
                title: "Regulatory Framework Orientation",
                scenario: "New matter intake",
                example: "\"New client — commercial lease dispute in a Dubai freezone. What regulatory framework applies and who has jurisdiction?\"",
                result: "Sidqo explains RERA applicability, freezone-specific lease regulations, DIFC Courts jurisdiction for eligible freezones, and the applicable dispute resolution pathways.",
                accent: "gold",
              },
              {
                number: "03",
                title: "Preliminary Client Consultation Prep",
                scenario: "Before the call",
                example: "\"Client coming in about a visa cancellation after resignation — what are the timelines and protections under current UAE law?\"",
                result: "Sidqo outlines the 30-day grace period provisions, employer obligations under the new system, options for grace period extensions, and relevant GDRFA procedures.",
                accent: "teal",
              },
            ].map(({ number, title, scenario, example, result, accent }, i) => (
              <Reveal key={number} delay={i + 1}>
                <div className="bento-card p-8 sm:p-10">
                  <div className="flex gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-display font-bold text-sm ${accent === "teal" ? "bg-teal-500/10 text-teal-400" : "bg-gold-400/10 text-gold-400"}`}>
                      {number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-white text-xl mb-4">{title}</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">{scenario}</p>
                          <div className="bg-surface-0/60 rounded-xl p-4 border border-white/[0.04]">
                            <p className="text-sm text-white/60 italic">{example}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-teal-400/60 uppercase tracking-wider mb-2">Sidqo Result</p>
                          <p className="text-sm text-white/50 leading-relaxed">{result}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ LEGAL AREAS COVERED ═══════ */}
      <section className="py-24 sm:py-32 border-t border-white/[0.04] section-gradient">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="font-display text-display-sm sm:text-display-md font-bold text-white mb-5">
                Full coverage of{" "}
                <span className="gold-text italic">UAE law</span>
              </h2>
              <p className="text-lg text-white/40 max-w-xl mx-auto">
                Federal, emirate-level, freezone, and international frameworks — all indexed
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                framework: "Federal Labour Law",
                detail: "Decree-Law No. 33 of 2021 — employment contracts, termination, gratuity, MOHRE",
              },
              {
                framework: "Civil Code",
                detail: "Federal Law No. 5 of 1985 — contracts, obligations, torts, property",
              },
              {
                framework: "Penal Code",
                detail: "Federal Law No. 3 of 1987 — criminal offences, penalties, procedures",
              },
              {
                framework: "Commercial Companies Law",
                detail: "Federal Decree-Law No. 32 of 2021 — company formation, governance, liability",
              },
              {
                framework: "DIFC Regulations",
                detail: "Employment Law, Contract Law, Courts jurisdiction, financial services",
              },
              {
                framework: "ADGM Framework",
                detail: "Employment Regulations, commercial laws, dispute resolution",
              },
              {
                framework: "RERA Tenancy Law",
                detail: "Rent increases, Ejari, RERA calculator, dispute procedures",
              },
              {
                framework: "UAE Cybercrime Law",
                detail: "Federal Decree-Law No. 34 of 2021 — digital offences, social media, defamation",
              },
              {
                framework: "Personal Status Law",
                detail: "Divorce, custody, inheritance, alimony — Federal Law No. 28 of 2005",
              },
              {
                framework: "Consumer Protection",
                detail: "Federal Decree-Law No. 5 of 2023 — warranties, fraud, refund rights",
              },
              {
                framework: "Immigration Regulations",
                detail: "Residence visas, Golden Visa, work permits, overstay fines",
              },
              {
                framework: "Insolvency Law",
                detail: "Federal Decree-Law No. 9 of 2016 — bankruptcy, restructuring, liquidation",
              },
            ].map(({ framework, detail }, i) => (
              <Reveal key={framework} delay={Math.min((i % 3) + 1, 3)}>
                <div className="card-surface-interactive p-5 flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-teal-400/50 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-display font-semibold text-white mb-1">{framework}</p>
                    <p className="text-xs text-white/35 leading-relaxed">{detail}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="py-24 sm:py-32 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="font-display text-display-sm sm:text-display-md font-bold text-white mb-5">
                Questions from attorneys
              </h2>
            </div>
          </Reveal>
          <Reveal>
            <div className="divide-y divide-white/[0.04]">
              {faqs.map(({ q, a }) => (
                <FAQItem key={q} q={q} a={a} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ DISCLAIMER ═══════ */}
      <section className="pb-6">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <Reveal>
            <div className="rounded-2xl border border-gold-400/10 bg-gold-400/[0.02] p-6 flex gap-4">
              <Shield className="w-5 h-5 text-gold-400/60 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-display font-semibold text-gold-400/80 mb-1.5">
                  For Professional Use
                </p>
                <p className="text-xs text-white/35 leading-relaxed">
                  Sidqo is a research aid for legal professionals and is not a substitute for primary source verification. Always verify citations against official UAE legislation before relying on them in filings, client advice, or court submissions. Sidqo does not provide legal advice and is not a law firm.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-0 via-surface-1 to-surface-0" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/[0.04] rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Reveal>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mx-auto mb-8">
              <Scale className="w-8 h-8 text-white" />
            </div>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="font-display text-display-sm sm:text-display-md font-bold text-white mb-6">
              Try it on your next
              <br />
              <span className="gold-text italic">UAE matter.</span>
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="text-lg text-white/40 mb-10 max-w-lg mx-auto">
              No sign-up required. Ask Sidqo any UAE law question and see the depth of coverage for yourself.
            </p>
          </Reveal>
          <Reveal delay={3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/chat"
                className="btn-primary inline-flex items-center gap-3 text-[15px] px-10 py-4 group"
              >
                <MessageSquare className="w-4 h-4" />
                Start Free Research
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/rights"
                className="btn-secondary inline-flex items-center gap-3 text-[15px] px-8 py-4"
              >
                <Briefcase className="w-4 h-4" />
                Browse Legal Areas
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
