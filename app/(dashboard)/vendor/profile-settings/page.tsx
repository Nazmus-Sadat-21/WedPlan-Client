import type { Metadata } from "next"

import { ComingSoon } from "@/components/Shared/ComingSoon"

export const metadata: Metadata = { title: "Vendor Profile Settings" }

export default function VendorProfileSettingsPage() {
  return (
    <ComingSoon
      title="Vendor Profile Settings"
      description="Update your business profile, contact details and profile photo."
      backHref="/vendor"
      backLabel="Back to Overview"
    />
  )
}
