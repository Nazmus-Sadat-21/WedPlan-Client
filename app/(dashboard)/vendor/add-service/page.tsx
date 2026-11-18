import type { Metadata } from "next"

import { AddServiceForm } from "@/components/vendor/AddServiceForm"

export const metadata: Metadata = { title: "Add Service" }

export default function AddServicePage() {
  return <AddServiceForm />
}
