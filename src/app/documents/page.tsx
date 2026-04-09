"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Clock,
  Shield,
  Check,
  ChevronRight,
  Languages,
  ArrowRight,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
  Briefcase,
  Scale,
  Gavel,
  Mail,
  BookOpen,
  Key,
  Award,
  ClipboardList,
  ChevronDown,
  File,
  Image,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { trackEvent } from "@/components/PostHogProvider";

/* ─── Scroll Reveal Hook ──────────────────────────── */
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
      { threshold: 0.15 }
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
  const delayClass = delay > 0 ? `reveal-delay-${delay}` : "";
  return (
    <div ref={ref} className={`reveal ${delayClass} ${className}`}>
      {children}
    </div>
  );
}

/* ─── Constants ──────────────────────────────────── */
const PRICE_PER_WORD = 0.15; // AED 0.15 / word
const MINIMUM_CHARGE = 69;   // AED minimum
const PENDING_TRANSLATE_KEY = "sidqo_pending_translate";

function calcPrice(words: number) {
  return Math.max(Math.round(words * PRICE_PER_WORD * 100) / 100, MINIMUM_CHARGE);
}

const stats = [
  { value: "24hr", label: "Delivery", icon: Clock },
  { value: "MOJ", label: "Certified", icon: Award },
  { value: "100%", label: "Court Accepted", icon: Gavel },
  { value: "72hr", label: "Refund Guarantee", icon: Shield },
];

const steps = [
  {
    number: "01",
    title: "Upload Your Document",
    description:
      "Upload your document (PDF, JPG, PNG) or send a chat response for translation.",
    icon: Upload,
    color: "from-gold-400/20 to-gold-400/5",
  },
  {
    number: "02",
    title: "Transparent Payment",
    description:
      "See per-page pricing instantly. Pay securely with Stripe checkout.",
    icon: CreditCard,
    color: "from-teal-400/20 to-teal-400/5",
  },
  {
    number: "03",
    title: "Receive Certified PDF",
    description:
      "Get your certified PDF with official stamps + Word doc within 24 hours.",
    icon: FileText,
    color: "from-gold-400/20 to-gold-400/5",
  },
];

const pricingTable = [
  { type: "AI Chat Response", pages: "1-2 pages", price: "AED 69" },
  { type: "Legal Memorandum", pages: "2-4 pages", price: "AED 90-180" },
  { type: "Uploaded Doc (1-3 pg)", pages: "1-3 pages", price: "AED 69-135" },
  { type: "Uploaded Doc (4-10 pg)", pages: "4-10 pages", price: "AED 180-450" },
  { type: "10+ pages", pages: "10+ pages", price: "Custom quote" },
];

const documentTypes = [
  { icon: Briefcase, label: "Employment Contracts", desc: "Offer letters, termination notices" },
  { icon: Gavel, label: "Court Documents", desc: "Judgments, complaints, filings" },
  { icon: AlertCircle, label: "Legal Notices", desc: "Cease & desist, notifications" },
  { icon: Mail, label: "Demand Letters", desc: "Payment demands, breach notices" },
  { icon: BookOpen, label: "Legal Memoranda", desc: "Analysis, legal opinions" },
  { icon: Key, label: "Power of Attorney", desc: "General & special POAs" },
  { icon: Award, label: "Certificates", desc: "Degrees, licenses, attestations" },
  { icon: ClipboardList, label: "Government Forms", desc: "Visa, labor, ministry docs" },
];

