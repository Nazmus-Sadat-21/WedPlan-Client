import { Navbar } from "@/components/Shared/Navbar"
import { Footer } from "@/components/Shared/Footer"

/** Public pages share the site chrome; the (auth) group has its own shell. */
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100svh-4rem-1px)]">{children}</main>
      <Footer />
    </>
  )
}
