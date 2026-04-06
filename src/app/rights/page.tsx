"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Briefcase,
  Home,
  Heart,
  Shield,
  Plane,
  ShoppingCart,
  Globe,
  Scale,
  Sparkles,
  ChevronRight,
  Loader2,
  ArrowRight,
  AlertTriangle,
  Clock,
  Zap,
} from "lucide-react";
import Footer from "@/components/Footer";

/* ── Easing tokens (Emil's philosophy: strong custom curves) ── */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

/* ── Stagger helpers ── */
const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
};

/* ── Data ── */
const rightsCategories = [
  {
    id: "employment",
    icon: Briefcase,
    title: "Employee Rights",
    accent: "amber",
    topics: [
      "Working hours and overtime pay",
      "Annual leave and sick leave entitlements",
      "End of service gratuity calculation",
      "Wrongful termination rights",
      "Salary payment protection",
      "Non-compete clause enforceability",
      "Probation period rules",
      "MOHRE complaint process",
    ],
  },
  {
    id: "tenancy",
    icon: Home,
    title: "Tenant Rights",
    accent: "emerald",
    topics: [
      "Maximum rent increase limits",
      "Eviction notice requirements",
      "Security deposit refund rules",
      "Maintenance responsibilities",
      "Right to renew tenancy contract",
      "RERA rental index rights",
      "Ejari registration requirements",
      "Dispute resolution through RDC",
    ],
  },
  {
    id: "consumer",
    icon: ShoppingCart,
    title: "Consumer Rights",
    accent: "violet",
    topics: [
      "Right to refund and exchange",
      "Product warranty protections",
      "False advertising protections",
      "Online shopping rights",
      "Food safety and labeling rights",
      "Price gouging protections",
      "Consumer complaint channels",
      "Chargeback rights",
    ],
  },
  {
    id: "criminal",
    icon: Shield,
    title: "Rights When Arrested",
    accent: "red",
    topics: [
      "Right to be informed of charges",
      "Right to legal representation",
      "Right to consular notification",
      "Detention time limits",
      "Bail rights and process",
      "Rights during interrogation",
      "Search and seizure rights",
      "Rights in UAE prisons",
    ],
  },
  {
    id: "immigration",
    icon: Plane,
    title: "Expat & Visa Rights",
    accent: "sky",
    topics: [
      "Visa cancellation rights",
      "Grace period after job loss",
      "Golden Visa eligibility",
      "Overstay fine reduction",
      "Travel ban checks and removal",
      "Sponsor change rights",
      "Dependant visa rights",
      "UAE citizenship pathways",
    ],
  },
  {
    id: "family",
    icon: Heart,
    title: "Family Law Rights",
    accent: "pink",
    topics: [
      "Divorce rights for expats",
      "Child custody under UAE law",
      "Alimony entitlements",
      "Inheritance rights",
      "Domestic violence protections",
      "Prenuptial agreement validity",
      "Guardianship rights",
      "Marriage registration requirements",
    ],
  },
];

const accentMap: Record<string, { bg: string; border: string; text: string; dot: string; iconBg: string }> = {
  amber:   { bg: "bg-amber-500/8",   border: "border-amber-500/20",   text: "text-amber-400",   dot: "bg-amber-400",   iconBg: "bg-amber-500/10" },
  emerald: { bg: "bg-emerald-500/8", border: "border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400", iconBg: "bg-emerald-500/10" },
  violet:  { bg: "bg-violet-500/8",  border: "border-violet-500/20",  text: "text-violet-400",  dot: "bg-violet-400",  iconBg: "bg-violet-500/10" },
  red:     { bg: "bg-red-500/8",     border: "border-red-500/20",     text: "text-red-400",     dot: "bg-red-400",     iconBg: "bg-red-500/10" },
  sky:     { bg: "bg-sky-500/8",     border: "border-sky-500/20",     text: "text-sky-400",     dot: "bg-sky-400",     iconBg: "bg-sky-500/10" },
  pink:    { bg: "bg-pink-500/8",    border: "border-pink-500/20",    text: "text-pink-400",    dot: "bg-pink-400",    iconBg: "bg-pink-500/10" },
};

