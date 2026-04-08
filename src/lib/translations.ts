/**
 * Translation Job Data Layer — Supabase-backed.
 * All functions are async. Call sites must await.
 */

import { supabase } from "@/lib/db";

// ─── Types ───────────────────────────────────────────────────

export type JobStatus =
  | "pending_payment"
  | "paid"
  | "awaiting_vendor"
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
  sourceUrl: string;
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
  sourceStoragePath?: string;
  deliverableStoragePath?: string;
  documents: TranslationDocument[];
  createdAt: string;
  paidAt?: string;
  dispatchedAt?: string;
  completedAt?: string;
  slaBreachAt?: string;
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
export const VENDOR_COST_PER_PAGE_AED = 31.5;

export function calculatePrice(pages: number) {
  const raw = pages * PRICE_PER_PAGE_AED;
  const totalAed = Math.max(raw, MINIMUM_CHARGE_AED);
  return {
    totalAed,
    perPage: PRICE_PER_PAGE_AED,
    pages,
    vendorCost: pages * VENDOR_COST_PER_PAGE_AED,
  };
}

// ─── Row <-> Domain mappers ──────────────────────────────────

type JobRow = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  vendor_id: string | null;
  document_type: string;
  source_language: string;
  target_language: string;
  total_pages: number;
  status: string;
  price_aed: number;
  vendor_payout_aed: number;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  dispatch_channel: string;
  dispatch_message_id: string | null;
  certified_pdf_url: string | null;
  word_doc_url: string | null;
  source_storage_path: string | null;
  deliverable_storage_path: string | null;
  created_at: string;
  paid_at: string | null;
  dispatched_at: string | null;
  completed_at: string | null;
  sla_breach_at: string;
  refund_triggered_at: string | null;
};

type DocRow = {
  id: string;
  job_id: string;
  doc_type: string;
  original_filename: string;
  source_url: string;
  translated_pdf_url: string | null;
  translated_word_url: string | null;
  page_count: number;
  uploaded_at: string;
};

type VendorRow = {
  id: string;
  name: string;
  email: string;
  whatsapp_number: string | null;
  language_pairs: string[];
  moj_cert_number: string;
  active: boolean;
  avg_delivery_hours: number | null;
  jobs_completed: number;
};

function rowToJob(row: JobRow, docs: DocRow[] = []): TranslationJob {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name ?? undefined,
    vendorId: row.vendor_id ?? undefined,
    documentType: row.document_type as DocumentType,
    sourceLanguage: row.source_language,
    targetLanguage: row.target_language,
    totalPages: row.total_pages,
    status: row.status as JobStatus,
    priceAed: Number(row.price_aed),
    vendorPayoutAed: Number(row.vendor_payout_aed),
    stripePaymentIntentId: row.stripe_payment_intent_id ?? undefined,
    stripeCheckoutSessionId: row.stripe_checkout_session_id ?? undefined,
    dispatchChannel: row.dispatch_channel as DispatchChannel,
    dispatchMessageId: row.dispatch_message_id ?? undefined,
    certifiedPdfUrl: row.certified_pdf_url ?? undefined,
    wordDocUrl: row.word_doc_url ?? undefined,
    sourceStoragePath: row.source_storage_path ?? undefined,
    deliverableStoragePath: row.deliverable_storage_path ?? undefined,
    documents: docs.map(rowToDoc),
    createdAt: row.created_at,
    paidAt: row.paid_at ?? undefined,
    dispatchedAt: row.dispatched_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    slaBreachAt: row.sla_breach_at,
    refundTriggeredAt: row.refund_triggered_at ?? undefined,
  };
}

function rowToDoc(row: DocRow): TranslationDocument {
  return {
    id: row.id,
    jobId: row.job_id,
    docType: row.doc_type as TranslationDocument["docType"],
    originalFilename: row.original_filename,
    sourceUrl: row.source_url,
    translatedPdfUrl: row.translated_pdf_url ?? undefined,
    translatedWordUrl: row.translated_word_url ?? undefined,
    pageCount: row.page_count,
    uploadedAt: row.uploaded_at,
  };
}

