import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, getOrCreateCustomer } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const customer = await getOrCreateCustomer(
      session.user.email,
      session.user.name || undefined
    );

    const origin = req.nextUrl.origin;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${origin}/chat`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
