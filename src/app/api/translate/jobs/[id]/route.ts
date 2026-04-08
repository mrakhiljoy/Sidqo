import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getJob, updateJob } from "@/lib/translations";
import { getSignedDownloadUrl } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const job = await getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.userEmail !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mint a fresh signed URL for the deliverable when completed
  let deliverableUrl: string | null = null;
  if (job.status === "completed" && job.deliverableStoragePath) {
    deliverableUrl = await getSignedDownloadUrl(
      "translation-deliverables",
      job.deliverableStoragePath,
      60 * 60 // 1 hour
    );
  }

  return NextResponse.json({ job, deliverableUrl });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const updates = await req.json();

  const allowed: Record<string, boolean> = {
    status: true,
    vendorId: true,
    certifiedPdfUrl: true,
    wordDocUrl: true,
    dispatchedAt: true,
    completedAt: true,
    dispatchMessageId: true,
  };

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowed[key]) sanitized[key] = value;
  }

  const job = await updateJob(id, sanitized);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}
