"use client"

import { RoleGate } from "@/components/dashboard/RoleGate"

export default function VendorDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <RoleGate role="vendor">{children}</RoleGate>
}
