"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import {
  Briefcase,
  AlertTriangle,
  Loader2,
  Sparkles,
  ChevronRight,
  Scale,
  Copy,
  Check,
  Download,
  MapPin,
  Clock,
  AlertCircle,
} from "lucide-react";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import UpgradeModal from "@/components/UpgradeModal";
import { FREE_CASE_LIMIT, hasReachedLimit, incrementCount } from "@/hooks/useMessageQuota";

const caseTypes = [
  { id: "employment", label: "Employment Dispute", icon: "👔" },
  { id: "tenancy", label: "Tenancy / Real Estate", icon: "🏠" },
  { id: "business", label: "Business / Commercial", icon: "🏢" },
  { id: "criminal", label: "Criminal Matter", icon: "⚖️" },
  { id: "family", label: "Family / Personal Status", icon: "👨‍👩‍👧" },
  { id: "debt", label: "Debt / Financial", icon: "💰" },
  { id: "immigration", label: "Immigration / Visa", icon: "✈️" },
  { id: "consumer", label: "Consumer Rights", icon: "🛒" },
  { id: "cyber", label: "Cyber Crime / Online", icon: "💻" },
  { id: "injury", label: "Personal Injury", icon: "🏥" },
  { id: "contract", label: "Contract Dispute", icon: "📋" },
  { id: "other", label: "Other Legal Matter", icon: "📜" },
];

const emirates = [
  "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain",
  "DIFC (Dubai)", "ADGM (Abu Dhabi)", "Free Zone (specify)", "UAE General / Federal",
];