const quickRightsCards = [
  {
    title: "Lost your job",
    icon: Clock,
    points: [
      "90-day grace period to find work or leave",
      "Full gratuity after 1+ year of service",
      "Employer must pay all dues within 14 days",
    ],
    urgency: "normal" as const,
    link: "/chat?q=termination",
  },
  {
    title: "Facing eviction",
    icon: AlertTriangle,
    points: [
      "12-month written notice required",
      "Can contest at Rental Dispute Centre",
      "Can't be evicted mid-tenancy without cause",
    ],
    urgency: "urgent" as const,
    link: "/chat?q=tenant",
  },
  {
    title: "Being arrested",
    icon: Shield,
    points: [
      "Right to remain silent",
      "Must be charged within 48 hours",
      "Right to an attorney immediately",
    ],
    urgency: "critical" as const,
    link: "/chat",
  },
  {
    title: "Salary delayed",
    icon: Zap,
    points: [
      "File MOHRE complaint after 10 days",
      "Employer faces fines and license issues",
      "Can request immediate payment order",
    ],
    urgency: "urgent" as const,
    link: "/chat",
  },
];

const urgencyStyles = {
  normal:   { card: "border-emerald-500/15 hover:border-emerald-500/30", badge: "bg-emerald-500/10 text-emerald-400", label: "Know your options" },
  urgent:   { card: "border-amber-500/15 hover:border-amber-500/30", badge: "bg-amber-500/10 text-amber-400", label: "Act quickly" },
  critical: { card: "border-red-500/15 hover:border-red-500/30", badge: "bg-red-500/10 text-red-400", label: "Urgent" },
};

