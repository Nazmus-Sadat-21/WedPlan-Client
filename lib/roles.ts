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
