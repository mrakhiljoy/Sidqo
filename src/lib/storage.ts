/**
 * Supabase Storage helpers.
 * Buckets (create these manually in Supabase dashboard, both PRIVATE):
 *   - translation-sources
 *   - translation-deliverables
 */
import { supabase } from "@/lib/db";
import { randomUUID } from "crypto";

export const SOURCES_BUCKET = "translation-sources";
export const DELIVERABLES_BUCKET = "translation-deliverables";

export async function uploadSourceFile(
  userEmail: string,
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const safeEmail = userEmail.replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${safeEmail}/${randomUUID()}-${safeName}`;
  const { error } = await supabase.storage
    .from(SOURCES_BUCKET)
    .upload(path, buffer, { contentType, upsert: false });
  if (error) throw new Error(`uploadSourceFile failed: ${error.message}`);
  return path;
}

export async function uploadDeliverable(
  jobId: string,
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${jobId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from(DELIVERABLES_BUCKET)
    .upload(path, buffer, { contentType, upsert: false });
  if (error) throw new Error(`uploadDeliverable failed: ${error.message}`);
  return path;
}

export async function getSignedDownloadUrl(
  bucket: string,
  path: string,
  ttlSeconds: number = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, ttlSeconds);
  if (error || !data) {
    console.error(`signed url failed for ${bucket}/${path}:`, error?.message);
    return null;
  }
  return data.signedUrl;
}
