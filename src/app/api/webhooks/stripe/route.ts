import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Log the event — no DB to write to, JWT polling picks up changes
  switch (event.type) {
    case "checkout.session.completed":
      console.log("Checkout completed:", event.data.object.customer);
      break;
    case "customer.subscription.updated":
      console.log("Subscription updated:", event.data.object.id);
      break;
    case "customer.subscription.deleted":
      console.log("Subscription cancelled:", event.data.object.id);
      break;
    case "invoice.payment_failed":
      console.log("Payment failed:", event.data.object.customer);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }

  return NextResponse.json({ received: true });
}
