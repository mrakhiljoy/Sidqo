"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import {
  FileText,
  Download,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  Scale,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";

const documentTypes = [
  {
    id: "demand-letter",
    icon: "✉️",
    title: "Legal Demand Letter",
    desc: "Formal demand for payment, action, or cessation of activity",
    examples: ["Salary demand", "Rent refund", "Debt recovery"],
  },
  {
    id: "legal-memo",
    icon: "📋",
    title: "Legal Memorandum",
    desc: "Detailed legal analysis memo for court or negotiation",
    examples: ["Case analysis", "Rights summary", "Legal opinion"],
  },
  {
    id: "noc",
    icon: "📄",
    title: "No Objection Certificate",
    desc: "Official NOC letter for various purposes in UAE",
    examples: ["Visa NOC", "Employment NOC", "Bank NOC"],
  },
  {
    id: "complaint",
    icon: "⚖️",
    title: "Official Complaint",
    desc: "Formal complaint to regulatory bodies like MOHRE, RERA, police",
    examples: ["Labour complaint", "Tenancy complaint", "Police report"],
  },
  {
    id: "contract",
    icon: "🤝",
    title: "Contract / Agreement",
    desc: "Professional contracts following UAE legal standards",
    examples: ["Service agreement", "Employment contract", "Sale agreement"],
  },
  {
    id: "affidavit",
    icon: "🏛️",
    title: "Affidavit / Declaration",
    desc: "Sworn statements and statutory declarations",
    examples: ["Witness statement", "Declaration of facts", "Statutory declaration"],
  },
  {
    id: "termination",
    icon: "🚫",
    title: "Termination Letter",
    desc: "Employment or contract termination with UAE legal compliance",
    examples: ["Employee termination", "Contract termination", "Lease termination"],
  },
  {
    id: "power-of-attorney",
    icon: "🔑",
    title: "Power of Attorney",
    desc: "UAE-compliant POA for legal representation",
    examples: ["General POA", "Special POA", "Property POA"],
  },
];

