import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
  typescript: true,
});

const PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!;

/**
 * Find existing Stripe customer by email, or create one.
 */
export async function getOrCreateCustomer(
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  const existing = await stripe.customers.list({ email, limit: 1 });

  if (existing.data.length > 0) {
    return existing.data[0];
  }

  return stripe.customers.create({ email, name: name || undefined });
}

/**
 * Check if a user (by email) has an active subscription to Sidqo Pro.
 * Returns the subscription object or null.
 */
export async function getActiveSubscription(
  email: string
): Promise<Stripe.Subscription | null> {
  const customers = await stripe.customers.list({ email, limit: 1 });

  if (customers.data.length === 0) return null;

  const subscriptions = await stripe.subscriptions.list({
    customer: customers.data[0].id,
    status: "active",
    price: PRICE_ID,
    limit: 1,
  });

  return subscriptions.data[0] || null;
}
