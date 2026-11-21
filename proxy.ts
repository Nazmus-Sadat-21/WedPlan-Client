import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { auth } from "./lib/auth"


/** Dashboard subtrees and the single role allowed to open them. */
const ROLE_PREFIXES = [
  { prefix: "/admin", role: "admin" },
  { prefix: "/vendor", role: "vendor" },
  { prefix: "/customer", role: "customer" },
] as const

/**
 * Server-side route guard. Runs before any protected page renders so a visitor
 * can never see another role's dashboard — or any private page — by typing a
 * URL. The Express API still verifies the JWT and the database role for every
 * request; this only prevents rendering the wrong UI.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await auth.api.getSession({ headers: request.headers })
  const user = session?.user

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  // Blocked accounts lose access to every protected feature immediately.
  if (user.isBlocked) {
    return NextResponse.redirect(new URL("/blocked", request.url))
  }

    for (const { prefix, role } of ROLE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (user.role !== role) {
        return NextResponse.redirect(new URL("/unauthorized", request.url))
      }
      break
    }
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
    "/unauthorized"
  ],
}
