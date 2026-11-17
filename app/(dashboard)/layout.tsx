import { DashboardShell } from "@/components/dashboard/DashboardShell"

/**
 * Separate dashboard layout (sidebar + main content area) per the assignment.
 * Roles: /vendor, /customer, /admin — each subtree is guarded by its own
 * RoleGate so users can never reach another role's dashboard by URL.
 */
export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardShell>{children}</DashboardShell>
}
