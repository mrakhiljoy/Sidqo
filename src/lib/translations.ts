/**
 * Translation Job Data Layer
 *
 * In-memory store for MVP. Swap this module for Supabase/Postgres
 * when ready — the interface stays the same.
 *
 * Data model follows the PRD v2.0 schema:
 *   translation_jobs + translation_documents (1:many)
 */

import { randomUUID } from "crypto";

// ─── Types ───────────────────────────────────────────────────

export type JobStatus =
  | "pending_payment"
  | "paid"
  | "dispatched"
  | "confirmed"
  | "in_translation"
  | "completed"
  | "refunded"
  | "cancelled";

export type DocumentType = "chat_response" | "memo" | "uploaded_doc";
export type DispatchChannel = "email" | "whatsapp";

export interface TranslationDocument {
  id: string;
  jobId: string;
  docType: "memo" | "supporting_evidence" | "uploaded_primary";
  originalFilename: string;
  sourceUrl: string; // In production: S3 pre-signed URL
  translatedPdfUrl?: string;
  translatedWordUrl?: string;
  pageCount: number;
  uploadedAt: string;
}

export interface TranslationJob {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  vendorId?: string;
  documentType: DocumentType;
  sourceLanguage: string;
  targetLanguage: string;
  totalPages: number;
  status: JobStatus;
  priceAed: number;
  vendorPayoutAed: number;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  dispatchChannel: DispatchChannel;
  dispatchMessageId?: string;
  certifiedPdfUrl?: string;
  wordDocUrl?: string;
  documents: TranslationDocument[];
  createdAt: string;
  paidAt?: string;
  dispatchedAt?: string;
  completedAt?: string;
  slaBreachAt?: string; // auto: createdAt + 72hrs
  refundTriggeredAt?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  whatsappNumber?: string;
  languagePairs: string[];
  mojCertNumber: string;
  active: boolean;
  avgDeliveryHours?: number;
  jobsCompleted: number;
}

// ─── Pricing ─────────────────────────────────────────────────

export const PRICE_PER_PAGE_AED = 45;
export const MINIMUM_CHARGE_AED = 69;
export const VENDOR_COST_PER_PAGE_AED = 31.5; // AED 30 + 5% VAT

export function calculatePrice(pages: number): {
  totalAed: number;
  perPage: number;
  pages: number;
  vendorCost: number;
} {
  const raw = pages * PRICE_PER_PAGE_AED;
  const totalAed = Math.max(raw, MINIMUM_CHARGE_AED);
  return {
    totalAed,
    perPage: PRICE_PER_PAGE_AED,
    pages,
    vendorCost: pages * VENDOR_COST_PER_PAGE_AED,
  };
}

// ─── In-Memory Store ─────────────────────────────────────────
// Replace with database calls when migrating to Supabase.

const jobs = new Map<string, TranslationJob>();
const vendors = new Map<string, Vendor>();

// Seed default vendors from PRD
vendors.set("vendor-1", {
  id: "vendor-1",
  name: "Vendor 1",
  email: "vendor1@example.com",
  languagePairs: ["en-ar"],
  mojCertNumber: "MOJ-001",
  active: true,
  jobsCompleted: 0,
});
vendors.set("vendor-2", {
  id: "vendor-2",
  name: "Vendor 2",
  email: "vendor2@example.com",
  languagePairs: ["en-ar"],
  mojCertNumber: "MOJ-002",
  active: true,
  jobsCompleted: 0,
});

// ─── Job CRUD ────────────────────────────────────────────────

export function createJob(
  data: Omit<TranslationJob, "id" | "createdAt" | "slaBreachAt" | "documents">
): TranslationJob {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const slaBreachAt = new Date(
    Date.now() + 72 * 60 * 60 * 1000
  ).toISOString();

  const job: TranslationJob = {
    ...data,
    id,
    createdAt,
    slaBreachAt,
    documents: [],
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): TranslationJob | undefined {
  return jobs.get(id);
}

export function getJobByCheckoutSession(
  sessionId: string
): TranslationJob | undefined {
  for (const job of jobs.values()) {
    if (job.stripeCheckoutSessionId === sessionId) return job;
  }
  return undefined;
}

export function getJobsByUser(userEmail: string): TranslationJob[] {
  return Array.from(jobs.values())
    .filter((j) => j.userEmail === userEmail)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getAllJobs(): TranslationJob[] {
  return Array.from(jobs.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateJob(
  id: string,
  updates: Partial<TranslationJob>
): TranslationJob | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;
  const updated = { ...job, ...updates };
  jobs.set(id, updated);
  return updated;
}

export function addDocumentToJob(
  jobId: string,
  doc: Omit<TranslationDocument, "id" | "jobId" | "uploadedAt">
): TranslationDocument | undefined {
  const job = jobs.get(jobId);
  if (!job) return undefined;

  const document: TranslationDocument = {
    ...doc,
    id: randomUUID(),
    jobId,
    uploadedAt: new Date().toISOString(),
  };
  job.documents.push(document);
  jobs.set(jobId, job);
  return document;
}

// ─── Vendor CRUD ─────────────────────────────────────────────

export function getVendors(): Vendor[] {
  return Array.from(vendors.values());
}

export function getActiveVendors(): Vendor[] {
  return Array.from(vendors.values()).filter((v) => v.active);
}

export function getVendor(id: string): Vendor | undefined {
  return vendors.get(id);
}

export function assignVendorRoundRobin(): Vendor | undefined {
  const active = getActiveVendors();
  if (active.length === 0) return undefined;
  // Simple round-robin: pick vendor with fewest active jobs
  const jobCounts = new Map<string, number>();
  for (const job of jobs.values()) {
    if (
      job.vendorId &&
      ["dispatched", "confirmed", "in_translation"].includes(job.status)
    ) {
      jobCounts.set(job.vendorId, (jobCounts.get(job.vendorId) || 0) + 1);
    }
  }
  active.sort(
    (a, b) => (jobCounts.get(a.id) || 0) - (jobCounts.get(b.id) || 0)
  );
  return active[0];
}

// ─── Stats ───────────────────────────────────────────────────

export function getStats() {
  const allJobs = getAllJobs();
  const completed = allJobs.filter((j) => j.status === "completed");
  const totalRevenue = completed.reduce((sum, j) => sum + j.priceAed, 0);
  const totalVendorCost = completed.reduce(
    (sum, j) => sum + j.vendorPayoutAed,
    0
  );

  return {
    totalJobs: allJobs.length,
    completedJobs: completed.length,
    activeJobs: allJobs.filter((j) =>
      ["paid", "dispatched", "confirmed", "in_translation"].includes(j.status)
    ).length,
    totalRevenue,
    totalVendorCost,
    grossMargin: totalRevenue - totalVendorCost,
    avgJobValue:
      completed.length > 0 ? totalRevenue / completed.length : 0,
  };
}
