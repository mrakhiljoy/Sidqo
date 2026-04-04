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

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [
        {
          price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        email: session.user.email,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
