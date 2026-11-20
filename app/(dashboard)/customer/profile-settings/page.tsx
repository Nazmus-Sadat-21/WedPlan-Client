import type { Metadata } from "next"
import { ProfilePageClient } from "@/components/Shared/ProfilePageClient"

export const metadata: Metadata = {
  title: "Customer Update Profile",
}


export default function CustomerProfileSettingsPage() {
  return <ProfilePageClient />

}
