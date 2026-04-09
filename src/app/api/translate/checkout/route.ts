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
    const { wordCount, documentType, filename, storagePath } = await req.json();

    if (!wordCount || wordCount < 1) {
      return NextResponse.json(
        { error: "Invalid word count" },
        { status: 400 }
      );
    }

    const pricing = calculatePrice(wordCount);
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
      totalPages: 1, // kept for schema compatibility; word-count is the billing unit
      totalWords: wordCount,
      status: "pending_payment",
      priceAed: pricing.totalAed,
      vendorPayoutAed: pricing.vendorCost,
      dispatchChannel: "email",
      sourceStoragePath: storagePath ?? null,
    });

    const wordLabel = wordCount.toLocaleString();
    const origin = req.nextUrl.origin;

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "aed",
            product_data: {
              name: `Certified Legal Translation — ${wordLabel} words`,
              description:
                `MOJ-certified English to Arabic translation. Delivered within 24 hours.${filename ? ` File: ${filename}` : ""}`.trim(),
            },
            unit_amount: Math.round(pricing.totalAed * 100), // fils (Stripe AED)
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
        wordCount: String(wordCount),
        documentType: documentType || "uploaded_doc",
      },
    });

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
