import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob, getVendor } from "@/lib/translations";
import { verifyVendorToken } from "@/lib/vendorToken";
import {
  uploadDeliverable,
  getSignedDownloadUrl,
  DELIVERABLES_BUCKET,
} from "@/lib/storage";
import { sendCustomerDelivery } from "@/lib/email";

export const runtime = "nodejs";

// NOTE: This endpoint is accessed via HMAC token — NOT via user session.
// The middleware matcher must EXCLUDE this path. (We use /api/translate/vendor/*)
// If middleware still protects /api/translate/*, this would 401 for vendors.

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const vendorId = String(form.get("vendorId") || "");
    const jobId = String(form.get("jobId") || "");
    const token = String(form.get("token") || "");
    const file = form.get("file");

    if (!vendorId || !jobId || !token) {
      return NextResponse.json(
        { error: "Missing vendorId, jobId, or token" },
        { status: 400 }
      );
    }
    if (!verifyVendorToken(vendorId, jobId, token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (job.vendorId !== vendorId) {
      return NextResponse.json(
        { error: "Job not assigned to this vendor" },
        { status: 403 }
      );
    }

    const vendor = await getVendor(vendorId);
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = await uploadDeliverable(
      jobId,
      file.name,
      buffer,
      file.type || "application/octet-stream"
    );

    const updated = await updateJob(jobId, {
      status: "completed",
      completedAt: new Date().toISOString(),
      deliverableStoragePath: storagePath,
    });

    if (updated) {
      try {
        const signedUrl = await getSignedDownloadUrl(
          DELIVERABLES_BUCKET,
          storagePath,
          60 * 60
        );
        await sendCustomerDelivery(updated, signedUrl);
      } catch (e) {
        console.error("Customer delivery email failed:", e);
      }
    }

    return NextResponse.json({ success: true, jobId });
  } catch (err) {
    console.error("Vendor submit error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
