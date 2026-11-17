import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "Admin Profile" }

export default function AdminProfileSettingsPage() {
  return (
    <ComingSoon
      title="Admin Profile Settings"
      description="Update your administrator account details."
      backHref="/admin"
      backLabel="Back to Overview"
    />
  )
}
