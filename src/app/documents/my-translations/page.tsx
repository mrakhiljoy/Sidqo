"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Languages,
  Upload,
  ExternalLink,
} from "lucide-react";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { trackEvent } from "@/components/PostHogProvider";

interface TranslationJob {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  vendorId?: string;
  documentType: "chat_response" | "memo" | "uploaded_doc";
  sourceLanguage: string;
  targetLanguage: string;
  totalPages: number;
  status: string;
  priceAed: number;
  vendorPayoutAed: number;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  dispatchChannel: string;
  certifiedPdfUrl?: string;
  wordDocUrl?: string;
  documents: any[];
  createdAt: string;
  paidAt?: string;
  dispatchedAt?: string;
  completedAt?: string;
  slaBreachAt?: string;
  refundTriggeredAt?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  pending_payment: {
    label: "Pending Payment",
    color: "text-warm-white/50",
    bgColor: "bg-warm-white/5",
    borderColor: "border-warm-white/10",
  },
  paid: {
    label: "Payment Confirmed",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
  },
  dispatched: {
    label: "Dispatched to Translator",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/20",
  },
  confirmed: {
    label: "Translator Confirmed",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/20",
  },
  in_translation: {
    label: "In Translation",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
  },
  completed: {
    label: "Ready to Download",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
  },
  refunded: {
    label: "Refunded",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/20",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-warm-white/40",
    bgColor: "bg-warm-white/5",
    borderColor: "border-warm-white/10",
  },
};