export default function RightsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const explainRight = async (topic: string, categoryTitle: string) => {
    setSelectedTopic(topic);
    setExplanation("");
    setIsLoading(true);

    // Scroll to panel on mobile
    if (window.innerWidth < 1024 && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Explain my rights regarding "${topic}" under UAE law as part of ${categoryTitle}. Be comprehensive, cite specific UAE laws and articles, explain the process if any action is needed, and provide practical tips. Format with clear sections.`,
          }],
        }),
      });

      if (!res.body) throw new Error("No response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                setExplanation(accumulated);
              }
            } catch {}
          }
        }
      }
    } catch {
      setExplanation("Failed to load explanation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      {/* ── Hero ── */}
      <section className="relative pt-28 pb-14 overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 geo-pattern" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 mb-6">
              <Scale className="w-3.5 h-3.5 text-[var(--gold)]" />
              <span className="text-xs font-medium text-[var(--gold)] tracking-wide uppercase">UAE Legal Rights</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] leading-[1.1] mb-4 tracking-tight">
              Know Your{" "}
              <span className="gold-text">Legal Rights</span>
              <br />in the UAE
            </h1>
            <p className="text-base text-[var(--text-secondary)] leading-relaxed max-w-lg">
              Understand your protections as an employee, tenant, consumer, or resident. Select any topic for a detailed AI-powered explanation with UAE law references.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="divider-gold" />

      {/* ── Quick Situation Cards ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.15 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Common Situations
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">Quick answers for urgent legal questions</p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {quickRightsCards.map((card) => {
            const style = urgencyStyles[card.urgency];
            const Icon = card.icon;
            return (
              <motion.div key={card.title} variants={fadeUp}>
                <Link
                  href={card.link}
                  className={`group block rounded-2xl border bg-[var(--surface-1)] p-5 transition-[border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] ${style.card}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                      <h3 className="font-semibold text-sm text-[var(--text-primary)]">{card.title}</h3>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                      {style.label}
                    </span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {card.points.map((point) => (
                      <li key={point} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <span className="text-xs font-medium text-[var(--gold)] flex items-center gap-1.5 group-hover:gap-2.5 transition-[gap] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]">
                    Ask Sidqo <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── Divider ── */}
      <div className="divider-gold" />

      {/* ── Main Rights Explorer ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Categories sidebar */}
          <div className="lg:col-span-4 xl:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.2 }}
              className="mb-5"
            >
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Browse by Category</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">Select a topic for detailed legal guidance</p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {rightsCategories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                const colors = accentMap[cat.accent];

                return (
                  <motion.div
                    key={cat.id}
                    variants={fadeUp}
                    layout
                    className={`rounded-xl border overflow-hidden transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                      isSelected
                        ? `${colors.bg} ${colors.border}`
                        : "border-white/[0.06] bg-[var(--surface-1)] hover:border-white/[0.12]"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSelectedCategory(isSelected ? null : cat.id);
                        if (isSelected) {
                          setSelectedTopic(null);
                          setExplanation("");
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? colors.iconBg : "bg-white/[0.04]"}`}>
                        <Icon className={`w-4 h-4 ${isSelected ? colors.text : "text-[var(--text-muted)]"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${isSelected ? colors.text : "text-[var(--text-primary)]"}`}>
                          {cat.title}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">{cat.topics.length} topics</div>
                      </div>
                      <motion.div
                        animate={{ rotate: isSelected ? 90 : 0 }}
                        transition={{ duration: 0.2, ease: EASE_OUT }}
                      >
                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: EASE_IN_OUT }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 space-y-0.5">
                            {cat.topics.map((topic, i) => (
                              <motion.button
                                key={topic}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.2,
                                  ease: EASE_OUT,
                                  delay: i * 0.03,
                                }}
                                onClick={() => explainRight(topic, cat.title)}
                                className={`w-full text-left text-[13px] px-3 py-2 rounded-lg transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] ${
                                  selectedTopic === topic
                                    ? `${colors.text} font-medium bg-white/[0.06]`
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]"
                                }`}
                              >
                                <span className={`inline-block w-1 h-1 rounded-full mr-2 align-middle ${
                                  selectedTopic === topic ? colors.dot : "bg-[var(--text-muted)]"
                                }`} />
                                {topic}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Explanation panel */}
          <div ref={panelRef} className="lg:col-span-8 xl:col-span-8">
            <div className="card-surface rounded-2xl min-h-[520px] sticky top-24">
              <AnimatePresence mode="wait">
                {!selectedTopic && !isLoading ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE_OUT }}
                    className="flex flex-col items-center justify-center h-[520px] text-center p-8"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[var(--gold)]/8 border border-[var(--gold)]/15 flex items-center justify-center mb-5">
                      <BookOpen className="w-8 h-8 text-[var(--gold)]/30" />
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm mb-1.5">
                      Select a category and topic
                    </p>
                    <p className="text-[var(--text-muted)] text-xs max-w-sm">
                      Get detailed explanations with UAE law references, practical steps, and real-world examples.
                    </p>

                    <div className="mt-8 flex gap-3">
                      {[
                        { icon: Globe, label: "Federal Law" },
                        { icon: Scale, label: "Emirate Laws" },
                        { icon: Shield, label: "DIFC & ADGM" },
                      ].map(({ icon: I, label }) => (
                        <div
                          key={label}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                        >
                          <I className="w-3.5 h-3.5 text-[var(--gold)]/30" />
                          <span className="text-xs text-[var(--text-muted)]">{label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : isLoading && !explanation ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25, ease: EASE_OUT }}
                    className="flex flex-col items-center justify-center h-[520px] text-center p-8"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center mb-4">
                      <Scale className="w-7 h-7 text-[var(--gold)] animate-pulse" />
                    </div>
                    <p className="text-[var(--gold)] text-sm font-medium mb-1">Researching UAE law...</p>
                    <p className="text-[var(--text-muted)] text-xs max-w-xs">{selectedTopic}</p>
                    <Loader2 className="w-4 h-4 text-[var(--gold)]/40 animate-spin mt-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className="p-6 sm:p-8"
                  >
                    <div className="mb-5 pb-5 border-b border-white/[0.06]">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[#D97706] flex items-center justify-center flex-shrink-0">
                          <Scale className="w-4 h-4 text-[var(--surface-0)]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--text-primary)] text-base leading-tight">
                            {selectedTopic}
                          </h3>
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            UAE Legal Rights Explanation by Sidqo
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="prose-legal text-sm">
                      <ReactMarkdown>{explanation}</ReactMarkdown>
                      {isLoading && (
                        <span className="inline-block w-0.5 h-4 bg-[var(--gold)] ml-0.5 animate-pulse align-middle" />
                      )}
                    </div>

                    <AnimatePresence>
                      {explanation && !isLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.1 }}
                          className="mt-6 pt-5 border-t border-white/[0.06] flex flex-wrap gap-3"
                        >
                          <Link
                            href="/chat"
                            className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/25 text-[var(--gold)] hover:bg-[var(--gold)]/15 transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
                          >
                            <Sparkles className="w-4 h-4" />
                            Ask follow-up questions
                          </Link>
                          <Link
                            href="/cases"
                            className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
                          >
                            Build a case strategy
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
