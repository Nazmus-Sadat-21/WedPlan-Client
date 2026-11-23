import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { MongoClient } from "mongodb"
import { mongodbAdapter } from "@better-auth/mongo-adapter"
import { attachDatabasePool } from "@vercel/functions"

/**
 * Fail fast with a clear message instead of a confusing runtime crash deep
 * inside the adapter when the deployment is missing its database URL.
 */
const mongoUri = process.env.MONGO_URI
if (!mongoUri) {
  throw new Error(
    "MONGO_URI is not set. Add it to the environment before starting WedPlan."
  )
}

/**
 * Accept `example.com`, `https://example.com` and `https://example.com/`
 * alike, so a small environment typo cannot break auth in production.
 */
function normalizeOrigin(value?: string | null): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "")
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/**
 * A trailing slash here would make the JWT issuer (`.../`) differ from the
 * issuer the Express API verifies (`...`), rejecting every protected request.
 * Normalise it once and reuse it everywhere.
 *
 * `BETTER_AUTH_URL` is the source of truth. The fallbacks keep preview and
 * fresh deployments working when only platform-provided URLs are available.
 */
const baseURL =
  normalizeOrigin(process.env.BETTER_AUTH_URL) ??
  normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
  normalizeOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null
  ) ??
  "http://localhost:3000"

if (
  process.env.NODE_ENV === "production" &&
  /localhost|127\.0\.0\.1/.test(baseURL)
) {
  console.warn(
    "BETTER_AUTH_URL points at localhost in production. Set it to the deployed site URL so JWTs, CORS and OAuth redirects use the public origin."
  )
}

const extraTrustedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, ""),
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
    : "",
  process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL.replace(/^https?:\/\//, "")}`
    : "",
  ...(process.env.TRUSTED_ORIGINS?.split(",") ?? []).map((origin) =>
    origin.trim().replace(/\/+$/, "")
  ),
].filter(Boolean) as string[]

// Inferred from the real config so `role`, `isBlocked`, etc. reach the client.
type AuthInstance = ReturnType<typeof createAuth>["auth"]

type AuthCache = {
  auth: AuthInstance
  client: MongoClient
  /** Resolves once the client's topology is open; cleared on failure. */
  connecting?: Promise<MongoClient>
}

/**
 * Keep the instance on `globalThis` so a warm serverless function reuses one
 * connection pool instead of opening a new one for every request.
 */
const globalForAuth = globalThis as typeof globalThis & {
  __wedplanAuth?: AuthCache
}

function createAuth() {
  const client = new MongoClient(mongoUri as string , {
    // Fail before Vercel's function timeout so the auth route can return a
    // readable 503 instead of a blank "Internal Server Error".
    // Cold starts resolve SRV records and complete a TLS handshake with Atlas;
    // 5s was tight enough to fail occasionally, which closed the topology.
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
    // Serverless functions scale horizontally; a small pool per instance is
    // plenty and keeps Atlas connection counts under control.
    maxPoolSize: 5,
    // Drop idle sockets before Vercel suspends the instance, so a resumed
    // function does not try to reuse connections Atlas has already dropped.
    maxIdleTimeMS: 10_000,
  })
  // Lets Vercel Fluid compute close idle pool connections before suspending.
  attachDatabasePool(client)
  const db = client.db("WedPlan")

  const auth = betterAuth({
    baseURL,
    // Better Auth rejects state-changing requests from unknown origins. Preview
    // deployments are covered through the Vercel-provided URLs above rather than
    // a wildcard, so another Vercel app cannot act as a trusted origin.
    trustedOrigins: [baseURL, "http://localhost:3000", ...extraTrustedOrigins],
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    database: mongodbAdapter(db, {
      client,
    }),
    // Defence in depth: a public request can only create a customer or vendor,
    // and can never promote itself to admin. Admins are assigned directly in the
    // database, as required by the assignment brief.
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: {
              ...user,
              role: user.role === "vendor" ? "vendor" : "customer",
              isBlocked: false,
              subscriptionPlan: "free",
            },
          }),
        },
        update: {
          before: async (user) => {
            if (
              user.role !== undefined &&
              user.role !== "customer" &&
              user.role !== "vendor"
            ) {
              const sanitized = { ...user }
              delete sanitized.role
              return { data: sanitized }
            }
            return { data: user }
          },
        },
      },
    },
    user: {
      additionalFields: {
        // Role drives dashboards and server authorization. Public sign-up only
        // ever provides "customer" or "vendor"; admins are assigned directly in
        // the database, never through public registration.
        role: {
          type: "string",
          required: false,
          defaultValue: "customer",
          input: true,
        },
        isBlocked: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: false,
        },
        businessName: {
          type: "string",
          required: false,
          input: true,
        },
        subscriptionPlan: {
          type: "string",
          required: false,
          defaultValue: "free",
          input: false,
        },
        subscriptionExpiresAt: {
          type: "date",
          required: false,
          input: false,
        },
      },
    },
    plugins: [
      // Issues short-lived, asymmetric JWTs from the current session. The
      // Express API verifies these tokens against the public JWKS endpoint, so
      // every API call is authenticated independently of the browser cookie.
      jwt({
        jwt: {
          issuer: baseURL,
          audience: "wedplan-api",
          expirationTime: "10m",
          definePayload: ({ user }) => ({
            name: user.name,
            email: user.email,
            role: user.role ?? "customer",
            isBlocked: Boolean(user.isBlocked),
            subscriptionPlan: user.subscriptionPlan ?? "free",
          }),
        },
      }),
    ],
  })

  return { auth, client }
}

