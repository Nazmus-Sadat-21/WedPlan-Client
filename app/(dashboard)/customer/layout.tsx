"use client"

import { RoleGate } from "@/components/dashboard/RoleGate"

export default function CustomerDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <RoleGate role="customer">{children}</RoleGate>
}
