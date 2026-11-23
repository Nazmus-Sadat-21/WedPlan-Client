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
/**
 * Avoid hammering the token endpoint while the visitor is signed out. Keep this
 * short: a cold start or a dropped connection must not lock a signed-in user
 * out of the dashboard for ten seconds.
 */
const SIGNED_OUT_TTL_MS = 2_000

type CachedToken = {
  token: string | null
  expiresAt: number
}

let cachedToken: CachedToken | null = null

function decodeExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const normalized = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=")
    const json = JSON.parse(atob(normalized)) as { exp?: unknown }
    return typeof json.exp === "number" ? json.exp * 1000 : null
  } catch {
    return null
  }
}

function cacheSignedOut(now: number) {
  cachedToken = { token: null, expiresAt: now + SIGNED_OUT_TTL_MS }
}

/** Shared by concurrent callers so a page firing several requests at once
 * (the admin overview loads three) mints one token instead of racing three. */
let inflight: Promise<string | null> | null = null
/** Bumped whenever the cache is cleared, so a stale in-flight request from the
 * previous session can't write its token back into the cache. */
let generation = 0

const TOKEN_RETRY_DELAY_MS = 400

type TokenResult =
  | { kind: "token"; token: string }
  | { kind: "signed-out" }
  | { kind: "unavailable" }

async function requestToken(): Promise<TokenResult> {
  try {
    const response = await fetch(TOKEN_ENDPOINT, {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
    })

    if (!response.ok) {
      // Only a definitive auth rejection means "signed out". A 5xx is a
      // temporary server problem and must not be cached as a missing session.
      return response.status === 401 || response.status === 403
        ? { kind: "signed-out" }
        : { kind: "unavailable" }
    }

    const body = (await response.json().catch(() => null)) as {
      token?: unknown
    } | null
    return typeof body?.token === "string"
      ? { kind: "token", token: body.token }
      : { kind: "signed-out" }
  } catch {
    // Network failure / cold start.
    return { kind: "unavailable" }
  }
}

async function mintToken(): Promise<string | null> {
  const startedIn = generation

  let result = await requestToken()
  if (result.kind === "unavailable") {
    // A cold start on the auth route often fails once and then recovers.
    await new Promise((resolve) => setTimeout(resolve, TOKEN_RETRY_DELAY_MS))
    result = await requestToken()
  }

  // The session changed (sign-in / sign-out) while this request was running.
  if (startedIn !== generation) return null

  const now = Date.now()
  if (result.kind === "token") {
    const expiry = decodeExpiry(result.token)
    cachedToken = {
      token: result.token,
      expiresAt: expiry ? expiry - EXPIRY_SKEW_MS : now + 60_000,
    }
    return result.token
  }

  if (result.kind === "signed-out") cacheSignedOut(now)
  else cachedToken = null
  return null
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

  if (options.forceRefresh) {
    cachedToken = null
  } else if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  if (!inflight) {
    inflight = mintToken().finally(() => {
      inflight = null
    })
  }
  return inflight
}

/**
 * Drop the in-memory token so the next request mints a fresh one. Called
 * automatically by the auth client after sign-in, sign-up, sign-out and
 * profile updates, so a token from the previous account (or a cached
 * "signed out") is never reused.
 */
export function clearAuthToken() {
  cachedToken = null
  inflight = null
  generation += 1
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

  // 401: the token expired, or none was available yet (a stale "signed out"
  // cache right after signing in, or a cold-start failure).
  // 403: the token may carry an old role, e.g. after switching accounts.
  // Retry once with a freshly minted token; if access is really denied the
  // retry returns the same status.
  if (
    (response.status === 401 || response.status === 403) &&
    !init.signal?.aborted
  ) {
    const refreshed = await getAuthToken({ forceRefresh: true })
    if (refreshed && refreshed !== token) {
      response = await send(refreshed)
    }
  }

  return response
}
