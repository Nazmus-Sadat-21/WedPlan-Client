import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "Profile Settings" }

export default function VendorProfileSettingsPage() {
  return (
    <ComingSoon
      title="Vendor Profile Settings"
      description="Update your business profile, contact details and photo — the profile editor is coming in the next build."
      backHref="/vendor"
      backLabel="Back to Dashboard"
    />
  )
}
