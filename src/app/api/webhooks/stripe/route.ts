import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  getJobByCheckoutSession,
  updateJob,
  assignVendorRoundRobin,
} from "@/lib/translations";
import { getSignedDownloadUrl, SOURCES_BUCKET } from "@/lib/storage";
import {
  sendVendorAssignment,
  sendCustomerReceipt,
  sendAdminAlert,
} from "@/lib/email";
import { buildVendorSubmitUrl } from "@/lib/vendorToken";

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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      if (session.metadata?.type === "translation" && session.metadata?.jobId) {
        const job = await getJobByCheckoutSession(session.id);
        if (!job) {
          console.error(`No job found for checkout session ${session.id}`);
          break;
        }

        const vendor = await assignVendorRoundRobin();
        const status = vendor ? "paid" : "awaiting_vendor";

        const updated = await updateJob(job.id, {
          status,
          paidAt: new Date().toISOString(),
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : undefined,
          vendorId: vendor?.id,
        });

        if (!updated) break;

        try {
          await sendCustomerReceipt(updated);
        } catch (e) {
          console.error("Customer receipt email failed:", e);
        }

        if (vendor) {
          try {
            const signedSourceUrl = updated.sourceStoragePath
              ? await getSignedDownloadUrl(
                  SOURCES_BUCKET,
                  updated.sourceStoragePath,
                  60 * 60
                )
              : null;
            const submitUrl = buildVendorSubmitUrl(vendor.id, updated.id);
            await sendVendorAssignment(vendor, updated, signedSourceUrl, submitUrl);
            console.log(`Job ${updated.id} dispatched to ${vendor.name}`);
          } catch (e) {
            console.error("Vendor assignment email failed:", e);
          }
        } else {
          console.warn(`Job ${updated.id} paid but no vendor available`);
          try {
            await sendAdminAlert(
              "Translation job paid but no vendor available",
              `Job ${updated.id} is paid but assignVendorRoundRobin() returned no vendor. Please assign manually.`
            );
          } catch (e) {
            console.error("Admin alert failed:", e);
          }
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