const urgencyLevels = [
  { id: "critical", label: "Critical (24-48 hours)", color: "text-red-400 border-red-500/30 bg-red-500/10" },
  { id: "urgent", label: "Urgent (1 week)", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { id: "normal", label: "Normal (1 month)", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { id: "planning", label: "Planning Ahead", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
];

export default function CasesPage() {
  const { data: session } = useSession();
  const [caseType, setCaseType] = useState("");
  const [emirate, setEmirate] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [situation, setSituation] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [strategy, setStrategy] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const generateStrategy = async () => {
    if (!caseType || !situation.trim()) {
      setError("Please select a case type and describe your situation.");
      return;
    }
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    if (
      session.user?.subscriptionStatus !== "active" &&
      session.user?.email &&
      hasReachedLimit("case", session.user.email, FREE_CASE_LIMIT)
    ) {
      setShowUpgradeModal(true);
      return;
    }
    if (session.user?.subscriptionStatus !== "active" && session.user?.email) {
      incrementCount("case", session.user.email);
    }
    setError("");
    setIsGenerating(true);
    setStrategy("");

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseType, situation, emirate, urgency, additionalContext }),
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
                setStrategy(accumulated);
              }
            } catch {}
          }
        }
      }
    } catch {
      setError("Failed to generate strategy. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyStrategy = async () => {
    await navigator.clipboard.writeText(strategy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadStrategy = () => {
    const blob = new Blob([strategy], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sidqo-case-strategy-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedUrgency = urgencyLevels.find((u) => u.id === urgency);

  return (
    <div className="min-h-screen bg-navy-800">
      {/* Hero */}
      <section className="relative pt-28 pb-12 border-b border-gold-400/10">
        <div className="absolute inset-0 mesh-bg pattern-overlay" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/20 mb-5">
              <Briefcase className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-gold-400 font-medium">AI Case Strategy Builder</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-warm-white mb-4">
              Build a Complete
              <span className="gold-text"> Legal Strategy</span>
            </h1>
            <p className="text-lg text-warm-white/60 leading-relaxed">
              Describe your legal situation and get a comprehensive case strategy — evidence checklist, legal arguments, step-by-step action plan, timelines, and cost estimates.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case type */}
            <div>
              <h3 className="text-sm font-semibold text-warm-white/80 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gold-400/20 text-gold-400 text-xs font-bold flex items-center justify-center">1</span>
                Case Type
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {caseTypes.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => setCaseType(ct.id)}
                    className={`glass rounded-xl p-3 text-left transition-all flex items-center gap-2 ${
                      caseType === ct.id
                        ? "border-gold-400/60 bg-gold-400/10"
                        : "border-gold-400/10 hover:border-gold-400/30"
                    }`}
                  >
                    <span className="text-lg">{ct.icon}</span>
                    <span className={`text-xs font-medium ${caseType === ct.id ? "text-gold-400" : "text-warm-white/70"}`}>
                      {ct.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Emirate */}
            <div>
              <h3 className="text-sm font-semibold text-warm-white/80 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gold-400/20 text-gold-400 text-xs font-bold flex items-center justify-center">2</span>
                <MapPin className="w-3.5 h-3.5 text-gold-400/60" />
                Emirate / Jurisdiction
              </h3>
              <select
                value={emirate}
                onChange={(e) => setEmirate(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-warm-white/80 focus:outline-none focus:border-gold-400/50 transition-all bg-transparent"
              >
                <option value="" className="bg-navy-700">Select emirate...</option>
                {emirates.map((e) => (
                  <option key={e} value={e} className="bg-navy-700">{e}</option>
                ))}
              </select>
            </div>

            {/* Urgency */}
            <div>
              <h3 className="text-sm font-semibold text-warm-white/80 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gold-400/20 text-gold-400 text-xs font-bold flex items-center justify-center">3</span>
                <Clock className="w-3.5 h-3.5 text-gold-400/60" />
                Urgency Level
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {urgencyLevels.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setUrgency(u.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all ${
                      urgency === u.id ? u.color : "border-white/10 text-warm-white/40 hover:border-white/20"
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Situation */}
            <div>
              <h3 className="text-sm font-semibold text-warm-white/80 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gold-400/20 text-gold-400 text-xs font-bold flex items-center justify-center">4</span>
                Describe Your Situation
                <span className="text-red-400">*</span>
              </h3>
              <textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="Describe what happened in detail: the events, parties involved, timeline, amounts, any communications, and what outcome you're seeking..."
                rows={7}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-warm-white/90 placeholder-warm-white/25 focus:outline-none focus:border-gold-400/50 transition-all resize-none"
              />
              <div className="text-xs text-warm-white/25 mt-1 text-right">{situation.length} chars · More detail = better strategy</div>
            </div>

            {/* Additional context */}
            <div>
              <label className="text-sm text-warm-white/60 mb-1.5 block">
                Any evidence or documents you have? (optional)
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="e.g., I have employment contract, salary slips, WhatsApp messages, emails..."
                rows={3}
                className="w-full glass rounded-xl px-4 py-3 text-sm text-warm-white/90 placeholder-warm-white/25 focus:outline-none focus:border-gold-400/50 transition-all resize-none"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            {urgency === "critical" && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">
                  Critical urgency detected. The strategy will prioritize immediate actions and urgent deadlines. Consider calling a licensed UAE attorney immediately.
                </p>
              </div>
            )}

            <button
              onClick={generateStrategy}
              disabled={isGenerating || !caseType || !situation.trim()}
              className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Building Your Strategy...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Case Strategy
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Right: Strategy output */}
          <div className="lg:col-span-3">
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-warm-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-gold-400" />
                  Your Legal Strategy
                  {strategy && !isGenerating && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Ready
                    </span>
                  )}
                </h2>
                {strategy && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyStrategy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-warm-white/60 hover:text-warm-white transition-all"
                    >
                      {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                    <button
                      onClick={downloadStrategy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-400/15 hover:bg-gold-400/25 border border-gold-400/30 text-sm text-gold-400 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                )}
              </div>

              <div className="glass rounded-2xl min-h-[600px] max-h-[780px] overflow-y-auto">
                {!strategy && !isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                    <div className="w-20 h-20 rounded-3xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mb-5">
                      <Briefcase className="w-10 h-10 text-gold-400/40" />
                    </div>
                    <p className="text-warm-white/30 text-sm mb-3">Your comprehensive case strategy will appear here</p>
                    <div className="grid grid-cols-2 gap-2 max-w-xs">
                      {["Legal Assessment", "Evidence Checklist", "Action Plan", "Timeline & Deadlines"].map((item) => (
                        <div key={item} className="text-xs px-3 py-2 rounded-lg bg-gold-400/5 border border-gold-400/10 text-warm-white/30 text-center">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : isGenerating && !strategy ? (
                  <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                    <div className="w-20 h-20 rounded-3xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mb-5">
                      <Scale className="w-10 h-10 text-gold-400 animate-pulse" />
                    </div>
                    <p className="text-gold-400 font-medium mb-2">Analyzing your case...</p>
                    <p className="text-warm-white/30 text-sm mb-4">Reviewing UAE laws and building your strategy</p>
                    <div className="space-y-2 w-full max-w-xs">
                      {["Identifying applicable UAE laws...", "Assessing case strength...", "Building evidence checklist...", "Creating action plan..."].map((item, i) => (
                        <div
                          key={item}
                          className="text-xs text-warm-white/30 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3"
                          style={{ animationDelay: `${i * 0.5}s` }}
                        >
                          <Loader2 className="w-3 h-3 text-gold-400/50 animate-spin" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="prose-legal text-sm">
                      <ReactMarkdown>{strategy}</ReactMarkdown>
                      {isGenerating && (
                        <span className="inline-block w-0.5 h-4 bg-gold-400 ml-0.5 animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {strategy && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-gold-400/5 border border-gold-400/15">
                  <Scale className="w-4 h-4 text-gold-400/60 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-warm-white/40">
                    This strategy is based on your description and UAE law. Facts, deadlines, and legal strategies should be verified with a licensed UAE attorney before taking action.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <LoginModal isOpen={showLoginModal} />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
