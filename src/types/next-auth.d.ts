import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      subscriptionStatus?: "active" | "free";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    subscriptionStatus?: "active" | "free";
    subscriptionCheckedAt?: number;
  }
}
