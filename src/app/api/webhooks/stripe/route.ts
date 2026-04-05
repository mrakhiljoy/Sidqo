import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  getJobByCheckoutSession,
  updateJob,
  assignVendorRoundRobin,
} from "@/lib/translations";

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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log("Checkout completed:", session.customer);

      // Handle translation payment completion
      if (session.metadata?.type === "translation" && session.metadata?.jobId) {
        const job = getJobByCheckoutSession(session.id);
        if (job) {
          const vendor = assignVendorRoundRobin();
          updateJob(job.id, {
            status: "paid",
            paidAt: new Date().toISOString(),
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : undefined,
            vendorId: vendor?.id,
          });
          console.log(
            `Translation job ${job.id} marked as paid. Vendor: ${vendor?.name || "unassigned"}`
          );
          // TODO: Send email to vendor via SendGrid/Mailgun
        }
      }
      break;
    }
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
