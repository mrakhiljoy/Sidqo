import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVendors, createVendor } from "@/lib/translations";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const vendors = await getVendors();
  return NextResponse.json({ vendors });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const data = await req.json();
    if (!data.id || !data.name || !data.email || !data.mojCertNumber) {
      return NextResponse.json(
        { error: "id, name, email, mojCertNumber required" },
        { status: 400 }
      );
    }
    const vendor = await createVendor({
      id: data.id,
      name: data.name,
      email: data.email,
      whatsappNumber: data.whatsappNumber,
      languagePairs: data.languagePairs || ["en-ar"],
      mojCertNumber: data.mojCertNumber,
      active: data.active !== false,
      avgDeliveryHours: data.avgDeliveryHours,
    });
    return NextResponse.json({ vendor }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
