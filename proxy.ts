import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

/**
 * Lightweight route guard.
 *
 * Earlier this file imported the full Better Auth server (and therefore the
 * MongoDB driver) into the middleware/proxy bundle. Every dashboard request
 * then opened a database connection from the edge of the deployment, which is
 * slow on cold starts and crashed the whole proxy with an opaque
 * "Internal Server Error" whenever Atlas was briefly unreachable.
 *
 * Here we only check that a Better Auth session cookie exists — a cheap,
 * dependency-free operation. The real authorization is still enforced twice:
 *   - `RoleGate` (client) verifies the live session, role and blocked flag.
 *   - The Express API verifies the JWT and re-reads the role from MongoDB for
 *     every protected request, so the cookie alone grants no data access.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url)
    if (pathname !== "/sign-in") {
      signInUrl.searchParams.set("next", pathname)
    }
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/vendor/:path*",
    "/customer/:path*",
    // Private pages: service details, payment success and payment cancel.
    "/browse-services/:id",
    "/payment/success",
    "/payment/cancel",
    "/unauthorized",
  ],
}
