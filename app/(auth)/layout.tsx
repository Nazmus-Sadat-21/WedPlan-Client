import { AuthShell } from "@/components/auth/AuthShell"
import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <RedirectIfAuthed />
      <AuthShell>{children}</AuthShell>
    </>
  )
}
