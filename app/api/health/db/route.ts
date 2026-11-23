import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Safe connectivity probe for production debugging.
 *
 * It only reports whether the app can reach MongoDB — never the URI, host or
 * error details. Use it after deploying to confirm that Vercel is allowed
 * through the Atlas IP access list.
 */
export async function GET() {
  const uri = process.env.MONGO_URI

  if (!uri) {
    console.error("Database health check: MONGO_URI is not set.")
    return NextResponse.json(
      { database: "unavailable", reason: "MONGO_URI_MISSING" },
      { status: 503 }
    )
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 4_000,
    connectTimeoutMS: 4_000,
  })

  try {
    await client.connect()
    await client.db("WedPlan").command({ ping: 1 })
    return NextResponse.json({ database: "ok" })
  } catch (error) {
    console.error("Database health check failed:", error)
    return NextResponse.json(
      { database: "unavailable", reason: "CONNECTION_FAILED" },
      { status: 503 }
    )
  } finally {
    await client.close().catch(() => {})
  }
}