function rowToVendor(row: VendorRow): Vendor {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    whatsappNumber: row.whatsapp_number ?? undefined,
    languagePairs: row.language_pairs,
    mojCertNumber: row.moj_cert_number,
    active: row.active,
    avgDeliveryHours: row.avg_delivery_hours ?? undefined,
    jobsCompleted: row.jobs_completed,
  };
}

function jobUpdatesToRow(u: Partial<TranslationJob>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (u.userId !== undefined) r.user_id = u.userId;
  if (u.userEmail !== undefined) r.user_email = u.userEmail;
  if (u.userName !== undefined) r.user_name = u.userName;
  if (u.vendorId !== undefined) r.vendor_id = u.vendorId;
  if (u.documentType !== undefined) r.document_type = u.documentType;
  if (u.sourceLanguage !== undefined) r.source_language = u.sourceLanguage;
  if (u.targetLanguage !== undefined) r.target_language = u.targetLanguage;
  if (u.totalPages !== undefined) r.total_pages = u.totalPages;
  if (u.status !== undefined) r.status = u.status;
  if (u.priceAed !== undefined) r.price_aed = u.priceAed;
  if (u.vendorPayoutAed !== undefined) r.vendor_payout_aed = u.vendorPayoutAed;
  if (u.stripePaymentIntentId !== undefined) r.stripe_payment_intent_id = u.stripePaymentIntentId;
  if (u.stripeCheckoutSessionId !== undefined) r.stripe_checkout_session_id = u.stripeCheckoutSessionId;
  if (u.dispatchChannel !== undefined) r.dispatch_channel = u.dispatchChannel;
  if (u.dispatchMessageId !== undefined) r.dispatch_message_id = u.dispatchMessageId;
  if (u.certifiedPdfUrl !== undefined) r.certified_pdf_url = u.certifiedPdfUrl;
  if (u.wordDocUrl !== undefined) r.word_doc_url = u.wordDocUrl;
  if (u.sourceStoragePath !== undefined) r.source_storage_path = u.sourceStoragePath;
  if (u.deliverableStoragePath !== undefined) r.deliverable_storage_path = u.deliverableStoragePath;
  if (u.paidAt !== undefined) r.paid_at = u.paidAt;
  if (u.dispatchedAt !== undefined) r.dispatched_at = u.dispatchedAt;
  if (u.completedAt !== undefined) r.completed_at = u.completedAt;
  if (u.refundTriggeredAt !== undefined) r.refund_triggered_at = u.refundTriggeredAt;
  return r;
}

// ─── Job CRUD ────────────────────────────────────────────────

export async function createJob(
  data: Omit<TranslationJob, "id" | "createdAt" | "slaBreachAt" | "documents">
): Promise<TranslationJob> {
  const slaBreachAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  const insert = {
    ...jobUpdatesToRow(data as Partial<TranslationJob>),
    sla_breach_at: slaBreachAt,
  };
  const { data: row, error } = await supabase
    .from("translation_jobs")
    .insert(insert)
    .select()
    .single();
  if (error || !row) throw new Error(`createJob failed: ${error?.message}`);
  return rowToJob(row as JobRow, []);
}

async function hydrateJob(row: JobRow): Promise<TranslationJob> {
  const { data: docs } = await supabase
    .from("translation_documents")
    .select()
    .eq("job_id", row.id);
  return rowToJob(row, (docs ?? []) as DocRow[]);
}

export async function getJob(id: string): Promise<TranslationJob | undefined> {
  const { data: row } = await supabase
    .from("translation_jobs")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (!row) return undefined;
  return hydrateJob(row as JobRow);
}

export async function getJobByCheckoutSession(
  sessionId: string
): Promise<TranslationJob | undefined> {
  const { data: row } = await supabase
    .from("translation_jobs")
    .select()
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (!row) return undefined;
  return hydrateJob(row as JobRow);
}

export async function getJobsByUser(userEmail: string): Promise<TranslationJob[]> {
  const { data: rows } = await supabase
    .from("translation_jobs")
    .select()
    .eq("user_email", userEmail)
    .order("created_at", { ascending: false });
  if (!rows) return [];
  return Promise.all((rows as JobRow[]).map(hydrateJob));
}

