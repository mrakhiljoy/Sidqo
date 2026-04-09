import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Calculator,
  CheckCircle2,
  FileText,
  Globe2,
  Shield,
} from "lucide-react";
import Footer from "@/components/Footer";
import GratuityCalculator from "./GratuityCalculator";
import { gratuityFaqs } from "./content";

export const metadata: Metadata = {
  title: "UAE Gratuity Calculator 2026 | Estimate End of Service Pay | Sidqo",
  description:
    "Use Sidqo's UAE gratuity calculator to estimate end-of-service pay under the current private-sector formula. Check your gratuity using your last basic salary, dates of service and unpaid leave.",
  keywords: [
    "UAE gratuity calculator 2026",
    "end of service gratuity UAE",
    "UAE labour law gratuity calculator",
    "MOHRE gratuity estimate",
    "Dubai gratuity calculator",
    "Abu Dhabi gratuity calculator",
  ],
  openGraph: {
    description:
      "Calculate your UAE end-of-service gratuity using the standard private-sector formula and get next-step help if your employer does not pay.",
    title: "UAE Gratuity Calculator 2026 | Sidqo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    description:
      "Estimate your UAE gratuity in seconds using your last basic salary, service dates and unpaid leave.",
    title: "UAE Gratuity Calculator 2026 | Sidqo",
  },
};

const highlightCards = [
  {
    description:
      "Built around the standard Article 51 private-sector formula, not vague salary calculators.",
    icon: Briefcase,
    title: "Made for UAE labour cases",
  },
  {
    description:
      "Uses your basic salary only and lets you exclude unpaid leave days before estimating service.",
    icon: Calculator,
    title: "Practical and settlement-focused",
  },
  {
    description:
      "Every visitor is one step away from a final settlement, complaint or legal question.",
    icon: Shield,
    title: "High-intent by design",
  },
];

const formulaCards = [
  {
    eyebrow: "Rule 1",
    text: "Less than 1 year of continuous service: no gratuity under the standard Article 51 formula.",
    title: "1-year threshold",
  },
  {
    eyebrow: "Rule 2",
    text: "More than 1 year and up to 5 years: 21 days of basic salary for each year of service.",
    title: "First 5 years",
  },
  {
    eyebrow: "Rule 3",
    text: "After 5 years: 30 days of basic salary for each additional year, with proportional entitlement for fractions.",
    title: "After 5 years",
  },
  {
    eyebrow: "Rule 4",
    text: "Days of unpaid absence are excluded, and total gratuity cannot exceed two years of wage.",
    title: "Important limits",
  },
];

const toolJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  applicationCategory: "BusinessApplication",
  description:
    "A free calculator for estimating UAE end-of-service gratuity under the private-sector formula using basic salary, service dates and unpaid leave days.",
  featureList: [
    "End-of-service gratuity estimate",
    "Basic salary-only calculation",
    "Unpaid leave exclusion",
    "Statutory cap breakdown",
  ],
  isAccessibleForFree: true,
  name: "UAE Gratuity Calculator 2026",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "AED",
  },
  operatingSystem: "Web",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: gratuityFaqs.map((faq) => ({
    "@type": "Question",
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
    name: faq.question,
  })),
};