export default function DocumentsPage() {
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

  const generateDocument = async () => {
    if (!selectedType || !details.trim()) {
      setError("Please select a document type and provide details.");
      return;
    }
    if (!session) {
      setShowLoginModal(true);
      return;
    }
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
      setError("Failed to generate document. Please check your API key and try again.");
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
    const docTitle = documentTypes.find((d) => d.id === selectedType)?.title || "legal-document";
    a.download = `sidqo-${docTitle.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedDocType = documentTypes.find((d) => d.id === selectedType);

  return (
    <div className="min-h-screen bg-navy-800">
      {/* Hero */}
      <section className="relative pt-28 pb-12 border-b border-gold-400/10">
        <div className="absolute inset-0 mesh-bg pattern-overlay" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/20 mb-5">
              <FileText className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-gold-400 font-medium">AI Legal Document Generator</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-warm-white mb-4">
              Generate Professional
              <span className="gold-text"> UAE Legal Documents</span>
            </h1>
            <p className="text-lg text-warm-white/60 leading-relaxed">
              Create legally sound documents following UAE standards instantly. Demand letters, contracts, NOCs, affidavits, and more — ready in seconds.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Document type selection */}
            <div>
              <h2 className="text-lg font-semibold text-warm-white mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gold-400/20 text-gold-400 text-sm font-bold flex items-center justify-center">1</span>
                Select Document Type
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documentTypes.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedType(doc.id)}
                    className={`glass glass-hover rounded-xl p-4 text-left transition-all ${
                      selectedType === doc.id
                        ? "border-gold-400/60 bg-gold-400/10 gold-glow"
                        : "border-gold-400/15"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{doc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${selectedType === doc.id ? "text-gold-400" : "text-warm-white"}`}>
                          {doc.title}
                        </div>
                        <div className="text-xs text-warm-white/40 mt-0.5 line-clamp-2">{doc.desc}</div>
                      </div>
                      {selectedType === doc.id && (
                        <Check className="w-4 h-4 text-gold-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Party details */}
            <div>
              <h2 className="text-lg font-semibold text-warm-white mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gold-400/20 text-gold-400 text-sm font-bold flex items-center justify-center">2</span>
                Party Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-warm-white/60 mb-1.5 block">
                    Party 1 / Your Name
                  </label>
                  <input
                    type="text"
                    value={party1}
                    onChange={(e) => setParty1(e.target.value)}
                    placeholder="e.g., Ahmed Mohammed Al-Rashidi"
                    className="w-full glass rounded-xl px-4 py-3 text-sm text-warm-white/90 placeholder-warm-white/25 focus:outline-none focus:border-gold-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm text-warm-white/60 mb-1.5 block">
                    Party 2 / Other Party
                  </label>
                  <input
                    type="text"
                    value={party2}
                    onChange={(e) => setParty2(e.target.value)}
                    placeholder="e.g., ABC Company LLC"
                    className="w-full glass rounded-xl px-4 py-3 text-sm text-warm-white/90 placeholder-warm-white/25 focus:outline-none focus:border-gold-400/50 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Main details */}
            <div>
              <h2 className="text-lg font-semibold text-warm-white mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gold-400/20 text-gold-400 text-sm font-bold flex items-center justify-center">3</span>
                Document Details
                <span className="text-red-400 text-base">*</span>
              </h2>
              {selectedDocType && (
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="text-xs text-warm-white/30">Examples:</span>
                  {selectedDocType.examples.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setDetails((prev) => prev ? `${prev}, ${ex}` : ex)}
                      className="text-xs px-2.5 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400/70 hover:text-gold-400 hover:border-gold-400/40 transition-all"
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
                className="w-full glass rounded-xl px-4 py-3 text-sm text-warm-white/90 placeholder-warm-white/25 focus:outline-none focus:border-gold-400/50 transition-all resize-none"
              />
            </div>

            {/* Additional info */}
            <div>
              <label className="text-sm text-warm-white/60 mb-1.5 block">
                Additional Requirements (optional)
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Any specific clauses, legal references, or formatting requirements..."
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

            <button
              onClick={generateDocument}
              disabled={isGenerating || !selectedType || !details.trim()}
              className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Right: Generated document */}
          <div>
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-warm-white flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-gold-400/20 text-gold-400 text-sm font-bold flex items-center justify-center">4</span>
                  Generated Document
                </h2>
                {generatedDoc && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyDocument}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-warm-white/60 hover:text-warm-white transition-all"
                    >
                      {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                    <button
                      onClick={downloadDocument}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-400/15 hover:bg-gold-400/25 border border-gold-400/30 text-sm text-gold-400 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                )}
              </div>

              <div className="glass rounded-2xl min-h-[500px] max-h-[680px] overflow-y-auto">
                {!generatedDoc && !isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-gold-400/40" />
                    </div>
                    <p className="text-warm-white/30 text-sm">Your generated document will appear here</p>
                    <p className="text-warm-white/20 text-xs mt-2">Fill in the form and click generate</p>
                  </div>
                ) : isGenerating && !generatedDoc ? (
                  <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mb-4">
                      <Scale className="w-8 h-8 text-gold-400 animate-pulse" />
                    </div>
                    <p className="text-gold-400 text-sm font-medium">Drafting your legal document...</p>
                    <p className="text-warm-white/30 text-xs mt-2">Applying UAE legal standards</p>
                    <div className="flex gap-1 mt-4">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-gold-400/50"
                          style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="prose-legal text-sm">
                      <ReactMarkdown>{generatedDoc}</ReactMarkdown>
                      {isGenerating && (
                        <span className="inline-block w-0.5 h-4 bg-gold-400 ml-0.5 animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {generatedDoc && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-gold-400/5 border border-gold-400/15">
                  <Scale className="w-4 h-4 text-gold-400/60 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-warm-white/40">
                    This document is a professional template. Review and customize as needed, and have it reviewed by a licensed UAE attorney before official use.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <LoginModal isOpen={showLoginModal} />
    </div>
  );
}
