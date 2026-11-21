/**
 * Authenticated fetch helper.
 *
 * Every call to the WedPlan API goes through here so the short-lived JWT issued
 * by Better Auth is always attached as an `Authorization: Bearer` header. The
 * Express API verifies that token on the server — it never trusts a user id or
 * role supplied by the browser.
 *
 * The token endpoint (`/api/auth/token`) requires the Better Auth session
 * cookie, so this helper must run in the browser. Server components and route
 * handlers should mint a token with `auth.api.getToken` instead.
 */

const TOKEN_ENDPOINT = "/api/auth/token"
/** Refresh shortly before the token actually expires. */
const EXPIRY_SKEW_MS = 30_000
/** Avoid hammering the token endpoint while the visitor is signed out. */
const SIGNED_OUT_TTL_MS = 10_000

type CachedToken = {
  token: string | null
  expiresAt: number
}

let cachedToken: CachedToken | null = null

function decodeExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = JSON.parse(atob(normalized)) as { exp?: unknown }
    return typeof json.exp === "number" ? json.exp * 1000 : null
  } catch {
    return null
  }
}

/**
 * Returns a JWT for the current session, or `null` when the visitor is signed
 * out. Public endpoints still work without a token; protected endpoints reject
 * the request with 401.
 */
export async function getAuthToken(
  options: { forceRefresh?: boolean } = {}
): Promise<string | null> {
  if (typeof window === "undefined") return null

  const now = Date.now()
  if (!options.forceRefresh && cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token
  }

  try {
    const response = await fetch(TOKEN_ENDPOINT, {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
    })

    if (!response.ok) {
      cachedToken = { token: null, expiresAt: now + SIGNED_OUT_TTL_MS }
      return null
    }

    const body = (await response.json().catch(() => null)) as {
      token?: unknown
    } | null
    const token = typeof body?.token === "string" ? body.token : null

    if (!token) {
      cachedToken = { token: null, expiresAt: now + SIGNED_OUT_TTL_MS }
      return null
    }

    const expiry = decodeExpiry(token)
    cachedToken = {
      token,
      expiresAt: expiry ? expiry - EXPIRY_SKEW_MS : now + 60_000,
    }
    return token
  } catch {
    cachedToken = { token: null, expiresAt: now + SIGNED_OUT_TTL_MS }
    return null
  }
}

/** Drop the in-memory token so the next request mints a fresh one. */
export function clearAuthToken() {
  cachedToken = null
}

/**
 * Drop-in replacement for `fetch` that adds the JWT header and retries once
 * with a refreshed token if the API reports that the first one expired.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const send = (token: string | null) => {
    const headers = new Headers(init.headers)
    if (!headers.has("Accept")) headers.set("Accept", "application/json")
    if (token) headers.set("Authorization", `Bearer ${token}`)

    return fetch(input, {
      ...init,
      headers,
      credentials: init.credentials ?? "include",
    })
  }

  const token = await getAuthToken()
  let response = await send(token)

  if (response.status === 401 && token) {
    const refreshed = await getAuthToken({ forceRefresh: true })
    if (refreshed && refreshed !== token) {
      response = await send(refreshed)
    }
  }

  return response
}