/** The Better Auth instance type, used for client-side inference. */
export type Auth = AuthInstance

/**
 * Return the cached auth instance with an open MongoDB connection.
 *
 * The driver connects lazily on the first query. If that connection attempt
 * fails (a slow cold start, a dropped socket after a suspended instance), it
 * closes the topology and every query queued behind it rejects with
 * `MongoTopologyClosedError: Topology is closed` — the intermittent login
 * error seen on Vercel. Connecting explicitly here means Better Auth only ever
 * runs against an open topology, and a failed attempt is retried once with a
 * brand new client instead of surfacing to the user.
 */
export async function getAuth(): Promise<AuthInstance> {
  try {
    return await connectAuth()
  } catch (error) {
    if (!isRecoverableMongoError(error)) throw error
    resetAuth()
    return await connectAuth()
  }
}

async function connectAuth(): Promise<AuthInstance> {
  if (!globalForAuth.__wedplanAuth) {
    globalForAuth.__wedplanAuth = createAuth()
  }
  const cache = globalForAuth.__wedplanAuth

  if (!cache.connecting) {
    cache.connecting = cache.client.connect().catch((error) => {
      // Let the next request try again rather than caching the failure.
      cache.connecting = undefined
      throw error
    })
  }
  await cache.connecting
  return cache.auth
}

/**
 * Throw away the current client so the next call builds a fresh topology.
 * Only called after a failed connection, so no in-flight query is using it.
 */
export function resetAuth(): void {
  const current = globalForAuth.__wedplanAuth
  globalForAuth.__wedplanAuth = undefined

  if (current) {
    // Best effort: the topology may already be gone.
    void current.client.close().catch(() => {})
  }
}

/**
 * Detect database errors that are fixed by recreating the client. Better Auth
 * wraps the driver error in an `APIError` with a `cause`, so walk the chain.
 */
export function isRecoverableMongoError(error: unknown): boolean {
  let current: unknown = error

  for (let depth = 0; current && depth < 6; depth += 1) {
    if (typeof current !== "object") break
    const candidate = current as {
      name?: unknown
      message?: unknown
      cause?: unknown
    }
    const name = String(candidate.name ?? "")
    const message = String(candidate.message ?? "")

    if (
      name === "MongoTopologyClosedError" ||
      name === "MongoNotConnectedError" ||
      name === "MongoServerSelectionError" ||
      name === "MongoNetworkError" ||
      /topology is closed/i.test(message) ||
      /not connected/i.test(message)
    ) {
      return true
    }

    current = candidate.cause
  }

  return false
}