const DOC_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string }
> = {
  uploaded_doc: { label: "Uploaded Document", icon: "📄" },
  memo: { label: "Legal Memo", icon: "📋" },
  chat_response: { label: "Chat Response", icon: "💬" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CountdownTimer({ slaBreachAt }: { slaBreachAt?: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!slaBreachAt) return;

    function update() {
      const now = Date.now();
      const breach = new Date(slaBreachAt!).getTime();
      const diff = breach - now;

      if (diff <= 0) {
        setIsOverdue(true);
        setTimeLeft("Overdue");
        return;
      }

      setIsOverdue(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [slaBreachAt]);

  if (!slaBreachAt) return null;

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-mono ${
        isOverdue ? "text-red-400" : "text-warm-white/50"
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>{timeLeft}</span>
    </div>
  );
}

function isDelayed(job: TranslationJob): boolean {
  if (job.status === "completed" || job.status === "refunded" || job.status === "cancelled") {
    return false;
  }
  if (!job.slaBreachAt) return false;
  return new Date(job.slaBreachAt).getTime() < Date.now();
}

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warm-white/5" />
          <div>
            <div className="h-4 w-32 bg-warm-white/5 rounded mb-2" />
            <div className="h-3 w-24 bg-warm-white/5 rounded" />
          </div>
        </div>
        <div className="h-6 w-28 bg-warm-white/5 rounded-full" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="h-3 w-16 bg-warm-white/5 rounded mb-2" />
            <div className="h-4 w-20 bg-warm-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function JobCard({ job }: { job: TranslationJob }) {
  const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending_payment;
  const docType = DOC_TYPE_CONFIG[job.documentType] || DOC_TYPE_CONFIG.uploaded_doc;
  const delayed = isDelayed(job);

  return (
    <div className="glass rounded-2xl p-6 transition-all hover:border-gold-400/20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center text-lg flex-shrink-0">
            {docType.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-warm-white">
              {docType.label}
            </p>
            <p className="text-xs text-warm-white/40 mt-0.5">
              {formatDate(job.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {delayed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-400/10 border border-orange-400/20 text-orange-400">
              <AlertTriangle className="w-3 h-3" />
              Delayed
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.bgColor} ${status.borderColor} ${status.color}`}
          >
            {job.status === "completed" && (
              <CheckCircle2 className="w-3 h-3" />
            )}
            {status.label}
          </span>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-warm-white/5">
        <div>
          <p className="text-xs text-warm-white/40 mb-1">Pages</p>
          <p className="text-sm font-medium text-warm-white">
            {job.totalPages} {job.totalPages === 1 ? "page" : "pages"}
          </p>
        </div>
        <div>
          <p className="text-xs text-warm-white/40 mb-1">Price</p>
          <p className="text-sm font-medium text-warm-white">
            AED {job.priceAed.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-warm-white/40 mb-1">Languages</p>
          <div className="flex items-center gap-1.5 text-sm font-medium text-warm-white">
            <Languages className="w-3.5 h-3.5 text-gold-400/60" />
            <span>{job.sourceLanguage.toUpperCase()}</span>
            <span className="text-warm-white/30">&rarr;</span>
            <span>{job.targetLanguage.toUpperCase()}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-warm-white/40 mb-1">SLA Timer</p>
          <CountdownTimer slaBreachAt={job.slaBreachAt} />
        </div>
      </div>

      {/* Actions */}
      {job.status === "completed" && (job.certifiedPdfUrl || job.wordDocUrl) && (
        <div className="flex flex-wrap gap-3 pt-4 border-t border-warm-white/5">
          {job.certifiedPdfUrl && (
            <a
              href={job.certifiedPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl"
              onClick={() =>
                trackEvent("translation_download", {
                  job_id: job.id,
                  format: "pdf",
                })
              }
            >
              <Download className="w-4 h-4" />
              Certified PDF
            </a>
          )}
          {job.wordDocUrl && (
            <a
              href={job.wordDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-warm-white/5 hover:bg-warm-white/10 border border-warm-white/10 text-warm-white transition-all"
              onClick={() =>
                trackEvent("translation_download", {
                  job_id: job.id,
                  format: "docx",
                })
              }
            >
              <Download className="w-4 h-4" />
              Word Doc
            </a>
          )}
        </div>
      )}

      {delayed && (
        <div className="pt-4 border-t border-warm-white/5">
          <a
            href="mailto:support@sidqo.com"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-orange-400/10 hover:bg-orange-400/15 border border-orange-400/20 text-orange-400 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      )}
    </div>
  );
}

function MyTranslationsContent() {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isSuccess = searchParams.get("success") === "true";

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/translate/jobs");
      if (!res.ok) {
        if (res.status === 401) {
          setShowLoginModal(true);
          return;
        }
        throw new Error("Failed to fetch translation jobs");
      }
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : data.jobs ?? []);
      trackEvent("translations_viewed", { job_count: Array.isArray(data) ? data.length : (data.jobs?.length ?? 0) });
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      setShowLoginModal(true);
      setLoading(false);
      return;
    }
    fetchJobs();
  }, [session, sessionStatus, fetchJobs]);

  return (
    <div className="min-h-screen bg-navy-800">
      {/* Hero */}
      <section className="relative pt-28 pb-12 border-b border-gold-400/10">
        <div className="absolute inset-0 mesh-bg pattern-overlay" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 text-sm text-warm-white/40 hover:text-gold-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documents
          </Link>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/20 mb-5">
              <FileText className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-gold-400 font-medium">
                My Translations
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-warm-white mb-4">
              Your <span className="gold-text">Translations</span>
            </h1>
            <p className="text-lg text-warm-white/60 leading-relaxed">
              Track the status of your certified translations.{" "}
              <Link
                href="/documents"
                className="text-gold-400 hover:text-gold-400/80 transition-colors underline underline-offset-2"
              >
                Upload new document
              </Link>
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Success banner */}
        {isSuccess && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 mb-8">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-400">
              Payment successful! Your translation job has been submitted.
              You&apos;ll receive your certified translation within 24 hours.
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-8">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={fetchJobs}
                className="text-sm text-red-400/70 hover:text-red-400 underline underline-offset-2 mt-1 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Job list */}
        {!loading && !error && jobs.length > 0 && (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && jobs.length === 0 && session && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-gold-400/30" />
            </div>
            <h3 className="text-xl font-semibold text-warm-white mb-2">
              No translations yet
            </h3>
            <p className="text-sm text-warm-white/40 max-w-md mb-8">
              Once you submit a document for certified translation, your jobs
              will appear here so you can track their progress.
            </p>
            <Link
              href="/documents#upload"
              className="btn-primary flex items-center gap-2 px-6 py-3 text-sm rounded-xl"
            >
              <Upload className="w-4 h-4" />
              Upload a Document
            </Link>
          </div>
        )}
      </div>

      <Footer />
      <LoginModal isOpen={showLoginModal} />
    </div>
  );
}

export default function MyTranslationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-navy-800 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
        </div>
      }
    >
      <MyTranslationsContent />
    </Suspense>
  );
}
