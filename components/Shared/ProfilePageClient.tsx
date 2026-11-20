
"use client"

import { useSession } from "@/lib/auth-client"
import { UpdateProfile } from "@/components/Shared/UpdateProfile"

export function ProfilePageClient() {
  const { data } = useSession()
  return <UpdateProfile data={data} />
}