export default function UAEGratuityCalculatorPage() {
  return (
    <div className="min-h-screen bg-surface-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="relative overflow-hidden border-b border-white/[0.05] hero-gradient">
        <div className="absolute inset-0 geo-pattern opacity-30" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-24 left-[12%] w-[380px] h-[380px] rounded-full bg-gold-400/[0.08] blur-[110px]" />
          <div className="absolute bottom-0 right-[10%] w-[360px] h-[360px] rounded-full bg-teal-500/[0.08] blur-[110px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-18 sm:pt-32 sm:pb-24">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/15 text-sm text-gold-400">
                <Calculator className="w-4 h-4" />
                UAE Gratuity Calculator 2026
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-white/55">
                Private-sector estimate
              </span>
            </div>

            <h1 className="font-display text-display-sm sm:text-display-lg font-bold text-white leading-[1.05] mb-6">
              Calculate your end-of-service gratuity
              <span className="gold-text"> before you leave the job.</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/45 leading-relaxed max-w-2xl mb-10">
              This free UAE gratuity calculator helps mainland and MoHRE-regulated
              private-sector employees estimate their final gratuity using the
              standard Article 51 formula based on basic salary, service length and
              unpaid leave.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="#calculator"
                className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
              >
                Start calculating
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/chat?q=gratuity"
                className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
              >
                Ask Sidqo to review your case
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="calculator" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_360px] gap-8 items-start">
            <GratuityCalculator />

            <div className="space-y-5">
              <div className="card-surface p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-gold-400/80 font-display font-semibold mb-4">
                  Before you rely on the number
                </p>
                <div className="space-y-4">
                  {highlightCards.map(({ description, icon: Icon, title }) => (
                    <div key={title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="w-10 h-10 rounded-2xl bg-gold-400/10 border border-gold-400/10 flex items-center justify-center mb-3">
                        <Icon className="w-4 h-4 text-gold-400" />
                      </div>
                      <p className="font-display font-semibold text-white mb-1.5">
                        {title}
                      </p>
                      <p className="text-sm text-white/45 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-surface p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Globe2 className="w-5 h-5 text-teal-400 mt-0.5" />
                  <div>
                    <p className="font-display font-semibold text-white mb-1.5">
                      What this tool does not cover
                    </p>
                    <p className="text-sm text-white/45 leading-relaxed">
                      DIFC and ADGM employment, domestic workers, Emirati pension
                      schemes, and cases where your employer moved you into the
                      alternative end-of-service Savings Scheme.
                    </p>
                  </div>
                </div>
                <Link
                  href="/chat?q=gratuity"
                  className="inline-flex items-center gap-2 text-sm text-gold-400 hover:text-gold-300 transition-colors"
                >
                  Need a tailored answer instead?
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="card-surface p-6">
                <p className="font-display font-semibold text-white mb-3">
                  Employer not paying your dues?
                </p>
                <p className="text-sm text-white/45 leading-relaxed mb-5">
                  Use the estimate here, then ask Sidqo to draft a salary demand or
                  MOHRE complaint based on your facts.
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/chat?q=salary-delay"
                    className="btn-teal inline-flex items-center justify-center gap-2 text-sm"
                  >
                    Check complaint options
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/documents"
                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                  >
                    Generate a legal document
                    <FileText className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 border-t border-white/[0.05] section-gradient">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs uppercase tracking-[0.18em] text-gold-400/80 font-display font-semibold mb-4">
              Formula
            </p>
            <h2 className="font-display text-display-sm font-bold text-white mb-4">
              How the UAE gratuity formula works
            </h2>
            <p className="text-lg text-white/45 leading-relaxed">
              The official private-sector guidance is straightforward: basic salary
              only, gratuity after one year, a higher accrual rate after five years,
              and a hard cap at two years of wage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {formulaCards.map(({ eyebrow, text, title }) => (
              <div key={title} className="card-surface p-6">
                <p className="text-xs uppercase tracking-[0.16em] text-gold-400/80 font-display font-semibold mb-3">
                  {eyebrow}
                </p>
                <p className="font-display text-xl font-semibold text-white mb-3">
                  {title}
                </p>
                <p className="text-sm text-white/45 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-6 sm:p-7">
            <p className="text-sm text-white/60 leading-relaxed">
              Sidqo built this page around the current government guidance for
              Article 51 of Federal Decree-Law No. 33 of 2021 and the implementing
              rules referred to on the UAE Government portal. Treat the result as a
              practical estimate, then get your documents and complaint strategy in
              place if your employer disputes the number.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs uppercase tracking-[0.18em] text-gold-400/80 font-display font-semibold mb-4">
              FAQ
            </p>
            <h2 className="font-display text-display-sm font-bold text-white mb-4">
              Common gratuity questions
            </h2>
            <p className="text-lg text-white/45 leading-relaxed">
              These are the questions most employees have right before resignation,
              termination or a disputed final settlement.
            </p>
          </div>

          <div className="space-y-4">
            {gratuityFaqs.map((faq) => (
              <details
                key={faq.question}
                className="group card-surface p-6 open:border-gold-400/15"
              >
                <summary className="list-none cursor-pointer flex items-start justify-between gap-4">
                  <span className="font-display text-lg font-semibold text-white">
                    {faq.question}
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-gold-400/70 flex-shrink-0 transition-transform group-open:rotate-12" />
                </summary>
                <p className="text-sm text-white/45 leading-relaxed mt-4 pr-4">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="rounded-[32px] border border-gold-400/12 bg-gradient-to-br from-gold-400/[0.08] via-white/[0.03] to-teal-500/[0.05] p-8 sm:p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gold-400 text-surface-0 flex items-center justify-center mx-auto mb-6">
              <Calculator className="w-7 h-7" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Leaving a job is stressful enough.
              <span className="gold-text"> The math should not be.</span>
            </h2>
            <p className="text-lg text-white/45 leading-relaxed max-w-2xl mx-auto mb-8">
              Use the calculator, then let Sidqo help you review the settlement,
              draft a complaint, or understand what to do next in English, Arabic
              or Hindi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="#calculator"
                className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
              >
                Recalculate gratuity
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/chat?q=gratuity"
                className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
              >
                Talk to Sidqo now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