const faqs = [
  {
    q: "Is the translation accepted by UAE courts?",
    a: "Yes. All translations are completed by MOJ-certified translators and are accepted by UAE courts, government bodies, and all federal and local authorities.",
  },
  {
    q: "How long does it take?",
    a: "Standard delivery is within 24 hours. If we fail to deliver within 72 hours, you receive a full refund — no questions asked.",
  },
  {
    q: "What languages do you support?",
    a: "Currently we support English to Arabic certified legal translation. Additional language pairs are coming soon.",
  },
  {
    q: "What file formats do you accept?",
    a: "We accept PDF, JPG, and PNG files up to 25MB. For best results, ensure your document is clear and legible.",
  },
  {
    q: "What if there's a quality issue?",
    a: "We stand behind our work. If there is any quality concern, we provide a free re-translation at no additional cost.",
  },
];

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/* ─── FAQ Item Component ─────────────────────────── */
function FaqItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: { q: string; a: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${
        isOpen
          ? "bg-white/[0.04] border-gold-400/20"
          : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="text-[15px] font-medium text-warm-white/90 pr-4 leading-relaxed">
          {faq.q}
        </span>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            isOpen ? "bg-gold-400/20 rotate-180" : "bg-white/[0.06]"
          }`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-colors duration-300 ${
              isOpen ? "text-gold-400" : "text-warm-white/40"
            }`}
          />
        </div>
      </button>
      <div
        style={{ maxHeight: height }}
        className="overflow-hidden transition-all duration-300 ease-out"
      >
        <div ref={contentRef} className="px-5 sm:px-6 pb-5 sm:pb-6">
          <p className="text-sm text-warm-white/50 leading-relaxed">
            {faq.a}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Page Component ─────────────────────────────── */
