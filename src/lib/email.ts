/**
 * Email via Resend.
 * Set RESEND_API_KEY and FROM_EMAIL (verified domain) in env.
 */
import { Resend } from "resend";
import type { TranslationJob, Vendor } from "@/lib/translations";

const apiKey = process.env.RESEND_API_KEY;
const FROM = process.env.FROM_EMAIL || "Sidqo <noreply@sidqo.com>";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const resend = apiKey ? new Resend(apiKey) : null;

function warnIfMissing(): boolean {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — skipping send");
    return true;
  }
  return false;
}

export async function sendVendorAssignment(
  vendor: Vendor,
  job: TranslationJob,
  signedSourceUrl: string | null,
  submitUrl: string
) {
  if (warnIfMissing()) return;
  const slaHours = 72;
  await resend!.emails.send({
    from: FROM,
    to: vendor.email,
    subject: `New translation job — ${job.totalPages} page${job.totalPages > 1 ? "s" : ""} — Job ${job.id.slice(0, 8)}`,
    text: `Hi ${vendor.name},

You have a new certified translation job.

Job ID: ${job.id}
Pages: ${job.totalPages}
Languages: ${job.sourceLanguage} → ${job.targetLanguage}
Deadline: ${slaHours} hours from now (${job.slaBreachAt})
Your payout: AED ${job.vendorPayoutAed.toFixed(2)}

Source file (link expires in 1 hour — download immediately):
${signedSourceUrl || "(file not yet attached — please reply to this email)"}

When ready, submit the translated file here:
${submitUrl}

Thanks,
Sidqo
`,
  });
}

export async function sendCustomerReceipt(job: TranslationJob) {
  if (warnIfMissing()) return;
  await resend!.emails.send({
    from: FROM,
    to: job.userEmail,
    subject: `Your translation order is confirmed — Job ${job.id.slice(0, 8)}`,
    text: `Hi${job.userName ? " " + job.userName : ""},

Thanks for your order. Your certified translation is in progress.

Job ID: ${job.id}
Pages: ${job.totalPages}
Total: AED ${job.priceAed.toFixed(2)}
Expected delivery: within 72 hours

We'll email you the moment it's ready. You can also track progress at https://sidqo.com/documents/my-translations

— Sidqo
`,
  });
}

export async function sendCustomerDelivery(
  job: TranslationJob,
  signedDeliverableUrl: string | null
) {
  if (warnIfMissing()) return;
  await resend!.emails.send({
    from: FROM,
    to: job.userEmail,
    subject: `Your certified translation is ready — Job ${job.id.slice(0, 8)}`,
    text: `Hi${job.userName ? " " + job.userName : ""},

Your certified translation is complete.

Download (link expires in 1 hour):
${signedDeliverableUrl || "https://sidqo.com/documents/my-translations"}

You can always re-download from your translations dashboard:
https://sidqo.com/documents/my-translations

— Sidqo
`,
  });
}

export async function sendAdminAlert(subject: string, body: string) {
  if (warnIfMissing()) return;
  if (ADMIN_EMAILS.length === 0) return;
  await resend!.emails.send({
    from: FROM,
    to: ADMIN_EMAILS,
    subject: `[Sidqo Alert] ${subject}`,
    text: body,
  });
}
