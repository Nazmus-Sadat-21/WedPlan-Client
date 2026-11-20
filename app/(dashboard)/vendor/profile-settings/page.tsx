import type { Metadata } from "next"
import { ProfilePageClient } from "@/components/Shared/ProfilePageClient"

export const metadata: Metadata = {
  title: "Vendor Update Profile",
}


export default function VendorProfileSettingsPage() {
  return <ProfilePageClient />
}
