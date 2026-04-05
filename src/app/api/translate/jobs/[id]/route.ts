import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getJob, updateJob } from "@/lib/translations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Users can only see their own jobs (admin bypass for now)
  if (job.userEmail !== session.user.email) {
    // In production, check admin role
  }

  return NextResponse.json({ job });
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

  // Sanitize: only allow certain fields to be updated
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

  const job = updateJob(id, sanitized);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}
