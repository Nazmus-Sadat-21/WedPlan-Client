
import { NextResponse } from "next/server"
import { toNextJsHandler } from "better-auth/next-js"

import { getAuth } from "@/lib/auth"

export const runtime = "nodejs"

async function handle(
  request: Request,
  method: "GET" | "POST"
): Promise<Response> {
  try {
    // Get the cached Better Auth instance
    const auth = await getAuth()

    // Create the Next.js handler
    const handler = toNextJsHandler(auth)

    return await handler[method](request)
  } catch (error) {
    const path = new URL(request.url).pathname

    console.error(`Auth ${method} ${path} failed:`, error)

    return NextResponse.json(
      {
        message:
          "Authentication is temporarily unavailable. Please try again in a moment.",
        code: "AUTH_UNAVAILABLE",
      },
      { status: 503 }
    )
  }
}

export const GET = (request: Request) => handle(request, "GET")
export const POST = (request: Request) => handle(request, "POST")
