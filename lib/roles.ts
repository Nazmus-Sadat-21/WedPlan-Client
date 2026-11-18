/** Returns the dashboard base path for an authenticated user's role. */
export function dashboardPathForRole(role?: string | null): string {
  switch (role) {
    case "admin":
      return "/admin"
    case "vendor":
      return "/vendor"
    default:
      return "/customer"
  }
}

/** Roles a user may pick during public sign-up. Admin is never an option. */
export const SIGNUP_ROLES = ["customer", "vendor"] as const

export type SignupRole = (typeof SIGNUP_ROLES)[number]

/**
 * Google OAuth cannot carry sign-up form fields through the provider redirect,
 * so the chosen role is kept for one round-trip and applied once the new
 * account comes back to /sign-up.
 */
const PENDING_GOOGLE_ROLE_KEY = "wedplan:pending-google-role"
/** The stashed role is only trusted for one short OAuth round-trip. */
const PENDING_ROLE_MAX_AGE_MS = 10 * 60 * 1000

export function rememberPendingGoogleRole(role: SignupRole) {
  try {
    window.sessionStorage.setItem(
      PENDING_GOOGLE_ROLE_KEY,
      JSON.stringify({ role, at: Date.now() })
    )
  } catch {
    // Storage can be unavailable in private mode; account creation still works.
  }
}

export function readPendingGoogleRole(): SignupRole | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_GOOGLE_ROLE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as { role?: unknown; at?: unknown }
    const fresh =
      typeof parsed.at === "number" &&
      Date.now() - parsed.at <= PENDING_ROLE_MAX_AGE_MS

    if (fresh && (parsed.role === "vendor" || parsed.role === "customer")) {
      return parsed.role
    }

    window.sessionStorage.removeItem(PENDING_GOOGLE_ROLE_KEY)
    return null
  } catch {
    return null
  }
}

export function clearPendingGoogleRole() {
  try {
    window.sessionStorage.removeItem(PENDING_GOOGLE_ROLE_KEY)
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
