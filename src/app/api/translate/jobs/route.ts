import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getJobsByUser, getAllJobs, createJob } from "@/lib/translations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isAdmin = searchParams.get("admin") === "true";

  // For admin: return all jobs. For users: return only their jobs.
  // In production, add proper admin role checking.
  const jobs = isAdmin ? await getAllJobs() : await getJobsByUser(session.user.email);

  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const job = await createJob({
      userId: session.user.id || session.user.email,
      userEmail: session.user.email,
      userName: session.user.name || undefined,
      documentType: data.documentType || "uploaded_doc",
      sourceLanguage: data.sourceLanguage || "en",
      targetLanguage: data.targetLanguage || "ar",
      totalPages: data.totalPages || 1,
      status: data.status || "pending_payment",
      priceAed: data.priceAed || 0,
      vendorPayoutAed: data.vendorPayoutAed || 0,
      dispatchChannel: data.dispatchChannel || "email",
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
