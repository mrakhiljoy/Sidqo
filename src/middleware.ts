import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect API routes (except auth routes and webhooks)
  const protectedPaths = ["/api/chat", "/api/documents", "/api/cases", "/api/translate", "/api/upload"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/api/chat/:path*",
    "/api/documents/:path*",
    "/api/cases/:path*",
    "/api/translate/:path*",
    "/api/upload/:path*",
  ],
};
