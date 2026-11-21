import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields, jwtClient } from "better-auth/client/plugins"
import type { auth } from "@/lib/auth"

// Inference keeps the session user type in sync with the server config
// (role, isBlocked, subscriptionPlan, ...) without importing server code.
export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [inferAdditionalFields<typeof auth>(), jwtClient()],
})

export const { signIn, signUp, signOut, updateUser, useSession } = authClient
