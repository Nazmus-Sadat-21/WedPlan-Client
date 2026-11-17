import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "Profile Settings" }

export default function CustomerProfileSettingsPage() {
  return (
    <ComingSoon
      title="Profile Settings"
      description="Update your name, profile photo and account details."
      backHref="/customer"
      backLabel="Back to Overview"
    />
  )
}
