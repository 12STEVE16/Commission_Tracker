// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorized(.*)",
  "/api/webhook(.*)", // singular “webhook” routes are public
  "/api/webhooks(.*)", // include this if you ever use the plural
]);

interface PublicMetadata {
  role?: string;
}

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  const url = req.nextUrl.pathname;

  // If not signed in and not a public route, redirect to sign-in
  if (!userId && !isPublicRoute(req)) {
    return redirectToSignIn();
  }

  // If signed in, enforce role-based access
  if (userId) {
    const metadata = sessionClaims?.metadata as PublicMetadata;
    const role = metadata?.role;

    if (url.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (url.startsWith("/dashboard") && role !== "partner") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (url === "/") {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      if (role === "partner") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // everything except static files and assets
    "/((?!.*\\..*|_next).*)",
    // root
    "/",
    // all API routes
    "/api/:path*",
    // TRPC if you use it
    "/trpc/:path*",
  ],
};
