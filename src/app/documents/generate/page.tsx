"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import {
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  Scale,
  AlertCircle,
  Loader2,
  Mail,
  ClipboardList,
  FileCheck,
  Gavel,
  Handshake,
  Landmark,
  Ban,
  KeyRound,
  ChevronDown,
} from "lucide-react";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import UpgradeModal from "@/components/UpgradeModal";
import { trackEvent } from "@/components/PostHogProvider";
import {
  FREE_DOC_LIMIT,
  hasReachedLimit,
  incrementCount,
} from "@/hooks/useMessageQuota";

/* ─── Document Types ─────────────────────────────── */
const documentTypes = [
  {
    id: "demand-letter",
    icon: Mail,
    title: "Legal Demand Letter",
    desc: "Formal demand for payment, action, or cessation of activity",
    examples: ["Salary demand", "Rent refund", "Debt recovery"],
  },
  {
    id: "legal-memo",
    icon: ClipboardList,
    title: "Legal Memorandum",
    desc: "Detailed legal analysis memo for court or negotiation",
    examples: ["Case analysis", "Rights summary", "Legal opinion"],
  },
  {
    id: "noc",
    icon: FileCheck,
    title: "No Objection Certificate",
    desc: "Official NOC letter for various purposes in UAE",
    examples: ["Visa NOC", "Employment NOC", "Bank NOC"],
  },
  {
    id: "complaint",
    icon: Gavel,
    title: "Official Complaint",
    desc: "Formal complaint to regulatory bodies like MOHRE, RERA, police",
    examples: ["Labour complaint", "Tenancy complaint", "Police report"],
  },
  {
    id: "contract",
    icon: Handshake,
    title: "Contract / Agreement",
    desc: "Professional contracts following UAE legal standards",
    examples: ["Service agreement", "Employment contract", "Sale agreement"],
  },
  {
    id: "affidavit",
    icon: Landmark,
    title: "Affidavit / Declaration",
    desc: "Sworn statements and statutory declarations",
    examples: [
      "Witness statement",
      "Declaration of facts",
      "Statutory declaration",
    ],
  },
  {
    id: "termination",
    icon: Ban,
    title: "Termination Letter",
    desc: "Employment or contract termination with UAE legal compliance",
    examples: [
      "Employee termination",
      "Contract termination",
      "Lease termination",
    ],
  },
  {
    id: "power-of-attorney",
    icon: KeyRound,
    title: "Power of Attorney",
    desc: "UAE-compliant POA for legal representation",
    examples: ["General POA", "Special POA", "Property POA"],
  },
];

/* ─── Step Label ─────────────────────────────────── */
function StepLabel({
  number,
  title,
  required,
}: {
  number: string;
  title: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 rounded-lg bg-gold-400/15 border border-gold-400/20 flex items-center justify-center">
        <span className="text-xs font-bold text-gold-400 font-display">
          {number}
        </span>
      </div>
      <h2 className="text-base font-display font-semibold text-white">
        {title}
        {required && <span className="text-red-400 ml-1">*</span>}
      </h2>
    </div>
  );
}

