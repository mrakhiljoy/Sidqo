import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getActiveSubscription } from "@/lib/stripe";

const SUBSCRIPTION_CACHE_MS = 5 * 60 * 1000; // 5 minutes

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/chat",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign-in
      if (user) {
        token.id = user.id;
        token.subscriptionStatus = "free";
        token.subscriptionCheckedAt = 0;
      }

      // Check Stripe subscription if cache is stale
      const now = Date.now();
      const lastChecked: number = (token.subscriptionCheckedAt as number) || 0;
      const isStale = now - lastChecked > SUBSCRIPTION_CACHE_MS;

      if (isStale && token.email) {
        try {
          const sub = await getActiveSubscription(token.email);
          token.subscriptionStatus = sub ? "active" : "free";
          token.subscriptionCheckedAt = now;
        } catch (err) {
          // If Stripe call fails, keep existing status — don't block the user
          console.error("Stripe subscription check failed:", err);
        }
      }

      // Force refresh on session update trigger (used after checkout)
      if (trigger === "update" && token.email) {
        try {
          const sub = await getActiveSubscription(token.email);
          token.subscriptionStatus = sub ? "active" : "free";
          token.subscriptionCheckedAt = now;
        } catch (err) {
          console.error("Stripe subscription check failed:", err);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id as string;
        session.user.subscriptionStatus =
          (token.subscriptionStatus as "active" | "free") || "free";
      }
      return session;
    },
  },
});