export async function getAllJobs(): Promise<TranslationJob[]> {
  const { data: rows } = await supabase
    .from("translation_jobs")
    .select()
    .order("created_at", { ascending: false });
  if (!rows) return [];
  return Promise.all((rows as JobRow[]).map(hydrateJob));
}

export async function updateJob(
  id: string,
  updates: Partial<TranslationJob>
): Promise<TranslationJob | undefined> {
  const { data: row, error } = await supabase
    .from("translation_jobs")
    .update(jobUpdatesToRow(updates))
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`updateJob failed: ${error.message}`);
  if (!row) return undefined;
  return hydrateJob(row as JobRow);
}

export async function addDocumentToJob(
  jobId: string,
  doc: Omit<TranslationDocument, "id" | "jobId" | "uploadedAt">
): Promise<TranslationDocument | undefined> {
  const { data: row, error } = await supabase
    .from("translation_documents")
    .insert({
      job_id: jobId,
      doc_type: doc.docType,
      original_filename: doc.originalFilename,
      source_url: doc.sourceUrl,
      translated_pdf_url: doc.translatedPdfUrl ?? null,
      translated_word_url: doc.translatedWordUrl ?? null,
      page_count: doc.pageCount,
    })
    .select()
    .single();
  if (error || !row) return undefined;
  return rowToDoc(row as DocRow);
}

// ─── Vendor CRUD ─────────────────────────────────────────────

export async function getVendors(): Promise<Vendor[]> {
  const { data } = await supabase.from("vendors").select();
  return ((data ?? []) as VendorRow[]).map(rowToVendor);
}

export async function getActiveVendors(): Promise<Vendor[]> {
  const { data } = await supabase.from("vendors").select().eq("active", true);
  return ((data ?? []) as VendorRow[]).map(rowToVendor);
}

export async function getVendor(id: string): Promise<Vendor | undefined> {
  const { data } = await supabase
    .from("vendors")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (!data) return undefined;
  return rowToVendor(data as VendorRow);
}

export async function createVendor(
  v: Omit<Vendor, "jobsCompleted"> & { jobsCompleted?: number }
): Promise<Vendor> {
  const { data, error } = await supabase
    .from("vendors")
    .insert({
      id: v.id,
      name: v.name,
      email: v.email,
      whatsapp_number: v.whatsappNumber ?? null,
      language_pairs: v.languagePairs,
      moj_cert_number: v.mojCertNumber,
      active: v.active,
      avg_delivery_hours: v.avgDeliveryHours ?? null,
      jobs_completed: v.jobsCompleted ?? 0,
    })
    .select()
    .single();
  if (error || !data) throw new Error(`createVendor failed: ${error?.message}`);
  return rowToVendor(data as VendorRow);
}

export async function assignVendorRoundRobin(): Promise<Vendor | undefined> {
  const active = await getActiveVendors();
  if (active.length === 0) return undefined;

  const { data: rows } = await supabase
    .from("translation_jobs")
    .select("vendor_id, status")
    .in("status", ["dispatched", "confirmed", "in_translation"]);

  const counts = new Map<string, number>();
  for (const r of (rows ?? []) as { vendor_id: string | null }[]) {
    if (r.vendor_id) counts.set(r.vendor_id, (counts.get(r.vendor_id) ?? 0) + 1);
  }
  active.sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0));
  return active[0];
}

// ─── Stats ───────────────────────────────────────────────────

export async function getStats() {
  const allJobs = await getAllJobs();
  const completed = allJobs.filter((j) => j.status === "completed");
  const totalRevenue = completed.reduce((sum, j) => sum + j.priceAed, 0);
  const totalVendorCost = completed.reduce((sum, j) => sum + j.vendorPayoutAed, 0);
  return {
    totalJobs: allJobs.length,
    completedJobs: completed.length,
    activeJobs: allJobs.filter((j) =>
      ["paid", "awaiting_vendor", "dispatched", "confirmed", "in_translation"].includes(j.status)
    ).length,
    totalRevenue,
    totalVendorCost,
    grossMargin: totalRevenue - totalVendorCost,
    avgJobValue: completed.length > 0 ? totalRevenue / completed.length : 0,
  };
}
