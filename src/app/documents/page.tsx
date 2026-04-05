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
const PRICE_PER_PAGE = 45;
const MINIMUM_CHARGE = 69;

const trustBadges = [
  { icon: Award, label: "MOJ Certified" },
  { icon: Clock, label: "24hr Delivery" },
  { icon: Shield, label: "72hr Refund Guarantee" },
  { icon: Gavel, label: "Court Accepted" },
];

const steps = [
  {
    number: "1",
    title: "Upload",
    description:
      "Upload your document (PDF, JPG, PNG) or send a chat response for translation",
    icon: Upload,
  },
  {
    number: "2",
    title: "Pay",
    description:
      "See transparent per-page pricing. Pay securely with Stripe.",
    icon: CreditCard,
  },
  {
    number: "3",
    title: "Receive",
    description:
      "Get certified PDF with official stamps + Word doc within 24 hours",
    icon: FileText,
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
  { icon: Briefcase, label: "Employment Contracts" },
  { icon: Gavel, label: "Court Documents" },
  { icon: AlertCircle, label: "Legal Notices" },
  { icon: Mail, label: "Demand Letters" },
  { icon: BookOpen, label: "Legal Memoranda" },
  { icon: Key, label: "Power of Attorney" },
  { icon: Award, label: "Certificates" },
  { icon: ClipboardList, label: "Government Forms" },
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

/* ─── Page Component ─────────────────────────────── */
export default function TranslatePage() {
  const { data: session } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculatedPrice = Math.max(pageCount * PRICE_PER_PAGE, MINIMUM_CHARGE);

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
    trackEvent("translate_file_uploaded", {
      file_type: f.type,
      file_size: f.size,
    });
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
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCheckout = async () => {
    if (!session) {
      setShowLoginModal(true);
      trackEvent("login_modal_shown", { trigger: "translate_checkout" });
      return;
    }

    setIsCheckingOut(true);
    setError("");
    try {
      const res = await fetch("/api/translate/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pages: pageCount,
          documentType: "uploaded_doc",
          filename: file?.name,
        }),
      });
      const data = await res.json();
      if (data.url) {
        trackEvent("translate_checkout_started", {
          pages: pageCount,
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

  const scrollToUpload = () => {
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
    trackEvent("translate_cta_clicked", { cta: "upload_document" });
  };

  return (
    <div className="min-h-screen bg-navy-800">
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
            priceRange: "AED 79\u2013249",
            availableLanguage: ["English", "Arabic"],
          }),
        }}
      />

      {/* ─── Hero Section ─────────────────────────────── */}
      <section className="relative pt-28 pb-12 border-b border-gold-400/10">
        <div className="absolute inset-0 mesh-bg pattern-overlay" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/20 mb-5">
                <Languages className="w-4 h-4 text-gold-400" />
                <span className="text-sm text-gold-400 font-medium">
                  Certified Legal Translation
                </span>
              </div>
            </Reveal>
            <Reveal delay={1}>
              <h1 className="text-4xl sm:text-5xl font-bold text-warm-white mb-4 leading-tight">
                Certified Legal Translation for UAE Courts &amp; Government
                <span className="gold-text"> — English to Arabic</span>
              </h1>
            </Reveal>
            <Reveal delay={2}>
              <p className="text-lg text-warm-white/60 leading-relaxed mb-8">
                MOJ-certified translators deliver court-accepted Arabic
                translations of your legal documents within 24 hours. Transparent
                pricing at AED 45/page with a full refund guarantee.
              </p>
            </Reveal>
            <Reveal delay={3}>
              <div className="flex flex-wrap gap-4 mb-10">
                <button onClick={scrollToUpload} className="btn-primary flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Document
                </button>
                <Link
                  href="/documents/my-translations"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass glass-hover text-warm-white/80 hover:text-warm-white font-medium transition-all"
                >
                  <FileText className="w-4 h-4" />
                  My Translations
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={4}>
              <div className="flex flex-wrap gap-3">
                {trustBadges.map((badge) => (
                  <div
                    key={badge.label}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-warm-white/60"
                  >
                    <badge.icon className="w-4 h-4 text-gold-400" />
                    {badge.label}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────── */}
      <section className="py-20 border-b border-gold-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-warm-white mb-3">
                How It Works
              </h2>
              <p className="text-warm-white/50 max-w-lg mx-auto">
                Three simple steps to get your certified translation
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-gold-400/0 via-gold-400/30 to-gold-400/0" />
            {steps.map((step, i) => (
              <Reveal key={step.number} delay={i + 1}>
                <div className="glass rounded-2xl p-8 text-center relative">
                  <div className="w-14 h-14 rounded-2xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mx-auto mb-5">
                    <step.icon className="w-6 h-6 text-gold-400" />
                  </div>
                  <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gold-400/20 text-gold-400 text-sm font-bold mb-3">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-warm-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-warm-white/50 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ──────────────────────────── */}
      <section className="py-20 border-b border-gold-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-warm-white mb-3">
                Transparent Pricing
              </h2>
              <p className="text-warm-white/50 max-w-lg mx-auto">
                Simple per-page pricing with no hidden fees
              </p>
            </div>
          </Reveal>

          <div className="max-w-3xl mx-auto">
            <Reveal>
              <div className="glass rounded-2xl p-8 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <div>
                    <div className="text-warm-white/50 text-sm mb-1">
                      Per-page rate
                    </div>
                    <div className="text-4xl font-bold text-warm-white">
                      AED <span className="gold-text">45</span>
                      <span className="text-lg text-warm-white/40 font-normal">
                        /page
                      </span>
                    </div>
                  </div>
                  <div className="glass rounded-xl px-5 py-3 text-center">
                    <div className="text-warm-white/50 text-xs mb-0.5">
                      Minimum charge
                    </div>
                    <div className="text-xl font-bold text-gold-400">
                      AED 69
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left text-warm-white/40 font-medium py-3 pr-4">
                          Document Type
                        </th>
                        <th className="text-left text-warm-white/40 font-medium py-3 pr-4">
                          Typical Size
                        </th>
                        <th className="text-right text-warm-white/40 font-medium py-3">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingTable.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-white/[0.04] last:border-0"
                        >
                          <td className="py-3 pr-4 text-warm-white/80">
                            {row.type}
                          </td>
                          <td className="py-3 pr-4 text-warm-white/50">
                            {row.pages}
                          </td>
                          <td className="py-3 text-right font-medium text-warm-white">
                            {row.price}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>

            <Reveal delay={1}>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gold-400/5 border border-gold-400/15">
                <Shield className="w-5 h-5 text-gold-400 flex-shrink-0" />
                <p className="text-sm text-warm-white/60">
                  <span className="text-gold-400 font-medium">
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

      {/* ─── Upload Section ───────────────────────────── */}
      <section id="upload" className="py-20 border-b border-gold-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-warm-white mb-3">
                Upload Your Document
              </h2>
              <p className="text-warm-white/50 max-w-lg mx-auto">
                Upload your file and get an instant price estimate
              </p>
            </div>
          </Reveal>

          <div className="max-w-2xl mx-auto">
            <Reveal>
              <div className="glass rounded-2xl p-8">
                {!file ? (
                  /* ─── Drop Zone ─── */
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-gold-400 bg-gold-400/10"
                        : "border-white/[0.12] hover:border-gold-400/40 hover:bg-gold-400/5"
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
                    <div className="w-16 h-16 rounded-2xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mx-auto mb-5">
                      <Upload className="w-7 h-7 text-gold-400" />
                    </div>
                    <p className="text-warm-white font-medium mb-2">
                      {isDragging
                        ? "Drop your file here"
                        : "Drag & drop your document here"}
                    </p>
                    <p className="text-sm text-warm-white/40 mb-4">
                      or click to browse files
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-warm-white/30">
                      <span className="flex items-center gap-1.5">
                        <File className="w-3.5 h-3.5" /> PDF
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5" /> JPG
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5" /> PNG
                      </span>
                      <span className="text-warm-white/20">Max 25MB</span>
                    </div>
                  </div>
                ) : (
                  /* ─── File Uploaded State ─── */
                  <div className="space-y-6">
                    {/* File info */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-gold-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warm-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-warm-white/40">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        onClick={removeFile}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <X className="w-4 h-4 text-warm-white/40" />
                      </button>
                    </div>

                    {/* Page count input */}
                    <div>
                      <label className="text-sm text-warm-white/60 mb-2 block">
                        Number of Pages
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            setPageCount((c) => Math.max(1, c - 1))
                          }
                          className="w-10 h-10 rounded-xl glass glass-hover flex items-center justify-center text-warm-white/60 hover:text-warm-white text-lg font-medium"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={pageCount}
                          onChange={(e) =>
                            setPageCount(
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="w-20 text-center glass rounded-xl px-3 py-2.5 text-warm-white font-medium focus:outline-none focus:border-gold-400/50 transition-all"
                        />
                        <button
                          onClick={() => setPageCount((c) => c + 1)}
                          className="w-10 h-10 rounded-xl glass glass-hover flex items-center justify-center text-warm-white/60 hover:text-warm-white text-lg font-medium"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price breakdown */}
                    <div className="glass rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-warm-white/50">
                          Language Pair
                        </span>
                        <span className="text-warm-white font-medium flex items-center gap-2">
                          English <ArrowRight className="w-3.5 h-3.5 text-gold-400" /> Arabic
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-warm-white/50">
                          {pageCount} {pageCount === 1 ? "page" : "pages"} x AED{" "}
                          {PRICE_PER_PAGE}
                        </span>
                        <span className="text-warm-white">
                          AED {pageCount * PRICE_PER_PAGE}
                        </span>
                      </div>
                      {pageCount * PRICE_PER_PAGE < MINIMUM_CHARGE && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-warm-white/50">
                            Minimum charge applies
                          </span>
                          <span className="text-warm-white/40 line-through">
                            AED {pageCount * PRICE_PER_PAGE}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between">
                        <span className="text-warm-white font-medium">
                          Total
                        </span>
                        <span className="text-2xl font-bold gold-text">
                          AED {calculatedPrice}
                        </span>
                      </div>
                    </div>

                    {/* Delivery info */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center gap-2 flex-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <Clock className="w-4 h-4 text-gold-400 flex-shrink-0" />
                        <span className="text-sm text-warm-white/60">
                          Delivery within{" "}
                          <span className="text-warm-white font-medium">
                            24 hours
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <Shield className="w-4 h-4 text-gold-400 flex-shrink-0" />
                        <span className="text-sm text-warm-white/60">
                          Full refund if not in{" "}
                          <span className="text-warm-white font-medium">
                            72 hours
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Checkout CTA */}
                    <button
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                      className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCheckingOut ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Languages className="w-5 h-5" />
                          Get Certified Translation — AED {calculatedPrice}
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mt-4">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-400">{error}</span>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Document Types Section ───────────────────── */}
      <section className="py-20 border-b border-gold-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-warm-white mb-3">
                Supported Document Types
              </h2>
              <p className="text-warm-white/50 max-w-lg mx-auto">
                We translate all types of legal and official documents
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {documentTypes.map((doc, i) => (
              <Reveal key={doc.label} delay={(i % 4) + 1}>
                <div className="glass rounded-xl p-5 text-center glass-hover transition-all">
                  <div className="w-11 h-11 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mx-auto mb-3">
                    <doc.icon className="w-5 h-5 text-gold-400" />
                  </div>
                  <p className="text-sm font-medium text-warm-white/80">
                    {doc.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ──────────────────────────────── */}
      <section className="py-20 border-b border-gold-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-warm-white mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-warm-white/50 max-w-lg mx-auto">
                Everything you need to know about our translation service
              </p>
            </div>
          </Reveal>

          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={Math.min(i + 1, 3)}>
                <div className="glass rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="text-sm font-medium text-warm-white/90 pr-4">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-warm-white/40 flex-shrink-0 transition-transform duration-200 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 -mt-1">
                      <p className="text-sm text-warm-white/50 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={2}>
            <div className="mt-10 text-center">
              <div className="inline-flex items-center gap-3 p-4 rounded-xl glass">
                <FileText className="w-5 h-5 text-gold-400" />
                <p className="text-sm text-warm-white/60">
                  Need to generate a legal document first?{" "}
                  <Link
                    href="/documents/generate"
                    className="text-gold-400 hover:text-gold-300 font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    Use our AI Document Generator
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────── */}
      <Footer />

      {/* ─── Login Modal ──────────────────────────────── */}
      <LoginModal isOpen={showLoginModal} />
    </div>
  );
}
