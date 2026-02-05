import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

// GET requests don't need rate limiting (session checks, CSRF tokens, etc.)
export { handler as GET };

// POST requests (login attempts) need rate limiting
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  // Only rate limit credential sign-in attempts
  const url = new URL(request.url);
  const isSignIn =
    url.pathname.endsWith("/signin") ||
    url.pathname.includes("callback/credentials") ||
    url.pathname.includes("callback/staff-credentials");

  if (isSignIn) {
    const clientIp = getClientIp(request);
    const rateLimitKey = `auth:${clientIp}`;

    const result = checkRateLimit(rateLimitKey, AUTH_RATE_LIMIT);

    if (!result.success) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(result.resetAt),
          },
        }
      );
    }
  }

  // Pass through to NextAuth handler with proper context
  return handler(request, context);
}