/* ─── Page Component ─────────────────────────────── */
export default function GenerateDocumentPage() {
  const { data: session } = useSession();
  const [selectedType, setSelectedType] = useState("");
  const [party1, setParty1] = useState("");
  const [party2, setParty2] = useState("");
  const [details, setDetails] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);
  const docPanelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll doc panel as content streams in
  useEffect(() => {
    if (isGenerating && docPanelRef.current) {
      docPanelRef.current.scrollTop = docPanelRef.current.scrollHeight;
    }
  }, [generatedDoc, isGenerating]);

  const generateDocument = async () => {
    if (!selectedType || !details.trim()) {
      setError("Please select a document type and provide details.");
      return;
    }
    if (!session) {
      setShowLoginModal(true);
      trackEvent("login_modal_shown", { trigger: "documents" });
      return;
    }
    if (
      session.user?.subscriptionStatus !== "active" &&
      session.user?.email &&
      hasReachedLimit("doc", session.user.email, FREE_DOC_LIMIT)
    ) {
      setShowUpgradeModal(true);
      trackEvent("upgrade_modal_shown", { trigger: "documents" });
      return;
    }
    if (session.user?.subscriptionStatus !== "active" && session.user?.email) {
      incrementCount("doc", session.user.email);
    }
    trackEvent("document_generated", {
      document_type: selectedType,
      subscription_status: session.user?.subscriptionStatus || "free",
    });
    setError("");
    setIsGenerating(true);
    setGeneratedDoc("");

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: documentTypes.find((d) => d.id === selectedType)?.title,
          details,
          party1,
          party2,
          additionalInfo,
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
                setGeneratedDoc(accumulated);
              }
            } catch {}
          }
        }
      }
    } catch {
      setError(
        "Failed to generate document. Please check your API key and try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const copyDocument = async () => {
    await navigator.clipboard.writeText(generatedDoc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadDocument = () => {
    const blob = new Blob([generatedDoc], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const docTitle =
      documentTypes.find((d) => d.id === selectedType)?.title ||
      "legal-document";
    a.download = `sidqo-${docTitle.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedDocType = documentTypes.find((d) => d.id === selectedType);

  const inputClasses =
    "w-full rounded-xl px-4 py-3 text-sm text-white/90 placeholder-white/25 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-gold-400/50 focus:bg-white/[0.06] transition-all duration-200";

  return (
    <div className="min-h-screen bg-surface-0">
      {/* ─── Hero ─────────────────────────────────────── */}
      <section className="relative pt-28 pb-10 overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 geo-pattern opacity-30" />
        <div className="absolute top-10 right-[15%] w-[400px] h-[400px] bg-gold-400/[0.04] rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/20 mb-5">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-gold-400 font-medium">
                AI Document Generator
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4 leading-tight">
              Generate Professional{" "}
              <span className="gold-text">UAE Legal Documents</span>
            </h1>
            <p className="text-lg text-white/45 leading-relaxed max-w-xl">
              Create legally sound documents following UAE standards instantly.
              Demand letters, contracts, NOCs, affidavits, and more — ready in
              seconds.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Main Content ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ─── Left: Form ─────────────────────────────── */}
          <div className="lg:col-span-5 space-y-8">
            {/* Document type selection */}
            <div>
              <StepLabel number="1" title="Select Document Type" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {documentTypes.map((doc) => {
                  const isSelected = selectedType === doc.id;
                  const Icon = doc.icon;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedType(doc.id)}
                      className={`group relative rounded-xl p-3.5 text-left transition-all duration-200 cursor-pointer border ${
                        isSelected
                          ? "bg-gold-400/[0.08] border-gold-400/30"
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                            isSelected
                              ? "bg-gold-400/20"
                              : "bg-white/[0.06] group-hover:bg-white/[0.08]"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 transition-colors duration-200 ${
                              isSelected
                                ? "text-gold-400"
                                : "text-white/40 group-hover:text-white/60"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm font-medium leading-tight transition-colors duration-200 ${
                              isSelected ? "text-gold-400" : "text-white/80"
                            }`}
                          >
                            {doc.title}
                          </div>
                          <div className="text-[11px] text-white/30 mt-0.5 leading-snug line-clamp-1">
                            {doc.desc}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-gold-400/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-gold-400" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Party details */}
            <div>
              <StepLabel number="2" title="Party Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">
                    Party 1 / Your Name
                  </label>
                  <input
                    type="text"
                    value={party1}
                    onChange={(e) => setParty1(e.target.value)}
                    placeholder="e.g., Ahmed Mohammed Al-Rashidi"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block font-medium">
                    Party 2 / Other Party
                  </label>
                  <input
                    type="text"
                    value={party2}
                    onChange={(e) => setParty2(e.target.value)}
                    placeholder="e.g., ABC Company LLC"
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>

            {/* Main details */}
            <div>
              <StepLabel number="3" title="Document Details" required />

              {/* Example chips */}
              {selectedDocType && (
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-white/25 mr-0.5">
                    Suggestions:
                  </span>
                  {selectedDocType.examples.map((ex) => (
                    <button
                      key={ex}
                      onClick={() =>
                        setDetails((prev) => (prev ? `${prev}, ${ex}` : ex))
                      }
                      className="text-[11px] px-2.5 py-1 rounded-full bg-gold-400/[0.07] border border-gold-400/15 text-gold-400/60 hover:text-gold-400 hover:border-gold-400/30 transition-all duration-200 cursor-pointer"
                    >
                      + {ex}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe the situation, key facts, amounts involved, dates, and what you need the document to accomplish..."
                rows={5}
                className={`${inputClasses} resize-none`}
              />
            </div>

            {/* Additional info — collapsible */}
            <div>
              <button
                onClick={() => setShowAdditional(!showAdditional)}
                className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors cursor-pointer mb-3"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showAdditional ? "rotate-180" : ""
                  }`}
                />
                Additional Requirements (optional)
              </button>
              {showAdditional && (
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Any specific clauses, legal references, or formatting requirements..."
                  rows={3}
                  className={`${inputClasses} resize-none`}
                />
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={generateDocument}
              disabled={isGenerating || !selectedType || !details.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2.5 py-4 text-[15px] !rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Document...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Legal Document
                </>
              )}
            </button>
          </div>

          {/* ─── Right: Generated Document ───────────── */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-20">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gold-400/15 border border-gold-400/20 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-gold-400" />
                  </div>
                  <h2 className="text-base font-display font-semibold text-white">
                    Generated Document
                  </h2>
                </div>
                {generatedDoc && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyDocument}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-xs text-white/50 hover:text-white transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />{" "}
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={downloadDocument}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-400/10 border border-gold-400/20 hover:bg-gold-400/20 text-xs text-gold-400 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                )}
              </div>

              {/* Document panel */}
              <div
                ref={docPanelRef}
                className="card-surface !rounded-2xl min-h-[520px] max-h-[700px] overflow-y-auto"
              >
                {!generatedDoc && !isGenerating ? (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center h-[520px] text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
                      <FileText className="w-7 h-7 text-white/15" />
                    </div>
                    <p className="text-white/25 text-sm font-medium mb-1">
                      Your document will appear here
                    </p>
                    <p className="text-white/15 text-xs max-w-xs">
                      Select a document type, fill in the details, and click
                      generate
                    </p>
                  </div>
                ) : isGenerating && !generatedDoc ? (
                  /* Loading state */
                  <div className="flex flex-col items-center justify-center h-[520px] text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gold-400/[0.08] border border-gold-400/15 flex items-center justify-center mb-5">
                      <Scale className="w-7 h-7 text-gold-400 animate-pulse" />
                    </div>
                    <p className="text-gold-400 text-sm font-display font-medium mb-1">
                      Drafting your legal document...
                    </p>
                    <p className="text-white/30 text-xs mb-5">
                      Applying UAE legal standards and formatting
                    </p>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-gold-400/60 animate-pulse"
                          style={{ animationDelay: `${i * 200}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Document content */
                  <div className="p-6 sm:p-8">
                    <div className="prose-legal text-sm">
                      <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                      {isGenerating && (
                        <span className="inline-block w-0.5 h-4 bg-gold-400 ml-0.5 animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              {generatedDoc && (
                <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <Scale className="w-4 h-4 text-gold-400/50 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/35 leading-relaxed">
                    This document is a professional template generated by AI.
                    Review and customize as needed, and have it reviewed by a
                    licensed UAE attorney before official use.
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
