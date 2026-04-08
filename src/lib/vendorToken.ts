/**
 * HMAC-signed tokens for vendor submission links.
 * Vendors aren't logged-in users — they get a signed URL in their assignment email.
 */
import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.VENDOR_SUBMIT_SECRET || "dev-insecure-secret";

export function signVendorToken(vendorId: string, jobId: string): string {
  return createHmac("sha256", SECRET)
    .update(`${vendorId}:${jobId}`)
    .digest("hex");
}

export function verifyVendorToken(
  vendorId: string,
  jobId: string,
  token: string
): boolean {
  const expected = signVendorToken(vendorId, jobId);
  if (expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function buildVendorSubmitUrl(vendorId: string, jobId: string): string {
  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://sidqo.com";
  const token = signVendorToken(vendorId, jobId);
  return `${base}/vendor/submit?vendorId=${encodeURIComponent(vendorId)}&jobId=${encodeURIComponent(jobId)}&token=${token}`;
}
