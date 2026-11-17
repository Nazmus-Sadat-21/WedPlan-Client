"use client"

import { RoleGate } from "@/components/dashboard/RoleGate"

export default function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <RoleGate role="admin">{children}</RoleGate>
}
