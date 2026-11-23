import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields, jwtClient } from "better-auth/client/plugins"
import type { Auth } from "@/lib/auth"
import { clearAuthToken } from "@/lib/auth-fetch"

/**
 * Resolve the base URL for the browser auth client.
 *
 * `BETTER_AUTH_URL` is a server-only variable: Next.js replaces it with
 * `undefined` in the browser bundle, so using it here silently pointed the
 * client at nothing and broke sign-in on the deployed site.
 *
 * - `NEXT_PUBLIC_APP_URL` is optional and can be set per environment.
 * - In the browser we fall back to the current origin, which is always correct
 *   on localhost and on Vercel (including preview deployments).
 * - During SSR we fall back to the server value so the module stays usable.
 */
const baseURL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
  (typeof window !== "undefined"
    ? window.location.origin
    : process.env.BETTER_AUTH_URL?.replace(/\/+$/, ""))

/** Auth endpoints after which the API token must be re-minted. */
const SESSION_CHANGING_PATHS =
  /\/(sign-in|sign-up|sign-out|update-user|callback)(\/|\?|$)/

// Inference keeps the session user type in sync with the server config
// (role, isBlocked, subscriptionPlan, ...) without importing server code.
export const authClient = createAuthClient({
  ...(baseURL ? { baseURL } : {}),
  plugins: [inferAdditionalFields<Auth>(), jwtClient()],
  fetchOptions: {
    // The API JWT is cached in memory by `authFetch`. Without this, signing
    // out and back in as another account (no page reload) kept sending the
    // previous account's token — e.g. a vendor token to admin endpoints, which
    // the API rejects with "Could not load platform users".
    onSuccess(context) {
      const url = String(context.request.url)
      if (SESSION_CHANGING_PATHS.test(url)) clearAuthToken()
    },
  },
})

export const { signIn, signUp, signOut, updateUser, useSession } = authClient
