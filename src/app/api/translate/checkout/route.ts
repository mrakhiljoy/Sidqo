import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, getOrCreateCustomer } from "@/lib/stripe";
import { calculatePrice, createJob, updateJob } from "@/lib/translations";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pages, documentType, filename, storagePath } = await req.json();

    if (!pages || pages < 1) {
      return NextResponse.json(
        { error: "Invalid page count" },
        { status: 400 }
      );
    }

    const pricing = calculatePrice(pages);
    const customer = await getOrCreateCustomer(
      session.user.email,
      session.user.name || undefined
    );

    // Create job in pending_payment state
    const job = await createJob({
      userId: session.user.id || session.user.email,
      userEmail: session.user.email,
      userName: session.user.name || undefined,
      documentType: documentType || "uploaded_doc",
      sourceLanguage: "en",
      targetLanguage: "ar",
      totalPages: pages,
      status: "pending_payment",
      priceAed: pricing.totalAed,
      vendorPayoutAed: pricing.vendorCost,
      dispatchChannel: "email",
      sourceStoragePath: storagePath,
    });

    const origin = req.nextUrl.origin;

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: {
              name: `Certified Legal Translation — ${pages} page${pages > 1 ? "s" : ""}`,
              description:
                `MOJ-certified English to Arabic translation. Delivered within 24 hours. ${filename ? `File: ${filename}` : ""}`.trim(),
            },
            unit_amount: Math.round(pricing.totalAed * 100), // Stripe expects fils (cents)
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/documents/my-translations?success=true&job=${job.id}`,
      cancel_url: `${origin}/documents?cancelled=true`,
      metadata: {
        type: "translation",
        jobId: job.id,
        email: session.user.email,
        pages: String(pages),
        documentType: documentType || "uploaded_doc",
      },
    });

    // Link checkout session to job
    await updateJob(job.id, { stripeCheckoutSessionId: checkoutSession.id });

    return NextResponse.json({ url: checkoutSession.url, jobId: job.id });
  } catch (error) {
    console.error("Translation checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
