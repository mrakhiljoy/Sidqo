"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  Briefcase,
  Home,
  Heart,
  Shield,
  Plane,
  DollarSign,
  ShoppingCart,
  Globe,
  Scale,
  Sparkles,
  ChevronRight,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Footer from "@/components/Footer";

const rightsCategories = [
  {
    id: "employment",
    icon: Briefcase,
    emoji: "👔",
    title: "Employee Rights",
    color: "from-blue-500/15 to-blue-600/5",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
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
    emoji: "🏠",
    title: "Tenant Rights",
    color: "from-emerald-500/15 to-emerald-600/5",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
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
    emoji: "🛒",
    title: "Consumer Rights",
    color: "from-purple-500/15 to-purple-600/5",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
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
    emoji: "⚖️",
    title: "Rights When Arrested",
    color: "from-red-500/15 to-red-600/5",
    border: "border-red-500/20",
    iconColor: "text-red-400",
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
    emoji: "✈️",
    title: "Expat & Visa Rights",
    color: "from-sky-500/15 to-sky-600/5",
    border: "border-sky-500/20",
    iconColor: "text-sky-400",
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
    emoji: "👨‍👩‍👧",
    title: "Family Law Rights",
    color: "from-pink-500/15 to-pink-600/5",
    border: "border-pink-500/20",
    iconColor: "text-pink-400",
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

const quickRightsCards = [
  {
    title: "If you lose your job",
    points: ["90-day grace period to find work or leave", "Full gratuity after 1+ year", "MOHRE complaint within 1 year", "Employer must pay all dues within 14 days"],
    urgency: "normal",
    link: "/chat?q=termination",
  },
  {
    title: "If your landlord wants to evict",
    points: ["12-month notice required for personal use", "Must register via notary or court", "Can contest at Rental Dispute Centre", "Can't be evicted mid-tenancy without cause"],
    urgency: "urgent",
    link: "/chat?q=tenant",
  },
  {
    title: "If you're arrested",
    points: ["You have the right to remain silent", "Request your embassy be notified", "You must be charged within 48 hours", "Right to an attorney immediately"],
    urgency: "critical",
    link: "/chat",
  },
  {
    title: "If your salary is delayed",
    points: ["Wage Protection System (WPS) rights", "File MOHRE complaint after 10 days", "Employer faces fines and license issues", "Can request immediate payment order"],
    urgency: "urgent",
    link: "/chat",
  },
];

export default function RightsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const explainRight = async (topic: string, categoryTitle: string) => {
    setSelectedTopic(topic);
    setExplanation("");
    setIsLoading(true);

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

  const urgencyColors = {
    normal: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    urgent: "border-amber-500/20 bg-amber-500/5 text-amber-400",
    critical: "border-red-500/20 bg-red-500/5 text-red-400",
  };

  return (
    <div className="min-h-screen bg-navy-800">
      {/* Hero */}
      <section className="relative pt-28 pb-12 border-b border-gold-400/10">
        <div className="absolute inset-0 mesh-bg pattern-overlay" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/20 mb-5">
              <BookOpen className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-gold-400 font-medium">UAE Legal Rights Guide</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-warm-white mb-4">
              Know Your
              <span className="gold-text"> Legal Rights</span>
              <br />in the UAE
            </h1>
            <p className="text-lg text-warm-white/60 leading-relaxed">
              Understand your rights as an employee, tenant, consumer, resident, or visitor in the UAE. Click any topic to get a detailed explanation powered by UAE law.
            </p>
          </div>
        </div>
      </section>

      {/* Quick rights cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-gold-400/10">
        <h2 className="text-xl font-semibold text-warm-white mb-5">
          Common Situations — Know What to Do
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickRightsCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-xl border p-5 ${urgencyColors[card.urgency as keyof typeof urgencyColors]}`}
            >
              <h3 className="font-semibold text-sm mb-3">{card.title}</h3>
              <ul className="space-y-1.5 mb-4">
                {card.points.map((point) => (
                  <li key={point} className="text-xs text-warm-white/60 flex items-start gap-1.5">
                    <span className="mt-0.5 w-1 h-1 rounded-full bg-current flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href={card.link}
                className="text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                Ask Sidqo <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Main rights explorer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-warm-white mb-4">
              Browse by Category
            </h2>
            {rightsCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? `bg-gradient-to-br ${cat.color} ${cat.border}`
                      : "glass border-gold-400/10 hover:border-gold-400/30"
                  }`}
                >
                  <button
                    onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center ${cat.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${isSelected ? cat.iconColor : "text-warm-white"}`}>
                        {cat.title}
                      </div>
                      <div className="text-xs text-warm-white/40">{cat.topics.length} topics</div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-warm-white/30 transition-transform ${isSelected ? "rotate-90" : ""}`}
                    />
                  </button>

                  {isSelected && (
                    <div className="px-4 pb-3 space-y-1">
                      {cat.topics.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => explainRight(topic, cat.title)}
                          className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all ${
                            selectedTopic === topic
                              ? `${cat.iconColor} font-medium bg-white/5`
                              : "text-warm-white/50 hover:text-warm-white/80 hover:bg-white/5"
                          }`}
                        >
                          <span className="mr-1.5 text-warm-white/20">→</span>
                          {topic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation panel */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl min-h-[500px]">
              {!selectedTopic && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                  <div className="w-20 h-20 rounded-3xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mb-5">
                    <BookOpen className="w-10 h-10 text-gold-400/40" />
                  </div>
                  <p className="text-warm-white/30 text-sm mb-2">Select a category and topic to learn about your rights</p>
                  <p className="text-warm-white/20 text-xs max-w-xs">
                    Each topic provides a detailed explanation with UAE law references, practical steps, and examples.
                  </p>

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {[
                      { icon: Globe, label: "UAE Federal Law" },
                      { icon: Scale, label: "Emirate Laws" },
                      { icon: Shield, label: "DIFC & ADGM" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/3 border border-white/5">
                        <Icon className="w-4 h-4 text-gold-400/40" />
                        <span className="text-xs text-warm-white/25">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : isLoading && !explanation ? (
                <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mb-4">
                    <Scale className="w-8 h-8 text-gold-400 animate-pulse" />
                  </div>
                  <p className="text-gold-400 text-sm font-medium mb-1">Researching UAE law...</p>
                  <p className="text-warm-white/30 text-xs">{selectedTopic}</p>
                  <Loader2 className="w-5 h-5 text-gold-400/40 animate-spin mt-4" />
                </div>
              ) : (
                <div className="p-6">
                  <div className="mb-4 pb-4 border-b border-gold-400/10">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0">
                        <Scale className="w-4 h-4 text-navy-900" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-warm-white text-base">{selectedTopic}</h3>
                        <p className="text-xs text-warm-white/40 mt-0.5">UAE Legal Rights Explanation by Sidqo</p>
                      </div>
                    </div>
                  </div>
                  <div className="prose-legal text-sm">
                    <ReactMarkdown>{explanation}</ReactMarkdown>
                    {isLoading && (
                      <span className="inline-block w-0.5 h-4 bg-gold-400 ml-0.5 animate-pulse align-middle" />
                    )}
                  </div>
                  {explanation && !isLoading && (
                    <div className="mt-5 pt-4 border-t border-gold-400/10 flex flex-wrap gap-3">
                      <Link
                        href="/chat"
                        className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gold-400/15 border border-gold-400/30 text-gold-400 hover:bg-gold-400/25 transition-all"
                      >
                        <Sparkles className="w-4 h-4" />
                        Ask follow-up questions
                      </Link>
                      <Link
                        href="/cases"
                        className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-warm-white/60 hover:text-warm-white hover:bg-white/10 transition-all"
                      >
                        Build a case strategy
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