export default function TranslatePage() {
  const { data: session } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [wordCount, setWordCount] = useState(0);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pendingFilename, setPendingFilename] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculatedPrice = calcPrice(wordCount || pageCount * 250);

  // ── Post-login recovery: if user just logged in and had a pending upload ──
  useEffect(() => {
    if (!session) return;
    try {
      const raw = localStorage.getItem(PENDING_TRANSLATE_KEY);
      if (!raw) return;
      const pending = JSON.parse(raw) as {
        filename: string;
        wordCount: number;
        pageCount: number;
        storagePath: string | null;
        ts: number;
      };
      // Expire after 30 min
      if (Date.now() - pending.ts > 30 * 60 * 1000) {
        localStorage.removeItem(PENDING_TRANSLATE_KEY);
        return;
      }
      localStorage.removeItem(PENDING_TRANSLATE_KEY);
      setWordCount(pending.wordCount);
      setPageCount(pending.pageCount);
      setStoragePath(pending.storagePath);
      setPendingFilename(pending.filename);
    } catch {
      // ignore
    }
  }, [session]);

  const analyzeFile = async (f: File) => {
    setIsAnalyzing(true);
    setStoragePath(null);
    try {
      const formData = new FormData();
      formData.append("file", f);
      // Public endpoint — works without login, just extracts word/page count
      const res = await fetch("/api/translate/analyze", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setPageCount(data.pageCount || 1);
        setWordCount(data.wordCount || 0);
      }
    } catch {
      // Fall back: estimate 250 words per page
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Upload file to storage (requires login) — called at checkout time
  const uploadFile = async (f: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) return null;
      const data = await res.json();
      return data.storagePath ?? null;
    } catch {
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFile = (f: File) => {
    setError("");
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Please upload a PDF, JPG, or PNG file.");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError("File size exceeds 25MB limit.");
      return;
    }
    setFile(f);
    setPageCount(1);
    setWordCount(0);
    trackEvent("translate_file_uploaded", {
      file_type: f.type,
      file_size: f.size,
    });
    analyzeFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = () => {
    setFile(null);
    setPageCount(1);
    setWordCount(0);
    setStoragePath(null);
    setPendingFilename(null);
    setIsAnalyzing(false);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCheckout = async () => {
    const effectiveWordCount = wordCount || pageCount * 250;
    const filename = file?.name || pendingFilename || "";

    if (!session) {
      // Persist analysis state before login redirect so we can recover after
      try {
        localStorage.setItem(
          PENDING_TRANSLATE_KEY,
          JSON.stringify({
            filename,
            wordCount: effectiveWordCount,
            pageCount,
            storagePath,
            ts: Date.now(),
          })
        );
      } catch { /* ignore storage errors */ }
      setShowLoginModal(true);
      trackEvent("login_modal_shown", { trigger: "translate_checkout" });
      return;
    }

    setIsCheckingOut(true);
    setError("");
    try {
      // Upload source file to storage now (requires auth)
      let path = storagePath;
      if (file && !path) {
        path = await uploadFile(file);
        if (path) setStoragePath(path);
      }

      const res = await fetch("/api/translate/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordCount: effectiveWordCount,
          documentType: "uploaded_doc",
          filename,
          storagePath: path,
        }),
      });
      const data = await res.json();
      if (data.url) {
        trackEvent("translate_checkout_started", {
          wordCount: effectiveWordCount,
          price: calculatedPrice,
        });
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout. Please try again.");
      }
    } catch {
      setError("Failed to start checkout. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LegalService",
            name: "Sidqo Translate",
            url: "https://sidqo.com/documents",
            description:
              "Certified legal document translation from English to Arabic, accepted by UAE courts and government bodies.",
            areaServed: "UAE",
            priceRange: "AED 69-450",
            availableLanguage: ["English", "Arabic"],
          }),
        }}
      />

      {/* ─── Hero Section ─────────────────────────────── */}
      <section className="relative pt-28 pb-20 lg:pb-28 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 geo-pattern opacity-40" />
        <div className="absolute top-20 right-[10%] w-[500px] h-[500px] bg-gold-400/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-[20%] w-[400px] h-[400px] bg-teal-400/[0.03] rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Copy */}
            <div className="pt-4">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/20 mb-6">
                  <Languages className="w-4 h-4 text-gold-400" />
                  <span className="text-sm text-gold-400 font-medium">
                    Certified Legal Translation
                  </span>
                </div>
              </Reveal>
              <Reveal delay={1}>
                <h1 className="text-4xl sm:text-5xl lg:text-display-sm font-display font-bold text-white mb-5 leading-tight">
                  Court-Accepted Arabic Translation{" "}
                  <span className="gold-text">in 24 Hours</span>
                </h1>
              </Reveal>
              <Reveal delay={2}>
                <p className="text-lg text-white/50 leading-relaxed mb-8 max-w-lg">
                  MOJ-certified translators deliver court-accepted Arabic
                  translations of your legal documents. Transparent pricing
                  at AED 0.15/word — minimum AED 69.
                </p>
              </Reveal>
              <Reveal delay={3}>
                <div className="flex flex-wrap items-center gap-4 mb-10">
                  <Link
                    href="/documents/my-translations"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 hover:text-white hover:border-white/[0.16] font-medium transition-all duration-200"
                  >
                    <FileText className="w-4 h-4" />
                    My Translations
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </Reveal>

              {/* Stats bar */}
              <Reveal delay={4}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gold-400/10 flex items-center justify-center flex-shrink-0">
                        <stat.icon className="w-4 h-4 text-gold-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white leading-none">
                          {stat.value}
                        </div>
                        <div className="text-[11px] text-white/40 mt-0.5">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right: Upload Widget */}
            <Reveal delay={2}>
              <div id="upload" className="lg:sticky lg:top-28">
                <div className="card-surface p-6 sm:p-8 !rounded-3xl relative overflow-hidden">
                  {/* Subtle glow behind the card */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-gold-400/[0.06] rounded-full blur-[60px]" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-display font-bold text-white">
                        Upload Document
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-white/40">
                        <Shield className="w-3.5 h-3.5 text-gold-400/60" />
                        Secure & Encrypted
                      </div>
                    </div>

                    {/* Post-login recovery banner */}
                    {!file && pendingFilename && (
                      <div className="mb-4 flex items-start gap-3 p-3.5 rounded-xl bg-gold-400/10 border border-gold-400/20">
                        <Check className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90">
                            Welcome back! Re-select your file to continue.
                          </p>
                          <p className="text-xs text-white/50 mt-0.5 truncate">
                            {pendingFilename} — {(wordCount || pageCount * 250).toLocaleString()} words · AED {calculatedPrice}
                          </p>
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} className="text-xs text-gold-400 underline whitespace-nowrap cursor-pointer">
                          Browse
                        </button>
                      </div>
                    )}

                    {!file ? (
                      /* ─── Drop Zone ─── */
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                          isDragging
                            ? "border-gold-400 bg-gold-400/10 scale-[1.01]"
                            : "border-white/[0.1] hover:border-gold-400/40 hover:bg-gold-400/[0.03]"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFile(f);
                          }}
                        />
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400/15 to-gold-400/5 border border-gold-400/20 flex items-center justify-center mx-auto mb-4">
                          <Upload className="w-6 h-6 text-gold-400" />
                        </div>
                        <p className="text-white font-medium mb-1.5">
                          {isDragging
                            ? "Drop your file here"
                            : "Drag & drop your document"}
                        </p>
                        <p className="text-sm text-white/35 mb-5">
                          or click to browse files
                        </p>
                        <div className="flex items-center justify-center gap-3 text-xs text-white/25">
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04]">
                            <File className="w-3 h-3" /> PDF
                          </span>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04]">
                            <Image className="w-3 h-3" /> JPG
                          </span>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04]">
                            <Image className="w-3 h-3" /> PNG
                          </span>
                          <span className="text-white/15">Max 25MB</span>
                        </div>
                      </div>
                    ) : (
                      /* ─── File Uploaded State ─── */
                      <div className="space-y-5">
                        {/* File info */}
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <div className="w-11 h-11 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center flex-shrink-0">
                            {isAnalyzing ? (
                              <Loader2 className="w-5 h-5 text-gold-400 animate-spin" />
                            ) : (
                              <Check className="w-5 h-5 text-gold-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-white/40">
                              {formatFileSize(file.size)}
                              {isAnalyzing && (
                                <span className="ml-2 text-gold-400">
                                  Analyzing...
                                </span>
                              )}
                              {!isAnalyzing && wordCount > 0 && (
                                <span className="ml-2">
                                  {wordCount.toLocaleString()} words
                                </span>
                              )}
                            </p>
                          </div>
                          <button
                            onClick={removeFile}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                            aria-label="Remove file"
                          >
                            <X className="w-4 h-4 text-white/40" />
                          </button>
                        </div>

                        {/* Word count display (pricing unit) */}
                        <div>
                          <label className="text-sm text-white/50 mb-2.5 block">
                            Word Count
                            {!isAnalyzing && wordCount > 0 && (
                              <span className="text-gold-400/60 ml-1.5 text-xs">(auto-detected)</span>
                            )}
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setWordCount((c) => Math.max(50, c - 50))}
                              className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] text-lg font-medium transition-all cursor-pointer"
                              aria-label="Decrease word count"
                            >-</button>
                            <input
                              type="number"
                              min={1}
                              value={wordCount || pageCount * 250}
                              onChange={(e) => setWordCount(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-24 text-center rounded-xl px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] text-white font-medium focus:outline-none focus:border-gold-400/50 transition-all"
                            />
                            <button
                              onClick={() => setWordCount((c) => (c || pageCount * 250) + 50)}
                              className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.08] text-lg font-medium transition-all cursor-pointer"
                              aria-label="Increase word count"
                            >+</button>
                          </div>
                        </div>

                        {/* Price summary */}
                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/40">Language</span>
                            <span className="text-white/80 font-medium flex items-center gap-1.5">
                              English{" "}
                              <ArrowRight className="w-3 h-3 text-gold-400" />{" "}
                              Arabic
                            </span>
                          </div>
                          {wordCount > 0 ? (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/40">
                                {wordCount.toLocaleString()} words × AED {PRICE_PER_WORD}
                              </span>
                              <span className="text-white/80">
                                AED {(wordCount * PRICE_PER_WORD).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/40">
                                {pageCount} {pageCount === 1 ? "page" : "pages"} (~{(pageCount * 250).toLocaleString()} words)
                              </span>
                              <span className="text-white/80">
                                AED {(pageCount * 250 * PRICE_PER_WORD).toFixed(2)}
                              </span>
                            </div>
                          )}
                          {(wordCount || pageCount * 250) * PRICE_PER_WORD < MINIMUM_CHARGE && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/40">Minimum charge applied</span>
                              <span className="text-xs text-gold-400/60">AED 69 min</span>
                            </div>
                          )}
                          <div className="border-t border-white/[0.06] pt-2.5 flex items-center justify-between">
                            <span className="text-white font-semibold">Total</span>
                            <span className="text-2xl font-bold gold-text">
                              AED {calculatedPrice}
                            </span>
                          </div>
                        </div>

                        {/* Delivery badges */}
                        <div className="flex gap-2">
                          <div className="flex items-center gap-2 flex-1 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-xs">
                            <Clock className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
                            <span className="text-white/50">
                              <span className="text-white/80 font-medium">
                                24hr
                              </span>{" "}
                              delivery
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-1 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-xs">
                            <Shield className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
                            <span className="text-white/50">
                              <span className="text-white/80 font-medium">
                                72hr
                              </span>{" "}
                              refund
                            </span>
                          </div>
                        </div>

                        {/* CTA */}
                        <button
                          onClick={handleCheckout}
                          disabled={isCheckingOut || isUploading}
                          className="btn-primary w-full flex items-center justify-center gap-2.5 py-4 text-[15px] !rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" />Uploading file…</>
                          ) : isCheckingOut ? (
                            <><Loader2 className="w-5 h-5 animate-spin" />Processing…</>
                          ) : (
                            <><Languages className="w-5 h-5" />Get Certified Translation — AED {calculatedPrice}</>
                          )}
                        </button>
                      </div>
                    )}

                    {error && (
                      <div
                        className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mt-4"
                        role="alert"
                      >
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-red-400">{error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────── */}
      <section className="py-20 lg:py-28 relative">
        <div className="absolute inset-0 section-gradient" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/50 mb-4">
                <Zap className="w-3 h-3 text-gold-400" />
                Simple Process
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
                How It Works
              </h2>
              <p className="text-white/40 max-w-md mx-auto">
                Three steps to your certified Arabic translation
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-20 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />

            {steps.map((step, i) => (
              <Reveal key={step.number} delay={i + 1}>
                <div className="card-surface !rounded-2xl p-7 text-center relative group">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} border border-white/[0.06] flex items-center justify-center mx-auto mb-5 transition-transform duration-300 group-hover:scale-105`}
                  >
                    <step.icon className="w-6 h-6 text-gold-400" />
                  </div>
                  <div className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-gold-400/10 text-gold-400 text-xs font-bold mb-3 font-display">
                    Step {step.number}
                  </div>
                  <h3 className="text-base font-display font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ──────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/50 mb-4">
                <CreditCard className="w-3 h-3 text-gold-400" />
                Transparent Pricing
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
                Simple Per-Page Pricing
              </h2>
              <p className="text-white/40 max-w-md mx-auto">
                No hidden fees. Pay only for what you need.
              </p>
            </div>
          </Reveal>

          <div className="max-w-3xl mx-auto">
            <Reveal>
              <div className="card-surface !rounded-3xl p-8 sm:p-10 relative overflow-hidden">
                {/* Subtle background accent */}
                <div className="absolute top-0 right-0 w-60 h-60 bg-gold-400/[0.03] rounded-full blur-[80px]" />

                <div className="relative z-10">
                  {/* Price headline */}
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
                    <div>
                      <p className="text-sm text-white/40 mb-2">
                        Per-page rate
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg text-white/50 font-medium">
                          AED
                        </span>
                        <span className="text-5xl font-display font-bold gold-text">
                          45
                        </span>
                        <span className="text-base text-white/30">
                          /page
                        </span>
                      </div>
                    </div>
                    <div className="px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center sm:text-right">
                      <p className="text-xs text-white/40 mb-0.5">
                        Minimum order
                      </p>
                      <p className="text-xl font-display font-bold text-gold-400">
                        AED 69
                      </p>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.06]">
                          <th className="text-left text-xs text-white/30 font-medium py-3 px-2 uppercase tracking-wider">
                            Document Type
                          </th>
                          <th className="text-left text-xs text-white/30 font-medium py-3 px-2 uppercase tracking-wider">
                            Size
                          </th>
                          <th className="text-right text-xs text-white/30 font-medium py-3 px-2 uppercase tracking-wider">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricingTable.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="py-3.5 px-2 text-white/70">
                              {row.type}
                            </td>
                            <td className="py-3.5 px-2 text-white/40">
                              {row.pages}
                            </td>
                            <td className="py-3.5 px-2 text-right font-medium text-white font-display">
                              {row.price}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Guarantee banner */}
            <Reveal delay={1}>
              <div className="mt-6 flex items-center gap-3 p-4 rounded-2xl bg-gold-400/[0.04] border border-gold-400/[0.12]">
                <div className="w-10 h-10 rounded-xl bg-gold-400/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-gold-400" />
                </div>
                <p className="text-sm text-white/50">
                  <span className="text-gold-400 font-semibold">
                    72-hour full refund guarantee.
                  </span>{" "}
                  If we don&apos;t deliver within 72 hours, you get a complete
                  refund — no questions asked.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Document Types Section ───────────────────── */}
      <section className="py-20 lg:py-28 relative">
        <div className="absolute inset-0 section-gradient" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/50 mb-4">
                <FileText className="w-3 h-3 text-gold-400" />
                Full Coverage
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
                Supported Document Types
              </h2>
              <p className="text-white/40 max-w-md mx-auto">
                We translate all types of legal and official documents
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {documentTypes.map((doc, i) => (
              <Reveal key={doc.label} delay={(i % 4) + 1}>
                <div className="card-surface !rounded-2xl p-6 group">
                  <div className="w-11 h-11 rounded-xl bg-gold-400/10 border border-gold-400/[0.15] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105">
                    <doc.icon className="w-5 h-5 text-gold-400" />
                  </div>
                  <h3 className="text-sm font-display font-semibold text-white mb-1">
                    {doc.label}
                  </h3>
                  <p className="text-xs text-white/30 leading-relaxed">
                    {doc.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ──────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/50 mb-4">
                  <Sparkles className="w-3 h-3 text-gold-400" />
                  FAQ
                </div>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
                  Common Questions
                </h2>
                <p className="text-white/40">
                  Everything you need to know about our translation service
                </p>
              </div>
            </Reveal>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <Reveal key={i} delay={Math.min(i + 1, 3)}>
                  <FaqItem
                    faq={faq}
                    isOpen={openFaq === i}
                    onToggle={() =>
                      setOpenFaq(openFaq === i ? null : i)
                    }
                  />
                </Reveal>
              ))}
            </div>

            {/* Cross-sell CTA */}
            <Reveal delay={2}>
              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-3 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-xl bg-gold-400/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-gold-400" />
                  </div>
                  <p className="text-sm text-white/50 text-left">
                    Need to generate a legal document first?{" "}
                    <Link
                      href="/documents/generate"
                      className="text-gold-400 hover:text-gold-300 font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      Use AI Document Generator
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────── */}
      <Footer />

      {/* ─── Login Modal ──────────────────────────────── */}
      <LoginModal isOpen={showLoginModal} />
    </div>
  );
}
