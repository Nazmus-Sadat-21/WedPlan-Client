import type { Metadata } from "next"
import { ProfilePageClient } from "@/components/Shared/ProfilePageClient"

export const metadata: Metadata = {
  title: "Admin Update Profile",
}

export default function AdminProfileSettingsPage() {

 return <ProfilePageClient />
}
