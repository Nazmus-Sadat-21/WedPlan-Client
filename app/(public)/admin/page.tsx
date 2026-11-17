import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "Admin Dashboard" }

export default function AdminDashboardPage() {
  return (
    <ComingSoon
      title="Admin Dashboard"
      description="User management, service moderation and platform transactions are being prepared — coming in the next build."
      backHref="/browse-services"
      backLabel="Browse Services"
    />
  )
}
