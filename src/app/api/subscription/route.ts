import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const refresh = req.nextUrl.searchParams.get("refresh") === "true";

  if (refresh) {
    // Force a fresh check against Stripe
    try {
      const sub = await getActiveSubscription(session.user.email);
      return NextResponse.json({
        status: sub ? "active" : "free",
        email: session.user.email,
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to check subscription" },
        { status: 500 }
      );
    }
  }

  // Return cached status from session
  return NextResponse.json({
    status: session.user.subscriptionStatus || "free",
    email: session.user.email,
  });
}
